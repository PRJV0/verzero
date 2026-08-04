import {
  Leaf,
  FileText,
  Scale,
  ShieldCheck,
  Building2,
  type LucideIcon,
} from "lucide-react";

/**
 * Catalogo dei servizi pubblici — unica fonte per home, indice /servizi e
 * pagine di dettaglio /servizi/[slug]. Contenuti ripresi dal riferimento
 * visivo (docs/riferimenti/verzero-prototipo.jsx, SERVICE_DETAILS) e dalla
 * SPEC (catalogo §12.Y, effort §14). I prezzi NON vivono qui: la fonte unica
 * è la matrice per dimensione in src/lib/pricing.ts (SPEC §12.X).
 */
export type Servizio = {
  slug: string;
  name: string;
  icon: LucideIcon;
  featured?: boolean;
  /** Riga breve per le card di home e indice. */
  short: string;
  /** Introduzione estesa in cima al dettaglio. */
  desc: string;
  /** "Cosa ottieni". */
  output: string[];
  /** "Perché conviene adesso" (ganci commerciali). */
  ganci: string[];
  /** "Quanto tempo ti chiede". */
  effort: string;
  /** Badge "cosa copre" (es. Scope): mostrati sotto il titolo del dettaglio. */
  copre?: string[];
};

export const SERVIZI: Servizio[] = [
  {
    slug: "percorso-ver0",
    name: "Percorso Ver0",
    icon: Leaf,
    featured: true,
    short:
      "Piattaforma + Carbon Light + bilancio VSME. La via diretta al Sigillo.",
    desc: "Il pacchetto completo che porta la tua impresa dalla prima bolletta al Sigillo: Carbon Light (Scope 1 e 2) e bilancio di sostenibilità insieme, con un unico inserimento dati.",
    copre: ["Include Carbon Light (Scope 1+2)", "Bilancio VSME", "Piattaforma"],
    output: [
      "Report Carbon Light (Scope 1 e 2) conforme a GHG Protocol e ISO 14064-1",
      "Bilancio di sostenibilità in formato VSME (standard EFRAG)",
      "Sigillo Ver0 livello 1 al completamento, con pagina pubblica di verifica e QR",
      "Dashboard sempre aggiornata e documenti scaricabili e condivisibili",
    ],
    ganci: [
      "Le banche chiedono già questi dati per il credito: presentati con documenti standard, non con questionari compilati a mano",
      "I clienti capofiliera devono rendicontare lo Scope 3: un fornitore qualificato Ver0 parte avvantaggiato",
      "Costo di un ordine di grandezza inferiore alla consulenza tradizionale, con il Sigillo incluso nel percorso",
    ],
    effort:
      "Circa 3 ore di lavoro totali, distribuite come preferisci. Un solo inserimento dati alimenta sia il carbon sia il bilancio. Nessun campo ti blocca: se un dato non lo hai, lo stimiamo insieme o lo deleghi al tuo commercialista.",
  },
  {
    slug: "carbon-light",
    name: "Carbon Light",
    icon: Leaf,
    short: "Scope 1 e 2 secondo GHG Protocol e ISO 14064-1.",
    desc: "La misura ufficiale delle emissioni dirette e da energia acquistata della tua organizzazione: Scope 1 e 2 calcolati dai tuoi documenti reali, con metodo riconosciuto a livello internazionale.",
    copre: ["Scope 1 — emissioni dirette", "Scope 2 — energia acquistata"],
    output: [
      "Report di inventario GHG conforme a GHG Protocol e ISO 14064-1",
      "Scope 2 in doppia lettura (location-based e market-based)",
      "Etichetta di qualità su ogni dato (misurato / da documento / stimato) e tracciabilità dei fattori di emissione",
      "Intensità emissiva calcolata dal bilancio depositato",
    ],
    ganci: [
      "È il documento che i clienti grandi ti stanno per chiedere (o ti hanno già chiesto): arriva pronto, non rincorrere",
      "Primo passo verso il Sigillo Ver0 e lo status Impresa Ver0",
      "Passi a Carbon Completa quando vuoi, pagando solo la differenza: i dati inseriti restano",
    ],
    effort:
      "Circa 3 ore di lavoro totali, distribuite come preferisci. Nessun campo ti blocca: se un dato non lo hai, lo stimiamo insieme o lo deleghi al tuo commercialista.",
  },
  {
    slug: "carbon-completa",
    name: "Carbon Completa",
    icon: Leaf,
    short: "Scope 1, 2 e 3: l'impronta intera, filiera compresa.",
    desc: "L'inventario completo delle emissioni della tua organizzazione: oltre a Scope 1 e 2, lo Scope 3 con i dati di filiera — acquisti, trasporti, uso dei prodotti — raccolti e stimati con metodi dichiarati.",
    copre: [
      "Scope 1 — emissioni dirette",
      "Scope 2 — energia acquistata",
      "Scope 3 — filiera e indirette",
    ],
    output: [
      "Report di inventario GHG completo (Scope 1, 2 e 3) conforme a GHG Protocol e ISO 14064-1",
      "Mappatura delle categorie Scope 3 applicabili e raccolta guidata dei dati di filiera",
      "Etichetta di qualità su ogni dato e tracciabilità di fattori e metodi di stima",
      "Base pronta per i questionari dei clienti capofiliera (CDP, EcoVadis e simili)",
    ],
    ganci: [
      "I capofiliera rendicontano lo Scope 3: è dei fornitori che hanno bisogno — arriva con i numeri già pronti",
      "Include tutto Carbon Light; se parti da Light, l'upgrade costa solo la differenza",
      "La base più solida per il Sigillo e per obiettivi di riduzione credibili",
    ],
    effort:
      "Circa 5 ore di lavoro totali: lo Scope 3 chiede qualche dato in più dalla contabilità fornitori. Nessun campo ti blocca: dove il dato non c'è, stimiamo insieme con metodi dichiarati.",
  },
  {
    slug: "bilancio-vsme-base",
    name: "Bilancio VSME Base",
    icon: FileText,
    short: "Il report che banche e clienti capofiliera ti chiedono.",
    desc: "Il bilancio di sostenibilità nel formato europeo VSME: un documento unico e standard che risponde a banche, clienti e bandi senza rifare il lavoro ogni volta.",
    output: [
      "Bilancio conforme allo standard VSME (EFRAG), modulo base",
      "Narrativa professionale generata sui tuoi dati e rivista da te",
      "Indicatori ambientali importati automaticamente dagli altri moduli attivi",
      "Versione PDF scaricabile e versione online condivisibile",
    ],
    ganci: [
      "Un solo documento standard al posto di dieci questionari diversi di banche e clienti",
      "La consulenza tradizionale lo fa pagare migliaia di euro: qui è un canone mensile",
      "Richiesto sempre più spesso nei rating bancari ESG per l'accesso al credito",
    ],
    effort:
      "Circa 4 ore di lavoro totali, distribuite come preferisci. Gli indicatori ambientali arrivano già dagli altri moduli attivi. Nessun campo ti blocca: dove serve, stimiamo insieme o deleghi.",
  },
  {
    slug: "manuale-iso-9001",
    name: "Manuale ISO 9001",
    icon: Scale,
    short: "Sistema qualità: impianto documentale pronto per la certificazione.",
    desc: "L'impianto documentale completo del tuo sistema di gestione per la qualità, generato sui dati reali della tua azienda e pronto per l'audit di certificazione ISO 9001.",
    output: [
      "Manuale, politica, analisi del contesto, rischi e opportunità secondo la struttura HLS (punti 4-10)",
      "Procedure gestionali e modulistica di registrazione complete",
      "Tutto in formato Word modificabile, di tua proprietà",
      "Scadenzario di audit interni e riesami incluso nel mantenimento",
    ],
    ganci: [
      "La certificazione è requisito o premialità in bandi e qualifiche fornitori: senza, certe porte restano chiuse",
      "La consulenza tradizionale chiede migliaia di euro per gli stessi documenti, spesso da template riciclati",
      "I tuoi processi diventano un sistema ordinato, non un raccoglitore di moduli",
    ],
    effort:
      "Il grosso è un questionario guidato su processi e ruoli: il resto lo generiamo dai tuoi dati. Poche ore in tutto, revisione compresa. La certificazione è rilasciata da un organismo accreditato dopo l'audit; noi prepariamo il fascicolo.",
  },
  {
    slug: "manuale-iso-14001",
    name: "Manuale ISO 14001",
    icon: Scale,
    short: "Sistema ambientale: impianto documentale pronto per la certificazione.",
    desc: "L'impianto documentale completo del tuo sistema di gestione ambientale, generato sui dati reali della tua azienda e pronto per l'audit di certificazione ISO 14001.",
    output: [
      "Manuale, politica, analisi ambientale, aspetti e impatti e obblighi di conformità (struttura HLS, punti 4-10)",
      "Procedure gestionali e modulistica di registrazione complete",
      "Tutto in formato Word modificabile, di tua proprietà",
      "Registro degli obblighi di conformità e scadenzario inclusi nel mantenimento",
    ],
    ganci: [
      "La certificazione è requisito o premialità in bandi, appalti verdi e qualifiche fornitori",
      "L'analisi ambientale nasce già precompilata dai tuoi dati carbon: meno lavoro, più coerenza",
      "La consulenza tradizionale chiede migliaia di euro per gli stessi documenti, spesso da template riciclati",
    ],
    effort:
      "Un questionario guidato più il riuso automatico dei tuoi dati carbon: poche ore in tutto, revisione compresa. La certificazione è rilasciata da un organismo accreditato dopo l'audit; noi prepariamo il fascicolo.",
  },
  {
    slug: "parita-di-genere-pdr-125",
    name: "Parità di genere PdR 125",
    icon: ShieldCheck,
    short: "KPI, sistema di gestione e fascicolo per l'audit.",
    desc: "Il percorso verso la certificazione della parità di genere: autovalutazione sui KPI ufficiali, sistema di gestione e fascicolo pronto per l'audit dell'organismo accreditato.",
    output: [
      "Autovalutazione guidata sui KPI delle sei aree della UNI/PdR 125:2022",
      "Politica, piano strategico e procedure del sistema di gestione della parità",
      "Fascicolo documentale pronto per l'audit di certificazione",
      "KPI di governance precompilati dai dati camerali",
    ],
    ganci: [
      "Esonero contributivo per le aziende certificate: il servizio si ripaga da solo",
      "Premialità nei bandi pubblici e punteggi negli appalti",
      "Un segnale forte per attrarre e trattenere talenti",
    ],
    effort:
      "Circa 2 ore lato azienda, più gli aggregati del consulente del lavoro. I KPI di governance arrivano dai dati camerali. I dati su retribuzioni e genere si trattano solo in forma aggregata. La certificazione è rilasciata da un organismo accreditato.",
  },
  {
    slug: "rating-economia-circolare",
    name: "Rating economia circolare",
    icon: Building2,
    short: "Punteggio di circolarità con report dedicato.",
    desc: "La misura di quanto la tua impresa è circolare: materiali, rifiuti, riuso ed energia in un punteggio chiaro, con le azioni per migliorarlo.",
    output: [
      "Punteggio di circolarità con dettaglio per area",
      "Report dedicato con posizionamento rispetto al tuo settore",
      "Piano di miglioramento con azioni ordinate per impatto",
    ],
    ganci: [
      "Le filiere chiedono sempre più spesso evidenze di circolarità ai fornitori",
      "Si integra con carbon e VSME: dati già inseriti, punteggio quasi gratis in termini di effort",
      "Un argomento distintivo in più nelle gare e nelle presentazioni commerciali",
    ],
    effort:
      "Circa 1-2 ore: un questionario di circolarità che riusa i dati già inseriti negli altri moduli. Nessun campo ti blocca: dove serve, stimiamo insieme o deleghi.",
  },
];

