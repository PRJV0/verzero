/**
 * Matrice prezzi per dimensione d'azienda — FONTE DATI UNICA (SPEC §12.X).
 * Mai prezzi cablati nelle pagine: home, indice e dettagli leggono da qui.
 *
 * Regola (decisione del fondatore): il listino esistente è la fascia
 * micro/piccola; media = +45%; grande = sempre "su richiesta" con contatto.
 * La struttura (una riga per servizio, componenti con importo base e unità)
 * è pensata per diventare la tabella `price_plans` a database in fase 2
 * senza cambiare la forma dei dati.
 */

export const DIMENSIONI = ["micro", "piccola", "media", "grande"] as const;
export type Dimensione = (typeof DIMENSIONI)[number];

export const DIMENSIONE_LABEL: Record<Dimensione, string> = {
  micro: "Micro",
  piccola: "Piccola",
  media: "Media",
  grande: "Grande",
};

/** Moltiplicatori per fascia; grande è fuori matrice: sempre su richiesta. */
const MULTIPLIER: Record<Exclude<Dimensione, "grande">, number> = {
  micro: 1,
  piccola: 1,
  media: 1.45,
};

type Unit = "mese" | "una_tantum";

/** Un componente di prezzo: importo base (fascia micro) e unità. */
type PriceComponent = { base: number; unit: Unit };

/** Listino base per servizio (slug del catalogo → componenti). */
const LISTINO: Record<string, PriceComponent[]> = {
  "percorso-ver0": [{ base: 199, unit: "mese" }],
  "carbon-footprint-base": [{ base: 89, unit: "mese" }],
  "bilancio-vsme-base": [{ base: 129, unit: "mese" }],
  "manuale-iso-9001": [
    { base: 990, unit: "una_tantum" },
    { base: 49, unit: "mese" },
  ],
  "manuale-iso-14001": [
    { base: 990, unit: "una_tantum" },
    { base: 49, unit: "mese" },
  ],
  "parita-di-genere-pdr-125": [{ base: 129, unit: "mese" }],
  "rating-economia-circolare": [{ base: 129, unit: "mese" }],
};

/** Canoni al centesimo tondo; una tantum alla decina (evita 1.436 €). */
function round(amount: number, unit: Unit): number {
  return unit === "una_tantum"
    ? Math.round(amount / 10) * 10
    : Math.round(amount);
}

function formatComponent(amount: number, unit: Unit): string {
  const n = amount.toLocaleString("it-IT");
  return unit === "una_tantum" ? `${n} €` : `${n} €/mese`;
}

/** Prezzo per servizio e dimensione. `null` = su richiesta (fascia grande). */
export function prezzoPer(slug: string, dim: Dimensione): string | null {
  const comps = LISTINO[slug];
  if (!comps) return null;
  if (dim === "grande") return null;
  const m = MULTIPLIER[dim];
  return comps
    .map((c) => formatComponent(round(c.base * m, c.unit), c.unit))
    .join(" + ");
}

/** Etichetta "da X €/mese" per la vetrina (X = fascia micro). */
export function prezzoDa(slug: string): string | null {
  const comps = LISTINO[slug];
  if (!comps) return null;
  const canone = comps.find((c) => c.unit === "mese");
  const unaTantum = comps.find((c) => c.unit === "una_tantum");
  if (unaTantum && canone) {
    return `da ${formatComponent(unaTantum.base, "una_tantum")} + ${formatComponent(canone.base, "mese")}`;
  }
  const c = canone ?? comps[0];
  return `da ${formatComponent(c.base, c.unit)}`;
}

/** Micro-copy dell'aggancio sartoriale per la fascia grande (SPEC §12.X). */
export const GRANDE_IMPRESA = {
  copy: "Grande impresa? Percorsi su misura: parliamone.",
  cta: "Parliamone",
  href: "mailto:info@verzero.it?subject=Percorsi%20su%20misura%20%E2%80%94%20grande%20impresa",
};
