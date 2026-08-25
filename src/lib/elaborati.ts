/**
 * I MODELLI DEGLI ELABORATI — struttura dichiarata, non scritta in codice.
 *
 * ═══ PERCHÉ ═══
 * Il Motore serve oggi la sostenibilità e i sistemi di gestione, ma dovrà
 * servire il Modello 231, la privacy, la sicurezza informatica e ambiti
 * che oggi non sappiamo nominare. Se la struttura di un elaborato vive
 * dentro una funzione TypeScript — `bozzaCarbon()`, `bozzaVsme()` — ogni
 * ambito nuovo è codice nuovo, e la pipeline finisce per conoscere i
 * domini che dovrebbe ignorare.
 *
 * Qui la struttura è **dato**: sezioni, obbligatorietà, norme di
 * riferimento, documenti richiesti. Chi costruisce la bozza
 * (`bozza.ts`) e chi controllerà la conformità prima della consegna non
 * sanno che cosa sia un Carbon Footprint: leggono un modello.
 *
 * ═══ AGGIUNGERE UN AMBITO ═══
 * Si dichiara l'ambito in `ambiti.ts`, i suoi tipi di documento nel
 * registro del Motore, le sue norme nel registro norme, e i suoi modelli
 * qui. **Nessuna riga della pipeline cambia.** Il procedimento completo è
 * in `docs/motore.md` §12, e la prova che regge è in
 * `scripts/test-ambiti.mjs`: aggiunge il Modello 231 usando solo dati e
 * verifica che estrazione, bozza e controllo di conformità funzionino.
 *
 * ═══ I SEGNAPOSTO ═══
 * `{anno}` è l'anno di rendicontazione, `{dodiciMesi}` il periodo per
 * esteso. Si sciolgono al momento della composizione: un modello non
 * conosce l'anno del cliente, e scriverlo dentro il dato lo renderebbe
 * vero per un anno solo.
 */

export type StatoModello = "impostata" | "in-attesa";

export type SezioneModello = {
  titolo: string;
  /** Spiegazione breve per chi non è del mestiere. */
  spiega?: string;
  /** Il riferimento che la richiede: norma, standard, metodologia. */
  fonte?: string;
  /**
   * La norma la pretende: il controllo di conformità BLOCCA la consegna
   * se manca o è vuota. Non è un'etichetta descrittiva — è la ragione per
   * cui il controllo automatico può esistere senza conoscere i domini.
   */
  obbligatoria?: boolean;
  /** Lo stato di partenza, prima che arrivino documenti e dati. */
  stato?: StatoModello;
  /** Che cosa la sblocca, in parole. */
  attende?: string;
  /** I tipi di documento che la riempiono (chiavi del registro Motore). */
  attendeTipi?: string[];
  /**
   * Il legame coi dati della scheda impresa. È una chiave in un registro
   * di funzioni (`bozza.ts`), non una funzione qui dentro: i dati non
   * stanno nel modello, e il modello non sa come si leggono.
   */
  binding?: string;
  /** Presente solo se l'opzione è attiva nel taglio scelto. */
  soloSe?: string;
};

export type VoceModello = {
  documento: string;
  /** La chiave del tipo, per sapere se è già arrivato. */
  tipo?: string;
  perche: string;
  /** Le etichette dei documenti a cui contribuisce (chip «alimenta …»). */
  destinazioni?: string[];
  soloSe?: string;
};

export type ModelloElaborato = {
  chiave: string;
  /** L'ambito di consulenza a cui appartiene (`ambiti.ts`). */
  ambito: string;
  /** L'etichetta del documento prodotto: è la chiave dei chip. */
  documento: string;
  /** Il titolo del foglio, senza anno. */
  intestazione: string;
  /** L'intestazione porta l'anno di rendicontazione. */
  conAnno?: boolean;
  /**
   * Le designazioni su cui è costruito, come compaiono nel registro
   * norme. Il controllo di conformità verifica che siano IN VIGORE: è
   * così che un elaborato non può citare un'edizione ritirata senza che
   * qualcuno se ne accorga.
   */
  norme?: string[];
  sezioni: SezioneModello[];
  daFornire: VoceModello[];
  /** Quando il fascicolo è vuoto di proposito: da dove si compone. */
  zeroDocumenti?: string;
};

/* ================================================================== */
/* I MODELLI                                                           */
/* ================================================================== */

