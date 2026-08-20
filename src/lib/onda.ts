/**
 * LA GEOMETRIA DELL'ONDA — la parte che si può provare.
 *
 * Il canvas è plumbing: contesto, buffer, requestAnimationFrame. Le
 * proprietà che contano — dove passa la fascia, quanto è densa al
 * centro, quanto verde menta c'è e dove, che nessuna particella si muova
 * come un'altra — sono matematica pura, e la matematica pura si prova
 * con uno script invece che a occhio davanti a uno schermo.
 *
 * Serve perché di un'animazione non ci si può fidare guardandola: un
 * difetto che compare ogni quaranta secondi, o solo a 2560px, non si
 * vede in un'occhiata. Qui si campiona.
 */

/** Verde pino del marchio e menta: gli unici due colori dell'onda. */
export const PINO: readonly [number, number, number] = [14, 82, 56];
export const MENTA: readonly [number, number, number] = [29, 158, 117];

/** Distanza della curva dal fondo della sezione, in pixel CSS. */
export const BASE = 158;
/** Ampiezze delle due sinusoidi portanti, in pixel CSS. */
export const AMPIEZZA_1 = 54;
export const AMPIEZZA_2 = 20;
/** Scostamento massimo dalla curva (lo spessore della fascia). */
export const SPESSORE = 58;
/** Margine oltre i bordi in cui le particelle vivono già invisibili. */
export const MARGINE = 120;

/**
 * Lo spazio che l'hero DEVE riservare in fondo all'onda, in pixel.
 *
 * Non è un numero estetico: è la somma di tutto ciò che può scendere
 * sotto il testo — la distanza della curva dal fondo, le due ampiezze
 * portanti, lo spessore della fascia e il bagliore — più un margine di
 * sicurezza. L'hero lo usa come padding inferiore e la prova lo verifica:
 * se qualcuno cambia un'ampiezza senza cambiare questo, il test lo dice
 * prima che le particelle finiscano sul claim.
 */
export const RISERVA_FONDO =
  BASE + AMPIEZZA_1 + AMPIEZZA_2 + SPESSORE + 20 + 60;

export type Particella = {
  /** Posizione lungo l'hero, in pixel CSS. */
  x: number;
  /** Scostamento verticale dalla curva: è anche la "profondità". */
  dv: number;
  /** Velocità di scorrimento (px/s), individuale. */
  v: number;
  /** Le due oscillazioni verticali proprie. */
  f1: number;
  f2: number;
  p1: number;
  p2: number;
  amp: number;
  /** Raggio in pixel CSS, 0,6–2,5. */
  r: number;
  /** Quanto è disposta a diventare menta (0 = mai). */
  soglia: number;
  /** Opacità di base, dalla profondità. */
  a: number;
};

/** Campana: densità e ampiezza alte al centro, dolci agli estremi. */
export function campana(u: number, sigma = 0.26): number {
  const d = u - 0.5;
  return Math.exp(-(d * d) / (2 * sigma * sigma));
}

/**
 * La curva portante: due sinusoidi di frequenza NON multipla, così la
 * somma non torna mai al punto di partenza e l'onda non si ripete in
 * modo percepibile.
 *
 * L'ancoraggio è al fondo in pixel, non a una frazione dell'altezza: con
 * la frazione la fascia si sposta insieme alla sezione, e la sezione
 * cresce quando i caratteri caricano o quando il claim va a capo su uno
 * schermo stretto — bastava quello perché le particelle salissero sul
 * sottotitolo.
 */
export function curva(x: number, t: number, L: number, H: number): number {
  const k1 = (Math.PI * 2) / (L * 0.92);
  const k2 = (Math.PI * 2) / (L * 0.53);
  return (
    H -
    BASE +
    AMPIEZZA_1 * Math.sin(x * k1 + t * 0.055) +
    AMPIEZZA_2 * Math.sin(x * k2 + t * 0.031 + 1.7)
  );
}

/** L'oscillazione propria di una particella, normalizzata in [-1, 1]. */
export function oscillazione(p: Particella, t: number): number {
  return (Math.sin(t * p.f1 + p.p1) + 0.5 * Math.sin(t * p.f2 + p.p2)) / 1.5;
}

/** Dove si trova una particella in questo istante. */
export function posizioneY(
  p: Particella,
  t: number,
  L: number,
  H: number,
): number {
  const densita = campana(p.x / L);
  return (
    curva(p.x, t, L, H) +
    p.dv +
    oscillazione(p, t) * p.amp * (0.35 + 0.65 * densita)
  );
}

/**
 * L'opacità: prodotto di tre fattori. La campana orizzontale dà la
 * densità (alta al centro, rarefatta agli estremi), la profondità dà lo
 * spessore, la dissolvenza laterale fa sì che nessuna particella compaia
 * o sparisca di scatto sul bordo.
 */
export function opacita(p: Particella, L: number): number {
  const densita = campana(p.x / L);
  const bordo = Math.min(1, Math.min(p.x + MARGINE, L + MARGINE - p.x) / 200);
  return p.a * Math.pow(densita, 1.35) * Math.max(0, bordo);
}

/**
 * Quanto una particella tira al menta, da 0 (pino) a 1 (menta piena).
 * Solo una minoranza è ammessa, e solo nella parte centrale dell'onda;
 * la transizione è continua, mai a blocchi.
 */
export function mentosita(p: Particella, L: number): number {
  if (p.soglia <= 0.78) return 0;
  const vicinanza = Math.max(0, campana(p.x / L) - 0.55) / 0.45;
  return Math.min(1, vicinanza * 1.6);
}

/**
 * Semina il campo. `caso` è iniettabile per poter provare la stessa
 * distribuzione due volte: con Math.random ogni prova direbbe una cosa
 * diversa e non proverebbe niente.
 */
export function semina(
  n: number,
  L: number,
  caso: () => number = Math.random,
): Particella[] {
  return Array.from({ length: n }, () => {
    // Profondità con più massa vicino alla curva: le particelle lontane
    // sono poche e tenui, ed è ciò che dà lo spessore.
    const d = Math.pow(caso(), 1.7);
    const segno = caso() < 0.5 ? -1 : 1;
    const f1 = 0.1 + caso() * 0.14;
    return {
      x: -MARGINE + caso() * (L + MARGINE * 2),
      dv: segno * d * SPESSORE,
      v: 6 + caso() * 14,
      f1,
      // Rapporto aureo fra le due frequenze: la somma non si ripete.
      f2: f1 * 0.618,
      p1: caso() * Math.PI * 2,
      p2: caso() * Math.PI * 2,
      amp: 4 + caso() * 14,
      r: 0.6 + Math.pow(1 - d, 1.4) * 1.9,
      soglia: caso(),
      a: 0.3 + (1 - d) * 0.62,
    };
  });
}

/** Quante particelle: si parte dalla larghezza, non da un numero fisso. */
export function quante(larghezza: number): number {
  if (larghezza < 640) return 220;
  if (larghezza < 1100) return 380;
  return 560;
}
