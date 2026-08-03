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
 * SPEC (listino §12, effort §14). I prezzi qui sono di presentazione: nel
 * prodotto vero vivranno in tabella `price_plans` gestibile senza deploy.
 */
export type Servizio = {
  slug: string;
  name: string;
  price: string;
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
};

export const SERVIZI: Servizio[] = [
  {
    slug: "percorso-ver0",
    name: "Percorso Ver0",
    price: "199 €/mese",
    icon: Leaf,
    featured: true,
    short:
      "Piattaforma + carbon footprint + bilancio VSME. La via diretta al Sigillo.",
    desc: "Il pacchetto completo che porta la tua impresa dalla prima bolletta al Sigillo: carbon footprint e bilancio di sostenibilità insieme, con un unico inserimento dati.",
    output: [
      "Report carbon footprint conforme a GHG Protocol e ISO 14064-1",
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
    slug: "carbon-footprint-base",
    name: "Carbon footprint Base",
    price: "89 €/mese",
    icon: Leaf,
    short: "Scope 1 e 2 secondo GHG Protocol e ISO 14064-1.",
    desc: "La misura ufficiale delle emissioni della tua organizzazione: Scope 1 e 2 calcolati dai tuoi documenti reali, con metodo riconosciuto a livello internazionale.",
    output: [
      "Report di inventario GHG conforme a GHG Protocol e ISO 14064-1",
      "Scope 2 in doppia lettura (location-based e market-based)",
      "Etichetta di qualità su ogni dato (misurato / da documento / stimato) e tracciabilità dei fattori di emissione",
      "Intensità emissiva calcolata dal bilancio depositato",
    ],
    ganci: [
      "È il documento che i clienti grandi ti stanno per chiedere (o ti hanno già chiesto): arriva pronto, non rincorrere",
      "Primo passo verso il Sigillo Ver0 e lo status Impresa Ver0",
      "Ogni anno si rinnova in poche ore: lo storico resta in piattaforma",
    ],
    effort:
      "Circa 3 ore di lavoro totali, distribuite come preferisci. Nessun campo ti blocca: se un dato non lo hai, lo stimiamo insieme o lo deleghi al tuo commercialista.",
  },
  {
    slug: "bilancio-vsme-base",
    name: "Bilancio VSME Base",
    price: "129 €/mese",
    icon: FileText,
    short: "Il report che banche e clienti capofiliera ti chiedono.",
    desc: "Il bilancio di sostenibilità nel formato europeo pensato per le PMI: un documento unico e standard che risponde a banche, clienti e bandi senza rifare il lavoro ogni volta.",
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
    price: "990 € + 49 €/mese",
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
    price: "990 € + 49 €/mese",
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
    price: "129 €/mese",
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
    price: "129 €/mese",
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
