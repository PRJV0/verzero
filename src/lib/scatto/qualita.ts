/**
 * LA QUALITÀ DI UNO SCATTO, misurata prima di spendere.
 *
 * ═══ PERCHÉ QUI E NON DOPO ═══
 * Una foto mossa o troppo scura la scopre il Motore, ma la scopre dopo
 * aver speso una lettura e dopo aver fatto aspettare il cliente — e la
 * risposta è comunque «rifalla». Misurarla nel browser costa qualche
 * millisecondo e permette di dirlo mentre il telefono è ancora in mano
 * sopra il foglio: **meglio uno scatto in più che un'estrazione
 * sbagliata**.
 *
 * Tutto quello che sta qui dentro è ARITMETICA SU UN VETTORE DI PIXEL:
 * niente canvas, niente DOM, niente browser. È una scelta, non un caso —
 * le soglie che decidono se una foto è leggibile devono potersi provare
 * su immagini costruite apposta, e una funzione che ha bisogno di un
 * browser per girare è una funzione che non si prova.
 */

export type Immagine = {
  /** RGBA, quattro byte per pixel, come `ImageData.data`. */
  dati: Uint8ClampedArray;
  larghezza: number;
  altezza: number;
};

/* ------------------------------------------------------------------ */
/* Grigi, soglia, riduzione                                            */
/* ------------------------------------------------------------------ */

/** Luminanza percepita: il verde pesa più del rosso, il blu quasi nulla. */
export function grigi(img: Immagine): Uint8ClampedArray {
  const out = new Uint8ClampedArray(img.larghezza * img.altezza);
  for (let i = 0, p = 0; p < out.length; i += 4, p++) {
    out[p] = (img.dati[i] * 299 + img.dati[i + 1] * 587 + img.dati[i + 2] * 114) / 1000;
  }
  return out;
}

/**
 * Riduce l'immagine campionando: le misure di qualità non hanno bisogno
 * della risoluzione piena, e su un telefono la differenza fra dieci
 * millisecondi e un secondo è tutta lì.
 */
export function riduci(
  g: Uint8ClampedArray,
  larghezza: number,
  altezza: number,
  latoMax = 400,
): { dati: Uint8ClampedArray; larghezza: number; altezza: number } {
  const passo = Math.max(1, Math.ceil(Math.max(larghezza, altezza) / latoMax));
  if (passo === 1) return { dati: g, larghezza, altezza };

  const w = Math.floor(larghezza / passo);
  const h = Math.floor(altezza / passo);
  const out = new Uint8ClampedArray(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      out[y * w + x] = g[y * passo * larghezza + x * passo];
    }
  }
  return { dati: out, larghezza: w, altezza: h };
}

/**
 * La soglia di Otsu: divide l'istogramma nei due gruppi che minimizzano
 * la varianza interna. Su una foto di un documento separa la carta
 * dall'inchiostro — o il foglio dal tavolo, che è quello che serve al
 * ritaglio.
 */
export function soglia(g: Uint8ClampedArray): number {
  const isto = new Array(256).fill(0);
  for (const v of g) isto[v]++;
  const totale = g.length;

  let somma = 0;
  for (let t = 0; t < 256; t++) somma += t * isto[t];

  let sommaSfondo = 0;
  let pesoSfondo = 0;
  let massimo = 0;
  let migliore = 128;

  for (let t = 0; t < 256; t++) {
    pesoSfondo += isto[t];
    if (pesoSfondo === 0) continue;
    const pesoAvanti = totale - pesoSfondo;
    if (pesoAvanti === 0) break;

    sommaSfondo += t * isto[t];
    const mediaSfondo = sommaSfondo / pesoSfondo;
    const mediaAvanti = (somma - sommaSfondo) / pesoAvanti;
    const varianza =
      pesoSfondo * pesoAvanti * (mediaSfondo - mediaAvanti) ** 2;
    if (varianza > massimo) {
      massimo = varianza;
      migliore = t;
    }
  }
  return migliore;
}

