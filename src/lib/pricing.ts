/**
 * Matrice prezzi per dimensione d'azienda — FONTE DATI UNICA
 * (SPEC §12.X fasce, §12.Q formato unico e ciclo di vita del canone).
 *
 * FORMATO UNICO (§12.Q): ogni servizio ricorrente si espone SOLO come canone
 * mensile (impegno minimo 12 mesi) + opzione annuale in unica soluzione con
 * sconto 10%. Le vecchie parti una tantum sono spalmate nel canone del primo
 * anno e NON compaiono più.
 *
 * CICLO DI VITA (§12.Q, sempre dichiarato in interfaccia):
 * - servizi con produzione iniziale (Manuali ISO, UNI/PdR 125): anno 1 pieno,
 *   dal 2° anno solo mantenimento;
 * - servizi documentali annuali (Carbon, VSME, Percorso, Rating): rinnovo dal
 *   2° anno a −20% ("i tuoi dati sono già nel Motore");
 * - il rinnovo è sempre libero: nessun vincolo dopo i primi 12 mesi.
 *
 * Fasce: micro = listino, piccola +20%, media +50%, grande su richiesta.
 * Struttura pronta a diventare la tabella `price_plans` a database.
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

/** Ciclo di vita del canone dal 2° anno. */
type Rinnovo =
  | { tipo: "mantenimento"; mensile: number } // produzione iniziale → solo mantenimento
  | { tipo: "sconto20" }; // documentale annuale → −20%, dati già nel Motore

/** Listino base fascia micro (§12.Q): canone anno 1 mensile/annuale + rinnovo,
 *  oppure servizio one-shot senza canone (es. supporto all'audit). */
type Voce =
  | { mensile: number; annuale: number; rinnovo: Rinnovo }
  | { unaTantum: number };

const isOneShot = (v: Voce): v is { unaTantum: number } => "unaTantum" in v;

const LISTINO: Record<string, Voce> = {
  "percorso-ver0": { mensile: 119, annuale: 1290, rinnovo: { tipo: "sconto20" } },
  "carbon-footprint-scope-1-2": { mensile: 45, annuale: 490, rinnovo: { tipo: "sconto20" } },
  "carbon-footprint-scope-1-2-3": { mensile: 75, annuale: 810, rinnovo: { tipo: "sconto20" } },
  "bilancio-sostenibilita-vsme-base": { mensile: 89, annuale: 960, rinnovo: { tipo: "sconto20" } },
  // Modulo base + modulo completo dello standard EFRAG (§12.L).
  "bilancio-sostenibilita-vsme-avanzato": {
    mensile: 129,
    annuale: 1390,
    rinnovo: { tipo: "sconto20" },
  },
  "manuale-sistema-gestione-iso-9001": {
    mensile: 139,
    annuale: 1500,
    rinnovo: { tipo: "mantenimento", mensile: 59 },
  },
  "manuale-sistema-gestione-iso-14001": {
    mensile: 139,
    annuale: 1500,
    rinnovo: { tipo: "mantenimento", mensile: 59 },
  },
  "parita-di-genere-pdr-125": {
    mensile: 119,
    annuale: 1290,
    rinnovo: { tipo: "mantenimento", mensile: 39 },
  },
  // Famiglia A, allineato agli altri manuali ISO (§12.M).
  "manuale-sistema-gestione-iso-45001": {
    mensile: 139,
    annuale: 1500,
    rinnovo: { tipo: "mantenimento", mensile: 59 },
  },
  // Famiglia B — linee guida non certificabili, venduti come add-on di
  // UNI/PdR 125 e ISO 45001: prezzo ridotto (§12.M).
  "iso-45003": {
    mensile: 59,
    annuale: 640,
    rinnovo: { tipo: "mantenimento", mensile: 29 },
  },
  "iso-30415": {
    mensile: 59,
    annuale: 640,
    rinnovo: { tipo: "mantenimento", mensile: 29 },
  },
  // Schema accreditato di parte terza: impianto più oneroso (catena di
  // fornitura, evidenze sul personale). Prezzo da validare sul mercato.
  sa8000: {
    mensile: 179,
    annuale: 1930,
    rinnovo: { tipo: "mantenimento", mensile: 79 },
  },
  "rating-economia-circolare": { mensile: 129, annuale: 1390, rinnovo: { tipo: "sconto20" } },
  // One shot, nessun canone: si paga per l'intervento, non per il tempo.
  "supporto-audit": { unaTantum: 390 },
};

