/**
 * IL REGISTRO DELLE NORME — fonte unica.
 *
 * Stava dentro `scripts/controllo-norme.mjs`, che lo usava per impedire
 * che una designazione superata finisse in pagina. Da lì non era
 * leggibile dall'applicazione, e serve: il controllo gratuito
 * dell'edizione (`ControlloEdizione`) risponde a chi ha un manuale in
 * azienda usando gli stessi dati con cui il controllo automatico ci
 * sorveglia. Due copie sarebbero due verità diverse alla prima norma
 * ritirata — che è esattamente quello che è successo quattro volte in
 * due giorni prima che il registro esistesse.
 *
 * ═══ REGOLA (CLAUDE.md) ═══
 * Ogni designazione si verifica su **store.uni.com** prima di essere
 * pubblicata, e si ricontrolla periodicamente:
 *   node --import ./scripts/risolutore-ts.mjs scripts/controllo-norme.mjs
 *   ... --online   per rileggere lo stato dal catalogo UNI
 *
 * Verificato il 24 agosto 2026.
 */

export const NORME_VERIFICATE_IL = {
  iso: "2026-08-24",
  esteso: "24 agosto 2026",
} as const;

export type VoceRegistro = {
  codice: string;
  /** La pagina del catalogo UNI: è lì che si controlla. */
  url?: string;
  stato: "in vigore" | "ritirata";
  /** Data di entrata in vigore, per esteso. */
  dal?: string;
  /** Data di ritiro, per esteso: serve a dire «ritirata il …». */
  ritirataIl?: string;
  sostituita?: string;
  nota?: string;
  /**
   * Il titolo ufficiale, come lo riporta il catalogo dell'ente. Facoltativo:
   * si scrive solo dopo averlo letto sulla scheda ufficiale, perché finisce
   * nella pagina dei riferimenti dei documenti consegnati.
   */
  titolo?: string;
};