/* ------------------------------------------------------------------ */
/* Dove sta il documento nella foto                                    */
/* ------------------------------------------------------------------ */

export type Riquadro = { x: number; y: number; larghezza: number; altezza: number };

/** Quanta parte di una riga o colonna dev'essere chiara perché sia foglio. */
const FRAZIONE_CHIARA = 0.5;
/** Sotto questa quota del fotogramma, il ritaglio non è affidabile. */
const AREA_MINIMA = 0.12;

/**
 * Il riquadro del documento: si cerca la fascia di righe e colonne in cui
 * prevalgono i pixel chiari, perché un foglio fotografato è quasi sempre
 * più chiaro di ciò che ha intorno.
 *
 * ═══ NEL DUBBIO NON SI RITAGLIA ═══
 * Se il riquadro trovato è minuscolo, o grande quanto tutto il
 * fotogramma, si restituisce `null` e la foto resta intera. Un ritaglio
 * sbagliato taglia via un pezzo di documento SENZA DIRLO — è il danno
 * silenzioso che questo prodotto non si può permettere — mentre un
 * ritaglio mancato costa solo qualche pixel di margine.
 */
export function riquadroDocumento(
  g: Uint8ClampedArray,
  larghezza: number,
  altezza: number,
): Riquadro | null {
  const piccola = riduci(g, larghezza, altezza);
  const t = soglia(piccola.dati);
  const { larghezza: w, altezza: h, dati } = piccola;

  const chiaroPerRiga = new Array(h).fill(0);
  const chiaroPerColonna = new Array(w).fill(0);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (dati[y * w + x] > t) {
        chiaroPerRiga[y]++;
        chiaroPerColonna[x]++;
      }
    }
  }

  const estremi = (profilo: number[], quanti: number) => {
    const minimo = quanti * FRAZIONE_CHIARA;
    let inizio = profilo.findIndex((v) => v >= minimo);
    let fine = profilo.length - 1;
    while (fine >= 0 && profilo[fine] < minimo) fine--;
    if (inizio < 0 || fine < inizio) return null;
    // Un margine di sicurezza: meglio un filo di tavolo che una riga di
    // testo tagliata.
    inizio = Math.max(0, inizio - 1);
    fine = Math.min(profilo.length - 1, fine + 1);
    return [inizio, fine] as const;
  };

  const righe = estremi(chiaroPerRiga, w);
  const colonne = estremi(chiaroPerColonna, h);
  if (!righe || !colonne) return null;

  const scalaX = larghezza / w;
  const scalaY = altezza / h;
  const riquadro: Riquadro = {
    x: Math.round(colonne[0] * scalaX),
    y: Math.round(righe[0] * scalaY),
    larghezza: Math.round((colonne[1] - colonne[0] + 1) * scalaX),
    altezza: Math.round((righe[1] - righe[0] + 1) * scalaY),
  };

  const quota = (riquadro.larghezza * riquadro.altezza) / (larghezza * altezza);
  if (quota < AREA_MINIMA) return null;
  // Occupa quasi tutto: non c'è niente da ritagliare, e dirlo evita di
  // togliere un bordo utile per nulla.
  if (quota > 0.97) return null;

  return riquadro;
}

/* ------------------------------------------------------------------ */
/* Quanto è storta                                                     */
/* ------------------------------------------------------------------ */

/** Oltre questa inclinazione non si cerca: non è più una foto storta. */
export const ANGOLO_MASSIMO = 8;
const PASSO_ANGOLO = 0.5;

/**
 * L'inclinazione del testo, in gradi.
 *
 * Si prova a ruotare l'immagine di poco in poco e si guarda la VARIANZA
 * del profilo orizzontale — quanti pixel scuri per riga. Quando le righe
 * di testo sono dritte, alcune righe di pixel sono piene di inchiostro e
 * altre sono vuote: la varianza è massima. Quando sono storte,
 * l'inchiostro si spalma su tutte le righe e la varianza cala.
 *
 * Positivo = il testo scende verso destra.
 */
