import { getServizio } from "@/lib/catalog";
import { prezzoDettaglio, type Dimensione } from "@/lib/pricing";

/**
 * SUGGERIMENTI INTELLIGENTI (SPEC §12.F): «Con i dati che già abbiamo
 * potresti attivare…» — cross-sell nel portale, mai invadente.
 *
 * Regole del gioco:
 * - solo servizi PERTINENTI rispetto ai percorsi attivi, con l'EFFORT
 *   RESIDUO calcolato e dichiarato («ti serviranno solo: …» oppure
 *   «zero documenti aggiuntivi»);
 * - prezzo dalla matrice (mai cablato), scalato sulla dimensione reale
 *   dell'impresa; SCONTO CLIENTE ATTIVO −15% per chi ha già un canone,
 *   applicato in attivazione (oggi nessun addebito è automatico);
 * - massimo due card, tono di opportunità: si può sempre ignorare.
 */

export type Suggerimento = {
  slug: string;
  nome: string;
  taglio?: string;
  /** Perché l'effort è ridotto: cosa il Motore ha già. */
  motivo: string;
  /** Documenti ancora necessari; null = zero documenti aggiuntivi. */
  effort: string[] | null;
  /** Precisazione onesta quando serve (mai promesse assolute). */
  effortNota?: string;
  /** €/mese primo anno per la dimensione dell'impresa; null = su richiesta. */
  mensile: number | null;
  /** €/mese con lo sconto cliente attivo −15%; null se non applicabile. */
  mensileScontato: number | null;
};

type Regola = {
  slug: string;
  /** La regola scatta se TUTTI questi sono coperti… */
  se: (attivi: Set<string>) => boolean;
  motivo: string;
  effort: string[] | null;
  effortNota?: string;
};

/** Il Percorso Ver0 copre Carbon Scope 1-2 e VSME Base. */
function copre(attivi: Set<string>, slug: string): boolean {
  if (attivi.has(slug)) return true;
  if (
    attivi.has("percorso-ver0") &&
    (slug === "carbon-footprint-scope-1-2" ||
      slug === "bilancio-sostenibilita-vsme-base")
  )
    return true;
  return false;
}

const haCarbon = (a: Set<string>) =>
  copre(a, "carbon-footprint-scope-1-2") ||
  a.has("carbon-footprint-scope-1-2-3");
const haVsme = (a: Set<string>) =>
  copre(a, "bilancio-sostenibilita-vsme-base") ||
  a.has("bilancio-sostenibilita-vsme-avanzato");

/** In ordine di priorità: si mostrano le prime due che scattano. */
const REGOLE: Regola[] = [
  {
    slug: "iso-30415",
    se: (a) => a.has("parita-di-genere-pdr-125"),
    motivo:
      "KPI, politiche e dati di organico del tuo percorso parità si riusano tali e quali.",
    effort: null,
    effortNota:
      "Se hai un codice etico già scritto lo integriamo, ma non è richiesto.",
  },
  {
    slug: "iso-45003",
    se: (a) => a.has("manuale-sistema-gestione-iso-45001"),
    motivo:
      "Organigramma, dati di organico e DVR sono già nel fascicolo del tuo sistema sicurezza.",
    effort: null,
    effortNota:
      "Se la valutazione dello stress lavoro-correlato non è tra gli allegati del DVR, ti chiederemo solo quella.",
  },
  {
    slug: "bilancio-sostenibilita-vsme-base",
    se: (a) => haCarbon(a) && !haVsme(a),
    motivo:
      "Gli indicatori ambientali arrivano da soli dal tuo Carbon Footprint: la parte più onerosa è già fatta.",
    effort: [
      "dati di organico aggregati",
      "composizione degli organi sociali",
    ],
  },
  {
    slug: "carbon-footprint-scope-1-2",
    se: (a) => haVsme(a) && !haCarbon(a),
    motivo:
      "Anagrafica, bollette e dati economici del tuo bilancio sono già nel tuo ecosistema.",
    effort: ["registri o fatture dei carburanti dell'anno"],
  },
  {
    slug: "carbon-footprint-scope-1-2-3",
    se: (a) =>
      copre(a, "carbon-footprint-scope-1-2") &&
      !a.has("carbon-footprint-scope-1-2-3"),
    motivo:
      "Tutto il tuo Scope 1 e 2 resta valido: si aggiunge solo la filiera, pagando la differenza.",
    effort: ["categorie di spesa dalla contabilità fornitori"],
  },
  {
    slug: "manuale-sistema-gestione-iso-14001",
    se: (a) => haCarbon(a) && !a.has("manuale-sistema-gestione-iso-14001"),
    motivo:
      "L'analisi ambientale nasce precompilata dai tuoi dati di consumo ed emissione.",
    effort: [
      "planimetrie e descrizione dei siti",
      "autorizzazioni ambientali, se applicabili",
    ],
  },
];

/**
 * I suggerimenti per un'impresa: massimo due, mai per servizi già attivi.
 * `scontoAttivo` vale quando esiste almeno un canone attivo (−15% add-on,
 * applicato in fase di attivazione).
 */
export function suggerimenti(
  moduliAttivi: string[],
  dimensione: string,
  scontoAttivo: boolean,
): Suggerimento[] {
  const attivi = new Set(moduliAttivi);
  const dim = (
    ["micro", "piccola", "media", "grande"].includes(dimensione)
      ? dimensione
      : "micro"
  ) as Dimensione;

  return REGOLE.filter((r) => !copre(attivi, r.slug) && r.se(attivi))
    .slice(0, 2)
    .map((r) => {
      const s = getServizio(r.slug);
      const p = prezzoDettaglio(r.slug, dim);
      return {
        slug: r.slug,
        nome: s?.name ?? r.slug,
        taglio: s?.taglio,
        motivo: r.motivo,
        effort: r.effort,
        effortNota: r.effortNota,
        mensile: p?.mensile ?? null,
        mensileScontato:
          p && scontoAttivo ? Math.round(p.mensile * 0.85) : null,
      };
    });
}
