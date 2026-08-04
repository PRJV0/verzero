/**
 * Matrice prezzi per dimensione d'azienda — FONTE DATI UNICA (SPEC §12.X,
 * revisione finale listino §12.R). Mai prezzi cablati nelle pagine.
 *
 * Regole:
 * - Fasce: micro = listino, piccola = +20%, media = +50%, grande = sempre
 *   "su richiesta" con contatto. Ogni passaggio di fascia cambia il prezzo.
 * - DOPPIA ESPOSIZIONE (§12.R, vincolante): ogni canone si mostra in due
 *   forme — MENSILE in evidenza (impegno minimo 12 mesi, dichiarato) e
 *   UNICA SOLUZIONE ANNUALE con sconto 10% e badge "-10%". Gli annuali di
 *   fascia micro sono i valori espliciti decisi in SPEC (già arrotondati).
 * - Il Kit Comunicazione Ver0 è incluso di default in ogni abbonamento
 *   (quinto beneficio del "canone include", v. src/lib/canone.ts).
 *
 * La struttura è pronta a diventare la tabella `price_plans` a database.
 */

export const DIMENSIONI = ["micro", "piccola", "media", "grande"] as const;
export type Dimensione = (typeof DIMENSIONI)[number];

export const DIMENSIONE_LABEL: Record<Dimensione, string> = {
  micro: "Micro",
  piccola: "Piccola",
  media: "Media",
  grande: "Grande",
};

/** Range indicativi per aiutare la scelta (classi dimensionali UE). */
export const DIMENSIONE_RANGE: Record<Dimensione, string> = {
  micro: "fino a 9 addetti · ≤ 2 M€",
  piccola: "10–49 addetti · ≤ 10 M€",
  media: "50–249 addetti · ≤ 50 M€",
  grande: "250+ addetti · > 50 M€",
};

export const FORMULE = ["mensile", "annuale"] as const;
export type Formula = (typeof FORMULE)[number];

/** Moltiplicatori per fascia; grande è fuori matrice: sempre su richiesta. */
const MULTIPLIER: Record<Exclude<Dimensione, "grande">, number> = {
  micro: 1,
  piccola: 1.2,
  media: 1.5,
};

/**
 * Listino base fascia micro (SPEC §12.R). `mensile`/`annuale` sono il canone
 * nelle due formule (annuale = unica soluzione, −10% già applicato e
 * arrotondato in SPEC); `unaTantum` è l'eventuale quota di generazione.
 */
type Voce = { mensile: number; annuale: number; unaTantum?: number };

const LISTINO: Record<string, Voce> = {
  "percorso-ver0": { mensile: 119, annuale: 1290 },
  "carbon-light": { mensile: 45, annuale: 490 },
  "carbon-completa": { mensile: 75, annuale: 810 },
  "bilancio-vsme-base": { mensile: 89, annuale: 960 },
  "manuale-iso-9001": { mensile: 59, annuale: 640, unaTantum: 990 },
  "manuale-iso-14001": { mensile: 59, annuale: 640, unaTantum: 990 },
  "parita-di-genere-pdr-125": { mensile: 39, annuale: 420, unaTantum: 990 },
  // Non toccata dalla §12.R: canone precedente, annuale derivato (−10%).
  "rating-economia-circolare": { mensile: 129, annuale: 1390 },
};

/** Canoni all'euro; annuali e una tantum alla decina. */
function scala(base: number, dim: Exclude<Dimensione, "grande">, decina = false) {
  const v = base * MULTIPLIER[dim];
  return decina ? Math.round(v / 10) * 10 : Math.round(v);
}

const eur = (n: number) => n.toLocaleString("it-IT");

export type PrezzoDettaglio = {
  /** Canone mensile scalato per fascia (€/mese). */
  mensile: number;
  /** Unica soluzione annuale scalata (−10% già incluso). */
  annuale: number;
  /** Quota una tantum scalata, se prevista. */
  unaTantum?: number;
};

/** Prezzi per servizio e dimensione. `null` = su richiesta (fascia grande). */
export function prezzoDettaglio(
  slug: string,
  dim: Dimensione,
): PrezzoDettaglio | null {
  const v = LISTINO[slug];
  if (!v || dim === "grande") return null;
  return {
    mensile: scala(v.mensile, dim),
    annuale: scala(v.annuale, dim, true),
    unaTantum: v.unaTantum ? scala(v.unaTantum, dim, true) : undefined,
  };
}

/** Etichetta compatta del prezzo per formula scelta (es. nel riepilogo). */
export function prezzoLabel(
  slug: string,
  dim: Dimensione,
  formula: Formula,
): string | null {
  const p = prezzoDettaglio(slug, dim);
  if (!p) return null;
  const canone =
    formula === "mensile" ? `${eur(p.mensile)} €/mese` : `${eur(p.annuale)} €/anno`;
  return p.unaTantum ? `${eur(p.unaTantum)} € + ${canone}` : canone;
}

/** Etichetta "da X €/mese" per la vetrina (X = mensile fascia micro). */
export function prezzoDa(slug: string): string | null {
  const v = LISTINO[slug];
  if (!v) return null;
  return v.unaTantum
    ? `da ${eur(v.unaTantum)} € + ${eur(v.mensile)} €/mese`
    : `da ${eur(v.mensile)} €/mese`;
}

/** Micro-copy dell'aggancio sartoriale per la fascia grande (SPEC §12.X). */
export const GRANDE_IMPRESA = {
  copy: "Grande impresa? Percorsi su misura: parliamone.",
  cta: "Parliamone",
  href: "mailto:info@verzero.it?subject=Percorsi%20su%20misura%20%E2%80%94%20grande%20impresa",
};
