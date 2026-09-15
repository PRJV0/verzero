/**
 * IL CONTENUTO DI UN ELABORATO — dato strutturato, non impaginazione.
 *
 * ═══ PERCHÉ UN ALBERO E NON UN HTML ═══
 * Lo stesso documento esce in PDF sempre e in DOCX dove il cliente deve
 * poterci mettere le mani (docs/motore.md §5). La scorciatoia — comporre
 * un HTML e stamparlo — dà un PDF accettabile e un DOCX inutilizzabile.
 * Qui c'è quello che il documento DICE: sezioni, paragrafi, tabelle,
 * valori con la loro fonte. Come si impagina lo decidono `pdf.ts` e
 * `docx.ts`, e nessuno dei due può aggiungere una parola: tutto il testo
 * che il cliente legge nasce in `componi.ts`, una volta sola.
 *
 * ═══ UNA CELLA È UNA ETICHETTA O UN DATO ═══
 * La distinzione è di tipo, non di stile. Una stringa è testo nostro —
 * un'intestazione di colonna, il nome di un mese. Un `Valore` è un dato
 * dell'impresa, e un dato senza `fonte` non passa il controllo di
 * consegna: è così che «ogni valore numerico riportato abbia fonte
 * tracciata» diventa una proprietà verificabile del documento invece di
 * una buona intenzione di chi scrive il compositore.
 */

/** Come un valore è arrivato nel documento. È la sigla accanto al dato. */
export type TipoFonte =
  /** Letto da un documento dell'impresa (bolletta, visura, pagina del sito). */
  | "documento"
  /** Recuperato da una banca dati (Registro Imprese, VIES, ISPRA…). */
  | "banca-dati"
  /** Calcolato da noi a partire da altri valori del documento. */
  | "calcolato"
  /** Inserito dall'impresa a mano (registrazione, scheda). */
  | "inserito";

/** La lettera della sigla: D3, B1, C2, I1. */
export const SIGLA_FONTE: Record<TipoFonte, string> = {
  documento: "D",
  "banca-dati": "B",
  calcolato: "C",
  inserito: "I",
};

/**
 * Una voce del REGISTRO DELLE FONTI, l'appendice che rende il documento
 * controllabile: chi legge «12.480 kWh D3» apre la D3 e ci trova quale
 * bolletta, quale pagina, confermata quando.
 */
export type Fonte = {
  /** «D3», «B1», «C2»: stabile dentro il documento. */
  id: string;
  tipo: TipoFonte;
  /** Che cos'è, in una riga: «Bolletta energia elettrica · gennaio 2025». */
  titolo: string;
  /** Il dettaglio che serve a ritrovarla: file, pagine, tabella, formula. */
  dettaglio: string[];
  /** L'indirizzo pubblico, quando esiste (banche dati, sito dell'impresa). */
  url?: string;
  /**
   * Il gesto che la rende utilizzabile. Per documenti, banche dati e dati
   * inseriti è la conferma dell'impresa; un calcolo è confermato quando lo
   * sono tutti i suoi ingressi. Il controllo di consegna blocca ogni fonte
   * con `confermata: false` — non si fida del compositore.
   */
  confermata: boolean;
  /** Quando è stata confermata, per esteso: finisce nel registro. */
  confermataIl?: string;
  /** Per i calcoli: le fonti da cui discende. */
  ingressi?: string[];
  /**
   * Il periodo a cui la fonte si riferisce, se ne ha uno (una bolletta sì,
   * una visura no). Serve al controllo di coerenza dell'esercizio.
   */
  periodo?: { dal: string; al: string };
};

/** Un dato dell'impresa dentro il documento. */
export type Valore = {
  /** Già formattato per la lettura: «12.480 kWh», «15 marzo 2025». */
  testo: string;
  /** L'id nel registro delle fonti. Obbligatorio per il controllo. */
  fonte?: string;
  /** Il numero da cui viene il testo, quando c'è: serve ai grafici e alle prove. */
  numero?: number;
  /** Evidenzia (totali, risultati). */
  forte?: boolean;
};

export type Cella = string | Valore;

export function eValore(c: Cella): c is Valore {
  return typeof c === "object" && c !== null;
}

export type Colonna = {
  titolo: string;
  /** I numeri si allineano a destra: si leggono per colonna. */
  allinea?: "sinistra" | "destra";
  /** Peso relativo della larghezza (default 1). */
  peso?: number;
};

