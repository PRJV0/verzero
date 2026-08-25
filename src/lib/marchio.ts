import { SITO } from "@/lib/seo";

/**
 * LE PROPORZIONI DEL LOCKUP — fonte unica, e sono numeri MISURATI.
 *
 * ═══ PERCHÉ STANNO IN UN FILE DI DATI ═══
 * Il lockup non si ricompone a mano: chi ne serve uno chiama il
 * componente (`src/components/brand/marchio.tsx`), e chi ne esporta un
 * file lo genera da qui (`scripts/esporta-marchio.mjs`). Se le
 * proporzioni vivessero dentro il componente, il file SVG scaricabile
 * sarebbe una seconda versione del marchio destinata a divergere alla
 * prima correzione — che è esattamente il modo in cui un'identità si
 * sfalda.
 *
 * ═══ DA DOVE VENGONO I NUMERI ═══
 * Non da un disegno: dalle metriche dei due caratteri della pagina,
 * lette nel browser con Fraunces e Inter davvero caricati.
 *
 *   Fraunces 600   maiuscole 0,70   asta 0,1525   «Verzer» 3,1772 em
 *   Inter 500      maiuscole 0,7275
 *
 * E soprattutto le due LINEE DI BASE, che sono la parte che l'aritmetica
 * sbagliava. Calcolarle dalle metriche del carattere (mezza interlinea
 * più ascendente) dava 0,860 e 0,865: il browser ne mette una a 0,8583 e
 * l'altra a 0,8344, perché per la scatola di riga usa metriche sue e non
 * quelle che il canvas riporta. Cinque millesimi di em: a 60 px un terzo
 * di pixel, a 300 px un pixel e mezzo di zero che sfonda sotto il
 * payoff. Qui stanno i numeri LETTI, non quelli dedotti.
 *
 * Tutto il resto è aritmetica su queste quattro righe, e
 * `scripts/test-marchio.mjs` la rifà da capo a ogni esecuzione: se
 * qualcuno cambia un numero senza cambiare gli altri, il controllo se ne
 * accorge invece di lasciare un lockup storto di mezzo pixel.
 *
 * L'unità è l'EM DEL LOGOTIPO: il lockup è un oggetto a proporzioni
 * fisse, quindi vale a ogni misura e non ha una versione «grande» e una
 * «piccola».
 */

/* ------------------------------------------------------------------ */
/* Le metriche misurate                                                */
/* ------------------------------------------------------------------ */

const FRAUNCES = { maiuscole: 0.7, asta: 0.1525 };
const INTER = { maiuscole: 0.7275 };

/**
 * Le linee di base, dal bordo alto della rispettiva scatola di riga,
 * con interlinea 1. Misurate nel browser con una sonda a larghezza zero
 * allineata alla linea di base — l'unico modo di leggerla, perché
 * nessuna API la espone.
 */
const BASE_NOME = 0.8583;
const BASE_PAYOFF_LOCALE = 0.8344;

/** «Verzer» in Fraunces 600 a corpo 1, senza lo zero finale. */
const LARGHEZZA_NOME = 3.1772;

/* ------------------------------------------------------------------ */
/* Il payoff della riga 2                                              */
/* ------------------------------------------------------------------ */

/**
 * IL PAYOFF NEL LOCKUP finisce con «in tempo», non con «in tempo Zero».
 *
 * Non è un payoff diverso: è lo stesso, e l'ultima parola è lo zero
 * disegnato che chiude la riga. Scriverla anche a lettere vorrebbe dire
 * dirla due volte — «in tempo Zero 0» — e il gioco che tiene insieme la
 * composizione si romperebbe.
 *
 * `completo` resta la forma da leggere ad alta voce e da mettere
 * nell'etichetta accessibile: chi non vede il disegno deve sentire il
 * payoff intero, non la sua metà.
 */
export const PAYOFF_LOCKUP = {
  /** Quello che si legge sulla riga 2. */
  riga: "AZIENDA A NORMA IN TEMPO",
  /** Il payoff per esteso, dalla fonte unica dell'identità. */
  get completo() {
    return SITO.payoff;
  },
  /** Corpo della riga 2, in em del logotipo. */
  scala: 0.18,
  peso: 500,
  /**
   * La crenatura che porta la riga 2 alla larghezza esatta della riga 1,
   * in em del PAYOFF. Ventitré intervalli e non ventiquattro: l'ultimo,
   * quello dopo la «O» finale, il componente lo riprende con un rientro
   * negativo, altrimenti l'inchiostro finirebbe prima del bordo.
   */
  tracking: 0.1348,
  /**
   * Il vuoto che la crenatura lascia DOPO l'ultima lettera, in em del
   * logotipo. La crenatura CSS si aggiunge anche in coda, e quel vuoto
   * fa parte della scatola: va aggiunto alla larghezza dichiarata,
   * altrimenti l'inchiostro finisce uno spazio prima del bordo e le due
   * righe non terminano sulla stessa verticale.
   */
  get codaCrenatura() {
    return this.tracking * this.scala;
  },
} as const;

/* ------------------------------------------------------------------ */
/* La composizione                                                     */
/* ------------------------------------------------------------------ */

/** Interlinea delle due righe: 1, così la scatola è alta quanto il corpo. */
const INTERLINEA = 1;

/**
 * Lo stacco fra la linea di base del nome e l'altezza delle maiuscole
 * del payoff. È l'unico numero scelto e non calcolato: 0,13 em è la
 * distanza a cui le due righe si leggono come un blocco solo senza che
 * il payoff sembri appiccicato sotto al nome.
 */
const STACCO_OTTICO = 0.13;