export const REGISTRO_NORME: VoceRegistro[] = [
  {
    codice: "UNI EN ISO 9001:2015+A1:2024",
    url: "https://store.uni.com/uni-en-iso-9001-2015-a1-2024",
    stato: "in vigore",
    dal: "16 ottobre 2024",
  },
  {
    codice: "UNI EN ISO 14001:2026",
    url: "https://store.uni.com/uni-en-iso-14001-2026",
    stato: "in vigore",
    dal: "15 aprile 2026",
  },
  {
    codice: "UNI EN ISO 45001:2023+A1:2024",
    url: "https://store.uni.com/uni-en-iso-45001-2023-a1-2024",
    stato: "in vigore",
  },
  {
    codice: "UNI CEI EN ISO/IEC 27001:2024+A1:2024",
    url: "https://store.uni.com/uni-cei-en-iso-iec-27001-2024-a1-2024",
    stato: "in vigore",
    dal: "16 ottobre 2024",
  },
  {
    codice: "UNI EN ISO 14064-1:2019",
    url: "https://store.uni.com/uni-en-iso-14064-1-2019",
    stato: "in vigore",
    dal: "11 aprile 2019",
    // Letto sulla scheda store.uni.com il 15 settembre 2026, con lo stato.
    titolo:
      "Gas ad effetto serra - Parte 1: Specifiche e guida, al livello dell'organizzazione, per la quantificazione e la rendicontazione delle emissioni di gas ad effetto serra e della loro rimozione",
  },
  {
    codice: "UNI/PdR 125:2022",
    url: "https://store.uni.com/uni-pdr-125-2022",
    stato: "in vigore",
    dal: "16 marzo 2022",
  },
  {
    codice: "UNI/TS 11820:2024",
    url: "https://store.uni.com/uni-ts-11820-2024",
    stato: "in vigore",
    dal: "14 novembre 2024",
  },
  {
    codice: "UNI ISO 45003:2021",
    url: "https://store.uni.com/uni-iso-45003-2021",
    stato: "in vigore",
    dal: "18 novembre 2021",
  },
  {
    codice: "UNI ISO 30415:2021",
    url: "https://store.uni.com/uni-iso-30415-2021",
    stato: "in vigore",
    dal: "29 luglio 2021",
  },
  {
    codice: "UNI CEI EN ISO/IEC 17021-1:2015",
    url: "https://store.uni.com/uni-cei-en-iso-iec-17021-1-2015",
    stato: "in vigore",
    dal: "6 agosto 2015",
  },
  {
    codice: "ISO/IEC 17021-1:2015",
    url: "https://store.uni.com/uni-cei-en-iso-iec-17021-1-2015",
    stato: "in vigore",
  },
  {
    codice: "SA8000:2014",
    stato: "in vigore",
    nota: "Schema privato di Social Accountability International, non una norma UNI: si verifica su sa-intl.org.",
  },
  {
    // Non è una norma UNI ma un REGOLAMENTO EUROPEO, e si verifica su
    // EUR-Lex. Sta nel registro lo stesso perché la designazione finisce
    // nei documenti dei clienti, ed è lì che una citazione sbagliata fa
    // danno. Gli allegati sono stati rivisti due volte, e citarlo senza
    // le modifiche significa citare un testo che non è più quello.
    codice: "Regolamento (CE) n. 1221/2009",
    url: "https://eur-lex.europa.eu/eli/reg/2009/1221/oj",
    stato: "in vigore",
    dal: "11 gennaio 2010",
    nota: "EMAS. Allegati I, II e III modificati dal Regolamento (UE) 2017/1505 del 28 agosto 2017 (allineamento alla ISO 14001:2015); allegato IV — la Dichiarazione Ambientale — sostituito dal Regolamento (UE) 2018/2026 del 19 dicembre 2018, in vigore dal 9 gennaio 2019. Verificato su EUR-Lex l'11 settembre 2026: nessun regolamento di modifica successivo.",
  },
  {
    // Non è una norma UNI: è lo standard di rendicontazione di WRI e WBCSD,
    // e si verifica su ghgprotocol.org. Sta nel registro perché finisce
    // negli inventari dei clienti, e il controllo di consegna pretende che
    // ogni riferimento citato in un documento sia registrato.
    codice: "GHG Protocol Corporate Standard — edizione rivista (2004)",
    url: "https://ghgprotocol.org/sites/default/files/standards/ghg-protocol-revised.pdf",
    stato: "in vigore",
    dal: "marzo 2004",
    nota: "The Greenhouse Gas Protocol — A Corporate Accounting and Reporting Standard, Revised Edition (WRI/WBCSD). Il 29 luglio 2026 GHG Protocol e ISO hanno annunciato uno standard unico che riunirà Scope 1, 2 e 3 e la ISO 14064-1, con pubblicazione prevista nel 2028: fino ad allora resta questa l'edizione di riferimento. Verificato su ghgprotocol.org il 15 settembre 2026.",
  },
  {
    codice: "GHG Protocol Scope 2 Guidance (2015)",
    url: "https://ghgprotocol.org/sites/default/files/2023-03/Scope%202%20Guidance.pdf",
    stato: "in vigore",
    dal: "2015",
    nota: "GHG Protocol Scope 2 Guidance — An amendment to the GHG Protocol Corporate Standard (WRI). La revisione è stata in consultazione pubblica dal 20 ottobre 2025 al 31 gennaio 2026 e non risulta pubblicata. Verificato su ghgprotocol.org il 15 settembre 2026.",
  },
  /* ── Ritirate: citabili SOLO per dire che sono ritirate ───────────── */
  {
    codice: "UNI EN ISO 9001:2015",
    url: "https://store.uni.com/uni-en-iso-9001-2015",
    stato: "ritirata",
    ritirataIl: "16 ottobre 2024",
    sostituita: "UNI EN ISO 9001:2015+A1:2024",
  },
  {
    codice: "UNI EN ISO 14001:2015",
    stato: "ritirata",
    sostituita: "UNI EN ISO 14001:2026",
  },
  {
    codice: "UNI EN ISO 14001:2015+A1:2024",
    url: "https://store.uni.com/uni-en-iso-14001-2015-a1-2024",
    stato: "ritirata",
    ritirataIl: "15 aprile 2026",
    sostituita: "UNI EN ISO 14001:2026",
  },
  {
    codice: "UNI ISO 45001:2018",
    url: "https://store.uni.com/uni-iso-45001-2018",
    stato: "ritirata",
    ritirataIl: "28 settembre 2023",
    sostituita: "UNI EN ISO 45001:2023+A1:2024",
  },
  {
    // La designazione che chiunque scriverebbe a memoria, ed è ritirata
    // dallo stesso giorno in cui è entrato in vigore l'emendamento sul
    // clima: nove mesi di vita. È esattamente il caso per cui esiste
    // questo registro.
    codice: "UNI CEI EN ISO/IEC 27001:2024",
    url: "https://store.uni.com/uni-cei-en-iso-iec-27001-2024",
    stato: "ritirata",
    dal: "25 gennaio 2024",
    ritirataIl: "16 ottobre 2024",
    sostituita: "UNI CEI EN ISO/IEC 27001:2024+A1:2024",
  },
  {
    codice: "UNI/TS 11820:2022",
    url: "https://store.uni.com/uni-ts-11820-2022",
    stato: "ritirata",
    ritirataIl: "14 novembre 2024",
    sostituita: "UNI/TS 11820:2024",
  },
];

