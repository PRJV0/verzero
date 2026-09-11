/**
 * COLLAUDO COMPARATIVO — lo STESSO foglio, acquisito in due modi.
 *
 *   node --import ./scripts/risolutore-ts.mjs scripts/collaudo-acquisizioni.mjs \
 *     [--pdf <scansione.pdf>] [--foto <foto.HEIC|jpg>]
 *
 * Serve a isolare UNA variabile: quanto pesa la qualità dell'acquisizione
 * a parità di contenuto. Il registro presenze è il caso peggiore che
 * abbiamo — intestazione stampata, tabella compilata a mano, date in
 * quattro formati, firme, note libere — quindi è lì che la differenza fra
 * una scansione e una foto si vede, se esiste.
 *
 * Percorre la catena VERA, nell'ordine del portale: natura del file →
 * classificazione dal nome → triage → decisione → lettura. E riporta
 * quello che esce, grezzo, con la stessa griglia per ciascuna
 * acquisizione, così le due colonne si possono mettere una accanto
 * all'altra.
 *
 * L'HEIC si prova in DUE modi: convertito, come fa il browser prima di
 * caricarlo, e crudo, per vedere che cosa risponde la catena quando arriva
 * un formato che l'API non legge.
 */

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { basename } from "node:path";
import { execFileSync } from "node:child_process";

process.loadEnvFile(".env.local");

const { leggiDocumento, eseguiTriage } = await import(
  "../src/lib/motore/chiamata.ts"
);
const { decidiTriage } = await import("../src/lib/motore/triage.ts");
const { voceMotore } = await import("../src/lib/motore/famiglie.ts");
const { costoLeggibile } = await import("../src/lib/motore/costi.ts");
const { naturaPdf } = await import("../src/lib/motore/pdf.ts");
const { riconosciDaNome } = await import("../src/lib/documenti.ts");

/* ── argomenti ─────────────────────────────────────────────────────── */
const arg = process.argv.slice(2);
const prendi = (nome) => {
  const i = arg.indexOf(nome);
  return i >= 0 ? arg[i + 1] : null;
};
const PDF = prendi("--pdf");
const FOTO = prendi("--foto");
if (!PDF && !FOTO) {
  console.error(
    "Uso: collaudo-acquisizioni.mjs [--pdf <file.pdf>] [--foto <file.HEIC>]",
  );
  process.exit(1);
}

/** I tipi che il contesto rende pertinenti: è il contesto del triage. */
const PERTINENTI = [
  "bolletta-elettrica",
  "bolletta-gas",
  "carburanti",
  "visura",
  "bilancio",
  "organico",
  "organigramma",
  "formazione",
];
const ANNO = 2026;

/* ── utilità di stampa ─────────────────────────────────────────────── */
const euro = (m) => costoLeggibile(m);
const sec = (ms) => `${(ms / 1000).toFixed(1)} s`;
const barra = (t) => console.log(`\n${"═".repeat(72)}\n${t}\n${"═".repeat(72)}`);

/**
 * LA FOTO COME LA MANDA DAVVERO IL BROWSER.
 *
 * Il banco precedente usava `sips -s format jpeg` e basta, e NON
 * riproduceva la produzione: sips lascia il buffer orizzontale
 * (5712×4284) con il tag EXIF di orientamento 6, mentre il browser usa
 * `createImageBitmap`, che l'orientamento lo APPLICA, e poi ridisegna su
 * una tela lunga al massimo `LATO_MASSIMO` px. Al modello arrivavano due
 * immagini diverse: dal banco una pagina coricata di novanta gradi e
 * grande il doppio, dalla produzione una pagina dritta e ridotta.
 *
 * Misurare l'acquisizione con un banco che sbaglia l'acquisizione non
 * misura niente — anzi, attribuisce alla foto un difetto del banco. Qui
 * si fa quello che fa `convertiInJpeg`: orientamento applicato, lato
 * lungo a 2400, JPEG a 0,85.
 */
