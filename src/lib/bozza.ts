import { getServizio } from "@/lib/catalog";
import {
  MODELLO_PER_PERCORSO,
  modelloElaborato,
  type ModelloElaborato,
} from "@/lib/elaborati";
import {
  annoElaborazione,
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
  /** Leggibile coi dati veri CONFERMATI dal cliente. Peso pieno. */
  | "popolata"
  /**
   * I dati ci sono e sono leggibili, ma il cliente non li ha ancora
   * confermati. Non è «popolata», e la differenza non è formale: finché
   * un dato è da confermare non entra nei calcoli e non ha titolo per
   * far dire all'anello che il lavoro è finito (docs/motore.md §4.4).
   */
  | "letta"
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
export type CampiNoti = Record<
  string,
  {
    valore: string;
    fonte: string | null;
    /**
     * Il campo è stato recuperato dal Motore e il cliente non l'ha ancora
     * confermato. Entra lo stesso nel foglio — è il modo in cui il
     * cliente lo vede e lo controlla — ma la sezione che lo usa resta
     * «letta» e non «popolata»: l'anello sale a peso pieno solo dopo la
     * conferma (docs/motore.md §4.4).
     */
    daConfermare?: boolean;
  }
>;

/** La sezione è piena, ma di dati che nessuno ha ancora confermato? */
function statoDati(
  contributi: ({ daConfermare?: boolean } | undefined)[],
): "popolata" | "letta" {
  return contributi.some((c) => c?.daConfermare) ? "letta" : "popolata";
}


/* ------------------------------------------------------------------ */
/* Etichette dei documenti (per i chip «→ contribuisce a…», §12.F)     */
/* ------------------------------------------------------------------ */

/**
 * Le etichette vivono coi modelli (`src/lib/elaborati.ts`), che sono la
 * fonte della struttura dei documenti. Qui si ri-esportano perché mezzo
 * portale le importa da `bozza`: due definizioni sarebbero due verità.
 *
 * DOC_KIT è uno strumento INCLUSO nel canone, non un documento
 * acquistato (§12.C): resta come etichetta per la fascia «incluso nel
 * tuo abbonamento», ma non compare fra i deliverable né nel conteggio
 * «Documento X di Y».
 */
export {
  DOC_CARBON,
  DOC_VSME,
  DOC_SCORE,
  DOC_KIT,
  DOC_PARITA,
} from "@/lib/elaborati";
import {
  DOC_CARBON,
  DOC_VSME,
  DOC_SCORE,
  DOC_PARITA,
} from "@/lib/elaborati";

/**
 * Che documenti produce un percorso.
 *
 * Per i percorsi che hanno un MODELLO la risposta viene dal modello: è
 * la stessa fonte che genera la bozza, quindi le due cose non possono
 * divergere. Restano scritti a mano solo i percorsi che un modello non ce
 * l'hanno ancora — e sono elencati qui proprio perché si veda quali sono.
 */
const ETICHETTA_SENZA_MODELLO: Record<string, string> = {
  "iso-45003": "Fascicolo ISO 45003",
  "iso-30415": "Fascicolo ISO 30415",
  sa8000: "Fascicolo SA8000",
  "rating-economia-circolare": "Rating di circolarità",
};

function documentiDelPercorso(slug: string): string[] {
  const voci = MODELLO_PER_PERCORSO[slug];
  if (voci && voci.length > 0) {
    return voci
      .map((v) => modelloElaborato(v.modello)?.documento)
      .filter((d): d is string => Boolean(d));
  }
  const uno = ETICHETTA_SENZA_MODELLO[slug];
  return uno ? [uno] : [];
}

/**
 * I moduli del catalogo che producono un certo documento. È l'inverso di
 * `ETICHETTA_MODULO`, e serve alla mappa documentale: sapere quali
 * PERCORSI alimenta un tipo di documento significa risalire dal documento
 * prodotto ai moduli che lo producono.
 */
export function moduliCheProducono(doc: string): string[] {
  const slug = [
    ...Object.keys(MODELLO_PER_PERCORSO),
    ...Object.keys(ETICHETTA_SENZA_MODELLO),
  ];
  return [...new Set(slug)].filter((s) => documentiDelPercorso(s).includes(doc));
}

/** Le etichette dei documenti in lavorazione, dati i moduli attivi:
 *  servono a filtrare i chip di destinazione su ciò che esiste davvero. */
export function documentiAttivi(moduli: string[]): Set<string> {
  const out = new Set<string>();
  for (const m of moduli) for (const d of documentiDelPercorso(m)) out.add(d);
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
    stato: statoDati([campi.forma_giuridica, campi.ateco]),
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
): {
  righe: { etichetta: string; valore: string }[];
  fonte: string | null;
  daConfermare: boolean;
} {
  const righe = chiavi
    .filter((c) => campi[c.chiave])
    .map((c) => ({
      etichetta: c.etichetta,
      valore: estratto(campi[c.chiave].valore),
    }));
  const fonti = chiavi
    .map((c) => campi[c.chiave]?.fonte)
    .filter((f): f is string => !!f);
  return {
    righe,
    fonte: fonti.length > 0 ? [...new Set(fonti)][0] : null,
    daConfermare: chiavi.some((c) => campi[c.chiave]?.daConfermare),
  };
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
    stato: statoDati([sede]),
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
  const { righe, fonte, daConfermare } = righeDalSito(campi, [
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
    stato: daConfermare ? "letta" : "popolata",
    fonte: fonte ?? "Sito ufficiale",
    spiega:
      "Chi sei e cosa fai, riportato dalle tue stesse pagine: nessuna parola messa in bocca all'impresa.",
    righe,
  };
}

/** Manuali ISO: il contesto dell'organizzazione (punto 4 della norma). */
function sezioneContesto(campi: CampiNoti): SezioneBozza {
  const { righe, fonte, daConfermare } = righeDalSito(campi, [
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
    stato: daConfermare ? "letta" : "popolata",
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
    stato: statoDati([policy]),
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

/* ================================================================== */
/* LA COMPOSIZIONE — un solo costruttore, guidato dal MODELLO           */
/* ================================================================== */

/**
 * I BINDING: le sezioni che si compilano coi dati, non col testo.
 *
 * Il modello (`src/lib/elaborati.ts`) dichiara `binding: "anagrafica"`;
 * qui c'è che cosa significa. La separazione è il punto: il modello è
 * dato e non sa leggere una scheda impresa, il binding è codice e non sa
 * in quale elaborato finirà. Un ambito nuovo che usa solo sezioni
 * letterali non aggiunge nemmeno una riga qui.
 */
const BINDING: Record<
  string,
  (org: DatiOrg, campi: CampiNoti, anno: number) => SezioneBozza
> = {
  anagrafica: (org, campi) => sezioneAnagrafica(org, campi),
  perimetro: (_org, campi, anno) => sezionePerimetro(campi, anno),
  profilo: (_org, campi) => sezioneProfiloImpresa(campi),
  contesto: (_org, campi) => sezioneContesto(campi),
  politicaParita: (_org, campi) => sezionePoliticaParita(campi),
};

/** Scioglie i segnaposto del modello: un modello non conosce l'anno. */
function testo(valore: string, anno: number): string {
  return valore
    .replace(/\{anno\}/g, String(anno))
    .replace(/\{dodiciMesi\}/g, dodiciMesiDi(anno));
}

/**
 * Compone la bozza da un MODELLO. È l'unico costruttore che esista, e
 * non sa che cosa siano un Carbon Footprint o un Modello 231: legge
 * sezioni, opzioni e segnaposto.
 */
export function bozzaDaModello(
  modello: ModelloElaborato,
  org: DatiOrg,
  campi: CampiNoti = {},
  opzioni: string[] = [],
): Bozza {
  const anno = annoDi(org);
  const attive = new Set(opzioni);
  const vale = (soloSe?: string) => !soloSe || attive.has(soloSe);

  const sezioni = modello.sezioni.filter((s) => vale(s.soloSe)).map((s): SezioneBozza => {
    if (s.binding) {
      const costruisci = BINDING[s.binding];
      // Un binding dichiarato e inesistente è un difetto nostro, non del
      // cliente: la sezione resta visibile e in attesa invece di sparire
      // dal documento senza che nessuno se ne accorga.
      if (costruisci) return costruisci(org, campi, anno);
      return { titolo: s.titolo, stato: "in-attesa", spiega: s.spiega };
    }
    return {
      titolo: s.titolo,
      stato: s.stato ?? "in-attesa",
      ...(s.spiega ? { spiega: s.spiega } : {}),
      ...(s.fonte ? { fonte: s.fonte } : {}),
      ...(s.attende ? { attende: testo(s.attende, anno) } : {}),
      ...(s.attendeTipi ? { attendeTipi: s.attendeTipi } : {}),
    };
  });

  return {
    intestazione: modello.conAnno
      ? `Bozza · ${intestazioneDocumento(modello.intestazione, anno)}`
      : `Bozza · ${modello.intestazione} · elaborato nel ${annoElaborazione()}`,
    sezioni,
    daFornire: modello.daFornire
      .filter((v) => vale(v.soloSe))
      .map((v) => ({
        documento: testo(v.documento, anno),
        ...(v.tipo ? { tipo: v.tipo } : {}),
        perche: v.perche,
        ...(v.destinazioni ? { destinazioni: v.destinazioni } : {}),
      })),
    ...(modello.zeroDocumenti ? { zeroDocumenti: modello.zeroDocumenti } : {}),
  };
}

/**
 * Il ripiego onesto per un percorso senza modello: la struttura viene dal
 * catalogo (gli output del servizio come sezioni). Non è un errore — è
 * un percorso che vendiamo e che non ha ancora il suo modello — e si
 * vede, perché le sezioni restano in attesa invece di fingersi impostate.
 */
function bozzaDaCatalogo(org: DatiOrg, slug: string, campi: CampiNoti): Bozza {
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

/** La bozza del singolo documento di un percorso. */
export function bozzaPercorso(
  slug: string,
  org: DatiOrg,
  campi: CampiNoti = {},
): Bozza {
  const voci = MODELLO_PER_PERCORSO[slug];
  const prima = voci?.[0];
  const modello = prima ? modelloElaborato(prima.modello) : undefined;
  return modello
    ? bozzaDaModello(modello, org, campi, prima?.opzioni)
    : bozzaDaCatalogo(org, slug, campi);
}

/* ------------------------------------------------------------------ */
/* I documenti di un percorso (bundle scomposto, §12.F)                */
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
 * I documenti di un percorso attivo. Per i moduli singoli è uno solo; per
 * il Percorso Ver0 sono i componenti del bundle, ciascuno con la propria
 * bozza (e quindi il proprio anello e fascicolo).
 *
 * L'elenco viene dal DATO (`MODELLO_PER_PERCORSO`): aggiungere un
 * percorso, o cambiare i documenti che comprende, è una riga di
 * configurazione.
 */
export function componentiPercorso(
  slug: string,
  org: DatiOrg,
  campi: CampiNoti = {},
): ComponentePercorso[] {
  const voci = MODELLO_PER_PERCORSO[slug];
  const s = getServizio(slug);

  if (!voci || voci.length === 0) {
    return [
      {
        key: slug,
        nome: s?.name ?? slug,
        taglio: s?.taglio,
        doc: ETICHETTA_SENZA_MODELLO[slug],
        bozza: bozzaDaCatalogo(org, slug, campi),
      },
    ];
  }

  return voci.flatMap((v) => {
    const modello = modelloElaborato(v.modello);
    if (!modello) return [];
    const bundle = voci.length > 1;
    return [
      {
        key: modello.chiave,
        // Nel bundle ogni componente porta il proprio nome per esteso;
        // da solo, il nome del percorso — che è quello che il cliente ha
        // comprato e che si aspetta di rileggere.
        nome: bundle ? modello.intestazione : (s?.name ?? modello.intestazione),
        taglio: bundle ? undefined : s?.taglio,
        doc: modello.documento,
        bozza: bozzaDaModello(modello, org, campi, v.opzioni),
      },
    ];
  });
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
  // «letta» pesa 0,9 e non 1: i dati ci sono, si vedono, si possono
  // controllare — ma nessuno li ha ancora confermati, e finché è così non
  // entrano nei calcoli. L'ultimo decimo è il gesto del cliente, ed è
  // esattamente il gesto su cui si regge il prodotto: l'AI assiste, il
  // cliente valida. Dare peso pieno a un dato non confermato significa
  // dire che il lavoro è finito mentre manca proprio la parte che rende
  // il documento difendibile.
  const peso = (s: SezioneBozza) =>
    s.stato === "popolata"
      ? 1
      : s.stato === "letta"
        ? 0.9
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
): ("piena" | "letta" | "quasi" | "mezza" | "vuota")[] {
  return bozza.sezioni.map((s) =>
    s.stato === "popolata"
      ? "piena"
      : s.stato === "letta"
        ? "letta"
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
export function bozzaConDocumenti(
  bozza: Bozza,
  tipiCaricati: Set<string>,
  letti: DatiLetti = {},
): Bozza {
  const qualcosaDaLeggere = Object.keys(letti).length > 0;
  if (tipiCaricati.size === 0 && !qualcosaDaLeggere) return bozza;

  return {
    ...bozza,
    sezioni: bozza.sezioni.map((s) => {
      const attesi = s.attendeTipi ?? [];
      if (attesi.length === 0) return s;

      // I dati LETTI da quei documenti: se ci sono, la sezione non è più
      // «ricevuta» — ha dentro dei valori, e il cliente li deve vedere
      // proprio lì, nella sezione che li aspettava, non in un pannello a
      // parte. È il senso della bozza: il documento che si sta formando.
      const righe = attesi.flatMap((t) => letti[t]?.righe ?? []);
      if (righe.length > 0) {
        const daConfermare = attesi.some((t) => (letti[t]?.daConfermare ?? 0) > 0);
        const fonti = [...new Set(attesi.flatMap((t) => letti[t]?.fonti ?? []))];
        return {
          ...s,
          stato: daConfermare ? ("letta" as const) : ("popolata" as const),
          righe: [...(s.righe ?? []), ...righe],
          fonte: [s.fonte, ...fonti].filter(Boolean).join(" · ") || undefined,
        };
      }

      if (s.stato !== "in-attesa") return s;
      if (!attesi.every((t) => tipiCaricati.has(t))) return s;
      return { ...s, stato: "ricevuta" as const };
    }),
  };
}

/**
 * Quello che il Motore ha letto, raccolto per tipo di documento. Le righe
 * sono già pronte da mostrare; `daConfermare` è il numero di valori che
 * aspettano il gesto del cliente, e finché è maggiore di zero la sezione
 * resta «letta» — mai «popolata».
 */
export type DatiLetti = Record<
  string,
  {
    righe: { etichetta: string; valore: string }[];
    fonti: string[];
    daConfermare: number;
    confermati: number;
  }
>;
