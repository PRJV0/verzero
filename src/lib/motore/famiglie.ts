import type { z } from "zod";

import {
  verificaBollettaElettrica,
  verificaOrganico,
  verificaOrganigramma,
  verificaVisura,
  type Verificatore,
} from "./plausibilita";
import {
  CAMPI_BOLLETTA_ELETTRICA,
  CAMPI_VISURA,
  EXTRA_BOLLETTA,
  COLONNE_FORMAZIONE,
  COLONNE_ORGANICO,
  COLONNE_ORGANIGRAMMA,
  schemaScheda,
  schemaTabella,
  type EtichettaCampo,
} from "./schemi";

/**
 * LA TASSONOMIA DOCUMENTALE (docs/motore.md §2, docs/tassonomia.md).
 *
 * Una riga per tipo di documento, e la riga dice tutto: a quale FAMIGLIA
 * appartiene, che FORMA ha, che cosa se ne estrae, che qualità è
 * ragionevole aspettarsi, e — se lo sappiamo già leggere — con quale
 * schema.
 *
 *   FONTE — bollette, visure, registri, tabelle: se ne estraggono DATI
 *           PUNTUALI, e l'uscita sono campi o righe con confidenza e
 *           provenienza.
 *   OPERA — manuali, procedure, verbali, organigrammi: il documento è
 *           già un elaborato, e se ne estrae la STRUTTURA — indice,
 *           designazioni citate, RESPONSABILITÀ, procedure richiamate —
 *           per l'analisi degli scostamenti e la rigenerazione.
 *
 * ═══ DICHIARATO ≠ IMPLEMENTATO, E SI VEDE ═══
 * Un tipo senza `schema` NON è un buco: è archiviato, riconosciuto e
 * smistato come sempre (i chip «alimenta …» funzionano), semplicemente
 * non se ne legge ancora il contenuto. Dichiararlo qui con `estrae` e
 * `attesa` serve a due cose: sapere che cosa manca senza riaprire il
 * discorso da capo, e non lasciar credere al cliente che leggiamo tutto.
 * Implementarne uno significa aggiungere `schema`, `campi`, `versione` —
 * nessun ramo condizionale altrove: chi estrae RICEVE lo schema.
 *
 * L'ordine di implementazione è quello del valore commerciale: prima le
 * bollette (carbon), poi i documenti del cuneo — visura, organigramma,
 * organico, formazione — che aprono parità di genere, VSME e manuali.
 */

export type Famiglia = "fonte" | "opera";

/** SCHEDA = campi fissi. TABELLA = N righe della stessa forma. */
export type Forma = "scheda" | "tabella";

/** Quanto spesso quel tipo arriva in quella condizione. */
export type Frequenza = "prevalente" | "frequente" | "raro" | "mai";

/**
 * L'attesa REALISTICA di qualità. Non è un dettaglio descrittivo: decide
 * quanto lavoro di conferma va progettato attorno a quel tipo. Un
 * registro di manutenzione che arriva quasi sempre a penna ha bisogno
 * della vista affiancata e della conferma per riga; una visura in PDF
 * nativo non ne ha bisogno di nessuna.
 */
export type Attesa = {
  nativo: Frequenza;
  scansione: Frequenza;
  manoscritto: Frequenza;
  /** Che cosa aspettarsi davvero, in una riga. */
  nota: string;
};