/** Etichette dei documenti prodotti: restano le stesse dei chip. */
export const DOC_CARBON = "Carbon Footprint";
export const DOC_VSME = "Bilancio VSME";
export const DOC_SCORE = "Profilo ESG per questionari e rating";
export const DOC_KIT = "Kit di comunicazione";
export const DOC_PARITA = "Sistema parità di genere";

export const MODELLI_ELABORATO: ModelloElaborato[] = [
  /* ══ Carbon Footprint ═══════════════════════════════════════════ */
  {
    chiave: "carbon-footprint",
    ambito: "sostenibilita",
    documento: DOC_CARBON,
    intestazione: "Inventario GHG",
    conAnno: true,
    norme: ["UNI EN ISO 14064-1:2019"],
    sezioni: [
      { titolo: "Anagrafica e identificazione dell'organizzazione", binding: "anagrafica", obbligatoria: true },
      { titolo: "Perimetro organizzativo e periodo di rendicontazione", binding: "perimetro", obbligatoria: true },
      {
        titolo: "Metodologia e fattori di emissione",
        stato: "impostata",
        obbligatoria: true,
        fonte: "GHG Protocol · fattori ISPRA/DEFRA",
        spiega:
          "Il metodo e i coefficienti ufficiali che trasformano i consumi in emissioni.",
      },
      {
        titolo: "Scope 1 — emissioni dirette",
        stato: "in-attesa",
        obbligatoria: true,
        attende: "i registri o le fatture dei carburanti del {anno}",
        attendeTipi: ["carburanti", "bolletta-gas"],
        spiega: "Scope 1 = ciò che bruci tu: caldaie, mezzi aziendali, impianti.",
      },
      {
        titolo: "Scope 2 — energia acquistata (location e market based)",
        stato: "in-attesa",
        obbligatoria: true,
        attende: "le bollette elettriche di {dodiciMesi}",
        attendeTipi: ["bolletta-elettrica", "teleriscaldamento"],
        spiega: "Scope 2 = le emissioni dell'energia elettrica che compri.",
      },
      {
        titolo: "Scope 3 — emissioni indirette di filiera",
        stato: "in-attesa",
        soloSe: "scope3",
        attende: "categorie di spesa dalla contabilità fornitori",
        spiega: "Scope 3 = la tua filiera: fornitori, trasporti, beni acquistati.",
      },
      {
        titolo: "Risultati, intensità emissiva e dichiarazioni",
        stato: "in-attesa",
        obbligatoria: true,
        attende: "il calcolo sui dati confermati",
        spiega: "Il totale delle emissioni e il rapporto coi numeri del bilancio.",
      },
    ],
    daFornire: [
      {
        documento: "Bollette di energia elettrica di {dodiciMesi}, per ogni contatore",
        tipo: "bolletta-elettrica",
        perche: "documentano il consumo elettrico per lo Scope 2",
        destinazioni: [DOC_CARBON, DOC_VSME],
      },
      {
        documento: "Bollette del gas o altri combustibili di {dodiciMesi}",
        tipo: "bolletta-gas",
        perche: "servono alle emissioni dirette da riscaldamento (Scope 1)",
        destinazioni: [DOC_CARBON, DOC_VSME],
      },
      {
        documento: "Registri o fatture dei carburanti di {dodiciMesi}",
        tipo: "carburanti",
        perche: "coprono i mezzi aziendali e d'opera nello Scope 1",
        destinazioni: [DOC_CARBON],
      },
      {
        documento: "Categorie di spesa dalla contabilità fornitori",
        soloSe: "scope3",
        perche: "stimano le emissioni di filiera dello Scope 3",
        destinazioni: [DOC_CARBON],
      },
    ],
  },

  /* ══ Bilancio VSME ══════════════════════════════════════════════ */
  {
    chiave: "bilancio-vsme",
    ambito: "sostenibilita",
    documento: DOC_VSME,
    intestazione: "Bilancio di Sostenibilità (VSME)",
    conAnno: true,
    sezioni: [
      { titolo: "Anagrafica e identificazione dell'organizzazione", binding: "anagrafica", obbligatoria: true },
      {
        titolo: "Struttura del bilancio secondo lo standard EFRAG",
        stato: "impostata",
        obbligatoria: true,
        fonte: "Standard VSME, modulo base",
        spiega:
          "VSME = il formato europeo standard del bilancio di sostenibilità: una risposta unica alle richieste di banche e clienti.",
      },
      { titolo: "Profilo dell'impresa e modello di business", binding: "profilo", obbligatoria: true },
      {
        titolo: "Indicatori ambientali",
        stato: "in-attesa",
        obbligatoria: true,
        attende: "i dati del Carbon Footprint o le bollette",
        attendeTipi: ["bolletta-elettrica"],
        spiega: "Energia, emissioni e rifiuti: i numeri ambientali dell'anno.",
      },
      {
        titolo: "Indicatori sociali e di governance",
        stato: "in-attesa",
        obbligatoria: true,
        attende: "i dati di organico aggregati",
        attendeTipi: ["organico", "formazione"],
        spiega:
          "Le persone e il governo dell'impresa: organico, formazione, organi sociali.",
      },
      {
        titolo: "Politiche, azioni e obiettivi (modulo completo)",
        stato: "in-attesa",
        soloSe: "avanzato",
        attende: "le politiche formalizzate dell'impresa",
        attendeTipi: ["politiche"],
        spiega: "Cosa hai deciso di fare, cosa stai facendo e con quale obiettivo.",
      },
      {
        titolo: "Narrativa e prospetto finale",
        stato: "in-attesa",
        obbligatoria: true,
        attende: "gli indicatori confermati",
        spiega: "Il racconto in prosa che accompagna i numeri.",
      },
    ],
    daFornire: [
      {
        documento: "Dati di organico aggregati al 31 dicembre {anno}",
        tipo: "organico",
        perche: "compilano gli indicatori sociali dello standard",
        destinazioni: [DOC_VSME, DOC_PARITA],
      },
      {
        documento: "Composizione degli organi sociali",
        tipo: "organigramma",
        perche: "serve agli indicatori di governance",
        destinazioni: [DOC_VSME],
      },
      {
        documento: "Dati ambientali (o Carbon Footprint attivo)",
        perche: "alimentano la sezione ambientale del bilancio",
        destinazioni: [DOC_VSME],
      },
      {
        documento: "Politiche e obiettivi formalizzati",
        tipo: "politiche",
        soloSe: "avanzato",
        perche: "entrano nel modulo completo per i finanziatori",
        destinazioni: [DOC_VSME],
      },
    ],
  },

  /* ══ Profilo ESG ════════════════════════════════════════════════ */
  {
    chiave: "profilo-esg",
    ambito: "sostenibilita",
    documento: DOC_SCORE,
    intestazione: "Profilo ESG per questionari e rating",
    conAnno: true,
    sezioni: [
      { titolo: "Anagrafica e identificazione dell'organizzazione", binding: "anagrafica", obbligatoria: true },
      {
        titolo: "Questionari mappati sui tuoi dati",
        stato: "impostata",
        obbligatoria: true,
        fonte: "EcoVadis · Synesgy · Open-es · CDP · questionari bancari",
        spiega:
          "Le domande che questi enti fanno, già accostate ai dati che abbiamo: così rispondi una volta e vale per tutti.",
      },
      {
        titolo: "Risposte sulla parte ambientale",
        stato: "in-attesa",
        attende: "i dati del Carbon Footprint",
        spiega:
          "Emissioni ed energia, riprese dal tuo inventario: niente da ricalcolare.",
      },
      {
        titolo: "Risposte sulla parte sociale e di governance",
        stato: "in-attesa",
        attende: "gli indicatori del Bilancio VSME",
        spiega:
          "Persone, organi sociali e politiche, ripresi dal bilancio: nessuna doppia domanda.",
      },
      {
        titolo: "Lacune da colmare prima di rispondere",
        stato: "in-attesa",
        attende: "le risposte confermate",
        spiega:
          "Dove il dossier è ancora scoperto e cosa serve per chiuderlo, in ordine di importanza.",
      },
      {
        titolo: "Dossier pronto da allegare",
        stato: "in-attesa",
        obbligatoria: true,
        attende: "le sezioni precedenti confermate",
        spiega:
          "Il fascicolo da caricare sul portale dell'ente o da mandare alla banca. Il punteggio lo assegnano loro.",
      },
    ],
    daFornire: [],
    zeroDocumenti:
      "Zero documenti da fornire: questo dossier si compone dai dati del Carbon Footprint e del Bilancio VSME che stai già facendo.",
  },

  /* ══ Parità di genere ═══════════════════════════════════════════ */
  {
    chiave: "parita-genere",
    ambito: "sistemi-gestione",
    documento: DOC_PARITA,
    intestazione: "Sistema di Gestione della Parità",
    conAnno: true,
    norme: ["UNI/PdR 125:2022"],
    sezioni: [
      { titolo: "Anagrafica e identificazione dell'organizzazione", binding: "anagrafica", obbligatoria: true },
      {
        titolo: "Le sei aree di KPI della prassi",
        stato: "impostata",
        obbligatoria: true,
        fonte: "UNI/PdR 125:2022",
        spiega:
          "KPI = gli indicatori numerici: la prassi ne prevede sei aree, dalla cultura alla genitorialità.",
      },
      {
        titolo: "KPI quantitativi per area",
        stato: "in-attesa",
        obbligatoria: true,
        attende: "i dati di organico aggregati",
        attendeTipi: ["organico", "formazione"],
        spiega: "I numeri veri della tua impresa dentro ciascuna area.",
      },
      { titolo: "Politica della parità e piano strategico", binding: "politicaParita", obbligatoria: true },
      {
        titolo: "Fascicolo per l'audit dell'organismo",
        stato: "in-attesa",
        obbligatoria: true,
        attende: "le sezioni precedenti confermate",
        spiega:
          "Audit = la visita di controllo dell'ente che rilascia la certificazione.",
      },
    ],
    daFornire: [
      {
        documento: "Dati di organico aggregati per genere e inquadramento",
        tipo: "organico",
        perche: "alimentano i KPI delle sei aree (mai dati nominativi)",
        destinazioni: [DOC_PARITA, DOC_VSME],
      },
      {
        documento: "Politiche HR formalizzate",
        tipo: "politiche",
        perche: "entrano nel sistema di gestione della parità",
        destinazioni: [DOC_PARITA],
      },
    ],
  },
];