/**
 * I blocchi. Pochi, di proposito: ogni tipo in più è un tipo in più da
 * rendere identico in due formati, e un documento di conformità non ha
 * bisogno di più di così.
 *
 * Nei testi è ammessa UNA sola marcatura, `**grassetto**`: serve a far
 * trovare la frase che conta in un paragrafo, e qualunque altra cosa
 * sarebbe impaginazione travestita da contenuto.
 */
export type Blocco =
  | { tipo: "paragrafo"; testo: string }
  | { tipo: "sottotitolo"; testo: string }
  | { tipo: "elenco"; voci: string[] }
  | {
      tipo: "coppie";
      righe: { etichetta: string; valore: Cella }[];
    }
  | {
      tipo: "tabella";
      didascalia?: string;
      colonne: Colonna[];
      righe: Cella[][];
      totale?: Cella[];
      note?: string[];
    }
  | {
      /** Le poche cifre che riassumono una sezione, in grande. */
      tipo: "cifre";
      voci: { etichetta: string; valore: Valore; nota?: string }[];
    }
  | {
      /** Barre orizzontali in pila: il confronto che una tabella non fa vedere. */
      tipo: "barre";
      titolo: string;
      unita: string;
      /** Le parti, nell'ordine in cui si impilano: la legenda le segue. */
      parti: string[];
      serie: { etichetta: string; valori: number[]; totale: Valore }[];
    }
  | {
      tipo: "riquadro";
      titolo?: string;
      testo: string;
      tono?: "neutro" | "attenzione";
    };

export type SezioneElaborato = {
  /** Numero progressivo nel documento: «3». */
  numero: number;
  titolo: string;
  /** Il riferimento che la richiede, quando il modello lo dichiara. */
  riferimento?: string;
  blocchi: Blocco[];
  /**
   * La sezione ha il contenuto che il modello le chiede. Non è «ha dei
   * blocchi»: una sezione dello Scope 2 con il solo paragrafo introduttivo
   * e nessuna bolletta ha un blocco, ed è vuota.
   */
  piena: boolean;
};

/** Una norma o uno standard citato, copiato dentro il documento. */
export type RiferimentoNormativo = {
  designazione: string;
  /** Il titolo ufficiale, quando il registro lo porta. */
  titolo?: string;
  /** Perché è citato: struttura, metodo, fattori. */
  ruolo: string;
  /** Lo stato nel registro AL MOMENTO della composizione. */
  stato: "in vigore" | "ritirata" | "attesa" | "superata" | "non registrata";
  dal?: string;
  url?: string;
  nota?: string;
};

export type StatoValidazione = "in_attesa" | "validata";

export type Validazione = {
  stato: StatoValidazione;
  /** Chi ha validato: nome e qualifica, per esteso. Assente se in attesa. */
  professionista?: string;
  qualifica?: string;
  /** ISO. */
  il?: string;
  /** I rilievi, parola per parola. Vuoto = nessun rilievo. */
  rilievi?: string[];
};

export type VoceRevisione = {
  numero: number;
  /** ISO. */
  data: string;
  motivo: string;
  versioneStandard?: string;
  validazione: StatoValidazione;
};

/** L'identità del documento: ciò che sta in copertina e in ogni piè di pagina. */
export type Frontespizio = {
  /** Sopra il titolo: «Inventario delle emissioni di gas a effetto serra». */
  occhiello: string;
  /** «Inventario GHG 2025». */
  titolo: string;
  organizzazione: string;
  /** Righe identificative sotto il nome: P.IVA, sede. */
  identificativi: { etichetta: string; valore: string }[];
  esercizio: number;
  /** «1 gennaio – 31 dicembre 2025». */
  periodo: string;
  /** Su che cosa è costruito, per esteso. */
  costruitoSu?: string;
  /** Il codice del documento: «GHG-2025-A1B2C3-R0». */
  codice: string;
};

