/**
 * L'ONDA — la geometria, cioè la parte che si può provare.
 *
 * Il canvas è plumbing: contesto, buffer, requestAnimationFrame. Le
 * proprietà che contano — dove passa la fascia, quanto è densa al
 * centro, quanto accento e dove, quanto si spegne dietro il claim, che
 * nessuna particella si muova come un'altra — sono matematica pura, e la
 * matematica pura si prova con uno script invece che a occhio davanti a
 * uno schermo. Di un'animazione non ci si può fidare guardandola: un
 * difetto che compare al quarantesimo secondo, o solo a 2560px, o su una
 * particella su cento, non si vede in un'occhiata.
 *
 * Una sola implementazione per tutto il sito: l'onda è la firma visiva
 * del marchio e cambia solo per configurazione — densità, ampiezza,
 * velocità, opacità, palette, posizione, direzione. Mai una copia.
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
  /** Moltiplicatore sulle ampiezze (curva portante e oscillazioni). */
  ampiezza: number;
  /** Moltiplicatore sulla velocità di scorrimento. */
  velocita: number;
  /** Moltiplicatore globale sull'opacità: è la manopola della discrezione. */
  opacita: number;
  palette: Palette;
  /** Altezza della curva, in frazione dell'altezza del contenitore. */
  posizione: number;
  /** Verso dello scorrimento: 1 da sinistra a destra, -1 al contrario. */
  direzione: 1 | -1;
  /** Moltiplicatore sullo spessore della fascia. */
  spessore: number;
};

/**
 * L'onda dell'hero: è il primo impatto, quindi è quella piena. Tutte le
 * altre sono questa, abbassata.
 */
export const ONDA_HERO: ConfigOnda = {
  densita: 1,
  ampiezza: 1,
  velocita: 1,
  opacita: 1,
  palette: "chiara",
  posizione: 0.47,
  direzione: 1,
  spessore: 1,
};

/**
 * I preset del riuso. La regola che li governa: dove c'è testo denso o
 * dati, l'onda sta sotto il 25% di opacità o non c'è affatto. Un fondale
 * non può mai competere con ciò che deve far leggere.
 */
export const PRESET = {
  /** Sezione del Motore, fondo scuro: carattere più tecnico e nitido. */
  tecnica: {
    ...ONDA_HERO,
    densita: 0.85,
    opacita: 0.3,
    velocita: 1.15,
    ampiezza: 0.75,
    palette: "scura" as const,
    posizione: 0.5,
  },
  /** Chi siamo: presenza pacata dietro un testo che si legge. */
  pacata: {
    ...ONDA_HERO,
    densita: 0.6,
    opacita: 0.24,
    velocita: 0.75,
    ampiezza: 0.85,
    posizione: 0.46,
    direzione: -1 as const,
  },
  /** Intestazioni delle pagine servizio: quasi un'ombra. */
  tenue: {
    ...ONDA_HERO,
    densita: 0.5,
    opacita: 0.2,
    velocita: 0.7,
    ampiezza: 0.7,
    posizione: 0.5,
  },
  /** La stessa, per la fascia scura del Sigillo. */
  tenueScura: {
    ...ONDA_HERO,
    densita: 0.5,
    opacita: 0.22,
    velocita: 0.7,
    ampiezza: 0.7,
    palette: "scura" as const,
    posizione: 0.5,
  },
} satisfies Record<string, ConfigOnda>;

/* ------------------------------------------------------------------ */
/* Costanti geometriche                                                */
/* ------------------------------------------------------------------ */

/** Ampiezze della curva portante, in frazione dell'altezza. */
export const A1 = 0.13;
export const A2 = 0.055;
export const A3 = 0.028;
/** Semi-spessore della fascia, in frazione dell'altezza. */
export const SPESSORE = 0.075;
/**
 * Sbordo laterale in pixel: il canvas esce dal contenitore, così l'onda
 * non ha un inizio e una fine visibili ma entra ed esce dal campo.
 */
export const SBORDO = 90;

export type Particella = {
  /** Posizione lungo l'onda, in pixel CSS (può stare fuori dai bordi). */
  x: number;
  /** Scostamento dalla curva, normalizzato in [-1, 1]: la profondità. */
  dv: number;
  /** Velocità di scorrimento (px/s), individuale e con segno. */
  v: number;
  /** Le tre oscillazioni verticali proprie e le loro fasi. */
  f1: number;
  f2: number;
  f3: number;
  p1: number;
  p2: number;
  p3: number;
  amp: number;
  /** Raggio in pixel CSS, 0,6–2,5. */
  r: number;
  /** Quanto è disposta a prendere l'accento (0 = mai). */
  soglia: number;
  /** Opacità di base, dalla profondità. */
  a: number;
};

/** Campana: densità e ampiezza alte al centro, dolci agli estremi. */
export function campana(u: number, sigma = 0.3): number {
  const d = u - 0.5;
  return Math.exp(-(d * d) / (2 * sigma * sigma));
}

/**
 * La curva portante: TRE sinusoidi con periodi non multipli fra loro,
 * nello spazio e nel tempo. Con due il profilo tornava al punto di
 * partenza abbastanza spesso da poterlo notare; con tre, e con questi
 * rapporti, non si ripete in nessun tempo utile.
 */