export function angoloDiInclinazione(
  g: Uint8ClampedArray,
  larghezza: number,
  altezza: number,
): number {
  const piccola = riduci(g, larghezza, altezza, 300);
  const t = soglia(piccola.dati);
  const { larghezza: w, altezza: h, dati } = piccola;

  let migliore = 0;
  let massimo = -1;

  for (let a = -ANGOLO_MASSIMO; a <= ANGOLO_MASSIMO; a += PASSO_ANGOLO) {
    const rad = (a * Math.PI) / 180;
    const tang = Math.tan(rad);
    const profilo = new Array(h).fill(0);

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (dati[y * w + x] >= t) continue; // solo l'inchiostro
        const y2 = Math.round(y + (x - w / 2) * tang);
        if (y2 >= 0 && y2 < h) profilo[y2]++;
      }
    }

    const media = profilo.reduce((s, v) => s + v, 0) / h;
    const varianza = profilo.reduce((s, v) => s + (v - media) ** 2, 0) / h;
    if (varianza > massimo) {
      massimo = varianza;
      migliore = a;
    }
  }
  // La ricerca trova l'angolo che RADDRIZZA; qui si dichiara quanto il
  // foglio è storto, che è l'opposto. La distinzione conta: chi legge
  // «inclinato di 3°» e chi ruota di −3° devono parlare della stessa
  // cosa, e un segno sbagliato raddrizza al contrario raddoppiando lo
  // storto.
  return -migliore;
}

/* ------------------------------------------------------------------ */
/* Nitidezza e luce                                                    */
/* ------------------------------------------------------------------ */

/**
 * La nitidezza, come varianza del laplaciano: su un'immagine a fuoco i
 * bordi sono ripidi e la derivata seconda è grande; su una mossa tutto è
 * sfumato e la derivata seconda si appiattisce.
 *
 * Non si riduce l'immagine prima: la sfocatura è esattamente ciò che il
 * campionamento nasconderebbe.
 */
export function nitidezza(
  g: Uint8ClampedArray,
  larghezza: number,
  altezza: number,
): number {
  if (larghezza < 3 || altezza < 3) return 0;
  // Un passo di campionamento: si guardano abbastanza punti da avere una
  // statistica, senza percorrere venti milioni di pixel.
  const passo = Math.max(1, Math.floor(Math.max(larghezza, altezza) / 800));
  let somma = 0;
  let sommaQuadrati = 0;
  let n = 0;

  for (let y = 1; y < altezza - 1; y += passo) {
    for (let x = 1; x < larghezza - 1; x += passo) {
      const i = y * larghezza + x;
      const l =
        4 * g[i] - g[i - 1] - g[i + 1] - g[i - larghezza] - g[i + larghezza];
      somma += l;
      sommaQuadrati += l * l;
      n++;
    }
  }
  if (n === 0) return 0;
  const media = somma / n;
  return sommaQuadrati / n - media * media;
}

/** La luminosità media, da 0 (nero) a 255 (bianco). */
export function luminosita(g: Uint8ClampedArray): number {
  let somma = 0;
  for (const v of g) somma += v;
  return somma / g.length;
}

/* ------------------------------------------------------------------ */
/* Il verdetto                                                         */
/* ------------------------------------------------------------------ */

/**
 * LE SOGLIE, e perché stanno lì.
 *
 * Il criterio non è «una bella foto» ma «un testo che si legge».
 */
