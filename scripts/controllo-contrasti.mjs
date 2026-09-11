/**
 * CONTROLLO DEI CONTRASTI — la palette non si cambia a occhio.
 *
 * NOTA SUL BIANCO: `--color-white` è ridefinito ad avorio (v. la
 * doctrine in globals.css), quindi i casi che qui si chiamano «avorio»
 * sono gli stessi `bg-white` / `text-white` di tutto il prodotto.
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

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

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
  avorio: token("white"),
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
  ["avorio su pino profondo — il claim dell'hero", C.avorio, C.pineDeep, 4.5],
  ["salvia su pino profondo — il sottotitolo dell'hero", C.moss, C.pineDeep, 4.5],
  ["menta viva su pino profondo — l'accento dell'hero", C.mintBright, C.pineDeep, 4.5],
  ["avorio su pino — il pulsante pieno", C.avorio, C.pine, 4.5],
  ["pino su avorio — il pulsante di contorno", C.pine, C.avorio, 4.5],
  ["pino su carta — occhielli e rimandi", C.pine, C.paper, 4.5],
  ["pino su salvia — le fasce chiare", C.pine, C.moss, 4.5],
  ["pino su salvia media — le fasce intermedie", C.pine, C.sage, 4.5],
  ["inchiostro su salvia media", C.ink, C.sage, 4.5],
  // Sul salvia il grigio caldo NON regge (3,51:1): il secondario è il
  // pino. Il caso sta qui perché è quello che si sbaglia — e il
  // controllo d'uso in fondo allo script verifica che nessuna fascia
  // salvia porti i grigi della carta.
  ["pino su salvia media — il corpo secondario", C.pine, C.sage, 4.5],
  ["inchiostro su carta — il corpo del testo", C.ink, C.paper, 4.5],
  ["grigio caldo su carta — il corpo secondario", C.grayWarm, C.paper, 4.5],
  ["grigio chiaro su carta — le note piccole", C.grayLight, C.paper, 3],
  ["menta su avorio — icone e rimandi", C.mint, C.avorio, 4.5],
  // La parola-Zero del sistema di marca: corpo grande, quindi 3:1.
  ["menta su salvia — la parola «Zero»", C.mint, C.moss, 3],
  // Da quando la fascia dello Zero sta sul livello intermedio, è QUESTO
  // il fondo su cui la parola-Zero va letta.
  ["menta su salvia media — la parola «Zero» nella fascia", C.mint, C.sage, 3],
  ["menta viva su pino — i bordi sul fondo scuro", C.mintBright, C.pine, 3],
  // ── IL SECONDO E IL TERZO SCURO ──────────────────────────────────
  // Il pino profondo fa solo le estremità di una pagina; in mezzo si
  // sale a pino scuro e pino. Tre fondi scuri invece di uno, quindi tre
  // volte i casi da tenere: un testo che sta bene sul più profondo non
  // sta automaticamente bene sul più chiaro dei tre.
  ["avorio su pino scuro — le fasce intermedie del Sigillo", C.avorio, C.pineDark, 4.5],
  ["salvia su pino scuro — il corpo sul fondo scuro", C.moss, C.pineDark, 4.5],
  ["menta viva su pino scuro — l'accento", C.mintBright, C.pineDark, 3],
  ["salvia su pino — il corpo sulla sezione più chiara", C.moss, C.pine, 4.5],
  // Il fondo del prezzo e del Motore in home: il gradiente parte da qui,
  // e il prezzo va letto grande e senza sforzo.
  ["avorio su pino — il prezzo e il Motore", C.avorio, C.pine, 4.5],
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

/* ══════════════════════════════════════════════════════════════════ */
/* CHI STA SOPRA IL SALVIA — il controllo che i token da soli non fanno */
/* ══════════════════════════════════════════════════════════════════ */

