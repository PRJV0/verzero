/**
 * Validazione formale della Partita IVA italiana: 11 cifre + carattere di
 * controllo secondo l'algoritmo ufficiale (variante Luhn: le cifre in
 * posizione pari — 2ª, 4ª, … — si raddoppiano e, se il risultato supera 9,
 * si sottrae 9; l'ultima cifra rende la somma un multiplo di 10).
 * È una validazione FORMALE: l'esistenza reale si verifica dalle banche
 * dati camerali dopo l'acquisto (SPEC §13.7).
 */
export function validaPartitaIva(raw: string): boolean {
  const piva = raw.replace(/\s/g, "");
  if (!/^\d{11}$/.test(piva)) return false;
  let somma = 0;
  for (let i = 0; i < 11; i++) {
    let n = piva.charCodeAt(i) - 48;
    if (i % 2 === 1) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    somma += n;
  }
  return somma % 10 === 0;
}

/** Requisiti password mostrati nel form (tutti obbligatori). */
export const PASSWORD_REGOLE: { label: string; test: (p: string) => boolean }[] =
  [
    { label: "Almeno 8 caratteri", test: (p) => p.length >= 8 },
    { label: "Una lettera maiuscola", test: (p) => /[A-Z]/.test(p) },
    { label: "Una lettera minuscola", test: (p) => /[a-z]/.test(p) },
    { label: "Un numero", test: (p) => /\d/.test(p) },
  ];

export function passwordValida(p: string): boolean {
  return PASSWORD_REGOLE.every((r) => r.test(p));
}
