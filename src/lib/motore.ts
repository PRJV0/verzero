/**
 * IL FASCICOLO DEL PERCORSO — fonte unica dei dati d'esempio.
 *
 * REGOLA (SPEC §12.O — concretezza): niente astrazioni. Ogni percorso
 * mostra ARTEFATTI REALI — documenti col loro nome, il requisito preciso,
 * la norma citata in chiaro — e dichiara sempre cosa entra e cosa il
 * Motore compone.
 *
 * I valori sono un esempio coerente e dichiarato come tale, su
 * un'impresa INVENTATA (regola in CLAUDE.md: nelle pagine pubbliche mai
 * un'azienda reale). I numeri tornano fra loro, perché è la coerenza a
 * rendere credibile la dimostrazione.
 */

/* ------------------------------------------------------------------ */
/* IL FASCICOLO DEL PERCORSO — anteprima fedele della dashboard        */
/* ------------------------------------------------------------------ */

/**
 * Tre stati con gerarchia visiva forte (SPEC §12.O + decisione design):
 * - "caricato": spunta piena pino — fatto;
 * - "recuperato": LO RECUPERIAMO NOI, badge menta con l'icona del Motore
 *   («basta la P.IVA») — è il momento-magia e va valorizzato;
 * - "da-caricare": ambra, mai rosso — è un invito, non un errore.
 */
export type StatoDocumento = "caricato" | "recuperato" | "da-caricare";

export type DocumentoFascicolo = {
  nome: string;
  /** Il requisito preciso, in piccolo: es. "12 mesi, tutti i POD attivi". */
  requisito: string;
  stato: StatoDocumento;
};

export type FascicoloPercorso = {
  id: string;
  /** Etichetta del tab. */
  label: string;
  /** Il nome per esteso: nei tab non ci sta, nel focus serve. */
  nome: string;
  /** La norma su cui il percorso lavora (contratto entra/esce/norma). */
  norma: string;
  /** Le sezioni che il Motore compone da sé: lo schema applicato. */
  compone: string[];
  documenti: DocumentoFascicolo[];
};

/**
 * Un fascicolo per percorso: cambiare tab mostra la trasversalità del
 * Motore — stessa grammatica, documenti diversi. Gli stati sono un
 * esempio dichiarato, coerente con la scena dell'officina meccanica.
 */
export const FASCICOLI: FascicoloPercorso[] = [
  {
    id: "carbon",
    label: "Carbon",
    nome: "Carbon Footprint di Organizzazione",
    norma: "UNI EN ISO 14064-1:2019 · GHG Protocol",
    compone: [
      "Confini organizzativi e operativi",
      "Inventario Scope 1 — combustione diretta",
      "Inventario Scope 2 — energia acquistata",
      "Fattori di emissione applicati, con la fonte",
      "Intensità emissiva sui dati di bilancio",
    ],
    documenti: [
      {
        nome: "Bolletta elettrica",
        requisito: "12 mesi, tutti i POD attivi",
        stato: "caricato",
      },
      {
        nome: "Visura camerale",
        requisito: "basta la P.IVA",
        stato: "recuperato",
      },
      {
        nome: "Ultimo bilancio depositato",
        requisito: "per l'intensità emissiva",
        stato: "recuperato",
      },
      {
        nome: "Registro carburanti",
        requisito: "mezzi e impianti, litri per periodo",
        stato: "da-caricare",
      },
    ],
  },
  {
    id: "iso-9001",
    label: "ISO 9001",
    nome: "Manuale del Sistema di Gestione ISO 9001",
    norma: "UNI EN ISO 9001:2015 — struttura HLS",
    compone: [
      "Contesto dell'organizzazione e parti interessate",
      "Politica per la qualità e obiettivi misurabili",
      "Mappa dei processi e loro interazioni",
      "Procedure e modulistica secondo i punti 4–10",
      "Piano degli audit interni e riesame della direzione",
    ],
    documenti: [
      {
        nome: "Visura camerale",
        requisito: "basta la P.IVA",
        stato: "recuperato",
      },
      {
        nome: "Organigramma",
        requisito: "ruoli e responsabilità attuali",
        stato: "caricato",
      },
      {
        nome: "Mappa dei processi",
        requisito: "anche in bozza: la strutturiamo noi",
        stato: "da-caricare",
      },
      {
        nome: "Procedure esistenti",
        requisito: "se ci sono, si riusano",
        stato: "da-caricare",
      },
    ],
  },
  {
    id: "vsme",
    label: "VSME",
    nome: "Bilancio di Sostenibilità (VSME)",
    norma: "Standard VSME pubblicato da EFRAG — modulo base",
    compone: [
      "Profilo dell'impresa e modello di business",
      "Indicatori ambientali, ripresi dal Carbon Footprint",
      "Indicatori sociali sui dati di organico aggregati",
      "Governance: composizione degli organi e politiche",
      "Nota metodologica con il perimetro dichiarato",
    ],
    documenti: [
      {
        nome: "Visura camerale",
        requisito: "basta la P.IVA",
        stato: "recuperato",
      },
      {
        nome: "Ultimo bilancio depositato",
        requisito: "per i dati economici del profilo",
        stato: "recuperato",
      },
      {
        nome: "Dati di organico aggregati",
        requisito: "per genere e inquadramento, mai nominativi",
        stato: "caricato",
      },
      {
        nome: "Composizione degli organi sociali",
        requisito: "per la parte di governance",
        stato: "da-caricare",
      },
    ],
  },
  {
    id: "pdr-125",
    label: "PdR 125",
    nome: "Sistema di Gestione per la Parità di Genere",
    norma: "UNI/PdR 125:2022 — sei aree di KPI",
    compone: [
      "Analisi di contesto sui sei ambiti della prassi",
      "KPI calcolati sui dati di organico aggregati",
      "Politica per la parità e piano strategico",
      "Procedure di selezione, crescita e conciliazione",
      "Piano di monitoraggio e riesame",
    ],
    documenti: [
      {
        nome: "Visura camerale",
        requisito: "basta la P.IVA",
        stato: "recuperato",
      },
      {
        nome: "Dati di organico aggregati",
        requisito: "per genere e inquadramento, mai nominativi",
        stato: "caricato",
      },
      {
        nome: "Politiche HR formalizzate",
        requisito: "selezione, crescita, conciliazione",
        stato: "da-caricare",
      },
    ],
  },
];

