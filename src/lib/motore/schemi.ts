import { z } from "zod";

/**
 * GLI SCHEMI DI ESTRAZIONE DEL MOTORE (docs/motore.md §2, §4).
 *
 * ═══ DUE FORME, NON UNA ═══
 * La bolletta ci ha ingannati: è una SCHEDA, un insieme di campi fissi
 * (un POD, un periodo, un totale). Ma la maggior parte dei documenti che
 * una PMI ha in casa è una TABELLA — un registro di formazione con venti
 * partecipanti, un registro di manutenzione con trenta interventi, i dati
 * di organico per genere e inquadramento, un organigramma con quindici
 * ruoli. Righe ripetute della stessa forma.
 *
 *   SCHEDA  → campi fissi, una volta sola      (bolletta, visura)
 *   TABELLA → N righe della stessa forma       (formazione, organico)
 *
 * Trattare una tabella come scheda significherebbe inventare chiavi
 * («partecipante1», «partecipante2») o perdere le righe oltre la prima.
 *
 * ═══ L'INVOLUCRO: DOVE STA LA VERIFICABILITÀ ═══
 * Nessun valore viaggia nudo. Un numero da solo non si può verificare, e
 * un numero che non si può verificare non ha titolo per entrare in un
 * documento che il cliente porta in banca. Ogni valore porta con sé:
 * confidenza, PAGINA, la stringa come appare nel documento, la fonte di
 * lettura (testo | immagine | manoscritto) e una nota.
 *
 * Nelle SCHEDE l'involucro è per campo (docs/motore.md §4.3). Nelle
 * TABELLE è **per riga**, ed è una deviazione deliberata: un registro di
 * venti righe per sei colonne farebbe centoventi involucri, un'uscita
 * enorme e un'interfaccia di conferma inutilizzabile. La riga è l'unità
 * naturale — è la riga che si legge sul foglio, è la riga che il cliente
 * conferma con un gesto. Quando UNA cella è incerta, il modello abbassa
 * la confidenza della riga e nomina la colonna nella nota.
 *
 * ═══ PERCHÉ UN ELENCO E NON UN CAMPO PER PROPRIETÀ ═══
 * La forma naturale sarebbe `{ pod: {...}, consumo: {...} }`. L'API l'ha
 * rifiutata con un 400 preciso: uno schema di structured output ammette
 * **al massimo 16 parametri con tipo unione**, e dieci campi annullabili
 * per quattro proprietà annullabili fanno quaranta. L'elenco rispetta il
 * limite con zero unioni — «non letto» si dice con la stringa vuota — e
 * in cambio la forma è identica per ogni tipo di documento.
 */

export const FONTI_LETTURA = ["testo", "immagine", "manoscritto"] as const;
export type FonteLettura = (typeof FONTI_LETTURA)[number];

export const QUALITA = ["leggibile", "faticosa", "illeggibile"] as const;
export type Qualita = (typeof QUALITA)[number];

/** Che cosa ci si aspetta dentro un valore: guida la canonicalizzazione. */
export type TipoValore = "testo" | "numero" | "data" | "scelta";

