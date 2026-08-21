import { fbm01, fbm3, fbmPieno, rumore3 } from "@/lib/rumore";

/**
 * L'ONDA — un FASCIO che muta, non una curva che scorre.
 *
 * La forma non è più una somma di sinusoidi: viene da un campo di
 * RUMORE coerente campionato con coordinate che scorrono nel tempo. Una
 * somma di sinusoidi, per quante ne metti, resta riconoscibile in pochi
 * secondi — l'occhio ci trova il ritmo. Il rumore no.
 *
 * Cosa muta, e con che tempi (tutti diversi fra loro, così non c'è un
 * battito comune da riconoscere):
 *   - la linea del fascio si deforma           (rumore, ~29s di scala)
 *   - l'ampiezza cresce e si smorza            (~48s)
 *   - la larghezza si dilata e si restringe    (~59s globale, ~22s locale)
 *   - la densità si concentra in punti diversi (~30s)
 *   - il fascio si sdoppia in due filamenti e si riunisce (~83s)
 * Nessuno di questi periodi è multiplo di un altro, e il rumore non è
 * periodico: la configurazione non torna riconoscibilmente uguale prima
 * di parecchi minuti.
 *
 * Le particelle NON sono disegnate sulla forma: sono attratte verso di
 * essa con inerzia e smorzamento, quindi la seguono con ritardo. È il
 * ritardo a rendere il movimento morbido — e a impedire che qualcuna
 * cambi direzione di scatto quando il campo si muove.
 *
 * La geometria sta qui e non nel componente perché è la parte che si può
 * provare: `scripts/test-onda.mjs` la campiona su quattro larghezze e
 * centinaia di istanti. Di un'animazione non ci si può fidare
 * guardandola.
 */

/* ------------------------------------------------------------------ */
/* Palette                                                             */
/* ------------------------------------------------------------------ */

/** Verde pino del marchio e menta: l'onda sui fondi chiari. */
export const PINO: readonly [number, number, number] = [14, 82, 56];
export const MENTA: readonly [number, number, number] = [29, 158, 117];
/** Sui fondi scuri si inverte: bianco con accenti menta accesa. */
export const BIANCO: readonly [number, number, number] = [255, 255, 255];
export const MENTA_ACCESA: readonly [number, number, number] = [47, 207, 154];

export type Palette = "chiara" | "scura";

export function coloriDi(p: Palette) {
  return p === "scura"
    ? { base: BIANCO, accento: MENTA_ACCESA }
    : { base: PINO, accento: MENTA };
}

/* ------------------------------------------------------------------ */
/* Configurazione                                                      */
/* ------------------------------------------------------------------ */

export type ConfigOnda = {
  /** Moltiplicatore sul numero di particelle. */
  densita: number;
  /** Moltiplicatore sull'ampiezza della deformazione. */
  ampiezza: number;
  /** Moltiplicatore sulla velocità di scorrimento. */
  velocita: number;
  /** Moltiplicatore globale sull'opacità: la manopola della discrezione. */
  opacita: number;
  /** Moltiplicatore sul raggio delle particelle. */
  raggio: number;
  palette: Palette;
  /** Altezza della linea del fascio, in frazione dell'altezza. */
  posizione: number;
  /** Verso dello scorrimento: 1 da sinistra a destra, -1 al contrario. */
  direzione: 1 | -1;
  /** Moltiplicatore sulla larghezza del fascio. */
  spessore: number;
  /** Quota di particelle in primo piano: più grandi, più opache, col bagliore. */
  primoPiano: number;
  /**
   * Le scie: quanto resta del fotogramma precedente, da 0 (nessuna) a
   * ~0.9 (lunghissime). Funziona solo se il canvas possiede il fondo —
   * la scia è il fondo ridipinto in trasparenza, quindi chi non ha un
   * fondo proprio non può averla.
   */
  scie: number;
  /**
   * Il fondo, se il canvas se lo dipinge da sé: due colori per un
   * gradiente verticale. Serve alle scie e al bagliore additivo.
   */
  fondo: readonly [string, string] | null;
  /**
   * Bagliore vero: le particelle si SOMMANO al fondo invece di coprirlo.
   * Su fondo scuro è ciò che le fa sembrare luminose e non incollate;
   * su fondo chiaro le farebbe sparire, quindi resta spenta.
   */
  additivo: boolean;
  /**
   * Quanto proteggere il testo. Non è una preferenza estetica: è quanto
   * contrasto serve, e serve MENO su fondo scuro — lì il testo bianco
   * parte da 15:1 e può permettersi molte più particelle dietro. `rx` e
   * `ry` sono i margini della maschera rispetto alla riga, `minimo`
   * quanto resta dell'onda sotto le lettere.
   */
  maschera: { rx: number; ry: number; minimo: number };
};

