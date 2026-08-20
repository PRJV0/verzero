import "server-only";

import { NOTIFICHE_INTERNE, inviaEmail } from "@/lib/email";
import { publicEnv } from "@/lib/env";

/**
 * NOTIFICHE INTERNE SUI LEAD.
 *
 * Un lead che finisce in tabella senza che nessuno lo veda è un lead
 * perso: qui ogni contatto, ogni richiesta di attivazione e ogni
 * iscrizione alla lista d'attesa fa suonare una campana.
 *
 * Due regole sul contenuto:
 *  - NIENTE DI PIÙ DEL NECESSARIO nel corpo. L'email serve a decidere se
 *    aprire il back-office adesso o dopo pranzo, non a sostituirlo: nome,
 *    di cosa si tratta, e il link. Il messaggio integrale, i dati
 *    dell'impresa e le note stanno dietro l'accesso, dove sono protetti.
 *  - L'invio non può MAI far fallire l'operazione che l'ha generata: il
 *    dato è già salvato, la campana è un di più.
 */

/** Il destinatario è configurabile: RESEND_NOTIFICHE_A in ambiente. */
const A = NOTIFICHE_INTERNE;

function linkBackOffice(sezione: string): string {
  return `${publicEnv.siteUrl}/dashboard/lead?vista=${sezione}`;
}

/** Nuovo messaggio dal modulo contatti. */
export async function notificaContatto(dati: {
  nome: string;
  azienda: string | null;
  oggetto: string;
  email: string;
}) {
  await inviaEmail({
    a: A,
    oggetto: `Nuovo contatto — ${dati.oggetto}`,
    rispondiA: dati.email,
    testo: [
      `${dati.nome}${dati.azienda ? ` — ${dati.azienda}` : ""} ha scritto dal sito.`,
      `Oggetto: ${dati.oggetto}`,
      "",
      "Il messaggio integrale è nel back-office:",
      linkBackOffice("contatti"),
      "",
      "(Rispondendo a questa email scrivi direttamente a chi ti ha contattato.)",
    ].join("\n"),
  });
}

/** Nuova richiesta di attivazione (o ordine, a pagamenti accesi). */
export async function notificaRichiesta(dati: {
  ragioneSociale: string;
  servizio: string;
  dimensione: string;
  formula: string;
  prezzo: string;
  stato: string;
}) {
  const richiesta = dati.stato === "richiesta";
  await inviaEmail({
    a: A,
    oggetto: richiesta
      ? `Richiesta di attivazione — ${dati.ragioneSociale}`
      : `Nuovo ordine — ${dati.ragioneSociale}`,
    testo: [
      `${dati.ragioneSociale} ha ${richiesta ? "chiesto di attivare" : "ordinato"}:`,
      "",
      `  Servizio:   ${dati.servizio}`,
      `  Dimensione: ${dati.dimensione}`,
      `  Formula:    ${dati.formula}`,
      `  Prezzo:     ${dati.prezzo}`,
      "",
      richiesta
        ? "Nessun addebito è stato effettuato: il cliente aspetta di essere contattato per concordare l'avvio."
        : "Ordine registrato in attivazione.",
      "",
      linkBackOffice("richieste"),
    ].join("\n"),
  });
}

/** Nuova iscrizione alla lista d'attesa. */
export async function notificaWaitlist(dati: {
  email: string;
  nome: string | null;
  azienda: string | null;
  interesse: string | null;
}) {
  await inviaEmail({
    a: A,
    oggetto: "Nuova iscrizione alla lista d'attesa",
    rispondiA: dati.email,
    testo: [
      `${dati.nome ?? "Qualcuno"}${dati.azienda ? ` — ${dati.azienda}` : ""} si è iscritto alla lista d'attesa.`,
      dati.interesse ? `Interesse: ${dati.interesse}` : "",
      "",
      linkBackOffice("waitlist"),
    ]
      .filter(Boolean)
      .join("\n"),
  });
}

/**
 * CONFERMA AL RICHIEDENTE (SPEC §12.B, modalità pre-lancio).
 *
 * La rassicurazione sull'addebito è la parte che conta: chi ha appena
 * riempito un modulo con la propria partita IVA vuole sapere che non gli
 * verrà tolto nulla dal conto. E nessuna data promessa — «ti
 * ricontattiamo» senza un «entro N giorni» che non possiamo mantenere.
 */
