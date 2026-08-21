/**
 * SICUREZZA E RISERVATEZZA — i contenuti, in un posto solo.
 *
 * Stanno qui e non nella pagina perché la stessa sostanza compare anche
 * in Chi siamo e nello step dei consensi del funnel: scritta tre volte,
 * dopo due modifiche direbbe tre cose diverse — e su questa materia una
 * contraddizione non è un refuso, è una dichiarazione falsa.
 *
 * ═══ REGOLA VINCOLANTE (anche in CLAUDE.md) ═══
 * Si dichiarano le GARANZIE, mai l'IMPLEMENTAZIONE.
 *
 * AMMESSO: natura delle protezioni, dove vivono i dati, chi accede e con
 * quale titolo, esistenza e oggetto dei test, revocabilità,
 * tracciabilità.
 *
 * VIETATO: struttura del database e nomi di tabelle, testo o logica delle
 * politiche, modelli AI usati e relative istruzioni, schemi di
 * estrazione, soglie e regole di riconoscimento, mappatura dei dati sulle
 * sezioni, costi per pratica, versioni, percorsi e nomi di file.
 *
 * CRITERIO: se un'informazione permette a un concorrente di replicare il
 * metodo o a un attaccante di orientarsi, non va in pagina.
 *
 * ═══ SECONDA REGOLA ═══
 * Nessun claim non dimostrabile. Niente «sicurezza di livello bancario»,
 * nessun sigillo o certificazione che non possediamo. Quello che è in
 * corso si dice che è in corso.
 */

/** La data delle verifiche presso i fornitori. Si aggiorna rifacendole. */
export const aggiornatoIl = "21 agosto 2026";

export type Garanzia = {
  titolo: string;
  icona: "lock" | "database" | "key" | "trash";
  /** Livello 1: frasi brevi, linguaggio comune. */
  punti: string[];
  /** Livello 2: per chi sa leggerlo. Garanzie, non implementazione. */
  tecnico: string[];
};

export const GARANZIE: Garanzia[] = [
  {
    titolo: "Dove vivono i tuoi dati",
    icona: "database",
    punti: [
      "Il database e l'archivio dei documenti sono ospitati nell'Unione Europea, in Irlanda.",
      "I dati viaggiano cifrati e restano cifrati anche quando sono fermi sui dischi.",
      "Una sola eccezione, e la diciamo: le email transazionali passano da un fornitore che elabora negli Stati Uniti, con le garanzie contrattuali previste dal GDPR. Nelle email non mettiamo mai i tuoi documenti né i dati della tua impresa: solo il minimo per avvisarti e il link al portale.",
    ],
    tecnico: [
      "Database, autenticazione e archivio nella regione UE (Irlanda) del fornitore infrastrutturale.",
      "Cifratura in transito con TLS e cifratura a riposo dichiarata dal fornitore (AES-256).",
      "Il fornitore di posta elabora negli Stati Uniti sulla base di clausole contrattuali standard e del quadro UE-USA per la protezione dei dati.",
      "Posta autenticata: SPF sul dominio di ritorno, firma DKIM allineata al dominio, DMARC pubblicato.",
    ],
  },
  {
    titolo: "Ogni impresa vede solo i propri dati",
    icona: "lock",
    punti: [
      "L'isolamento fra imprese non è una regola scritta nel programma: è imposto dal database stesso, che rifiuta la richiesta prima ancora che il programma possa sbagliare.",
      "Un consulente partner vede un'impresa solo finché quell'impresa gli tiene attivo il mandato. Alla revoca, l'accesso finisce subito.",
      "Chi amministra la piattaforma vede i contatti e le richieste commerciali, non gli archivi documentali dei clienti.",
    ],
    tecnico: [
      "Isolamento imposto a livello di riga dal database, non dal codice applicativo: se il programma dimenticasse un filtro, la riga non verrebbe comunque restituita.",
      "Politiche anche a livello di colonna sui campi critici: l'utente può modificare i propri, non quelli che attestano provenienza e verifiche.",
      "Archivio in bucket privato, segmentato per organizzazione; nessun file è raggiungibile per indirizzo pubblico.",
      "La chiave di servizio, che scavalca le politiche, resta confinata al lato server e non è mai esposta al browser.",
    ],
  },
  {
    titolo: "Accessi, mandati e tracciabilità",
    icona: "key",
    punti: [
      "L'indirizzo email va confermato prima di entrare: è ciò che lega i consensi e il mandato a una casella che controlli davvero.",
      "Le banche dati ufficiali le interroghiamo solo per comporre i tuoi documenti, e solo con il mandato che ci dai all'attivazione. È revocabile dalle Impostazioni, con effetto immediato: da quel momento non interroghiamo più nulla e la piattaforma continua a funzionare con l'inserimento manuale.",
      "Ogni dato porta con sé la sua provenienza — inserito da te, recuperato da noi e da quale fonte — e i dati recuperati restano «da confermare» finché non li validi.",
    ],
    tecnico: [
      "Sessioni con token a rotazione; requisiti minimi di robustezza sulla password imposti sul server, non solo nel modulo.",
      "Il mandato è un consenso registrato con data e ora; la revoca ha effetto immediato sulle interrogazioni successive.",
      "Registro tecnico delle elaborazioni: resta traccia di quando una fonte è stata interrogata e con quale esito.",
      "Nessun segreto è mai stato versionato: verificato sull'intera storia del repository, non solo sull'ultima versione.",
    ],
  },
  {
    titolo: "Cosa non facciamo",
    icona: "trash",
    punti: [
      "Non vendiamo i tuoi dati e non li cediamo a nessuno per fini commerciali.",
      "Non facciamo pubblicità con i tuoi dati e non abbiamo strumenti di profilazione sul sito.",
      "Non usiamo i dati dei clienti come esempi pubblici: le imprese che vedi nelle nostre pagine sono inventate, e lo dichiariamo.",
      "I tuoi documenti non vengono usati per addestrare modelli di intelligenza artificiale.",
    ],
    tecnico: [
      "Il fornitore del modello dichiara di non usare, per impostazione predefinita, gli input e gli output dei prodotti commerciali (API incluse) per addestrare i propri modelli. L'unica eccezione prevista sono le segnalazioni esplicite di feedback: noi non ne inviamo.",
      "Nessuno strumento di analisi con cookie di profilazione: la misurazione è di prima parte e non conserva indirizzi IP in chiaro.",
    ],
  },
];