export type EtichettaCampo = {
  chiave: string;
  /** Come si chiama davanti al cliente. */
  etichetta: string;
  tipo: TipoValore;
  unita?: string;
  /** I campi senza i quali l'estrazione non è servita a niente. */
  essenziale?: boolean;
  /** Per le scelte: i valori ammessi, detti al modello. */
  valori?: string[];

  /* ── I VINCOLI, dichiarati e non scritti in codice ─────────────── */
  /**
   * Il controllo di plausibilità generico li applica da solo
   * (`verificaGenerica`). È la ragione per cui un ambito nuovo — Modello
   * 231, privacy, sicurezza informatica — non ha bisogno di scrivere un
   * verificatore: dichiara i suoi limiti qui e la pipeline li fa
   * rispettare senza sapere di che dominio si tratti.
   */
  min?: number;
  max?: number;
  /** Espressione regolare che il valore deve rispettare. */
  formato?: string;
  /** Come dirlo al cliente quando il formato non torna. */
  formatoNota?: string;
  /** Questo valore non può superare quello di un'altra colonna. */
  nonSupera?: string;
  /** La data non può cadere fuori dall'anno di rendicontazione. */
  dentroLAnno?: boolean;
  /**
   * Il valore non può portare cifre che nella citazione non ci sono.
   *
   * Le DATE lo sono sempre, senza doverlo dichiarare: una data si legge,
   * e l'anno mancante completato dal modello è il caso da manuale
   * (`completatoOltreLaFonte` in plausibilita.ts, misurato su un
   * registro vero). Per i numeri va dichiarato, perché alcuni si
   * ricavano legittimamente dal documento senza esserci scritti — le ore
   * di un corso stanno fra ingresso e uscita, i partecipanti si contano
   * dalle firme. Importi, consumi e periodi invece si LEGGONO: lì va
   * messo, e non costa niente metterlo.
   */
  soloSeScritto?: boolean;
};

type Chiavi = readonly [string, ...string[]];

const chiaviDi = (campi: EtichettaCampo[]): Chiavi =>
  campi.map((c) => c.chiave) as unknown as Chiavi;

/* ------------------------------------------------------------------ */
/* Forma SCHEDA — campi fissi                                          */
/* ------------------------------------------------------------------ */