export async function confermaRichiestaAlCliente(dati: {
  a: string;
  ragioneSociale: string;
  servizio: string;
  dimensione: string;
  formula: string;
  prezzo: string;
}) {
  await inviaEmail({
    a: dati.a,
    oggetto: "Abbiamo ricevuto la tua richiesta — Ver0",
    testo: [
      `Grazie: la richiesta di ${dati.ragioneSociale} è registrata.`,
      "",
      "Ecco la configurazione che hai scelto:",
      `  Percorso:   ${dati.servizio}`,
      `  Dimensione: ${dati.dimensione}`,
      `  Formula:    ${dati.formula}`,
      `  Prezzo:     ${dati.prezzo}`,
      "",
      "NESSUN ADDEBITO. Non ti verrà addebitato nulla fino all'inizio",
      "effettivo delle attività, che concorderemo insieme.",
      "",
      "Ti contattiamo per fissare l'avvio del tuo percorso.",
      "Nel frattempo entra pure nel tuo ecosistema: la scheda della tua",
      "impresa è già lì, con l'elenco dei documenti che servono.",
      "",
      `${publicEnv.siteUrl}/dashboard`,
      "",
      "— Ver0",
    ].join("\n"),
    html: [
      `<p>Grazie: la richiesta di <strong>${dati.ragioneSociale}</strong> è registrata.</p>`,
      "<p>Ecco la configurazione che hai scelto:</p>",
      "<ul>",
      `<li>Percorso: <strong>${dati.servizio}</strong></li>`,
      `<li>Dimensione: ${dati.dimensione}</li>`,
      `<li>Formula: ${dati.formula}</li>`,
      `<li>Prezzo: ${dati.prezzo}</li>`,
      "</ul>",
      '<p style="background:#F6F1E4;border-left:4px solid#0E5238;padding:12px 16px">',
      "<strong>Nessun addebito.</strong> Non ti verrà addebitato nulla fino",
      "all'inizio effettivo delle attività, che concorderemo insieme.</p>",
      "<p>Ti contattiamo per fissare l'avvio del tuo percorso. Nel frattempo",
      "entra pure nel tuo ecosistema: la scheda della tua impresa è già lì,",
      "con l'elenco dei documenti che servono.</p>",
      `<p><a href="${publicEnv.siteUrl}/dashboard" style="background:#0E5238;color:#fff;padding:12px 22px;border-radius:8px;text-decoration:none;font-weight:600">Vai al tuo ecosistema</a></p>`,
      "<p>— Ver0</p>",
    ].join("\n"),
  });
}

/**
 * CONFERMA A CHI SI È ISCRITTO ALLA LISTA D'ATTESA.
 *
 * Il tono è quello del modulo: nessuna euforia da newsletter, nessuna
 * promessa di date. E la promessa che conta ripetuta per iscritto —
 * niente newsletter, niente promozioni — perché è esattamente il timore
 * di chi lascia il proprio indirizzo a uno sconosciuto.
 */
export async function confermaWaitlist(dati: {
  a: string;
  azienda: string | null;
}) {
  const saluto = dati.azienda ? `Ciao da ${dati.azienda},` : "Ciao,";
  await inviaEmail({
    a: dati.a,
    oggetto: "Ci sei — Ver0",
    testo: [
      saluto,
      "",
      "il tuo contatto è in lista.",
      "",
      "Apriamo a poche imprese alla volta perché ognuna parta con il",
      "percorso costruito bene. Ti scriviamo noi quando apriamo il tuo",
      "turno, con le condizioni fondatori riservate ai primi.",
      "",
      "Niente newsletter, niente promozioni: da noi ricevi solo questa",
      "email e quella con cui apriamo il tuo turno.",
      "",
      "— Ver0",
      publicEnv.siteUrl,
    ].join("\n"),
    html: [
      `<p>${saluto}<br>il tuo contatto è in lista.</p>`,
      "<p>Apriamo a poche imprese alla volta perché ognuna parta con il",
      "percorso costruito bene. Ti scriviamo noi quando apriamo il tuo turno,",
      "con le <strong>condizioni fondatori</strong> riservate ai primi.</p>",
      '<p style="background:#F6F1E4;border-left:4px solid #0E5238;padding:12px 16px">',
      "Niente newsletter, niente promozioni: da noi ricevi solo questa email",
      "e quella con cui apriamo il tuo turno.</p>",
      `<p>— <a href="${publicEnv.siteUrl}" style="color:#0E5238">Ver0</a></p>`,
    ].join("\n"),
  });
}
