/**
 * CONTROLLO DELLE DESIGNAZIONI DI NORMA.
 *
 * Una norma citata con la designazione sbagliata, su un sito che vende
 * conformità, è la peggiore figura possibile — e non dà errore da
 * nessuna parte. Il 24 agosto 2026 ne avevamo QUATTRO superate: tre
 * scoperte scrivendo una guida, la quarta solo perché qualcuno ha
 * chiesto conferma che la propagazione fosse completa. È la prova che a
 * mano non si tiene: serve un controllo.
 *
 * ═══ COME FUNZIONA ═══
 *
 * 1. Estrae ogni designazione dal codice e dai documenti.
 * 2. La confronta con il REGISTRO qui sotto: ogni voce porta lo stato,
 *    la data di verifica e la pagina UNI dove si controlla.
 * 3. Fallisce se trova una designazione SCONOSCIUTA — così una norma
 *    nuova non entra in pagina senza passare da una verifica — oppure
 *    una RITIRATA usata come se fosse valida.
 *
 * Una designazione ritirata si può citare, ma solo per dire che è
 * ritirata: il controllo lo riconosce dalla parola «ritirat» sulla
 * stessa riga. È il caso delle guide, che spiegano cos'è cambiato.
 *
 * ═══ USO ═══
 *
 *   node scripts/controllo-norme.mjs             solo il registro
 *   node scripts/controllo-norme.mjs --online    richiede anche a UNI
 *
 * La forma `--online` rilegge lo stato dal catalogo UNI e segnala le
 * norme ritirate dopo l'ultima verifica: è quella da eseguire ogni
 * tanto, non a ogni build.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

/**
 * IL REGISTRO — verificato su store.uni.com il 24 agosto 2026.
 *
 * `url` è la pagina del catalogo UNI: è quella l'autorità sulla
 * designazione italiana, non il sito ISO e tanto meno un articolo che
 * la riassume. Le voci senza `url` non sono norme UNI (schemi privati,
 * standard di altri enti) e vanno verificate alla fonte indicata.
 */
const REGISTRO = [
  {
    codice: "UNI EN ISO 9001:2015+A1:2024",
    url: "https://store.uni.com/uni-en-iso-9001-2015-a1-2024",
    stato: "in vigore",
    dal: "16 ottobre 2024",
  },
  {
    codice: "UNI EN ISO 14001:2026",
    url: "https://store.uni.com/uni-en-iso-14001-2026",
    stato: "in vigore",
    dal: "15 aprile 2026",
  },
  {
    codice: "UNI EN ISO 45001:2023+A1:2024",
    url: "https://store.uni.com/uni-en-iso-45001-2023-a1-2024",
    stato: "in vigore",
  },
  {
    codice: "UNI EN ISO 14064-1:2019",
    url: "https://store.uni.com/uni-en-iso-14064-1-2019",
    stato: "in vigore",
    dal: "11 aprile 2019",
  },
  {
    codice: "UNI/PdR 125:2022",
    url: "https://store.uni.com/uni-pdr-125-2022",
    stato: "in vigore",
    dal: "16 marzo 2022",
  },
  {
    codice: "UNI/TS 11820:2024",
    url: "https://store.uni.com/uni-ts-11820-2024",
    stato: "in vigore",
    dal: "14 novembre 2024",
  },
  {
    codice: "UNI ISO 45003:2021",
    url: "https://store.uni.com/uni-iso-45003-2021",
    stato: "in vigore",
    dal: "18 novembre 2021",
  },
  {
    codice: "UNI ISO 30415:2021",
    url: "https://store.uni.com/uni-iso-30415-2021",
    stato: "in vigore",
    dal: "29 luglio 2021",
  },
  {
    codice: "UNI CEI EN ISO/IEC 17021-1:2015",
    url: "https://store.uni.com/uni-cei-en-iso-iec-17021-1-2015",
    stato: "in vigore",
    dal: "6 agosto 2015",
  },
  {
    // La stessa norma citata nella forma internazionale, dove il
    // contesto è la regola sugli organismi e non il catalogo italiano.
    codice: "ISO/IEC 17021-1:2015",
    url: "https://store.uni.com/uni-cei-en-iso-iec-17021-1-2015",
    stato: "in vigore",
  },
  {
    codice: "SA8000:2014",
    stato: "in vigore",
    nota: "Schema privato di Social Accountability International, non una norma UNI: si verifica su sa-intl.org.",
  },
  /* ── Ritirate: citabili SOLO per dire che sono ritirate ───────────── */
  {
    codice: "UNI EN ISO 9001:2015",
    url: "https://store.uni.com/uni-en-iso-9001-2015",
    stato: "ritirata",
    dal: "16 ottobre 2024",
    sostituita: "UNI EN ISO 9001:2015+A1:2024",
  },
  {
    codice: "UNI EN ISO 14001:2015",
    stato: "ritirata",
    sostituita: "UNI EN ISO 14001:2026",
  },
  {
    codice: "UNI EN ISO 14001:2015+A1:2024",
    url: "https://store.uni.com/uni-en-iso-14001-2015-a1-2024",
    stato: "ritirata",
    dal: "15 aprile 2026",
    sostituita: "UNI EN ISO 14001:2026",
  },
  {
    codice: "UNI ISO 45001:2018",
    url: "https://store.uni.com/uni-iso-45001-2018",
    stato: "ritirata",
    dal: "28 settembre 2023",
    sostituita: "UNI EN ISO 45001:2023+A1:2024",
  },
  {
    codice: "UNI/TS 11820:2022",
    url: "https://store.uni.com/uni-ts-11820-2022",
    stato: "ritirata",
    dal: "14 novembre 2024",
    sostituita: "UNI/TS 11820:2024",
  },
];

