/**
 * MODELLO, LIMITI E COSTI DEL MOTORE (docs/motore.md §7, §9).
 *
 * Nessun segreto qui dentro e nessun `server-only`: sono la scelta del
 * modello, i limiti di ingresso e il listino. Devono restare provabili
 * senza avviare l'applicazione — il costo per pratica è un numero che si
 * verifica, non una stima da fidarsi.
 *
 * ═══ IL MODELLO PREDEFINITO È `claude-opus-5`, E NON È UN CASO ═══
 *
 * Estrarre dati da documenti amministrativi italiani — tabelle, fasce
 * orarie, conguagli, prestampati con correzioni a mano, scansioni storte —
 * è il tipo di compito in cui la differenza fra modelli non è stilistica:
 * è il numero di campi che tornano giusti sui CASI DIFFICILI, che sono
 * esattamente quelli in cui un errore passa inosservato. Il caso facile lo
 * legge chiunque.
 *
 * `ANTHROPIC_EXTRACTION_MODEL` lo cambia senza deploy, ma **abbassare il
 * modello per risparmiare non è una decisione tecnica**: è una decisione
 * del fondatore, da prendere dopo aver confrontato gli esiti sugli stessi
 * documenti col log tecnico alla mano (tabella `estrazioni`). Finché quel
 * confronto non esiste, il default resta il modello più capace: un dato
 * sbagliato costa più di tutta la spesa di elaborazione di quella pratica.
 */

const MODELLO_PREDEFINITO = "claude-opus-5";

/** Il tetto di token in uscita. Il ragionamento adattivo ci sta dentro. */
const MAX_TOKEN_PREDEFINITO = 4000;

/** I nostri limiti verso l'API, più bassi dei suoi (32 MB, 600 pagine). */
export const MAX_BYTE_VERSO_API = 30 * 1024 * 1024;
export const MAX_PAGINE = 100;

/**
 * Listino Anthropic al 24 agosto 2026, dollari per milione di token.
 * Serve a calcolare il costo dai token EFFETTIVI, non a stimarlo a occhio:
 * è l'unico modo di sapere quanto costa davvero una pratica.
 */
export const PREZZI_PER_MILIONE: Record<string, { ingresso: number; uscita: number }> = {
  "claude-opus-5": { ingresso: 5, uscita: 25 },
  "claude-opus-4-8": { ingresso: 5, uscita: 25 },
  "claude-sonnet-5": { ingresso: 3, uscita: 15 },
  "claude-haiku-4-5": { ingresso: 1, uscita: 5 },
};

export type ExtractionConfig = {
  model: string;
  maxTokens: number;
  /** I candidati da confrontare sui documenti veri, col log alla mano. */
  benchmarkCandidates: readonly string[];
};

export function extractionConfig(): ExtractionConfig {
  // Una variabile d'ambiente presente ma VUOTA non è una scelta: `??`
  // la accetterebbe come valore, lasciando il modello a stringa vuota.
  const scelto = process.env.ANTHROPIC_EXTRACTION_MODEL?.trim();
  const maxToken = Number(process.env.ANTHROPIC_EXTRACTION_MAX_TOKENS);

  return {
    model: scelto && scelto.length > 0 ? scelto : MODELLO_PREDEFINITO,
    maxTokens:
      Number.isFinite(maxToken) && maxToken >= 1000 ? maxToken : MAX_TOKEN_PREDEFINITO,
    benchmarkCandidates: ["claude-opus-5", "claude-sonnet-5", "claude-haiku-4-5"],
  };
}

/**
 * Il costo di una chiamata in MILIONESIMI DI DOLLARO, dai token effettivi.
 * Interi, non decimali: una somma di centinaia di migliaia di frazioni
 * decimali deriva, e questo numero finisce nel tetto di spesa.
 */
export function costoMicroDollari(
  modello: string,
  tokenIngresso: number,
  tokenUscita: number,
): number {
  const p = PREZZI_PER_MILIONE[modello];
  if (!p) return 0;
  return Math.round(tokenIngresso * p.ingresso + tokenUscita * p.uscita);
}

/** Il costo in euro-cent leggibile, per il back-office. */
export function costoLeggibile(micro: number): string {
  return `$${(micro / 1_000_000).toFixed(4)}`;
}