export type VoceMotore = {
  /** La chiave di `TIPI_DOCUMENTO` in src/lib/documenti.ts. */
  tipo: string;
  famiglia: Famiglia;
  forma: Forma;
  /** Come si chiama il documento nelle frasi rivolte al cliente. */
  nome: string;
  /** Che cosa se ne estrae, dichiarato anche senza schema. */
  estrae: string[];
  attesa: Attesa;

  /* — Presenti solo quando il tipo si sa leggere — */
  schema?: z.ZodTypeAny;
  /**
   * La versione entra nella chiave di idempotenza e nel log tecnico:
   * senza, una rilettura dopo un cambio di schema è indistinguibile da
   * una rilettura inutile, e due versioni del prompt non si confrontano.
   */
  versione?: string;
  /** Scheda: i campi. Tabella: le colonne di ogni riga. */
  campi?: EtichettaCampo[];
  /** Le istruzioni specifiche del tipo, oltre alle regole generali. */
  istruzioni?: string[];
  /**
   * Un verificatore PROPRIO, solo per i controlli che i vincoli
   * dichiarati non sanno esprimere: la cifra di controllo di una partita
   * IVA, la somma delle fasce che deve dare il totale, un nome di persona
   * finito dentro un ruolo. Tutto il resto — minimi, massimi, formati,
   * «non supera un'altra colonna», «dentro l'anno» — si dichiara nei
   * campi e lo applica `verificaGenerica`, che gira SEMPRE.
   *
   * Un ambito nuovo, di norma, non ne ha bisogno.
   */
  verifica?: Verificatore;
  /**
   * FONTE è lettura e si accontenta di «medium»; OPERA è confronto
   * strutturale e chiede di più (docs/motore.md §9).
   */
  effort?: "low" | "medium" | "high";
};

/* ------------------------------------------------------------------ */
/* Attese ricorrenti, per non ripeterle venti volte                    */
/* ------------------------------------------------------------------ */

const QUASI_SEMPRE_NATIVO: Attesa = {
  nativo: "prevalente",
  scansione: "raro",
  manoscritto: "mai",
  nota: "Lo emette un sistema informatico: arriva quasi sempre in PDF nativo, e si legge in chiaro.",
};

const NATIVO_O_SCANSIONE: Attesa = {
  nativo: "frequente",
  scansione: "frequente",
  manoscritto: "raro",
  nota: "Nasce digitale ma gira spesso come scansione firmata: entrambe le rese vanno messe in conto.",
};

const SPESSO_A_MANO: Attesa = {
  nativo: "raro",
  scansione: "frequente",
  manoscritto: "prevalente",
  nota: "Compilato a mano su modulo prestampato: confidenza ridotta d'ufficio e conferma riga per riga.",
};

const FOGLIO_DI_LAVORO: Attesa = {
  nativo: "prevalente",
  scansione: "raro",
  manoscritto: "raro",
  nota: "Di solito un foglio di calcolo o una stampa da gestionale: nativo, ma con intestazioni di colonna imprevedibili.",
};

/* ================================================================== */
/* IL REGISTRO                                                         */
/* ================================================================== */

