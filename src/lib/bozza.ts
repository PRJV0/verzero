import { getServizio } from "@/lib/catalog";
import {
  annoRendicontazioneDefault,
  dodiciMesiDi,
  intestazioneDocumento,
  periodoEsteso,
} from "@/lib/periodo";

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
  /** I documenti che servono sono arrivati: manca la lettura. */
  | "ricevuta"
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
  /** Per le sezioni in attesa: cosa le sblocca, in parole. */
  attende?: string;
  /** Gli stessi documenti, come chiavi dei tipi (src/lib/documenti.ts):
   *  servono a capire quando la sezione ha ricevuto ciò che aspettava. */
  attendeTipi?: string[];
};

export type VoceDaFornire = {
  documento: string;
  /** La chiave del tipo (src/lib/documenti.ts), per sapere se è arrivato. */
  tipo?: string;
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

type DatiOrg = {
  ragione_sociale: string;
  partita_iva: string;
  /** L'anno solare CHIUSO a cui i documenti si riferiscono (SPEC §12.C):
   *  mai l'anno in cui li elaboriamo. */
  anno_rendicontazione?: number;
};

/** L'anno di rendicontazione dell'impresa, o l'ultimo chiuso. */
function annoDi(org: DatiOrg): number {
  return org.anno_rendicontazione ?? annoRendicontazioneDefault();
}

/**
 * I campi già noti della scheda impresa (tappa 2.1): inseriti dal cliente
 * o recuperati dal Motore. Entrano nelle bozze non appena esistono — è
 * così che l'arricchimento si vede nei documenti e fa salire l'anello,
 * invece di restare un dettaglio nascosto nella scheda.
 */
export type CampiNoti = Record<string, { valore: string; fonte: string | null }>;


/* ------------------------------------------------------------------ */
/* Etichette dei documenti (per i chip «→ contribuisce a…», §12.F)     */
/* ------------------------------------------------------------------ */

export const DOC_CARBON = "Carbon Footprint";
export const DOC_VSME = "Bilancio VSME";
/** Prepariamo il dossier: il punteggio lo assegna sempre l'ente terzo. */
export const DOC_SCORE = "Profilo ESG per questionari e rating";
/** Strumento INCLUSO nel canone, non un documento acquistato (§12.C):
 *  resta come etichetta per la fascia «incluso nel tuo abbonamento», ma
 *  non compare fra i deliverable né nel conteggio «Documento X di Y». */
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
      [DOC_CARBON, DOC_VSME, DOC_SCORE].forEach((d) => out.add(d));
    } else if (ETICHETTA_MODULO[m]) {
      out.add(ETICHETTA_MODULO[m]);
    }
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* Le bozze                                                            */
/* ------------------------------------------------------------------ */

/** Anagrafica: la sezione popolata di ogni bozza, che cresce col Motore. */
function sezioneAnagrafica(org: DatiOrg, campi: CampiNoti = {}): SezioneBozza {
  const anno = annoDi(org);
  const righe = [
    { etichetta: "Organizzazione", valore: org.ragione_sociale },
    { etichetta: "Partita IVA", valore: org.partita_iva },
    { etichetta: "Anno di rendicontazione", valore: String(anno) },
  ];
  // Ogni dato recuperato entra nel documento appena arriva (tappa 2.1).
  if (campi.forma_giuridica) {
    righe.push({
      etichetta: "Forma giuridica",
      valore: campi.forma_giuridica.valore,
    });
  }
  if (campi.ateco) {
    righe.push({ etichetta: "Attività (ATECO)", valore: campi.ateco.valore });
  }

  // Il badge sul foglio deve dire la verità su chi ha composto la sezione.
  const recuperate = [campi.forma_giuridica, campi.ateco]
    .map((c) => c?.fonte)
    .filter((f): f is string => !!f);

  return {
    titolo: "Anagrafica e identificazione dell'organizzazione",
    stato: "popolata",
    fonte:
      recuperate.length > 0
        ? `registrazione · ${[...new Set(recuperate)].join(" · ")}`
        : "registrazione",
    spiega: "Chi sei: la carta d'identità dell'impresa, già compilata.",
    righe,
  };
}

/** Le citazioni dal sito possono essere lunghe: nel foglio se ne mostra
 *  un estratto leggibile, il testo intero resta nella scheda impresa. */
