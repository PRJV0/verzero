/**
 * ARRICCHIMENTO AUTOMATICO (SPEC §12.H, tappa 2.1) — contratto comune.
 *
 * Un adapter per fonte, tutti con la stessa forma. Regole non negoziabili:
 *
 *  1. SOLO VIE LEGITTIME. Un adapter si attiva unicamente se esiste un
 *     accesso previsto dal fornitore del dato (API pubblica, web service,
 *     convenzione). Dove i termini d'uso vietano l'estrazione, l'adapter
 *     resta SPENTO con il vincolo scritto in chiaro: meglio un campo
 *     vuoto che un dato preso in modo scorretto.
 *  2. MAI DATI INVENTATI. Se la fonte non risponde, risponde male o
 *     risponde in modo ambiguo, l'adapter torna «errore» o «nessun dato»
 *     e NON scrive nulla. Nessuna stima, nessun ripiego.
 *  3. FALLIMENTI ISOLATI. Un adapter che cade non ferma gli altri: ogni
 *     esecuzione è indipendente e il suo esito viene registrato.
 */

/** Stato di un adapter nel catalogo delle fonti. */
export type StatoFonte =
  /** Integrabile e integrata: viene interrogata davvero. */
  | "attiva"
  /** Predisposta ma spenta: manca l'accesso legittimo o l'account. */
  | "spenta";

export type EsitoFonte =
  /** Ha risposto e ha prodotto almeno un campo. */
  | "ok"
  /** Ha risposto correttamente ma per questa impresa non ha nulla. */
  | "nessun_dato"
  /** Non ha risposto, o ha risposto in modo non affidabile. */
  | "errore"
  /** Adapter spento: vincolo di accesso o account non ancora attivo. */
  | "non_disponibile";

/** Un campo prodotto da una fonte, pronto per company_fields. */
export type CampoArricchito = {
  /** Chiave del campo nella scheda impresa (src/lib/impresa.ts). */
  campo: string;
  valore: string;
  /** La fonte, come la vedrà il cliente: «VIES», «INI-PEC», … */
  fonte: string;
  /**
   * L'indirizzo esatto da cui viene il dato, quando la fonte è una
   * pagina web (SPEC §12.D). Per i contenuti presi dal sito del cliente
   * NON è facoltativo: senza URL il dato non è verificabile, e un dato
   * non verificabile non lo scriviamo.
   */
  fonteUrl?: string;
};

export type RisultatoFonte = {
  esito: EsitoFonte;
  campi: CampoArricchito[];
  /** Messaggio tecnico per il registro: errore o vincolo. */
  dettaglio?: string;
};

/** I dati dell'impresa che un adapter può usare per interrogare la fonte. */
export type ContestoImpresa = {
  organizationId: string;
  ragioneSociale: string;
  partitaIva: string;
  /** Il sito ufficiale dichiarato dall'impresa: l'unico dominio che il
   *  Motore ha il permesso di leggere (SPEC §12.D). */
  sitoWeb: string | null;
  /** Campi già noti (utente o motore): permette agli adapter che
   *  derivano un dato da un altro — es. ATECO → descrizione. */
  campiEsistenti: Record<string, string>;
};

export type Adapter = {
  /** Identificativo tecnico, usato nel registro. */
  chiave: string;
  /** Nome visibile al cliente durante il recupero. */
  nome: string;
  /** Cosa promette di recuperare, in una riga per non esperti. */
  cosaRecupera: string;
  stato: StatoFonte;
  /**
   * Perché è spenta, quando lo è: il vincolo esatto, così la scelta
   * resta verificabile e si sa cosa serve per accenderla.
   */
  vincolo?: string;
  /** Interroga la fonte. Non deve mai lanciare: cattura tutto e riferisce. */
  esegui: (contesto: ContestoImpresa) => Promise<RisultatoFonte>;
};

/** Tempo massimo concesso a una fonte: oltre, si passa avanti. */
export const TIMEOUT_FONTE_MS = 12_000;

/** Helper comune: fetch con scadenza, senza far cadere l'orchestratore. */
export async function fetchConScadenza(
  url: string,
  init: RequestInit = {},
  timeoutMs = TIMEOUT_FONTE_MS,
): Promise<Response> {
  const controller = new AbortController();
  const scadenza = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(scadenza);
  }
}

/** Esito «spenta» uniforme per gli adapter predisposti ma non attivi. */
export function nonDisponibile(vincolo: string): RisultatoFonte {
  return { esito: "non_disponibile", campi: [], dettaglio: vincolo };
}