/**
 * LE DUE CALIBRAZIONI DELL'HERO, da vedere e scegliere.
 *
 * «Decisa» è quella predefinita: il brief dice che l'onda era quasi
 * impercettibile, e la correzione di un difetto va fatta per intero, non
 * a metà. «Contenuta» è la stessa forma con meno presenza — stesso
 * movimento, un terzo di opacità in meno e particelle più piccole — per
 * chi la vuole come firma e non come protagonista.
 *
 * Si confrontano dal vivo con `?onda=contenuta` sulla home.
 */
export const ONDA_DECISA: ConfigOnda = {
  densita: 1,
  ampiezza: 1,
  velocita: 1,
  opacita: 1,
  raggio: 1,
  palette: "chiara",
  posizione: 0.47,
  direzione: 1,
  spessore: 1,
  primoPiano: 0.07,
  scie: 0,
  fondo: null,
  additivo: false,
  maschera: { rx: 1.5, ry: 1.9, minimo: 0.06 },
};

/** Il pino profondo dell'hero, e il suo schiarimento verso il basso. */
export const FONDO_SOGLIA = ["#0A2E1F", "#0C3927"] as const;

/**
 * L'ONDA DELLA SOGLIA — l'hero su fondo scuro.
 *
 * Qui cade il vincolo che ci frenava: su pino profondo il testo è bianco
 * e il contrasto parte da 15:1, quindi le particelle possono essere
 * luminose davvero. Bagliore additivo, scie sulle più veloci, raggi fino
 * a sei pixel, densità e opacità alzate.
 *
 * Il fondo lo dipinge il canvas e non la sezione: senza possederlo non
 * si possono fare le scie, che sono il fondo ridipinto in trasparenza.
 */
export const ONDA_SOGLIA: ConfigOnda = {
  ...ONDA_DECISA,
  densita: 1.15,
  ampiezza: 1.1,
  velocita: 1.25,
  opacita: 1,
  raggio: 1.15,
  palette: "scura",
  primoPiano: 0.09,
  scie: 0.17,
  fondo: FONDO_SOGLIA,
  additivo: true,
  // Molto più permissiva: misurando, con la maschera del fondo chiaro il
  // contrasto restava a 9-12:1 contro i 4,5 richiesti — cioè si stava
  // trattenendo l'onda per niente. Qui il fascio attraversa il claim
  // davvero, e il contrasto resta comunque sopra 5,5:1.
  maschera: { rx: 1.35, ry: 1.65, minimo: 0.16 },
};

export const ONDA_CONTENUTA: ConfigOnda = {
  ...ONDA_DECISA,
  densita: 0.8,
  opacita: 0.62,
  raggio: 0.78,
  ampiezza: 0.9,
  primoPiano: 0.05,
};

/**
 * I preset del riuso. La regola che li governa: dove c'è testo denso o
 * dati, l'onda sta sotto il 25% di opacità o non c'è affatto. Un fondale
 * non può mai competere con ciò che deve far leggere.
 */
