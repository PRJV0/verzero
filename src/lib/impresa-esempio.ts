/**
 * L'IMPRESA D'ESEMPIO DEL SITO PUBBLICO — fonte unica.
 *
 * REGOLA (CLAUDE.md): nelle vetrine, nelle infografiche e in ogni grafica
 * del sito pubblico si usano SOLO imprese dichiaratamente inventate, con
 * la parola «esempio» visibile accanto. Mai il nome di un'azienda reale,
 * nemmeno come segnaposto: sarebbe un dato personale pubblicato senza
 * base giuridica. E mai un dato letto dal database.
 *
 * Stava dentro un componente, che è il posto sbagliato per un dato che
 * ora compare in più grafiche: due copie diventano due nomi diversi.
 */
export const IMPRESA_ESEMPIO = {
  nome: "Officina Lombardi S.r.l.",
  /* Formato plausibile ma volutamente NON valido: undici cifre con una
     lettera in mezzo. Una partita IVA formalmente corretta potrebbe
     appartenere a qualcuno per caso. */
  piva: "IT 0499X881207",
} as const;