/** La chiusa del fascicolo: resta identica in ogni percorso. */
export const FASCICOLO_CHIUSA =
  "Ti diciamo esattamente cosa manca, prima che diventi un problema.";



/** Fase 3 — anteprima del documento in uscita. I numeri sono coerenti tra
 *  loro: 8.240 L di gasolio e 610 L di benzina fanno lo Scope 1; i 128.400
 *  kWh, con il fattore di rete, fanno lo Scope 2 location based. */
export const DOCUMENTO_GENERATO = {
  titolo: "Inventario GHG 2025",
  norma: "UNI EN ISO 14064-1:2019 · GHG Protocol Corporate Standard",
  righe: [
    {
      voce: "Scope 1 — combustione diretta",
      valore: "23,2 tCO₂e",
      fonte: "ISPRA 2024",
    },
    {
      voce: "Scope 2 — location based",
      valore: "41,3 tCO₂e",
      fonte: "ISPRA 2024",
    },
    {
      voce: "Scope 2 — market based",
      valore: "38,7 tCO₂e",
      fonte: "AIB 2024",
    },
  ],
  totale: { voce: "Totale Scope 1 + 2 (location based)", valore: "64,5 tCO₂e" },
  nota: "Ogni riga porta il fattore applicato e la fonte da cui proviene.",
};

/** Fase 4 — l'esito della verifica umana. Nessun nome inventato: nome, ruolo
 *  e data del professionista vivono nella piattaforma, non in vetrina. */
export const VERIFICA_UMANA = {
  controlli: [
    "Perimetro organizzativo e anno di rendicontazione coerenti",
    "Fattori di emissione aggiornati all'anno corretto",
    "Categorie obbligatorie complete, nessuna esclusione non dichiarata",
  ],
  rilievo:
    "Dicembre mancante sul gasolio: stimato sulla media dei mesi precedenti ed etichettato «stimato» nel report.",
  esito: "Verificato dal team tecnico",
  responsabilita:
    "Nome, ruolo e data di chi verifica restano sul documento e nel tuo archivio.",
};

/** Definizione obbligatoria dello «zero effort» (SPEC §12.O): non si dichiara
 *  mai da sola la formula, sempre accompagnata da questa spiegazione.
 *  VIETATE le quantificazioni di tempo o impegno («un'ora del tuo tempo»):
 *  l'impegno varia per percorso e impresa, ogni numero promesso è un ostaggio. */
export const ZERO_EFFORT_DEFINIZIONE =
  "Zero effort, sul serio: bastano i documenti che hai già in azienda. L'AI Ver0 li trasforma in qualifiche, un professionista le valida.";
