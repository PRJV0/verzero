/**
 * La scheda impresa (SPEC §12.H) — definizione dei campi e regole di
 * presentazione, condivise tra la sezione "La tua impresa", il wizard di
 * primo accesso e (dalla 2.1) l'arricchimento automatico.
 *
 * Ogni campo ha una PROVENIENZA: inserito dall'utente, recuperato dal
 * Motore, oppure ancora da recuperare (l'opportunità della 2.1 — mai un
 * vuoto triste). I valori vivono in company_fields; i dati della
 * registrazione (organizations) fanno da base finché la scheda non li
 * sovrascrive.
 */

export type GruppoCampi = {
  titolo: string;
  campi: {
    chiave: string;
    label: string;
    /** La fonte da cui la 2.1 recupererà il dato (mostrata come attesa). */
    fonteAttesa?: string;
  }[];
};

export const GRUPPI_CAMPI: GruppoCampi[] = [
  {
    titolo: "Identità",
    campi: [
      { chiave: "ragione_sociale", label: "Ragione sociale" },
      { chiave: "partita_iva", label: "Partita IVA" },
      {
        chiave: "forma_giuridica",
        label: "Forma giuridica",
        fonteAttesa: "Registro Imprese",
      },
      {
        chiave: "ateco",
        label: "Codice ATECO",
        fonteAttesa: "Registro Imprese",
      },
    ],
  },
  {
    titolo: "Sede e contatti",
    campi: [
      {
        chiave: "sede_legale",
        label: "Sede legale",
        fonteAttesa: "Registro Imprese",
      },
      {
        chiave: "unita_locali",
        label: "Unità locali",
        fonteAttesa: "Registro Imprese",
      },
      { chiave: "pec", label: "PEC", fonteAttesa: "INI-PEC" },
      { chiave: "email", label: "Email di fatturazione" },
      { chiave: "sito_web", label: "Sito ufficiale" },
    ],
  },
  {
    titolo: "Struttura",
    campi: [
      { chiave: "dimensione", label: "Dimensione d'impresa" },
      {
        chiave: "dipendenti",
        label: "Dipendenti",
        fonteAttesa: "Registro Imprese",
      },
      {
        chiave: "capitale_sociale",
        label: "Capitale sociale",
        fonteAttesa: "Registro Imprese",
      },
    ],
  },
  {
    titolo: "Certificazioni",
    campi: [
      {
        chiave: "certificazioni_possedute",
        label: "Certificazioni già possedute",
        fonteAttesa: "banca dati ACCREDIA",
      },
      {
        chiave: "certificazioni_esposte",
        label: "Certificazioni dichiarate sul sito",
        fonteAttesa: "il tuo sito ufficiale",
      },
    ],
  },
  {
    // Il profilo qualitativo (SPEC §12.D): ciò che nessuna banca dati
    // contiene e che il cliente ha già scritto sul proprio sito. Sono le
    // sezioni che nel VSME e nei manuali resterebbero altrimenti vuote.
    titolo: "Profilo pubblico",
    campi: [
      {
        chiave: "descrizione_attivita",
        label: "Come descrivi la tua attività",
        fonteAttesa: "il tuo sito ufficiale",
      },
      {
        chiave: "prodotti_servizi",
        label: "Prodotti e servizi",
        fonteAttesa: "il tuo sito ufficiale",
      },
      {
        chiave: "sedi_operative",
        label: "Sedi e stabilimenti",
        fonteAttesa: "il tuo sito ufficiale",
      },
      {
        chiave: "mercati",
        label: "Mercati serviti",
        fonteAttesa: "il tuo sito ufficiale",
      },
      {
        chiave: "pagine_sostenibilita",
        label: "Pagine sostenibilità",
        fonteAttesa: "il tuo sito ufficiale",
      },
      {
        chiave: "policy_pubblicate",
        label: "Policy pubblicate",
        fonteAttesa: "il tuo sito ufficiale",
      },
    ],
  },
];

/* ------------------------------------------------------------------ */
/* Un dato, più documenti (SPEC §12.F)                                 */
/* ------------------------------------------------------------------ */

import {
  DOC_CARBON,
  DOC_KIT,
  DOC_PARITA,
  DOC_SCORE,
  DOC_VSME,
  documentiAttivi,
} from "./bozza";

/**
 * A quali documenti contribuisce ciascun campo della scheda. "tutti"
 * = entra nell'anagrafica di ogni documento in lavorazione. I campi
 * puramente amministrativi (PEC, email) non hanno destinazioni.
 */
const CAMPO_DESTINAZIONI: Record<string, string[] | "tutti"> = {
  // Il profilo qualitativo alimenta le sezioni narrative (§12.D).
  descrizione_attivita: "tutti",
  prodotti_servizi: [DOC_VSME, DOC_KIT],
  sedi_operative: [DOC_CARBON, DOC_VSME],
  mercati: [DOC_VSME, DOC_SCORE, DOC_KIT],
  certificazioni_esposte: [DOC_VSME, DOC_SCORE],
  pagine_sostenibilita: [DOC_VSME, DOC_KIT],
  policy_pubblicate: [DOC_VSME, DOC_PARITA],
  ragione_sociale: "tutti",
  partita_iva: "tutti",
  forma_giuridica: "tutti",
  ateco: [DOC_CARBON, DOC_VSME],
  sede_legale: [DOC_CARBON, DOC_VSME],
  unita_locali: [DOC_CARBON],
  dimensione: [DOC_VSME],
  dipendenti: [DOC_VSME, DOC_PARITA],
  capitale_sociale: [DOC_VSME],
};

