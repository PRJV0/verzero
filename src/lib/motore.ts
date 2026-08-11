import {
  FileCheck2,
  ScanLine,
  UserCheck,
  type LucideIcon,
} from "lucide-react";

/**
 * Il Motore Ver0 — fonte unica per la sezione narrativa,
 * usata sia in home sia in chi-siamo.
 *
 * REGOLA (SPEC §12.O — concretezza del Motore): niente astrazioni. Ogni fase
 * mostra ARTEFATTI REALI — documenti con il loro nome, campi estratti con
 * valori d'esempio plausibili, la norma applicata citata in chiaro, il
 * documento in uscita, l'esito della verifica umana — e dichiara sempre
 * COSA ENTRA, COSA ESCE e SU QUALE NORMA. Solidità prima di spettacolo.
 *
 * I valori qui sotto sono un esempio coerente e dichiarato come tale
 * (officina meccanica, 14 addetti): i numeri tornano tra loro, perché è
 * proprio la coerenza a rendere credibile la dimostrazione.
 */
export type FaseMotore = {
  icon: LucideIcon;
  titolo: string;
  desc: string;
  /** Cosa entra in questa fase. */
  entra: string;
  /** Cosa esce da questa fase. */
  esce: string;
  /** Su quale norma o fonte ufficiale si lavora. */
  norma: string;
};

export const MOTORE_FASI: FaseMotore[] = [
  {
    icon: ScanLine,
    titolo: "Cosa leggiamo",
    desc: "Il Motore estrae i campi che servono — anche da una foto della bolletta — li normalizza e li incrocia con le banche dati ufficiali. Ogni valore resta etichettato per qualità: misurato, da documento, stimato.",
    entra: "I documenti caricati e le fonti camerali ed energetiche",
    esce: "Campi strutturati, tracciabili al documento di origine",
    norma: "Registro Imprese · fattori di emissione ISPRA e AIB",
  },
  {
    icon: FileCheck2,
    titolo: "Cosa generiamo",
    desc: "I dati vengono montati sulla struttura della norma di riferimento: non un documento «ispirato a», ma l'impianto che la norma richiede, con ogni valore riconducibile alla sua fonte riga per riga.",
    entra: "I campi confermati e i fattori di emissione applicabili",
    esce: "Il documento conforme, pronto per banche, filiere ed enti",
    norma: "UNI EN ISO 14064-1:2019 · GHG Protocol Corporate Standard",
  },
  {
    icon: UserCheck,
    titolo: "Chi verifica",
    desc: "Prima dell'emissione un professionista del team tecnico controlla perimetro, fattori e completezza, e mette per iscritto i rilievi. La responsabilità resta di una persona, non di un algoritmo.",
    entra: "Il documento generato e l'intera catena dei dati",
    esce: "Esito della verifica, rilievi dichiarati e firma del professionista",
    norma: "Verifica interna Ver0 — indipendente dalla certificazione di terza parte",
  },
];

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
  /** La norma su cui il percorso lavora (contratto entra/esce/norma). */
  norma: string;
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
    norma: "UNI EN ISO 14064-1:2019 · GHG Protocol",
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
    norma: "UNI EN ISO 9001:2015 — struttura HLS",
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
    id: "pdr-125",
    label: "PdR 125",
    norma: "UNI/PdR 125:2022 — sei aree di KPI",
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
  "Il Motore ti dice esattamente cosa manca, prima che diventi un problema.";

/** Fase 2 — i campi estratti da ciascun documento, con valori d'esempio. */
export const CAMPI_ESTRATTI: {
  doc: string;
  campi: { campo: string; valore: string }[];
}[] = [
  {
    doc: "Bolletta elettrica",
    campi: [
      { campo: "POD", valore: "IT001E98765432" },
      { campo: "Consumo", valore: "128.400 kWh" },
      { campo: "Periodo", valore: "01/2025 – 12/2025" },
    ],
  },
  {
    doc: "Visura camerale",
    campi: [
      { campo: "ATECO", valore: "25.62.00" },
      { campo: "Addetti", valore: "14" },
      { campo: "Unità locali", valore: "2" },
    ],
  },
  {
    doc: "Registro carburanti",
    campi: [
      { campo: "Gasolio", valore: "8.240 L" },
      { campo: "Benzina", valore: "610 L" },
    ],
  },
];

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
  firma:
    "Nome, ruolo e data di chi verifica restano sul documento e nel tuo archivio.",
};

/** Definizione obbligatoria dello «zero effort» (SPEC §12.O): non si dichiara
 *  mai da sola la formula, sempre accompagnata da questa spiegazione.
 *  VIETATE le quantificazioni di tempo o impegno («un'ora del tuo tempo»):
 *  l'impegno varia per percorso e impresa, ogni numero promesso è un ostaggio. */
export const ZERO_EFFORT_DEFINIZIONE =
  "Zero effort non vuol dire zero coinvolgimento: vuol dire che ti chiediamo solo ciò che solo tu puoi darci — i documenti che hai già — e ci occupiamo di tutto il resto.";
