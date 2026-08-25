/**
 * ESPORTA I FILE DEL MARCHIO — chiaro e scuro.
 *
 *   node --import ./scripts/risolutore-ts.mjs scripts/esporta-marchio.mjs
 *
 * I due file in `public/brand/` NON si modificano a mano: si rigenerano
 * da qui, che legge le stesse proporzioni del componente in pagina
 * (`src/lib/marchio.ts`). È l'unico modo perché il file che qualcuno
 * scarica e mette in una presentazione sia lo stesso marchio che vede
 * sul sito — e non la sua versione di sei mesi fa.
 *
 * `--controlla` non scrive niente e fallisce se i file su disco non
 * combaciano con quello che il codice genera oggi: serve a scoprire che
 * sono rimasti indietro, invece di accorgersene quando il file è già in
 * mano a qualcun altro.
 */

import { writeFileSync, readFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { createRequire } from "node:module";

/**
 * Da SVG a PNG. I social non aprono un SVG, quindi l'anteprima deve
 * essere un raster — e ora si può fare, perché nel file non c'è più
 * nessun testo: solo tracciati, che qualunque rasterizzatore disegna
 * uguale. Finché c'era `<text>`, il PNG usciva in Georgia.
 */
async function rasterizza(svg, destinazione) {
  let sharp;
  try {
    sharp = createRequire(import.meta.url)("sharp");
  } catch {
    console.log(
      `⚠️  ${destinazione} NON generato: manca sharp. Il PNG resta quello di prima.`,
    );
    return;
  }
  mkdirSync(dirname(destinazione), { recursive: true });
  await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toFile(destinazione);
  console.log(`🖼️  ${destinazione} — rasterizzato`);
}

process.env.NEXT_PUBLIC_SITE_URL ??= "https://verzero.it";

const { marchioEstesoSvg, logotipoSvg, cardSocialeSvg } = await import(
  "../src/lib/marchio-svg.ts"
);

const FILE = [
  {
    percorso: "public/brand/marchio-esteso.svg",
    genera: () => marchioEstesoSvg({ scuro: false }),
  },
  {
    percorso: "public/brand/marchio-esteso-scuro.svg",
    genera: () => marchioEstesoSvg({ scuro: true }),
  },
  // I due logotipi avevano lo stesso difetto dei nuovi: dichiaravano il
  // carattere invece di portarsi dietro le lettere. Ora vengono da qui.
  {
    percorso: "public/brand/logo-verzero.svg",
    genera: () => logotipoSvg({}),
  },
  {
    percorso: "public/brand/logo-verzero-scuro.svg",
    genera: () => logotipoSvg({ scuro: true }),
  },
  {
    percorso: "public/brand/logo-ver0.svg",
    genera: () => logotipoSvg({ monogramma: true }),
  },
  {
    percorso: "public/brand/anteprima-social.svg",
    genera: () => cardSocialeSvg(),
    /** I social non aprono un SVG: da qui esce anche il PNG. */
    raster: "public/social/anteprima-marca.png",
  },
];

const soloControllo = process.argv.includes("--controlla");
let disallineati = 0;

for (const { percorso, genera, raster } of FILE) {
  const atteso = genera();
  const presente = existsSync(percorso) ? readFileSync(percorso, "utf8") : null;

  if (soloControllo) {
    const uguale = presente === atteso;
    console.log(`${uguale ? "✅" : "❌"} ${percorso}`);
    if (!uguale) disallineati++;
    continue;
  }

  if (presente === atteso) {
    console.log(`·  ${percorso} — già allineato`);
    continue;
  }
  writeFileSync(percorso, atteso);
  console.log(`✍️  ${percorso} — scritto (${atteso.length} byte)`);
  if (raster) await rasterizza(atteso, raster);
}

if (soloControllo && disallineati > 0) {
  console.log(
    `\n${disallineati} file non combaciano col codice. Rigenerali:\n  node --import ./scripts/risolutore-ts.mjs scripts/esporta-marchio.mjs\n`,
  );
  process.exit(1);
}
