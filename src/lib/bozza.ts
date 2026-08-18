import { getServizio } from "@/lib/catalog";

/**
 * LA BOZZA DEL DOCUMENTO (SPEC §12.G «mai una checklist vuota» + §12.F).
 *
 * La schermata di un percorso attivo si apre sul lavoro già svolto: la
 * struttura reale del documento in uscita, con le sezioni già impostate
 * dal Motore, quelle popolate coi dati disponibili (e la provenienza
 * dichiarata) e quelle in attesa — segnate ma visibili, perché il
 * cliente deve vedere la forma del suo documento dal primo minuto.
 *
 * §12.F aggiunge tre regole:
 * - BUNDLE SCOMPOSTO: il Percorso Ver0 si presenta sempre articolato nei
 *   suoi documenti componenti, ciascuno con bozza, anello e fascicolo
 *   propri — e con la nomenclatura completa, mai «carbon» nudo;
 * - UN DATO, PIÙ DOCUMENTI: ogni voce da fornire dichiara a quali
 *   documenti contribuisce (`destinazioni`), così il principio «rispondi
 *   una volta sola» si vede scritto;
 * - LINGUAGGIO PER NON ESPERTI: ogni sezione con un termine tecnico
 *   porta la spiegazione breve (`spiega`).
 *
 * Finché la 2.1 (arricchimento) non è attiva, la precompilazione onesta
 * è: anagrafica dalla registrazione, struttura e riferimenti normativi
 * del percorso già impostati, il resto marcato come lavoro del Motore o
 * in attesa dei documenti del fascicolo.
 */

export type StatoSezione =
  /** Leggibile coi dati veri, provenienza dichiarata. */
  | "popolata"
  /** Struttura e riferimenti già impostati dal Motore. */
  | "impostata"
  /** Visibile ma in attesa: si compila coi documenti del fascicolo. */
  | "in-attesa";

export type SezioneBozza = {
  titolo: string;
  stato: StatoSezione;
  /** Spiegazione breve per chi non è del mestiere (§12.F). */
  spiega?: string;
  /** Righe leggibili (solo per le sezioni popolate). */
  righe?: { etichetta: string; valore: string }[];
  /** La fonte del contenuto: "registrazione", "UNI EN ISO 14064-1"… */
  fonte?: string;
  /** Per le sezioni in attesa: cosa le sblocca. */
  attende?: string;
};

export type VoceDaFornire = {
  documento: string;
  /** Il perché, sempre: mai il tono del compito assegnato. */
  perche: string;
  /** A quali documenti contribuisce questo dato (etichette DOC_*). */
  destinazioni?: string[];
};

export type Bozza = {
  /** Intestazione del foglio: "Bozza · Inventario GHG 2026". */
  intestazione: string;
  sezioni: SezioneBozza[];
  daFornire: VoceDaFornire[];
  /** Quando il fascicolo è vuoto di proposito: da dove si compone. */
  zeroDocumenti?: string;
};

type DatiOrg = { ragione_sociale: string; partita_iva: string };

const ANNO = 2026;

/* ------------------------------------------------------------------ */
/* Etichette dei documenti (per i chip «→ contribuisce a…», §12.F)     */
/* ------------------------------------------------------------------ */

export const DOC_CARBON = "Carbon Footprint";
export const DOC_VSME = "Bilancio VSME";
export const DOC_SCORE = "Profilo score ESG";
export const DOC_KIT = "Kit di comunicazione";
export const DOC_PARITA = "Sistema parità di genere";

/** Etichetta del documento prodotto da ciascun modulo del catalogo. */
const ETICHETTA_MODULO: Record<string, string> = {
  "carbon-footprint-scope-1-2": DOC_CARBON,
  "carbon-footprint-scope-1-2-3": DOC_CARBON,
  "bilancio-sostenibilita-vsme-base": DOC_VSME,
  "bilancio-sostenibilita-vsme-avanzato": DOC_VSME,
  "manuale-sistema-gestione-iso-9001": "Manuale ISO 9001",
  "manuale-sistema-gestione-iso-14001": "Manuale ISO 14001",
  "manuale-sistema-gestione-iso-45001": "Manuale ISO 45001",
  "parita-di-genere-pdr-125": DOC_PARITA,
  "iso-45003": "Fascicolo ISO 45003",
  "iso-30415": "Fascicolo ISO 30415",
  sa8000: "Fascicolo SA8000",
  "rating-economia-circolare": "Rating di circolarità",
};