/** Rientro verticale della riga 2 rispetto al flusso, in em del logotipo. */
const STACCO_PAYOFF =
  STACCO_OTTICO -
  (INTERLINEA - BASE_NOME) -
  (BASE_PAYOFF_LOCALE - INTER.maiuscole) * PAYOFF_LOCKUP.scala;

/** Linea di base del payoff, dal bordo alto della composizione. */
const BASE_PAYOFF_ASSOLUTA =
  INTERLINEA + STACCO_PAYOFF + BASE_PAYOFF_LOCALE * PAYOFF_LOCKUP.scala;

/** Altezza delle maiuscole della riga 1, dal bordo alto. */
const CIMA_MAIUSCOLE = BASE_NOME - FRAUNCES.maiuscole;

/**
 * LO SPESSORE DELLO ZERO non cresce con lo zero.
 *
 * È lo stesso tratto del logotipo, in em: 4/40 della scatola dello zero
 * canonico per la sua altezza di 0,82 em. Non è un'approssimazione ed è
 * l'unica lettura possibile di «coerente con il logotipo»: è LO STESSO
 * tratto, quindi il segno resta identico fra intestazione e lockup.
 *
 * Vale la pena scrivere perché NON si scala con l'ellisse. Il tratto è
 * 0,082 em contro un'asta di Fraunces 600 di 0,1525: poco più della
 * metà. Sembra poco finché non si guarda una «O» con grazie, che ha i
 * fianchi spessi e le curve alte e basse sottili — una monolinea alla
 * larghezza dell'asta peserebbe quasi il doppio della media di quella
 * lettera. Ingrandito, lo zero del lockup sembra più leggero di quello
 * dell'intestazione: è vero, ed è un effetto ottico della curva più
 * grande, non un errore da correggere. Correggerlo qui vorrebbe dire
 * avere due zeri diversi in due punti del sito.
 */
const TRATTO_ZERO = (4 / 40) * 0.82;

/** Proporzione dell'ellisse canonica: rx/ry dello zero E1. */
const PROPORZIONE_ZERO = 11 / 15;

const ZERO_ALTEZZA = BASE_PAYOFF_ASSOLUTA - CIMA_MAIUSCOLE;
const ZERO_LARGHEZZA =
  (ZERO_ALTEZZA - TRATTO_ZERO) * PROPORZIONE_ZERO + TRATTO_ZERO;

/** Distanza fra il nome e lo zero, la stessa del logotipo semplice. */
const DISTANZA_ZERO = 0.05;

export const LOCKUP = {
  larghezzaNome: LARGHEZZA_NOME,
  interlineaNome: INTERLINEA,
  interlineaPayoff: INTERLINEA,
  staccoPayoff: STACCO_PAYOFF,
  distanzaZero: DISTANZA_ZERO,

  zeroAltezza: ZERO_ALTEZZA,
  zeroLarghezza: ZERO_LARGHEZZA,
  zeroTratto: TRATTO_ZERO,
  /** Da dove parte lo zero: l'altezza delle maiuscole della riga 1. */
  zeroDaSopra: CIMA_MAIUSCOLE,

  /* — Le due linee di base misurate DALLA CIMA DELL'INCHIOSTRO. Servono
       al disegno in SVG, dove si posiziona una linea di base e non una
       scatola di riga: lì il vuoto sopra le maiuscole non esiste. — */
  baseNomeDaCima: FRAUNCES.maiuscole,
  basePayoffDaCima: BASE_PAYOFF_ASSOLUTA - CIMA_MAIUSCOLE,

  /** Larghezza dell'inchiostro: nome + stacco + zero. */
  larghezza: LARGHEZZA_NOME + DISTANZA_ZERO + ZERO_LARGHEZZA,
  /** Altezza dell'inchiostro: maiuscole della riga 1 → base del payoff. */
  altezza: ZERO_ALTEZZA,

  /** Vuoto sopra le maiuscole, da recuperare con un margine negativo. */
  vuotoSopra: CIMA_MAIUSCOLE,
  /** Vuoto sotto la linea di base del payoff, idem. */
  vuotoSotto:
    INTERLINEA +
    STACCO_PAYOFF +
    PAYOFF_LOCKUP.scala -
    BASE_PAYOFF_ASSOLUTA,

  /**
   * AREA DI RISPETTO: la larghezza dello zero, su tutti e quattro i lati.
   * Non è un numero tondo scelto per comodità — è una misura che sta
   * DENTRO il marchio, quindi resta giusta a qualunque scala e non ha
   * bisogno di essere ricalcolata da chi impagina.
   */
  respiro: ZERO_LARGHEZZA,

  /**
   * SOTTO QUESTA MISURA si usa la variante semplice.
   *
   * Il payoff sta a 0,18 em del logotipo: a 56 px il logotipo lo porta a
   * ~10 px, che con quella crenatura è ancora una riga che si legge.
   * Sotto, diventa un grigio con dentro delle forme — e un payoff che
   * non si legge non è un marchio più piccolo, è sporcizia intorno al
   * marchio. Il componente non lo mostra: cambia variante da solo.
   */
  minimaPx: 56,
} as const;

/**
 * QUALE VARIANTE ESCE DAVVERO.
 *
 * La regola della misura minima sta qui e non dentro il componente
 * perché una regola dentro un componente React non si può provare senza
 * montare React: e una regola che non si prova è una regola che qualcuno
 * toglie senza accorgersene. `scripts/test-marchio.mjs` la esercita.
 */
export function variantePer(
  richiesta: "semplice" | "estesa",
  dimensione?: number,
): "semplice" | "estesa" {
  if (richiesta === "semplice") return "semplice";
  return (dimensione ?? 0) >= LOCKUP.minimaPx ? "estesa" : "semplice";
}