export const REGISTRO_MOTORE: VoceMotore[] = [
  /* ══ Bollette e forniture ═══════════════════════════════════════ */
  {
    tipo: "bolletta-elettrica",
    famiglia: "fonte",
    forma: "scheda",
    nome: "bolletta di energia elettrica",
    estrae: [
      "POD e fornitore",
      "periodo di fatturazione",
      "consumo totale e per fascia F1/F2/F3",
      "importo",
      "Garanzia d'Origine dichiarata",
    ],
    attesa: QUASI_SEMPRE_NATIVO,
    schema: schemaScheda(CAMPI_BOLLETTA_ELETTRICA, EXTRA_BOLLETTA),
    versione: "bolletta-elettrica/1",
    campi: CAMPI_BOLLETTA_ELETTRICA,
    verifica: verificaBollettaElettrica,
    effort: "medium",
    istruzioni: [
      "- `pod`: il codice POD del punto di prelievo (forma IT + 3 cifre + E + 8 caratteri). Non confonderlo col PDR, che è del gas.",
      "- `consumoTotaleKwh`: il consumo FATTURATO del periodo in kWh. NON la potenza impegnata, NON la potenza disponibile, NON il consumo annuo di riferimento.",
      "- `consumoF1Kwh`, `consumoF2Kwh`, `consumoF3Kwh`: i consumi per fascia oraria, se il documento li espone. Se espone solo il totale, lascia le fasce vuote: non ripartirle tu.",
      "- `importoEuro`: il totale da pagare della bolletta, IVA compresa.",
      "- `energiaRinnovabile`: «si» SOLO se il documento dichiara esplicitamente energia 100% rinnovabile o Garanzia d'Origine; «no» solo se dichiara esplicitamente il contrario; altrimenti «non-dichiarato».",
      "- In `avvertenze`: conguagli, letture stimate anziché effettive, note di credito, più punti di prelievo nello stesso documento.",
    ],
  },
  {
    tipo: "bolletta-gas",
    famiglia: "fonte",
    forma: "scheda",
    nome: "bolletta del gas",
    estrae: [
      "PDR e fornitore",
      "periodo di fatturazione",
      "consumo in Smc e coefficiente C",
      "importo",
    ],
    attesa: QUASI_SEMPRE_NATIVO,
  },
  {
    tipo: "teleriscaldamento",
    famiglia: "fonte",
    forma: "scheda",
    nome: "bolletta del teleriscaldamento",
    estrae: [
      "identificativo dell'utenza e gestore",
      "periodo",
      "energia termica in kWh o MWh",
      "importo",
    ],
    attesa: QUASI_SEMPRE_NATIVO,
  },
  {
    tipo: "carburanti",
    famiglia: "fonte",
    forma: "tabella",
    nome: "registro o fatture dei carburanti",
    estrae: [
      "una riga per rifornimento: data, tipo di carburante, litri, importo",
      "mezzo o targa quando dichiarata",
      "chilometri percorsi, dove il registro li tiene",
    ],
    attesa: {
      nativo: "frequente",
      scansione: "frequente",
      manoscritto: "frequente",
      nota: "Le schede carburante di flotta sono spesso compilate a mano; le fatture dei consorzi sono native.",
    },
  },

  /* ══ Documenti camerali e societari ═════════════════════════════ */
  {
    tipo: "visura",
    famiglia: "fonte",
    forma: "scheda",
    nome: "visura camerale",
    estrae: [
      "denominazione, partita IVA e codice fiscale",
      "forma giuridica e data di costituzione",
      "sede legale",
      "ATECO prevalente con descrizione",
      "REA, capitale sociale, addetti dichiarati, PEC",
    ],
    attesa: QUASI_SEMPRE_NATIVO,
    schema: schemaScheda(CAMPI_VISURA),
    versione: "visura/1",
    campi: CAMPI_VISURA,
    verifica: verificaVisura,
    effort: "medium",
    istruzioni: [
      "- `partitaIva`: undici cifre, senza il prefisso IT e senza spazi.",
      "- `ateco`: il codice dell'attività PREVALENTE, non le secondarie; riportalo come compare (per esempio 25.62.00).",
      "- `sedeLegale`: indirizzo completo su una riga sola, come scritto nella visura.",
      "- `addetti`: il numero di addetti dichiarato nella visura, se c'è. Non dedurlo da altro.",
      "- NON estrarre nomi di soci, amministratori o persone fisiche: alla scheda impresa non servono e sono dati personali.",
      "- In `avvertenze`: se la visura è storica o non aggiornata, se l'impresa risulta cessata o inattiva.",
    ],
  },
  {
    tipo: "bilancio",
    famiglia: "fonte",
    forma: "scheda",
    nome: "bilancio depositato",
    estrae: [
      "esercizio di riferimento",
      "ricavi, valore della produzione, costo del personale",
      "totale attivo e patrimonio netto",
      "numero medio di dipendenti dalla nota integrativa",
    ],
    attesa: QUASI_SEMPRE_NATIVO,
  },

  /* ══ Organizzazione e persone ═══════════════════════════════════ */
  {
    tipo: "organigramma",
    famiglia: "opera",
    forma: "tabella",
    nome: "organigramma o atto di delega",
    estrae: [
      "una riga per ruolo: funzione, responsabilità, a chi riporta",
      "presenza di delega formale e suo ambito",
      "NON le persone: al manuale serve il ruolo, non il nome",
    ],
    attesa: NATIVO_O_SCANSIONE,
    schema: schemaTabella(COLONNE_ORGANIGRAMMA),
    versione: "organigramma/1",
    campi: COLONNE_ORGANIGRAMMA,
    verifica: verificaOrganigramma,
    effort: "high",
    istruzioni: [
      "Una riga per RUOLO dell'organizzazione, dall'alto verso il basso.",
      "- `ruolo`: la funzione così com'è scritta (Direzione, Responsabile Qualità, RSPP, Preposto…).",
      "- `responsabilita`: che cosa quel ruolo risponde, in una riga, se il documento lo dice.",
      "- `riportaA`: il ruolo sovraordinato, non la persona.",
      "- `delega`: «si» solo se il documento è o richiama un atto di delega formale per quel ruolo.",
      "- ═══ NON RIPORTARE NOMI DI PERSONE ═══ Se una casella dice «Sig. Rossi — Responsabile Produzione», il ruolo è «Responsabile Produzione» e il nome NON va estratto: è un dato personale che al sistema di gestione non serve.",
      "- In `avvertenze`: se l'organigramma non è datato, se ci sono ruoli obbligatori mancanti (per esempio RSPP), se un ruolo compare due volte.",
    ],
  },
  {
    tipo: "organico",
    famiglia: "fonte",
    forma: "tabella",
    nome: "dati di organico aggregati",
    estrae: [
      "una riga per inquadramento × genere",
      "numero di addetti, tempo indeterminato, part time",
      "retribuzione media lorda annua, dove dichiarata",
      "fascia d'età, dove dichiarata",
    ],
    attesa: FOGLIO_DI_LAVORO,
    schema: schemaTabella(COLONNE_ORGANICO),
    versione: "organico/1",
    campi: COLONNE_ORGANICO,
    verifica: verificaOrganico,
    effort: "high",
    istruzioni: [
      "Una riga per ogni combinazione di INQUADRAMENTO e GENERE presente nel documento (per esempio: Impiegati/donne, Impiegati/uomini, Operai/donne…).",
      "- `categoria`: dirigenti, quadri, impiegati, operai, apprendisti — o come li chiama il documento.",
      "- `numero`: quante persone in quella combinazione.",
      "- `retribuzioneMediaLorda`: la retribuzione MEDIA annua lorda di quel gruppo, se il documento la espone. Non calcolarla tu da dati individuali.",
      "- ═══ MAI NOMINATIVI ═══ Se il documento è un elenco per persona (libro unico, cedolini), AGGREGA: una riga per gruppo, e nessun nome, nessuna data di nascita, nessun codice fiscale, nessuna retribuzione individuale. Se un gruppo ha una sola persona, aggregalo comunque e segnalalo in `avvertenze`: un dato riferibile a una persona sola non è un dato aggregato.",
      "- In `avvertenze`: la data a cui i numeri si riferiscono, se dichiarata; se il documento è nominativo e l'hai aggregato tu.",
    ],
  },
  {
    tipo: "formazione",
    famiglia: "fonte",
    forma: "tabella",
    nome: "registro di formazione o foglio firma",
    estrae: [
      "una riga per corso: argomento, data, ore, partecipanti",
      "partecipanti per genere e inquadramento, dove distinti",
      "ambito (sicurezza, qualità, ambiente, parità, tecnico)",
      "docente o ente formatore",
    ],
    attesa: SPESSO_A_MANO,
    schema: schemaTabella(COLONNE_FORMAZIONE),
    versione: "formazione/1",
    campi: COLONNE_FORMAZIONE,
    // Nessun verificatore proprio: i suoi controlli — le donne non
    // superano i partecipanti, le ore stanno in un intervallo, la data
    // cade nell'anno — sono tutti VINCOLI DICHIARATI sulle colonne.
    effort: "high",
    istruzioni: [
      "Una riga per CORSO o sessione formativa. Se il documento è un foglio firma di una sola sessione, la tabella ha una riga sola e `partecipanti` è il numero di firme leggibili.",
      "- `partecipanti`: quante persone hanno partecipato. Su un foglio firma conta le firme, e se qualcuna è illeggibile contala comunque ma dillo in `avvertenze`.",
      "- `partecipantiDonne`: solo se il documento distingue il genere. Non dedurlo dai nomi: sarebbe un'attribuzione arbitraria.",
      "- ═══ NON RIPORTARE I NOMI dei partecipanti ═══ servono i numeri, non le persone.",
      "- `ambito`: scegli fra i valori ammessi guardando l'argomento del corso.",
      "- Le firme sono manoscritte: per le righe lette da un foglio firma usa `fonteLettura: \"manoscritto\"`.",
    ],
  },

  /* ══ Documenti di sistema (famiglia OPERA) ══════════════════════ */
  {
    tipo: "manuale-sistema",
    famiglia: "opera",
    forma: "tabella",
    nome: "manuale del sistema di gestione",
    estrae: [
      "indice e gerarchia delle sezioni, con la pagina",
      "designazioni normative citate, con edizione",
      "ruoli e responsabilità nominati",
      "procedure e moduli richiamati",
      "data di emissione e stato delle revisioni",
    ],
    attesa: NATIVO_O_SCANSIONE,
  },
  {
    tipo: "procedure",
    famiglia: "opera",
    forma: "tabella",
    nome: "procedura o istruzione operativa",
    estrae: [
      "codice, titolo, revisione e data",
      "scopo e campo di applicazione",
      "responsabilità coinvolte",
      "moduli e registrazioni richiamati",
    ],
    attesa: NATIVO_O_SCANSIONE,
  },
  {
    tipo: "politiche",
    famiglia: "opera",
    forma: "tabella",
    nome: "politica o codice aziendale",
    estrae: [
      "impegni dichiarati, uno per riga",
      "ambito (qualità, ambiente, sicurezza, etica, parità)",
      "data, firma della direzione, riesame previsto",
    ],
    attesa: NATIVO_O_SCANSIONE,
  },
  {
    tipo: "verbali",
    famiglia: "opera",
    forma: "tabella",
    nome: "verbale di riunione o riesame",
    estrae: [
      "una riga per punto all'ordine del giorno o decisione",
      "azioni decise, responsabile e scadenza",
      "data della riunione e funzioni presenti",
    ],
    attesa: SPESSO_A_MANO,
  },
  {
    tipo: "dvr",
    famiglia: "opera",
    forma: "tabella",
    nome: "documento di valutazione dei rischi",
    estrae: [
      "una riga per rischio: descrizione, valutazione, misure",
      "figure della sicurezza nominate (RSPP, medico competente, RLS)",
      "data di emissione e di aggiornamento",
    ],
    attesa: NATIVO_O_SCANSIONE,
  },

  /* ══ Registri operativi ═════════════════════════════════════════ */
  {
    tipo: "manutenzione",
    famiglia: "fonte",
    forma: "tabella",
    nome: "registro di manutenzione",
    estrae: [
      "una riga per intervento: data, macchina, tipo, esito",
      "ore di fermo e ricambi, dove annotati",
      "firma o sigla dell'operatore",
    ],
    attesa: SPESSO_A_MANO,
  },
  {
    tipo: "rifiuti",
    famiglia: "fonte",
    forma: "tabella",
    nome: "registro dei rifiuti, MUD o formulari",
    estrae: [
      "una riga per movimento: data, codice EER, quantità, destino",
      "operazione di recupero o smaltimento (R/D)",
      "trasportatore e destinatario",
    ],
    attesa: {
      nativo: "frequente",
      scansione: "frequente",
      manoscritto: "frequente",
      nota: "Il MUD è nativo; i formulari sono moduli prestampati compilati a mano, in quattro copie e spesso sbiaditi.",
    },
  },

  /* ══ Autorizzazioni, contratti, questionari ═════════════════════ */
  {
    tipo: "autorizzazioni",
    famiglia: "fonte",
    forma: "scheda",
    nome: "autorizzazione ambientale",
    estrae: [
      "tipo (AUA, AIA, scarichi, emissioni in atmosfera)",
      "ente che l'ha rilasciata, numero e data",
      "scadenza e prescrizioni con periodicità",
      "matrici autorizzate",
    ],
    attesa: NATIVO_O_SCANSIONE,
  },
  {
    tipo: "contratti",
    famiglia: "opera",
    forma: "tabella",
    nome: "contratto o capitolato",
    estrae: [
      "una riga per requisito di sostenibilità richiesto dal committente",
      "certificazioni o rendicontazioni imposte, con scadenza",
      "clausole di penale o esclusione collegate",
    ],
    attesa: NATIVO_O_SCANSIONE,
  },
  {
    tipo: "questionari-esg",
    famiglia: "fonte",
    forma: "tabella",
    nome: "questionario ESG già compilato",
    estrae: [
      "una riga per domanda: testo, risposta data, evidenza allegata",
      "piattaforma o committente (EcoVadis, Synesgy, Open-es, banca)",
      "punteggio o esito, se comunicato",
    ],
    attesa: FOGLIO_DI_LAVORO,
  },
  {
    tipo: "certificato",
    famiglia: "fonte",
    forma: "scheda",
    nome: "certificato di sistema di gestione",
    estrae: [
      "norma e designazione con edizione",
      "ente di certificazione e numero del certificato",
      "date di emissione, scadenza e ciclo",
      "scopo e siti coperti",
    ],
    attesa: NATIVO_O_SCANSIONE,
  },
];

