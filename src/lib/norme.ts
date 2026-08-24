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
    codice: "UNI EN ISO 14064-1:2019",
    url: "https://store.uni.com/uni-en-iso-14064-1-2019",
    stato: "in vigore",
    dal: "11 aprile 2019",
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
