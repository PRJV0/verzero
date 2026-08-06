import {
  Leaf,
  FileText,
  LifeBuoy,
  Scale,
  ShieldCheck,
  Building2,
  type LucideIcon,
} from "lucide-react";

/**
 * Catalogo dei servizi pubblici — unica fonte per home, indice /servizi e
 * pagine di dettaglio /servizi/[slug].
 *
 * Testi in chiave professionale (SPEC §12.Q): tono istituzionale e concreto,
 * norme citate con precisione, nessuna enfasi gonfiata. Struttura fissa per
 * ogni servizio: cos'è / come funziona con Ver0 / cosa ottieni / requisiti e
 * vincoli / Opportunità. Revisione finale col fondatore prima dei piloti.
 *
 * I prezzi NON vivono qui: fonte unica in src/lib/pricing.ts (§12.X, §12.Q).
 */
export type Servizio = {
  slug: string;
  name: string;
  icon: LucideIcon;
  featured?: boolean;
  /** Riga breve per le card di home e indice. */
  short: string;
  /** Cos'è: apertura della pagina di dettaglio. */
  cosE: string;
  /** Come funziona con Ver0: i passi, in ordine. */
  comeFunziona: string[];
  /** Cosa ottieni. */
  output: string[];
  /** Requisiti e vincoli: cosa serve e cosa il servizio non è. */
  requisiti: string[];
  /** Opportunità: perché conviene adesso (resta in ogni pagina). */
  opportunita: string[];
  /** Badge "cosa copre": mostrati sotto il titolo del dettaglio. */
  copre?: string[];
  /**
   * "Cosa ti chiederemo" (§12.P): la lista PRECISA di documenti richiesti dal
   * percorso. Il Motore Ver0 non accetta documenti qualsiasi: chiede esattamente
   * questi, li legge e segnala cosa manca.
   */
  documenti: string[];
  /** Norme e standard di riferimento, citati con precisione (§12.P). */
  riferimenti: string[];
};

/** Principio "solo standard ufficiali" (§12.P): formula unica per tutto il sito. */
export const SOLO_STANDARD_UFFICIALI =
  "Lavoriamo solo su standard e norme nazionali e internazionali riconosciute — mai protocolli proprietari senza validità tecnico-scientifica.";