export const PRESET = {
  /** Sezione del Motore, fondo scuro: carattere più tecnico e nitido. */
  tecnica: {
    ...ONDA_DECISA,
    densita: 0.85,
    opacita: 0.3,
    velocita: 1.15,
    ampiezza: 0.75,
    raggio: 0.85,
    palette: "scura" as const,
    posizione: 0.5,
    primoPiano: 0.04,
  },
  /** Chi siamo: presenza pacata dietro un testo che si legge. */
  pacata: {
    ...ONDA_DECISA,
    densita: 0.6,
    opacita: 0.24,
    velocita: 0.75,
    ampiezza: 0.85,
    raggio: 0.85,
    posizione: 0.46,
    direzione: -1 as const,
    primoPiano: 0.03,
  },
  /** Intestazioni delle pagine servizio: quasi un'ombra. */
  tenue: {
    ...ONDA_DECISA,
    densita: 0.5,
    opacita: 0.2,
    velocita: 0.7,
    ampiezza: 0.7,
    raggio: 0.8,
    posizione: 0.5,
    primoPiano: 0.02,
  },
  /** La stessa, per la fascia scura del Sigillo. */
  tenueScura: {
    ...ONDA_DECISA,
    densita: 0.5,
    opacita: 0.22,
    velocita: 0.7,
    ampiezza: 0.7,
    raggio: 0.8,
    palette: "scura" as const,
    posizione: 0.5,
    primoPiano: 0.02,
  },
} satisfies Record<string, ConfigOnda>;

/* ------------------------------------------------------------------ */
/* Costanti del fascio                                                 */
/* ------------------------------------------------------------------ */

/** Ampiezza massima della deformazione, in frazione dell'altezza. */
export const AMPIEZZA = 0.36;
/** Semi-larghezza di riferimento del fascio, in frazione dell'altezza. */
export const SPESSORE = 0.105;
/** Ampiezza del micro-movimento individuale, in frazione dell'altezza. */
export const MICRO = 0.022;
/**
 * Sbordo laterale in pixel: il canvas esce dal contenitore, così l'onda
 * non ha un inizio e una fine visibili ma entra ed esce dal campo.
 */
export const SBORDO = 90;
/** Rigidezza e smorzamento dell'attrazione verso il campo. */
export const RIGIDEZZA = 3.2;
export const SMORZAMENTO = 2.9;

export type Particella = {
  /** Posizione lungo il fascio, in pixel CSS (può stare fuori dai bordi). */
  x: number;
  /** Posto attraverso il fascio, in [-1, 1]. */
  s: number;
  /** Stato dell'inerzia: dove si trova e con che velocità verticale. */
  y: number;
  vy: number;
  /** Velocità di scorrimento (px/s), individuale e con segno. */
  v: number;
  /** Seme personale: sposta il campionamento del micro-rumore. */
  seme: number;
  /** Raggio di riferimento in pixel CSS. */
  r: number;
  /** In primo piano: più grande, più opaca, col bagliore. */
  avanti: boolean;
  /** Quanto è disposta a prendere l'accento (0 = mai). */
  soglia: number;
  /** Opacità di base, dalla profondità. */
  a: number;
  /**
   * La forma del fascio dove si trova la particella, con l'istante a cui
   * è stata calcolata.
   *
   * Non è un'ottimizzazione prematura: `formaFascio` costa cinque
   * campionamenti di rumore, e senza memoria veniva chiamata quattro
   * volte per particella per fotogramma — una per il bersaglio, una per
   * l'opacità, una per il raggio, una per la densità. Misurato: 0,77ms
   * contro 0,25ms per fotogramma a 2560px.
   */
  f?: Forma;
  ft?: number;
};

export type Forma = {
  centro: number;
  semi: number;
  densita: number;
  sdoppiamento: number;
};

/** Campana: densità alta al centro dell'inquadratura, dolce agli estremi. */
export function campana(u: number, sigma = 0.32): number {
  const d = u - 0.5;
  return Math.exp(-(d * d) / (2 * sigma * sigma));
}

/**
 * LA FORMA DEL FASCIO in un punto e in un istante.
 *
 * Tutto viene dal rumore, con scale temporali diverse fra loro. È qui
 * che il fascio «assume configurazioni diverse»: nessun parametro è
 * costante, nessuno torna indietro, e ognuno cammina col suo passo.
 */
