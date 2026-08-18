import "server-only";

/**
 * EMAIL APPLICATIVE VIA RESEND (SPEC §12.E, §2).
 *
 * Attenzione alla divisione dei compiti, che è fonte di confusione:
 *
 *  - le email di AUTENTICAZIONE (conferma indirizzo, recupero password,
 *    link di accesso) le manda SUPABASE, non questo modulo: si configura
 *    Resend come server SMTP del progetto — vedi scripts/configura-smtp.mjs;
 *  - le email APPLICATIVE (notifica di un nuovo contatto, in futuro «il tuo
 *    report è pronto») partono da qui, via API Resend.
 *
 * Regola di robustezza: un'email non deve MAI far fallire l'operazione che
 * l'ha generata. Se la chiave manca o Resend risponde male, registriamo e
 * proseguiamo — il dato è già salvato a database e nulla va perso.
 */

const ENDPOINT = "https://api.resend.com/emails";

/** Mittente predefinito: dominio verificato su Resend. */
const MITTENTE_DEFAULT = process.env.RESEND_FROM ?? "Ver0 <no-reply@verzero.it>";

/** Destinatario interno delle notifiche di servizio. */
export const NOTIFICHE_INTERNE =
  process.env.RESEND_NOTIFICHE_A ?? "info@verzero.it";

export type EsitoEmail =
  | { inviata: true; id: string }
  | { inviata: false; motivo: "chiave-assente" | "errore" };

/**
 * Invia un'email. Non lancia mai: restituisce l'esito e lo registra.
 * Chi la chiama può ignorare il risultato senza rischi.
 */
export async function inviaEmail({
  a,
  oggetto,
  testo,
  html,
  rispondiA,
}: {
  a: string | string[];
  oggetto: string;
  testo: string;
  html?: string;
  rispondiA?: string;
}): Promise<EsitoEmail> {
  const chiave = process.env.RESEND_API_KEY;
  if (!chiave) {
    // Non è un errore: finché Resend non è configurato il prodotto
    // funziona lo stesso, semplicemente senza notifiche.
    console.info(
      `[email] RESEND_API_KEY assente: notifica «${oggetto}» non inviata (nulla è andato perso).`,
    );
    return { inviata: false, motivo: "chiave-assente" };
  }

  try {
    const risposta = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${chiave}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: MITTENTE_DEFAULT,
        to: Array.isArray(a) ? a : [a],
        subject: oggetto,
        text: testo,
        ...(html ? { html } : {}),
        ...(rispondiA ? { reply_to: rispondiA } : {}),
      }),
    });

    if (!risposta.ok) {
      const dettaglio = await risposta.text().catch(() => "");
      console.error(
        `[email] Resend ha risposto ${risposta.status}: ${dettaglio.slice(0, 300)}`,
      );
      return { inviata: false, motivo: "errore" };
    }

    const dati = (await risposta.json()) as { id?: string };
    return { inviata: true, id: dati.id ?? "" };
  } catch (e) {
    console.error(
      `[email] Invio non riuscito: ${e instanceof Error ? e.message : String(e)}`,
    );
    return { inviata: false, motivo: "errore" };
  }
}
