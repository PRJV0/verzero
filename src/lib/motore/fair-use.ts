/**
 * I LIMITI DI USO CORRETTO — in documenti, non in dollari.
 *
 * ═══ DUE COSE DIVERSE, DA NON CONFONDERE ═══
 * I TETTI TECNICI (`tetti.ts`) sono in valuta, invisibili al cliente, e
 * servono a fermare un DIFETTO — un ciclo impazzito, un PDF da
 * quattrocento pagine. Questi limiti sono un'altra cosa: sono
 * CONTRATTUALI, stanno nelle condizioni di servizio, si contano in unità
 * che una persona capisce, e servono a dare al costo variabile un tetto
 * certo per il modello economico.
 *
 * Un cliente non deve mai leggere «hai speso 14 dollari». Può benissimo
 * leggere «hai elaborato 38 documenti dei 150 inclusi»: il primo è un
 * conto nostro, il secondo è una misura del suo lavoro.
 *
 * ═══ CALIBRAZIONE ═══
 * L'uso reale misurato è di circa 25 documenti e poche generazioni per
 * pratica. I limiti stanno a un multiplo largo — sei volte i documenti,
 * sette volte le generazioni — perché il loro scopo NON è razionare:
 * è mettere un tetto all'ipotesi peggiore. Un limite che un cliente
 * normale sfiora è un limite tarato male, e va rialzato invece di essere
 * difeso.
 *
 * ═══ MAI UN BLOCCO MUTO, MAI UNA COLPA ═══
 * Il superamento è a gradini e il servizio non si ferma mai da solo:
 * prima si continua normalmente, poi in differita, poi si parla. Nessun
 * messaggio dice o lascia intendere che il cliente abbia fatto qualcosa
 * di sbagliato — sta usando un servizio che ha pagato.
 */

/**
 * L'unità di misura è il PERCORSO ATTIVO per ANNO DI RENDICONTAZIONE.
 *
 * La dotazione è per percorso ma si conta in comune sull'organizzazione:
 * chi ha tre percorsi ha tre dotazioni, e le usa dove gli servono. È più
 * generoso e più semplice da spiegare — e soprattutto è più vero, perché
 * una bolletta caricata una volta alimenta più percorsi insieme.
 */
export const FAIR_USE = {
  documenti: {
    /** Compresi nel canone. Sotto questo, tutto normale. */
    inclusi: 150,
    /** Oltre, si continua in elaborazione differita. */
    differita: 300,
    unita: "documenti elaborati",
  },
  generazioni: {
    // Venti l'anno è quasi due al mese: una cadenza che nessuno tiene
    // davvero, tanto più che rigenerare senza cambiamenti non consuma
    // nulla — si riapre la versione che c'è (riuso.ts).
    inclusi: 20,
    differita: 40,
    unita: "generazioni di elaborato",
  },
} as const;

/** L'uso reale misurato, che è la ragione per cui i limiti stanno lì. */
export const USO_TIPICO = { documenti: 25, generazioni: 3 };

export type Consumo = { documenti: number; generazioni: number };

export type LivelloUso = "normale" | "differita" | "contatto";

export type StatoUso = {
  livello: LivelloUso;
  /** La dotazione effettiva, dati i percorsi attivi. */
  dotazione: Consumo;
  usato: Consumo;
  /** Quanto della dotazione è consumato, da 0 a 1 (può superare 1). */
  quota: number;
  /** Che cosa ha fatto scattare il gradino, se è scattato. */
  causa?: "documenti" | "generazioni";
};

/**
 * Lo stato dell'uso. Puro: i conteggi arrivano da fuori, così la
 * decisione si prova senza banca dati.
 *
 * Un'organizzazione senza percorsi attivi ha comunque una dotazione:
 * chi sta valutando il servizio deve poter caricare qualcosa senza
 * sbattere contro un muro al primo documento.
 */
export function statoUso(usato: Consumo, percorsiAttivi: number): StatoUso {
  const n = Math.max(1, percorsiAttivi);
  const dotazione = {
    documenti: FAIR_USE.documenti.inclusi * n,
    generazioni: FAIR_USE.generazioni.inclusi * n,
  };
  const soglia2 = {
    documenti: FAIR_USE.documenti.differita * n,
    generazioni: FAIR_USE.generazioni.differita * n,
  };

  const quota = Math.max(
    usato.documenti / dotazione.documenti,
    usato.generazioni / dotazione.generazioni,
  );

  if (usato.documenti > soglia2.documenti) {
    return { livello: "contatto", dotazione, usato, quota, causa: "documenti" };
  }
  if (usato.generazioni > soglia2.generazioni) {
    return { livello: "contatto", dotazione, usato, quota, causa: "generazioni" };
  }
  if (usato.documenti > dotazione.documenti) {
    return { livello: "differita", dotazione, usato, quota, causa: "documenti" };
  }
  if (usato.generazioni > dotazione.generazioni) {
    return { livello: "differita", dotazione, usato, quota, causa: "generazioni" };
  }
  return { livello: "normale", dotazione, usato, quota };
}

/* ------------------------------------------------------------------ */
/* Che cosa legge il cliente                                           */
/* ------------------------------------------------------------------ */

/**
 * I messaggi dei gradini.
 *
 * Regole di scrittura, non negoziabili:
 * - nessuna colpa: «stai usando molto» e non «hai superato»;
 * - nessuna cifra in valuta, mai;
 * - sempre che cosa succede adesso, non solo che cosa è successo;
 * - il gradino «contatto» è un invito a parlare, non un blocco: il
 *   lavoro già in corso non si ferma.
 */
export const MESSAGGI_USO: Record<LivelloUso, string | null> = {
  normale: null,
  differita:
    "Stai elaborando parecchio: da qui in avanti le letture entrano in coda e arrivano un po' più tardi, ma arrivano tutte. Non devi fare nulla.",
  contatto:
    "Hai un volume di lavoro sopra la media: sentiamoci per capire come proseguire al meglio — probabilmente c'è un modo più comodo di gestirlo. Intanto quello che hai in corso continua.",
};

/** Il contatore discreto in portale: un numero, senza allarmi. */
export function etichettaContatore(stato: StatoUso): string {
  return `${stato.usato.documenti} documenti elaborati su ${stato.dotazione.documenti} compresi`;
}

/* ------------------------------------------------------------------ */
/* Il caso peggiore, per il modello economico                          */
/* ------------------------------------------------------------------ */

/**
 * Il costo massimo che un percorso può generare prima che qualcuno ci
 * parli. È il numero che serve al piano economico: oltre questo, il
 * costo non cresce da solo — cresce solo dopo una conversazione.
 *
 * I costi unitari sono MISURATI (docs/motore.md §7), non stimati.
 */
export const COSTO_UNITARIO_MICRO = {
  /** Lettura di un documento, misurata: scheda $0,051, tabella $0,068. */
  documento: 68_000,
  /** Generazione di un elaborato, ancora stimata. */
  generazione: 480_000,
};

export function casoPeggiore(percorsi = 1): {
  documenti: number;
  generazioni: number;
  costoMicro: number;
} {
  const documenti = FAIR_USE.documenti.differita * percorsi;
  const generazioni = FAIR_USE.generazioni.differita * percorsi;
  return {
    documenti,
    generazioni,
    costoMicro:
      documenti * COSTO_UNITARIO_MICRO.documento +
      generazioni * COSTO_UNITARIO_MICRO.generazione,
  };
}