/* ------------------------------------------------------------------ */
/* Le famiglie, per il controllo dell'edizione                         */
/* ------------------------------------------------------------------ */

/**
 * Le norme che un'impresa può avere «in casa» sotto forma di manuale,
 * con l'edizione in vigore e quella che ha sostituito.
 *
 * `vigenteDalAnno` è l'anno in cui l'edizione attuale è entrata in
 * vigore: è il perno del confronto. Un manuale più vecchio di
 * quell'anno cita per forza l'edizione precedente; uno dello stesso
 * anno può citare l'una o l'altra, e lo strumento lo dice invece di
 * indovinare.
 */
export type FamigliaNorma = {
  id: string;
  /** Come la chiama chi ce l'ha in azienda. */
  etichetta: string;
  ambito: string;
  vigente: string;
  vigenteDal: string;
  vigenteDalAnno: number;
  /**
   * L'edizione precedente, con la finestra in cui è stata in vigore.
   *
   * `dalAnno` non è un dettaglio: senza, un manuale del 2019 si sentiva
   * dire che cita «UNI EN ISO 14001:2015+A1:2024», cioè una designazione
   * che nel 2019 non esisteva. La designazione precedente si nomina solo
   * se il manuale cade nella finestra in cui era quella in vigore; fuori
   * si dice la cosa vera e generica — è anteriore, quindi cita
   * un'edizione precedente — invece di inventare quale.
   */
  precedente?: { codice: string; dalAnno: number; ritirataIl: string };
  url: string;
  /** Il percorso del catalogo che produce o aggiorna quel manuale. */
  percorso?: string;
};

