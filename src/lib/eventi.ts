/**
 * ANALITICA DI PRIMA PARTE, SENZA COOKIE.
 *
 * PERCHÉ COSÌ, e non solo con uno strumento di terze parti.
 *
 * Il traffico grezzo — pagine viste, sorgenti — è una merce: lo misura
 * bene chiunque, e Vercel Analytics lo fa senza cookie, senza consenso e
 * senza manutenzione, essendo già dove il sito è ospitato. Quello lo
 * lasciamo a lui.
 *
 * Gli EVENTI DI BUSINESS sono un'altra cosa. «Dove si perdono le persone
 * nel funnel» è il dato più prezioso che questa piattaforma produrrà, e
 * ha tre requisiti che nessun prodotto generalista soddisfa bene:
 *  1. deve stare ACCANTO agli ordini e ai lead, per rispondere in SQL a
 *     domande come «quanti di quelli che hanno visto il prezzo hanno poi
 *     chiesto l'attivazione»;
 *  2. deve essere nostro, in UE, senza dipendere da un piano tariffario
 *     (gli eventi personalizzati su Vercel sono a pagamento);
 *  3. deve poter finire nel back-office che stiamo già costruendo.
 *
 * Da qui la scelta: Vercel Analytics per il traffico, tabella `events`
 * per ciò che conta davvero. Nessuno dei due usa cookie di profilazione,
 * quindi entrambi restano fuori dal consenso — il che è coerente con la
 * cookie policy che abbiamo scritto.
 *
 * Cosa NON registriamo, mai: indirizzi IP in chiaro, query string,
 * indirizzi email, contenuto dei moduli. Del visitatore conserviamo solo
 * un'impronta con pepper, che serve a distinguere una sessione da
 * un'altra e a frenare gli abusi.
 */

/**
 * L'elenco CHIUSO degli eventi. Una tabella che accetta qualunque nome
 * si riempie di spazzatura e diventa illeggibile in tre mesi: qui si
 * aggiunge una voce quando serve, di proposito.
 */
export const EVENTI = {
  /** Pagina di un servizio aperta: primo segnale d'interesse reale. */
  SERVIZIO_APERTO: "servizio_aperto",
  /** Click sul pulsante che porta al funnel. */
  ATTIVA_CLICK: "attiva_click",
  /** Un passo del funnel completato: `dettagli.passo` dice quale. */
  FUNNEL_PASSO: "funnel_passo",
  /** Richiesta di attivazione inviata (o ordine, a pagamenti accesi). */
  FUNNEL_COMPLETATO: "funnel_completato",
  /** Modulo contatti inviato. */
  CONTATTO_INVIATO: "contatto_inviato",
  /** Iscrizione alla lista d'attesa. */
  WAITLIST_ISCRITTO: "waitlist_iscritto",
} as const;

export type NomeEvento = (typeof EVENTI)[keyof typeof EVENTI];

const NOMI_AMMESSI: string[] = Object.values(EVENTI);

export function eventoValido(nome: string): nome is NomeEvento {
  return NOMI_AMMESSI.includes(nome);
}

/**
 * I passi del funnel che si possono COMPLETARE lasciandoli, in ordine.
 *
 * Sono tre e non quattro di proposito: l'ultimo passo non si «lascia»,
 * si conclude — e la sua conclusione è FUNNEL_COMPLETATO. Elencarlo qui
 * produrrebbe un gradino sempre a zero seguito da uno pieno, cioè un
 * grafico che si contraddice da solo.
 */
export const PASSI_FUNNEL = ["riepilogo", "registrazione", "consensi"] as const;

export type PassoFunnel = (typeof PASSI_FUNNEL)[number];

/**
 * Manda un evento senza far attendere nessuno e senza far fallire nulla:
 * la misurazione non deve MAI rovinare l'esperienza che sta misurando.
 * `sendBeacon` sopravvive anche al cambio di pagina, che è esattamente
 * il momento in cui gli eventi di abbandono si perdono.
 */
export function traccia(
  nome: NomeEvento,
  dettagli: Record<string, string | number> = {},
): void {
  if (typeof window === "undefined") return;
  try {
    const corpo = JSON.stringify({
      nome,
      percorso: window.location.pathname,
      dettagli,
    });
    const inviato =
      typeof navigator.sendBeacon === "function" &&
      navigator.sendBeacon(
        "/api/eventi",
        new Blob([corpo], { type: "application/json" }),
      );
    if (!inviato) {
      void fetch("/api/eventi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: corpo,
        keepalive: true,
      }).catch(() => {});
    }
  } catch {
    // Un errore di misurazione resta un problema nostro, mai dell'utente.
  }
}
