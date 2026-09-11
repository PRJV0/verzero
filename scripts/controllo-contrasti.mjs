/**
 * CONTROLLO DEI CONTRASTI — la palette non si cambia a occhio.
 *
 *   node scripts/controllo-contrasti.mjs
 *
 * Gira PRIMA DELLA BUILD (`prebuild`): se un token scende sotto la
 * soglia del suo caso d'uso, la build si ferma.
 *
 * ═══ PERCHÉ ESISTE ═══
 * Perché un contrasto insufficiente non dà errore da nessuna parte. La
 * palette precedente aveva TRE casi sotto soglia e ci sono rimasti finché
 * qualcuno non li ha misurati: il grigio chiaro su carta a 2,47:1, la
 * menta su bianco a 3,39:1, e la parola «Zero» in menta sulla fascia
 * salvia della home a 2,91:1 — sotto il minimo anche per il corpo
 * grande, cioè illeggibile proprio dove il sistema di marca mette il suo
 * accento. Nessuno dei tre si vedeva guardando la pagina.
 *
 * ═══ I VALORI VENGONO DA `globals.css` ═══
 * Non si ricopiano qui: si leggono dal foglio di stile, che è la fonte
 * unica. Un token cambiato lì e non qui farebbe fallire il controllo con
 * un token mancante, che è il modo giusto di accorgersene.
 *
 * ═══ LE SOGLIE ═══
 * 4,5:1 per il testo normale, 3:1 per il corpo grande (da 24 px in su, o
 * 19 px in grassetto) e per i segni non testuali — è il minimo AA delle
 * WCAG 2.1. Dove un caso sta sopra il minimo lo si lascia stare: il
 * controllo serve a non scendere, non a inseguire il massimo.
 */

import { readFileSync } from "node:fs";

/* ── i token, letti dalla fonte ─────────────────────────────────────── */

const css = readFileSync("src/app/globals.css", "utf8");

function token(nome) {
  const m = css.match(new RegExp(`--color-${nome}:\\s*(#[0-9a-fA-F]{6})`));
  if (!m) {
    console.error(`❌ token --color-${nome} non trovato in globals.css`);
    process.exit(1);
  }
  return m[1].toUpperCase();
}

const C = {
  ink: token("ink"),
  pine: token("pine"),
  pineDark: token("pine-dark"),
  pineDeep: token("pine-deep"),
  sage: token("sage"),
  moss: token("moss"),
  paper: token("paper"),
  line: token("line"),
  mint: token("mint"),
  mintBright: token("mint-bright"),
  grayWarm: token("gray-warm"),
  grayLight: token("gray-light"),
  amberSoft: token("amber-soft"),
  amberInk: token("amber-ink"),
  bianco: "#FFFFFF",
};

/* ── il calcolo, secondo WCAG 2.1 ───────────────────────────────────── */

const canale = (c) => {
  const s = c / 255;
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
};

function luminanza(hex) {
  const n = hex.replace("#", "");
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(n.slice(i, i + 2), 16));
  return 0.2126 * canale(r) + 0.7152 * canale(g) + 0.0722 * canale(b);
}

function contrasto(a, b) {
  const [alto, basso] = [luminanza(a), luminanza(b)].sort((x, y) => y - x);
  return (alto + 0.05) / (basso + 0.05);
}

/* ── i casi critici, con il posto in cui vivono ─────────────────────── */

const CASI = [
  ["bianco su pino profondo — il claim dell'hero", C.bianco, C.pineDeep, 4.5],
  ["salvia su pino profondo — il sottotitolo dell'hero", C.moss, C.pineDeep, 4.5],
  ["menta viva su pino profondo — l'accento dell'hero", C.mintBright, C.pineDeep, 4.5],
  ["bianco su pino — il pulsante pieno", C.bianco, C.pine, 4.5],
  ["pino su bianco — il pulsante di contorno", C.pine, C.bianco, 4.5],
  ["pino su carta — occhielli e rimandi", C.pine, C.paper, 4.5],
  ["pino su salvia — le fasce chiare", C.pine, C.moss, 4.5],
  ["pino su salvia media — le fasce intermedie", C.pine, C.sage, 4.5],
  ["inchiostro su salvia media", C.ink, C.sage, 4.5],
  ["inchiostro su carta — il corpo del testo", C.ink, C.paper, 4.5],
  ["grigio caldo su carta — il corpo secondario", C.grayWarm, C.paper, 4.5],
  ["grigio chiaro su carta — le note piccole", C.grayLight, C.paper, 3],
  ["menta su bianco — icone e rimandi", C.mint, C.bianco, 4.5],
  // La parola-Zero del sistema di marca: corpo grande, quindi 3:1.
  ["menta su salvia — la parola «Zero»", C.mint, C.moss, 3],
  ["menta viva su pino — i bordi sul fondo scuro", C.mintBright, C.pine, 3],
  ["inchiostro ambra su ambra — lo stato «da fare»", C.amberInk, C.amberSoft, 4.5],
];

/* ── esecuzione ─────────────────────────────────────────────────────── */

let sotto = 0;
console.log("Contrasti della palette, misurati su globals.css:\n");
for (const [nome, a, b, soglia] of CASI) {
  const c = contrasto(a, b);
  const ok = c >= soglia;
  if (!ok) sotto++;
  console.log(
    `  ${ok ? "✅" : "❌"} ${c.toFixed(2).padStart(5)}:1  (min ${soglia})  ${nome}`,
  );
}

if (sotto > 0) {
  console.error(
    `\n${sotto} contrasti sotto soglia.\n\nUn contrasto insufficiente non si vede guardando la pagina e non dà\nerrore da nessuna parte: si corregge il token in src/app/globals.css,\nnon si abbassa la soglia qui.\n`,
  );
  process.exit(1);
}

console.log(`\n✅ contrasti: ${CASI.length} casi critici, nessuno sotto soglia.`);
