/**
 * CHE COSA MANCA PER CONSEGNARE — detto a chi deve rimediare.
 *
 * Il controllo di conformità di `elaborati.ts` restituisce frasi, ed è
 * giusto così per le prove di estendibilità. Il cliente però deve vedere
 * «esattamente cosa serve per completare»: che cosa, dove, e chi lo fa.
 * Una mancanza che il cliente non può risolvere — una sezione che la
 * piattaforma non sa ancora comporre, una norma ritirata da aggiornare
 * nel modello — non gli va proposta come un compito: gli si dice che è
 * nostra.
 */

import type { Dichiarazione } from "./dichiarazioni";

export type ChiRimedia =
  /** Può farlo l'impresa: confermare, caricare, completare la scheda. */
  | "impresa"
  /** Tocca a noi: modello, registro, composizione. */
  | "verzero";

export type TipoMancanza =
  | "sezione-vuota"
  | "sezione-mancante"
  | "dato-da-confermare"
  | "dato-mancante"
  | "documento-mancante"
  | "periodo-scoperto"
  | "periodo-sovrapposto"
  | "fuori-esercizio"
  | "fattore-mancante"
  | "valore-non-calcolabile"
  | "norma-ritirata"
  | "norma-non-registrata"
  | "versione-superata"
  | "valore-senza-fonte"
  | "fonte-non-confermata"
  | "segnaposto"
  | "composizione-non-disponibile"
  | "dichiarazione-contraddetta";

export type Mancanza = {
  tipo: TipoMancanza;
  chi: ChiRimedia;
  /** La sezione del documento a cui si riferisce, quando c'è. */
  sezione?: string;
  /** Che cosa manca, in una frase che si capisce senza il resto della pagina. */
  messaggio: string;
  /** Che cosa fare, detto come un'azione. */
  rimedio: string;
  /** Dove farlo nel portale. */
  azione?: { etichetta: string; href: string };
  /** La dichiarazione che il cliente può rendere lì, quando è quella il rimedio. */
  dichiarazione?: Dichiarazione;
};

/** Le mancanze uguali si dicono una volta: la stessa bolletta da confermare non è tre compiti. */
export function senzaDoppioni(mancanze: Mancanza[]): Mancanza[] {
  const viste = new Set<string>();
  return mancanze.filter((m) => {
    const chiave = `${m.tipo}|${m.sezione ?? ""}|${m.messaggio}`;
    if (viste.has(chiave)) return false;
    viste.add(chiave);
    return true;
  });
}

/** Prima quelle che l'impresa può risolvere: sono le uniche su cui può agire adesso. */
export function ordinaMancanze(mancanze: Mancanza[]): Mancanza[] {
  return [...mancanze].sort((a, b) =>
    a.chi === b.chi ? 0 : a.chi === "impresa" ? -1 : 1,
  );
}