export function getServizio(slug: string): Servizio | undefined {
  return SERVIZI.find((s) => s.slug === slug);
}

/* ------------------------------------------------------------------ */
/* Vetrina a catalogo per categorie (SPEC §12.Y)                       */
/* ------------------------------------------------------------------ */

/**
 * Una voce della vetrina: attiva (con `slug` verso la pagina servizio) oppure
 * di roadmap ("In arrivo": amplia l'offerta percepita, non acquistabile).
 * Vincolo §12.Y: nessuna voce può suggerire che Verzero certifichi — Verzero
 * prepara e accompagna, certificano gli enti terzi accreditati.
 */
export type VoceVetrina = {
  name: string;
  /** Una riga di beneficio. */
  benefit: string;
  /** Presente solo per i servizi attivi: punta a /servizi/[slug]. */
  slug?: string;
  roadmap?: boolean;
};

export type CategoriaVetrina = {
  key: string;
  title: string;
  /** Sottotitolo breve della categoria. */
  sub: string;
  voci: VoceVetrina[];
};

/** Sostenibilità nei tre pilastri E/S/G + famiglia Sistemi di gestione. */
export const VETRINA: CategoriaVetrina[] = [
  {
    key: "ambiente",
    title: "Ambiente",
    sub: "Sostenibilità · pilastro E",
    voci: [
      {
        slug: "carbon-light",
        name: "Carbon Light",
        benefit: "Scope 1 e 2: la misura ufficiale, dai documenti reali.",
      },
      {
        slug: "carbon-completa",
        name: "Carbon Completa",
        benefit: "Scope 1, 2 e 3: l'impronta intera, filiera compresa.",
      },
      {
        slug: "rating-economia-circolare",
        name: "Rating economia circolare",
        benefit: "Quanto sei circolare, in un punteggio chiaro e migliorabile.",
      },
      {
        slug: "manuale-iso-14001",
        name: "Manuale ISO 14001",
        benefit: "Il sistema ambientale pronto per l'audit dell'ente terzo.",
      },
      {
        name: "Check-up energetico",
        benefit: "Scopri se paghi troppo l'energia, dalle bollette che hai già.",
        roadmap: true,
      },
      {
        name: "Monitoraggio energetico",
        benefit: "Consumi sotto controllo mese per mese, con alert e benchmark.",
        roadmap: true,
      },
    ],
  },
  {
    key: "sociale",
    title: "Sociale",
    sub: "Sostenibilità · pilastro S",
    voci: [
      {
        slug: "parita-di-genere-pdr-125",
        name: "Parità di genere UNI/PdR 125",
        benefit: "KPI e fascicolo pronti per l'audit; esonero contributivo.",
      },
      {
        name: "Ospitalità sostenibile UNI ISO 21401",
        benefit: "Il sistema di gestione per le strutture ricettive.",
        roadmap: true,
      },
      {
        name: "Eventi sostenibili ISO 20121",
        benefit: "Il sistema di gestione per eventi, fiere e hospitality.",
        roadmap: true,
      },
    ],
  },
  {
    key: "governance",
    title: "Governance",
    sub: "Sostenibilità · pilastro G",
    voci: [
      {
        slug: "bilancio-vsme-base",
        name: "Bilancio VSME",
        benefit: "Un solo report standard al posto di dieci questionari.",
      },
      {
        slug: "manuale-iso-9001",
        name: "Manuale ISO 9001",
        benefit: "Il sistema qualità pronto per l'audit dell'ente terzo.",
      },
      {
        name: "Preparazione a rating e questionari ESG",
        benefit: "Risposte pronte e coerenti per banche e capofiliera.",
        roadmap: true,
      },
    ],
  },
  {
    key: "sistemi-di-gestione",
    title: "Sistemi di gestione",
    sub: "Manuali e procedure generati sui tuoi dati",
    voci: [
      {
        slug: "manuale-iso-9001",
        name: "Manuale ISO 9001 — qualità",
        benefit: "Impianto documentale completo, pronto per l'audit.",
      },
      {
        slug: "manuale-iso-14001",
        name: "Manuale ISO 14001 — ambiente",
        benefit: "Analisi ambientale precompilata dai tuoi dati carbon.",
      },
      {
        slug: "parita-di-genere-pdr-125",
        name: "UNI/PdR 125 — parità di genere",
        benefit: "Sistema di gestione della parità e fascicolo per l'audit.",
      },
      {
        name: "ISO 26000 e ISO 20400 — aderenza",
        benefit: "Allineamento alle norme guida, spendibile verso le filiere.",
        roadmap: true,
      },
    ],
  },
];
