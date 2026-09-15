/**
 * IL CONTRASTO SECONDO WCAG 2.1 — una funzione, per il sito e per i documenti.
 *
 * Lo stesso calcolo di `scripts/controllo-contrasti.mjs`, che sorveglia la
 * palette del sito prima di ogni build. Qui serve ai documenti generati:
 * il colore d'accento che sceglie il cliente passa da questa funzione
 * prima di finire su un titolo stampato. Lo script resta autonomo di
 * proposito — gira nel `prebuild` con Node nudo, senza risolutore
 * TypeScript — e `scripts/test-elaborato.mjs` verifica che i due calcoli
 * diano lo stesso numero sulle stesse coppie: due formule che divergono
 * sarebbero due verità sullo stesso colore.
 */

const HEX = /^#?([0-9a-f]{6})$/i;

export function hexValido(valore: string): boolean {
  return HEX.test(valore.trim());
}

/** «#1a2b3c» → «#1A2B3C». Restituisce null per tutto ciò che non è un colore a sei cifre. */
export function normalizzaHex(valore: string): string | null {
  const m = HEX.exec(valore.trim());
  return m ? `#${m[1].toUpperCase()}` : null;
}

export function rgbDi(hex: string): [number, number, number] {
  const n = (normalizzaHex(hex) ?? "#000000").slice(1);
  return [0, 2, 4].map((i) => parseInt(n.slice(i, i + 2), 16)) as [number, number, number];
}

const canale = (c: number) => {
  const s = c / 255;
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
};

/** Luminanza relativa, da 0 (nero) a 1 (bianco). */
export function luminanza(hex: string): number {
  const [r, g, b] = rgbDi(hex);
  return luminanzaRgb(r, g, b);
}

export function luminanzaRgb(r: number, g: number, b: number): number {
  return 0.2126 * canale(r) + 0.7152 * canale(g) + 0.0722 * canale(b);
}

/** Il rapporto di contrasto fra due colori: da 1 a 21. */
export function contrasto(a: string, b: string): number {
  const la = luminanza(a);
  const lb = luminanza(b);
  const [chiaro, scuro] = la > lb ? [la, lb] : [lb, la];
  return (chiaro + 0.05) / (scuro + 0.05);
}

/** Le soglie WCAG 2.1 AA. */
export const SOGLIE = {
  /** Testo di corpo. */
  testo: 4.5,
  /** Testo grande (da 24 px, o 19 px in grassetto) e segni non testuali. */
  grande: 3,
} as const;

/** Un colore scritto per esteso, con due decimali: «4,52:1». */
export function rapportoLeggibile(r: number): string {
  return `${r.toLocaleString("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}:1`;
}