export const FAMIGLIE_NORMA: FamigliaNorma[] = [
  {
    id: "iso-9001",
    etichetta: "ISO 9001",
    ambito: "qualità",
    vigente: "UNI EN ISO 9001:2015+A1:2024",
    vigenteDal: "16 ottobre 2024",
    vigenteDalAnno: 2024,
    precedente: {
      codice: "UNI EN ISO 9001:2015",
      dalAnno: 2015,
      ritirataIl: "16 ottobre 2024",
    },
    url: "https://store.uni.com/uni-en-iso-9001-2015-a1-2024",
    percorso: "manuale-sistema-gestione-iso-9001",
  },
  {
    id: "iso-14001",
    etichetta: "ISO 14001",
    ambito: "ambiente",
    vigente: "UNI EN ISO 14001:2026",
    vigenteDal: "15 aprile 2026",
    vigenteDalAnno: 2026,
    precedente: {
      codice: "UNI EN ISO 14001:2015+A1:2024",
      dalAnno: 2024,
      ritirataIl: "15 aprile 2026",
    },
    url: "https://store.uni.com/uni-en-iso-14001-2026",
    percorso: "manuale-sistema-gestione-iso-14001",
  },
  {
    id: "iso-45001",
    etichetta: "ISO 45001",
    ambito: "salute e sicurezza sul lavoro",
    vigente: "UNI EN ISO 45001:2023+A1:2024",
    vigenteDal: "2024",
    vigenteDalAnno: 2024,
    precedente: {
      codice: "UNI ISO 45001:2018",
      dalAnno: 2018,
      ritirataIl: "28 settembre 2023",
    },
    url: "https://store.uni.com/uni-en-iso-45001-2023-a1-2024",
    percorso: "manuale-sistema-gestione-iso-45001",
  },
  {
    id: "iso-27001",
    etichetta: "ISO/IEC 27001",
    ambito: "sicurezza delle informazioni",
    vigente: "UNI CEI EN ISO/IEC 27001:2024+A1:2024",
    vigenteDal: "16 ottobre 2024",
    vigenteDalAnno: 2024,
    precedente: {
      codice: "UNI CEI EN ISO/IEC 27001:2024",
      dalAnno: 2024,
      ritirataIl: "16 ottobre 2024",
    },
    url: "https://store.uni.com/uni-cei-en-iso-iec-27001-2024-a1-2024",
    percorso: "manuale-sistema-gestione-iso-27001",
  },
  {
    id: "pdr-125",
    etichetta: "UNI/PdR 125",
    ambito: "parità di genere",
    vigente: "UNI/PdR 125:2022",
    vigenteDal: "16 marzo 2022",
    vigenteDalAnno: 2022,
    url: "https://store.uni.com/uni-pdr-125-2022",
    percorso: "parita-di-genere-pdr-125",
  },
  {
    id: "ts-11820",
    etichetta: "UNI/TS 11820",
    ambito: "misura della circolarità",
    vigente: "UNI/TS 11820:2024",
    vigenteDal: "14 novembre 2024",
    vigenteDalAnno: 2024,
    precedente: {
      codice: "UNI/TS 11820:2022",
      dalAnno: 2022,
      ritirataIl: "14 novembre 2024",
    },
    url: "https://store.uni.com/uni-ts-11820-2024",
    percorso: "rating-economia-circolare",
  },
];

/* ================================================================== */
/* GLI STANDARD DI RENDICONTAZIONE — versionati per esercizio          */
/* ================================================================== */

/**
 * ═══ PERCHÉ UN SECONDO REGISTRO, E NON UNA RIGA IN PIÙ NEL PRIMO ═══
 * `REGISTRO_NORME` sorveglia le DESIGNAZIONI UNI: una norma è in vigore
 * oppure ritirata, e il controllo si fa su store.uni.com. Gli standard di
 * rendicontazione funzionano in un altro modo, e trattarli come norme UNI
 * significherebbe sbagliarli entrambi:
 *
 * 1. NON SI RITIRANO, SI SUCCEDONO PER ESERCIZIO. La revisione VSME
 *    adottata a luglio 2026 si applica agli esercizi dal 2027: il
 *    bilancio 2025 di un cliente resta costruito sulla versione del
 *    2025, e resta giusto. «Ritirata» sarebbe falso — quella versione
 *    continua a governare gli esercizi suoi.
 * 2. ESISTONO PRIMA DI ESSERE IN VIGORE. Un atto delegato adottato dalla
 *    Commissione passa dallo scrutinio di Parlamento e Consiglio e entra
 *    in vigore con la pubblicazione in Gazzetta. Fra l'adozione e
 *    l'entrata in vigore la versione ESISTE, va registrata — altrimenti
 *    ci arriva addosso — e NON va usata per costruire niente.
 * 3. LA FONTE NON È L'UNI. È EUR-Lex, la Commissione, EFRAG: il
 *    controllo `scripts/controllo-norme.mjs` non può e non deve
 *    interrogarli.
 *
 * ═══ COME SI AGGIUNGE UNA REVISIONE ═══
 * Si aggiunge una voce. Non si tocca la precedente — che continua a
 * governare i suoi esercizi — e non si tocca una riga di pipeline. La
 * prova è in `scripts/test-versioni.mjs`, che aggiunge una revisione
 * finta e verifica che tutto il resto non si muova.
 *
 * ═══ VERIFICATO ═══ 11 settembre 2026, su EUR-Lex e sui documenti
 * della Commissione linkati in ciascuna voce.
 */
