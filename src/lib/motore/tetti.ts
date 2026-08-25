/**
 * I TETTI DI SPESA (docs/motore.md §7).
 *
 * ═══ LA REGOLA CHE VIENE PRIMA DI TUTTE ═══
 * I tetti sono INVISIBILI AL CLIENTE. Nessun messaggio in pagina dice
 * «hai superato il limite», nessuna barra di consumo, nessuna quota. Un
 * cliente che paga un canone non deve sapere quanto ci costa leggere i
 * suoi documenti, e soprattutto non deve regolarci sopra il proprio
 * lavoro. Il tetto è un dispositivo di sicurezza NOSTRO: serve a fermare
 * un difetto — un ciclo impazzito, un PDF di quattrocento pagine caricato
 * per sbaglio, un cliente con un archivio dieci volte più grande della
 * media — prima che diventi una fattura.
 *
 * Quando scatta, il cliente vede un messaggio di attesa onesto («ci
 * stiamo mettendo più del previsto, riprova più tardi»), e il back-office
 * vede l'allarme con i numeri. **Mai attribuire all'ambiente, alla
 * prudenza o al servizio un limite che è di budget**: sarebbe una bugia,
 * e le bugie sul perché di un blocco sono quelle che si scoprono.
 *
 * Tutti gli importi sono in MILIONESIMI DI DOLLARO, interi, come nel log
 * tecnico: sommare centinaia di migliaia di frazioni decimali deriva.
 */

/** Un dollaro, nell'unità in cui il Motore conta. */
export const DOLLARO = 1_000_000;

export type Ambito = "pratica" | "organizzazione" | "giorno";

export type Tetto = {
  ambito: Ambito;
  /** Oltre questo si avvisa il back-office, e si continua. */
  soglia: number;
  /** Oltre questo ci si ferma. */
  tetto: number;
  /** Perché è tarato così: senza, fra sei mesi nessuno saprà rivederlo. */
  perche: string;
};

/**
 * I tetti, tarati su due numeri misurati e su uno contrattuale.
 *
 * Misurati (docs/motore.md §7): una lettura costa $0,05–$0,07, una
 * pratica tipica da venticinque documenti sta attorno a $3.
 *
 * Contrattuale: i limiti di uso corretto (`fair-use.ts`) fermano un
 * percorso a 300 documenti e 24 generazioni l'anno, cioè **$31,92**.
 *
 * ═══ IL RAPPORTO FRA I DUE, CHE È LA COSA IMPORTANTE ═══
 * Un tetto tecnico più basso del caso peggiore contrattuale fermerebbe
 * un cliente che sta usando esattamente ciò che ha comprato — e lo
 * fermerebbe in silenzio, con un messaggio d'attesa. Sarebbe il modo
 * peggiore di rompere una promessa. Quindi i tetti tecnici stanno SOPRA
 * il limite contrattuale, con margine: a quel punto non sono più una
 * misura di consumo — sono un rilevatore di anomalie, che è tutto ciò
 * che devono essere. Chi consuma tanto lo ferma il contratto, con una
 * telefonata; chi ha un difetto lo ferma il tetto, con un allarme.
 */
export const TETTI: Record<Ambito, Tetto> = {
  pratica: {
    ambito: "pratica",
    // Allarme basso di proposito: a $3 siamo appena sopra la pratica
    // tipica, e le anomalie si vedono prima che diventino costose.
    soglia: 3 * DOLLARO,
    tetto: 60 * DOLLARO,
    perche:
      "Una pratica tipica costa circa $3. L'allarme scatta lì per accorgersi subito di ciò che è insolito. Il blocco sta a $60, sopra il caso peggiore contrattuale di $39,60: sotto quella cifra un cliente sta usando ciò che ha comprato, e fermarlo sarebbe rompere una promessa.",
  },
  organizzazione: {
    ambito: "organizzazione",
    soglia: 30 * DOLLARO,
    tetto: 250 * DOLLARO,
    perche:
      "Un cliente con quattro percorsi ha un caso peggiore contrattuale di circa $158 all'anno, che potrebbe concentrare in un mese solo. Il blocco a $250 lascia il doppio di margine: oltre, non è più un cliente esigente.",
  },
  giorno: {
    ambito: "giorno",
    soglia: 60 * DOLLARO,
    tetto: 400 * DOLLARO,
    perche:
      "È la rete di sicurezza sull'intero servizio: protegge da un difetto che colpisce tutti insieme, non da un cliente esigente. Va rialzato quando i clienti crescono — è l'unico tetto che dipende dal loro numero e non dal loro comportamento.",
  },
};

