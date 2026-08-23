/**
 * PERCHÉ LE RICHIESTE STANNO AUMENTANDO — quattro fatti, con la fonte.
 *
 * ═══ PERCHÉ QUESTO FILE ESISTE ═══
 *
 * Qui prima c'era uno schema: la banca, il capofiliera, la stazione
 * appaltante, il cliente, l'organismo, e sotto le tre famiglie come
 * risposte. Era vero e non serviva a niente — diceva in forma astratta
 * quello che il selettore per situazione, due schermate più giù, fa già
 * in concreto e meglio. Una premessa, non un'informazione.
 *
 * Al suo posto stanno quattro fatti verificabili sul perché quelle
 * richieste arrivano sempre più spesso. Chi legge non deve credere a
 * noi: deve poter aprire la norma e controllare.
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

export type Richiesta = {
  /** Chi chiede: il soggetto, non la categoria. */
  chi: string;
  /** Il fatto, con la norma e l'anno dentro la frase. */
  fatto: string;
  /** Che cosa comporta per l'impresa: una riga, nessun aggettivo. */
  comporta: string;
  /** La fonte per esteso, come si cita in un documento. */
  fonte: string;
  /** Dove si controlla. Pagina ufficiale, mai un riassunto altrui. */
  url: string;
  /** I percorsi pertinenti: slug del catalogo. */
  percorsi: string[];
};

export const RICHIESTE: Richiesta[] = [
  {
    chi: "Le banche",
    fatto:
      "Le linee guida europee sulla gestione dei rischi ESG chiedono alle banche di raccogliere dati ESG a livello di singolo cliente per misurare il rischio delle proprie controparti, e indicano per le PMI non quotate lo standard volontario di rendicontazione come riferimento. Si applicano dall'11 gennaio 2026, e dall'11 gennaio 2027 per gli enti piccoli e non complessi.",
    comporta:
      "L'impresa che ha già i dati nel formato che la banca si aspetta risponde una volta sola, invece di rincorrere una richiesta per volta.",
    fonte:
      "Autorità bancaria europea, Guidelines on the management of ESG risks, EBA/GL/2025/01 del 9 gennaio 2025, §24 e §25",
    url: "https://www.eba.europa.eu/publications-and-media/press-releases/eba-publishes-its-final-guidelines-management-esg-risks",
    percorsi: ["bilancio-sostenibilita-vsme-base", "carbon-footprint-scope-1-2"],
  },
  {
    chi: "I committenti",
    fatto:
      "Le imprese soggette alla rendicontazione di sostenibilità chiedono dati ai fornitori — la Commissione europea lo chiama effetto a cascata. Dal 2026 quelle richieste hanno un tetto di legge: a un'impresa della catena del valore con non più di 1.000 dipendenti non si possono chiedere più informazioni di quelle previste dallo standard volontario di rendicontazione.",
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
    chi: "Le stazioni appaltanti",
    fatto:
      "Nei bandi pubblici le stazioni appaltanti devono attribuire il maggior punteggio alle imprese che adottano politiche per la parità di genere, e il possesso va dimostrato con la certificazione rilasciata da un organismo accreditato: dal 2023 l'autocertificazione non è più ammessa.",
    comporta:
      "Senza certificazione quel punteggio non si prende, per quanto bene sia scritta l'offerta.",
    fonte:
      "D.Lgs. 36/2023, art. 108 comma 7, che richiama l'art. 46-bis del D.Lgs. 198/2006; modificato dal DL 29 maggio 2023 n. 57",
    url: "https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:decreto.legislativo:2023-03-31;36",
    percorsi: ["parita-di-genere-pdr-125"],
  },
  {
    chi: "Le piattaforme di rating",
    fatto:
      "Nel 2025 oltre 270 grandi acquirenti hanno chiesto a circa 45.000 fornitori nel mondo di rendicontare dati ambientali attraverso il programma Supply Chain di CDP.",
    comporta:
      "Un questionario raccoglie dati, non li produce: senza un inventario delle emissioni già calcolato le caselle restano vuote.",
    fonte: "CDP, Keeping Pace: Disclosure Data Factsheet 2025",
    url: "https://www.cdp.net/en/insights/keeping-pace-disclosure-data-factsheet-2025",
    percorsi: [
      "carbon-footprint-scope-1-2",
      "carbon-footprint-scope-1-2-3",
    ],
  },
];