/* ------------------------------------------------------------------ */
/* I manuali ISO: stessa struttura, norma diversa                      */
/* ------------------------------------------------------------------ */

/**
 * I tre manuali condividono la struttura HLS — è il punto della HLS — e
 * cambiano solo norma e ambito. Si generano dal dato invece di
 * scriverli tre volte: tre copie diventano tre strutture diverse alla
 * prima modifica.
 */
export function modelloManualeIso(
  ambitoNorma: string,
  norma: string,
): ModelloElaborato {
  return {
    chiave: `manuale-${ambitoNorma.toLowerCase().replace(/\s+/g, "-")}`,
    ambito: "sistemi-gestione",
    documento: `Manuale ${ambitoNorma}`,
    intestazione: `Manuale del Sistema di Gestione ${ambitoNorma}`,
    norme: [norma],
    sezioni: [
      { titolo: "Anagrafica e identificazione dell'organizzazione", binding: "anagrafica", obbligatoria: true },
      {
        titolo: "Struttura HLS del manuale e politica",
        stato: "impostata",
        obbligatoria: true,
        fonte: norma,
        spiega:
          "HLS = la struttura standard dei capitoli, uguale per tutte le norme ISO.",
      },
      { titolo: "Contesto dell'organizzazione e parti interessate", binding: "contesto", obbligatoria: true },
      {
        titolo: "Processi, procedure e modulistica operativa",
        stato: "in-attesa",
        obbligatoria: true,
        attende: "la mappa dei processi (anche in bozza)",
        attendeTipi: ["organigramma", "procedure"],
        spiega: "Come lavori davvero, messo per iscritto in modo controllabile.",
      },
      {
        titolo: "Piano di audit interni e riesame della direzione",
        stato: "impostata",
        obbligatoria: true,
        fonte: norma,
        spiega: "Il calendario dei controlli interni che la norma chiede ogni anno.",
      },
    ],
    daFornire: [
      {
        documento: "Organigramma aggiornato",
        tipo: "organigramma",
        perche: "definisce ruoli e responsabilità richiesti dalla norma",
      },
      {
        documento: "Mappa dei processi (anche in bozza)",
        perche: "è l'ossatura su cui costruiamo le procedure",
      },
      {
        documento: "Procedure esistenti, se ci sono",
        tipo: "procedure",
        perche: "si riusano: nessun lavoro fatto due volte",
      },
    ],
  };
}