export const SOGLIE = {
  /**
   * Larghezza minima del DOCUMENTO (non del fotogramma) in pixel.
   *
   * Un A4 è largo 210 mm. Per leggere un carattere da 10 punti servono
   * almeno 150 punti per pollice, cioè 210/25,4 × 150 ≈ **1.240 pixel**
   * sul lato lungo del foglio. Sotto, il testo piccolo si impasta e la
   * lettura comincia a indovinare.
   */
  larghezzaMinima: 1240,
  /**
   * Sotto questa varianza del laplaciano la foto è mossa o fuori fuoco.
   *
   * Tarata misurando, non a occhio: su un documento di prova sfocato a
   * gradini la nitidezza scende 2.618 → 395 → 120 → 66 → 45. A 120 la
   * foto è già visibilmente molle; sopra, si legge. Un documento vero
   * fotografato bene sta molto più in alto, perché il testo ha dettaglio
   * più fine delle barre della prova.
   *
   * Da rivedere sulle prime foto vere: è la soglia con più margine di
   * errore di tutte, e resta un AVVISO — non impedisce l'invio.
   */
  nitidezzaMinima: 120,
  /** Sotto questa luminosità media si legge poco, per quanto si spinga. */
  luminositaMinima: 70,
  /** Sopra, è bruciata: il bianco mangia i tratti chiari. */
  luminositaMassima: 245,
  /** Oltre questa inclinazione residua conviene rifare lo scatto. */
  inclinazioneMassima: 6,
} as const;

export type Avviso = {
  /** `blocca: true` non impedisce l'invio: nessun blocco muto. Alza il tono. */
  grave: boolean;
  testo: string;
};

export type EsitoQualita = {
  /** Si può inviare senza rimpianti. */
  buona: boolean;
  avvisi: Avviso[];
  misure: {
    larghezza: number;
    nitidezza: number;
    luminosita: number;
    inclinazione: number;
  };
};

/**
 * Il verdetto su uno scatto già ritagliato e raddrizzato.
 *
 * Gli avvisi INVITANO a rifare, non impediscono di inviare: chi ha in
 * mano l'unica copia di un registro del 2019 sbiadito deve poterlo
 * mandare lo stesso, e sarà il Motore a dire cosa è riuscito a leggere.
 * Un blocco qui sarebbe una porta chiusa in faccia a un caso vero.
 */
export function esitoQualita(img: Immagine): EsitoQualita {
  const g = grigi(img);
  const misure = {
    larghezza: img.larghezza,
    nitidezza: nitidezza(g, img.larghezza, img.altezza),
    luminosita: luminosita(g),
    inclinazione: Math.abs(angoloDiInclinazione(g, img.larghezza, img.altezza)),
  };

  const avvisi: Avviso[] = [];

  if (misure.larghezza < SOGLIE.larghezzaMinima) {
    avvisi.push({
      grave: true,
      testo: `La foto è troppo piccola perché il testo resti leggibile (${misure.larghezza} pixel di larghezza, ne servono almeno ${SOGLIE.larghezzaMinima}). Avvicinati al foglio e riempi lo schermo.`,
    });
  }
  if (misure.nitidezza < SOGLIE.nitidezzaMinima) {
    avvisi.push({
      grave: true,
      testo:
        "La foto sembra mossa o fuori fuoco. Appoggia i gomiti, aspetta che l'immagine si fermi e riscatta.",
    });
  }
  if (misure.luminosita < SOGLIE.luminositaMinima) {
    avvisi.push({
      grave: true,
      testo:
        "C'è poca luce: le cifre scure rischiano di sparire. Avvicinati a una finestra o accendi una luce, evitando la tua ombra sul foglio.",
    });
  }
  if (misure.luminosita > SOGLIE.luminositaMassima) {
    avvisi.push({
      grave: false,
      testo:
        "La foto è molto chiara e i tratti sottili possono perdersi. Se c'è un riflesso diretto, spostati di poco.",
    });
  }
  if (misure.inclinazione > SOGLIE.inclinazioneMassima) {
    avvisi.push({
      grave: false,
      testo: `Il foglio è storto di circa ${Math.round(misure.inclinazione)}°: l'abbiamo raddrizzato, ma se puoi rifallo più dritto — le tabelle si leggono meglio.`,
    });
  }

  return { buona: avvisi.length === 0, avvisi, misure };
}