export const STANDARD_VERIFICATI_IL = {
  iso: "2026-09-11",
  esteso: "11 settembre 2026",
} as const;

export type StatoVersione =
  /** Si può usare per costruire documenti dell'esercizio applicabile. */
  | "in vigore"
  /**
   * Adottata o pubblicata ma NON ancora applicabile: registrata perché
   * esiste e perché arriverà, mai usata per costruire.
   */
  | "attesa"
  /** Sostituita da una versione successiva per gli esercizi futuri. */
  | "superata";

export type VersioneStandard = {
  /** La famiglia dello standard: `vsme`, `iso-14064-1`, `pdr-125`… */
  standard: string;
  /** L'etichetta della versione, breve e stabile: è la chiave. */
  versione: string;
  /** Come si cita dentro il documento consegnato, per esteso. */
  designazione: string;
  stato: StatoVersione;
  /**
   * Il primo ESERCIZIO DI RENDICONTAZIONE a cui si applica — non l'anno
   * in cui è stata pubblicata. È la distinzione che tiene in piedi tutto
   * il meccanismo: un bilancio 2026 elaborato nel 2027 si costruisce
   * sulla versione dell'esercizio 2026.
   */
  daEsercizio: number;
  /** L'ultimo esercizio a cui si applica, compreso. Assente = fino a oggi. */
  aEsercizio?: number;
  /** L'atto che la introduce, per esteso: finisce nel documento. */
  atto?: string;
  /** La fonte UFFICIALE: EUR-Lex, Commissione, ente che pubblica. */
  fonte?: string;
  /** Perché è in questo stato: si legge nel cruscotto, non si deduce. */
  nota?: string;
};

export const VERSIONI_STANDARD: VersioneStandard[] = [
  /* ══ VSME — lo standard volontario per le PMI ═══════════════════ */
  {
    standard: "vsme",
    versione: "efrag-2024",
    designazione: "VSME — EFRAG Voluntary Standard, dicembre 2024",
    stato: "superata",
    daEsercizio: 2024,
    aEsercizio: 2024,
    atto: "Parere finale EFRAG del 17 dicembre 2024",
    fonte:
      "https://www.efrag.org/en/projects/voluntary-reporting-standard-for-smes-vsme/concluded",
    nota: "La versione consegnata da EFRAG alla Commissione, prima che un atto europeo la facesse propria.",
  },
  {
    standard: "vsme",
    versione: "reco-2025",
    designazione:
      "VSME — Allegato I della Raccomandazione (UE) 2025/1710 della Commissione, del 30 luglio 2025",
    stato: "in vigore",
    daEsercizio: 2025,
    atto: "Raccomandazione (UE) 2025/1710 del 30 luglio 2025",
    fonte: "https://eur-lex.europa.eu/eli/reco/2025/1710/oj/eng",
    nota: "È la versione su cui si costruiscono oggi i bilanci VSME.",
  },
  {
    standard: "vsme",
    versione: "atto-delegato-2026",
    designazione:
      "Standard volontario per il tetto della catena del valore — atto delegato C(2026) 5011 final del 3 luglio 2026",
    stato: "attesa",
    daEsercizio: 2027,
    atto: "Atto delegato C(2026) 5011 final, adottato il 3 luglio 2026",
    fonte:
      "https://ec.europa.eu/finance/docs/level-2-measures/csrd-delegated-act-2026-5011_en.pdf",
    nota:
      "Adottato dalla Commissione il 3 luglio 2026 e trasmesso a Parlamento e Consiglio per lo scrutinio (due mesi, prorogabili di altri due): entra in vigore con la pubblicazione in Gazzetta ufficiale. Si applicherà agli esercizi che iniziano dal 1° gennaio 2027, con adozione anticipata ammessa per l'esercizio 2026 una volta entrato in vigore. Alla verifica dell'11 settembre 2026 la pubblicazione in Gazzetta non risultava avvenuta: la voce è registrata perché ESISTE, non perché sia utilizzabile.",
  },

  /* ══ Inventario GHG ═════════════════════════════════════════════ */
  {
    standard: "iso-14064-1",
    versione: "2019",
    designazione: "UNI EN ISO 14064-1:2019",
    stato: "in vigore",
    daEsercizio: 2019,
    fonte: "https://store.uni.com/uni-en-iso-14064-1-2019",
  },

  /* ══ Parità di genere ═══════════════════════════════════════════ */
  {
    standard: "pdr-125",
    versione: "2022",
    designazione: "UNI/PdR 125:2022",
    stato: "in vigore",
    daEsercizio: 2022,
    fonte: "https://store.uni.com/uni-pdr-125-2022",
  },
];

