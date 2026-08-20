/*
 * CONTROLLO DEL SISTEMA DI MOVIMENTO (SPEC §12.X).
 *
 * Si esegue sul CSS COSTRUITO, non sui sorgenti: è l'unico modo per
 * accorgersi di una regola che nasce da un'utility, da un plugin o da un
 * refuso e che nei .css scritti a mano non si vede.
 *
 * Due domande, entrambe sì/no:
 *   1. Esiste una regola che nasconde contenuto (opacity 0, tratto non
 *      disegnato) fuori da @media (prefers-reduced-motion: no-preference)?
 *      Se sì, chi ha chiesto meno movimento perde del contenuto.
 *   2. Esiste un'animazione del sistema con una durata scritta a mano?
 *      Se sì, esistono due sistemi di movimento invece di uno.
 *
 * Uso:  npm run build && node scripts/verifica-movimento.mjs
 */
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const dir = ".next/static/chunks";
const file = readdirSync(dir).find((f) => f.endsWith(".css"));
const css = readFileSync(join(dir, file), "utf8");
console.log("CSS di build analizzato:", file, Math.round(css.length / 1024) + " KB");

// Segmenta il CSS nei blocchi @media di interesse.
const blocchi = [];
let i = 0;
while (i < css.length) {
  const m = css.indexOf("@media", i);
  if (m < 0) break;
  const apre = css.indexOf("{", m);
  const query = css.slice(m, apre);
  let livello = 0, j = apre;
  for (; j < css.length; j++) {
    if (css[j] === "{") livello++;
    else if (css[j] === "}") { livello--; if (livello === 0) break; }
  }
  blocchi.push({ query, da: m, a: j, corpo: css.slice(apre, j) });
  i = apre + 1;
}

const protetto = (pos) =>
  blocchi.some(
    (b) => pos > b.da && pos < b.a && /prefers-reduced-motion:\s*no-preference/.test(b.query),
  );

// Ogni regola che parte da opacity:0 sulle classi del sistema di movimento.
const sospette = [];
for (const classe of ["vz-parola", "vz-entra", "vz-zero-segno", "vz-reveal", "vz-riga-valore", "vz-timbro", "vz-arco"]) {
  const re = new RegExp(`\\.${classe}[^{}]*\\{[^}]*\\}`, "g");
  let m;
  while ((m = re.exec(css))) {
    const nasconde = /opacity:\s*0(?![.\d])/.test(m[0]) || /stroke-dasharray/.test(m[0]);
    const dentroAnimazione = /animation:/.test(m[0]);
    // Eccezione motivata: il segno del marchio è decorativo (aria-hidden)
    // e il suo stato di riposo È l'invisibilità — con «riduci movimento»
    // resta scritta la parola «zero», che è il contenuto vero.
    const decorativoAmmesso = classe === "vz-zero-segno" && !dentroAnimazione;
    if ((nasconde || dentroAnimazione) && !protetto(m.index) && !decorativoAmmesso) {
      sospette.push({ classe, regola: m[0].slice(0, 120) });
    }
  }
}

console.log("blocchi @media analizzati:", blocchi.length);
console.log(
  sospette.length === 0
    ? "OK — nessuna regola nasconde contenuto fuori da «no-preference»"
    : "ATTENZIONE, regole che nascondono contenuto senza protezione:",
);
for (const s of sospette) console.log("  •", s.classe, "→", s.regola);


/* Secondo controllo: nessuna durata scritta a mano nel sistema di
   movimento. Ogni animation delle classi vz- deve leggere un token. */
const durateAMano = [];
const reAnim = /\.vz-[a-z-]+[^{}]*\{[^}]*animation:[^;]+;/g;
let a;
while ((a = reAnim.exec(css))) {
  const dichiarazione = a[0].match(/animation:[^;]+/)[0];
  const haToken = /var\(--vz-/.test(dichiarazione);
  // Le animazioni d'ambiente (fondo, filigrane, flussi) hanno cicli lunghi
  // dichiarati apposta: sono l'unica famiglia esente, e si riconosce dal
  // fatto che durano secondi interi.
  const ambiente = /\b(2[0-9]|[3-9][0-9]|1[0-9]{2})s\b/.test(dichiarazione) || /\b[2-9]\.?[0-9]?s\b/.test(dichiarazione);
  if (!haToken && !ambiente) durateAMano.push(dichiarazione.slice(0, 90));
}
console.log(
  durateAMano.length === 0
    ? "OK — nessuna durata scritta a mano fuori dai token"
    : "Durate a mano trovate:",
);
for (const d of durateAMano) console.log("  •", d);

if (sospette.length > 0 || durateAMano.length > 0) process.exitCode = 1;
