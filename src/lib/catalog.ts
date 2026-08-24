import {
  Leaf,
  FileText,
  Gauge,
  KeyRound,
  LifeBuoy,
  Scale,
  ShieldCheck,
  Building2,
  Users,
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
 *
 * ═══ LE DESIGNAZIONI DELLE NORME SI RIVERIFICANO ═══
 *
 * Non basta scriverle giuste una volta: le norme vengono ritirate e
 * sostituite, e una designazione superata in una pagina che vende
 * conformità è la peggiore figura possibile. Controllate su store.uni.com
 * il 24 agosto 2026, che è la fonte ufficiale per la designazione
 * italiana:
 *
 *   UNI EN ISO 9001:2015+A1:2024   in vigore dal 16 ottobre 2024
 *                                  (la 9001:2015 semplice è ritirata)
 *   UNI EN ISO 14001:2026          in vigore dal 15 aprile 2026
 *                                  (la 14001:2015+A1:2024 è ritirata)
 *   UNI EN ISO 45001:2023+A1:2024  (la UNI ISO 45001:2018 è ritirata
 *                                  dal 28 settembre 2023)
 *   UNI EN ISO 14064-1:2019        in vigore dall'11 aprile 2019
 *   UNI/PdR 125:2022               in vigore dal 16 marzo 2022
 *   UNI/TS 11820:2024              in vigore dal 14 novembre 2024
 *                                  (la :2022 è ritirata dalla stessa data)
 *   UNI ISO 45003:2021             in vigore dal 18 novembre 2021
 *   UNI ISO 30415:2021             in vigore dal 29 luglio 2021
 *
 * L'aggiornamento «A1:2024» è quello sul cambiamento climatico, che nel
 * 2024 ha toccato tutte le norme sui sistemi di gestione.
 */
export type Servizio = {
  slug: string;
  /** NOME TECNICO COMPLETO (§12.I): un addetto ai lavori deve riconoscere
   *  il servizio esatto dal nome. I tagli commerciali stanno in `taglio`. */
  name: string;
  /** Il taglio, come riga secondaria: "Scope 1 e 2", "Base", "Avanzato"… */
  taglio?: string;
  icon: LucideIcon;
  featured?: boolean;
  /** Riga breve per le card di home e indice. */
  short: string;
  /**
   * A CHI SERVE, in una frase che regge da sola.
   *
   * È la risposta alla domanda che nessun campo copriva: «chi può fare
   * questo percorso, e perché lo farebbe». Va scritta per essere letta
   * FUORI dalla pagina — dentro una risposta generata, dove non c'è il
   * titolo sopra né il prezzo accanto — quindi con soggetto esplicito e
   * senza rimandi al contesto. Niente promesse di risultato: si dice a
   * chi si rivolge e perché lo chiedono, non cosa otterrà.
   */
  perChi: string;
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
  /**
   * Perimetro del servizio, quando c'è un confine da dichiarare senza
   * equivoci (es. ISO 45001: il DVR resta obbligo del datore di lavoro).
   * Va mostrato IN EVIDENZA in ogni punto di contatto: scheda, vetrina,
   * funnel d'acquisto.
   */
  perimetro?: string;
  /** Lo stesso confine in una riga, per la vetrina e gli spazi stretti. */
  perimetroBreve?: string;
  /** Badge "cosa copre": mostrati sotto il titolo del dettaglio. */
  copre?: string[];
  /**
   * La lista PRECISA di documenti richiesti dal percorso.
   *
   * SOLO PORTALE, mai sito pubblico (regola in CLAUDE.md). Stava anche
   * nella scheda servizio, sotto «Cosa ti chiederemo»: è la mappatura fra
   * un percorso e ciò che serve per costruirlo, cioè know-how operativo,
   * e in vetrina era regalato a chiunque passasse. Qui resta perché il
   * portale la usa per guidare la raccolta dopo l'attivazione.
   */
  documenti: string[];
  /** Norme e standard di riferimento, citati con precisione (§12.P). */
  riferimenti: string[];
};

/**
 * Il titolo completo di un percorso: nome più taglio.
 *
 * Serve ovunque il servizio vada NOMINATO fuori dalla sua pagina —
 * llms.txt, domande frequenti, dati strutturati — perché due percorsi
 * possono avere lo stesso nome e distinguersi solo per il taglio
 * (Carbon Footprint Scope 1 e 2 contro Scope 1, 2 e 3). Senza il taglio
 * sarebbero due voci identiche che puntano a pagine diverse.
 */
export function titoloServizio(s: Servizio): string {
  return s.taglio ? `${s.name} — ${s.taglio}` : s.name;
}

/** Principio "solo standard ufficiali" (§12.P): formula unica per tutto il sito. */
export const SOLO_STANDARD_UFFICIALI =
  "Lavoriamo solo su standard e norme nazionali e internazionali riconosciute — mai protocolli proprietari senza validità tecnico-scientifica.";

export const SERVIZI: Servizio[] = [
  {
    slug: "percorso-ver0",
    perChi:
      "Serve alle piccole e medie imprese a cui una banca, un capofiliera o un bando chiedono dati di sostenibilità: copre con un solo inserimento l'inventario delle emissioni Scope 1 e 2, il bilancio VSME e le risposte ai questionari ESG.",
    name: "Percorso Ver0",
    taglio: "Carbon Scope 1 e 2 + VSME Base + profilo ESG",
    icon: Leaf,
    featured: true,
    short:
      "Carbon Footprint Scope 1 e 2 + Bilancio di Sostenibilità (VSME) Base + profilo ESG pronto per i questionari di banche e capofiliera.",
    cosE: "Il percorso integrato che unisce inventario delle emissioni (Scope 1 e 2), bilancio di sostenibilità in formato VSME e preparazione delle risposte ai questionari e ai rating di terze parti richiesti da banche e capofiliera. Un solo inserimento dati alimenta tutti e tre i documenti, con un'unica scadenza annuale riferita all'anno solare chiuso.",
    copre: [
      "Carbon Footprint Scope 1 e 2",
      "Bilancio VSME Base",
      "Profilo ESG per questionari e rating di terze parti",
    ],
    comeFunziona: [
      "L'AI Ver0 ti indica la lista esatta dei documenti da caricare (bollette, visura, bilancio), li legge e li incrocia con le banche dati ufficiali.",
      "Verifichi e confermi i dati proposti; dove un dato manca, il sistema propone una stima dichiarata che approvi tu.",
      "La piattaforma genera report GHG e bilancio VSME; il team tecnico li valida prima dell'emissione.",
      "Con le categorie obbligatorie confermate accedi ai requisiti del Sigillo Ver0 livello 1.",
    ],
    output: [
      "Report di inventario GHG (Scope 1 e 2) redatto secondo GHG Protocol Corporate Standard e UNI EN ISO 14064-1:2019",
      "Bilancio di sostenibilità conforme allo standard volontario VSME pubblicato da EFRAG",
      "Profilo ESG pronto: risposte già composte per i questionari di banche e capofiliera (EcoVadis, Synesgy, Open-es, CDP). Il punteggio lo assegna sempre l'ente terzo",
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
      "Tre documenti con un solo inserimento dati: l'effort complessivo è una frazione dei tre percorsi separati",
    ],
  },
  {
    slug: "carbon-footprint-scope-1-2",
    perChi:
      "Serve alle imprese a cui un cliente strutturato, una banca o un bando chiede l'impronta di carbonio dell'organizzazione: è il primo documento richiesto nella qualifica fornitori e riguarda i consumi diretti e l'energia acquistata.",
    name: "Carbon Footprint di Organizzazione",
    taglio: "Scope 1 e 2",
    icon: Leaf,
    short: "Scope 1 e 2 secondo GHG Protocol e UNI EN ISO 14064-1.",
    cosE: "L'inventario delle emissioni dirette (Scope 1) e da energia acquistata (Scope 2) della tua organizzazione, calcolato dai documenti reali di consumo con fattori di emissione pubblici e tracciabili.",
    copre: ["Scope 1 — emissioni dirette", "Scope 2 — energia acquistata"],
    comeFunziona: [
      "L'AI Ver0 ti chiede i documenti previsti dal percorso — bollette e fatture carburante — e ne estrae consumi, periodi e tipo di fornitura, segnalando cosa manca.",
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
      "L'upgrade al taglio Scope 1, 2 e 3 è sempre possibile pagando la differenza: i dati inseriti restano",
    ],
  },
  {
    slug: "carbon-footprint-scope-1-2-3",
    perChi:
      "Serve alle imprese che forniscono capofiliera tenuti a rendicontare lo Scope 3, e a chi vuole misurare l'impronta della propria catena del valore oltre ai consumi diretti.",
    name: "Carbon Footprint di Organizzazione",
    taglio: "Scope 1, 2 e 3",
    icon: Leaf,
    short: "Scope 1, 2 e 3: l'inventario completo, filiera compresa.",
    cosE: "L'inventario completo delle emissioni: oltre a Scope 1 e 2, le emissioni indirette di filiera (Scope 3) — beni e servizi acquistati, trasporti, uso dei prodotti — raccolte e stimate con metodi dichiarati categoria per categoria.",
    copre: [
      "Scope 1 — emissioni dirette",
      "Scope 2 — energia acquistata",
      "Scope 3 — filiera e indirette",
    ],
    comeFunziona: [
      "Parti dalla stessa lista del taglio Scope 1 e 2; l'AI Ver0 legge i documenti, incrocia le banche dati ufficiali e segnala gli scostamenti.",
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
      "Tutti i documenti del taglio Scope 1 e 2 (bollette, carburanti, visura)",
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
      "Include tutto il taglio Scope 1 e 2; partendo da lì si paga solo la differenza",
      "La base più solida per obiettivi di riduzione credibili e per il Sigillo",
    ],
  },
  {
    slug: "bilancio-sostenibilita-vsme-base",
    perChi:
      "Serve alle piccole e medie imprese che ricevono un questionario di sostenibilità diverso da ogni banca e da ogni cliente, e vogliono rispondere con un unico documento nel formato europeo pensato per le PMI.",
    name: "Bilancio di Sostenibilità (VSME)",
    taglio: "Base",
    icon: FileText,
    short: "Il bilancio di sostenibilità nel formato europeo VSME.",
    cosE: "Il bilancio di sostenibilità redatto secondo lo standard volontario VSME pubblicato da EFRAG per le imprese non quotate: un documento unico e standardizzato che risponde alle richieste di banche, clienti e bandi senza rifare il lavoro per ogni questionario.",
    comeFunziona: [
      "La piattaforma precompila anagrafica e dati economici dalle banche dati ufficiali; gli indicatori ambientali arrivano dai moduli carbon se attivi.",
      "Completi le sezioni restanti con un questionario guidato; ogni campo ha un'alternativa (documento, stima dichiarata, delega).",
      "L'AI Ver0 genera la narrativa sui tuoi dati; la rivedi e la approvi sezione per sezione.",
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
      "Sempre più istituti lo usano nei propri rating ESG per l'accesso al credito: il punteggio resta loro, noi prepariamo le risposte",
      "Percorso qualificante per il Sigillo Ver0",
    ],
  },
  {
    slug: "bilancio-sostenibilita-vsme-avanzato",
    perChi:
      "Serve alle imprese a cui partner, finanziatori o capofiliera chiedono più del modulo base: politiche, obiettivi e indicatori del modulo completo.",
    name: "Bilancio di Sostenibilità (VSME)",
    taglio: "Avanzato",
    icon: FileText,
    short:
      "Il VSME completo: modulo base più il modulo comprehensive, per partner e finanziatori esigenti.",
    cosE: "Il bilancio di sostenibilità VSME nella versione estesa: al modulo base si aggiunge il modulo completo dello standard EFRAG — politiche, azioni e obiettivi, più le informazioni richieste da partner commerciali e finanziatori quando il modulo base non basta a chiudere la richiesta.",
    copre: [
      "Tutto il modulo base",
      "Modulo completo: politiche, azioni, obiettivi",
      "Upgrade dal Base pagando la differenza",
    ],
    comeFunziona: [
      "Si parte dal modulo base: anagrafica e dati economici precompilati, indicatori ambientali dai moduli carbon se attivi.",
      "Il questionario guidato prosegue sulle sezioni del modulo completo: politiche adottate, azioni in corso, obiettivi con orizzonte temporale.",
      "L'AI Ver0 genera la narrativa estesa sui tuoi dati; la rivedi e la approvi sezione per sezione.",
      "Il team tecnico valida il bilancio prima dell'emissione.",
    ],
    output: [
      "Bilancio conforme allo standard VSME (modulo base e modulo completo), in PDF e in versione online condivisibile",
      "Sezione politiche, azioni e obiettivi compilata secondo le definizioni dello standard",
      "Informazioni aggiuntive per partner commerciali e finanziatori",
      "Importazione automatica degli indicatori dagli altri moduli attivi",
    ],
    requisiti: [
      "Oltre ai dati del modulo base servono politiche e obiettivi formalizzati: dove non esistono, il percorso aiuta a definirli ma la decisione resta dell'impresa",
      "Lo standard VSME è volontario: non sostituisce obblighi di rendicontazione eventualmente applicabili alla tua impresa",
    ],
    documenti: [
      "Tutti i documenti previsti per il taglio Base",
      "Politiche formalizzate su ambiente, personale, catena di fornitura",
      "Obiettivi di sostenibilità già deliberati, con orizzonte temporale",
      "Evidenze delle azioni in corso (progetti, investimenti, iniziative)",
      "Informazioni su rapporti con partner commerciali e finanziatori",
    ],
    riferimenti: [
      "Standard VSME (EFRAG), modulo base e modulo completo",
      "GHG Protocol e UNI EN ISO 14064-1 per gli indicatori ambientali",
    ],
    opportunita: [
      "Quando il modulo base non basta, evita di rifare il lavoro: il completo si costruisce sugli stessi dati",
      "Le informazioni del modulo completo sono quelle che banche e capofiliera chiedono in seconda battuta",
      "Percorso qualificante per il Sigillo Ver0",
    ],
  },
  {
    slug: "manuale-sistema-gestione-iso-9001",
    perChi:
      "Serve alle imprese che devono ottenere o rinnovare la certificazione ISO 9001, richiesta come requisito o come premialità in bandi pubblici e qualifiche fornitori.",
    name: "Manuale del Sistema di Gestione ISO 9001",
    taglio: "UNI EN ISO 9001:2015+A1:2024 — qualità",
    icon: Scale,
    short: "Il sistema qualità documentato, pronto per l'audit dell'ente terzo.",
    cosE: "L'impianto documentale completo di un sistema di gestione per la qualità conforme a UNI EN ISO 9001:2015+A1:2024, generato sui dati e sui processi reali della tua azienda: manuale, politica, procedure e modulistica secondo la struttura di alto livello della norma (punti 4–10).",
    comeFunziona: [
      "La piattaforma precompila contesto e anagrafica dai dati camerali; un questionario guidato raccoglie processi, ruoli e responsabilità.",
      "L'AI Ver0 genera i documenti sezione per sezione, applicando i requisiti della norma alla tua realtà operativa.",
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
      "Il testo ufficiale della norma UNI EN ISO 9001:2015+A1:2024 è protetto da diritto d'autore: l'acquisto resta a carico del cliente",
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
    riferimenti: ["UNI EN ISO 9001:2015+A1:2024 (struttura HLS, punti 4-10)"],
    opportunita: [
      "La certificazione 9001 è requisito o premialità in bandi pubblici e qualifiche fornitori",
      "Impianto costruito sui tuoi processi reali: manuale e procedure rispecchiano come lavori davvero",
      "Percorso qualificante per il Sigillo Ver0",
    ],
  },
  {
    slug: "manuale-sistema-gestione-iso-14001",
    perChi:
      "Serve alle imprese che devono presentarsi con un sistema di gestione ambientale certificabile in bandi, appalti verdi e qualifiche di filiera.",
    name: "Manuale del Sistema di Gestione ISO 14001",
    taglio: "UNI EN ISO 14001:2026 — ambiente",
    icon: Scale,
    short:
      "Il sistema di gestione ambientale documentato, pronto per l'audit dell'ente terzo.",
    cosE: "L'impianto documentale completo di un sistema di gestione ambientale conforme a UNI EN ISO 14001:2026: analisi ambientale, aspetti e impatti, obblighi di conformità, procedure e modulistica secondo la struttura di alto livello della norma.",
    comeFunziona: [
      "L'analisi ambientale parte precompilata dai tuoi dati carbon, se il modulo è attivo: consumi, emissioni e aspetti già mappati.",
      "Un questionario guidato completa aspetti ambientali, prescrizioni applicabili e controlli operativi.",
      "L'AI Ver0 genera i documenti; li rivedi e li approvi; il team tecnico esegue la revisione finale.",
      "Dal secondo anno il mantenimento aggiorna documenti, registro degli obblighi e scadenzario.",
    ],
    output: [
      "Manuale, politica ambientale, analisi del contesto e valutazione di aspetti e impatti",
      "Registro degli obblighi di conformità con aggiornamento incluso nel mantenimento",
      "Procedure gestionali e modulistica di registrazione complete, in Word modificabile",
      "Scadenzario di audit interni e riesami",
    ],
    requisiti: [
      "Il testo ufficiale della norma UNI EN ISO 14001:2026 resta a carico del cliente (diritto d'autore)",
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
    riferimenti: ["UNI EN ISO 14001:2026 (struttura HLS, punti 4-10)"],
    opportunita: [
      "Requisito o premialità in bandi, appalti verdi e qualifiche di filiera",
      "Con i dati carbon già in piattaforma l'analisi ambientale nasce precompilata: meno lavoro, più coerenza",
      "Percorso qualificante per il Sigillo Ver0",
    ],
  },
  {
    slug: "parita-di-genere-pdr-125",
    perChi:
      "Serve alle imprese che puntano alla certificazione per la parità di genere, per l'esonero contributivo previsto dalla legge e per i punteggi premiali nei bandi.",
    name: "Sistema di Gestione per la Parità di Genere",
    taglio: "UNI/PdR 125:2022",
    icon: ShieldCheck,
    short: "KPI, sistema di gestione e fascicolo per l'audit UNI/PdR 125:2022.",
    cosE: "La preparazione alla certificazione della parità di genere secondo la prassi di riferimento UNI/PdR 125:2022: autovalutazione sui KPI delle sei aree previste, sistema di gestione della parità e fascicolo documentale pronto per l'audit dell'organismo accreditato.",
    comeFunziona: [
      "I KPI di governance partono precompilati dai dati camerali (composizione degli organi); gli altri si inseriscono in forma aggregata.",
      "L'AI Ver0 genera politica, piano strategico e procedure del sistema di gestione della parità.",
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
    slug: "manuale-sistema-gestione-iso-45001",
    perChi:
      "Serve alle imprese che hanno già un DVR in vigore e vogliono strutturare la sicurezza sul lavoro in un sistema di gestione certificabile.",
    name: "Manuale del Sistema di Gestione ISO 45001",
    taglio: "UNI EN ISO 45001:2023+A1:2024 — sicurezza, DVR escluso",
    icon: ShieldCheck,
    short:
      "Il sistema di gestione della sicurezza sul lavoro, integrato con il tuo DVR.",
    cosE: "L'impianto documentale del sistema di gestione della salute e sicurezza sul lavoro secondo UNI EN ISO 45001:2023+A1:2024: politica, analisi del contesto, ruoli e responsabilità, procedure operative, gestione delle emergenze, monitoraggio, audit interni e riesame della direzione. Il sistema si innesta sulla valutazione dei rischi che l'impresa ha già.",
    // Il confine va detto prima di ogni cosa: è la differenza tra un
    // servizio corretto e una promessa che non possiamo mantenere.
    perimetro:
      "Produciamo il sistema di gestione e lo integriamo con il tuo DVR. Il DVR resta un obbligo indelegabile del datore di lavoro (artt. 17, 28 e 29 D.Lgs. 81/2008): lo redigi tu con il tuo RSPP e non rientra nel Manuale del Sistema di Gestione ISO 45001.",
    perimetroBreve:
      "Il DVR non è incluso: resta obbligo del datore di lavoro.",
    copre: [
      "Sistema di gestione UNI EN ISO 45001:2023+A1:2024",
      "Integrazione con il DVR esistente",
      "DVR escluso: resta del datore di lavoro",
    ],
    comeFunziona: [
      "L'AI Ver0 raccoglie visura, organigramma della sicurezza (datore di lavoro, RSPP, medico competente, RLS), DVR in vigore e documentazione già presente.",
      "Legge il DVR e ne riprende pericoli, misure e scadenze per costruire il sistema attorno alla valutazione dei rischi che hai già, senza duplicarla.",
      "Genera manuale, politica, procedure, modulistica, piano di audit interni e riesame della direzione secondo la struttura HLS della norma.",
      "Un professionista del team tecnico verifica l'impianto prima della consegna; il fascicolo è pronto per l'audit dell'organismo accreditato.",
    ],
    output: [
      "Manuale del sistema di gestione SSL secondo UNI EN ISO 45001:2023+A1:2024",
      "Politica per la salute e sicurezza, procedure e modulistica operativa",
      "Piano di audit interni, indicatori di monitoraggio e verbale di riesame della direzione",
      "Matrice di correlazione tra requisiti della norma e documenti prodotti, per l'audit dell'ente",
    ],
    requisiti: [
      "Serve un DVR in vigore: senza la valutazione dei rischi il sistema non può essere costruito",
      "Il DVR non rientra nel servizio ed è obbligo indelegabile del datore di lavoro (artt. 17, 28 e 29 D.Lgs. 81/2008)",
      "La certificazione è rilasciata esclusivamente da organismi accreditati: Verzero prepara il fascicolo e accompagna, non certifica",
      "Il sistema produce effetti solo se attuato: la documentazione è la base, l'applicazione quotidiana resta dell'impresa",
    ],
    documenti: [
      "Visura camerale aggiornata",
      "DVR in vigore e relativi allegati",
      "Organigramma della sicurezza: datore di lavoro, dirigenti, preposti, RSPP, medico competente, RLS",
      "Registro della formazione e attestati in corso di validità",
      "Elenco degli infortuni e dei mancati infortuni degli ultimi anni",
      "Procedure, istruzioni operative e DUVRI già in uso, se esistenti",
    ],
    riferimenti: [
      "UNI EN ISO 45001:2023+A1:2024 (sistemi di gestione per la salute e sicurezza sul lavoro)",
      "D.Lgs. 81/2008, in particolare artt. 17, 28, 29 e 30",
      "D.Lgs. 231/2001 per la responsabilità amministrativa degli enti",
    ],
    opportunita: [
      "L'art. 30 comma 5 del D.Lgs. 81/2008 riconosce la presunzione di conformità ai modelli definiti secondo le linee guida UNI-INAIL o BS OHSAS 18001:2007 «per le parti corrispondenti»: ISO 45001 ne ha preso il posto come riferimento di mercato. Attenzione: l'efficacia esimente ex D.Lgs. 231/2001 dipende dall'attuazione effettiva del sistema e dalla vigilanza sul suo funzionamento — non è mai automatica e nessuno può prometterla",
      "Riduzione del premio INAIL tramite il modello OT23, che attribuisce punteggio agli interventi di miglioramento documentati",
      "Qualifica fornitori: nelle filiere industriali e negli appalti la certificazione SSL è spesso un requisito di ammissione",
    ],
  },
  {
    slug: "iso-45003",
    perChi:
      "Serve alle imprese che hanno già un sistema di gestione della sicurezza e vogliono documentare anche i rischi psicosociali, la parte che di solito resta scoperta.",
    name: "Percorso di Aderenza UNI ISO 45003",
    taglio: "Rischi psicosociali — linea guida, non certificabile",
    icon: ShieldCheck,
    short:
      "Rischi psicosociali e benessere organizzativo: aderenza documentata, non certificabile.",
    cosE: "Il percorso di aderenza documentata alla UNI ISO 45003:2021, la linea guida per la gestione dei rischi psicosociali sul lavoro. Non è una norma certificabile: produce un impianto documentale che dimostra come l'organizzazione identifica, valuta e gestisce i fattori di rischio psicosociale, spendibile verso committenti e filiere.",
    copre: [
      "Linea guida: nessuna certificazione possibile",
      "Add-on di UNI/PdR 125 e ISO 45001",
      "Aderenza documentata e dimostrabile",
    ],
    comeFunziona: [
      "L'AI Ver0 riprende organigramma, dati di organico e — se attivi — i documenti dei percorsi UNI/PdR 125 e ISO 45001, evitando di richiedere due volte le stesse cose.",
      "Un questionario guidato mappa i fattori di rischio psicosociale previsti dalla linea guida: carichi, autonomia, relazioni, cambiamento organizzativo.",
      "La piattaforma genera politica, procedura di gestione dei rischi psicosociali, piano di miglioramento e indicatori di monitoraggio.",
      "Il team tecnico verifica la coerenza dell'impianto prima della consegna.",
    ],
    output: [
      "Politica e procedura per la gestione dei rischi psicosociali secondo UNI ISO 45003:2021",
      "Mappa dei fattori di rischio con misure di gestione associate",
      "Piano di miglioramento con indicatori e responsabilità",
      "Relazione di aderenza: come l'organizzazione risponde ai punti della linea guida",
    ],
    requisiti: [
      "UNI ISO 45003 è una linea guida: non esiste certificazione accreditata di conformità e nessuno può rilasciarla",
      "Il percorso documenta l'aderenza, non sostituisce la valutazione dei rischi da stress lavoro-correlato prevista dal D.Lgs. 81/2008",
      "I dati sul personale si trattano in forma aggregata: nessun profilo individuale",
    ],
    documenti: [
      "Organigramma e dati di organico aggregati",
      "Valutazione del rischio da stress lavoro-correlato in vigore",
      "Politiche su orari, conciliazione, lavoro da remoto, se esistenti",
      "Esiti di eventuali indagini di clima già svolte",
    ],
    riferimenti: [
      "UNI ISO 45003:2021 (gestione dei rischi psicosociali sul lavoro — linee guida)",
      "D.Lgs. 81/2008 per la valutazione del rischio da stress lavoro-correlato",
    ],
    opportunita: [
      "Completa il sistema sicurezza dove ISO 45001 si ferma: il rischio psicosociale è la parte che le imprese documentano meno",
      "Si costruisce sui dati già raccolti per UNI/PdR 125 e ISO 45001: il percorso aggiuntivo è breve",
      "Evidenza utile nei questionari ESG e nelle richieste dei capofiliera sulla dimensione sociale",
    ],
  },
  {
    slug: "iso-30415",
    perChi:
      "Serve alle imprese che vogliono documentare le proprie pratiche di diversità e inclusione oltre il perimetro della parità di genere.",
    name: "Percorso di Aderenza UNI ISO 30415",
    taglio: "Diversità e inclusione — linea guida, non certificabile",
    icon: Users,
    short:
      "Diversità e inclusione: aderenza documentata alla linea guida, non certificabile.",
    cosE: "Il percorso di aderenza documentata alla UNI ISO 30415:2021, la linea guida sulla gestione della diversità e dell'inclusione nelle risorse umane. Non è certificabile: produce l'impianto documentale che mostra come l'organizzazione presidia responsabilità, processi e indicatori di D&I lungo il ciclo di vita delle persone.",
    copre: [
      "Linea guida: nessuna certificazione possibile",
      "Add-on naturale di UNI/PdR 125",
      "Aderenza documentata e dimostrabile",
    ],
    comeFunziona: [
      "Se il percorso UNI/PdR 125 è attivo, l'AI Ver0 riusa KPI, politiche e procedure già prodotti: non ti chiede due volte gli stessi dati.",
      "Un questionario guidato copre le aree della linea guida: governance della D&I, selezione, sviluppo, retribuzione, ambiente di lavoro, rapporti con la catena di fornitura.",
      "La piattaforma genera politica, procedure e piano d'azione con indicatori e responsabilità assegnate.",
      "Il team tecnico verifica l'impianto prima della consegna.",
    ],
    output: [
      "Politica e procedure di diversità e inclusione secondo UNI ISO 30415:2021",
      "Matrice di responsabilità sulle aree della linea guida",
      "Set di indicatori D&I con baseline e obiettivi",
      "Relazione di aderenza, spendibile verso committenti e filiere",
    ],
    requisiti: [
      "UNI ISO 30415 è una linea guida: non esiste certificazione accreditata di conformità",
      "Non sostituisce la certificazione della parità di genere UNI/PdR 125, che è invece certificabile da organismo accreditato",
      "I dati su genere, retribuzioni e caratteristiche personali si trattano solo in forma aggregata",
    ],
    documenti: [
      "Organigramma e dati di organico aggregati per genere, inquadramento e anzianità",
      "Politiche di selezione, sviluppo e retribuzione, se formalizzate",
      "Documentazione del percorso UNI/PdR 125, se attivo",
      "Codice etico e procedure di segnalazione, se esistenti",
    ],
    riferimenti: [
      "UNI ISO 30415:2021 (gestione delle risorse umane — diversità e inclusione)",
      "UNI/PdR 125:2022 per la parte certificabile sulla parità di genere",
    ],
    opportunita: [
      "Estende il lavoro della UNI/PdR 125 alle dimensioni di inclusione che la prassi non copre",
      "Risponde alle sezioni sociali dei questionari ESG con documenti, non con dichiarazioni",
      "Argomento di posizionamento nelle gare e nelle relazioni con i grandi committenti",
    ],
  },
  {
    slug: "sa8000",
    perChi:
      "Serve alle imprese delle filiere labour-intensive — tessile, agroalimentare, logistica, servizi — a cui i committenti chiedono SA8000 come requisito di fornitura.",
    name: "Preparazione alla Certificazione SA8000",
    taglio: "Responsabilità sociale — schema SAI",
    icon: Users,
    short:
      "Lo schema internazionale di responsabilità sociale: preparazione documentale e accompagnamento all'audit.",
    cosE: "La preparazione alla certificazione SA8000, lo schema di responsabilità sociale di Social Accountability International: sistema di gestione, presidio dei requisiti su lavoro minorile, lavoro forzato, salute e sicurezza, libertà di associazione, discriminazione, pratiche disciplinari, orario di lavoro e retribuzione. Verzero prepara il fascicolo e accompagna fino all'audit dell'organismo.",
    // SA8000 non è una norma UNI/ISO: va detto, non lasciato intendere.
    perimetro:
      "SA8000 non è una norma UNI o ISO: è uno schema privato internazionale di Social Accountability International, certificabile da organismi accreditati SAAS. Verzero lo tratta come schema riconosciuto di parte terza, distinto dalle norme UNI e ISO su cui sono costruiti gli altri percorsi.",
    perimetroBreve:
      "Schema internazionale accreditato, non una norma UNI/ISO.",
    copre: [
      "Schema SAI, non norma UNI/ISO",
      "Certificabile da organismo accreditato SAAS",
      "Rilevante nelle filiere labour-intensive",
    ],
    comeFunziona: [
      "L'AI Ver0 raccoglie la documentazione su personale, orari, retribuzioni, salute e sicurezza e catena di fornitura, e segnala subito le lacune rispetto ai requisiti dello schema.",
      "Genera il sistema di gestione della responsabilità sociale: politica, procedure, gestione delle segnalazioni, riesame e social performance team.",
      "Costruisce il presidio della catena di fornitura, che nello schema è il punto più spesso carente: criteri di selezione, monitoraggio e azioni sui fornitori.",
      "Un professionista del team tecnico verifica il fascicolo; l'audit e la certificazione restano dell'organismo accreditato.",
    ],
    output: [
      "Sistema di gestione della responsabilità sociale secondo i requisiti SA8000",
      "Procedure sui nove requisiti dello schema e sul funzionamento del social performance team",
      "Impianto di monitoraggio della catena di fornitura, con criteri e registrazioni",
      "Fascicolo pronto per l'audit dell'organismo accreditato",
    ],
    requisiti: [
      "Lo schema richiede evidenze reali su orari, retribuzioni e trattamento del personale: la documentazione senza pratiche coerenti non supera l'audit",
      "Verzero prepara e accompagna: la certificazione è rilasciata esclusivamente da organismi accreditati SAAS",
      "I requisiti si estendono ai fornitori: serve la disponibilità a raccogliere informazioni lungo la filiera",
      "I dati sul personale si trattano in forma aggregata, salvo quanto lo schema richiede espressamente",
    ],
    documenti: [
      "Visura camerale e organigramma aggiornato",
      "Contratti applicati, tabelle retributive e registri delle presenze",
      "Documentazione su salute e sicurezza, incluso il DVR in vigore",
      "Elenco dei fornitori con categoria merceologica e paese",
      "Codice etico, procedure disciplinari e canale di segnalazione, se esistenti",
    ],
    riferimenti: [
      "SA8000:2014 (Social Accountability International), certificabile da organismi accreditati SAAS",
      "Convenzioni fondamentali dell'Organizzazione Internazionale del Lavoro richiamate dallo schema",
      "D.Lgs. 81/2008 per la parte salute e sicurezza",
    ],
    opportunita: [
      "Nelle filiere labour-intensive — tessile, agroalimentare, logistica, servizi — è spesso richiesta dai committenti come requisito di fornitura",
      "Copre la dimensione sociale che i questionari ESG chiedono e che molte imprese documentano peggio",
      "Il presidio sulla catena di fornitura resta utile anche per la due diligence richiesta dalle nuove normative europee",
    ],
  },
  {
    slug: "rating-economia-circolare",
    perChi:
      "Serve alle imprese a cui la filiera chiede evidenze di circolarità su materiali, rifiuti, riuso ed energia.",
    name: "Rating di Economia Circolare",
    taglio: "Metodologia UNI/TS 11820",
    icon: Building2,
    short: "La misura della circolarità: materiali, rifiuti, riuso, energia.",
    cosE: "La valutazione strutturata di quanto la tua impresa è circolare: flussi di materiali, gestione dei rifiuti, riuso e recupero, energia. Un punteggio per area con il dettaglio dei criteri e un piano di miglioramento ordinato per impatto.",
    comeFunziona: [
      "Un questionario guidato raccoglie i dati su approvvigionamento, produzione, rifiuti e recupero; i dati energetici arrivano dai moduli attivi.",
      "L'AI Ver0 calcola il punteggio per area applicando criteri dichiarati.",
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
      "UNI/TS 11820:2024 (misurazione della circolarità) come riferimento metodologico",
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
    perChi:
      "Serve alle imprese che hanno ricevuto rilievi da un organismo di certificazione e devono rispondere entro la scadenza, anche su documenti che non abbiamo prodotto noi.",
    name: "Supporto all'Audit di Certificazione",
    taglio: "Una tantum, senza canone",
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
      "L'AI Ver0 associa ogni rilievo al requisito di norma richiamato e individua i documenti da modificare.",
      "La documentazione viene revisionata dove serve e viene redatta una nota di risposta, rilievo per rilievo.",
      "Un professionista del team tecnico verifica l'intero pacchetto prima della consegna: è un passaggio obbligatorio, non opzionale.",
    ],
    output: [
      "Documentazione del sistema di gestione revisionata nei punti oggetto di rilievo",
      "Nota di risposta ai rilievi, con il riferimento puntuale al requisito di norma richiamato",
      "Verifica umana obbligatoria su tutto il pacchetto, con validazione del professionista",
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
  "manuale-sistema-gestione-iso-9001",
  "manuale-sistema-gestione-iso-14001",
  "manuale-sistema-gestione-iso-45001",
  "parita-di-genere-pdr-125",
  // Schema accreditato di parte terza: l'audit c'è, quindi i rilievi anche.
  "sa8000",
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
 * IL CATALOGO PER FAMIGLIE — come si sceglie, non come si classifica.
 *
 * Prima l'impalcatura erano i tre pilastri E/S/G più una famiglia
 * «sistemi di gestione». Reggeva come tassonomia e non come guida
 * all'acquisto: chi arriva non pensa «mi serve una cosa del pilastro G»,
 * pensa «la banca mi chiede dei dati» oppure «devo passare un audit».
 * E lo stesso servizio compariva due volte — ISO 9001 stava in
 * governance e nei sistemi — che è il modo più rapido di far credere che
 * siano due cose diverse.
 *
 * Ora le famiglie sono tre e rispondono alla NATURA della qualifica:
 *   misura      — produce un numero che regge un controllo;
 *   certificabile — produce l'impianto che un organismo verifica;
 *   accesso     — apre una porta: un questionario, un audit, una gara.
 * Ogni servizio compare UNA volta sola. Il pilastro E/S/G resta, ma come
 * etichetta discreta sulla scheda: è un'informazione utile a chi già sa
 * cosa cerca, non la struttura della pagina.
 */

/** Il pilastro della sostenibilità, come etichetta di scheda. */
export type Pilastro = "E" | "S" | "G";

export const PILASTRO_LABEL: Record<Pilastro, string> = {
  E: "Ambiente",
  S: "Sociale",
  G: "Governance",
};

/**
 * I BISOGNI, per il filtro «perché sono qui».
 *
 * Quattro e non dieci: sono le situazioni in cui un'impresa cerca
 * davvero una qualifica. Ogni servizio dichiara a quali risponde, e la
 * dichiarazione dev'essere sostenibile con quello che la sua scheda già
 * scrive — non un'etichetta messa lì per riempire il filtro.
 */
export const BISOGNI = [
  { key: "banca", label: "Me lo chiede la banca" },
  { key: "committente", label: "Me lo chiede un committente" },
  { key: "bando", label: "Partecipo a un bando" },
  { key: "migliorare", label: "Voglio migliorare" },
] as const;

export type Bisogno = (typeof BISOGNI)[number]["key"];

export type VoceCatalogo = {
  /** Servizio attivo: punta a /servizi/[slug]. Assente = ancora in arrivo. */
  slug?: string;
  /** Nome, solo per le voci in arrivo: gli attivi lo prendono dal catalogo. */
  nome?: string;
  /** La riga di beneficio, in lingua corrente. */
  benefit: string;
  pilastro: Pilastro;
  bisogni: Bisogno[];
  /**
   * Etichetta FATTUALE (§12.M). Ammesse solo diciture verificabili:
   * "Novità", "Spesso richiesto insieme a X" (se vero nel catalogo),
   * "Premiante nei bandi" (se documentabile). Vietate le diciture di
   * domanda ("in forte richiesta", "il più richiesto").
   */
  etichetta?: string;
  /** Si aggiunge a un percorso, non si attiva da solo. */
  addOn?: boolean;
};

export type Famiglia = {
  key: string;
  titolo: string;
  /**
   * Che cosa OTTIENI, non che cosa contiene. Una famiglia che si
   * presenta con l'elenco di sé stessa non aiuta a scegliere.
   */
  ottieni: string;
  /**
   * La stessa cosa in mezza riga, per lo schema in testa alla pagina.
   * Scritta, non ricavata tagliando `ottieni` alla prima punteggiatura:
   * quel taglio dava frasi di lunghezze diverse e si vedeva.
   */
  sintesi: string;
  icona: LucideIcon;
  voci: VoceCatalogo[];
};

export const FAMIGLIE: Famiglia[] = [
  {
    key: "misura",
    titolo: "Misura e rendiconta",
    ottieni:
      "Un numero che regge un controllo: quanto emette la tua impresa, quanto è circolare, che cosa ha fatto nell'anno. Calcolato dai documenti che hai già, con la fonte scritta accanto a ogni dato.",
    sintesi: "Un numero che regge un controllo.",
    icona: Gauge,
    voci: [
      {
        slug: "carbon-footprint-scope-1-2",
        benefit:
          "La misura ufficiale delle tue emissioni dirette e dell'energia acquistata.",
        pilastro: "E",
        bisogni: ["banca", "committente", "migliorare"],
      },
      {
        slug: "carbon-footprint-scope-1-2-3",
        benefit:
          "L'inventario completo, filiera compresa: quello che chiedono i capofiliera.",
        pilastro: "E",
        bisogni: ["committente", "migliorare"],
      },
      {
        slug: "bilancio-sostenibilita-vsme-base",
        benefit: "Un solo report nel formato europeo, al posto di dieci questionari.",
        pilastro: "G",
        bisogni: ["banca", "committente"],
      },
      {
        slug: "bilancio-sostenibilita-vsme-avanzato",
        benefit:
          "Il modulo completo: politiche, azioni e obiettivi, per partner e finanziatori esigenti.",
        pilastro: "G",
        bisogni: ["banca", "committente"],
        etichetta: "Novità",
      },
      {
        slug: "rating-economia-circolare",
        benefit: "Quanto sei circolare, in un punteggio chiaro e migliorabile.",
        pilastro: "E",
        bisogni: ["committente", "migliorare"],
      },
      {
        nome: "Monitoraggio energetico",
        benefit: "Consumi sotto controllo mese per mese, con soglie e confronti.",
        pilastro: "E",
        bisogni: ["migliorare"],
      },
    ],
  },
  {
    key: "certificabili",
    titolo: "Sistemi certificabili",
    ottieni:
      "L'impianto documentale che un organismo accreditato si aspetta di trovare all'audit: manuale, procedure e registrazioni, pronti da presentare. La certificazione la rilascia l'organismo, non noi.",
    sintesi: "L'impianto documentale pronto per l'audit.",
    icona: ShieldCheck,
    voci: [
      {
        slug: "manuale-sistema-gestione-iso-9001",
        benefit: "Il sistema qualità documentato, pronto per l'audit dell'ente terzo.",
        pilastro: "G",
        bisogni: ["bando", "committente"],
      },
      {
        slug: "manuale-sistema-gestione-iso-14001",
        benefit: "Il sistema ambientale, con l'analisi precompilata dai tuoi dati.",
        pilastro: "E",
        bisogni: ["bando", "committente"],
      },
      {
        slug: "manuale-sistema-gestione-iso-45001",
        benefit:
          "Il sistema sicurezza integrato con il tuo DVR, che resta del datore di lavoro.",
        pilastro: "S",
        bisogni: ["bando", "committente"],
        etichetta: "Novità",
      },
      {
        slug: "parita-di-genere-pdr-125",
        benefit: "KPI e fascicolo pronti per l'audit; esonero contributivo di legge.",
        pilastro: "S",
        bisogni: ["bando", "migliorare"],
        etichetta: "Premiante nei bandi",
      },
      {
        slug: "sa8000",
        benefit:
          "Lo schema internazionale di responsabilità sociale, con accompagnamento all'audit.",
        pilastro: "S",
        bisogni: ["committente"],
        etichetta: "Novità",
      },
      {
        nome: "Ospitalità sostenibile UNI ISO 21401",
        benefit: "Il sistema di gestione per le strutture ricettive.",
        pilastro: "E",
        bisogni: ["committente", "migliorare"],
      },
      {
        nome: "Eventi sostenibili ISO 20121",
        benefit: "Il sistema di gestione per eventi, fiere e hospitality.",
        pilastro: "E",
        bisogni: ["committente", "bando"],
      },
      {
        slug: "iso-45003",
        benefit:
          "Rischi psicosociali e benessere organizzativo: aderenza documentata.",
        pilastro: "S",
        bisogni: ["migliorare"],
        etichetta: "Spesso richiesto insieme a ISO 45001",
        addOn: true,
      },
      {
        slug: "iso-30415",
        benefit: "Diversità e inclusione: aderenza documentata alla linea guida.",
        pilastro: "S",
        bisogni: ["migliorare"],
        etichetta: "Spesso richiesto insieme a UNI/PdR 125",
        addOn: true,
      },
      {
        nome: "Aderenza ISO 26000 e ISO 20400",
        benefit: "Allineamento alle norme guida, spendibile verso le filiere.",
        pilastro: "G",
        bisogni: ["committente"],
        addOn: true,
      },
    ],
  },
  {
    key: "accesso",
    titolo: "Qualifica e accesso",
    ottieni:
      "La risposta pronta quando qualcuno ti valuta: i questionari già compilati, i rilievi dell'organismo chiusi nei tempi, i punti deboli trovati prima che li trovi qualcun altro.",
    sintesi: "La risposta pronta a chi ti valuta.",
    icona: KeyRound,
    voci: [
      {
        nome: "Profilo ESG per questionari e rating di terze parti",
        benefit:
          "Risposte pronte e coerenti per banche e capofiliera. Il punteggio lo assegna sempre l'ente terzo.",
        pilastro: "G",
        bisogni: ["banca", "committente"],
      },
      {
        nome: "Check-up energetico",
        benefit: "Scopri se paghi troppo l'energia, dalle bollette che hai già.",
        pilastro: "E",
        bisogni: ["migliorare"],
      },
      {
        slug: "supporto-audit",
        benefit:
          "Rilievi ricevuti dall'organismo? Adeguiamo i documenti, anche se non li abbiamo fatti noi.",
        pilastro: "G",
        bisogni: ["committente", "bando"],
      },
    ],
  },
];