/* ── Le domande che si fanno al registro ───────────────────────────── */

/**
 * La versione da usare per costruire il documento di UN esercizio.
 *
 * Sceglie fra le versioni `in vigore` o `superata` — una versione
 * superata resta quella giusta per i suoi esercizi — e non restituisce
 * MAI una versione in `attesa`: un atto delegato adottato e non ancora
 * in Gazzetta non può finire dentro il documento che un cliente porta in
 * banca. Se più versioni coprono lo stesso esercizio vince la più
 * recente, che è il caso di un'entrata in vigore anticipata.
 */
export function versioneApplicabile(
  standard: string,
  esercizio: number,
): VersioneStandard | undefined {
  return VERSIONI_STANDARD.filter(
    (v) =>
      v.standard === standard &&
      v.stato !== "attesa" &&
      esercizio >= v.daEsercizio &&
      (v.aEsercizio === undefined || esercizio <= v.aEsercizio),
  ).sort((a, b) => b.daEsercizio - a.daEsercizio)[0];
}

/** Tutte le versioni di uno standard, dalla più vecchia alla più nuova. */
export function versioniDi(standard: string): VersioneStandard[] {
  return VERSIONI_STANDARD.filter((v) => v.standard === standard).sort(
    (a, b) => a.daEsercizio - b.daEsercizio,
  );
}

export function versioneStandard(
  standard: string,
  versione: string,
): VersioneStandard | undefined {
  return VERSIONI_STANDARD.find(
    (v) => v.standard === standard && v.versione === versione,
  );
}

export type EsitoVersione = {
  /** La versione su cui il documento È stato costruito. */
  costruitoSu: VersioneStandard | undefined;
  /** Quella che si userebbe oggi per lo stesso esercizio. */
  applicabile: VersioneStandard | undefined;
  superata: boolean;
  /** Che cosa dire al cliente. Vuoto quando non c'è niente da dire. */
  messaggio?: string;
};

/**
 * IL DOCUMENTO DI UN CLIENTE È COSTRUITO SU UNA VERSIONE SUPERATA?
 *
 * La domanda si fa sempre a parità di ESERCIZIO: un bilancio 2025
 * costruito sulla versione del 2025 è corretto anche quando esiste una
 * versione del 2027, e dirgli il contrario sarebbe mandare un cliente a
 * rifare un documento giusto. Superato significa una cosa sola: per
 * QUELL'esercizio, oggi, useremmo un'altra versione.
 */