/** Canoni all'euro; annuali alla decina. */
function scala(base: number, dim: Exclude<Dimensione, "grande">, decina = false) {
  const v = base * MULTIPLIER[dim];
  return decina ? Math.round(v / 10) * 10 : Math.round(v);
}

const eur = (n: number) => n.toLocaleString("it-IT");

export type PrezzoDettaglio = {
  /** Canone mensile del primo anno, scalato per fascia (€/mese). */
  mensile: number;
  /** Unica soluzione annuale del primo anno (−10% già incluso). */
  annuale: number;
  /** Euro risparmiati scegliendo l'annuale (12 × mensile − annuale). */
  risparmio: number;
  /** Canone mensile dal 2° anno. */
  rinnovoMensile: number;
  /** Perché il rinnovo costa meno. */
  rinnovoTipo: "mantenimento" | "sconto20";
};

/** Prezzi per servizio e dimensione. `null` = su richiesta (fascia grande). */
export function prezzoDettaglio(
  slug: string,
  dim: Dimensione,
): PrezzoDettaglio | null {
  const v = LISTINO[slug];
  if (!v || isOneShot(v) || dim === "grande") return null;
  const mensile = scala(v.mensile, dim);
  const annuale = scala(v.annuale, dim, true);
  const rinnovoMensile =
    v.rinnovo.tipo === "mantenimento"
      ? scala(v.rinnovo.mensile, dim)
      : Math.round(mensile * 0.8);
  return {
    mensile,
    annuale,
    risparmio: mensile * 12 - annuale,
    rinnovoMensile,
    rinnovoTipo: v.rinnovo.tipo,
  };
}

/** Il servizio si paga una tantum, senza canone? (es. supporto all'audit) */
export function isUnaTantum(slug: string): boolean {
  const v = LISTINO[slug];
  return !!v && isOneShot(v);
}

/** Importo una tantum scalato per fascia. `null` se non è un one-shot o se
 *  la fascia è "grande" (sempre su richiesta). */
export function prezzoUnaTantum(slug: string, dim: Dimensione): number | null {
  const v = LISTINO[slug];
  if (!v || !isOneShot(v) || dim === "grande") return null;
  return scala(v.unaTantum, dim);
}

/** Riga del ciclo di vita per card e riepiloghi (§12.Q). */
export function rinnovoLabel(slug: string, dim: Dimensione): string | null {
  const p = prezzoDettaglio(slug, dim);
  if (!p) return null;
  return p.rinnovoTipo === "mantenimento"
    ? `dal 2° anno: ${eur(p.rinnovoMensile)} €/mese`
    : `dal 2° anno: ${eur(p.rinnovoMensile)} €/mese (−20% al rinnovo: i tuoi dati sono già nel Motore)`;
}

/** Nota sempre presente accanto al ciclo di vita (§12.Q.c). */
export const RINNOVO_LIBERO =
  "Rinnovi solo se vuoi: nessun vincolo dopo i primi 12 mesi.";

/** Etichetta compatta del prezzo per formula scelta (es. nel riepilogo). */
export function prezzoLabel(
  slug: string,
  dim: Dimensione,
  formula: Formula,
): string | null {
  const unaTantum = prezzoUnaTantum(slug, dim);
  if (unaTantum !== null) return `${eur(unaTantum)} € una tantum`;
  const p = prezzoDettaglio(slug, dim);
  if (!p) return null;
  return formula === "mensile"
    ? `${eur(p.mensile)} €/mese`
    : `${eur(p.annuale)} €/anno`;
}

/** Etichetta "da X €/mese" (o "da X € una tantum") per la vetrina, fascia micro. */
export function prezzoDa(slug: string): string | null {
  const v = LISTINO[slug];
  if (!v) return null;
  return isOneShot(v)
    ? `da ${eur(v.unaTantum)} € una tantum`
    : `da ${eur(v.mensile)} €/mese`;
}

/** Ciclo di vita in fascia micro, per le card della vetrina. */
export function rinnovoDa(slug: string): string | null {
  return rinnovoLabel(slug, "micro");
}

/** Micro-copy dell'aggancio sartoriale per la fascia grande (SPEC §12.X). */
export const GRANDE_IMPRESA = {
  copy: "Grande impresa? Percorsi su misura: parliamone.",
  cta: "Parliamone",
  href: "mailto:info@verzero.it?subject=Percorsi%20su%20misura%20%E2%80%94%20grande%20impresa",
};
