/**
 * LE GUIDE — perché te lo chiedono, con la norma accanto.
 *
 * ═══ PERCHÉ VIVONO IN UNA SEZIONE LORO ═══
 *
 * Questi quattro fatti sono nati in cima alla pagina Servizi. Erano
 * corretti e verificati, e nel posto sbagliato: un catalogo contiene i
 * servizi, il prezzo, cosa tratta ciascuno e il modo di scegliere — non
 * una lezione di contesto normativo. Chi arriva su /servizi ha già
 * deciso di guardare cosa vendiamo; chi si chiede perché la banca gli
 * abbia mandato un questionario sta facendo un'altra domanda, e la fa
 * altrove — spesso a un motore di ricerca o a un assistente.
 *
 * Da lì la forma: una guida per domanda, con il titolo che RIPETE la
 * domanda vera e la risposta autoconclusiva in apertura. Chi legge non
 * deve credere a noi: deve poter aprire la norma e controllare.
 *
 * ═══ LA REGOLA DI SCRITTURA (vincolante) ═══
 *
 * 1. OGNI RIGA PORTA LA SUA FONTE: numero della norma, data, articolo o
 *    paragrafo dove esiste. Se una fonte non regge la verifica, la riga
 *    si TOGLIE — non si genericizza. Una frase come «le banche chiedono
 *    sempre più spesso dati ESG» senza riferimento è esattamente il tipo
 *    di riempitivo che questa sezione ha sostituito.
 * 2. IL LINK ALLA FONTE È PUBBLICO E UFFICIALE: EUR-Lex, EBA, la
 *    Commissione, l'ente che pubblica il dato. Mai un blog che riassume.
 * 3. SI DICE COSA COMPORTA, non cosa ne pensiamo. Nessun giudizio su
 *    banche, committenti o consulenti (regola in CLAUDE.md), nessuna
 *    quantificazione di tempo o impegno del cliente (SPEC §12.O).
 * 4. NIENTE ALLARMISMO. Il fatto è già abbastanza: se una riga ha
 *    bisogno di un aggettivo per pesare, quella riga non pesa.
 * 5. SI RIVERIFICA. Le norme cambiano — l'Omnibus ne è la prova — e una
 *    fonte sbagliata in pagina vale meno di una sezione assente.
 *    Ultima verifica: 22 agosto 2026.
 *
 * ═══ VERIFICATO IL 22/08/2026, UNO PER UNO ═══
 *
 * - EBA/GL/2025/01: testo finale letto, §24 e §25; date di applicazione
 *   dal comunicato EBA del 9 gennaio 2025.
 * - Direttiva (UE) 2026/470: titolo, numero e data confermati su
 *   EUR-Lex; il «value chain cap» e la soglia dei 1.000 dipendenti dalla
 *   pagina della Commissione europea del 6 maggio 2026.
 * - D.Lgs. 36/2023 art. 108 comma 7 e la modifica del DL 57/2023.
 * - CDP, «Keeping Pace: Disclosure Data Factsheet 2025».
 */

export type Guida = {
  /** URL parlante: la domanda, non il nome della norma. */
  slug: string;
  /**
   * IL TITOLO È LA DOMANDA, formulata come la farebbe un'impresa —
   * «perché la banca mi chiede…», non «gli obblighi ESG per il credito».
   * Vale per la ricerca e vale doppio per un assistente, che cerca la
   * corrispondenza fra la domanda ricevuta e il titolo che trova.
   */
  domanda: string;
  /**
   * LA RISPOSTA IN APERTURA, autoconclusiva: deve reggere ritagliata,
   * senza il resto della pagina attorno. Soggetto esplicito, norma
   * dentro la frase, nessun «come visto sopra».
   */
  risposta: string;
  /** Meta description (~155): scritta per chi legge un risultato. */
  descrizione: string;
  /** Chi chiede: il soggetto, non la categoria. */
  chi: string;
  /**
   * Che cosa comporta per l'impresa: una riga, nessun aggettivo — e
   * qualcosa che la risposta d'apertura NON dice già. C'era anche un
   * campo `fatto`, che ripeteva l'apertura parola per parola due
   * paragrafi più sotto: la stessa ridondanza corretta nelle schede
   * servizio, ricomparsa qui perché il testo era nato altrove.
   */
  comporta: string;
  /** La fonte per esteso, come si cita in un documento. */
  fonte: string;
  /** Dove si controlla. Pagina ufficiale, mai un riassunto altrui. */
  url: string;
  /** I percorsi pertinenti: slug del catalogo. */
  percorsi: string[];
};

