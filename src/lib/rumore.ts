/**
 * RUMORE COERENTE (Perlin 3D) — poche decine di righe, nessuna libreria.
 *
 * Serve a una cosa sola: dare all'onda una forma che si deforma e non si
 * ripete. Una somma di sinusoidi, per quante ne metti, resta una somma
 * di sinusoidi: l'occhio ci trova il ritmo in pochi secondi. Il rumore
 * coerente no — è continuo (niente scatti), derivabile (niente spigoli) e
 * il suo profilo cambia in continuazione senza tornare uguale.
 *
 * Perché Perlin e non simplex: a due o tre dimensioni la differenza di
 * costo è irrilevante per noi, il gradiente è quello classico e
 * l'implementazione sta in mezza pagina che si può leggere e verificare.
 * Simplex è più veloce in 4D+, che qui non serve.
 *
 * La tabella di permutazione è generata da un seme FISSO: due esecuzioni
 * devono produrre lo stesso campo, altrimenti le prove non proverebbero
 * niente e ogni ricarica del sito darebbe un'onda diversa.
 */

const PERM = (() => {
  const base = Array.from({ length: 256 }, (_, i) => i);
  let s = 20260821;
  const caso = () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(caso() * (i + 1));
    [base[i], base[j]] = [base[j], base[i]];
  }
  const p = new Uint8Array(512);
  for (let i = 0; i < 512; i++) p[i] = base[i & 255];
  return p;
})();

/** Curva di attenuazione di Perlin: derivata prima e seconda nulle ai nodi. */
const sfuma = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);
const misto = (a: number, b: number, t: number) => a + (b - a) * t;

function gradiente(h: number, x: number, y: number, z: number): number {
  const u = h < 8 ? x : y;
  const v = h < 4 ? y : h === 12 || h === 14 ? x : z;
  return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
}

/** Rumore coerente in tre dimensioni, valori in [-1, 1]. */
export function rumore3(x: number, y: number, z: number): number {
  const X = Math.floor(x) & 255;
  const Y = Math.floor(y) & 255;
  const Z = Math.floor(z) & 255;
  const xf = x - Math.floor(x);
  const yf = y - Math.floor(y);
  const zf = z - Math.floor(z);
  const u = sfuma(xf);
  const v = sfuma(yf);
  const w = sfuma(zf);

  const A = PERM[X] + Y;
  const AA = PERM[A] + Z;
  const AB = PERM[A + 1] + Z;
  const B = PERM[X + 1] + Y;
  const BA = PERM[B] + Z;
  const BB = PERM[B + 1] + Z;

  return misto(
    misto(
      misto(
        gradiente(PERM[AA], xf, yf, zf),
        gradiente(PERM[BA], xf - 1, yf, zf),
        u,
      ),
      misto(
        gradiente(PERM[AB], xf, yf - 1, zf),
        gradiente(PERM[BB], xf - 1, yf - 1, zf),
        u,
      ),
      v,
    ),
    misto(
      misto(
        gradiente(PERM[AA + 1], xf, yf, zf - 1),
        gradiente(PERM[BA + 1], xf - 1, yf, zf - 1),
        u,
      ),
      misto(
        gradiente(PERM[AB + 1], xf, yf - 1, zf - 1),
        gradiente(PERM[BB + 1], xf - 1, yf - 1, zf - 1),
        u,
      ),
      v,
    ),
    w,
  );
}

/**
 * Somma di ottave: la forma grande viene dalla prima, il dettaglio dalle
 * altre. Tre bastano — la quarta costa e non si vede.
 */
export function fbm3(x: number, y: number, z: number, ottave = 3): number {
  let somma = 0;
  let ampiezza = 1;
  let peso = 0;
  let f = 1;
  for (let i = 0; i < ottave; i++) {
    somma += ampiezza * rumore3(x * f, y * f, z * f);
    peso += ampiezza;
    ampiezza *= 0.5;
    // Lacunarità non intera: le ottave non si allineano mai fra loro.
    f *= 2.13;
  }
  return somma / peso;
}

/**
 * Comodo quando serve un valore in [0, 1] invece che in [-1, 1].
 *
 * Il guadagno non è un vezzo: la somma di ottave NON copre tutto
 * l'intervallo teorico — i massimi delle singole ottave non capitano mai
 * insieme, e in pratica `fbm3` sta fra circa -0,55 e +0,55. Senza
 * riscalare, ogni parametro pilotato da qui (larghezza del fascio,
 * densità, respiro dell'ampiezza) userebbe metà della sua corsa e il
 * fascio sembrerebbe molto più fermo di com'è stato progettato.
 */
export const GUADAGNO_FBM = 0.92;

export function fbm01(x: number, y: number, z: number, ottave = 3): number {
  const v = fbm3(x, y, z, ottave) / GUADAGNO_FBM;
  return Math.min(1, Math.max(0, v * 0.5 + 0.5));
}

/** Lo stesso riscalamento, ma centrato: valori in [-1, 1] ben distribuiti. */
export function fbmPieno(
  x: number,
  y: number,
  z: number,
  ottave = 3,
): number {
  const v = fbm3(x, y, z, ottave) / GUADAGNO_FBM;
  return Math.min(1, Math.max(-1, v));
}
