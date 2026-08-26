/**
 * TEST DEL MARCHIO — le proporzioni tengono, e i file su disco pure.
 *
 *   node --import ./scripts/risolutore-ts.mjs scripts/test-marchio.mjs
 *
 * Un lockup si rompe in silenzio. Nessuno di questi errori dà un
 * messaggio in console: le due righe smettono di finire allineate, lo
 * zero sfonda di mezzo pixel sotto il payoff, il file scaricabile resta
 * indietro di una revisione. Si vedono solo guardando — e nessuno
 * guarda un footer due volte.
 */

import { existsSync, readFileSync } from "node:fs";

process.env.NEXT_PUBLIC_SITE_URL ??= "https://verzero.it";

const { LOCKUP, PAYOFF_LOCKUP, variantePer } = await import("../src/lib/marchio.ts");
const { marchioEstesoSvg, logotipoSvg, cardSocialeSvg } = await import(
  "../src/lib/marchio-svg.ts"
);
const { SITO } = await import("../src/lib/seo.ts");
const { MARCHIO_TARGA_CORPO } = await import("../src/lib/targa-avvio.ts");

let superati = 0;
let falliti = 0;
function verifica(descrizione, condizione, dettaglio = "") {
  console.log(
    `${condizione ? "✅" : "❌"} ${descrizione}${dettaglio ? ` — ${dettaglio}` : ""}`,
  );
  condizione ? superati++ : falliti++;
}

/** Due misure combaciano se stanno entro mezzo millesimo di em. */
const uguali = (a, b) => Math.abs(a - b) < 0.0005;

/* ================================================================== */
console.log("\n— la geometria —\n");

verifica(
  "la larghezza è nome + stacco + zero, senza avanzi",
  uguali(
    LOCKUP.larghezza,
    LOCKUP.larghezzaNome + LOCKUP.distanzaZero + LOCKUP.zeroLarghezza,
  ),
);
verifica(
  "l'altezza dell'inchiostro è quella dello zero: lo zero copre tutta la composizione",
  uguali(LOCKUP.altezza, LOCKUP.zeroAltezza),
);
verifica(
  "lo zero parte dall'altezza delle maiuscole della riga 1",
  uguali(LOCKUP.zeroDaSopra, LOCKUP.vuotoSopra),
);
verifica(
  "e arriva esattamente alla linea di base del payoff",
  uguali(LOCKUP.basePayoffDaCima, LOCKUP.zeroAltezza),
  `${LOCKUP.basePayoffDaCima} vs ${LOCKUP.zeroAltezza}`,
);
verifica(
  "la linea di base del nome sta a un'altezza-maiuscole dalla cima",
  uguali(LOCKUP.baseNomeDaCima, 0.7),
);
verifica(
  "l'ellisse dello zero tiene la proporzione di quella canonica (11/15)",
  uguali(
    (LOCKUP.zeroLarghezza - LOCKUP.zeroTratto) /
      (LOCKUP.zeroAltezza - LOCKUP.zeroTratto),
    11 / 15,
  ),
);
verifica(
  "il tratto dello zero è quello del logotipo, non uno suo",
  uguali(LOCKUP.zeroTratto, (4 / 40) * 0.82),
  `${LOCKUP.zeroTratto}`,
);
verifica(
  "l'area di rispetto è la larghezza dello zero",
  uguali(LOCKUP.respiro, LOCKUP.zeroLarghezza),
);
verifica(
  "i due vuoti da ritagliare più l'inchiostro fanno la scatola vera del flusso",
  uguali(
    LOCKUP.vuotoSopra + LOCKUP.altezza + LOCKUP.vuotoSotto,
    LOCKUP.interlineaNome + LOCKUP.staccoPayoff + PAYOFF_LOCKUP.scala,
  ),
  `${(LOCKUP.vuotoSopra + LOCKUP.altezza + LOCKUP.vuotoSotto).toFixed(4)} em`,
);

/* ================================================================== */
console.log("\n— il payoff —\n");