/**
 * I chip di destinazione di un campo, filtrati sui documenti davvero in
 * lavorazione: il principio «rispondi una volta sola» reso visibile.
 * `"tutti"` quando il campo entra in ogni documento attivo.
 */
export function destinazioniCampo(
  chiave: string,
  moduliAttivi: string[],
): string[] | "tutti" | null {
  const attivi = documentiAttivi(moduliAttivi);
  if (attivi.size === 0) return null;
  const dest = CAMPO_DESTINAZIONI[chiave];
  if (!dest) return null;
  if (dest === "tutti") return attivi.size > 1 ? "tutti" : [...attivi];
  const presenti = dest.filter((d) => attivi.has(d));
  return presenti.length > 0 ? presenti : null;
}

export type ProvenienzaCampo = "utente" | "motore" | "in-arrivo";

export type CampoScheda = {
  chiave: string;
  label: string;
  valore: string | null;
  provenienza: ProvenienzaCampo;
  /** "registrazione", "InfoCamere", … oppure la fonte attesa per la 2.1. */
  fonte: string | null;
  /** L'indirizzo della pagina da cui viene il dato (SPEC §12.D). */
  fonteUrl: string | null;
  daConfermare: boolean;
  /** Il cliente ha respinto questa proposta: resta annotato, non vale. */
  rifiutato: boolean;
};

type RigaCampo = {
  campo: string;
  valore: string | null;
  provenienza: "utente" | "motore";
  fonte: string | null;
  fonte_url?: string | null;
  stato: "confermato" | "da_confermare" | "rifiutato";
};

type DatiOrganizzazione = {
  ragione_sociale: string;
  partita_iva: string;
  dimensione: string;
  billing_email: string | null;
  sito_web?: string | null;
};

const LABEL_DIMENSIONE: Record<string, string> = {
  micro: "Micro (fino a 9 addetti)",
  piccola: "Piccola (10–49 addetti)",
  media: "Media (50–249 addetti)",
  grande: "Grande (250+ addetti)",
};

/**
 * Fonde la base della registrazione con i record di company_fields.
 * I record della scheda vincono sulla base; i campi senza valore
 * diventano "in-arrivo" con la fonte attesa dell'arricchimento.
 */
export function componiScheda(
  org: DatiOrganizzazione,
  righe: RigaCampo[],
): { titolo: string; campi: CampoScheda[] }[] {
  const daDb = new Map(righe.map((r) => [r.campo, r]));

  const base: Record<string, { valore: string; fonte: string }> = {
    ragione_sociale: { valore: org.ragione_sociale, fonte: "registrazione" },
    partita_iva: { valore: org.partita_iva, fonte: "registrazione" },
    dimensione: {
      valore: LABEL_DIMENSIONE[org.dimensione] ?? org.dimensione,
      fonte: "registrazione",
    },
    ...(org.billing_email
      ? { email: { valore: org.billing_email, fonte: "registrazione" } }
      : {}),
    ...(org.sito_web
      ? { sito_web: { valore: org.sito_web, fonte: "registrazione" } }
      : {}),
  };

  return GRUPPI_CAMPI.map((g) => ({
    titolo: g.titolo,
    campi: g.campi.map((c): CampoScheda => {
      const riga = daDb.get(c.chiave);
      // Un campo RIFIUTATO non è un valore: torna a essere una casella
      // vuota, con l'annotazione che una proposta c'era ed è stata
      // respinta. Non lo mostriamo come se fosse il dato dell'impresa.
      if (riga && riga.stato === "rifiutato") {
        return {
          chiave: c.chiave,
          label: c.label,
          valore: null,
          provenienza: "in-arrivo",
          fonte: c.fonteAttesa ?? null,
          fonteUrl: null,
          daConfermare: false,
          rifiutato: true,
        };
      }
      if (riga && riga.valore !== null) {
        return {
          chiave: c.chiave,
          label: c.label,
          valore: riga.valore,
          provenienza: riga.provenienza,
          fonte: riga.fonte,
          fonteUrl: riga.fonte_url ?? null,
          daConfermare: riga.stato === "da_confermare",
          rifiutato: false,
        };
      }
      const b = base[c.chiave];
      if (b) {
        return {
          chiave: c.chiave,
          label: c.label,
          valore: b.valore,
          provenienza: "utente",
          fonte: b.fonte,
          fonteUrl: null,
          daConfermare: false,
          rifiutato: false,
        };
      }
      return {
        chiave: c.chiave,
        label: c.label,
        valore: null,
        provenienza: "in-arrivo",
        fonte: c.fonteAttesa ?? null,
        fonteUrl: null,
        daConfermare: false,
        rifiutato: false,
      };
    }),
  }));
}
