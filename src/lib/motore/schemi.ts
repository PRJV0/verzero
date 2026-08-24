import { z } from "zod";

/**
 * GLI SCHEMI DI ESTRAZIONE DEL MOTORE (docs/motore.md §2, §4).
 *
 * Ogni valore estratto viaggia dentro un involucro, non nudo. Sembra
 * pesante ed è il punto: un numero da solo non si può verificare, e un
 * numero che non si può verificare non ha titolo per entrare in un
 * documento che il cliente porta in banca. L'involucro porta:
 *
 *   nome          — quale campo è (dall'elenco dichiarato del tipo);
 *   valore        — vuoto se non è leggibile CON CERTEZZA (§4.1);
 *   confidenza    — per campo, mai per documento (§4.3): in una bolletta
 *                   il POD si legge benissimo mentre le fasce stanno in
 *                   una tabella storta, e una confidenza media
 *                   nasconderebbe proprio quella che serve;
 *   pagina        — dove si va a controllare (§4.2);
 *   estrattoDa    — la stringa così com'è scritta nel documento: è la
 *                   prova che il valore è stato letto e non dedotto;
 *   fonteLettura  — testo | immagine | manoscritto. Il terzo ha un tetto
 *                   di confidenza imposto dal NOSTRO codice, non chiesto
 *                   al modello (§3, regola inviolabile);
 *   nota          — perché è vuoto, o cosa c'è di strano.
 *
 * ═══ PERCHÉ UN ELENCO E NON UN CAMPO PER PROPRIETÀ ═══
 * La forma naturale sarebbe `{ pod: {...}, consumo: {...} }`. L'abbiamo
 * scritta così e l'API l'ha rifiutata con un 400 preciso: uno schema di
 * structured output ammette **al massimo 16 parametri con tipo unione**,
 * e dieci campi annullabili per quattro proprietà annullabili fanno
 * quaranta. Il limite esiste per un motivo — il costo di compilazione
 * cresce in modo esponenziale — quindi non è un ostacolo da aggirare ma
 * un vincolo di cui tenere conto.
 *
 * L'elenco lo rispetta con zero unioni: nessun campo è annullabile,
 * perché «non letto» si dice con la **stringa vuota**. In cambio si
 * guadagna una cosa che serviva comunque: la forma è la stessa per ogni
 * tipo di documento-FONTE, e aggiungere un tipo significa dichiarare le
 * sue chiavi — non scrivere un altro schema annidato.
 */

export const FONTI_LETTURA = ["testo", "immagine", "manoscritto"] as const;
export type FonteLettura = (typeof FONTI_LETTURA)[number];

export const QUALITA = ["leggibile", "faticosa", "illeggibile"] as const;
export type Qualita = (typeof QUALITA)[number];

/** Che cosa ci si aspetta dentro un campo: guida la canonicalizzazione. */
export type TipoValore = "testo" | "numero" | "data" | "scelta";

export type EtichettaCampo = {
  chiave: string;
  /** Come si chiama davanti al cliente. */
  etichetta: string;
  tipo: TipoValore;
  unita?: string;
  /** I campi senza i quali l'estrazione non è servita a niente. */
  essenziale?: boolean;
};

/** L'involucro, uguale per ogni documento-FONTE. Nessuna unione dentro. */
export function schemaFonte<T extends string>(chiavi: readonly [T, ...T[]]) {
  return z.object({
    nome: z.enum(chiavi),
    /** Vuoto = non leggibile con certezza. Mai un valore inventato. */
    valore: z.string(),
    confidenza: z.number().min(0).max(1),
    /** Zero quando la pagina non si sa: non esiste una pagina zero. */
    pagina: z.number().int().min(0),
    estrattoDa: z.string(),
    fonteLettura: z.enum(FONTI_LETTURA),
    nota: z.string(),
  });
}

export type CampoGrezzo = {
  nome: string;
  valore: string;
  confidenza: number;
  pagina: number;
  estrattoDa: string;
  fonteLettura: FonteLettura;
  nota: string;
};

/* ------------------------------------------------------------------ */
/* Bolletta elettrica                                                  */
/* ------------------------------------------------------------------ */

export const CAMPI_BOLLETTA_ELETTRICA: EtichettaCampo[] = [
  { chiave: "pod", etichetta: "Codice POD", tipo: "testo", essenziale: true },
  { chiave: "fornitore", etichetta: "Fornitore", tipo: "testo" },
  { chiave: "periodoInizio", etichetta: "Periodo dal", tipo: "data", essenziale: true },
  { chiave: "periodoFine", etichetta: "Periodo al", tipo: "data", essenziale: true },
  {
    chiave: "consumoTotaleKwh",
    etichetta: "Consumo del periodo",
    tipo: "numero",
    unita: "kWh",
    essenziale: true,
  },
  { chiave: "consumoF1Kwh", etichetta: "di cui fascia F1", tipo: "numero", unita: "kWh" },
  { chiave: "consumoF2Kwh", etichetta: "di cui fascia F2", tipo: "numero", unita: "kWh" },
  { chiave: "consumoF3Kwh", etichetta: "di cui fascia F3", tipo: "numero", unita: "kWh" },
  { chiave: "importoEuro", etichetta: "Importo della bolletta", tipo: "numero", unita: "€" },
  {
    chiave: "energiaRinnovabile",
    etichetta: "Energia rinnovabile dichiarata",
    tipo: "scelta",
  },
];

const CHIAVI_BOLLETTA = CAMPI_BOLLETTA_ELETTRICA.map((c) => c.chiave) as [
  string,
  ...string[],
];

/**
 * `tipoRilevato` è la prima cosa che il modello dichiara, e serve al caso
 * più costoso di tutti: il documento di un altro tipo (§4.5). Una
 * bolletta del gas letta con lo schema dell'elettrica produce campi vuoti
 * e una mezza verità — meglio accorgersene e dirlo.
 */
export const SchemaBollettaElettrica = z.object({
  tipoRilevato: z.enum([
    "bolletta-elettrica",
    "bolletta-gas",
    "altra-fattura",
    "altro",
  ]),
  qualita: z.enum(QUALITA),
  campi: z.array(schemaFonte(CHIAVI_BOLLETTA)),
  /** Più POD nello stesso documento: i totali non sono di un contatore solo. */
  piuPod: z.boolean(),
  /** Conguagli, letture stimate, note di credito: quello che va detto. */
  avvertenze: z.array(z.string()),
});

export type BollettaElettrica = z.infer<typeof SchemaBollettaElettrica>;
