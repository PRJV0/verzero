#!/usr/bin/env node
/**
 * CONFIGURA RESEND COME SMTP DEL PROGETTO SUPABASE (SPEC §12.E).
 *
 * Perché serve: il servizio email integrato di Supabase manda 2 email
 * l'ora per TUTTO il progetto ed è dichiarato per il solo sviluppo. Con
 * quel limite la registrazione stessa può fallire ("email rate limit
 * exceeded"): è la ragione per cui il login era bloccato.
 *
 * Cosa tocca: solo le email di AUTENTICAZIONE (recupero password, link di
 * accesso, conferme). Le notifiche applicative passano invece dall'API
 * Resend in src/lib/email.ts.
 *
 * Uso, dopo aver messo RESEND_API_KEY in .env.local:
 *   node --env-file=.env.local scripts/configura-smtp.mjs
 *
 * Prerequisiti su Resend: dominio verificato (vedi le istruzioni nel
 * README della sessione) e chiave con permesso di invio.
 */

const PROJECT_REF = "xbpfykunfxzyafyhouki";

// Credenziali SMTP di Resend: l'utente è sempre la stringa "resend",
// la password è la chiave API.
const SMTP = {
  host: "smtp.resend.com",
  port: 465,
  user: "resend",
  senderName: "Ver0",
};

const token = process.env.SUPABASE_ACCESS_TOKEN;
const apiKey = process.env.RESEND_API_KEY;
const mittente = process.env.RESEND_FROM_EMAIL ?? "no-reply@verzero.it";

if (!token) {
  console.error(
    "Manca SUPABASE_ACCESS_TOKEN in .env.local: serve per la Management API.",
  );
  process.exit(1);
}
if (!apiKey) {
  console.error(
    [
      "Manca RESEND_API_KEY in .env.local.",
      "",
      "Cosa fare su Resend, nell'ordine:",
      "  1. crea l'account su resend.com;",
      "  2. Domains → Add Domain → verzero.it, e aggiungi al DNS i record",
      "     che ti mostra (SPF, DKIM e, se offerto, DMARC): senza dominio",
      "     verificato si può scrivere solo a se stessi;",
      "  3. attendi la spunta «Verified» (di solito pochi minuti);",
      "  4. API Keys → Create API Key, permesso «Sending access»;",
      "  5. incolla la chiave in .env.local come RESEND_API_KEY e",
      "     aggiungila anche su Vercel (Settings → Environment Variables).",
      "",
      "Poi rilancia questo script.",
    ].join("\n"),
  );
  process.exit(1);
}

const url = `https://api.supabase.com/v1/projects/${PROJECT_REF}/config/auth`;

const corpo = {
  smtp_host: SMTP.host,
  smtp_port: SMTP.port,
  smtp_user: SMTP.user,
  smtp_pass: apiKey,
  smtp_admin_email: mittente,
  smtp_sender_name: SMTP.senderName,
  // Con un SMTP vero il limite del servizio integrato non ha più senso:
  // lo alziamo a una soglia che regge i piloti senza aprire le porte.
  rate_limit_email_sent: 60,
  // Un invio ogni 20 secondi per indirizzo: frena i tentativi ripetuti
  // senza infastidire chi sbaglia una volta.
  smtp_max_frequency: 20,
};

async function patch(corpo, cosa) {
  const risposta = await fetch(url, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(corpo),
  });
  if (!risposta.ok) {
    console.error(`${cosa}: non riuscito (${risposta.status})`);
    console.error(await risposta.text());
    process.exit(1);
  }
  return risposta.json();
}

const config = await patch(corpo, "Configurazione SMTP");

console.log("SMTP configurato sul progetto Supabase:");
console.log(`  host              ${config.smtp_host}:${config.smtp_port}`);
console.log(`  mittente          ${config.smtp_sender_name} <${config.smtp_admin_email}>`);
console.log(`  email/ora         ${config.rate_limit_email_sent}`);
console.log(`  attesa per invio  ${config.smtp_max_frequency}s`);

/**
 * I testi delle email, in italiano e nel formato `token_hash`.
 *
 * Perché token_hash e non il link predefinito: il formato standard usa PKCE,
 * che lega il link al browser da cui è partita la richiesta. Chi chiede il
 * reset dal computer e apre l'email dal telefono — cioè moltissimi — si
 * troverebbe un link che non funziona. Con token_hash la verifica avviene
 * lato server nella nostra callback e il link vale ovunque.
 *
 * Nota: Supabase permette di cambiare i template SOLO con SMTP proprio, per
 * questo si applicano qui e non nella configurazione di base.
 */
const LINK_RECUPERO =
  "{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=recovery&next=/reset-password";
const LINK_ACCESSO =
  "{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=magiclink";

const bottone = (href, testo) =>
  `<p style="margin:28px 0"><a href="${href}" style="background:#0E5238;color:#fff;padding:12px 22px;border-radius:8px;text-decoration:none;font-weight:600">${testo}</a></p>`;

const testi = {
  mailer_subjects_recovery: "Reimposta la password del tuo accesso Ver0",
  mailer_templates_recovery_content: [
    "<h2>Reimposta la tua password</h2>",
    "<p>Hai chiesto di cambiare la password del tuo accesso a Ver0. Apri il link qui sotto e scegline una nuova: vale un'ora e una volta sola.</p>",
    bottone(LINK_RECUPERO, "Scegli una nuova password"),
    "<p>Se non sei stato tu, ignora questo messaggio: la password attuale resta valida.</p>",
    "<p>— Ver0</p>",
  ].join("\n"),
  mailer_subjects_magic_link: "Il tuo link di accesso a Ver0",
  mailer_templates_magic_link_content: [
    "<h2>Entra nel tuo ecosistema</h2>",
    "<p>Ecco il link per accedere a Ver0. Vale un'ora e una volta sola.</p>",
    bottone(LINK_ACCESSO, "Accedi a Ver0"),
    "<p>Se non hai richiesto tu questo accesso, ignora il messaggio.</p>",
    "<p>— Ver0</p>",
  ].join("\n"),
};

await patch(testi, "Testi delle email");
console.log("");
console.log("Testi delle email in italiano applicati (recupero e accesso).");
console.log("");
console.log(
  "Prova ora il recupero password da /password-dimenticata: l'email deve arrivare dal dominio verificato.",
);