function estratto(valore: string, massimo = 170): string {
  const pulito = valore.replace(/\s+/g, " ").trim();
  return pulito.length <= massimo
    ? pulito
    : `${pulito.slice(0, massimo - 1).replace(/[\s,;.]+$/, "")}…`;
}

/**
 * Le sezioni QUALITATIVE (SPEC §12.D): quelle che nessuna banca dati
 * riempie e che il cliente ha già scritto sul proprio sito. Il contenuto
 * è sempre una CITAZIONE del cliente, mai una nostra sintesi, e la fonte
 * porta l'indirizzo della pagina — è ciò che rende il documento
 * difendibile davanti a chi lo legge.
 */
function righeDalSito(
  campi: CampiNoti,
  chiavi: { chiave: string; etichetta: string }[],
): { righe: { etichetta: string; valore: string }[]; fonte: string | null } {
  const righe = chiavi
    .filter((c) => campi[c.chiave])
    .map((c) => ({
      etichetta: c.etichetta,
      valore: estratto(campi[c.chiave].valore),
    }));
  const fonti = chiavi
    .map((c) => campi[c.chiave]?.fonte)
    .filter((f): f is string => !!f);
  return { righe, fonte: fonti.length > 0 ? [...new Set(fonti)][0] : null };
}

/**
 * Perimetro organizzativo: finché non sappiamo dove sei, la sezione è
 * solo impostata sulla norma. Con la sede legale recuperata diventa
 * POPOLATA — ed è il momento in cui l'anello del percorso sale davvero.
 */
function sezionePerimetro(campi: CampiNoti, anno: number): SezioneBozza {
  const sede = campi.sede_legale;
  if (!sede) {
    return {
      titolo: "Perimetro organizzativo e periodo di rendicontazione",
      stato: "impostata",
      fonte: "UNI EN ISO 14064-1:2019 §5",
      spiega: "Quali sedi e attività entrano nel calcolo, e per quale anno.",
    };
  }
  return {
    titolo: "Perimetro organizzativo e periodo di rendicontazione",
    stato: "popolata",
    fonte: sede.fonte
      ? `${sede.fonte} · UNI EN ISO 14064-1:2019 §5`
      : "UNI EN ISO 14064-1:2019 §5",
    spiega: "Quali sedi e attività entrano nel calcolo, e per quale anno.",
    righe: [
      { etichetta: "Sede legale", valore: sede.valore },
      {
        etichetta: "Periodo di rendicontazione",
        valore: periodoEsteso(anno),
      },
      { etichetta: "Criterio di consolidamento", valore: "Controllo operativo" },
    ],
  };
}

/** VSME: chi è l'impresa e cosa fa, con le sue stesse parole. */
function sezioneProfiloImpresa(campi: CampiNoti): SezioneBozza {
  const { righe, fonte } = righeDalSito(campi, [
    { chiave: "descrizione_attivita", etichetta: "Attività" },
    { chiave: "prodotti_servizi", etichetta: "Prodotti e servizi" },
    { chiave: "mercati", etichetta: "Mercati" },
    { chiave: "certificazioni_esposte", etichetta: "Certificazioni dichiarate" },
  ]);
  if (righe.length === 0) {
    return {
      titolo: "Profilo dell'impresa e modello di business",
      stato: "impostata",
      fonte: "Standard VSME · informativa generale",
      spiega: "Chi sei e cosa fai: la parte narrativa che apre il bilancio.",
      attende: "le informazioni pubblicate sul tuo sito",
    };
  }
  return {
    titolo: "Profilo dell'impresa e modello di business",
    stato: "popolata",
    fonte: fonte ?? "Sito ufficiale",
    spiega:
      "Chi sei e cosa fai, riportato dalle tue stesse pagine: nessuna parola messa in bocca all'impresa.",
    righe,
  };
}

/** Manuali ISO: il contesto dell'organizzazione (punto 4 della norma). */
function sezioneContesto(campi: CampiNoti): SezioneBozza {
  const { righe, fonte } = righeDalSito(campi, [
    { chiave: "descrizione_attivita", etichetta: "Attività" },
    { chiave: "sedi_operative", etichetta: "Sedi e stabilimenti" },
    { chiave: "mercati", etichetta: "Mercati" },
  ]);
  if (righe.length === 0) {
    return {
      titolo: "Contesto dell'organizzazione e parti interessate",
      stato: "in-attesa",
      attende: "visura e organigramma",
      spiega: "Chi sei, chi lavora con te e chi ha interesse in ciò che fai.",
    };
  }
  return {
    titolo: "Contesto dell'organizzazione e parti interessate",
    stato: "popolata",
    fonte: fonte ?? "Sito ufficiale",
    spiega:
      "Chi sei, dove operi e su quali mercati: la norma parte da qui, e queste sono le tue parole.",
    righe,
  };
}

