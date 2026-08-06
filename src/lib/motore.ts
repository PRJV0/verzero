import {
  ClipboardList,
  FileCheck2,
  ScanLine,
  UserCheck,
  type LucideIcon,
} from "lucide-react";

/**
 * Le quattro fasi del Motore Ver0 — fonte unica per la sezione narrativa,
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
    icon: ClipboardList,
    titolo: "Cosa ti chiediamo",
    desc: "Per ogni percorso il Motore indica la lista puntuale dei documenti previsti dalla norma — non «carica quello che vuoi». Sono documenti che hai già: è l'unica parte che tocca a te.",
    entra: "I documenti che l'azienda ha già in archivio",
    esce: "La checklist del percorso, con in evidenza ciò che manca",
    norma: "UNI EN ISO 14064-1:2019 — dati di attività richiesti",
  },
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

/** Fase 1 — i documenti richiesti dal percorso, con lo stato di raccolta. */
export type StatoDocumento = "caricato" | "recuperato" | "manca";

export const DOCUMENTI_RICHIESTI: {
  nome: string;
  dettaglio: string;
  stato: StatoDocumento;
}[] = [
  {
    nome: "Bolletta elettrica",
    dettaglio: "12 mesi, tutti i POD attivi",
    stato: "caricato",
  },
  {
    nome: "Visura camerale",
    dettaglio: "basta la P.IVA: la recuperiamo noi",
    stato: "recuperato",
  },
  {
    nome: "Registro carburanti",
    dettaglio: "mezzi e impianti, litri per periodo",
    stato: "manca",
  },
];

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
 *  mai da sola la formula, sempre accompagnata da questa spiegazione. */
export const ZERO_EFFORT_DEFINIZIONE =
  "Zero effort non vuol dire zero coinvolgimento: vuol dire che ti chiediamo solo ciò che solo tu puoi darci — i documenti che hai già — e ci occupiamo di tutto il resto.";

/** Quantificazione da usare dove serve concretezza (SPEC §12.O). */
export const ZERO_EFFORT_TEMPO =
  "Circa un'ora del tuo tempo: il resto lo fa il Motore.";