export const GUIDE: Guida[] = [
  {
    slug: "perche-la-banca-chiede-dati-di-sostenibilita",
    chi: "Le banche",
    domanda: "Perché la banca chiede dati di sostenibilità alla mia impresa?",
    risposta:
      "La banca chiede dati di sostenibilità perché le linee guida dell'Autorità bancaria europea sulla gestione dei rischi ESG (EBA/GL/2025/01) le impongono di raccogliere dati ESG a livello di singolo cliente per misurare il rischio delle proprie controparti. Si applicano dall'11 gennaio 2026, e dall'11 gennaio 2027 per gli enti piccoli e non complessi. Per le PMI non quotate le stesse linee guida indicano come riferimento lo standard volontario di rendicontazione, cioè il formato in cui conviene avere i dati pronti.",
    descrizione:
      "Le linee guida EBA (EBA/GL/2025/01) impongono alle banche di raccogliere dati ESG cliente per cliente dal 2026. Cosa significa per la tua impresa.",
    comporta:
      "L'impresa che ha già i dati nel formato che la banca si aspetta risponde una volta sola, invece di rincorrere una richiesta per volta.",
    fonte:
      "Autorità bancaria europea, Guidelines on the management of ESG risks, EBA/GL/2025/01 del 9 gennaio 2025, §24 e §25",
    url: "https://www.eba.europa.eu/publications-and-media/press-releases/eba-publishes-its-final-guidelines-management-esg-risks",
    percorsi: ["bilancio-sostenibilita-vsme-base", "carbon-footprint-scope-1-2"],
  },
  {
    slug: "perche-il-committente-chiede-dati-ai-fornitori",
    chi: "I committenti",
    domanda: "Perché un committente chiede dati di sostenibilità ai fornitori?",
    risposta:
      "Un committente chiede dati di sostenibilità ai fornitori perché deve rendicontare anche ciò che avviene nella propria catena del valore, e la Commissione europea chiama questo passaggio effetto a cascata. Dal 2026 quelle richieste hanno un tetto di legge: la Direttiva (UE) 2026/470 stabilisce che a un'impresa della catena del valore con non più di 1.000 dipendenti non si possono chiedere più informazioni di quelle previste dallo standard volontario di rendicontazione.",
    descrizione:
      "La Direttiva (UE) 2026/470 fissa un tetto alle richieste di dati verso i fornitori fino a 1.000 dipendenti: cos'è l'effetto a cascata e cosa puoi rispondere.",
    comporta:
      "Il tetto è anche la misura della risposta completa: chi rendiconta in quel formato ha già risposto a tutto ciò che il committente può chiedere.",
    fonte:
      "Direttiva (UE) 2026/470 del 24 febbraio 2026 («Omnibus I»), che introduce il limite di catena del valore",
    url: "https://finance.ec.europa.eu/news/feedback-sustainability-reporting-standards-additional-explanatory-information-regarding-value-chain-2026-05-06_en",
    percorsi: [
      "bilancio-sostenibilita-vsme-base",
      "bilancio-sostenibilita-vsme-avanzato",
    ],
  },
  {
    slug: "certificazione-parita-di-genere-punteggio-nei-bandi",
    chi: "Le stazioni appaltanti",
    domanda: "La certificazione della parità di genere dà punteggio nei bandi?",
    risposta:
      "Sì: il Codice dei contratti pubblici (D.Lgs. 36/2023, art. 108 comma 7) impone alle stazioni appaltanti di attribuire il maggior punteggio alle imprese che adottano politiche per la parità di genere, e il possesso va dimostrato con la certificazione rilasciata da un organismo accreditato secondo la prassi UNI/PdR 125:2022. Dal 2023 l'autocertificazione non è più ammessa: senza il certificato quel punteggio non viene attribuito.",
    descrizione:
      "Il D.Lgs. 36/2023 art. 108 comma 7 impone il maggior punteggio a chi ha la certificazione della parità di genere. Dal 2023 l'autocertificazione non basta più.",
    comporta:
      "Senza certificazione quel punteggio non si prende, per quanto bene sia scritta l'offerta.",
    fonte:
      "D.Lgs. 36/2023, art. 108 comma 7, che richiama l'art. 46-bis del D.Lgs. 198/2006; modificato dal DL 29 maggio 2023 n. 57",
    url: "https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:decreto.legislativo:2023-03-31;36",
    percorsi: ["parita-di-genere-pdr-125"],
  },
  {
    slug: "questionari-esg-fornitori-cosa-serve-per-rispondere",
    chi: "Le piattaforme di rating",
    domanda: "Che cosa serve per rispondere a un questionario ESG di un cliente?",
    risposta:
      "Per rispondere a un questionario ESG servono dati già calcolati, perché il questionario li raccoglie ma non li produce: al primo posto l'inventario delle emissioni dell'organizzazione. La scala del fenomeno è documentata: secondo il factsheet CDP «Keeping Pace» del 2025, oltre 270 grandi acquirenti hanno chiesto a circa 45.000 fornitori nel mondo di rendicontare dati ambientali attraverso il programma Supply Chain.",
    descrizione:
      "Un questionario ESG raccoglie dati, non li produce: quali servono, a partire dall'inventario delle emissioni, e quanto è diffusa la richiesta secondo CDP.",
    comporta:
      "L'impresa che ha già l'inventario delle emissioni compila il questionario invece di doverlo prima costruire, e riusa gli stessi dati per il questionario successivo.",
    fonte: "CDP, Keeping Pace: Disclosure Data Factsheet 2025",
    url: "https://www.cdp.net/en/insights/keeping-pace-disclosure-data-factsheet-2025",
    percorsi: [
      "carbon-footprint-scope-1-2",
      "carbon-footprint-scope-1-2-3",
    ],
  },
];

/**
 * La data dell'ultima verifica delle fonti.
 *
 * Sta in pagina, non solo nel commento: una guida che cita una norma
 * senza dire quando è stata controllata chiede fiducia invece di darne.
 * Va aggiornata insieme alle fonti, mai da sola.
 */
export const VERIFICATE_IL = {
  iso: "2026-08-22",
  esteso: "22 agosto 2026",
} as const;

export function getGuida(slug: string): Guida | undefined {
  return GUIDE.find((g) => g.slug === slug);
}

/** Le guide che rimandano a un percorso: per il link contestuale in scheda. */
export function guidePerServizio(slug: string): Guida[] {
  return GUIDE.filter((g) => g.percorsi.includes(slug));
}
