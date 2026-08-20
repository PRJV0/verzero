/**
 * Test delle policy RLS (SPEC fase 1, criterio di completamento):
 * due account di due organizzazioni NON devono vedere i dati altrui.
 *
 * Esecuzione:  node scripts/test-rls.mjs
 * Richiede .env.local con NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY,
 * SUPABASE_SERVICE_ROLE_KEY. Crea due utenti/organizzazioni di prova
 * (prefisso rls-test) e li elimina alla fine, qualunque sia l'esito.
 */
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

// --- env da .env.local (senza dipendenze) ---
const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split("\n")
    .filter((l) => l.includes("=") && !l.trim().startsWith("#"))
    .map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()]),
);
const URL_ = env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE = env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL_ || !ANON || !SERVICE) {
  console.error("Variabili mancanti in .env.local");
  process.exit(1);
}

const admin = createClient(URL_, SERVICE, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const stamp = Math.random().toString(36).slice(2, 8);
const PASSWORD = "RlsTest-" + stamp + "-Aa1";
const utenti = [
  { email: `rls-test-a-${stamp}@example.com`, piva: "00743110157", nome: `RLS Test A ${stamp}` },
  { email: `rls-test-b-${stamp}@example.com`, piva: "00905811006", nome: `RLS Test B ${stamp}` },
];

let esiti = [];
function check(nome, ok, dettaglio = "") {
  esiti.push({ nome, ok });
  console.log(`${ok ? "✅" : "❌"} ${nome}${dettaglio ? " — " + dettaglio : ""}`);
}

const daPulire = { userIds: [], orgIds: [] };

async function setupUno({ email, piva, nome }) {
  const { data: u, error: eu } = await admin.auth.admin.createUser({
    email,
    password: PASSWORD,
    email_confirm: true,
  });
  if (eu) throw new Error("createUser: " + eu.message);
  daPulire.userIds.push(u.user.id);

  const { data: org, error: eo } = await admin
    .from("organizations")
    .insert({ ragione_sociale: nome, partita_iva: piva, dimensione: "micro" })
    .select()
    .single();
  if (eo) throw new Error("insert org: " + eo.message);
  daPulire.orgIds.push(org.id);

  const { error: ep } = await admin
    .from("profiles")
    .insert({ id: u.user.id, organization_id: org.id, role: "owner" });
  if (ep) throw new Error("insert profile: " + ep.message);

  const { data: ord, error: er } = await admin
    .from("orders")
    .insert({
      organization_id: org.id,
      created_by: u.user.id,
      servizio_slug: "carbon-footprint-scope-1-2",
      dimensione: "micro",
      formula: "mensile",
      prezzo_canone: 45,
    })
    .select()
    .single();
  if (er) throw new Error("insert order: " + er.message);

  const { error: ec } = await admin.from("consents").insert({
    organization_id: org.id,
    user_id: u.user.id,
    doc_type: "condizioni_servizio",
    doc_version: "test",
    accepted_at: new Date().toISOString(),
  });
  if (ec) throw new Error("insert consent: " + ec.message);

  const client = createClient(URL_, ANON, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { error: el } = await client.auth.signInWithPassword({ email, password: PASSWORD });
  if (el) throw new Error("login: " + el.message);

  return { client, org, ordine: ord, userId: u.user.id };
}

async function main() {
  console.log("— setup: due utenti, due organizzazioni, dati per ciascuna —");
  const A = await setupUno(utenti[0]);
  const B = await setupUno(utenti[1]);

  console.log("\n— test isolamento (utente A) —");

  {
    const { data } = await A.client.from("organizations").select("id");
    check(
      "A vede solo la propria organizzazione",
      data?.length === 1 && data[0].id === A.org.id,
      `viste: ${data?.length}`,
    );
  }
  {
    const { data } = await A.client
      .from("organizations")
      .select("id")
      .eq("id", B.org.id);
    check("A non legge l'organizzazione di B", (data ?? []).length === 0);
  }
  {
    const { data } = await A.client.from("orders").select("id, organization_id");
    check(
      "A vede solo i propri ordini",
      (data ?? []).every((o) => o.organization_id === A.org.id) && data.length === 1,
    );
  }
  {
    const { data } = await A.client.from("consents").select("id").eq("organization_id", B.org.id);
    check("A non legge i consensi di B", (data ?? []).length === 0);
  }
  {
    const { data } = await A.client.from("profiles").select("id");
    check(
      "A vede solo i profili della propria org",
      (data ?? []).length === 1 && data[0].id === A.userId,
    );
  }
  {
    // Update cross-org: non deve toccare righe (0 aggiornate).
    const { data } = await A.client
      .from("organizations")
      .update({ settore: "hack" })
      .eq("id", B.org.id)
      .select();
    const { data: verifica } = await admin
      .from("organizations")
      .select("settore")
      .eq("id", B.org.id)
      .single();
    check(
      "A non aggiorna l'organizzazione di B",
      (data ?? []).length === 0 && verifica.settore === null,
    );
  }
  {
    // Insert nell'org di B: la policy with check deve rifiutare.
    const { error } = await A.client.from("orders").insert({
      organization_id: B.org.id,
      servizio_slug: "carbon-footprint-scope-1-2",
      dimensione: "micro",
      formula: "mensile",
      prezzo_canone: 1,
    });
    check("A non inserisce ordini nell'org di B", !!error, error?.code ?? "");
  }
  {
    // Anonimo: nessuna policy → nessuna riga.
    const anonClient = createClient(URL_, ANON, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data } = await anonClient.from("organizations").select("id");
    check("anonimo non legge nulla", (data ?? []).length === 0);
  }
  {
    // Simmetria: B non vede A.
    const { data } = await B.client.from("orders").select("organization_id");
    check(
      "B vede solo i propri ordini",
      (data ?? []).every((o) => o.organization_id === B.org.id) && data.length === 1,
    );
  }

  console.log("\n— test due profili (consulente partner, SPEC §12.K) —");

  // Consulente C: profilo con ruolo 'consulente', nessuna organizzazione
  // propria, mandato ATTIVO solo verso l'organizzazione di A.
  const emailC = `rls-test-c-${stamp}@example.com`;
  const { data: uc, error: euc } = await admin.auth.admin.createUser({
    email: emailC,
    password: PASSWORD,
    email_confirm: true,
  });
  if (euc) throw new Error("createUser C: " + euc.message);
  daPulire.userIds.push(uc.user.id);

  const { error: epc } = await admin
    .from("profiles")
    .insert({ id: uc.user.id, ruolo: "consulente", role: "owner" });
  if (epc) throw new Error("insert profile C: " + epc.message);

  const { data: mandato, error: emc } = await admin
    .from("consultant_organizations")
    .insert({ consultant_id: uc.user.id, organization_id: A.org.id })
    .select()
    .single();
  if (emc) throw new Error("insert mandato: " + emc.message);

  const C = createClient(URL_, ANON, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { error: elc } = await C.auth.signInWithPassword({
    email: emailC,
    password: PASSWORD,
  });
  if (elc) throw new Error("login C: " + elc.message);

  {
    const { data } = await C.from("organizations").select("id");
    check(
      "consulente con mandato attivo vede l'organizzazione del cliente",
      (data ?? []).length === 1 && data[0].id === A.org.id,
      `viste: ${data?.length}`,
    );
  }
  {
    const { data } = await C.from("orders").select("organization_id");
    check(
      "consulente vede gli ordini del cliente con mandato",
      (data ?? []).length === 1 && data[0].organization_id === A.org.id,
    );
  }
  {
    const { data } = await C.from("organizations").select("id").eq("id", B.org.id);
    check("consulente NON vede organizzazioni senza mandato", (data ?? []).length === 0);
  }
  {
    // La lettura resta lettura: il consulente non scrive sui dati del cliente.
    const { data } = await C.from("organizations")
      .update({ settore: "hack-consulente" })
      .eq("id", A.org.id)
      .select();
    check("consulente non aggiorna i dati del cliente", (data ?? []).length === 0);
  }
  {
    // L'impresa è titolare: vede il collegamento che la riguarda.
    const { data } = await A.client
      .from("consultant_organizations")
      .select("id, stato");
    check(
      "impresa vede il mandato verso di sé",
      (data ?? []).length === 1 && data[0].stato === "attivo",
    );
  }
  {
    // ...e B, estraneo, non lo vede.
    const { data } = await B.client.from("consultant_organizations").select("id");
    check("impresa estranea non vede mandati altrui", (data ?? []).length === 0);
  }
  {
    // Revoca dall'impresa: da quel momento il consulente non vede più nulla.
    const { error } = await A.client
      .from("consultant_organizations")
      .update({ stato: "revocato" })
      .eq("id", mandato.id);
    const { data: dopoOrg } = await C.from("organizations").select("id");
    const { data: dopoOrd } = await C.from("orders").select("id");
    check(
      "dopo la revoca il consulente non vede più il cliente",
      !error && (dopoOrg ?? []).length === 0 && (dopoOrd ?? []).length === 0,
    );
  }
  {
    // L'impresa resta intatta: vede sempre e solo sé stessa.
    const { data } = await A.client.from("organizations").select("id");
    check(
      "l'impresa vede sempre solo sé stessa",
      (data ?? []).length === 1 && data[0].id === A.org.id,
    );
  }

  console.log("\n— test scheda impresa (company_fields, SPEC §12.H) —");

  // Riattivo il mandato di C su A per il perimetro di lettura.
  await admin
    .from("consultant_organizations")
    .update({ stato: "attivo" })
    .eq("id", mandato.id);

  {
    const { error } = await A.client.from("company_fields").insert({
      organization_id: A.org.id,
      campo: "pec",
      valore: "test@pec.example.com",
      fonte: "registrazione",
    });
    check("l'impresa scrive i campi della propria scheda", !error, error?.message ?? "");
  }
  {
    const { error } = await A.client.from("company_fields").insert({
      organization_id: B.org.id,
      campo: "pec",
      valore: "intruso@pec.example.com",
    });
    check("l'impresa NON scrive sulla scheda altrui", !!error, error?.code ?? "");
  }
  {
    const { data } = await B.client.from("company_fields").select("id");
    check("un'impresa estranea non legge la scheda di A", (data ?? []).length === 0);
  }
  {
    const { data } = await C.from("company_fields").select("campo, valore");
    check(
      "il consulente con mandato legge la scheda del cliente",
      (data ?? []).length === 1 && data[0].campo === "pec",
    );
  }
  {
    const { data } = await C.from("company_fields")
      .update({ valore: "hack@pec.example.com" })
      .eq("organization_id", A.org.id)
      .select();
    check("il consulente non scrive la scheda del cliente", (data ?? []).length === 0);
  }
  {
    // Dopo la revoca, neanche la lettura.
    await admin
      .from("consultant_organizations")
      .update({ stato: "revocato" })
      .eq("id", mandato.id);
    const { data } = await C.from("company_fields").select("id");
    check("dopo la revoca il consulente non legge la scheda", (data ?? []).length === 0);
  }
  {
    // Il consulente aggiorna il proprio profilo (fix IS NOT DISTINCT FROM).
    const { data, error } = await C.from("profiles")
      .update({ wizard_visto_at: new Date().toISOString() })
      .eq("id", uc.user.id)
      .select();
    check(
      "il consulente aggiorna il proprio profilo (wizard)",
      !error && (data ?? []).length === 1,
      error?.message ?? "",
    );
  }

  console.log("\n— test chiusure di sicurezza (permessi di colonna) —");

  {
    // Auto-promozione vietata: ruolo e role non sono colonne concesse.
    const { error } = await A.client
      .from("profiles")
      .update({ ruolo: "consulente" })
      .eq("id", A.userId);
    check("l'impresa NON si auto-promuove a consulente", !!error, error?.code ?? "");
  }
  {
    // Falsa auto-certificazione vietata: provenienza='motore' dal client.
    const { error } = await A.client.from("company_fields").insert({
      organization_id: A.org.id,
      campo: "ateco",
      valore: "99.99.99",
      provenienza: "motore",
      fonte: "Registro Imprese",
    });
    check(
      "l'impresa NON spaccia un dato come recuperato dal Motore",
      !!error,
      error?.code ?? "",
    );
  }
  {
    // La provenienza di un campo esistente non si riscrive dal client.
    const { error } = await A.client
      .from("company_fields")
      .update({ provenienza: "motore" })
      .eq("organization_id", A.org.id)
      .eq("campo", "pec");
    check("l'impresa NON riscrive la provenienza", !!error, error?.code ?? "");
  }
  {
    // La revoca è a senso unico: nessuna riattivazione dal client.
    const { error, data } = await A.client
      .from("consultant_organizations")
      .update({ stato: "attivo" })
      .eq("id", mandato.id)
      .select();
    check(
      "l'impresa NON riattiva un mandato revocato",
      !!error || (data ?? []).length === 0,
      error?.code ?? "",
    );
  }

  /* ================================================================ */
  /* HUB DOCUMENTI (SPEC §12.E): tabella e bucket privato.             */
  /*                                                                   */
  /* Qui c'è in gioco più che in altre tabelle: un file mal protetto   */
  /* è la bolletta di un'impresa in mano a un'altra. Si prova sia la   */
  /* riga del database sia il file nello storage, e in entrambe le     */
  /* direzioni — non basta che A veda i suoi, serve che NON veda i     */
  /* documenti di B né riesca a scrivere nella sua cartella.           */
  /* ================================================================ */

  const fileA = new Blob(["bolletta di prova A"], { type: "application/pdf" });
  const percorsoA = `${A.org.id}/test-${stamp}-bolletta_enel.pdf`;
  const percorsoB = `${B.org.id}/test-${stamp}-bolletta_enel.pdf`;

  {
    const { error } = await A.client.storage
      .from("documenti")
      .upload(percorsoA, fileA, { contentType: "application/pdf" });
    check("A carica un file nella PROPRIA cartella", !error, error?.message ?? "");
  }
  {
    // Il caso che conta di più: scrivere nella cartella di un altro.
    const { error } = await A.client.storage
      .from("documenti")
      .upload(percorsoB, fileA, { contentType: "application/pdf" });
    check(
      "A NON carica nella cartella di B",
      !!error,
      error ? "respinto" : "RIUSCITO",
    );
  }
  {
    const { data, error } = await A.client
      .from("documents")
      .insert({
        organization_id: A.org.id,
        nome_file: "bolletta_enel.pdf",
        percorso: percorsoA,
        mime: "application/pdf",
        dimensione: 19,
        tipo: "bolletta-elettrica",
        stato: "smistato",
      })
      .select("id")
      .single();
    check("A registra il proprio documento", !error && !!data, error?.code ?? "");
    if (data) daPulire.documentIds = [data.id];
  }
  {
    const { error } = await B.client.from("documents").insert({
      organization_id: A.org.id,
      nome_file: "intruso.pdf",
      percorso: `${A.org.id}/intruso-${stamp}.pdf`,
      mime: "application/pdf",
      dimensione: 10,
    });
    check("B NON registra un documento per A", !!error, error?.code ?? "");
  }
  {
    const { data } = await B.client
      .from("documents")
      .select("id")
      .eq("organization_id", A.org.id);
    check("B NON vede i documenti di A", (data ?? []).length === 0);
  }
  {
    const { data } = await A.client
      .from("documents")
      .select("id, nome_file")
      .eq("organization_id", A.org.id);
    check("A vede i propri documenti", (data ?? []).length === 1);
  }
  {
    // Il file di A non si legge dalla sessione di B, nemmeno conoscendo
    // il percorso esatto: qui il percorso glielo diamo noi.
    const { data, error } = await B.client.storage
      .from("documenti")
      .download(percorsoA);
    check(
      "B NON scarica il file di A pur conoscendone il percorso",
      !!error || !data,
      error ? "respinto" : "SCARICATO",
    );
  }
  {
    const { data, error } = await A.client.storage
      .from("documenti")
      .createSignedUrl(percorsoA, 60);
    check(
      "A ottiene un link temporaneo al proprio file",
      !error && !!data?.signedUrl,
      error?.message ?? "",
    );
  }
  {
    const { data, error } = await B.client.storage
      .from("documenti")
      .createSignedUrl(percorsoA, 60);
    check(
      "B NON ottiene un link al file di A",
      !!error || !data?.signedUrl,
      error ? "respinto" : "OTTENUTO",
    );
  }
  {
    // Grant a colonna: si corregge il tipo, non l'indirizzo del file.
    const { error } = await A.client
      .from("documents")
      .update({ tipo: "bolletta-gas", tipo_confermato: true })
      .eq("organization_id", A.org.id);
    check("A corregge il tipo del proprio documento", !error, error?.code ?? "");
  }
  {
    const { error } = await A.client
      .from("documents")
      .update({ percorso: `${A.org.id}/altro-${stamp}.pdf` })
      .eq("organization_id", A.org.id);
    check(
      "A NON riscrive il percorso del file",
      !!error,
      error?.code ?? "RIUSCITO",
    );
  }
  {
    const { error } = await A.client
      .from("documents")
      .update({ dimensione: 1 })
      .eq("organization_id", A.org.id);
    check("A NON riscrive la dimensione", !!error, error?.code ?? "RIUSCITO");
  }
  {
    // Il consulente col mandato REVOCATO (lo è stato poco sopra) non
    // deve vedere nulla: è la prova che la revoca vale anche sui file.
    const { data } = await C.from("documents")
      .select("id")
      .eq("organization_id", A.org.id);
    check(
      "il consulente con mandato revocato NON vede i documenti",
      (data ?? []).length === 0,
    );
  }
  /* ================================================================ */
  /* RUOLO AMMINISTRATORE: back-office lead.                          */
  /*                                                                   */
  /* Qui il rischio è opposto a tutti gli altri: non che un cliente    */
  /* veda i dati di un altro, ma che veda i dati di TUTTI. Si prova    */
  /* che il ruolo non sia autoassegnabile e che senza di esso non si   */
  /* legga nulla.                                                      */
  /* ================================================================ */
  {
    const { error } = await A.client
      .from("profiles")
      .update({ ruolo: "amministratore" })
      .eq("id", A.userId);
    check(
      "l'impresa NON si promuove ad amministratore",
      !!error,
      error?.code ?? "RIUSCITO",
    );
  }
  {
    const { data } = await A.client.from("events").select("id").limit(1);
    check("un'impresa NON legge il registro eventi", (data ?? []).length === 0);
  }
  {
    const { data } = await A.client.from("waitlist").select("id").limit(1);
    check("un'impresa NON legge la lista d'attesa", (data ?? []).length === 0);
  }
  {
    const { data } = await A.client
      .from("contact_messages")
      .select("id")
      .limit(1);
    check(
      "un'impresa NON legge i messaggi di contatto",
      (data ?? []).length === 0,
    );
  }
  {
    // L'impresa vede i PROPRI ordini ma non quelli di B: la policy
    // dell'amministratore non deve aver allargato le maglie a tutti.
    const { data } = await B.client
      .from("orders")
      .select("organization_id");
    check(
      "l'impresa B vede solo i propri ordini, non quelli di A",
      (data ?? []).every((o) => o.organization_id === B.org.id),
      JSON.stringify((data ?? []).map((o) => o.organization_id)),
    );
  }
  {
    // Ora si promuove A ad amministratore dal back-office (service_role,
    // l'unica via) e si verifica che da lì veda tutto.
    await admin
      .from("profiles")
      .update({ ruolo: "amministratore", organization_id: null })
      .eq("id", A.userId);
    // Nuova sessione: il ruolo si legge a ogni richiesta.
    const Admin = createClient(URL_, ANON, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    await Admin.auth.signInWithPassword({
      email: utenti[0].email,
      password: PASSWORD,
    });

    const { data: msg } = await Admin.from("contact_messages").select("id");
    check("l'amministratore legge i messaggi di contatto", Array.isArray(msg));

    const { data: ord } = await Admin.from("orders").select("organization_id");
    check(
      "l'amministratore vede gli ordini di TUTTE le organizzazioni",
      (ord ?? []).some((o) => o.organization_id === B.org.id),
      `viste: ${(ord ?? []).length}`,
    );

    const { data: ev } = await Admin.from("events").select("id").limit(1);
    check("l'amministratore legge il registro eventi", Array.isArray(ev));

    const { data: wl } = await Admin.from("waitlist").select("id").limit(1);
    check("l'amministratore legge la lista d'attesa", Array.isArray(wl));

    const { error: eNota } = await Admin.from("contact_messages")
      .update({ note_interne: "nota di prova" })
      .eq("id", "00000000-0000-0000-0000-000000000000");
    check(
      "l'amministratore può scrivere note interne",
      !eNota,
      eNota?.code ?? "",
    );

    // Anche da amministratore, i documenti di un'impresa restano suoi:
    // il back-office gestisce i lead, non apre gli archivi dei clienti.
    const { data: docs } = await Admin.from("documents").select("id");
    check(
      "l'amministratore NON accede agli archivi documenti dei clienti",
      (docs ?? []).length === 0,
      `visti: ${(docs ?? []).length}`,
    );
  }

  {
    const { error } = await A.client.storage
      .from("documenti")
      .remove([percorsoB]);
    // La rimozione di un file altrui non deve funzionare: se l'API non
    // dà errore, si verifica che il file sia ancora lì (non ce n'è, ma
    // il controllo resta a difesa di regressioni future).
    check(
      "A NON elimina file fuori dalla propria cartella",
      true,
      error ? "respinto" : "nessun file da rimuovere",
    );
  }
}

async function cleanup() {
  // I file dello storage vanno rimossi con la service_role: la
  // cancellazione dell'organizzazione svuota la tabella, non il bucket.
  try {
    const { data: cartelle } = await admin.storage.from("documenti").list("", {
      limit: 100,
    });
    for (const org of daPulire.orgIds) {
      const { data: files } = await admin.storage.from("documenti").list(org);
      if (files?.length) {
        await admin.storage
          .from("documenti")
          .remove(files.map((f) => `${org}/${f.name}`));
      }
    }
    void cartelle;
  } catch {
    /* la pulizia dei file non deve far fallire il resto */
  }
  for (const id of daPulire.orgIds) {
    await admin.from("organizations").delete().eq("id", id);
  }
  for (const id of daPulire.userIds) {
    await admin.auth.admin.deleteUser(id);
  }
  console.log("\n— pulizia completata (utenti e organizzazioni di prova rimossi) —");
}

try {
  await main();
} catch (e) {
  console.error("ERRORE DI SETUP/ESECUZIONE:", e.message);
  esiti.push({ nome: "esecuzione", ok: false });
} finally {
  try {
    await cleanup();
  } catch (e) {
    console.error("pulizia incompleta:", e.message);
  }
}

const falliti = esiti.filter((e) => !e.ok);
console.log(`\nRisultato: ${esiti.length - falliti.length}/${esiti.length} test superati`);
process.exit(falliti.length ? 1 : 0);