export function statoVersioneDocumento(
  standard: string,
  versioneUsata: string | undefined,
  esercizio: number,
): EsitoVersione {
  const applicabile = versioneApplicabile(standard, esercizio);
  const costruitoSu = versioneUsata
    ? versioneStandard(standard, versioneUsata)
    : undefined;

  // Un documento che non dichiara la versione è il caso peggiore, ed è
  // anche quello dei documenti costruiti prima che questo registro
  // esistesse: non si può dire se è allineato, e lo si dice.
  if (!versioneUsata) {
    return {
      costruitoSu: undefined,
      applicabile,
      superata: false,
      messaggio:
        "Questo documento non dichiara su quale versione dello standard è stato costruito: per saperlo va ricomposto.",
    };
  }
  if (!costruitoSu) {
    return {
      costruitoSu: undefined,
      applicabile,
      superata: true,
      messaggio: `Questo documento dichiara una versione («${versioneUsata}») che non è nel registro: va ricomposto sulla versione applicabile all'esercizio ${esercizio}.`,
    };
  }
  if (!applicabile || applicabile.versione === costruitoSu.versione) {
    return { costruitoSu, applicabile, superata: false };
  }
  return {
    costruitoSu,
    applicabile,
    superata: true,
    messaggio: `Costruito su ${costruitoSu.designazione}. Per l'esercizio ${esercizio} oggi si applica ${applicabile.designazione}: il documento va rifatto su quella.`,
  };
}

/* ------------------------------------------------------------------ */
/* Le norme come CHIAVE DI COLLEGAMENTO                                */
/* ------------------------------------------------------------------ */

/**
 * LE NORME CHE IL CATALOGO TOCCA — elenco chiuso.
 *
 * ═══ PERCHÉ NON BASTA `FAMIGLIE_NORMA` ═══
 * Quello è il registro delle EDIZIONI: serve a dire se un manuale cita
 * una designazione ritirata, quindi contiene solo le norme di cui
 * sorvegliamo l'edizione — cinque. Qui servono tutte quelle che un
 * percorso può toccare, comprese SA8000, ISO 45003 o VSME, di cui non
 * controlliamo l'edizione ma che qualcuno cerca per nome.
 *
 * Le due liste non divergono per caso: `scripts/test-orientatore.mjs`
 * verifica che ogni `FamigliaNorma.id` esista anche qui, con la stessa
 * etichetta.
 *
 * ═══ A CHE COSA SERVE ═══
 * A collegare fra loro i percorsi che parlano della STESSA norma. Chi
 * scrive «9001» non sta cercando un documento: sta cercando la risposta
 * al punto del ciclo in cui si trova — parto da zero, ce l'ho già e
 * forse è vecchio, ho preso dei rilievi. Senza una chiave condivisa
 * quelle tre risposte restano tre schede che non si conoscono.
 */
export type Norma = {
  chiave: string;
  /** La designazione breve, senza edizione: come la si nomina parlando. */
  etichetta: string;
  /**
   * Come la scrive chi la cerca.
   *
   * SOLO forme che identificano la norma DA SOLE. Il numero nudo di
   * UNI/PdR 125 e di SA8000 non è qui apposta: «125» e «8000» compaiono
   * in frasi che non parlano di norme («ho 125 dipendenti»), e da una
   * chiave riconosciuta qui dipende l'apertura di tre risultati
   * correlati — sbagliarla non costa un risultato debole, ne costa tre.
   * Chi cerca «125» trova comunque la parità: quella è una chiave della
   * voce di catalogo, e vale per la corrispondenza diretta.
   */
  chiavi: readonly string[];
};