/**
 * Una voce che si sa DAVVERO leggere: schema, campi, versione e
 * verificatore presenti. Il tipo esiste perché il motore non debba
 * controllarli uno per uno a ogni passo — se hai una `VoceLeggibile`, la
 * lettura è possibile per costruzione.
 */
export type VoceLeggibile = VoceMotore & {
  schema: z.ZodTypeAny;
  versione: string;
  campi: EtichettaCampo[];
};

function leggibile(v: VoceMotore | undefined): v is VoceLeggibile {
  return Boolean(v?.schema && v?.versione && v?.campi);
}

const PER_TIPO = new Map(REGISTRO_MOTORE.map((v) => [v.tipo, v]));

/** La voce del registro per un tipo, se quel tipo è dichiarato. */
export function voceMotore(tipo: string | null | undefined) {
  return tipo ? PER_TIPO.get(tipo) : undefined;
}

/** La voce, solo se si sa leggere davvero. È questa che serve al motore. */
export function voceLeggibile(
  tipo: string | null | undefined,
): VoceLeggibile | undefined {
  const v = voceMotore(tipo);
  return leggibile(v) ? v : undefined;
}

/** Si sa LEGGERE questo tipo di documento oggi? Dichiarato non basta. */
export function siSaLeggere(tipo: string | null | undefined): boolean {
  return voceLeggibile(tipo) !== undefined;
}

/** I tipi che si sanno leggere: serve al cruscotto e alla mappa. */
export function tipiLeggibili(): VoceMotore[] {
  return REGISTRO_MOTORE.filter((v) => v.schema !== undefined);
}

/** I tipi dichiarati e non ancora implementati: quello che manca, in chiaro. */
export function tipiDichiarati(): VoceMotore[] {
  return REGISTRO_MOTORE.filter((v) => v.schema === undefined);
}