function involucro(chiavi: Chiavi) {
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

/** Che documento è davvero: il caso più costoso è quello sbagliato (§4.5). */
const TIPI_RILEVABILI = [
  "atteso",
  "altro-documento-dello-stesso-genere",
  "altro",
] as const;

/**
 * `extra` sono i campi propri di un tipo che non stanno nell'elenco dei
 * valori estratti perché non sono valori: `piuPod` non è un dato della
 * bolletta, è un'avvertenza sulla bolletta. Restano pochi e senza unioni,
 * per non riavvicinarsi al limite dei 16 parametri.
 */
export function schemaScheda(campi: EtichettaCampo[], extra: z.ZodRawShape = {}) {
  return z.object({
    ...extra,
    /** «atteso» = è il documento che gli abbiamo detto di aspettarsi. */
    tipoRilevato: z.enum(TIPI_RILEVABILI),
    /** Che cosa è, se non è quello atteso: parole sue, per il cliente. */
    tipoEffettivo: z.string(),
    qualita: z.enum(QUALITA),
    campi: z.array(involucro(chiaviDi(campi))),
    /**
     * LE AVVERTENZE — al massimo quattro, e l'ordine lo decidiamo noi.
     *
     * Non sono una stringa ma una coppia, perché servono due
     * informazioni diverse: che cosa c'è da sapere, e se comporta
     * qualcosa DA FARE. Misurato su un registro compilato a mano: ne
     * uscivano sette in una lettura e nove in un'altra, tutte
     * ragionevoli e tutte insieme — e sette righe su una lettura sola
     * nessuno le legge. Le utili erano le prime due o tre, ma «prime»
     * secondo l'ordine in cui il modello se le ricordava, che non è un
     * ordine.
     *
     * Quindi qui si dichiara `azione`, e a mettere in fila ci pensa
     * `estrazione.ts`: prima ciò che chiede un gesto al cliente, poi ciò
     * che serve solo a sapere. L'ordinamento e il taglio stanno nel
     * nostro codice — chiedere al modello di ordinare per importanza
     * significa fidarsi del suo giudizio su quale sia l'importanza.
     */
    avvertenze: z.array(
      z.object({
        testo: z.string(),
        /** Vero se il cliente deve FARE qualcosa: controllare un valore,
         *  procurare un documento, correggere una cifra. Falso se è solo
         *  da sapere. */
        azione: z.boolean(),
      }),
    ),
    /**
     * LE NOTE SCRITTE DAL CLIENTE, se il documento ne ha.
     *
     * Non sono un'avvertenza: quelle sono nostre e parlano di com'è
     * andata la lettura («la grafia non è agevole», «un orario è
     * interpretato»). Queste sono CONTENUTO del documento — la riga in
     * fondo a un registro che dice come si è svolto il corso, l'annotazione
     * a margine di una bolletta. Mescolarle agli avvisi di qualità le
     * trasformava in un problema, mentre sono la voce di chi ha compilato
     * il foglio, e in pagina vanno mostrate come una citazione.
     *
     * Si riportano PAROLA PER PAROLA, per quanto la grafia lo permette:
     * riassumerle vorrebbe dire farle dire da noi.
     */
    noteLibere: z.array(z.string()),
  });
}

/* ------------------------------------------------------------------ */
/* Forma TABELLA — righe ripetute                                      */
/* ------------------------------------------------------------------ */

export type RigaGrezza = {
  celle: { colonna: string; valore: string }[];
  confidenza: number;
  pagina: number;
  estrattoDa: string;
  fonteLettura: FonteLettura;
  nota: string;
};

export function schemaTabella(
  colonne: EtichettaCampo[],
  extra: z.ZodRawShape = {},
) {
  return z.object({
    ...extra,
    tipoRilevato: z.enum(TIPI_RILEVABILI),
    tipoEffettivo: z.string(),
    qualita: z.enum(QUALITA),
    righe: z.array(
      z.object({
        celle: z.array(
          z.object({
            colonna: z.enum(chiaviDi(colonne)),
            valore: z.string(),
          }),
        ),
        /** Della RIGA: v. la nota in testa al file. */
        confidenza: z.number().min(0).max(1),
        pagina: z.number().int().min(0),
        /** La riga come appare sul foglio: è la prova di cosa c'era. */
        estrattoDa: z.string(),
        fonteLettura: z.enum(FONTI_LETTURA),
        /** Quale cella è incerta, e perché. */
        nota: z.string(),
      }),
    ),
    /**
     * LE AVVERTENZE — al massimo quattro, e l'ordine lo decidiamo noi.
     *
     * Non sono una stringa ma una coppia, perché servono due
     * informazioni diverse: che cosa c'è da sapere, e se comporta
     * qualcosa DA FARE. Misurato su un registro compilato a mano: ne
     * uscivano sette in una lettura e nove in un'altra, tutte
     * ragionevoli e tutte insieme — e sette righe su una lettura sola
     * nessuno le legge. Le utili erano le prime due o tre, ma «prime»
     * secondo l'ordine in cui il modello se le ricordava, che non è un
     * ordine.
     *
     * Quindi qui si dichiara `azione`, e a mettere in fila ci pensa
     * `estrazione.ts`: prima ciò che chiede un gesto al cliente, poi ciò
     * che serve solo a sapere. L'ordinamento e il taglio stanno nel
     * nostro codice — chiedere al modello di ordinare per importanza
     * significa fidarsi del suo giudizio su quale sia l'importanza.
     */
    avvertenze: z.array(
      z.object({
        testo: z.string(),
        /** Vero se il cliente deve FARE qualcosa: controllare un valore,
         *  procurare un documento, correggere una cifra. Falso se è solo
         *  da sapere. */
        azione: z.boolean(),
      }),
    ),
    /**
     * LE NOTE SCRITTE DAL CLIENTE, se il documento ne ha.
     *
     * Non sono un'avvertenza: quelle sono nostre e parlano di com'è
     * andata la lettura («la grafia non è agevole», «un orario è
     * interpretato»). Queste sono CONTENUTO del documento — la riga in
     * fondo a un registro che dice come si è svolto il corso, l'annotazione
     * a margine di una bolletta. Mescolarle agli avvisi di qualità le
     * trasformava in un problema, mentre sono la voce di chi ha compilato
     * il foglio, e in pagina vanno mostrate come una citazione.
     *
     * Si riportano PAROLA PER PAROLA, per quanto la grafia lo permette:
     * riassumerle vorrebbe dire farle dire da noi.
     */
    noteLibere: z.array(z.string()),
  });
}

/* ================================================================== */
/* I CAMPI, per tipo di documento                                      */
/* ================================================================== */

/* ── Bolletta elettrica — SCHEDA ─────────────────────────────────── */

export const CAMPI_BOLLETTA_ELETTRICA: EtichettaCampo[] = [
  {
    chiave: "pod",
    etichetta: "Codice POD",
    tipo: "testo",
    essenziale: true,
    formato: "^IT\\d{3}E[0-9A-Z]{8}$",
    formatoNota:
      "Il codice POD non ha la forma attesa (IT, tre cifre, E, otto caratteri): controllalo.",
  },
  { chiave: "fornitore", etichetta: "Fornitore", tipo: "testo" },
  { chiave: "periodoInizio", etichetta: "Periodo dal", tipo: "data", essenziale: true },
  { chiave: "periodoFine", etichetta: "Periodo al", tipo: "data", essenziale: true },
  {
    chiave: "consumoTotaleKwh",
    etichetta: "Consumo del periodo",
    tipo: "numero",
    unita: "kWh",
    essenziale: true,
    soloSeScritto: true,
    min: 0,
    max: 50_000_000,
  },
  { chiave: "consumoF1Kwh", etichetta: "di cui fascia F1", tipo: "numero", unita: "kWh", min: 0, max: 50_000_000, soloSeScritto: true },
  { chiave: "consumoF2Kwh", etichetta: "di cui fascia F2", tipo: "numero", unita: "kWh", min: 0, max: 50_000_000, soloSeScritto: true },
  { chiave: "consumoF3Kwh", etichetta: "di cui fascia F3", tipo: "numero", unita: "kWh", min: 0, max: 50_000_000, soloSeScritto: true },
  { chiave: "importoEuro", etichetta: "Importo della bolletta", tipo: "numero", unita: "€", max: 5_000_000, soloSeScritto: true },
  {
    chiave: "energiaRinnovabile",
    etichetta: "Energia rinnovabile dichiarata",
    tipo: "scelta",
    valori: ["si", "no", "non-dichiarato"],
  },
];

/* ── Visura camerale — SCHEDA ────────────────────────────────────── */

export const CAMPI_VISURA: EtichettaCampo[] = [
  { chiave: "ragioneSociale", etichetta: "Denominazione", tipo: "testo", essenziale: true },
  { chiave: "partitaIva", etichetta: "Partita IVA", tipo: "testo", essenziale: true },
  { chiave: "codiceFiscale", etichetta: "Codice fiscale", tipo: "testo" },
  { chiave: "formaGiuridica", etichetta: "Forma giuridica", tipo: "testo" },
  { chiave: "sedeLegale", etichetta: "Sede legale", tipo: "testo", essenziale: true },
  {
    chiave: "ateco",
    etichetta: "Codice ATECO prevalente",
    tipo: "testo",
    essenziale: true,
    formato: "^\\d{2}(\\.\\d{1,2}){0,2}$",
    formatoNota: "Non ha la forma di un codice ATECO (per esempio 25.62.00).",
  },
  { chiave: "addetti", etichetta: "Addetti dichiarati", tipo: "numero", min: 0, max: 500_000 },
  { chiave: "atecoDescrizione", etichetta: "Attività prevalente", tipo: "testo" },
  { chiave: "dataCostituzione", etichetta: "Data di costituzione", tipo: "data" },
  { chiave: "reaNumero", etichetta: "Numero REA", tipo: "testo" },
  { chiave: "capitaleSociale", etichetta: "Capitale sociale", tipo: "numero", unita: "€", min: 0 },
  { chiave: "pec", etichetta: "PEC", tipo: "testo" },
];

/* ── Organigramma e deleghe — TABELLA (famiglia OPERA) ───────────── */

/**
 * Si estraggono RUOLI e responsabilità, non le persone: il nome di un
 * dipendente è un dato personale che al manuale non serve. Se il
 * documento porta i nomi, il modello ha istruzione di lasciarli fuori —
 * la casella `persona` esiste solo perché in una PMI il ruolo spesso è
 * scritto come «Sig. Rossi — responsabile produzione», e serve poter
 * dire al cliente da dove abbiamo ricavato il ruolo.
 */
export const COLONNE_ORGANIGRAMMA: EtichettaCampo[] = [
  { chiave: "ruolo", etichetta: "Ruolo o funzione", tipo: "testo", essenziale: true },
  { chiave: "responsabilita", etichetta: "Responsabilità", tipo: "testo" },
  { chiave: "riportaA", etichetta: "Riporta a", tipo: "testo" },
  {
    chiave: "delega",
    etichetta: "Delega formale",
    tipo: "scelta",
    valori: ["si", "no", "non-dichiarato"],
  },
  { chiave: "ambito", etichetta: "Ambito della delega", tipo: "testo" },
];

/* ── Dati di organico aggregati — TABELLA ────────────────────────── */

/**
 * Il cuore della UNI/PdR 125 e degli indicatori sociali VSME: organico
 * per GENERE e INQUADRAMENTO, in forma aggregata.
 *
 * ═══ MAI NOMINATIVI ═══ Se il documento caricato è un libro unico o un
 * elenco nominativo, il modello ha istruzione di aggregare e di NON
 * riportare nomi. Una riga per combinazione categoria × genere: è la
 * forma in cui la prassi chiede i numeri, ed è anche quella che rende
 * impossibile risalire alla singola persona.
 */
export const COLONNE_ORGANICO: EtichettaCampo[] = [
  {
    chiave: "categoria",
    etichetta: "Inquadramento",
    tipo: "testo",
    essenziale: true,
  },
  {
    chiave: "genere",
    etichetta: "Genere",
    tipo: "scelta",
    valori: ["donne", "uomini", "altro", "non-dichiarato"],
    essenziale: true,
  },
  { chiave: "numero", etichetta: "Numero di addetti", tipo: "numero", essenziale: true, min: 0 },
  {
    chiave: "tempoIndeterminato",
    etichetta: "di cui a tempo indeterminato",
    tipo: "numero",
    min: 0,
    nonSupera: "numero",
  },
  { chiave: "partTime", etichetta: "di cui part time", tipo: "numero", min: 0, nonSupera: "numero" },
  {
    chiave: "retribuzioneMediaLorda",
    etichetta: "Retribuzione media lorda annua",
    tipo: "numero",
    unita: "€",
  },
  { chiave: "eta", etichetta: "Fascia d'età", tipo: "testo" },
];

/* ── Registri di formazione e fogli firma — TABELLA ──────────────── */

export const COLONNE_FORMAZIONE: EtichettaCampo[] = [
  { chiave: "corso", etichetta: "Corso o argomento", tipo: "testo", essenziale: true },
  { chiave: "data", etichetta: "Data", tipo: "data", essenziale: true, dentroLAnno: true },
  { chiave: "oreTotali", etichetta: "Ore", tipo: "numero", min: 0.5, max: 500 },
  {
    chiave: "partecipanti",
    etichetta: "Partecipanti",
    tipo: "numero",
    essenziale: true,
    min: 1,
  },
  {
    chiave: "partecipantiDonne",
    etichetta: "di cui donne",
    tipo: "numero",
    min: 0,
    nonSupera: "partecipanti",
  },
  { chiave: "categoria", etichetta: "Inquadramento dei partecipanti", tipo: "testo" },
  {
    chiave: "ambito",
    etichetta: "Ambito",
    tipo: "scelta",
    valori: [
      "sicurezza",
      "qualita",
      "ambiente",
      "parita-e-inclusione",
      "tecnico-professionale",
      "altro",
    ],
  },
  { chiave: "docente", etichetta: "Docente o ente formatore", tipo: "testo" },
];

/* ------------------------------------------------------------------ */
/* Campi propri di un tipo, che non sono valori estratti               */
/* ------------------------------------------------------------------ */

/**
 * Più POD nello stesso documento: non è un dato della bolletta, è
 * un'avvertenza SULLA bolletta — i totali potrebbero riguardare più
 * contatori insieme, e allora ogni valore va guardato due volte.
 */
export const EXTRA_BOLLETTA = { piuPod: z.boolean() };
