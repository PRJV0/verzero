import { DOC_CARBON, DOC_KIT, DOC_PARITA, DOC_SCORE, DOC_VSME } from "./bozza";

/**
 * TIPI DI DOCUMENTO E SMISTAMENTO (SPEC §12.E).
 *
 * Il cliente porta ciò che ha; noi dobbiamo capire cos'è e dirgli dove
 * è finito. Oggi il riconoscimento guarda SOLO il nome e l'estensione
 * del file — la lettura del contenuto arriva con la tappa successiva —
 * e questo impone una regola di onestà: un indizio sul nome non è una
 * certezza. Se non riconosciamo con ragionevole sicurezza, lo diciamo e
 * chiediamo, invece di indovinare e sbagliare in silenzio.
 *
 * Ogni tipo dichiara DOVE va a finire: quale documento alimenta e quale
 * sezione. È l'informazione che permette di dire «questa bolletta
 * alimenta: Carbon Footprint → Scope 2», che è il punto dell'hub.
 */

export type Destinazione = {
  /** L'etichetta del documento prodotto (DOC_* di bozza.ts). */
  doc: string;
  /** La sezione di quel documento che questo file compila. */
  sezione: string;
};

export type TipoDocumento = {
  chiave: string;
  nome: string;
  /** Una riga che dice al cliente cosa cerchiamo, senza gergo. */
  spiega: string;
  /** Esempi concreti di nomi file: aiutano più di mille istruzioni. */
  esempi: string[];
  /** Indizi sul nome del file. Vince chi ne combacia di più. */
  indizi: RegExp[];
  destinazioni: Destinazione[];
};

/**
 * Il catalogo dei tipi. Le espressioni sono volutamente prudenti: meglio
 * un «non riconosciuto» che una bolletta del gas scambiata per elettrica
 * e messa nella sezione sbagliata di un inventario delle emissioni.
 */
