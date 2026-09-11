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

  /**
   * Il valore si può legittimamente RICAVARE da altri valori del
   * documento, invece di esserci scritto: le ore di un corso stanno fra
   * l'ingresso e l'uscita, i partecipanti si contano dalle firme.
   *
   * Azzerarli sarebbe rifiutare una deduzione utile; lasciarli passare
   * come dati letti sarebbe peggio, perché il cliente non distingue più
   * quello che ha detto il suo documento da quello che abbiamo ricavato
   * noi. Misurato su un registro presenze: tutte e tre le letture hanno
   * scritto `oreTotali: 4` — corretto, dedotto da 9:00-13:00, e sul
   * foglio quel 4 non c'è da nessuna parte.
   *
   * Quindi: se il valore NON è attestato nella citazione, si tiene e si
   * marca. La marcatura viaggia negli `avvisi`, che sono già persistiti
   * e già mostrati nella scheda di conferma.
   */
  calcolabile?: boolean;

  /**
   * Il valore si accetta solo se nella citazione compare uno di questi
   * indizi.
   *
   * Nasce dal campo «di cui donne» di un registro presenze: il genere
   * non si deduce dai nomi — sarebbe un'attribuzione arbitraria su
   * persone reali — e il divieto viveva SOLO nelle istruzioni al
   * modello. Un divieto nel prompt è una richiesta; qui diventa un
   * vincolo. Vale per qualunque campo ricavabile da attributi personali.
   */
  richiedeIndizio?: readonly string[];
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
  celle: {
    colonna: string;
    valore: string;
    /** Per cella. Assenti sui documenti letti con lo schema vecchio:
     *  lì si ripiega su quelli della riga. */
    confidenza?: number;
    estrattoDa?: string;
    fonteLettura?: FonteLettura;
  }[];
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
        /**
         * ═══ LA VERIFICABILITÀ STA NELLA CELLA ═══
         *
         * Prima confidenza, fonte e citazione erano della RIGA e si
         * ripetevano identiche su tutte le sue celle. Su un registro
         * presenze questo faceva due danni misurati:
         *
         *   · il presidio sui valori calcolati NON SCATTAVA. La citazione
         *     di riga è un sacchetto di cifre — «Ingresso 9:00 Uscita
         *     13:00, 4 righe firmate» — in cui il «4» di `oreTotali` si
         *     trova comunque, anche se sul foglio quel 4 non è scritto da
         *     nessuna parte. Con la citazione della CELLA il confronto
         *     torna onesto.
         *   · una riga con una data illeggibile e quattro celle stampate
         *     perfette prendeva 0,52 dappertutto: il cliente non poteva
         *     sapere QUALE cella guardare, e le controllava tutte.
         *
         * `estrattoDa` per cella è anche ciò che rende confermabile un
         * registro di venti righe in un minuto: si conferma in blocco
         * quello che è certo e si guarda solo ciò che non lo è.
         */
        celle: z.array(
          z.object({
            colonna: z.enum(chiaviDi(colonne)),
            valore: z.string(),
            /** Di QUESTA cella, non della riga. */
            confidenza: z.number().min(0).max(1),
            /** Il pezzo di documento da cui viene QUESTO valore. */
            estrattoDa: z.string(),
            fonteLettura: z.enum(FONTI_LETTURA),
          }),
        ),
        /**
         * Della riga: resta come RIPIEGO. Se il modello non popola la
         * cella — o se si rilegge un documento estratto con lo schema
         * vecchio — si usa questa.
         */
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

/* ── Bolletta del gas — SCHEDA ───────────────────────────────────── */

/**
 * ═══ PERCHÉ NON È LA BOLLETTA ELETTRICA CON UN'ALTRA UNITÀ ═══
 * Tre trappole, tutte capaci di produrre un numero plausibile e
 * sbagliato — che è la forma di errore che ci fa più danno, perché non
 * si vede.
 *
 * 1. PDR ≠ POD. Il PDR del gas è quattordici cifre e basta; il POD
 *    elettrico comincia per IT. Chi legge in fretta scambia i due, e il
 *    formato dichiarato è l'unica cosa che se ne accorge.
 * 2. Smc ≠ mc. Il contatore misura METRI CUBI; la bolletta fattura
 *    STANDARD metri cubi, cioè i metri cubi moltiplicati per il
 *    coefficiente C. Prendere i mc del contatore per Smc sottostima le
 *    emissioni di qualche punto percentuale, in un documento che va in
 *    banca. Si legge quello FATTURATO, e il coefficiente si registra
 *    accanto perché il cliente possa controllare il conto.
 * 3. Il coefficiente C NON si applica da noi. È dichiarato sulla
 *    bolletta; se manca, manca — non lo si stima dall'altitudine del
 *    comune, che è esattamente il genere di deduzione che il presidio
 *    sui valori dedotti esiste per fermare.
 */