/** Le etichette dei documenti in lavorazione, dati i moduli attivi:
 *  servono a filtrare i chip di destinazione su ciò che esiste davvero. */
export function documentiAttivi(moduli: string[]): Set<string> {
  const out = new Set<string>();
  for (const m of moduli) {
    if (m === "percorso-ver0") {
      [DOC_CARBON, DOC_VSME, DOC_SCORE, DOC_KIT].forEach((d) => out.add(d));
    } else if (ETICHETTA_MODULO[m]) {
      out.add(ETICHETTA_MODULO[m]);
    }
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* Le bozze                                                            */
/* ------------------------------------------------------------------ */

/** Anagrafica dalla registrazione: la sezione popolata di ogni bozza. */
function sezioneAnagrafica(org: DatiOrg): SezioneBozza {
  return {
    titolo: "Anagrafica e identificazione dell'organizzazione",
    stato: "popolata",
    fonte: "registrazione",
    spiega: "Chi sei: la carta d'identità dell'impresa, già compilata.",
    righe: [
      { etichetta: "Organizzazione", valore: org.ragione_sociale },
      { etichetta: "Partita IVA", valore: org.partita_iva },
      { etichetta: "Anno di riferimento", valore: String(ANNO) },
    ],
  };
}

function bozzaCarbon(org: DatiOrg, conScope3: boolean): Bozza {
  return {
    intestazione: `Bozza · Inventario GHG ${ANNO}`,
    sezioni: [
      sezioneAnagrafica(org),
      {
        titolo: "Perimetro organizzativo e periodo di rendicontazione",
        stato: "impostata",
        fonte: "UNI EN ISO 14064-1:2019 §5",
        spiega: "Quali sedi e attività entrano nel calcolo, e per quale anno.",
      },
      {
        titolo: "Metodologia e fattori di emissione",
        stato: "impostata",
        fonte: "GHG Protocol · fattori ISPRA/DEFRA",
        spiega:
          "Il metodo e i coefficienti ufficiali che trasformano i consumi in emissioni.",
      },
      {
        titolo: "Scope 1 — emissioni dirette",
        stato: "in-attesa",
        attende: "registri o fatture dei carburanti",
        spiega:
          "Scope 1 = ciò che bruci tu: caldaie, mezzi aziendali, impianti.",
      },
      {
        titolo: "Scope 2 — energia acquistata (location e market based)",
        stato: "in-attesa",
        attende: "bollette elettriche di tutti i contatori",
        spiega: "Scope 2 = le emissioni dell'energia elettrica che compri.",
      },
      ...(conScope3
        ? [
            {
              titolo: "Scope 3 — emissioni indirette di filiera",
              stato: "in-attesa" as const,
              attende: "categorie di spesa dalla contabilità fornitori",
              spiega:
                "Scope 3 = la tua filiera: fornitori, trasporti, beni acquistati.",
            },
          ]
        : []),
      {
        titolo: "Risultati, intensità emissiva e dichiarazioni",
        stato: "in-attesa",
        attende: "il calcolo sui dati confermati",
        spiega:
          "Il totale delle emissioni e il rapporto coi numeri del bilancio.",
      },
    ],
    daFornire: [
      {
        documento: "Bollette di energia elettrica (tutti i contatori)",
        perche: "documentano il consumo elettrico per lo Scope 2",
        destinazioni: [DOC_CARBON, DOC_VSME],
      },
      {
        documento: "Bollette del gas o altri combustibili",
        perche: "servono alle emissioni dirette da riscaldamento (Scope 1)",
        destinazioni: [DOC_CARBON, DOC_VSME],
      },
      {
        documento: "Registri o fatture dei carburanti",
        perche: "coprono i mezzi aziendali e d'opera nello Scope 1",
        destinazioni: [DOC_CARBON],
      },
      ...(conScope3
        ? [
            {
              documento: "Categorie di spesa dalla contabilità fornitori",
              perche: "stimano le emissioni di filiera dello Scope 3",
              destinazioni: [DOC_CARBON],
            },
          ]
        : []),
    ],
  };
}

function bozzaVsme(org: DatiOrg, avanzato: boolean): Bozza {
  return {
    intestazione: `Bozza · Bilancio di Sostenibilità (VSME) ${ANNO}`,
    sezioni: [
      sezioneAnagrafica(org),
      {
        titolo: "Struttura del bilancio secondo lo standard EFRAG",
        stato: "impostata",
        fonte: `Standard VSME, modulo base${avanzato ? " + completo" : ""}`,
        spiega:
          "VSME = il formato europeo standard del bilancio di sostenibilità: una risposta unica alle richieste di banche e clienti.",
      },
      {
        titolo: "Indicatori ambientali",
        stato: "in-attesa",
        attende: "i dati del Carbon Footprint o le bollette",
        spiega: "Energia, emissioni e rifiuti: i numeri ambientali dell'anno.",
      },
      {
        titolo: "Indicatori sociali e di governance",
        stato: "in-attesa",
        attende: "i dati di organico aggregati",
        spiega:
          "Le persone e il governo dell'impresa: organico, formazione, organi sociali.",
      },
      ...(avanzato
        ? [
            {
              titolo: "Politiche, azioni e obiettivi (modulo completo)",
              stato: "in-attesa" as const,
              attende: "le politiche formalizzate dell'impresa",
              spiega:
                "Cosa hai deciso di fare, cosa stai facendo e con quale obiettivo.",
            },
          ]
        : []),
      {
        titolo: "Narrativa e prospetto finale",
        stato: "in-attesa",
        attende: "gli indicatori confermati",
        spiega: "Il racconto in prosa che accompagna i numeri.",
      },
    ],
    daFornire: [
      {
        documento: "Dati di organico aggregati",
        perche: "compilano gli indicatori sociali dello standard",
        destinazioni: [DOC_VSME, DOC_PARITA],
      },
      {
        documento: "Composizione degli organi sociali",
        perche: "serve agli indicatori di governance",
        destinazioni: [DOC_VSME],
      },
      {
        documento: "Dati ambientali (o Carbon Footprint attivo)",
        perche: "alimentano la sezione ambientale del bilancio",
        destinazioni: [DOC_VSME],
      },
      ...(avanzato
        ? [
            {
              documento: "Politiche e obiettivi formalizzati",
              perche: "entrano nel modulo completo per i finanziatori",
              destinazioni: [DOC_VSME],
            },
          ]
        : []),
    ],
  };
}

/** Miglioramento score (componente del Percorso Ver0): si compone dai
 *  dati degli altri due documenti — l'esempio vivo di «zero documenti». */
function bozzaScore(org: DatiOrg): Bozza {
  return {
    intestazione: `Bozza · Profilo Score ESG ${ANNO}`,
    sezioni: [
      sezioneAnagrafica(org),
      {
        titolo: "Mappatura dei questionari di banche e capofiliera",
        stato: "impostata",
        fonte: "questionari bancari · CDP · EcoVadis",
        spiega:
          "Le domande che banche e grandi clienti ti faranno, già mappate sui tuoi dati.",
      },
      {
        titolo: "Indicatori ambientali per i rating",
        stato: "in-attesa",
        attende: "i dati del Carbon Footprint",
        spiega: "I numeri sulle emissioni, ripresi dal tuo inventario.",
      },
      {
        titolo: "Indicatori sociali e di governance per i rating",
        stato: "in-attesa",
        attende: "gli indicatori del Bilancio VSME",
        spiega: "Ripresi dal bilancio di sostenibilità: nessuna doppia domanda.",
      },
      {
        titolo: "Piano di miglioramento dello score",
        stato: "in-attesa",
        attende: "gli indicatori confermati",
        spiega: "Dove guadagni punti con meno sforzo: azioni in ordine di resa.",
      },
    ],
    daFornire: [],
    zeroDocumenti:
      "Zero documenti da fornire: questo profilo si compone da solo coi dati del Carbon Footprint e del Bilancio VSME.",
  };
}

/** Kit di comunicazione (componente del Percorso Ver0). */
function bozzaKit(org: DatiOrg): Bozza {
  return {
    intestazione: `Bozza · Kit di Comunicazione ${ANNO}`,
    sezioni: [
      sezioneAnagrafica(org),
      {
        titolo: "Linee d'uso del Sigillo e della targa",
        stato: "impostata",
        fonte: "identità Ver0",
        spiega: "Dove e come puoi usare il Sigillo: sito, firma email, offerte.",
      },
      {
        titolo: "Testi pronti per sito e presentazioni",
        stato: "in-attesa",
        attende: "i risultati validati dei tuoi documenti",
        spiega:
          "Frasi corrette e verificabili sul tuo percorso: mai promesse gonfiate.",
      },
      {
        titolo: "Scheda per clienti e capofiliera",
        stato: "in-attesa",
        attende: "i documenti emessi",
        spiega: "La pagina da allegare alle offerte quando ti chiedono i dati.",
      },
    ],
    daFornire: [
      {
        documento: "Il tuo logo in buona qualità (facoltativo)",
        perche: "solo se vuoi i materiali già impaginati col tuo marchio",
        destinazioni: [DOC_KIT],
      },
    ],
  };
}

function bozzaManualeIso(org: DatiOrg, norma: string, ambito: string): Bozza {
  return {
    intestazione: `Bozza · Manuale del Sistema di Gestione ${ambito}`,
    sezioni: [
      sezioneAnagrafica(org),
      {
        titolo: "Struttura HLS del manuale e politica",
        stato: "impostata",
        fonte: norma,
        spiega:
          "HLS = la struttura standard dei capitoli, uguale per tutte le norme ISO.",
      },
      {
        titolo: "Contesto dell'organizzazione e parti interessate",
        stato: "in-attesa",
        attende: "visura e organigramma",
        spiega: "Chi sei, chi lavora con te e chi ha interesse in ciò che fai.",
      },
      {
        titolo: "Processi, procedure e modulistica operativa",
        stato: "in-attesa",
        attende: "la mappa dei processi (anche in bozza)",
        spiega: "Come lavori davvero, messo per iscritto in modo controllabile.",
      },
      {
        titolo: "Piano di audit interni e riesame della direzione",
        stato: "impostata",
        fonte: norma,
        spiega:
          "Il calendario dei controlli interni che la norma chiede ogni anno.",
      },
    ],
    daFornire: [
      {
        documento: "Organigramma aggiornato",
        perche: "definisce ruoli e responsabilità richiesti dalla norma",
      },
      {
        documento: "Mappa dei processi (anche in bozza)",
        perche: "è l'ossatura su cui il Motore costruisce le procedure",
      },
      {
        documento: "Procedure esistenti, se ci sono",
        perche: "si riusano: nessun lavoro fatto due volte",
      },
    ],
  };
}

function bozzaPdr125(org: DatiOrg): Bozza {
  return {
    intestazione: `Bozza · Sistema di Gestione della Parità ${ANNO}`,
    sezioni: [
      sezioneAnagrafica(org),
      {
        titolo: "Le sei aree di KPI della prassi",
        stato: "impostata",
        fonte: "UNI/PdR 125:2022",
        spiega:
          "KPI = gli indicatori numerici: la prassi ne prevede sei aree, dalla cultura alla genitorialità.",
      },
      {
        titolo: "KPI quantitativi per area",
        stato: "in-attesa",
        attende: "i dati di organico aggregati",
        spiega: "I numeri veri della tua impresa dentro ciascuna area.",
      },
      {
        titolo: "Politica della parità e piano strategico",
        stato: "in-attesa",
        attende: "le politiche HR esistenti",
        spiega: "Gli impegni scritti e il piano per mantenerli nel tempo.",
      },
      {
        titolo: "Fascicolo per l'audit dell'organismo",
        stato: "in-attesa",
        attende: "le sezioni precedenti confermate",
        spiega:
          "Audit = la visita di controllo dell'ente che rilascia la certificazione.",
      },
    ],
    daFornire: [
      {
        documento: "Dati di organico aggregati per genere e inquadramento",
        perche: "alimentano i KPI delle sei aree (mai dati nominativi)",
        destinazioni: [DOC_PARITA, DOC_VSME],
      },
      {
        documento: "Politiche HR formalizzate",
        perche: "entrano nel sistema di gestione della parità",
        destinazioni: [DOC_PARITA],
      },
    ],
  };
}

/** Fallback onesto per i percorsi senza bozza dedicata: struttura dal
 *  catalogo (gli output del servizio come sezioni). */
function bozzaGenerica(org: DatiOrg, slug: string): Bozza {
  const s = getServizio(slug);
  const output = s?.output ?? [];
  return {
    intestazione: `Bozza · ${s?.name ?? "Documento del percorso"}`,
    sezioni: [
      sezioneAnagrafica(org),
      ...output.slice(0, 4).map(
        (o, i): SezioneBozza => ({
          titolo: o,
          stato: i === 0 ? "impostata" : "in-attesa",
          fonte: i === 0 ? (s?.riferimenti?.[0] ?? undefined) : undefined,
          attende: i === 0 ? undefined : "i documenti del fascicolo",
        }),
      ),
    ],
    daFornire: (s?.documenti ?? []).slice(0, 4).map((d) => ({
      documento: d,
      perche: `entra nel fascicolo di ${s?.name ?? "questo percorso"}`,
    })),
  };
}

/** La bozza del singolo documento, con la precompilazione onesta di oggi. */
export function bozzaPercorso(slug: string, org: DatiOrg): Bozza {
  switch (slug) {
    case "carbon-footprint-scope-1-2":
      return bozzaCarbon(org, false);
    case "carbon-footprint-scope-1-2-3":
      return bozzaCarbon(org, true);
    case "bilancio-sostenibilita-vsme-base":
      return bozzaVsme(org, false);
    case "bilancio-sostenibilita-vsme-avanzato":
      return bozzaVsme(org, true);
    case "manuale-sistema-gestione-iso-9001":
      return bozzaManualeIso(org, "UNI EN ISO 9001:2015", "ISO 9001");
    case "manuale-sistema-gestione-iso-14001":
      return bozzaManualeIso(org, "UNI EN ISO 14001:2015", "ISO 14001");
    case "manuale-sistema-gestione-iso-45001":
      return bozzaManualeIso(org, "UNI ISO 45001:2018", "ISO 45001");
    case "parita-di-genere-pdr-125":
      return bozzaPdr125(org);
    case "percorso-ver0":
      // Il bundle non ha una bozza unica: si presenta sempre scomposto
      // (§12.F). Chi chiede la bozza del bundle riceve il primo componente.
      return bozzaCarbon(org, false);
    default:
      return bozzaGenerica(org, slug);
  }
}

/* ------------------------------------------------------------------ */
/* Bundle scomposto (§12.F)                                            */
/* ------------------------------------------------------------------ */

export type ComponentePercorso = {
  key: string;
  /** Nomenclatura completa: mai «carbon» nudo. */
  nome: string;
  taglio?: string;
  /** Etichetta breve del documento (per i chip di destinazione). */
  doc?: string;
  bozza: Bozza;
};

/**
 * I documenti di un percorso attivo. Per i moduli singoli è uno solo;
 * per il Percorso Ver0 sono i quattro componenti del bundle, ciascuno
 * con la propria bozza (e quindi il proprio anello e fascicolo).
 */
export function componentiPercorso(
  slug: string,
  org: DatiOrg,
): ComponentePercorso[] {
  if (slug === "percorso-ver0") {
    return [
      {
        key: "carbon",
        nome: "Carbon Footprint di Organizzazione",
        taglio: "Scope 1 e 2",
        doc: DOC_CARBON,
        bozza: bozzaCarbon(org, false),
      },
      {
        key: "vsme",
        nome: "Bilancio di Sostenibilità (VSME)",
        taglio: "Base",
        doc: DOC_VSME,
        bozza: bozzaVsme(org, false),
      },
      {
        key: "score",
        nome: "Miglioramento dello Score di Rating ESG",
        doc: DOC_SCORE,
        bozza: bozzaScore(org),
      },
      {
        key: "kit",
        nome: "Kit di Comunicazione",
        doc: DOC_KIT,
        bozza: bozzaKit(org),
      },
    ];
  }
  const s = getServizio(slug);
  return [
    {
      key: slug,
      nome: s?.name ?? slug,
      taglio: s?.taglio,
      doc: ETICHETTA_MODULO[slug],
      bozza: bozzaPercorso(slug, org),
    },
  ];
}

/** Percentuale di completamento della bozza: sezioni già composte dal
 *  Motore (popolate + impostate) sul totale. Onesta e già significativa,
 *  perché la struttura È lavoro fatto. */
export function completamentoBozza(bozza: Bozza): number {
  const fatte = bozza.sezioni.filter((s) => s.stato !== "in-attesa").length;
  return Math.round((fatte / bozza.sezioni.length) * 100);
}
