/**
 * I TESTI DELLA FASE — fonte unica.
 *
 * Sono decisi dal fondatore e vanno alla lettera: dicono una cosa
 * scomoda — apriamo a poche imprese alla volta — e la trasformano nella
 * ragione per lasciare il contatto. Non toccarli senza il suo assenso.
 *
 * Stavano dentro `lista-attesa.tsx`, che è un componente client. Da
 * quando le stesse parole servono anche accanto al prezzo in home e nel
 * catalogo — due pagine renderizzate sul server — importarle da lì
 * avrebbe trascinato il modulo client in pagine che non ne hanno
 * bisogno. Qui non trascinano niente.
 */
export const TESTI_ATTESA = {
  titolo: "Apriamo a poche imprese alla volta.",
  testo:
    "Vogliamo che ogni impresa parta con il percorso costruito bene. Lascia il tuo contatto: ti avvisiamo quando tocca a te — con le condizioni fondatori riservate ai primi.",
  pulsante: "Voglio esserci",
  conferma:
    "Ci sei. Ti scriviamo noi quando apriamo il tuo turno — niente newsletter, niente promozioni.",
} as const;