export const CAMPI_BOLLETTA_GAS: EtichettaCampo[] = [
  {
    chiave: "pdr",
    etichetta: "Codice PDR",
    tipo: "testo",
    essenziale: true,
    // Quattordici cifre esatte. La regola tiene fuori il POD elettrico,
    // che comincia per lettere, e le matricole del contatore, più corte.
    formato: "^\\d{14}$",
    formatoNota:
      "Il codice PDR non ha la forma attesa (quattordici cifre): controllalo. Attenzione a non prendere il POD dell'energia elettrica, che comincia per IT.",
  },
  { chiave: "fornitore", etichetta: "Fornitore", tipo: "testo" },
  { chiave: "periodoInizio", etichetta: "Periodo dal", tipo: "data", essenziale: true },
  { chiave: "periodoFine", etichetta: "Periodo al", tipo: "data", essenziale: true },
  {
    chiave: "consumoSmc",
    etichetta: "Consumo del periodo",
    tipo: "numero",
    unita: "Smc",
    essenziale: true,
    soloSeScritto: true,
    min: 0,
    max: 50_000_000,
  },
  {
    // Il coefficiente C sta quasi sempre in bolletta, in piccolo. Serve a
    // far tornare il conto fra mc letti e Smc fatturati: senza, il
    // cliente non può verificare il numero che gli stiamo attribuendo.
    chiave: "coefficienteC",
    etichetta: "Coefficiente C",
    tipo: "numero",
    min: 0.8,
    max: 1.2,
    soloSeScritto: true,
  },
  {
    chiave: "consumoMc",
    etichetta: "Metri cubi letti al contatore",
    tipo: "numero",
    unita: "mc",
    min: 0,
    max: 50_000_000,
    soloSeScritto: true,
  },
  {
    chiave: "importoEuro",
    etichetta: "Importo della bolletta",
    tipo: "numero",
    unita: "€",
    max: 5_000_000,
    soloSeScritto: true,
  },
  {
    chiave: "tipoLettura",
    etichetta: "Tipo di lettura",
    tipo: "scelta",
    valori: ["effettiva", "stimata", "autolettura", "non-dichiarato"],
  },
];

/* ── Registri e fatture di carburante — TABELLA ──────────────────── */

/**
 * ═══ UNA RIGA PER RIFORNIMENTO, NON PER MEZZO ═══
 * La tentazione è aggregare per targa: un mezzo, un totale. Sarebbe una
 * somma fatta da noi su valori che il documento espone riga per riga —
 * cioè un valore dedotto travestito da valore letto. Le righe si
 * riportano come stanno, e chi somma è il calcolo a valle, dopo la
 * conferma del cliente.
 *
 * ═══ I CHILOMETRI SONO UN CONTATORE, NON UNA DISTANZA ═══
 * Sulle schede carburante la colonna «km» è quasi sempre il CONTACHILOMETRI
 * al momento del rifornimento, non i chilometri percorsi da quello prima.
 * Sono due grandezze diverse e una si ricava dall'altra per differenza:
 * `chilometriPercorsi` è perciò `calcolabile`, così quando il modello la
 * ricava lo dichiara invece di spacciarla per letta.
 *
 * ═══ LA TARGA È UN DATO PERSONALE QUANDO IL MEZZO È DI UNA PERSONA ═══
 * Sui rimborsi chilometrici il «mezzo» è l'auto privata del dipendente, e
 * la targa la identifica. Il campo resta perché sui mezzi aziendali serve
 * a distinguere le righe, ma il modello ha istruzione di non riportare
 * mai il nome di chi guida.
 */