function convertiHeic(percorso, comeIlBanco = false) {
  const fuori = comeIlBanco
    ? "/tmp/collaudo-banco.jpg"
    : "/tmp/collaudo-browser.jpg";
  if (comeIlBanco) {
    execFileSync("sips", ["-s", "format", "jpeg", percorso, "--out", fuori], {
      stdio: "ignore",
    });
    return readFileSync(fuori);
  }
  execFileSync("sips", ["-s", "format", "jpeg", percorso, "--out", "/tmp/collaudo-grezzo.jpg"], {
    stdio: "ignore",
  });
  execFileSync("python3", [
    "-c",
    [
      "from PIL import Image, ImageOps",
      "im = ImageOps.exif_transpose(Image.open('/tmp/collaudo-grezzo.jpg'))",
      "im.thumbnail((2400, 2400), Image.LANCZOS)",
      `im.convert('RGB').save('${fuori}', quality=85)`,
      "print(im.size)",
    ].join("\n"),
  ], { stdio: "ignore" });
  return readFileSync(fuori);
}

async function esamina({ nome, dati, mime, etichetta }) {
  barra(etichetta);
  console.log(`file: ${(dati.byteLength / 1024).toFixed(0)} kB · ${mime}`);

  if (mime === "application/pdf") {
    const n = naturaPdf(new Uint8Array(dati));
    console.log(
      `natura: ${n.pagine} pagina/e · ${n.caratteriTesto} caratteri di testo · ${n.nativo ? "NATIVO" : "non nativo (scansione)"}`,
    );
  }

  const daNome = riconosciDaNome(basename(nome));
  console.log(
    `dal nome del file: ${daNome?.tipo?.chiave ?? "(nessun indizio)"}`,
  );

  /* — TRIAGE — */
  const t0 = Date.now();
  const sguardo = await eseguiTriage({
    dati: new Uint8Array(dati),
    mime,
    tipiPertinenti: PERTINENTI,
  });
  if (!sguardo.ok) {
    console.log(`\nTRIAGE FALLITO: ${sguardo.messaggio}`);
    return null;
  }
  const decisione = decidiTriage(sguardo.triage, PERTINENTI);
  console.log(
    `\nTRIAGE  visto come «${sguardo.triage.tipoProbabile}» · art.9: ${sguardo.triage.datiParticolari ? sguardo.triage.categoria : "no"} · leggibile: ${sguardo.triage.leggibile}`,
  );
  console.log(
    `        → ${decisione.azione} · ${sguardo.uso.tokenIngresso} in / ${sguardo.uso.tokenUscita} out · ${sec(sguardo.uso.durataMs)} · ${euro(sguardo.uso.costoMicro)}`,
  );
  if (decisione.azione !== "procedi") {
    console.log(`        messaggio: ${decisione.messaggio}`);
    return { sguardo, decisione, lettura: null, speso: sguardo.uso.costoMicro };
  }

  /* — LETTURA — */
  const voce = voceMotore(sguardo.triage.tipoProbabile);
  if (!voce?.schema) {
    console.log("\nLETTURA  tipo dichiarato ma non ancora leggibile.");
    return { sguardo, decisione, lettura: null, speso: sguardo.uso.costoMicro };
  }

  const lettura = await leggiDocumento({
    dati: new Uint8Array(dati),
    mime,
    voce,
    annoRendicontazione: ANNO,
  });
  const totale = Date.now() - t0;

  console.log(`\nLETTURA  esito: ${lettura.esito}`);
  if (lettura.livello) {
    console.log(
      `         livello: ${lettura.livello}${lettura.escalatoDa ? ` (SALITO da ${lettura.escalatoDa}: ${lettura.escalatoPerche})` : " — nessuna escalation"}`,
    );
  }
  if (lettura.uso) {
    console.log(
      `         modello: ${lettura.uso.modello}\n         ${lettura.uso.tokenIngresso} token in / ${lettura.uso.tokenUscita} out · ${sec(lettura.uso.durataMs)} · ${euro(lettura.uso.costoMicro)}`,
    );
  }

  if (lettura.esito === "ok") {
    console.log(
      `         qualità dichiarata: ${lettura.qualita} · forma: ${lettura.forma}`,
    );

    if (lettura.campi?.length) {
      console.log("\n  CAMPI");
      for (const c of lettura.campi) {
        console.log(
          `   ${c.chiave.padEnd(20)} ${String(c.valore ?? "—").padEnd(26)} conf ${c.confidenza?.toFixed(2)} · ${c.fonteLettura}`,
        );
        if (c.estrattoDa) console.log(`     letto da: «${c.estrattoDa}»`);
      }
    }

    if (lettura.righe?.length) {
      console.log(`\n  RIGHE ESTRATTE: ${lettura.righe.length}`);
      for (const r of lettura.righe) {
        console.log(
          `\n  ── riga ${r.indice} ── conf ${r.confidenza?.toFixed(2)} · ${r.fonteLettura}${r.pagina ? ` · pag ${r.pagina}` : ""}`,
        );
        for (const c of r.celle) {
          // ═══ LA MISURA CHE CONTA ADESSO ═══
          // Prima qui si stampava solo chiave e valore, e non si poteva
          // vedere la cosa che stiamo collaudando: se la provenienza è
          // DELLA CELLA o ancora della riga, e se il presidio sui valori
          // dedotti è scattato. Un banco che non mostra la variabile
          // misurata non misura.
          const segno = c.calcolato
            ? "CALCOLATO"
            : c.valore === null
              ? "azzerato "
              : c.fonteLettura === "manoscritto"
                ? "a mano   "
                : "letto    ";
          console.log(
            `     ${c.chiave.padEnd(16)} ${String(c.valore ?? "— (vuoto)").padEnd(26)}${(c.unita ?? "").padEnd(5)} ${segno} conf ${(c.confidenza ?? 0).toFixed(2)}`,
          );
          if (c.estrattoDa) {
            const propria = c.estrattoDa !== r.estrattoDa;
            console.log(
              `       ${propria ? "da questa cella" : "SOLO dalla riga"}: «${c.estrattoDa}»`,
            );
          }
          if (c.avvisi?.length) c.avvisi.forEach((a) => console.log(`       ⚠ ${a}`));
        }
        if (r.estrattoDa) console.log(`     DICE DI AVER LETTO: «${r.estrattoDa}»`);
        if (r.nota) console.log(`     nota: ${r.nota}`);
        if (r.avvisi?.length) r.avvisi.forEach((a) => console.log(`     ⚠ ${a}`));
      }
    }

    /* — LA VERIFICABILITÀ PER CELLA, contata — */
    if (lettura.righe?.length) {
      const celle = lettura.righe.flatMap((r) =>
        r.celle.map((c) => ({ ...c, citazioneRiga: r.estrattoDa })),
      );
      const piene = celle.filter((c) => c.valore !== null);
      const propria = piene.filter(
        (c) => c.estrattoDa && c.estrattoDa !== c.citazioneRiga,
      );
      console.log("\n  PROVENIENZA PER CELLA");
      console.log(`   celle piene:            ${piene.length} su ${celle.length}`);
      console.log(
        `   con citazione PROPRIA:  ${propria.length} (${piene.length ? Math.round((propria.length / piene.length) * 100) : 0}%)`,
      );
      console.log(
        `   calcolate da noi:       ${celle.filter((c) => c.calcolato).length}  ← il presidio sui valori dedotti`,
      );
      console.log(
        `   azzerate da un presidio:${String(celle.filter((c) => c.valore === null && c.avvisi?.length).length).padStart(3)}`,
      );
      console.log(
        `   scritte a mano:         ${celle.filter((c) => c.fonteLettura === "manoscritto").length}`,
      );
    }

    if (lettura.avvisi?.length) {
      console.log("\n  AVVISI NOSTRI (controlli di plausibilità)");
      lettura.avvisi.forEach((a) => console.log(`   ⚠ ${a}`));
    }
    if (lettura.avvertenze?.length) {
      console.log("\n  AVVERTENZE (riportate dal modello)");
      lettura.avvertenze.forEach((a) =>
        console.log(`   · ${typeof a === "string" ? a : `${a.testo}${a.azione ? " [richiede azione]" : ""}`}`),
      );
    }
    if (lettura.noteLibere?.length) {
      console.log("\n  NOTE LIBERE DEL DOCUMENTO");
      lettura.noteLibere.forEach((n) => console.log(`   « ${n} »`));
    } else {
      console.log("\n  NOTE LIBERE: nessuna");
    }
    console.log(`\n  fuori periodo: ${lettura.fuoriPeriodo}`);
  } else {
    console.log(`         messaggio: ${lettura.messaggio ?? "(nessuno)"}`);
    if (lettura.grezzo)
      console.log(`         grezzo: ${JSON.stringify(lettura.grezzo).slice(0, 500)}`);
  }

  writeFileSync(
    `/tmp/collaudo-${etichetta.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.json`,
    JSON.stringify({ triage: sguardo, decisione, lettura }, null, 2),
  );

  const speso = (sguardo.uso?.costoMicro ?? 0) + (lettura.uso?.costoMicro ?? 0);
  console.log(`\n  TOTALE  ${euro(speso)} · ${sec(totale)} dall'inizio del triage`);
  return { sguardo, decisione, lettura, speso, totale };
}

