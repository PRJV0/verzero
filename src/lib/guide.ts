import type { DomandaRisposta } from "@/lib/faq-servizio";

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

/** Una sezione del corpo: titolo e paragrafi. */
export type SezioneGuida = { titolo: string; paragrafi: string[] };

/** Una fonte citata, con il posto dove si controlla. */
export type Fonte = { testo: string; url: string };

export type Guida = {
  /** URL parlante: la domanda, non il nome della norma. */
  slug: string;
  /**
   * Come la cerca chi non conosce il nome della norma: sigle, modi di
   * dire, sinonimi. Stanno qui, con la guida, per la stessa ragione per
   * cui le chiavi dei percorsi stanno nel catalogo — una guida e le
   * parole con cui la si cerca sono la stessa cosa.
   */
  chiavi?: string[];
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
  /**
   * Il corpo, per le guide che hanno qualcosa da spiegare oltre alla
   * risposta. Le prime quattro non ce l'hanno: rispondono e basta, ed è
   * giusto così — una guida che si allunga per sembrare completa è
   * riempimento, e il riempimento si riconosce.
   */
  sezioni?: SezioneGuida[];
  /** Altre fonti citate nel corpo, oltre a quella principale. */
  altreFonti?: Fonte[];
  /**
   * Domande aggiuntive, VISIBILI in fondo alla guida e marcate in
   * `FAQPage` insieme alla domanda del titolo. Valgono le stesse regole
   * delle domande delle schede servizio: risposta autoconclusiva, mai una
   * voce nel markup che non sia in pagina.
   */
  domande?: DomandaRisposta[];
  /** Le guide correlate: slug. Il collegamento è reciproco a mano. */
  correlate?: string[];
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
  {
    slug: "quanto-costa-un-bilancio-di-sostenibilita-vsme",
    chi: "Rendicontazione",
    domanda: "Quanto costa un bilancio di sostenibilità VSME e che cosa serve per farlo?",
    risposta:
      "Non esiste un prezzo di listino unico per un bilancio di sostenibilità VSME: il costo dipende da quanto è ordinato l'archivio di partenza, da quante sedi e vettori energetici vanno coperti e dal modulo scelto, perché lo standard ne prevede due — uno base e uno completo. Quello che serve, invece, è definito: il VSME è lo standard volontario di rendicontazione per le PMI raccomandato dalla Commissione europea il 30 luglio 2025, e chiede dati che un'impresa in gran parte già possiede — consumi energetici, personale, rifiuti, acqua, elementi di governance — più, nel modulo completo, politiche, obiettivi e rischi climatici.",
    descrizione:
      "Il VSME è lo standard volontario raccomandato dalla Commissione europea per le PMI: che cosa chiede e da che cosa dipende davvero il costo del bilancio.",
    comporta:
      "L'impresa che rendiconta in formato VSME risponde con un documento solo a richieste che arrivano da soggetti diversi, invece di compilare un questionario per ciascuno.",
    fonte:
      "Commissione europea, Raccomandazione su uno standard volontario di rendicontazione di sostenibilità per le PMI, 30 luglio 2025",
    url: "https://finance.ec.europa.eu/publications/questions-and-answers-recommendation-voluntary-sustainability-reporting-standard-small-and-medium_en",
    sezioni: [
      {
        titolo: "Che cosa chiede il modulo base",
        paragrafi: [
          "Il modulo base del VSME raccoglie le informazioni che quasi ogni impresa produce già senza chiamarle sostenibilità: consumi di energia ed emissioni di gas serra dirette e da energia acquistata, dati di organico, rifiuti prodotti, prelievi idrici, elementi essenziali di governance.",
          "La Commissione europea ha previsto una tutela in più per le imprese più piccole: alcune informazioni indicate come necessarie per chi ha da 11 a 1.000 dipendenti restano volontarie per chi ne ha dieci o meno.",
        ],
      },
      {
        titolo: "Che cosa aggiunge il modulo completo",
        paragrafi: [
          "Il modulo completo si rivolge a chi riceve richieste più esigenti — di norma da finanziatori o da grandi committenti — e aggiunge rischi legati al clima, piano di transizione, diritti umani e diversità. È un'estensione dello stesso impianto: si costruisce sui dati del modulo base, non li rifà.",
        ],
      },
      {
        titolo: "Da che cosa dipende davvero il costo",
        paragrafi: [
          "Le voci che spostano l'impegno sono tre, e nessuna riguarda il documento in sé. La prima è lo stato dell'archivio: bollette e registri completi per l'anno di rendicontazione accorciano tutto, dati sparsi o mancanti allungano. La seconda è il perimetro: più sedi, più vettori energetici, più società da consolidare. La terza è il modulo scelto.",
          "Sul mercato i prezzi non sono pubblici quasi mai, e questo rende difficile confrontare. Verificare che un preventivo dichiari il perimetro coperto, il modulo e chi valida il documento è più utile che confrontare la cifra da sola.",
        ],
      },
    ],
    altreFonti: [
      {
        testo: "Commissione europea, informazioni aggiuntive sul limite di catena del valore, 6 maggio 2026",
        url: "https://finance.ec.europa.eu/news/feedback-sustainability-reporting-standards-additional-explanatory-information-regarding-value-chain-2026-05-06_en",
      },
    ],
    domande: [
      {
        domanda: "Il bilancio di sostenibilità VSME è obbligatorio?",
        risposta:
          "No: il VSME è uno standard volontario, raccomandato dalla Commissione europea il 30 luglio 2025 per le imprese che non rientrano negli obblighi di rendicontazione. Diventa di fatto necessario quando una banca o un committente chiede dati di sostenibilità, perché è il formato che quelle richieste possono legittimamente pretendere e non di più.",
      },
      {
        domanda: "Chi può redigere un bilancio di sostenibilità VSME?",
        risposta:
          "Il VSME non riserva la redazione a una figura abilitata: può prepararlo l'impresa stessa, un consulente o un fornitore di servizi. Lo standard è volontario e non prevede una certificazione obbligatoria del documento; quello che conta per chi lo riceve è che i dati siano tracciabili alla fonte e che il perimetro sia dichiarato.",
      },
    ],
    percorsi: [
      "bilancio-sostenibilita-vsme-base",
      "bilancio-sostenibilita-vsme-avanzato",
    ],
    correlate: [
      "perche-il-committente-chiede-dati-ai-fornitori",
      "perche-la-banca-chiede-dati-di-sostenibilita",
    ],
  },
  {
    slug: "carbon-footprint-di-organizzazione-cosa-si-misura",
    chi: "Emissioni",
    domanda: "Che cosa si misura davvero in una carbon footprint di organizzazione?",
    risposta:
      "Una carbon footprint di organizzazione misura i gas serra emessi da tutto ciò che l'impresa controlla e da ciò che mette in moto per funzionare, riferiti a un anno e a un perimetro dichiarato. Nel linguaggio del GHG Protocol si dividono in tre ambiti: Scope 1 per le emissioni dirette (caldaie, forni, flotta aziendale), Scope 2 per l'energia acquistata, Scope 3 per tutto il resto della catena del valore. La norma UNI EN ISO 14064-1:2019 organizza le stesse emissioni in modo diverso — sei categorie invece di tre ambiti — e le due impostazioni convivono nello stesso inventario.",
    descrizione:
      "Scope 1, 2 e 3, le sei categorie della UNI EN ISO 14064-1:2019 e la doppia lettura dello Scope 2: che cosa entra nel conto delle emissioni d'impresa.",
    comporta:
      "Prima di chiedere un preventivo conviene sapere quale perimetro copre: un inventario dei soli Scope 1 e 2 e uno che comprende lo Scope 3 sono due lavori diversi, e rispondono a richieste diverse.",
    fonte:
      "UNI EN ISO 14064-1:2019, in vigore dall'11 aprile 2019 (specifica per la quantificazione e la rendicontazione delle emissioni di gas a effetto serra a livello di organizzazione)",
    url: "https://store.uni.com/uni-en-iso-14064-1-2019",
    sezioni: [
      {
        titolo: "Scope 1, 2 e 3: che cosa contiene ciascuno",
        paragrafi: [
          "Lo Scope 1 raccoglie le emissioni prodotte da fonti che l'impresa possiede o controlla: la caldaia dello stabilimento, i forni, i mezzi aziendali, le eventuali fughe di gas refrigeranti.",
          "Lo Scope 2 raccoglie le emissioni legate all'energia acquistata e consumata — elettricità in primo luogo — che avvengono fisicamente altrove, nella centrale che l'ha prodotta.",
          "Lo Scope 3 raccoglie tutto il resto: acquisti di beni e servizi, trasporti a monte e a valle, rifiuti, viaggi di lavoro, uso e fine vita dei prodotti venduti. È la parte più grande per quasi tutte le imprese manifatturiere, ed è anche la più difficile da calcolare, perché i dati non sono in casa.",
        ],
      },
      {
        titolo: "Perché lo Scope 2 si legge due volte",
        paragrafi: [
          "Il GHG Protocol chiede di rendicontare lo Scope 2 con due metodi in parallelo. Il metodo location-based usa il fattore di emissione medio della rete elettrica del territorio: dice quanto inquina l'energia consumata in quel luogo. Il metodo market-based tiene conto dei contratti di fornitura, comprese le garanzie d'origine: dice quanto inquina l'energia che l'impresa ha effettivamente comprato.",
          "I due numeri possono divergere parecchio, e non è un errore: rispondono a due domande diverse. Un inventario che ne riporta uno solo è incompleto rispetto allo standard.",
        ],
      },
      {
        titolo: "Le sei categorie della ISO 14064-1",
        paragrafi: [
          "La UNI EN ISO 14064-1:2019 non usa la parola «scope»: organizza le emissioni in sei categorie — emissioni dirette; indirette da energia importata; indirette dal trasporto; indirette dai prodotti utilizzati dall'organizzazione; indirette associate all'uso dei prodotti dell'organizzazione; indirette da altre fonti.",
          "Le prime due corrispondono in sostanza a Scope 1 e Scope 2; le altre quattro ridistribuiscono quello che il GHG Protocol chiama Scope 3. Un report costruito bene dichiara quale impostazione usa e, quando serve, la riconcilia con l'altra.",
        ],
      },
      {
        titolo: "Che cosa rende un inventario verificabile",
        paragrafi: [
          "Tre elementi, e sono quelli che chi legge il documento controlla per primi. Il perimetro: quali società, quali sedi, quale anno. I fattori di emissione: quali, di quale fonte, di quale anno. La qualità del dato: quali valori sono misurati, quali ricavati da documenti, quali stimati — e dove è una stima, dichiarata come tale.",
          "Un inventario di parte prima è redatto dall'organizzazione stessa. La verifica di terza parte è un percorso ulteriore, disciplinato dalla ISO 14064-3, che si affida a un organismo indipendente: sono due cose distinte e conviene non confonderle quando qualcuno chiede «un inventario certificato».",
        ],
      },
    ],
    altreFonti: [
      {
        testo: "GHG Protocol — Corporate Accounting and Reporting Standard e Scope 2 Guidance",
        url: "https://ghgprotocol.org/corporate-standard",
      },
    ],
    domande: [
      {
        domanda: "Lo Scope 3 è obbligatorio in una carbon footprint di organizzazione?",
        risposta:
          "Dipende dallo standard e dal perimetro dichiarato: la UNI EN ISO 14064-1:2019 chiede all'organizzazione di dichiarare e motivare quali categorie di emissioni indirette include ed esclude, mentre nel GHG Protocol la rendicontazione dello Scope 3 è separata da quella degli Scope 1 e 2. Nella pratica un inventario dei soli Scope 1 e 2 risponde alla maggior parte delle richieste bancarie, mentre i capofiliera che rendicontano il proprio Scope 3 chiedono ai fornitori dati più estesi.",
      },
      {
        domanda: "Che differenza c'è tra carbon footprint di organizzazione e di prodotto?",
        risposta:
          "La carbon footprint di organizzazione misura le emissioni di un'impresa in un anno e segue la UNI EN ISO 14064-1:2019; la carbon footprint di prodotto misura le emissioni di una singola unità di prodotto lungo il suo ciclo di vita e segue la ISO 14067. Sono calcoli diversi, con perimetri e unità di misura diversi, e un documento non sostituisce l'altro.",
      },
    ],
    percorsi: [
      "carbon-footprint-scope-1-2",
      "carbon-footprint-scope-1-2-3",
    ],
    correlate: [
      "questionari-esg-fornitori-cosa-serve-per-rispondere",
      "perche-la-banca-chiede-dati-di-sostenibilita",
    ],
  },
  {
    slug: "manuale-iso-9001-cosa-contiene-chi-lo-prepara",
    chi: "Sistemi di gestione",
    domanda: "Che cosa contiene il manuale ISO 9001 e chi lo può preparare?",
    risposta:
      "La ISO 9001 non richiede più un manuale della qualità: l'edizione del 2015 ha sostituito l'obbligo di un documento unico con quello di mantenere «informazioni documentate», lasciando all'organizzazione la forma. Restano obbligatori alcuni contenuti precisi — campo di applicazione del sistema, politica e obiettivi per la qualità, i processi e le registrazioni che dimostrano che funzionano — che molte imprese continuano a raccogliere in un manuale perché è comodo presentarlo all'audit. A prepararlo può essere chiunque: l'impresa da sé, un consulente o un fornitore di servizi. L'unico soggetto che non può farlo è l'organismo che poi certifica.",
    descrizione:
      "Dal 2015 la ISO 9001 non impone un manuale della qualità: quali informazioni documentate servono, chi può prepararle e chi non può.",
    comporta:
      "Un'impresa che si sente dire «serve il manuale» sta ricevendo una consuetudine, non un requisito: quello che l'audit verifica sono i processi e le registrazioni, in qualunque forma siano organizzati.",
    fonte:
      "UNI EN ISO 9001:2015+A1:2024, in vigore dal 16 ottobre 2024 (la UNI EN ISO 9001:2015 senza l'aggiornamento è ritirata)",
    url: "https://store.uni.com/uni-en-iso-9001-2015-a1-2024",
    sezioni: [
      {
        titolo: "Che cosa la norma chiede davvero",
        paragrafi: [
          "Il punto 7.5 della ISO 9001 parla di informazioni documentate e distingue due famiglie: quelle che la norma richiede esplicitamente e quelle che l'organizzazione stessa ritiene necessarie perché il sistema funzioni. La seconda famiglia dipende dall'impresa, e per questo due sistemi conformi possono avere corredi documentali molto diversi.",
          "Fra le informazioni esplicitamente richieste ci sono il campo di applicazione del sistema di gestione, la politica per la qualità, gli obiettivi per la qualità e le registrazioni che dimostrano i risultati: esiti degli audit interni, riesami della direzione, gestione delle non conformità, monitoraggi.",
        ],
      },
      {
        titolo: "L'aggiornamento del 2024 sul clima",
        paragrafi: [
          "Da ottobre 2024 la designazione in vigore in Italia è UNI EN ISO 9001:2015+A1:2024. L'aggiornamento A1 è breve e riguarda due punti: nell'analisi del contesto l'organizzazione deve stabilire se il cambiamento climatico sia un tema rilevante per la propria attività, e nell'analisi delle parti interessate deve considerare se lo sia per loro. È lo stesso aggiornamento applicato nel 2024 a tutte le norme sui sistemi di gestione.",
        ],
      },
      {
        titolo: "Chi può prepararlo, e chi non può",
        paragrafi: [
          "La norma non riserva la preparazione della documentazione a una figura abilitata: non esiste un albo di redattori di sistemi di gestione. Può farlo il personale interno, un consulente esterno o un fornitore di servizi documentali.",
          "Esiste però un divieto preciso dall'altra parte: la norma che disciplina gli organismi di certificazione, la ISO/IEC 17021-1:2015, stabilisce al punto 5.2.5 che l'organismo — e qualunque entità sotto il suo controllo — non può offrire né fornire consulenza sui sistemi di gestione. Chi certifica non prepara, e chi prepara non certifica: è la ragione per cui l'audit ha un valore per chi lo legge.",
        ],
      },
      {
        titolo: "Una nuova edizione è in arrivo",
        paragrafi: [
          "La ISO 9001 è in revisione: quando la nuova edizione sarà pubblicata, gli organismi di certificazione applicheranno un periodo di transizione durante il quale i certificati emessi sull'edizione precedente restano validi fino all'adeguamento. Le imprese che stanno preparando il sistema adesso non hanno motivo di aspettare: l'impianto documentale resta in gran parte lo stesso, e la struttura di alto livello che le norme sui sistemi di gestione condividono non cambia.",
        ],
      },
    ],
    altreFonti: [
      {
        testo: "UNI EN ISO 45001:2023+A1:2024 e UNI EN ISO 14001:2026 — le altre norme sui sistemi di gestione, con le designazioni in vigore",
        url: "https://store.uni.com/uni-en-iso-14001-2026",
      },
    ],
    domande: [
      {
        domanda: "Il manuale della qualità è obbligatorio per la ISO 9001?",
        risposta:
          "No: l'obbligo del manuale della qualità è stato rimosso con l'edizione del 2015 della ISO 9001, che al suo posto richiede informazioni documentate senza imporne la forma. Molte imprese continuano a produrre un manuale perché raccoglie in un documento solo ciò che serve mostrare all'audit, ma è una scelta pratica e non un requisito della norma.",
      },
      {
        domanda: "L'organismo che certifica può anche aiutare a preparare il sistema?",
        risposta:
          "No: la ISO/IEC 17021-1:2015 stabilisce al punto 5.2.5 che l'organismo di certificazione, e qualunque entità sotto il suo controllo, non può offrire né fornire consulenza sui sistemi di gestione. La preparazione e la certificazione devono restare in mani diverse, altrimenti l'organismo verificherebbe il proprio lavoro.",
      },
    ],
    percorsi: [
      "manuale-sistema-gestione-iso-9001",
      "manuale-sistema-gestione-iso-14001",
      "manuale-sistema-gestione-iso-45001",
    ],
    correlate: ["certificazione-parita-di-genere-punteggio-nei-bandi"],
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
