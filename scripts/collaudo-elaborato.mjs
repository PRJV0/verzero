/**
 * COLLAUDO DELLA GENERAZIONE — un documento completo, da guardare.
 *
 *   node --import ./scripts/risolutore-ts.mjs scripts/collaudo-elaborato.mjs [cartella]
 *
 * Compone l'Inventario GHG 2025 di Officina Lombardi S.r.l. — impresa
 * inventata, dati inventati, la parola «esempio» su ogni pagina — con le
 * STESSE funzioni che usa il portale: composizione dal modello, controllo
 * di consegna, veste, PDF. Nessuna scorciatoia per il collaudo: se il
 * documento esce qui, esce anche per un cliente con gli stessi dati.
 *
 * Produce, nella cartella indicata (predefinita: la cartella temporanea):
 *   · inventario-ghg-2025-esempio.pdf          con il marchio dell'impresa
 *   · inventario-ghg-2025-esempio-neutro.pdf   senza nessuna impostazione
 *   · anteprima-veste-esempio.pdf              copertina e prima sezione
 *   · logo-esempio.png                         il logo inventato usato
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import sharp from "sharp";

import { ingressoEsempio, MARCHIO_ESEMPIO } from "./esempio-elaborato.mjs";

const { modelloElaborato } = await import("../src/lib/elaborati.ts");
const { componiElaborato } = await import("../src/lib/elaborato/componi.ts");
const { verificaConsegna } = await import("../src/lib/elaborato/consegna.ts");
const { pdfElaborato, pdfAnteprima } = await import("../src/lib/elaborato/pdf.ts");
const { componiVeste } = await import("../src/lib/elaborato/veste.ts");
const { preparaLogo } = await import("../src/lib/elaborato/logo.ts");

const cartella = process.argv[2] ?? join(tmpdir(), "verzero-collaudo-elaborato");
mkdirSync(cartella, { recursive: true });

/* ── il logo inventato: un segno e il nome, disegnati qui ────────────── */
const accento = MARCHIO_ESEMPIO.colore_accento;
const segno = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="360" height="360" viewBox="0 0 360 360">
  <rect x="0" y="0" width="360" height="360" rx="64" fill="${accento}"/>
  <circle cx="132" cy="180" r="74" fill="none" stroke="#FFFFFF" stroke-width="34"/>
  <path d="M236 96 V264 H300" fill="none" stroke="#FFFFFF" stroke-width="34" stroke-linecap="square"/>
</svg>`);
const nome = await sharp({
  text: {
    text: `<span foreground="#1B2127">Officina Lombardi</span>`,
    fontfile: join(process.cwd(), "src/lib/elaborato/caratteri/InterDisplay-SemiBold.ttf"),
    font: "Inter Display SemiBold",
    dpi: 900,
    rgba: true,
  },
})
  .png()
  .toBuffer();
const metaNome = await sharp(nome).metadata();
const altezzaNome = 150;
const nomeScalato = await sharp(nome).resize({ height: altezzaNome }).png().toBuffer();
const larghezzaNome = Math.round((metaNome.width / metaNome.height) * altezzaNome);
const logo = await sharp({
  create: { width: 360 + 60 + larghezzaNome, height: 360, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
})
  .composite([
    { input: await sharp(segno).png().toBuffer(), left: 0, top: 0 },
    { input: nomeScalato, left: 420, top: Math.round((360 - altezzaNome) / 2) },
  ])
  .png()
  .toBuffer();
writeFileSync(join(cartella, "logo-esempio.png"), logo);

const preparato = await preparaLogo(new Uint8Array(logo), "image/png");
if ("errore" in preparato) throw new Error(preparato.errore);
console.log(`Logo: ${preparato.larghezza}×${preparato.altezza} px — ${preparato.esito.messaggi.map((m) => `${m.tono}: ${m.testo}`).join(" | ")}`);

/* ── la composizione e il controllo, come nel portale ────────────────── */
const modello = modelloElaborato("carbon-footprint", 2025);
const { elaborato, mancanze } = componiElaborato(ingressoEsempio(modello));
const esito = verificaConsegna(elaborato, {
  modello,
  opzioni: [],
  mancanzeComposizione: mancanze,
  esercizio: 2025,
});
if (!esito.consegnabile) {
  console.log("\nIl documento NON è consegnabile:");
  for (const m of esito.mancanze) console.log(`  · [${m.chi}] ${m.sezione ? `${m.sezione}: ` : ""}${m.messaggio}`);
  process.exit(1);
}

const conMarchio = componiVeste({
  ragioneSociale: elaborato.frontespizio.organizzazione,
  impostazioni: {
    ...MARCHIO_ESEMPIO,
    logo_larghezza: preparato.larghezza,
    logo_altezza: preparato.altezza,
    logo_vettoriale: preparato.vettoriale,
  },
  logoPng: preparato.png,
});
const neutra = componiVeste({ ragioneSociale: elaborato.frontespizio.organizzazione, impostazioni: null });

const a = await pdfElaborato(esito.elaborato, conMarchio);
writeFileSync(join(cartella, "inventario-ghg-2025-esempio.pdf"), a.byte);
const b = await pdfElaborato(esito.elaborato, neutra);
writeFileSync(join(cartella, "inventario-ghg-2025-esempio-neutro.pdf"), b.byte);
const c = await pdfAnteprima(elaborato, conMarchio);
writeFileSync(join(cartella, "anteprima-veste-esempio.pdf"), c.byte);

const fonti = elaborato.fonti.reduce((t, f) => ({ ...t, [f.tipo]: (t[f.tipo] ?? 0) + 1 }), {});
console.log(`\nConsegnabile: sì`);
console.log(`Sezioni: ${elaborato.sezioni.length} · fonti: ${JSON.stringify(fonti)}`);
console.log(`Con marchio: ${a.pagine} pagine, ${(a.byte.length / 1024).toFixed(0)} KB`);
console.log(`Neutro: ${b.pagine} pagine · anteprima: ${c.pagine} pagine`);
console.log(`Avvisi di veste: ${conMarchio.avvisi.length ? conMarchio.avvisi.join(" | ") : "nessuno"}`);
console.log(`\nFile in ${cartella}`);