export const COLONNE_CARBURANTI: EtichettaCampo[] = [
  {
    chiave: "data",
    etichetta: "Data",
    tipo: "data",
    essenziale: true,
    dentroLAnno: true,
  },
  {
    chiave: "mezzo",
    etichetta: "Mezzo o impianto",
    tipo: "testo",
  },
  {
    chiave: "tipoCarburante",
    etichetta: "Tipo di carburante",
    tipo: "scelta",
    essenziale: true,
    // I fattori di emissione sono per vettore: un carburante non
    // riconosciuto va detto, non ricondotto al più simile.
    valori: [
      "gasolio",
      "benzina",
      "gpl",
      "metano",
      "elettrico",
      "hvo",
      "altro",
    ],
  },
  {
    chiave: "litri",
    etichetta: "Quantità",
    tipo: "numero",
    unita: "l",
    essenziale: true,
    soloSeScritto: true,
    min: 0,
    // Un pieno da mille litri esiste (una cisterna di cantiere); da
    // centomila no, ed è la virgola letta come separatore di migliaia.
    max: 100_000,
  },
  {
    chiave: "importoEuro",
    etichetta: "Importo",
    tipo: "numero",
    unita: "€",
    min: 0,
    max: 1_000_000,
    soloSeScritto: true,
  },
  {
    chiave: "chilometriContatore",
    etichetta: "Contachilometri",
    tipo: "numero",
    unita: "km",
    min: 0,
    max: 5_000_000,
    soloSeScritto: true,
  },
  {
    chiave: "chilometriPercorsi",
    etichetta: "Chilometri percorsi",
    tipo: "numero",
    unita: "km",
    min: 0,
    max: 200_000,
    calcolabile: true,
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
  // ═══ STESSA REGOLA DELLA FORMAZIONE ═══
  // Qui il genere è la dimensione della riga, e nel caso normale il
  // documento lo scrive in testa alla colonna: la citazione porta
  // «donne» o «uomini» e il campo passa. Il caso che questa guardia
  // ferma è l'altro — un libro unico nominativo che il modello aggrega
  // deducendo il genere dai nomi delle persone. Le istruzioni glielo
  // vietano già; questo lo rende un vincolo.
  {
    chiave: "genere",
    etichetta: "Genere",
    tipo: "scelta",
    valori: ["donne", "uomini", "altro", "non-dichiarato"],
    essenziale: true,
    richiedeIndizio: [
      "genere",
      "sesso",
      "donne",
      "uomini",
      "femmine",
      "maschi",
      "m/f",
      "f/m",
      "non-dichiarato",
    ],
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
  // Le istruzioni dicono già «non calcolarla tu da dati individuali».
  // Calcolarla vorrebbe dire fare una media su retribuzioni di persone
  // singole, cioè trattare esattamente i dati che non vogliamo toccare:
  // questa si LEGGE, e se non c'è non c'è.
  {
    chiave: "retribuzioneMediaLorda",
    etichetta: "Retribuzione media lorda annua",
    tipo: "numero",
    unita: "€",
    soloSeScritto: true,
  },
  { chiave: "eta", etichetta: "Fascia d'età", tipo: "testo" },
];

/* ── Registri di formazione e fogli firma — TABELLA ──────────────── */

export const COLONNE_FORMAZIONE: EtichettaCampo[] = [
  { chiave: "corso", etichetta: "Corso o argomento", tipo: "testo", essenziale: true },
  { chiave: "data", etichetta: "Data", tipo: "data", essenziale: true, dentroLAnno: true },
  // Le ore quasi mai sono scritte: stanno fra l'ingresso e l'uscita, e
  // il modello le ricava. Misurato su un registro vero: tutte e tre le
  // letture hanno scritto 4, e sul foglio quel 4 non c'è.
  {
    chiave: "oreTotali",
    etichetta: "Ore",
    tipo: "numero",
    min: 0.5,
    max: 500,
    calcolabile: true,
  },
  // Su un foglio firma si contano le firme: è una deduzione legittima,
  // e va detto che l'abbiamo fatta noi.
  {
    chiave: "partecipanti",
    etichetta: "Partecipanti",
    tipo: "numero",
    essenziale: true,
    min: 1,
    calcolabile: true,
  },
  // ═══ IL GENERE NON SI DEDUCE DAI NOMI ═══
  // Il divieto viveva solo nelle istruzioni al modello. Su un registro
  // con «Andrea» in mezzo a «Roberta» e «Anna» — Andrea è maschile, ed è
  // la trappola perfetta — bastava che il modello disobbedisse una volta
  // per attribuire un genere a quattro persone reali. Adesso il campo si
  // accetta solo se la citazione porta un'indicazione esplicita.
  {
    chiave: "partecipantiDonne",
    etichetta: "di cui donne",
    tipo: "numero",
    min: 0,
    nonSupera: "partecipanti",
    richiedeIndizio: [
      "genere",
      "sesso",
      "donne",
      "uomini",
      "femmine",
      "maschi",
      "m/f",
      "f/m",
    ],
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

/**
 * Lo stesso problema, col nome del gas: più punti di riconsegna in una
 * bolletta sola. Capita nelle forniture multisito, ed è il caso in cui
 * il consumo totale non è il consumo di NIENTE — non di una sede, non di
 * un impianto: è una somma che nessuna riga dichiara.
 */
export const EXTRA_BOLLETTA_GAS = { piuPdr: z.boolean() };