/**
 * ═══ PERCHÉ NON BASTA MISURARE LE COPPIE ═══
 * Il controllo sopra verifica che ogni coppia dichiarata stia sopra
 * soglia. Non sa quale testo finisce su quale fondo — e la prima fascia
 * salvia del sito portava il corpo in grigio caldo, che ci sta a 3,51:1:
 * sotto la soglia del testo normale, su un fondo scelto apposta per
 * migliorare la leggibilità. Nessuno se n'era accorto, perché guardando
 * la pagina non si vede.
 *
 * Il salvia è il caso critico perché sta NEL MEZZO: abbastanza chiaro da
 * sembrare un fondo chiaro, abbastanza scuro da far cadere sotto soglia
 * i grigi pensati per la carta. Sul pino profondo l'errore non si fa —
 * si vede subito — e sulla carta non esiste.
 *
 * ═══ COME ═══
 * Si prende ogni blocco che apre con `bg-sage` e si guarda che cosa ci
 * sta dentro. Il blocco finisce dove ne comincia un altro: è
 * un'euristica, non un parser JSX, e sbaglia solo nel verso prudente —
 * al massimo controlla qualche riga in più del dovuto.
 */
const VIETATI_SU_SALVIA = [
  ["text-gray-warm", "3,51:1 — sotto la soglia del corpo. Usa text-ink o text-pine."],
  ["text-gray-light", "2,26:1 — illeggibile. Usa text-pine."],
  ["border-line", "1,22:1 — il filetto sparisce. Usa border-pine/15."],
];

function fileSorgente(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((d) => {
    const p = join(dir, d.name);
    if (d.isDirectory()) return fileSorgente(p);
    return /\.(tsx|ts)$/.test(d.name) ? [p] : [];
  });
}

const APERTURA = /<(?:section|div|main|article|aside|header|footer)\b/g;

let violazioni = 0;
for (const file of fileSorgente("src")) {
  const testo = readFileSync(file, "utf8");
  if (!testo.includes("bg-sage")) continue;

  // I confini dei blocchi: ogni tag di apertura di un contenitore.
  const inizi = [...testo.matchAll(APERTURA)].map((m) => m.index);
  for (let i = 0; i < inizi.length; i++) {
    const blocco = testo.slice(inizi[i], inizi[i + 1] ?? testo.length);
    // Solo i blocchi che DICHIARANO il salvia nella propria apertura.
    const apertura = blocco.slice(0, blocco.indexOf(">") + 1);
    if (!/\bbg-sage\b/.test(apertura)) continue;

    // Il blocco vero: da qui fino a dove ricomincia un contenitore che
    // non è salvia — cioè tutto il sottoalbero, approssimato.
    let fine = testo.length;
    for (let j = i + 1; j < inizi.length; j++) {
      const succ = testo.slice(inizi[j], inizi[j] + 400);
      if (/\bbg-(pine|paper|white|moss)\b/.test(succ.slice(0, succ.indexOf(">") + 1))) {
        fine = inizi[j];
        break;
      }
    }
    const dentro = testo.slice(inizi[i], fine);
    for (const [classe, perche] of VIETATI_SU_SALVIA) {
      // I commenti spiegano il divieto: non si controllano.
      const righe = dentro
        .split("\n")
        .filter((r) => r.includes(classe) && !/^\s*(\/\/|\*|\{\/\*)/.test(r));
      if (righe.length > 0) {
        violazioni++;
        console.error(
          `\n❌ ${file}: «${classe}» dentro una fascia bg-sage — ${perche}`,
        );
        for (const r of righe.slice(0, 3)) console.error(`     ${r.trim().slice(0, 100)}`);
      }
    }
  }
}

if (violazioni > 0) {
  console.error(
    `\n${violazioni} usi sotto soglia sul livello intermedio.\n\nIl salvia sta nel mezzo: abbastanza chiaro da sembrare un fondo\nchiaro, abbastanza scuro da far cadere sotto soglia i grigi pensati\nper la carta. È l'unico fondo su cui questo errore non si vede.\n`,
  );
  process.exit(1);
}
console.log("✅ livello intermedio: nessun testo sotto soglia sulle fasce salvia.");