export function curva(
  x: number,
  t: number,
  L: number,
  H: number,
  c: ConfigOnda,
): number {
  const k1 = (Math.PI * 2) / (L * 0.92);
  const k2 = (Math.PI * 2) / (L * 0.53);
  const k3 = (Math.PI * 2) / (L * 0.31);
  const a = c.ampiezza * H;
  return (
    H * c.posizione +
    A1 * a * Math.sin(x * k1 + t * 0.075) +
    A2 * a * Math.sin(x * k2 + t * 0.043 + 1.7) +
    A3 * a * Math.sin(x * k3 + t * 0.027 + 4.1)
  );
}

/** L'oscillazione propria di una particella, normalizzata in [-1, 1]. */
export function oscillazione(p: Particella, t: number): number {
  return (
    (Math.sin(t * p.f1 + p.p1) +
      0.55 * Math.sin(t * p.f2 + p.p2) +
      0.3 * Math.sin(t * p.f3 + p.p3)) /
    1.85
  );
}

/** Dove si trova una particella in questo istante. */
export function posizioneY(
  p: Particella,
  t: number,
  L: number,
  H: number,
  c: ConfigOnda,
): number {
  const densita = campana(p.x / L);
  return (
    curva(p.x, t, L, H, c) +
    p.dv * H * SPESSORE * c.spessore +
    oscillazione(p, t) * p.amp * c.ampiezza * (0.3 + 0.7 * densita)
  );
}

/**
 * LA MASCHERA DEL TESTO: un'ellisse morbida dentro cui le particelle si
 * spengono progressivamente.
 *
 * È la differenza fra «il claim galleggia sopra l'onda» e «l'onda evita
 * il claim»: l'onda attraversa tutto l'hero e passa dietro le lettere,
 * ma dove ci sono le lettere il fondo torna quasi bianco. Nessun
 * riquadro, nessun bordo — solo una caduta continua di opacità.
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
 * Il blocco del testo, angoli compresi, deve stare tutto dentro.
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
  // la forma del BLOCCO, che è un rettangolo. Con l'ellisse gli angoli
  // del claim restavano fuori dalla protezione — ed è esattamente lì che
  // la misura del contrasto ha trovato il fondo peggiore.
  const d = Math.pow(Math.pow(dx, 6) + Math.pow(dy, 6), 1 / 6);
  if (d >= 1) return 1;
  if (d <= PIANORO) return m.minimo;
  // Poi risale con una curva morbida: il bordo della maschera non si
  // deve poter individuare.
  const u = (d - PIANORO) / (1 - PIANORO);
  const s = u * u * (3 - 2 * u);
  return m.minimo + (1 - m.minimo) * s;
}

/**
 * Il fattore di più maschere insieme: vince la più protettiva.
 *
 * Una maschera sola sul blocco intero copriva anche gli spazi vuoti —
 * fra l'occhiello e il titolo, accanto alle righe più corte, fra il
 * sottotitolo e i bottoni — e a quel punto dell'onda, dietro il claim,
 * non restava niente da vedere. Una maschera PER RIGA protegge le
 * lettere e lascia passare l'onda negli spazi: è lì che si vede che il
 * claim galleggia sopra qualcosa invece di stare in una radura.
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

/**
 * L'opacità di una particella: densità orizzontale, profondità,
 * dissolvenza laterale, maschera del testo e manopola globale.
 */
export function opacita(
  p: Particella,
  L: number,
  c: ConfigOnda,
  fattoreTesto = 1,
): number {
  const densita = campana(p.x / L);
  const bordo = Math.min(1, Math.min(p.x + SBORDO, L + SBORDO - p.x) / 150);
  return (
    p.a * Math.pow(densita, 1.25) * Math.max(0, bordo) * fattoreTesto * c.opacita
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
  c: ConfigOnda,
  caso: () => number = Math.random,
): Particella[] {
  return Array.from({ length: n }, () => {
    // Profondità con più massa vicino alla curva: le particelle lontane
    // sono poche e tenui, ed è ciò che dà lo spessore.
    const d = Math.pow(caso(), 1.6);
    const segno = caso() < 0.5 ? -1 : 1;
    const f1 = 0.16 + caso() * 0.2;
    // Una minoranza corre di più: è quello che fa sembrare il flusso
    // vivo invece che un blocco che trasla.
    const veloce = caso() < 0.12 ? 1.8 + caso() * 0.9 : 1;
    return {
      x: -SBORDO + caso() * (L + SBORDO * 2),
      dv: segno * d,
      v: (10 + caso() * 22) * veloce * c.velocita * c.direzione,
      f1,
      // Rapporti irrazionali fra le tre frequenze: la somma non torna.
      f2: f1 * 0.618,
      f3: f1 * 0.382,
      p1: caso() * Math.PI * 2,
      p2: caso() * Math.PI * 2,
      p3: caso() * Math.PI * 2,
      amp: (7 + caso() * 22) * (0.6 + 0.4 * caso()),
      r: 0.6 + Math.pow(1 - d, 1.4) * 1.9,
      soglia: caso(),
      a: 0.3 + (1 - d) * 0.6,
    };
  });
}

/**
 * Quante particelle: dalla larghezza, non da un numero fisso. Meglio
 * poche rese benissimo che tante rese male — questi numeri escono dalla
 * misura del frame time, non da una preferenza.
 */
export function quante(larghezza: number, c: ConfigOnda): number {
  const base =
    larghezza < 640
      ? 260
      : larghezza < 1100
        ? 420
        : larghezza < 1800
          ? 560
          : 620;
  return Math.round(base * c.densita);
}

/** Posizione verticale: più alta sugli schermi stretti, come da brief. */
export function posizionePerLarghezza(larghezza: number, c: ConfigOnda): number {
  return larghezza < 640 ? Math.max(0.3, c.posizione - 0.05) : c.posizione;
}