export type Elaborato = {
  /** La chiave del modello e la sua impronta: quale struttura, esattamente. */
  modello: { chiave: string; documento: string; impronta: string };
  frontespizio: Frontespizio;
  revisione: VoceRevisione;
  validazione: Validazione;
  /** Il registro delle revisioni, compresa quella corrente, dalla più vecchia. */
  revisioni: VoceRevisione[];
  sezioni: SezioneElaborato[];
  riferimenti: RiferimentoNormativo[];
  fonti: Fonte[];
  /** Le avvertenze di lettura in testa: la legenda delle sigle. */
  legenda: { sigla: string; testo: string }[];
  /** Il testo dei riquadri fissi: validazione, nota di composizione. */
  testi: {
    validazioneInAttesa: string;
    validazioneSpiega: string;
    composizione: string;
    fontiIntro: string;
    riferimentiIntro: string;
  };
  formati: ("pdf" | "docx")[];
  /**
   * Documento d'esempio con impresa inventata: la parola «esempio» deve
   * vedersi su ogni pagina, non solo in copertina (CLAUDE.md, dati nelle
   * pagine pubbliche). Un foglio staccato dal resto non deve poter passare
   * per il documento di un'impresa vera.
   */
  esempio?: boolean;
};

/* ------------------------------------------------------------------ */
/* Attraversare il contenuto                                           */
/* ------------------------------------------------------------------ */

/** Tutte le celle-dato di un blocco: serve al controllo e alle prove. */
export function valoriDi(b: Blocco): Valore[] {
  switch (b.tipo) {
    case "coppie":
      return b.righe.map((r) => r.valore).filter(eValore);
    case "tabella":
      return [...b.righe.flat(), ...(b.totale ?? [])].filter(eValore);
    case "cifre":
      return b.voci.map((v) => v.valore);
    case "barre":
      return b.serie.map((s) => s.totale);
    default:
      return [];
  }
}

/** Tutto il testo di un blocco, dati compresi: serve a cercare designazioni e segnaposto. */
export function testiDi(b: Blocco): string[] {
  const cella = (c: Cella) => (eValore(c) ? c.testo : c);
  switch (b.tipo) {
    case "paragrafo":
    case "sottotitolo":
      return [b.testo];
    case "elenco":
      return b.voci;
    case "coppie":
      return b.righe.flatMap((r) => [r.etichetta, cella(r.valore)]);
    case "tabella":
      return [
        ...(b.didascalia ? [b.didascalia] : []),
        ...b.colonne.map((c) => c.titolo),
        ...b.righe.flat().map(cella),
        ...(b.totale ?? []).map(cella),
        ...(b.note ?? []),
      ];
    case "cifre":
      return b.voci.flatMap((v) => [v.etichetta, v.valore.testo, v.nota ?? ""]);
    case "barre":
      return [b.titolo, b.unita, ...b.parti, ...b.serie.flatMap((s) => [s.etichetta, s.totale.testo])];
    case "riquadro":
      return [b.titolo ?? "", b.testo];
  }
}

/** Tutto il testo del documento, in ordine di lettura. */
export function testoCompleto(e: Elaborato): string[] {
  const f = e.frontespizio;
  return [
    f.occhiello,
    f.titolo,
    f.organizzazione,
    ...f.identificativi.flatMap((i) => [i.etichetta, i.valore]),
    f.periodo,
    f.costruitoSu ?? "",
    ...e.legenda.map((l) => l.testo),
    ...e.sezioni.flatMap((s) => [s.titolo, s.riferimento ?? "", ...s.blocchi.flatMap(testiDi)]),
    ...e.riferimenti.flatMap((r) => [r.designazione, r.ruolo, r.nota ?? ""]),
    ...e.fonti.flatMap((x) => [x.titolo, ...x.dettaglio]),
    ...Object.values(e.testi),
    // Anche ciò che scrive chi valida e il motivo della revisione corrente:
    // sono pagine del documento, e un segnaposto o una designazione lì
    // dentro valgono quanto nel testo di una sezione. Le righe delle
    // revisioni passate no: sono storia, controllata quando fu emessa, e
    // un'edizione ritirata DOPO non le rende sbagliate.
    e.validazione.professionista ?? "",
    e.validazione.qualifica ?? "",
    ...(e.validazione.rilievi ?? []),
    e.revisione.motivo,
  ];
}

/**
 * Spezza `**grassetto**` in segmenti. È l'unica marcatura ammessa, e i
 * due formati la leggono con questa stessa funzione: un grassetto che in
 * PDF c'è e in DOCX no sarebbe già una divergenza.
 */
export function segmenti(testo: string): { testo: string; forte: boolean }[] {
  const out: { testo: string; forte: boolean }[] = [];
  const parti = testo.split("**");
  parti.forEach((p, i) => {
    if (p) out.push({ testo: p, forte: i % 2 === 1 });
  });
  return out;
}
