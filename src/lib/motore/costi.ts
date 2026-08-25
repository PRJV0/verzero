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

/** Il tetto di token in uscita per una SCHEDA: pochi campi, fissi. */
const MAX_TOKEN_PREDEFINITO = 4000;

/** Oltre questo non si va comunque: un'uscita più lunga è un difetto. */
const MAX_TOKEN_ASSOLUTO = 16_000;

/** Quanto costa una cella, in token di uscita. Misurato: 1.833 token per
 *  sei righe da sette colonne, cioè ~44 a cella. Arrotondato in alto. */
const TOKEN_PER_CELLA = 50;

/** Quante righe ci stanno, al massimo, in una pagina fitta di registro. */
const RIGHE_PER_PAGINA = 30;

/**
 * IL TETTO DI TOKEN, calcolato invece che fissato.
 *
 * ═══ PERCHÉ NON BASTA UN NUMERO ═══
 * Una bolletta produce dieci campi e sta in duemila token. Un registro di
 * manutenzione di venti righe ne produce SEIMILA — misurato, non
 * supposto: 305 token a riga su sette colonne. Con un tetto fisso a
 * quattromila la risposta si tronca a metà, lo schema non la accetta, il
 * cliente legge «riprova» e riprovare fallisce identico. Un vicolo cieco
 * silenzioso, proprio sul caso — il registro compilato a mano — che
 * conta di più.
 *
 * Il tetto non costa nulla se non lo si usa: si pagano i token generati,
 * non quelli concessi. Quindi si concede largo e si controlla l'esito.
 */
export function tettoToken(
  forma: "scheda" | "tabella",
  pagine: number,
  colonne: number,
): number {
  if (forma === "scheda") return MAX_TOKEN_PREDEFINITO;
  const stimato =
    2000 + Math.max(1, pagine) * RIGHE_PER_PAGINA * colonne * TOKEN_PER_CELLA;
  return Math.min(MAX_TOKEN_ASSOLUTO, Math.max(MAX_TOKEN_PREDEFINITO, stimato));
}

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
  /**
   * Un modello imposto da fuori. Normalmente VUOTO: la scelta la fa
   * `livelli.ts` per compito. Serve a bloccare tutto su un modello solo
   * per un confronto o per un incidente — e in quel caso l'escalation si
   * spegne, perché sarebbe una scelta che ne scavalca un'altra.
   */
  modelloForzato: string | null;
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
    modelloForzato: scelto && scelto.length > 0 ? scelto : null,
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