/** La finestra su cui si somma la spesa, per ambito. */
export const FINESTRA: Record<Ambito, "sempre" | "mese" | "giorno"> = {
  // La pratica è un lavoro con un inizio e una fine: si somma tutto.
  pratica: "sempre",
  organizzazione: "mese",
  giorno: "giorno",
};

export type Verdetto =
  | { esito: "procedi" }
  | { esito: "avvisa"; ambito: Ambito; speso: number; tetto: Tetto }
  | { esito: "ferma"; ambito: Ambito; speso: number; tetto: Tetto };

/**
 * Il verdetto, dato lo speso per ambito. Pura: la lettura dei numeri sta
 * altrove, così questa si prova senza banca dati.
 *
 * Si ferma al PRIMO tetto superato, e l'ordine non è casuale: prima il
 * giorno (un difetto che colpisce tutti), poi l'organizzazione, poi la
 * pratica. Fermare per il tetto più generale è più informativo — dice che
 * il problema non è di quel cliente.
 */
export function verdettoSpesa(speso: Record<Ambito, number>): Verdetto {
  const ordine: Ambito[] = ["giorno", "organizzazione", "pratica"];

  for (const ambito of ordine) {
    const t = TETTI[ambito];
    if (speso[ambito] >= t.tetto) {
      return { esito: "ferma", ambito, speso: speso[ambito], tetto: t };
    }
  }
  for (const ambito of ordine) {
    const t = TETTI[ambito];
    if (speso[ambito] >= t.soglia) {
      return { esito: "avvisa", ambito, speso: speso[ambito], tetto: t };
    }
  }
  return { esito: "procedi" };
}

/**
 * Che cosa vede il CLIENTE quando un tetto ferma il lavoro.
 *
 * Non è una spiegazione parziale: è un'altra cosa. Il cliente non ha
 * bisogno di sapere che esiste un tetto, ha bisogno di sapere che cosa
 * fare adesso. E dev'essere vero: la lettura è davvero rimandata, il
 * documento è davvero al sicuro, e qualcuno la guarda davvero — perché
 * l'allarme in back-office lo garantisce.
 */
export const MESSAGGIO_AL_CLIENTE =
  "La lettura di questo documento è in coda e riprende a breve: il file è al sicuro in archivio e non devi rifare nulla. Se fra qualche ora è ancora qui, scrivici e ce ne occupiamo noi.";

/** Che cosa vede il BACK-OFFICE: i numeri, e da dove viene il problema. */
export function notaAllarme(v: Exclude<Verdetto, { esito: "procedi" }>): string {
  const euro = (n: number) => `$${(n / DOLLARO).toFixed(2)}`;
  const dove =
    v.ambito === "pratica"
      ? "questa pratica"
      : v.ambito === "organizzazione"
        ? "questa organizzazione nel mese"
        : "l'intero servizio oggi";
  return v.esito === "ferma"
    ? `FERMATO: ${dove} ha speso ${euro(v.speso)}, oltre il tetto di ${euro(v.tetto.tetto)}. ${v.tetto.perche}`
    : `Soglia superata: ${dove} ha speso ${euro(v.speso)}, oltre la soglia di ${euro(v.tetto.soglia)}. Si continua, ma vale la pena guardare.`;
}