export const SERVIZI: Servizio[] = [
  {
    slug: "percorso-ver0",
    name: "Percorso Ver0",
    icon: Leaf,
    featured: true,
    short:
      "Carbon Light + bilancio VSME + miglioramento score rating. La via diretta al Sigillo.",
    cosE: "Il percorso integrato che unisce inventario delle emissioni (Scope 1 e 2), bilancio di sostenibilità in formato VSME e preparazione ai rating richiesti da banche e capofiliera. Un solo inserimento dati alimenta tutti e tre gli output, con un'unica scadenza annuale.",
    copre: [
      "Include Carbon Light (Scope 1+2)",
      "Bilancio VSME",
      "Miglioramento score rating",
    ],
    comeFunziona: [
      "Il Motore Ver0 ti indica la lista esatta dei documenti da caricare (bollette, visura, bilancio), li legge e li incrocia con le banche dati ufficiali.",
      "Verifichi e confermi i dati proposti; dove un dato manca, il sistema propone una stima dichiarata che approvi tu.",
      "La piattaforma genera report GHG e bilancio VSME; il team tecnico li valida prima dell'emissione.",
      "Con le categorie obbligatorie confermate accedi ai requisiti del Sigillo Ver0 livello 1.",
    ],
    output: [
      "Report di inventario GHG (Scope 1 e 2) redatto secondo GHG Protocol Corporate Standard e UNI EN ISO 14064-1:2019",
      "Bilancio di sostenibilità conforme allo standard volontario VSME pubblicato da EFRAG",
      "Base dati organizzata per questionari e rating ESG (banche, capofiliera)",
      "Accesso ai requisiti del Sigillo Ver0 livello 1, con pagina pubblica di verifica",
    ],
    requisiti: [
      "Documenti di consumo dell'anno di rendicontazione (bollette, carburanti); ciò che manca si stima con metodi dichiarati ed etichettati",
      "Le stime richiedono sempre la tua conferma: nessun dato entra nei report senza validazione",
      "Il Sigillo attesta percorsi verificati in piattaforma; non è una certificazione di terza parte",
    ],
    documenti: [
      "Visura camerale aggiornata (o solo P.IVA: la recuperiamo noi)",
      "Bollette di energia elettrica e gas dell'anno di rendicontazione",
      "Registri o fatture dei carburanti per mezzi e impianti",
      "Ultimo bilancio depositato (per intensità emissiva e indicatori economici)",
      "Dati di organico e governance aggregati (per le sezioni sociali del VSME)",
    ],
    riferimenti: [
      "GHG Protocol Corporate Standard",
      "UNI EN ISO 14064-1:2019",
      "Standard VSME (EFRAG)",
    ],
    opportunita: [
      "Banche e capofiliera chiedono già questi dati per credito e qualifica fornitori: presentarsi con documenti standard riduce i tempi di risposta",
      "Chi rendiconta lo Scope 3 di filiera privilegia fornitori con dati pronti e verificabili",
      "Tre output con un solo inserimento dati: l'effort complessivo è una frazione dei tre percorsi separati",
    ],
  },
  {
    slug: "carbon-light",
    name: "Carbon Light",
    icon: Leaf,
    short: "Scope 1 e 2 secondo GHG Protocol e UNI EN ISO 14064-1.",
    cosE: "L'inventario delle emissioni dirette (Scope 1) e da energia acquistata (Scope 2) della tua organizzazione, calcolato dai documenti reali di consumo con fattori di emissione pubblici e tracciabili.",
    copre: ["Scope 1 — emissioni dirette", "Scope 2 — energia acquistata"],
    comeFunziona: [
      "Il Motore Ver0 ti chiede i documenti previsti dal percorso — bollette e fatture carburante — e ne estrae consumi, periodi e tipo di fornitura, segnalando cosa manca.",
      "Verifichi i dati estratti nel pannello di conferma; l'impatto in tCO₂e si aggiorna in tempo reale.",
      "Il calcolo applica fattori di emissione da fonti pubbliche (ISPRA, DEFRA), sempre citati riga per riga.",
      "Il team tecnico valida il report prima dell'emissione; il documento resta aggiornato nel tuo archivio.",
    ],
    output: [
      "Report di inventario GHG redatto secondo GHG Protocol Corporate Standard e UNI EN ISO 14064-1:2019",
      "Scope 2 in doppia lettura: location-based e market-based",
      "Etichetta di qualità su ogni dato (misurato / da documento / stimato) e tracciabilità completa dei fattori di emissione",
      "Intensità emissiva rapportata ai dati economici del bilancio depositato",
    ],
    requisiti: [
      "Documenti di consumo dell'anno di rendicontazione; per i dati mancanti si applicano stime da benchmark, dichiarate come tali",
      "Il report è un inventario di parte prima: l'eventuale verifica di terza parte (ISO 14064-3) è un percorso successivo tramite organismi accreditati",
    ],
    documenti: [
      "Bollette di energia elettrica di tutti i punti di prelievo (POD)",
      "Bollette del gas naturale o forniture di altri combustibili (Smc)",
      "Registri o fatture dei carburanti per la flotta e i mezzi d'opera",
      "Eventuali contratti di fornitura con Garanzia d'Origine",
      "Visura camerale (o P.IVA: la recuperiamo noi)",
    ],
    riferimenti: [
      "GHG Protocol Corporate Standard",
      "UNI EN ISO 14064-1:2019",
      "Fattori di emissione ISPRA e DEFRA",
    ],
    opportunita: [
      "È il documento che i clienti strutturati chiedono per primo nella qualifica fornitori",
      "Primo percorso qualificante verso il Sigillo Ver0",
      "L'upgrade a Carbon Completa è sempre possibile pagando la differenza: i dati inseriti restano",
    ],
  },
  {
    slug: "carbon-completa",
    name: "Carbon Completa",
    icon: Leaf,
    short: "Scope 1, 2 e 3: l'inventario completo, filiera compresa.",
    cosE: "L'inventario completo delle emissioni: oltre a Scope 1 e 2, le emissioni indirette di filiera (Scope 3) — beni e servizi acquistati, trasporti, uso dei prodotti — raccolte e stimate con metodi dichiarati categoria per categoria.",
    copre: [
      "Scope 1 — emissioni dirette",
      "Scope 2 — energia acquistata",
      "Scope 3 — filiera e indirette",
    ],
    comeFunziona: [
      "Parti dalla stessa lista di Carbon Light; il Motore Ver0 legge i documenti, incrocia le banche dati ufficiali e segnala gli scostamenti.",
      "La piattaforma mappa le categorie Scope 3 applicabili alla tua attività e guida la raccolta dei dati di filiera (acquisti, trasporti, rifiuti).",
      "Dove il dato primario non è disponibile si applicano stime spend-based o da benchmark, sempre etichettate e approvate da te.",
      "Il team tecnico valida metodologia e risultati prima dell'emissione.",
    ],
    output: [
      "Report di inventario GHG completo (Scope 1, 2 e 3) secondo GHG Protocol Corporate Standard e UNI EN ISO 14064-1:2019",
      "Mappatura documentata delle categorie Scope 3 applicabili, con metodo di calcolo dichiarato per ciascuna",
      "Etichetta di qualità su ogni dato e tracciabilità di fattori e metodi di stima",
      "Base dati pronta per i questionari dei clienti capofiliera (CDP, EcoVadis e analoghi)",
    ],
    requisiti: [
      "Oltre ai consumi diretti servono dati dalla contabilità fornitori (categorie di spesa); l'effort aggiuntivo dipende dalla qualità del dato disponibile",
      "Lo Scope 3 combina dati primari e stime: la ripartizione per qualità è sempre esposta nel report",
      "Inventario di parte prima; la verifica di terza parte resta un percorso separato tramite organismi accreditati",
    ],
    documenti: [
      "Tutti i documenti di Carbon Light (bollette, carburanti, visura)",
      "Estrazione dei fornitori per categoria di spesa dalla contabilità",
      "Documenti di trasporto e logistica in ingresso e uscita",
      "Registri dei rifiuti (MUD o formulari) dell'anno di riferimento",
      "Dati su trasferte e spostamenti casa-lavoro, se disponibili",
    ],
    riferimenti: [
      "GHG Protocol Corporate Standard",
      "GHG Protocol Corporate Value Chain (Scope 3) Standard",
      "UNI EN ISO 14064-1:2019",
    ],
    opportunita: [
      "I capofiliera devono rendicontare lo Scope 3: i fornitori con dati pronti entrano prima nei loro perimetri",
      "Include tutto Carbon Light; partendo da Light si paga solo la differenza",
      "La base più solida per obiettivi di riduzione credibili e per il Sigillo",
    ],
  },
  {
    slug: "bilancio-vsme-base",
    name: "Bilancio VSME Base",
    icon: FileText,
    short: "Il bilancio di sostenibilità nel formato europeo VSME.",
    cosE: "Il bilancio di sostenibilità redatto secondo lo standard volontario VSME pubblicato da EFRAG per le imprese non quotate: un documento unico e standardizzato che risponde alle richieste di banche, clienti e bandi senza rifare il lavoro per ogni questionario.",
    comeFunziona: [
      "La piattaforma precompila anagrafica e dati economici dalle banche dati ufficiali; gli indicatori ambientali arrivano dai moduli carbon se attivi.",
      "Completi le sezioni restanti con un questionario guidato; ogni campo ha un'alternativa (documento, stima dichiarata, delega).",
      "Il Motore Ver0 genera la narrativa sui tuoi dati; la rivedi e la approvi sezione per sezione.",
      "Il team tecnico valida il bilancio prima dell'emissione.",
    ],
    output: [
      "Bilancio conforme allo standard VSME (modulo base), in PDF e in versione online condivisibile",
      "Indicatori ambientali, sociali e di governance compilati secondo le definizioni dello standard",
      "Narrativa professionale generata sui tuoi dati e approvata da te",
      "Importazione automatica degli indicatori dagli altri moduli attivi",
    ],
    requisiti: [
      "Dati di organico e governance dell'anno di rendicontazione; i dati economici arrivano dal bilancio depositato",
      "Lo standard VSME è volontario: non sostituisce obblighi di rendicontazione eventualmente applicabili alla tua impresa",
    ],
    documenti: [
      "Visura camerale e ultimo bilancio depositato",
      "Dati di organico aggregati: numero addetti, contratti, formazione",
      "Composizione degli organi sociali (per gli indicatori di governance)",
      "Dati ambientali dai moduli carbon attivi, o bollette se non attivi",
      "Politiche e procedure già adottate, se esistenti",
    ],
    riferimenti: [
      "Standard VSME (EFRAG), modulo base",
      "GHG Protocol e UNI EN ISO 14064-1 per gli indicatori ambientali",
    ],
    opportunita: [
      "Un documento standard al posto di questionari diversi per ogni banca o cliente",
      "Sempre più istituti lo integrano nei rating ESG per l'accesso al credito",
      "Percorso qualificante per il Sigillo Ver0",
    ],
  },
  {
    slug: "manuale-iso-9001",
    name: "Manuale ISO 9001",
    icon: Scale,
    short: "Il sistema qualità documentato, pronto per l'audit dell'ente terzo.",
    cosE: "L'impianto documentale completo di un sistema di gestione per la qualità conforme a UNI EN ISO 9001:2015, generato sui dati e sui processi reali della tua azienda: manuale, politica, procedure e modulistica secondo la struttura di alto livello della norma (punti 4–10).",
    comeFunziona: [
      "La piattaforma precompila contesto e anagrafica dai dati camerali; un questionario guidato raccoglie processi, ruoli e responsabilità.",
      "Il Motore Ver0 genera i documenti sezione per sezione, applicando i requisiti della norma alla tua realtà operativa.",
      "Rivedi e approvi ogni documento; il team tecnico esegue la revisione finale dell'impianto.",
      "Dal secondo anno il mantenimento tiene aggiornati documenti e scadenzario (audit interni, riesame di direzione).",
    ],
    output: [
      "Manuale, politica per la qualità, analisi del contesto, valutazione di rischi e opportunità (punti 4–6)",
      "Procedure gestionali e modulistica di registrazione complete (punti 7–10)",
      "Documenti in formato Word modificabile, di tua proprietà",
      "Scadenzario di audit interni e riesami incluso nel mantenimento",
    ],
    requisiti: [
      "Il testo ufficiale della norma UNI EN ISO 9001:2015 è protetto da diritto d'autore: l'acquisto resta a carico del cliente",
      "La certificazione è rilasciata esclusivamente da organismi accreditati dopo audit: Ver0 prepara l'impianto documentale, non certifica",
      "Serve la disponibilità di chi conosce i processi interni per il questionario iniziale",
    ],
    documenti: [
      "Visura camerale e organigramma aziendale",
      "Elenco dei processi e delle attività, con i responsabili",
      "Procedure, istruzioni e moduli già in uso, se esistenti",
      "Elenco di clienti e fornitori critici (per contesto e parti interessate)",
      "Eventuali certificazioni già possedute e relativi rapporti di audit",
    ],
    riferimenti: ["UNI EN ISO 9001:2015 (struttura HLS, punti 4-10)"],
    opportunita: [
      "La certificazione 9001 è requisito o premialità in bandi pubblici e qualifiche fornitori",
      "Impianto costruito sui tuoi processi reali: manuale e procedure rispecchiano come lavori davvero",
      "Percorso qualificante per il Sigillo Ver0",
    ],
  },
  {
    slug: "manuale-iso-14001",
    name: "Manuale ISO 14001",
    icon: Scale,
    short:
      "Il sistema di gestione ambientale documentato, pronto per l'audit dell'ente terzo.",
    cosE: "L'impianto documentale completo di un sistema di gestione ambientale conforme a UNI EN ISO 14001:2015: analisi ambientale, aspetti e impatti, obblighi di conformità, procedure e modulistica secondo la struttura di alto livello della norma.",
    comeFunziona: [
      "L'analisi ambientale parte precompilata dai tuoi dati carbon, se il modulo è attivo: consumi, emissioni e aspetti già mappati.",
      "Un questionario guidato completa aspetti ambientali, prescrizioni applicabili e controlli operativi.",
      "Il Motore Ver0 genera i documenti; li rivedi e li approvi; il team tecnico esegue la revisione finale.",
      "Dal secondo anno il mantenimento aggiorna documenti, registro degli obblighi e scadenzario.",
    ],
    output: [
      "Manuale, politica ambientale, analisi del contesto e valutazione di aspetti e impatti",
      "Registro degli obblighi di conformità con aggiornamento incluso nel mantenimento",
      "Procedure gestionali e modulistica di registrazione complete, in Word modificabile",
      "Scadenzario di audit interni e riesami",
    ],
    requisiti: [
      "Il testo ufficiale della norma UNI EN ISO 14001:2015 resta a carico del cliente (diritto d'autore)",
      "La certificazione è rilasciata esclusivamente da organismi accreditati dopo audit: Ver0 prepara, non certifica",
      "L'analisi ambientale richiede i dati di consumo: il percorso rende al meglio con il modulo carbon attivo",
    ],
    documenti: [
      "Visura camerale e organigramma aziendale",
      "Planimetrie e descrizione dei siti produttivi",
      "Autorizzazioni ambientali, scarichi ed emissioni, se applicabili",
      "Registri dei rifiuti (MUD o formulari) e contratti di smaltimento",
      "Dati di consumo energetico o modulo carbon attivo",
    ],
    riferimenti: ["UNI EN ISO 14001:2015 (struttura HLS, punti 4-10)"],
    opportunita: [
      "Requisito o premialità in bandi, appalti verdi e qualifiche di filiera",
      "Con i dati carbon già in piattaforma l'analisi ambientale nasce precompilata: meno lavoro, più coerenza",
      "Percorso qualificante per il Sigillo Ver0",
    ],
  },
  {
    slug: "parita-di-genere-pdr-125",
    name: "Parità di genere UNI/PdR 125",
    icon: ShieldCheck,
    short: "KPI, sistema di gestione e fascicolo per l'audit UNI/PdR 125:2022.",
    cosE: "La preparazione alla certificazione della parità di genere secondo la prassi di riferimento UNI/PdR 125:2022: autovalutazione sui KPI delle sei aree previste, sistema di gestione della parità e fascicolo documentale pronto per l'audit dell'organismo accreditato.",
    comeFunziona: [
      "I KPI di governance partono precompilati dai dati camerali (composizione degli organi); gli altri si inseriscono in forma aggregata.",
      "Il Motore Ver0 genera politica, piano strategico e procedure del sistema di gestione della parità.",
      "Rivedi e approvi i documenti; il team tecnico verifica la completezza del fascicolo per l'audit.",
      "Dal secondo anno il mantenimento aggiorna KPI, piano e documentazione per il monitoraggio annuale.",
    ],
    output: [
      "Autovalutazione guidata sui KPI delle sei aree della UNI/PdR 125:2022 (cultura e strategia, governance, processi HR, opportunità di crescita, equità remunerativa, tutela della genitorialità)",
      "Politica, piano strategico e procedure del sistema di gestione della parità",
      "Fascicolo documentale pronto per l'audit di certificazione",
      "KPI di governance precompilati dai dati camerali",
    ],
    requisiti: [
      "I dati su retribuzioni e genere si trattano esclusivamente in forma aggregata ai fini dei KPI: nessun dato nominativo viene archiviato",
      "Servono gli aggregati HR, tipicamente forniti dal consulente del lavoro",
      "La certificazione è rilasciata esclusivamente da organismi accreditati dopo audit",
    ],
    documenti: [
      "Visura camerale e composizione degli organi sociali",
      "Organico aggregato per genere, inquadramento e tipologia contrattuale",
      "Dati retributivi aggregati per fascia (mai nominativi)",
      "Piani formativi e politiche HR già adottate",
      "Dati su congedi parentali e strumenti di conciliazione",
    ],
    riferimenti: ["UNI/PdR 125:2022 (sei aree e relativi KPI)"],
    opportunita: [
      "Esonero contributivo previsto per le aziende certificate (nei limiti di legge)",
      "Premialità nei bandi pubblici e punteggi negli appalti",
      "Percorso qualificante per il Sigillo Ver0",
    ],
  },
  {
    slug: "rating-economia-circolare",
    name: "Rating economia circolare",
    icon: Building2,
    short: "La misura della circolarità: materiali, rifiuti, riuso, energia.",
    cosE: "La valutazione strutturata di quanto la tua impresa è circolare: flussi di materiali, gestione dei rifiuti, riuso e recupero, energia. Un punteggio per area con il dettaglio dei criteri e un piano di miglioramento ordinato per impatto.",
    comeFunziona: [
      "Un questionario guidato raccoglie i dati su approvvigionamento, produzione, rifiuti e recupero; i dati energetici arrivano dai moduli attivi.",
      "Il Motore Ver0 calcola il punteggio per area applicando criteri dichiarati.",
      "Il report propone azioni di miglioramento ordinate per impatto; il team tecnico valida il risultato.",
    ],
    output: [
      "Punteggio di circolarità con dettaglio per area e criteri espliciti",
      "Report con posizionamento rispetto al settore",
      "Piano di miglioramento con azioni ordinate per impatto",
    ],
    requisiti: [
      "Dati su acquisti, rifiuti e gestione dei materiali dell'anno di riferimento; dove mancano si applicano stime dichiarate",
      "Il rating è una valutazione di parte prima con metodologia trasparente: non è una certificazione",
    ],
    documenti: [
      "Elenco dei materiali e delle materie prime acquistate",
      "Registri dei rifiuti (MUD o formulari) dell'anno di riferimento",
      "Dati su recupero, riuso e materiali riciclati in ingresso",
      "Consumi energetici o modulo carbon attivo",
      "Eventuali analisi o certificazioni di prodotto già disponibili",
    ],
    riferimenti: [
      "UNI/TS 11820:2022 (misurazione della circolarità) come riferimento metodologico",
      "Principi del Piano d'azione UE per l'economia circolare",
    ],
    opportunita: [
      "Le filiere chiedono con frequenza crescente evidenze di circolarità ai fornitori",
      "Riusa i dati già inseriti negli altri moduli: effort ridotto",
      "Un argomento distintivo in gare e presentazioni commerciali",
    ],
  },
  {
    slug: "supporto-audit",
    name: "Supporto all'audit di certificazione",
    icon: LifeBuoy,
    short:
      "Hai ricevuto rilievi dall'organismo? Adeguiamo i documenti, anche se non li abbiamo fatti noi.",
    cosE: "L'intervento mirato dopo la visita dell'organismo di certificazione: carichi i rilievi che hai ricevuto — osservazioni, raccomandazioni, non conformità maggiori o minori — e adeguiamo la documentazione del sistema di gestione perché risponda punto per punto. Si paga una volta, per l'intervento: nessun canone.",
    copre: [
      "Osservazioni e raccomandazioni",
      "Non conformità minori e maggiori",
      "Anche documenti non prodotti da noi",
    ],
    comeFunziona: [
      "Carichi il rapporto di audit dell'organismo con i rilievi, e i documenti del sistema di gestione a cui si riferiscono.",
      "Il Motore Ver0 associa ogni rilievo al requisito di norma richiamato e individua i documenti da modificare.",
      "La documentazione viene revisionata dove serve e viene redatta una nota di risposta, rilievo per rilievo.",
      "Un professionista del team tecnico verifica l'intero pacchetto prima della consegna: è un passaggio obbligatorio, non opzionale.",
    ],
    output: [
      "Documentazione del sistema di gestione revisionata nei punti oggetto di rilievo",
      "Nota di risposta ai rilievi, con il riferimento puntuale al requisito di norma richiamato",
      "Verifica umana obbligatoria su tutto il pacchetto, con firma del professionista",
    ],
    requisiti: [
      "Serve il rapporto di audit dell'organismo: senza i rilievi formalizzati non è possibile lavorare",
      "Non promettiamo l'esito dell'audit: la decisione appartiene esclusivamente all'organismo di certificazione",
      "Non contattiamo l'ente per tuo conto e non interloquiamo con gli auditor: l'indipendenza della parte terza resta intatta",
      "Adeguiamo la documentazione; l'attuazione delle azioni correttive in azienda resta a carico tuo",
    ],
    documenti: [
      "Rapporto di audit dell'organismo di certificazione con i rilievi formalizzati",
      "Documentazione del sistema di gestione in vigore (manuale, procedure, moduli)",
      "Eventuale piano di azioni correttive già concordato con l'organismo",
      "Scadenza entro cui la risposta va trasmessa all'organismo",
    ],
    riferimenti: [
      "UNI CEI EN ISO/IEC 17021-1:2015 (requisiti per gli organismi di certificazione dei sistemi di gestione)",
      "La norma oggetto dell'audit: UNI EN ISO 9001, UNI EN ISO 14001, UNI/PdR 125 e altre",
    ],
    opportunita: [
      "Le risposte ai rilievi hanno scadenze strette: intervenire subito evita la sospensione dell'iter",
      "Funziona anche sui sistemi di gestione che non abbiamo prodotto noi: non serve rifare tutto da capo",
      "Si paga una volta sola, per l'intervento: nessun canone e nessun impegno successivo",
    ],
  },
];

/** Percorsi certificabili: pagine su cui compare il richiamo al supporto
 *  all'audit (l'audit lo fa un organismo terzo, noi adeguiamo i documenti). */
export const SERVIZI_CERTIFICABILI = [
  "manuale-iso-9001",
  "manuale-iso-14001",
  "parita-di-genere-pdr-125",
];

/** Il richiamo, in formula unica per sito e area riservata. */
export const RICHIAMO_SUPPORTO_AUDIT = {
  slug: "supporto-audit",
  titolo: "Hai già un audit in corso?",
  testo:
    "Possiamo aiutarti anche se i documenti non li abbiamo fatti noi: carichi i rilievi ricevuti dall'organismo e adeguiamo la documentazione.",
  cta: "Scopri il supporto all'audit",
};

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
        benefit: "Scope 1, 2 e 3: l'inventario completo, filiera compresa.",
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
  {
    key: "trasversali",
    title: "Trasversali",
    sub: "Interventi mirati, senza canone",
    voci: [
      {
        slug: "supporto-audit",
        name: "Supporto all'audit di certificazione",
        benefit:
          "Rilievi ricevuti dall'organismo? Adeguiamo i documenti, anche se non li abbiamo fatti noi.",
      },
    ],
  },
];