export type Fornitore = {
  nome: string;
  ruolo: string;
  risultato: string;
  fonte: string;
};

/**
 * L'esito delle verifiche svolte presso i fornitori. Ogni riga riporta
 * ciò che risulta dalle loro condizioni alla data dichiarata — non ciò
 * che ci auguriamo, e non ciò che «di solito fanno tutti».
 */
export const VERIFICA_FORNITORI: Fornitore[] = [
  {
    nome: "Supabase",
    ruolo: "Database, autenticazione e archivio documenti",
    risultato:
      "Il nostro progetto è nella regione europea (Irlanda). Il fornitore dichiara cifratura a riposo AES-256 e in transito TLS, è certificato ISO 27001 e SOC 2 Type 2, e mette a disposizione un accordo sul trattamento dei dati conforme al GDPR.",
    fonte: "https://supabase.com/security",
  },
  {
    nome: "Anthropic",
    ruolo: "Modello di intelligenza artificiale per la lettura dei documenti",
    risultato:
      "Dichiara che, per impostazione predefinita, gli input e gli output dei prodotti commerciali — API compresa — non vengono usati per addestrare i modelli. L'eccezione prevista riguarda le segnalazioni esplicite di feedback, che noi non inviamo.",
    fonte:
      "https://privacy.claude.com/en/articles/7996868-is-my-data-used-for-model-training",
  },
  {
    nome: "Vercel",
    ruolo: "Esecuzione dell'applicazione e distribuzione delle pagine",
    risultato:
      "Le funzioni possono essere eseguite in una regione europea e noi le abbiamo fissate a Dublino, accanto al database. La rete di distribuzione è mondiale per natura: serve le pagine dal punto più vicino a chi le chiede, e non contiene i tuoi documenti.",
    fonte: "https://vercel.com/docs/regions",
  },
  {
    nome: "Resend",
    ruolo: "Invio delle email transazionali",
    risultato:
      "Elabora negli Stati Uniti: lo dichiara nel proprio accordo sul trattamento dei dati e si basa su clausole contrattuali standard e sul quadro UE-USA. È il motivo per cui nelle email non mettiamo mai documenti né dati d'impresa, ma solo l'avviso e il link al portale.",
    fonte: "https://resend.com/legal/dpa",
  },
];

export type DomandaDiretta = { domanda: string; risposta: string };

export const DOMANDE_DIRETTE: DomandaDiretta[] = [
  {
    domanda: "I miei documenti servono ad addestrare modelli?",
    risposta:
      "No. Il fornitore del modello dichiara di non usare gli input e gli output dei prodotti commerciali per l'addestramento, salvo segnalazioni esplicite di feedback che noi non inviamo.",
  },
  {
    domanda: "Dove sono fisicamente i miei dati?",
    risposta:
      "Database e archivio documenti nell'Unione Europea, in Irlanda; l'applicazione gira a Dublino. Le sole email transazionali passano da un fornitore statunitense, con le garanzie contrattuali previste, e non contengono i tuoi documenti.",
  },
  {
    domanda: "Chi può vederli internamente?",
    risposta:
      "Il team tecnico che valida i documenti, per i percorsi che stai facendo. Chi amministra la piattaforma vede contatti e richieste commerciali, non i tuoi archivi: è una delle cose che i test verificano a ogni rilascio.",
  },
  {
    domanda: "Cosa succede se revoco il mandato alle banche dati?",
    risposta:
      "Smettiamo di interrogarle, con effetto immediato. Quello che era già stato recuperato resta nella tua scheda — puoi cancellarlo dato per dato — e la piattaforma continua a funzionare con l'inserimento manuale.",
  },
  {
    domanda: "Cosa succede ai miei dati se smetto di essere cliente?",
    risposta:
      "Il lavoro fatto resta tuo e resta disponibile: puoi riattivare un percorso quando vuoi. Se chiedi la cancellazione la eseguiamo, tenendo solo ciò che la legge ci obbliga a conservare (per esempio i documenti fiscali).",
  },
  {
    domanda: "Potete esportarmeli?",
    risposta:
      "I documenti prodotti si scaricano dal portale in qualunque momento. L'esportazione completa della scheda impresa in un formato aperto è in lavorazione: oggi la facciamo su richiesta, scrivendoci.",
  },
];