export function formaFascio(
  x: number,
  t: number,
  L: number,
  H: number,
  c: ConfigOnda,
): Forma {
  const u = x / L;

  // La linea: rumore lungo il percorso che scorre nel tempo.
  const linea = fbmPieno(u * 2.05, 4.7, t * 0.034);
  // L'ampiezza respira: cresce e si smorza su una scala lunga.
  const respiroAmp = 0.45 + 0.55 * fbm01(11.3, 2.9, t * 0.021, 2);
  const centro =
    H * c.posizione + AMPIEZZA * H * c.ampiezza * respiroAmp * linea;

  // La larghezza si dilata e si restringe, globalmente e lungo il tratto.
  const respiroLarg = fbm01(7.7, 19.1, t * 0.017, 2);
  const largLocale = fbm01(u * 1.75, 3.1, t * 0.045, 2);
  const semi =
    SPESSORE * H * c.spessore * (0.4 + 0.95 * respiroLarg + 0.75 * largLocale);

  // La densità si concentra in punti che si spostano: dove è alta le
  // particelle sono più fitte e più piccole, dove è bassa più rade e
  // più grandi.
  const densita = 0.3 + 0.7 * fbm01(u * 2.35, 8.2, t * 0.033, 2);

  // Lo sdoppiamento: quando sale, le particelle vengono spinte verso i
  // due bordi del fascio e si vedono due filamenti che poi si
  // riuniscono. Sta a zero per la maggior parte del tempo — è un evento,
  // non un battito.
  const grezzo = rumore3(u * 0.85, 15.4, t * 0.012);
  const sdoppiamento = Math.pow(Math.max(0, grezzo - 0.12) / 0.88, 1.6);

  return { centro, semi, densita, sdoppiamento };
}

/**
 * Dove il campo vuole la particella adesso. La particella ci arriva con
 * ritardo (vedi `avanza`): questo è il bersaglio, non la posizione.
 */
export function formaDi(
  p: Particella,
  t: number,
  L: number,
  H: number,
  c: ConfigOnda,
): Forma {
  if (p.f && p.ft === t) return p.f;
  const f = formaFascio(p.x, t, L, H, c);
  p.f = f;
  p.ft = t;
  return f;
}

export function bersaglio(
  p: Particella,
  t: number,
  L: number,
  H: number,
  c: ConfigOnda,
): number {
  const f = formaDi(p, t, L, H, c);
  // Lo sdoppiamento spinge verso i bordi senza spostare nessuno di
  // scatto: è una rimappatura continua del posto nel fascio.
  const segno = p.s < 0 ? -1 : 1;
  const posto = segno * (Math.abs(p.s) * (1 - f.sdoppiamento) + f.sdoppiamento);
  // Secondo strato di rumore, frequenza alta e ampiezza piccola: il
  // brulichio individuale che rende il fascio uno sciame e non un nastro.
  const micro = fbm3(p.x * 0.0075 + p.seme, 21.7, t * 0.085, 2);
  return f.centro + posto * f.semi + micro * MICRO * H * c.ampiezza;
}

/**
 * Un passo di simulazione: scorrimento e inerzia.
 *
 * Il taglio del passo a 50ms evita lo scatto quando la scheda torna in
 * primo piano dopo essere stata sospesa. Lo smorzamento esponenziale è
 * indipendente dalla durata del fotogramma, quindi a 120Hz il movimento
 * è identico che a 60.
 */
export function avanza(
  particelle: Particella[],
  dt: number,
  t: number,
  L: number,
  H: number,
  c: ConfigOnda,
): void {
  const passo = Math.min(0.05, dt);
  const giro = L + SBORDO * 2;
  const decadimento = Math.exp(-SMORZAMENTO * passo);
  for (const p of particelle) {
    p.x += p.v * passo;
    if (p.x > L + SBORDO) p.x -= giro;
    else if (p.x < -SBORDO) p.x += giro;
    const b = bersaglio(p, t, L, H, c);
    p.vy = (p.vy + (b - p.y) * RIGIDEZZA * passo) * decadimento;
    p.y += p.vy * passo;
  }
}