/** UNI/PdR 125: le politiche già pubblicate come base di partenza. */
function sezionePoliticaParita(campi: CampiNoti): SezioneBozza {
  const policy = campi.policy_pubblicate;
  if (!policy) {
    return {
      titolo: "Politica della parità e piano strategico",
      stato: "in-attesa",
      attende: "le politiche HR esistenti",
      spiega: "Gli impegni scritti e il piano per mantenerli nel tempo.",
    };
  }
  return {
    titolo: "Politica della parità e piano strategico",
    stato: "popolata",
    fonte: policy.fonte ?? "Sito ufficiale",
    spiega:
      "Gli impegni scritti e il piano per mantenerli. Partiamo dalle politiche che hai già pubblicato.",
    righe: [
      {
        etichetta: "Politiche già pubblicate",
        valore: estratto(policy.valore),
      },
    ],
  };
}

function bozzaCarbon(org: DatiOrg, conScope3: boolean, campi: CampiNoti = {}): Bozza {
  const anno = annoDi(org);
  return {
    intestazione: `Bozza · ${intestazioneDocumento("Inventario GHG", anno)}`,
    sezioni: [
      sezioneAnagrafica(org, campi),
      sezionePerimetro(campi, anno),
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
        attende: `i registri o le fatture dei carburanti del ${anno}`,
        attendeTipi: ["carburanti", "bolletta-gas"],
        spiega:
          "Scope 1 = ciò che bruci tu: caldaie, mezzi aziendali, impianti.",
      },
      {
        titolo: "Scope 2 — energia acquistata (location e market based)",
        stato: "in-attesa",
        attende: `le bollette elettriche di ${dodiciMesiDi(anno)}`,
        attendeTipi: ["bolletta-elettrica"],
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
        documento: `Bollette di energia elettrica di ${dodiciMesiDi(anno)}, per ogni contatore`,
        tipo: "bolletta-elettrica",
        perche: "documentano il consumo elettrico per lo Scope 2",
        destinazioni: [DOC_CARBON, DOC_VSME],
      },
      {
        documento: `Bollette del gas o altri combustibili di ${dodiciMesiDi(anno)}`,
        tipo: "bolletta-gas",
        perche: "servono alle emissioni dirette da riscaldamento (Scope 1)",
        destinazioni: [DOC_CARBON, DOC_VSME],
      },
      {
        documento: `Registri o fatture dei carburanti di ${dodiciMesiDi(anno)}`,
        tipo: "carburanti",
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

function bozzaVsme(org: DatiOrg, avanzato: boolean, campi: CampiNoti = {}): Bozza {
  const anno = annoDi(org);
  return {
    intestazione: `Bozza · ${intestazioneDocumento("Bilancio di Sostenibilità (VSME)", anno)}`,
    sezioni: [
      sezioneAnagrafica(org, campi),
      {
        titolo: "Struttura del bilancio secondo lo standard EFRAG",
        stato: "impostata",
        fonte: `Standard VSME, modulo base${avanzato ? " + completo" : ""}`,
        spiega:
          "VSME = il formato europeo standard del bilancio di sostenibilità: una risposta unica alle richieste di banche e clienti.",
      },
      sezioneProfiloImpresa(campi),
      {
        titolo: "Indicatori ambientali",
        stato: "in-attesa",
        attende: "i dati del Carbon Footprint o le bollette",
        attendeTipi: ["bolletta-elettrica"],
        spiega: "Energia, emissioni e rifiuti: i numeri ambientali dell'anno.",
      },
      {
        titolo: "Indicatori sociali e di governance",
        stato: "in-attesa",
        attende: "i dati di organico aggregati",
        attendeTipi: ["organico"],
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
        documento: `Dati di organico aggregati al 31 dicembre ${anno}`,
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
      ...(avanzato
        ? [
            {
              documento: "Politiche e obiettivi formalizzati",
        tipo: "politiche",
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
/**
 * PROFILO ESG PER QUESTIONARI E RATING DI TERZE PARTI (SPEC §12.C).
 *
 * Ver0 NON è un'agenzia di rating e non emette punteggi propri. Quello
 * che facciamo è preparare il dossier: componiamo le risposte dai dati
 * già raccolti, segnaliamo dove mancano evidenze e mettiamo tutto in
 * ordine per il momento in cui l'ente terzo — EcoVadis, Synesgy,
 * Open-es, CDP, la banca — farà le sue domande. Il punteggio lo assegna
 * sempre e solo l'ente terzo, e in queste sezioni non c'è nulla che
 * possa far pensare il contrario.
 */
function bozzaScore(org: DatiOrg, campi: CampiNoti = {}): Bozza {
  const anno = annoDi(org);
  return {
    intestazione: `Bozza · ${intestazioneDocumento("Profilo ESG per questionari e rating", anno)}`,
    sezioni: [
      sezioneAnagrafica(org, campi),
      {
        titolo: "Questionari mappati sui tuoi dati",
        stato: "impostata",
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
        attende: "le sezioni precedenti confermate",
        spiega:
          "Il fascicolo da caricare sul portale dell'ente o da mandare alla banca. Il punteggio lo assegnano loro.",
      },
    ],
    daFornire: [],
    zeroDocumenti:
      "Zero documenti da fornire: questo dossier si compone dai dati del Carbon Footprint e del Bilancio VSME che stai già facendo.",
  };
}

function bozzaManualeIso(org: DatiOrg, norma: string, ambito: string, campi: CampiNoti = {}): Bozza {
  return {
    intestazione: `Bozza · Manuale del Sistema di Gestione ${ambito} · elaborato nel ${new Date().getFullYear()}`,
    sezioni: [
      sezioneAnagrafica(org, campi),
      {
        titolo: "Struttura HLS del manuale e politica",
        stato: "impostata",
        fonte: norma,
        spiega:
          "HLS = la struttura standard dei capitoli, uguale per tutte le norme ISO.",
      },
      sezioneContesto(campi),
      {
        titolo: "Processi, procedure e modulistica operativa",
        stato: "in-attesa",
        attende: "la mappa dei processi (anche in bozza)",
        attendeTipi: ["organigramma", "politiche"],
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
        tipo: "organigramma",
        perche: "definisce ruoli e responsabilità richiesti dalla norma",
      },
      {
        documento: "Mappa dei processi (anche in bozza)",
        perche: "è l'ossatura su cui costruiamo le procedure",
      },
      {
        documento: "Procedure esistenti, se ci sono",
        tipo: "politiche",
        perche: "si riusano: nessun lavoro fatto due volte",
      },
    ],
  };
}

function bozzaPdr125(org: DatiOrg, campi: CampiNoti = {}): Bozza {
  const anno = annoDi(org);
  return {
    intestazione: `Bozza · ${intestazioneDocumento("Sistema di Gestione della Parità", anno)}`,
    sezioni: [
      sezioneAnagrafica(org, campi),
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
        attendeTipi: ["organico"],
        spiega: "I numeri veri della tua impresa dentro ciascuna area.",
      },
      sezionePoliticaParita(campi),
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
  };
}

/** Fallback onesto per i percorsi senza bozza dedicata: struttura dal
 *  catalogo (gli output del servizio come sezioni). */
function bozzaGenerica(org: DatiOrg, slug: string, campi: CampiNoti = {}): Bozza {
  const s = getServizio(slug);
  const output = s?.output ?? [];
  return {
    intestazione: `Bozza · ${s?.name ?? "Documento del percorso"}`,
    sezioni: [
      sezioneAnagrafica(org, campi),
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
export function bozzaPercorso(
  slug: string,
  org: DatiOrg,
  campi: CampiNoti = {},
): Bozza {
  switch (slug) {
    case "carbon-footprint-scope-1-2":
      return bozzaCarbon(org, false, campi);
    case "carbon-footprint-scope-1-2-3":
      return bozzaCarbon(org, true, campi);
    case "bilancio-sostenibilita-vsme-base":
      return bozzaVsme(org, false, campi);
    case "bilancio-sostenibilita-vsme-avanzato":
      return bozzaVsme(org, true, campi);
    case "manuale-sistema-gestione-iso-9001":
      return bozzaManualeIso(org, "UNI EN ISO 9001:2015+A1:2024", "ISO 9001", campi);
    case "manuale-sistema-gestione-iso-14001":
      return bozzaManualeIso(org, "UNI EN ISO 14001:2026", "ISO 14001", campi);
    case "manuale-sistema-gestione-iso-45001":
      return bozzaManualeIso(org, "UNI EN ISO 45001:2023+A1:2024", "ISO 45001", campi);
    case "parita-di-genere-pdr-125":
      return bozzaPdr125(org, campi);
    case "percorso-ver0":
      // Il bundle non ha una bozza unica: si presenta sempre scomposto
      // (§12.F). Chi chiede la bozza del bundle riceve il primo componente.
      return bozzaCarbon(org, false, campi);
    default:
      return bozzaGenerica(org, slug, campi);
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
  campi: CampiNoti = {},
): ComponentePercorso[] {
  if (slug === "percorso-ver0") {
    return [
      {
        key: "carbon",
        nome: "Carbon Footprint di Organizzazione",
        taglio: "Scope 1 e 2",
        doc: DOC_CARBON,
        bozza: bozzaCarbon(org, false, campi),
      },
      {
        key: "vsme",
        nome: "Bilancio di Sostenibilità (VSME)",
        taglio: "Base",
        doc: DOC_VSME,
        bozza: bozzaVsme(org, false, campi),
      },
      {
        key: "score",
        nome: "Profilo ESG per questionari e rating di terze parti",
        taglio: "EcoVadis, Synesgy, Open-es, CDP, questionari bancari",
        doc: DOC_SCORE,
        bozza: bozzaScore(org, campi),
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
      bozza: bozzaPercorso(slug, org, campi),
    },
  ];
}

/**
 * Percentuale di completamento della bozza — a PESO, non a conteggio.
 *
 * Una sezione popolata coi dati veri vale uno; una impostata — struttura
 * e riferimento normativo, ma ancora senza contenuto — vale mezzo; una in
 * attesa vale zero. Contare come intera una sezione con la sola ossatura
 * gonfiava il numero e, peggio, lo INCHIODAVA: quando l'arricchimento
 * portava la sede legale e il perimetro passava da impostato a popolato,
 * la percentuale non si muoveva di un punto. Un indicatore che non si
 * muove quando arrivano dati veri è un indicatore che mente.
 *
 * La struttura resta lavoro fatto — per questo pesa mezzo e non zero.
 */
export function completamentoBozza(bozza: Bozza): number {
  // «ricevuta» pesa più di «impostata» e meno di «popolata»: il documento
  // è in nostre mani — che è progresso vero e verificabile — ma il dato
  // non è ancora dentro. Gonfiarla a 1 sarebbe dire che il lavoro è
  // fatto quando manca proprio la parte che il cliente ci paga.
  const peso = (s: SezioneBozza) =>
    s.stato === "popolata"
      ? 1
      : s.stato === "ricevuta"
        ? 0.75
        : s.stato === "impostata"
          ? 0.5
          : 0;
  const somma = bozza.sezioni.reduce((t, s) => t + peso(s), 0);
  return Math.round((somma / bozza.sezioni.length) * 100);
}

/** Il riempimento di ciascun segmento dell'anello, sezione per sezione. */
export function segmentiBozza(
  bozza: Bozza,
): ("piena" | "quasi" | "mezza" | "vuota")[] {
  return bozza.sezioni.map((s) =>
    s.stato === "popolata"
      ? "piena"
      : s.stato === "ricevuta"
        ? "quasi"
        : s.stato === "impostata"
          ? "mezza"
          : "vuota",
  );
}

/**
 * Applica alla bozza i documenti già caricati: una sezione in attesa
 * cambia stato quando TUTTI i tipi che aspettava sono arrivati. È così
 * che il fascicolo e l'anello reagiscono a un caricamento, invece di
 * restare fermi mentre il cliente vede crescere l'archivio.
 */
export function bozzaConDocumenti(bozza: Bozza, tipiCaricati: Set<string>): Bozza {
  if (tipiCaricati.size === 0) return bozza;
  return {
    ...bozza,
    sezioni: bozza.sezioni.map((s) => {
      if (s.stato !== "in-attesa") return s;
      const attesi = s.attendeTipi ?? [];
      if (attesi.length === 0 || !attesi.every((t) => tipiCaricati.has(t))) {
        return s;
      }
      return { ...s, stato: "ricevuta" as const };
    }),
  };
}
