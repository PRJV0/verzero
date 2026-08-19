#!/usr/bin/env node
/**
 * COLLAUDO END-TO-END DELL'ACCESSO (SPEC §12.E).
 *
 * Percorre la catena intera con una casella di posta VERA, leggendo le
 * email che arrivano: registrazione → email di conferma → conferma →
 * login con password → uscita → password dimenticata → email di reset →
 * nuova password → accesso. Alla fine riporta l'esito di SPF, DKIM e
 * DMARC letto dalle intestazioni dei messaggi ricevuti: è quello che
 * decide se le email finiranno in posta in arrivo o indesiderata, e si
 * controlla invece di indovinarlo.
 *
 * La casella è temporanea (mail.tm) e serve solo a poter LEGGERE i
 * messaggi: senza una casella accessibile questo collaudo si fermerebbe
 * al primo link da aprire.
 *
 *   node --env-file=.env.local scripts/collaudo-accesso.mjs
 *
 * Alla fine l'utente di prova viene rimosso.
 */

import { createClient } from "@supabase/supabase-js";
import { resolveMx, resolveTxt } from "node:dns/promises";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SITO = process.env.SITO_COLLAUDO ?? "https://verzero.it";

if (!SUPABASE_URL || !ANON || !SERVICE) {
  console.error("Mancano le variabili Supabase in .env.local.");
  process.exit(1);
}

const PASSWORD_PRIMA = "Collaudo!2026";
const PASSWORD_DOPO = "Recuperata!2026";

let superati = 0;
let falliti = 0;
function verifica(descrizione, condizione, dettaglio = "") {
  if (condizione) {
    console.log(`✅ ${descrizione}`);
    superati++;
  } else {
    console.log(`❌ ${descrizione}${dettaglio ? ` — ${dettaglio}` : ""}`);
    falliti++;
  }
  return condizione;
}

const attendi = (ms) => new Promise((r) => setTimeout(r, ms));
const nuovoClient = () =>
  createClient(SUPABASE_URL, ANON, { auth: { persistSession: false } });

/* ------------------------------------------------------------------ */
/* Casella di posta temporanea                                         */
/* ------------------------------------------------------------------ */

const MAIL_API = "https://api.mail.tm";

async function creaCasella() {
  const domini = await (await fetch(`${MAIL_API}/domains`)).json();
  const dominio = (domini["hydra:member"] ?? domini)[0]?.domain;
  if (!dominio) throw new Error("mail.tm non ha restituito domini disponibili");

  const indirizzo = `ver0-collaudo-${Date.now()}@${dominio}`;
  const passwordCasella = "CasellaCollaudo!2026";

  const creazione = await fetch(`${MAIL_API}/accounts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ address: indirizzo, password: passwordCasella }),
  });
  if (!creazione.ok) {
    throw new Error(`creazione casella non riuscita: ${await creazione.text()}`);
  }

  const token = await fetch(`${MAIL_API}/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ address: indirizzo, password: passwordCasella }),
  });
  const { token: jwt } = await token.json();
  return { indirizzo, jwt };
}

/** Aspetta un messaggio il cui oggetto contenga `atteso`. */
async function aspettaEmail(casella, atteso, timeoutMs = 90_000) {
  const scadenza = Date.now() + timeoutMs;
  const visti = new Set();
  while (Date.now() < scadenza) {
    const elenco = await fetch(`${MAIL_API}/messages`, {
      headers: { Authorization: `Bearer ${casella.jwt}` },
    });
    if (elenco.ok) {
      const dati = await elenco.json();
      for (const m of dati["hydra:member"] ?? dati) {
        if (visti.has(m.id)) continue;
        visti.add(m.id);
        if (!(m.subject ?? "").toLowerCase().includes(atteso.toLowerCase())) {
          continue;
        }
        const dettaglio = await (
          await fetch(`${MAIL_API}/messages/${m.id}`, {
            headers: { Authorization: `Bearer ${casella.jwt}` },
          })
        ).json();
        // Il sorgente grezzo serve a leggere la firma DKIM del messaggio.
        let grezzo = "";
        try {
          const sorgente = await fetch(
            `${MAIL_API}/messages/${m.id}/download`,
            { headers: { Authorization: `Bearer ${casella.jwt}` } },
          );
          if (sorgente.ok) grezzo = await sorgente.text();
        } catch {
          /* il sorgente è un di più: se manca si prosegue */
        }
        return { ...dettaglio, grezzo };
      }
    }
    await attendi(3000);
  }
  return null;
}

