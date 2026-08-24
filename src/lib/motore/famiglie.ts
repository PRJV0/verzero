import type { z } from "zod";

import {
  CAMPI_BOLLETTA_ELETTRICA,
  SchemaBollettaElettrica,
  type EtichettaCampo,
} from "./schemi";

/**
 * IL REGISTRO: tipo documento → famiglia → schema (docs/motore.md §2).
 *
 * Due famiglie, e la famiglia decide il tipo di lavoro — non il tipo di
 * file, che è sempre un PDF o una foto:
 *
 *   FONTE — bollette, visure, registri, tabelle: se ne estraggono DATI
 *           PUNTUALI, e l'uscita è un insieme di campi con confidenza e
 *           provenienza.
 *   OPERA — manuali, procedure, documenti già redatti: se ne estrae la
 *           STRUTTURA (indice, designazioni citate, responsabilità), per
 *           l'analisi degli scostamenti e la rigenerazione.
 *
 * Trattarle con lo stesso codice «perché tanto è sempre estrazione»
 * significa scoprire alla terza famiglia che la pipeline non ci sta: la
 * prima produce righe di campi, la seconda un albero e un elenco di
 * scostamenti. Diverso schema, diversa validazione, diverso posto in
 * banca dati, diversa faccia nel portale.
 *
 * ═══ ESTENDERE ═══
 * Una riga qui, più il suo schema Zod. Nessun ramo condizionale altrove:
 * chi estrae RICEVE lo schema, non lo conosce. I tipi assenti da questo
 * registro non sono un errore — restano archiviati e smistati come oggi
 * (il chip «alimenta …» funziona già), semplicemente non si leggono. È la
 * condizione di partenza di tutti tranne uno, e va detta al cliente
 * invece di lasciargli credere il contrario.
 */

export type Famiglia = "fonte" | "opera";

export type VoceMotore = {
  /** La chiave di `TIPI_DOCUMENTO` in src/lib/documenti.ts. */
  tipo: string;
  famiglia: Famiglia;
  schema: z.ZodTypeAny;
  /**
   * La versione dello schema entra nella chiave di idempotenza e nel log
   * tecnico: senza, una rilettura dopo un cambio di schema è
   * indistinguibile da una rilettura inutile, e i confronti fra due
   * versioni del prompt non si possono fare.
   */
  versione: string;
  /** Le etichette dei campi per il portale. */
  campi: EtichettaCampo[];
  /** Come si chiama il documento nelle frasi rivolte al cliente. */
  nome: string;
  /**
   * L'intensità del ragionamento. FONTE è lettura: media basta. OPERA è
   * confronto strutturale e chiede di più (docs/motore.md §9).
   */
  effort: "low" | "medium" | "high";
};

export const REGISTRO_MOTORE: VoceMotore[] = [
  {
    tipo: "bolletta-elettrica",
    famiglia: "fonte",
    schema: SchemaBollettaElettrica,
    versione: "bolletta-elettrica/1",
    campi: CAMPI_BOLLETTA_ELETTRICA,
    nome: "bolletta di energia elettrica",
    effort: "medium",
  },
];

const PER_TIPO = new Map(REGISTRO_MOTORE.map((v) => [v.tipo, v]));

/** La voce del registro per un tipo, se quel tipo si sa leggere. */
export function voceMotore(tipo: string | null | undefined) {
  return tipo ? PER_TIPO.get(tipo) : undefined;
}

/** Si sa leggere questo tipo di documento, oggi? */
export function siSaLeggere(tipo: string | null | undefined): boolean {
  return voceMotore(tipo) !== undefined;
}