export const NORME = [
  { chiave: "iso-9001", etichetta: "ISO 9001", chiavi: ["9001"] },
  { chiave: "iso-14001", etichetta: "ISO 14001", chiavi: ["14001"] },
  {
    chiave: "emas",
    etichetta: "EMAS",
    // «Emas» da sola identifica lo schema: non è una parola che compaia
    // in frasi d'altro argomento, al contrario di «registrazione».
    chiavi: ["emas", "ecogestione", "eco-management", "dichiarazione ambientale"],
  },
  { chiave: "iso-45001", etichetta: "ISO 45001", chiavi: ["45001"] },
  { chiave: "iso-45003", etichetta: "ISO 45003", chiavi: ["45003"] },
  {
    chiave: "iso-27001",
    etichetta: "ISO/IEC 27001",
    // «27001» identifica la norma da solo; le altre due sono i nomi con
    // cui la cerca chi non ne conosce il numero.
    chiavi: ["27001", "sicurezza delle informazioni", "sicurezza informatica"],
  },
  { chiave: "iso-30415", etichetta: "ISO 30415", chiavi: ["30415"] },
  {
    chiave: "pdr-125",
    etichetta: "UNI/PdR 125",
    chiavi: ["pdr 125", "pdr125", "prassi 125", "uni pdr 125"],
  },
  { chiave: "sa8000", etichetta: "SA8000", chiavi: ["sa8000", "sa 8000"] },
  { chiave: "ts-11820", etichetta: "UNI/TS 11820", chiavi: ["11820"] },
  {
    chiave: "iso-14064",
    etichetta: "ISO 14064-1",
    chiavi: ["14064", "ghg protocol"],
  },
  { chiave: "vsme", etichetta: "VSME", chiavi: ["vsme", "efrag"] },
  { chiave: "iso-21401", etichetta: "ISO 21401", chiavi: ["21401"] },
  { chiave: "iso-20121", etichetta: "ISO 20121", chiavi: ["20121"] },
  { chiave: "iso-26000", etichetta: "ISO 26000", chiavi: ["26000"] },
  { chiave: "iso-20400", etichetta: "ISO 20400", chiavi: ["20400"] },
] as const satisfies readonly Norma[];

/** L'identificativo di una norma, come unione chiusa: una chiave
 *  sbagliata in una voce di catalogo non compila. */
export type ChiaveNorma = (typeof NORME)[number]["chiave"];

export function norma(chiave: ChiaveNorma): Norma | undefined {
  return NORME.find((n) => n.chiave === chiave);
}

/* ------------------------------------------------------------------ */
/* L'esito del controllo                                               */
/* ------------------------------------------------------------------ */

export type EsitoControllo = {
  famiglia: FamigliaNorma;
  /**
   * L'edizione che quel manuale cita, quando la si può dire con
   * certezza. `null` quando il manuale è più vecchio della finestra
   * dell'edizione precedente: allora è superato di sicuro, ma quale
   * designazione porti non lo sappiamo — e non lo inventiamo.
   */
  citata: { codice: string; ritirataIl: string } | null;
  /**
   * `superata`  — il manuale è anteriore all'edizione in vigore: cita
   *               per forza quella precedente, ritirata.
   * `daVerificare` — stesso anno del cambio: dipende dal mese, e non lo
   *               sappiamo. Si dice, non si indovina.
   * `allineata` — il manuale è successivo all'edizione in vigore.
   */
  stato: "superata" | "daVerificare" | "allineata";
};

/**
 * Il confronto. Nessuna promessa sull'esito di un audit: si dice solo
 * quale edizione risulta citata e da quando quella precedente è ritirata.
 */
export function controllaEdizione(
  famiglia: FamigliaNorma,
  annoManuale: number,
): EsitoControllo {
  if (annoManuale < famiglia.vigenteDalAnno) {
    const p = famiglia.precedente;
    // Si nomina l'edizione precedente solo se il manuale cade dentro la
    // finestra in cui era quella in vigore.
    const citata =
      p && annoManuale >= p.dalAnno
        ? { codice: p.codice, ritirataIl: p.ritirataIl }
        : null;
    return { famiglia, stato: "superata", citata };
  }
  if (annoManuale === famiglia.vigenteDalAnno) {
    return { famiglia, stato: "daVerificare", citata: null };
  }
  return { famiglia, stato: "allineata", citata: null };
}