/** Il primo link verso il nostro dominio dentro il corpo del messaggio. */
function estraiLink(email) {
  const corpo = `${email.html?.join?.("\n") ?? email.html ?? ""}\n${email.text ?? ""}`;
  const trovati = [...corpo.matchAll(/https?:\/\/[^\s"'<>)]+/g)].map((m) => m[0]);
  return (
    trovati.find((u) => u.includes("/auth/callback")) ??
    trovati.find((u) => u.includes("verzero.it")) ??
    null
  );
}

/**
 * Il dominio che ha FIRMATO il messaggio. È il dato che conta davvero:
 * perché DMARC passi, la firma DKIM deve essere del dominio che compare
 * nel mittente — se firmasse il fornitore con un suo dominio, i
 * messaggi resterebbero tecnicamente validi ma non allineati.
 */
function dominioFirmatario(grezzo) {
  if (!grezzo) return null;
  const firma = /DKIM-Signature:([\s\S]*?)\r?\n(?=[A-Za-z-]+:)/i.exec(grezzo);
  if (!firma) return null;
  const testo = firma[1].replace(/\s+/g, " ");
  const d = /\bd=([^;\s]+)/i.exec(testo);
  const s = /\bs=([^;\s]+)/i.exec(testo);
  return { dominio: d?.[1] ?? null, selettore: s?.[1] ?? null };
}

/**
 * L'autenticazione del dominio letta alla fonte, nel DNS. È più
 * affidabile del verdetto di una singola casella: qui si vede se SPF,
 * DKIM e DMARC ESISTONO, e sono loro a decidere dove finiranno i
 * messaggi. Da notare: con Resend lo SPF si controlla sul dominio di
 * ritorno (send.<dominio>), non sul dominio del mittente.
 */
async function autenticazioneDns(dominio) {
  const txt = async (nome) => {
    try {
      return (await resolveTxt(nome)).map((r) => r.join(""));
    } catch {
      return [];
    }
  };
  const [spfMittente, spfRitorno, dkim, dmarc] = await Promise.all([
    txt(dominio),
    txt(`send.${dominio}`),
    txt(`resend._domainkey.${dominio}`),
    txt(`_dmarc.${dominio}`),
  ]);
  let mxRitorno = [];
  try {
    mxRitorno = (await resolveMx(`send.${dominio}`)).map((m) => m.exchange);
  } catch {
    /* nessun dominio di ritorno dedicato */
  }
  return {
    spfMittente: spfMittente.find((r) => r.startsWith("v=spf1")) ?? null,
    spfRitorno: spfRitorno.find((r) => r.startsWith("v=spf1")) ?? null,
    dkim: dkim.find((r) => r.includes("p=")) ?? null,
    dmarc: dmarc.find((r) => r.toLowerCase().startsWith("v=dmarc1")) ?? null,
    mxRitorno,
  };
}

/* ------------------------------------------------------------------ */
/* Il collaudo                                                         */
/* ------------------------------------------------------------------ */

console.log(`\nCollaudo dell'accesso su ${SITO}\n`);

const casella = await creaCasella();
console.log(`Casella di prova: ${casella.indirizzo}\n`);

const admin = createClient(SUPABASE_URL, SERVICE, {
  auth: { persistSession: false },
});
let utenteId = null;

try {
  /* 1. Registrazione — la stessa chiamata che fa il funnel. */
  console.log("— 1. Registrazione —\n");
  const { data: reg, error: erroreReg } = await nuovoClient().auth.signUp({
    email: casella.indirizzo,
    password: PASSWORD_PRIMA,
    options: { emailRedirectTo: `${SITO}/auth/callback` },
  });
  if (!verifica(
    "la registrazione va a buon fine",
    !erroreReg,
    erroreReg ? `${erroreReg.code}: ${erroreReg.message}` : "",
  )) {
    throw new Error("registrazione fallita: il resto della catena non ha senso");
  }
  utenteId = reg.user?.id ?? null;
  verifica(
    "l'account nasce SENZA sessione (l'indirizzo va confermato)",
    !reg.session,
    reg.session ? "sessione aperta: la conferma email è ancora spenta" : "",
  );

  /* 2. Il login non deve funzionare prima della conferma. */
  const { error: primaDellaConferma } = await nuovoClient().auth.signInWithPassword({
    email: casella.indirizzo,
    password: PASSWORD_PRIMA,
  });
  verifica(
    "prima della conferma l'accesso è negato, e con il motivo giusto",
    primaDellaConferma?.code === "email_not_confirmed",
    primaDellaConferma ? primaDellaConferma.code : "accesso riuscito!",
  );

  /* 3. L'email di conferma. */
  console.log("\n— 2. Email di conferma —\n");
  const emailConferma = await aspettaEmail(casella, "conferma");
  if (!verifica("l'email di conferma arriva", !!emailConferma)) {
    throw new Error("nessuna email di conferma ricevuta");
  }
  const mittente = emailConferma.from?.address ?? "";
  verifica(
    `il mittente è noreply@verzero.it (ricevuto: ${mittente})`,
    mittente.toLowerCase() === "noreply@verzero.it",
    mittente,
  );
  verifica(
    "l'oggetto è in italiano",
    /conferma/i.test(emailConferma.subject ?? ""),
    emailConferma.subject,
  );
  const firma = dominioFirmatario(emailConferma.grezzo);
  verifica(
    `il messaggio è firmato DKIM dal dominio del mittente (d=${firma?.dominio ?? "—"})`,
    firma?.dominio === "verzero.it",
    firma ? `firmato da ${firma.dominio}` : "nessuna firma DKIM trovata",
  );

  const linkConferma = estraiLink(emailConferma);
  if (!verifica("l'email contiene il link di conferma", !!linkConferma, linkConferma ?? "")) {
    throw new Error("link di conferma assente");
  }
  console.log(`   link: ${linkConferma.slice(0, 110)}…`);
  verifica(
    "il link punta al dominio di produzione",
    linkConferma.startsWith("https://verzero.it/"),
    linkConferma.slice(0, 60),
  );

  /* 4. Conferma: si apre il link come farebbe una persona. */
  console.log("\n— 3. Conferma e accesso —\n");
  const apertura = await fetch(linkConferma, { redirect: "manual" });
  const destinazione = apertura.headers.get("location") ?? "";
  verifica(
    "aprendo il link si viene portati dentro, non al login con errore",
    apertura.status >= 300 && apertura.status < 400 && !destinazione.includes("error"),
    `${apertura.status} → ${destinazione}`,
  );

  const { data: dopoConferma, error: erroreAccesso } =
    await nuovoClient().auth.signInWithPassword({
      email: casella.indirizzo,
      password: PASSWORD_PRIMA,
    });
  verifica(
    "dopo la conferma l'accesso con password funziona",
    !erroreAccesso && !!dopoConferma?.session,
    erroreAccesso?.message ?? "",
  );

  /* 5. Uscita. */
  const clientUscita = nuovoClient();
  await clientUscita.auth.signInWithPassword({
    email: casella.indirizzo,
    password: PASSWORD_PRIMA,
  });
  const { error: erroreUscita } = await clientUscita.auth.signOut();
  verifica("l'uscita non dà errori", !erroreUscita, erroreUscita?.message ?? "");

  /* 6. Password dimenticata. */
  console.log("\n— 4. Password dimenticata —\n");
  const { error: erroreReset } = await nuovoClient().auth.resetPasswordForEmail(
    casella.indirizzo,
    { redirectTo: `${SITO}/auth/callback?next=/reset-password` },
  );
  verifica("la richiesta di reset viene accettata", !erroreReset, erroreReset?.message ?? "");

  const emailReset = await aspettaEmail(casella, "reimposta");
  if (!verifica("l'email di reset arriva", !!emailReset)) {
    throw new Error("nessuna email di reset ricevuta");
  }
  verifica(
    "anche il reset parte da noreply@verzero.it",
    (emailReset.from?.address ?? "").toLowerCase() === "noreply@verzero.it",
    emailReset.from?.address ?? "",
  );
  const firmaReset = dominioFirmatario(emailReset.grezzo);
  verifica(
    "anche il reset è firmato dal dominio del mittente",
    firmaReset?.dominio === "verzero.it",
    firmaReset?.dominio ?? "nessuna firma",
  );

  const linkReset = estraiLink(emailReset);
  if (!verifica("l'email di reset contiene il link", !!linkReset)) {
    throw new Error("link di reset assente");
  }
  verifica(
    "il link di reset porta alla pagina della nuova password",
    linkReset.includes("next=%2Freset-password") || linkReset.includes("next=/reset-password"),
    linkReset.slice(0, 120),
  );

  /* 7. Nuova password: si usa il token del link, come fa la pagina. */
  console.log("\n— 5. Nuova password —\n");
  const url = new URL(linkReset);
  const tokenHash = url.searchParams.get("token_hash");
  const clientRecupero = nuovoClient();
  if (tokenHash) {
    const { error: erroreOtp } = await clientRecupero.auth.verifyOtp({
      type: "recovery",
      token_hash: tokenHash,
    });
    verifica("il token di recupero è valido", !erroreOtp, erroreOtp?.message ?? "");
  } else {
    // Link in forma PKCE: lo apriamo e seguiamo, come farebbe il browser.
    const risposta = await fetch(linkReset, { redirect: "manual" });
    verifica(
      "il link di recupero porta alla pagina giusta",
      (risposta.headers.get("location") ?? "").includes("reset-password"),
      risposta.headers.get("location") ?? "",
    );
  }

  const { error: erroreCambio } = await clientRecupero.auth.updateUser({
    password: PASSWORD_DOPO,
  });
  verifica("la nuova password viene salvata", !erroreCambio, erroreCambio?.message ?? "");

  const { data: finale, error: erroreFinale } = await nuovoClient().auth.signInWithPassword({
    email: casella.indirizzo,
    password: PASSWORD_DOPO,
  });
  verifica(
    "si entra con la nuova password",
    !erroreFinale && !!finale?.session,
    erroreFinale?.message ?? "",
  );
  const { error: vecchiaAncoraValida } = await nuovoClient().auth.signInWithPassword({
    email: casella.indirizzo,
    password: PASSWORD_PRIMA,
  });
  verifica("la vecchia password non funziona più", !!vecchiaAncoraValida);
} catch (e) {
  console.log(`\n⚠️  Collaudo interrotto: ${e.message}\n`);
} finally {
  if (utenteId) {
    await admin.auth.admin.deleteUser(utenteId);
    console.log(`\nPulizia: utente di prova rimosso.`);
  }
}

/* ------------------------------------------------------------------ */
/* Autenticazione del dominio: è questa a decidere la posta indesiderata */
/* ------------------------------------------------------------------ */

console.log("\n— 6. Autenticazione del dominio (dal DNS) —\n");
const dns = await autenticazioneDns("verzero.it");
verifica(
  "DKIM pubblicato per il selettore Resend",
  !!dns.dkim,
  dns.dkim ? "" : "record resend._domainkey mancante",
);
verifica(
  "SPF sul dominio di ritorno (send.verzero.it)",
  !!dns.spfRitorno && dns.spfRitorno.includes("amazonses.com"),
  dns.spfRitorno ?? "assente",
);
console.log(`   dominio di ritorno → ${dns.mxRitorno.join(", ") || "—"}`);
console.log(`   SPF del dominio principale: ${dns.spfMittente ?? "assente"}`);
console.log(
  `     (non deve includere Resend: lo SPF si verifica sul dominio di ritorno)`,
);
if (dns.dmarc) {
  console.log(`   DMARC: ${dns.dmarc}`);
} else {
  console.log(
    [
      "   DMARC: ASSENTE.",
      "     Non blocca nulla oggi — l'allineamento c'è già via DKIM — ma un",
      "     record anche solo in osservazione migliora la reputazione e i",
      "     grandi provider lo chiedono sempre più spesso. Da aggiungere al",
      "     DNS come TXT su _dmarc.verzero.it:",
      "       v=DMARC1; p=none; rua=mailto:dmarc@verzero.it",
    ].join("\n"),
  );
}

console.log(
  `\nRisultato: ${superati}/${superati + falliti} controlli superati${falliti ? ` — ${falliti} FALLITI` : ""}\n`,
);
process.exit(falliti === 0 ? 0 : 1);