verifica(
  "la riga 2 è il payoff senza l'ultima parola: quella è lo zero disegnato",
  SITO.payoff.toUpperCase().startsWith(PAYOFF_LOCKUP.riga),
  `«${PAYOFF_LOCKUP.riga}» dentro «${SITO.payoff.toUpperCase()}»`,
);
verifica(
  "e ciò che resta fuori è esattamente «ZERO»",
  SITO.payoff.toUpperCase().slice(PAYOFF_LOCKUP.riga.length).trim() === "ZERO",
  SITO.payoff.toUpperCase().slice(PAYOFF_LOCKUP.riga.length).trim(),
);
verifica(
  "l'etichetta parlata porta il payoff INTERO, non la sua metà",
  PAYOFF_LOCKUP.completo === SITO.payoff,
);
verifica(
  "la coda della crenatura è crenatura per scala, non un numero a parte",
  uguali(
    PAYOFF_LOCKUP.codaCrenatura,
    PAYOFF_LOCKUP.tracking * PAYOFF_LOCKUP.scala,
  ),
);
verifica(
  "sotto la misura minima il payoff starebbe sotto i dieci pixel",
  LOCKUP.minimaPx * PAYOFF_LOCKUP.scala >= 10,
  `${(LOCKUP.minimaPx * PAYOFF_LOCKUP.scala).toFixed(1)} px a ${LOCKUP.minimaPx}`,
);

/* ================================================================== */
console.log("\n— la misura minima non è un consiglio —\n");

verifica(
  "alla misura minima esatta la variante estesa esce estesa",
  variantePer("estesa", LOCKUP.minimaPx) === "estesa",
);
verifica(
  "un pixel sotto, il componente ripiega sulla semplice",
  variantePer("estesa", LOCKUP.minimaPx - 1) === "semplice",
);
verifica(
  "senza misura dichiarata, estesa non si compone: sarebbe a caso",
  variantePer("estesa", undefined) === "semplice",
);
verifica(
  "e la semplice resta semplice a qualunque misura",
  variantePer("semplice", 400) === "semplice",
);
verifica(
  "il marchio della targa scaricabile sta sopra la soglia, non SULLA soglia",
  MARCHIO_TARGA_CORPO >= LOCKUP.minimaPx,
  `${MARCHIO_TARGA_CORPO} contro ${LOCKUP.minimaPx}`,
);

/* ================================================================== */
console.log("\n— i file esportati —\n");

for (const [percorso, genera] of [
  ["public/brand/marchio-esteso.svg", () => marchioEstesoSvg({ scuro: false })],
  ["public/brand/marchio-esteso-scuro.svg", () => marchioEstesoSvg({ scuro: true })],
  ["public/brand/logo-verzero.svg", () => logotipoSvg({})],
  ["public/brand/logo-verzero-scuro.svg", () => logotipoSvg({ scuro: true })],
  ["public/brand/logo-ver0.svg", () => logotipoSvg({ monogramma: true })],
  ["public/brand/anteprima-social.svg", () => cardSocialeSvg()],
]) {
  verifica(`${percorso} esiste`, existsSync(percorso));
  if (!existsSync(percorso)) continue;
  const presente = readFileSync(percorso, "utf8");
  verifica(
    "  combacia con quello che il codice genera oggi",
    presente === genera(),
    "rigenera con scripts/esporta-marchio.mjs",
  );
  verifica(
    "  NESSUN <text>: le lettere sono tracciati, non un carattere sperato",
    !presente.includes("<text") && !presente.includes("font-family"),
  );
}

verifica(
  "il lockup esportato ha l'area di rispetto dentro il riquadro",
  readFileSync("public/brand/marchio-esteso.svg", "utf8").includes(
    `translate(${(LOCKUP.respiro * 100).toFixed(2)},${(LOCKUP.respiro * 100).toFixed(2)})`,
  ),
);
verifica(
  "e porta il payoff intero nell'etichetta parlata",
  readFileSync("public/brand/marchio-esteso.svg", "utf8").includes(SITO.payoff),
);
verifica(
  "l'anteprima social esiste anche come PNG: i social non aprono un SVG",
  existsSync("public/social/anteprima-marca.png"),
);

const scuro = readFileSync("public/brand/marchio-esteso-scuro.svg", "utf8");
verifica(
  "la versione scura ha un fondo dipinto: un SVG trasparente su bianco sparisce",
  /<rect width="[\d.]+" height="[\d.]+" fill="#0A2E1F"\/>/.test(scuro),
);

/* ================================================================== */
console.log(
  `\nRisultato: ${superati}/${superati + falliti} controlli superati${falliti ? ` — ${falliti} FALLITI` : ""}\n`,
);
process.exit(falliti === 0 ? 0 : 1);