/**
 * Quale modello serve un percorso del catalogo, e con quali opzioni.
 * È l'unico punto in cui uno slug di servizio incontra un modello, ed è
 * un DATO: aggiungere un percorso significa aggiungere una riga.
 */
export const MODELLO_PER_PERCORSO: Record<
  string,
  { modello: string; opzioni?: string[] }[]
> = {
  "carbon-footprint-scope-1-2": [{ modello: "carbon-footprint" }],
  "carbon-footprint-scope-1-2-3": [
    { modello: "carbon-footprint", opzioni: ["scope3"] },
  ],
  "bilancio-sostenibilita-vsme-base": [{ modello: "bilancio-vsme" }],
  "bilancio-sostenibilita-vsme-avanzato": [
    { modello: "bilancio-vsme", opzioni: ["avanzato"] },
  ],
  "manuale-sistema-gestione-iso-9001": [{ modello: "manuale-iso-9001" }],
  "manuale-sistema-gestione-iso-14001": [{ modello: "manuale-iso-14001" }],
  "manuale-sistema-gestione-iso-45001": [{ modello: "manuale-iso-45001" }],
  "parita-di-genere-pdr-125": [{ modello: "parita-genere" }],
  // Il bundle si presenta sempre scomposto (§12.F): tre documenti, tre
  // bozze, tre anelli.
  "percorso-ver0": [
    { modello: "carbon-footprint" },
    { modello: "bilancio-vsme" },
    { modello: "profilo-esg" },
  ],
};