/**
 * L'INGRESSO IN SCENA: le particelle partono fuori campo e ci arrivano
 * da sole.
 *
 * Non è un'animazione aggiunta: è la stessa fisica di sempre con un
 * punto di partenza diverso. Con la rigidezza e lo smorzamento scelti,
 * la convergenza si esaurisce in circa un secondo e mezzo — il tempo
 * chiesto dal brief — e siccome è inerzia e non un'interpolazione, non
 * c'è un istante in cui «finisce l'ingresso e comincia il moto».
 */
export function disperdi(
  particelle: Particella[],
  H: number,
  caso: () => number = Math.random,
): void {
  for (const p of particelle) {
    const sopra = caso() < 0.5;
    p.y = sopra ? -H * (0.35 + caso() * 0.5) : H * (1.35 + caso() * 0.5);
    p.vy = 0;
  }
}

/** Quanto è già entrata in scena: 0 appena aperta, 1 a regime. */
export const DURATA_INGRESSO = 1.7;

export function ingresso(t: number): number {
  const u = Math.min(1, Math.max(0, t / DURATA_INGRESSO));
  return u * u * (3 - 2 * u);
}

/** Porta il campo a regime senza far vedere l'assestamento iniziale. */
export function assesta(
  particelle: Particella[],
  t: number,
  L: number,
  H: number,
  c: ConfigOnda,
): void {
  for (const p of particelle) p.y = bersaglio(p, t, L, H, c);
  for (let i = 0; i < 30; i++) avanza(particelle, 1 / 60, t, L, H, c);
}

/**
 * Il raggio in questo istante: varia nel tempo e nello spazio, non solo
 * da particella a particella. Dove il fascio si addensa le particelle
 * sono più piccole e fitte, dove si rarefà più grandi e distanziate.
 */
export function raggioDi(
  p: Particella,
  t: number,
  L: number,
  H: number,
  c: ConfigOnda,
): number {
  const f = formaDi(p, t, L, H, c);
  return p.r * c.raggio * (0.62 + 0.85 * (1 - f.densita));
}

/* ------------------------------------------------------------------ */
/* Maschere del testo                                                  */
/* ------------------------------------------------------------------ */

/**
 * LA MASCHERA DEL TESTO: una regione morbida dentro cui le particelle si
 * spengono progressivamente.
 *
 * È la differenza fra «il claim galleggia sopra l'onda» e «l'onda evita
 * il claim»: l'onda attraversa tutto l'hero e passa dietro le lettere,
 * ma dove ci sono le lettere il fondo torna quasi bianco.
 */
export type MascheraTesto = {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  /** Quanto resta dell'opacità nel cuore della maschera. */
  minimo: number;
};

/**
 * Dove comincia a risalire l'opacità: fino a qui la protezione è piena.
 * Il rettangolo del testo, angoli compresi, deve stare tutto dentro.
 */
export const PIANORO = 0.78;

export function fattoreMaschera(
  x: number,
  y: number,
  m: MascheraTesto | null,
): number {
  if (!m) return 1;
  const dx = Math.abs((x - m.cx) / m.rx);
  const dy = Math.abs((y - m.cy) / m.ry);
  // Norma di ordine 6 e non distanza euclidea: la maschera deve seguire
  // la forma del RETTANGOLO della riga. Con l'ellisse gli angoli
  // restavano fuori dalla protezione — ed è esattamente lì che la misura
  // del contrasto trovava il fondo peggiore.
  const d = Math.pow(Math.pow(dx, 6) + Math.pow(dy, 6), 1 / 6);
  if (d >= 1) return 1;
  if (d <= PIANORO) return m.minimo;
  const u = (d - PIANORO) / (1 - PIANORO);
  const s = u * u * (3 - 2 * u);
  return m.minimo + (1 - m.minimo) * s;
}

/**
 * Il fattore di più maschere insieme: vince la più protettiva.
 *
 * Una maschera sola sul blocco intero copriva anche gli spazi vuoti fra
 * le righe, e dietro il claim non restava niente da vedere. Una maschera
 * PER RIGA protegge le lettere e lascia passare l'onda negli spazi.
 */