const VERIFICATO_IL = "24 agosto 2026";

/** La forma di una designazione, in tutte le varianti che usiamo. */
const FORMA =
  /UNI(?: CEI)?(?: EN)? ISO(?:\/IEC)? \d{3,5}(?:-\d)?:\d{4}(?:\+?A\d+:\d{4})?|UNI\/(?:PdR|TS) \d+:\d{4}|ISO\/IEC \d+-\d:\d{4}|SA8000:\d{4}/g;

/* ── 1. Dove guardare ───────────────────────────────────────────────── */
const file = [];
const raccogli = (dir) => {
  for (const voce of readdirSync(dir)) {
    if (voce === "node_modules" || voce === ".next" || voce.startsWith(".")) continue;
    const percorso = join(dir, voce);
    if (statSync(percorso).isDirectory()) raccogli(percorso);
    else if (/\.(ts|tsx|md)$/.test(voce)) file.push(percorso);
  }
};
raccogli("src");
for (const voce of readdirSync(".")) {
  if (voce.endsWith(".md")) file.push(voce);
}

/* ── 2. Estrarre e confrontare ──────────────────────────────────────── */
const perCodice = new Map(REGISTRO.map((n) => [n.codice, n]));
const trovate = new Map();
let problemi = 0;

for (const f of file) {
  // Il registro parla di sé stesso: non si controlla da solo.
  if (f.endsWith("controllo-norme.mjs")) continue;
  const righe = readFileSync(f, "utf8").split("\n");
  righe.forEach((riga, i) => {
    for (const m of riga.matchAll(FORMA)) {
      const codice = m[0];
      const posto = `${f}:${i + 1}`;
      if (!trovate.has(codice)) trovate.set(codice, []);
      trovate.get(codice).push({ posto, riga });
    }
  });
}

console.log(`Designazioni trovate: ${trovate.size} · registro verificato il ${VERIFICATO_IL}\n`);

for (const [codice, usi] of [...trovate].sort()) {
  const nota = perCodice.get(codice);
  if (!nota) {
    problemi++;
    console.log(`  ✗ ${codice} — SCONOSCIUTA: verificarla su store.uni.com e aggiungerla al registro`);
    for (const u of usi.slice(0, 3)) console.log(`      ${u.posto}`);
    continue;
  }
  if (nota.stato === "ritirata") {
    // Ammessa solo dove la riga stessa dice che è ritirata.
    const abusi = usi.filter((u) => !/ritirat/i.test(u.riga));
    if (abusi.length) {
      problemi += abusi.length;
      console.log(`  ✗ ${codice} — RITIRATA, usata come valida (sostituita da ${nota.sostituita})`);
      for (const u of abusi) console.log(`      ${u.posto}`);
    } else {
      console.log(`  · ${codice} — ritirata, citata come tale in ${usi.length} punt${usi.length === 1 ? "o" : "i"}`);
    }
    continue;
  }
  console.log(`  ✓ ${codice} — in vigore${nota.dal ? ` dal ${nota.dal}` : ""} · ${usi.length} usi`);
}

/* ── 3. La verifica periodica, contro il catalogo UNI ───────────────── */
if (process.argv.includes("--online")) {
  console.log("\n── Ricontrollo su store.uni.com");
  for (const n of REGISTRO) {
    if (!n.url || n.stato === "ritirata") continue;
    try {
      const res = await fetch(n.url, {
        headers: {
          "user-agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/140.0 Safari/537.36",
        },
      });
      const html = await res.text();
      const testo = html
        .replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, " ")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ");
      const stato = /Stato:\s*(RITIRATA[^ ]*(?: CON SOSTITUZIONE)?|IN VIGORE)/i.exec(testo)?.[1];
      const ancoraValida = /IN VIGORE/i.test(stato ?? "");
      if (!ancoraValida) {
        problemi++;
        console.log(`  ✗ ${n.codice} — UNI dichiara «${stato ?? "stato non leggibile"}»: il registro è da aggiornare`);
      } else {
        console.log(`  ✓ ${n.codice} — UNI conferma IN VIGORE`);
      }
    } catch (e) {
      console.log(`  ? ${n.codice} — UNI non raggiungibile (${String(e.message).slice(0, 40)})`);
    }
  }
}

console.log(
  problemi === 0
    ? "\nOK — ogni designazione citata è nel registro e nessuna ritirata è usata come valida"
    : `\nKO — ${problemi} problemi`,
);
process.exit(problemi === 0 ? 0 : 1);
