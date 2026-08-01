import "server-only";

/**
 * Configurazione del motore di estrazione documenti (SPEC §6).
 *
 * Il modello NON è fissato nel codice: si cambia da variabile d'ambiente, senza
 * deploy. La scelta definitiva è rimandata alla fase 2, quando si potrà misurare
 * accuratezza e costo su bollette italiane reali — un estrattore di dati da PDF
 * si valuta sui documenti veri, non a tavolino.
 *
 * La specifica cita `claude-sonnet-4-6` (ID valido). Il default qui sotto è il
 * modello di punta attuale, così il benchmark parte dal tetto di qualità e poi
 * si scende cercando il punto di equilibrio con il costo.
 */

const DEFAULT_EXTRACTION_MODEL = "claude-opus-4-8";

/** Limite di dimensione upload, SPEC §6. */
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

export type ExtractionConfig = {
  model: string;
  maxTokens: number;
  /** Candidati da confrontare nel benchmark di fase 2. */
  benchmarkCandidates: readonly string[];
};

export function extractionConfig(): ExtractionConfig {
  return {
    model: process.env.ANTHROPIC_EXTRACTION_MODEL ?? DEFAULT_EXTRACTION_MODEL,
    maxTokens: Number(process.env.ANTHROPIC_EXTRACTION_MAX_TOKENS ?? 2000),
    benchmarkCandidates: [
      "claude-opus-4-8",
      "claude-sonnet-5",
      "claude-sonnet-4-6",
      "claude-haiku-4-5",
    ],
  };
}