const TUTTI = [
  ...MODELLI_ELABORATO,
  modelloManualeIso("ISO 9001", "UNI EN ISO 9001:2015+A1:2024"),
  modelloManualeIso("ISO 14001", "UNI EN ISO 14001:2026"),
  modelloManualeIso("ISO 45001", "UNI EN ISO 45001:2023+A1:2024"),
];

const PER_CHIAVE = new Map(TUTTI.map((m) => [m.chiave, m]));

export function modelloElaborato(chiave: string): ModelloElaborato | undefined {
  return PER_CHIAVE.get(chiave);
}

export function tuttiIModelli(): ModelloElaborato[] {
  return TUTTI;
}

/** I modelli di un ambito: serve al cruscotto e alla prova di estendibilità. */
export function modelliDiAmbito(ambito: string): ModelloElaborato[] {
  return TUTTI.filter((m) => m.ambito === ambito);
}

/* ================================================================== */
/* Il controllo di conformità — generico, non conosce i domini         */
/* ================================================================== */

export type EsitoConformita = {
  conforme: boolean;
  /** Che cosa manca, in italiano, con il rimedio. */
  mancanze: string[];
};

/**
 * Verifica che un elaborato si possa consegnare (docs/motore.md §5).
 *
 * Non sa che cosa sia un Carbon Footprint né un Modello 231: sa che un
 * modello dichiara sezioni obbligatorie e designazioni di norma, e che
 * entrambe vanno verificate. È questa ignoranza a renderlo riusabile su
 * ogni ambito futuro.
 *
 * Il controllo è BLOCCANTE: una consegna con una sezione mancante è
 * peggio di una consegna in ritardo, perché il cliente se ne accorge in
 * audit.
 */
export function controllaConformita(
  modello: ModelloElaborato,
  stato: {
    /** Le sezioni presenti nel documento composto, col loro contenuto. */
    sezioni: { titolo: string; piena: boolean }[];
    /** Le opzioni attive del taglio scelto. */
    opzioni?: string[];
    /** Le designazioni risultate RITIRATE, dal registro norme. */
    normeRitirate?: string[];
    /** I valori numerici senza fonte tracciata o non confermati. */
    valoriSenzaFonte?: string[];
  },
): EsitoConformita {
  const opzioni = new Set(stato.opzioni ?? []);
  const mancanze: string[] = [];
  const presenti = new Map(stato.sezioni.map((s) => [s.titolo, s.piena]));

  for (const s of modello.sezioni) {
    if (!s.obbligatoria) continue;
    if (s.soloSe && !opzioni.has(s.soloSe)) continue;

    if (!presenti.has(s.titolo)) {
      mancanze.push(`Manca la sezione «${s.titolo}», che il modello richiede.`);
    } else if (!presenti.get(s.titolo)) {
      mancanze.push(
        `La sezione «${s.titolo}» è vuota: va compilata prima della consegna.`,
      );
    }
  }

  for (const n of stato.normeRitirate ?? []) {
    mancanze.push(
      `Il documento cita ${n}, che risulta ritirata: va aggiornata all'edizione in vigore prima di consegnarlo.`,
    );
  }

  for (const v of stato.valoriSenzaFonte ?? []) {
    mancanze.push(
      `Il valore «${v}» non ha una fonte tracciata e confermata: non può entrare in un documento consegnato.`,
    );
  }

  return { conforme: mancanze.length === 0, mancanze };
}