/* ── esecuzione ────────────────────────────────────────────────────── */
const esiti = {};

if (PDF) {
  if (!existsSync(PDF)) {
    console.error(`PDF non leggibile: ${PDF}`);
  } else {
    esiti.pdf = await esamina({
      nome: "registro-presenze-corso.pdf",
      dati: readFileSync(PDF),
      mime: "application/pdf",
      etichetta: "A · SCANSIONE PDF",
    });
  }
}

if (FOTO) {
  esiti.foto = await esamina({
    nome: "registro-presenze-corso.jpg",
    dati: /\.heic$/i.test(FOTO) ? convertiHeic(FOTO) : readFileSync(FOTO),
    mime: "image/jpeg",
    etichetta: "B · FOTO DA IPHONE — come la manda il browser",
  });

  /* Il banco vecchio, per quantificare quanto pesava il suo difetto. */
  if (/\.heic$/i.test(FOTO) && arg.includes("--anche-banco")) {
    esiti.banco = await esamina({
      nome: "registro-presenze-corso.jpg",
      dati: convertiHeic(FOTO, true),
      mime: "image/jpeg",
      etichetta: "B2 · LA STESSA FOTO col banco vecchio (coricata, 5712 px)",
    });
  }

  /* — L'HEIC CRUDO: quello che l'API non legge — */
  if (/\.heic$/i.test(FOTO)) {
    barra("C · HEIC CRUDO — il formato che l'API non legge");
    const crudo = readFileSync(FOTO);
    console.log(`file: ${(crudo.byteLength / 1024).toFixed(0)} kB · image/heic`);
    const rifiuto = await leggiDocumento({
      dati: new Uint8Array(crudo),
      mime: "image/heic",
      voce: voceMotore("formazione"),
      annoRendicontazione: ANNO,
    });
    console.log(`esito: ${rifiuto.esito}`);
    console.log(`messaggio: ${rifiuto.messaggio}`);
    console.log(
      `speso: ${rifiuto.uso ? euro(rifiuto.uso.costoMicro) : "niente — fermato prima della rete"}`,
    );
  }
}

barra("RIEPILOGO");
const speso = (esiti.pdf?.speso ?? 0) + (esiti.foto?.speso ?? 0);
console.log(`Speso in tutto: ${euro(speso)}`);