export function fattoreMaschere(
  x: number,
  y: number,
  maschere: MascheraTesto[],
): number {
  let f = 1;
  for (const m of maschere) {
    const v = fattoreMaschera(x, y, m);
    if (v < f) f = v;
  }
  return f;
}

/* ------------------------------------------------------------------ */
/* Opacità, accento, semina                                            */
/* ------------------------------------------------------------------ */

/**
 * L'opacità: profondità della particella, densità locale del fascio,
 * campana orizzontale, dissolvenza ai bordi e manopola globale.
 */
export function opacita(
  p: Particella,
  t: number,
  L: number,
  H: number,
  c: ConfigOnda,
  fattoreTesto = 1,
): number {
  const f = formaDi(p, t, L, H, c);
  const inquadratura = campana(p.x / L);
  const bordo = Math.min(1, Math.min(p.x + SBORDO, L + SBORDO - p.x) / 150);
  return (
    p.a *
    (0.45 + 0.55 * f.densita) *
    Math.pow(inquadratura, 1.15) *
    Math.max(0, bordo) *
    fattoreTesto *
    c.opacita
  );
}

/**
 * Quanto una particella tira all'accento, da 0 a 1. Solo una minoranza,
 * solo nella parte centrale, con transizione continua: mai a blocchi.
 */
export function accento(p: Particella, L: number): number {
  if (p.soglia <= 0.76) return 0;
  const vicinanza = Math.max(0, campana(p.x / L) - 0.5) / 0.5;
  return Math.min(1, vicinanza * 1.5);
}

/**
 * Semina il campo. `caso` è iniettabile per poter provare due volte la
 * stessa distribuzione: con Math.random ogni prova direbbe una cosa
 * diversa e non proverebbe niente.
 */
export function semina(
  n: number,
  L: number,
  H: number,
  c: ConfigOnda,
  caso: () => number = Math.random,
): Particella[] {
  return Array.from({ length: n }, () => {
    // Posto nel fascio con più massa al centro: è ciò che gli dà un
    // cuore denso e bordi sfrangiati invece di due sponde nette.
    const grezzo = caso() * 2 - 1;
    const s = Math.sign(grezzo) * Math.pow(Math.abs(grezzo), 1.35);
    const avanti = caso() < c.primoPiano;
    // Raggio con distribuzione non uniforme: molte piccole, poche
    // grandi. Le particelle in primo piano stanno tutte in alto.
    const r = avanti
      ? 3.6 + caso() * 2.4
      : 1 + Math.pow(caso(), 2.05) * 3.4;
    return {
      x: -SBORDO + caso() * (L + SBORDO * 2),
      s,
      y: H * c.posizione,
      vy: 0,
      // Una minoranza corre di più: è quello che fa sembrare il flusso
      // vivo invece che un blocco che trasla.
      v:
        (12 + caso() * 26) *
        (caso() < 0.12 ? 1.9 + caso() * 0.9 : 1) *
        c.velocita *
        c.direzione,
      seme: caso() * 100,
      r,
      avanti,
      soglia: caso(),
      a: avanti ? 0.72 + caso() * 0.28 : 0.34 + Math.pow(caso(), 1.3) * 0.5,
    };
  });
}

/**
 * Quante particelle: dalla larghezza, non da un numero fisso. Questi
 * numeri escono dalla misura del costo per fotogramma, non da una
 * preferenza — meglio poche rese benissimo che tante rese male.
 */
export function quante(larghezza: number, c: ConfigOnda): number {
  const base =
    larghezza < 640
      ? 320
      : larghezza < 1100
        ? 520
        : larghezza < 1800
          ? 700
          : 780;
  return Math.round(base * c.densita);
}

/** Posizione verticale: più alta sugli schermi stretti, come da brief. */
export function posizionePerLarghezza(larghezza: number, c: ConfigOnda): number {
  return larghezza < 640 ? Math.max(0.3, c.posizione - 0.05) : c.posizione;
}