export const TIPI_DOCUMENTO: TipoDocumento[] = [
  {
    chiave: "bolletta-elettrica",
    nome: "Bolletta di energia elettrica",
    spiega:
      "Una bolletta della luce per ogni contatore, di un anno intero se ce l'hai.",
    esempi: ["bolletta_enel_gennaio_2026.pdf", "luce-pod-IT001E123.pdf"],
    indizi: [
      /\b(bolletta|fattura)\b[\s\S]*\b(luce|elettric|energia|ee)\b/i,
      /\b(enel|a2a|hera|iren|acea|eni.?plenitude|edison|sorgenia|illumia)\b/i,
      /\bpod\b|\bIT\d{3}E\d/i,
      /\b(energia[_\s-]?elettrica|elettric)\b/i,
    ],
    destinazioni: [
      { doc: DOC_CARBON, sezione: "Scope 2 — energia acquistata" },
      { doc: DOC_VSME, sezione: "Indicatori ambientali" },
    ],
  },
  {
    chiave: "bolletta-gas",
    nome: "Bolletta del gas o altri combustibili",
    spiega: "Gas metano, GPL o gasolio da riscaldamento: la fornitura del sito.",
    esempi: ["bolletta_gas_2026.pdf", "metano_dicembre.pdf"],
    indizi: [
      /\b(bolletta|fattura)\b[\s\S]*\b(gas|metano|gpl)\b/i,
      /\b(gas|metano|gpl|smc)\b/i,
      /\bpdr\s?\d/i,
    ],
    destinazioni: [
      { doc: DOC_CARBON, sezione: "Scope 1 — emissioni dirette" },
      { doc: DOC_VSME, sezione: "Indicatori ambientali" },
    ],
  },
  {
    chiave: "carburanti",
    nome: "Registri o fatture dei carburanti",
    spiega: "Rifornimenti di flotta e mezzi d'opera: schede carburante o fatture.",
    esempi: ["carburante_flotta_2026.xlsx", "rifornimenti-gasolio.pdf"],
    indizi: [
      /\b(carburant|rifornimen|gasolio|diesel|benzina|flotta|scheda[_\s-]?carburante)\b/i,
      /\b(q8|eni|ip|tamoil|esso|shell)\b/i,
    ],
    destinazioni: [{ doc: DOC_CARBON, sezione: "Scope 1 — emissioni dirette" }],
  },
  {
    chiave: "visura",
    nome: "Visura camerale",
    spiega: "La visura della Camera di Commercio, anche non recentissima.",
    esempi: ["visura_camerale.pdf", "visura-ordinaria-2026.pdf"],
    indizi: [/\bvisura\b/i, /\bcamera(le)?[_\s-]?(di[_\s-]?commercio)?\b/i, /\bcciaa\b/i],
    destinazioni: [
      { doc: DOC_CARBON, sezione: "Anagrafica dell'organizzazione" },
      { doc: DOC_VSME, sezione: "Anagrafica dell'organizzazione" },
    ],
  },
  {
    chiave: "bilancio",
    nome: "Bilancio depositato",
    spiega: "L'ultimo bilancio d'esercizio: serve a rapportare i numeri.",
    esempi: ["bilancio_2025.pdf", "bilancio-esercizio-depositato.pdf"],
    indizi: [/\bbilancio\b/i, /\bconto[_\s-]?economico\b/i, /\bstato[_\s-]?patrimoniale\b/i],
    destinazioni: [
      { doc: DOC_CARBON, sezione: "Intensità emissiva" },
      { doc: DOC_VSME, sezione: "Indicatori economici" },
      { doc: DOC_SCORE, sezione: "Indicatori per i rating" },
    ],
  },
  {
    chiave: "organico",
    nome: "Dati di organico aggregati",
    spiega:
      "Numero di addetti, contratti e formazione, in forma aggregata: mai nominativi.",
    esempi: ["organico_2026.xlsx", "dipendenti-aggregati.pdf"],
    indizi: [
      /\b(organico|addetti|dipendenti|personale|libro[_\s-]?unico|lul)\b/i,
      /\bformazione\b/i,
    ],
    destinazioni: [
      { doc: DOC_VSME, sezione: "Indicatori sociali" },
      { doc: DOC_PARITA, sezione: "KPI quantitativi per area" },
    ],
  },
  {
    chiave: "organigramma",
    nome: "Organigramma",
    spiega: "Chi fa cosa: ruoli e responsabilità, anche in forma semplice.",
    esempi: ["organigramma.pdf", "organigramma-sicurezza-2026.pdf"],
    indizi: [/\borganigramma\b/i, /\bmansionario\b/i, /\bruoli[_\s-]?responsabilit/i],
    destinazioni: [
      { doc: DOC_VSME, sezione: "Governance" },
      { doc: DOC_PARITA, sezione: "Governance" },
    ],
  },
  {
    chiave: "rifiuti",
    nome: "Registro dei rifiuti (MUD o formulari)",
    spiega: "MUD annuale o formulari di trasporto: servono alla parte ambientale.",
    esempi: ["mud_2025.pdf", "formulari-rifiuti.pdf"],
    indizi: [/\bmud\b/i, /\brifiut/i, /\bformulari?\b/i, /\bfir\b/i],
    destinazioni: [{ doc: DOC_VSME, sezione: "Indicatori ambientali" }],
  },
  {
    chiave: "certificato",
    nome: "Certificato di sistema di gestione",
    spiega: "Un certificato ISO o di schema già ottenuto, se ne hai.",
    esempi: ["certificato_iso9001.pdf", "iso-14001-2026.pdf"],
    indizi: [
      /\bcertificat/i,
      /\biso\s?\d{4,5}\b/i,
      /\bsa\s?8000\b/i,
      /\bpdr\s?125\b/i,
    ],
    destinazioni: [
      { doc: DOC_VSME, sezione: "Certificazioni" },
      { doc: DOC_SCORE, sezione: "Indicatori per i rating" },
      { doc: DOC_KIT, sezione: "Materiali da comunicare" },
    ],
  },
  {
    chiave: "politiche",
    nome: "Politiche e procedure aziendali",
    spiega: "Codice etico, politica qualità o ambiente, procedure già scritte.",
    esempi: ["codice_etico.pdf", "politica-ambientale.pdf"],
    indizi: [
      /\b(codice[_\s-]?etico|politica|procedura|regolamento|carta[_\s-]?dei[_\s-]?valori)\b/i,
      /\bmodello[_\s-]?231\b/i,
    ],
    destinazioni: [
      { doc: DOC_VSME, sezione: "Politiche, azioni e obiettivi" },
      { doc: DOC_PARITA, sezione: "Politica della parità" },
    ],
  },
  {
    chiave: "dvr",
    nome: "Documento di valutazione dei rischi (DVR)",
    spiega:
      "Il DVR in vigore: resta tuo obbligo, a noi serve per costruirci attorno il sistema.",
    esempi: ["dvr_2026.pdf", "valutazione-rischi.pdf"],
    indizi: [/\bdvr\b/i, /\bvalutazione[_\s-]?(dei[_\s-]?)?rischi\b/i, /\bduvri\b/i],
    destinazioni: [{ doc: "Manuale ISO 45001", sezione: "Contesto e rischi" }],
  },
];

const PER_CHIAVE = new Map(TIPI_DOCUMENTO.map((t) => [t.chiave, t]));

export function tipoDocumento(chiave: string | null): TipoDocumento | undefined {
  return chiave ? PER_CHIAVE.get(chiave) : undefined;
}

/* ------------------------------------------------------------------ */
/* Riconoscimento                                                      */
/* ------------------------------------------------------------------ */

export type Riconoscimento = {
  tipo: TipoDocumento | null;
  /** Quanti indizi hanno combaciato: zero significa «non lo so». */
  indiziTrovati: number;
};

/**
 * Riconosce il tipo dal solo nome del file. Vince il tipo con più
 * indizi; a parità non si sceglie a caso — si dichiara di non sapere,
 * perché un file chiamato «bolletta_gas_e_luce.pdf» va chiesto, non
 * indovinato.
 */
export function riconosciDaNome(nomeFile: string): Riconoscimento {
  // I separatori dei nomi file diventano spazi PRIMA di cercare gli
  // indizi. Sembra un dettaglio ed è il cuore della cosa: `_` e `.` sono
  // caratteri di parola per un'espressione regolare, quindi in
  // «bolletta_enel_2026.pdf» il confine di parola attorno a «enel» non
  // esiste e nessun indizio combacia. È il modo in cui la gente chiama
  // davvero i propri file, e ignorarlo significava non riconoscere
  // niente — verificato al primo caricamento reale.
  const nome = nomeFile
    .normalize("NFKD")
    .replace(/\.[a-z0-9]+$/i, "")
    .replace(/[_.\-]+/g, " ");
  const punteggi = TIPI_DOCUMENTO.map((tipo) => ({
    tipo,
    punti: tipo.indizi.filter((i) => i.test(nome)).length,
  })).filter((p) => p.punti > 0);

  if (punteggi.length === 0) return { tipo: null, indiziTrovati: 0 };

  punteggi.sort((a, b) => b.punti - a.punti);
  const migliore = punteggi[0];
  const secondo = punteggi[1];

  // Non basta vincere: bisogna vincere NETTAMENTE. Un solo indizio di
  // scarto non è una certezza — «bolletta_luce_e_gas.pdf» ne prende due
  // per il gas e uno per la luce, ma è entrambe le cose, e assegnarla al
  // gas la infilerebbe nello Scope 1 lasciando fuori lo Scope 2. In
  // questi casi si chiede: una domanda costa dieci secondi al cliente,
  // un dato nella sezione sbagliata costa la credibilità del documento.
  if (secondo && migliore.punti - secondo.punti < 2) {
    return { tipo: null, indiziTrovati: migliore.punti };
  }

  return { tipo: migliore.tipo, indiziTrovati: migliore.punti };
}

/* ------------------------------------------------------------------ */
/* Smistamento                                                         */
/* ------------------------------------------------------------------ */

/** Dove finisce davvero un documento, dati i percorsi attivi. */
export function smistamento(
  tipo: TipoDocumento | undefined | null,
  documentiAttivi: Set<string>,
): Destinazione[] {
  if (!tipo) return [];
  return tipo.destinazioni.filter((d) => documentiAttivi.has(d.doc));
}

/** Lo stato che compete a un documento appena caricato. */
export function statoIniziale(
  tipo: TipoDocumento | null,
  documentiAttivi: Set<string>,
): "smistato" | "da_classificare" | "non_pertinente" {
  if (!tipo) return "da_classificare";
  return smistamento(tipo, documentiAttivi).length > 0
    ? "smistato"
    : "non_pertinente";
}

/**
 * I tipi che i percorsi attivi chiedono davvero, con l'indicazione di
 * quali documenti alimentano. È l'elenco che apre l'hub: non «carica
 * quello che vuoi», ma «ecco cosa serve a te».
 */
export function tipiRichiesti(documentiAttivi: Set<string>): {
  tipo: TipoDocumento;
  destinazioni: Destinazione[];
}[] {
  return TIPI_DOCUMENTO.map((tipo) => ({
    tipo,
    destinazioni: smistamento(tipo, documentiAttivi),
  })).filter((r) => r.destinazioni.length > 0);
}

/* ------------------------------------------------------------------ */
/* Vincoli di caricamento                                              */
/* ------------------------------------------------------------------ */

export const MAX_BYTE = 20 * 1024 * 1024;
export const MIME_AMMESSI = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
];
export const ESTENSIONI_AMMESSE = ".pdf, .jpg, .png, .webp, .heic";

export function pesoLeggibile(byte: number): string {
  if (byte < 1024) return `${byte} byte`;
  if (byte < 1024 * 1024) return `${Math.round(byte / 1024)} kB`;
  return `${(byte / (1024 * 1024)).toFixed(1).replace(".", ",")} MB`;
}

/** Il file è caricabile? In caso contrario, il motivo in italiano. */
export function validaFile(file: {
  name: string;
  size: number;
  type: string;
}): string | null {
  if (file.size === 0) {
    return `«${file.name}» è vuoto: controlla il file e riprova.`;
  }
  if (file.size > MAX_BYTE) {
    return `«${file.name}» pesa ${pesoLeggibile(file.size)}: il limite è 20 MB. Se è una scansione, prova a ridurne la qualità.`;
  }
  // Alcuni browser non dichiarano il tipo: in quel caso guardiamo il nome.
  const tipoOk =
    MIME_AMMESSI.includes(file.type) ||
    (file.type === "" && /\.(pdf|jpe?g|png|webp|heic|heif)$/i.test(file.name));
  if (!tipoOk) {
    return `«${file.name}» non è un formato che sappiamo leggere. Accettiamo ${ESTENSIONI_AMMESSE}.`;
  }
  return null;
}

/** Ripulisce il nome per l'archivio, senza perdere leggibilità. */
export function nomeSicuro(nome: string): string {
  return nome
    .normalize("NFKD")
    .replace(/[^\w\s.-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(-120);
}
