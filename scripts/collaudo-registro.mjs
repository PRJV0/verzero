/**
 * COLLAUDO SUL MANOSCRITTO VERO — un registro presenze compilato a mano.
 *
 *   node --import ./scripts/risolutore-ts.mjs scripts/collaudo-registro.mjs \
 *     <scansione.pdf> <foto.HEIC>
 *
 * È il caso che mancava: intestazione stampata, tabella compilata a mano,
 * firme, note libere in fondo, e il tutto ruotato di novanta gradi
 * rispetto alla pagina. Fin qui il manoscritto era l'unico caso senza
 * misure — c'erano stime, non numeri.
 *
 * Percorre la catena VERA, nell'ordine in cui la percorre il portale:
 * natura del file → classificazione dal nome → triage → decisione →
 * smistamento sui percorsi attivi → lettura. E riporta quello che esce,
 * grezzo: righe, confidenza per campo, provenienza (stampato o
 * manoscritto), avvisi, livello usato, escalation, token, costo, tempo.
 *
 * L'HEIC si prova in due modi: convertito, come fa il browser prima di
 * caricarlo, e crudo, per vedere che cosa risponde la catena quando
 * arriva un formato che l'API non legge.
 */

import { readFileSync, writeFileSync } from "node:fs";
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
const { riconosciDaNome, smistamento, tipoDocumento } = await import(
  "../src/lib/documenti.ts"
);

const [PDF, HEIC] = process.argv.slice(2);
if (!PDF || !HEIC) {
  console.error("Uso: collaudo-registro.mjs <scansione.pdf> <foto.HEIC>");
  process.exit(1);
}

/** I percorsi che questa impresa ha attivi, per lo smistamento. */
const DOCUMENTI_ATTIVI = new Set(["Bilancio VSME", "Sistema parità di genere"]);

/** I tipi che quei percorsi chiedono: è il contesto del triage. */
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

const ANNO = 2025;

/* ------------------------------------------------------------------ */

const euro = (m) => costoLeggibile(m);
const sec = (ms) => `${(ms / 1000).toFixed(1)} s`;

function intestazione(titolo) {
  console.log(`\n${"═".repeat(64)}\n${titolo}\n${"═".repeat(64)}`);
}

/** La foto come la manda il browser: HEIC convertito in JPEG. */
function convertiHeic(percorso) {
  const fuori = "/tmp/collaudo-registro.jpg";
  execFileSync("sips", ["-s", "format", "jpeg", percorso, "--out", fuori], {
    stdio: "ignore",
  });
  return readFileSync(fuori);
}

async function esamina({ nome, dati, mime }) {
  intestazione(nome);
  console.log(`file: ${(dati.byteLength / 1024).toFixed(0)} kB · ${mime}`);

  /* — 1. Natura del file — */
  if (mime === "application/pdf") {
    const n = naturaPdf(new Uint8Array(dati));
    console.log(
      `natura: ${n.pagine} pagina/e · ${n.caratteriTesto} caratteri di testo · ${n.nativo ? "NATIVO" : "non nativo (scansione)"}`,
    );
  }

  /* — 2. Classificazione dal nome, prima di spendere un centesimo — */
  const daNome = riconosciDaNome(basename(nome));
  console.log(
    `dal nome del file: ${daNome?.tipo?.chiave ?? "(nessun indizio)"}${daNome?.indiziTrovati ? ` · ${daNome.indiziTrovati} indizi` : ""}`,
  );

  /* — 3. Triage — */
  const t0 = Date.now();
  const sguardo = await eseguiTriage({
    dati: new Uint8Array(dati),
    mime,
    tipiPertinenti: PERTINENTI,
  });
  if (!sguardo.ok) {
    console.log(`TRIAGE FALLITO: ${sguardo.messaggio}`);
    return null;
  }
  const decisione = decidiTriage(sguardo.triage, PERTINENTI);
  console.log(
    `\nTRIAGE  visto come «${sguardo.triage.tipoProbabile}» · art.9: ${sguardo.triage.datiParticolari ? sguardo.triage.categoria : "no"} · leggibile: ${sguardo.triage.leggibile}`,
  );
  console.log(
    `        → ${decisione.azione} · ${sguardo.uso.tokenIngresso} token in / ${sguardo.uso.tokenUscita} out · ${sec(sguardo.uso.durataMs)} · ${euro(sguardo.uso.costoMicro)}`,
  );
  if (decisione.azione !== "procedi") {
    console.log(`        messaggio: ${decisione.messaggio}`);
    return { sguardo, decisione, lettura: null };
  }

  /* — 4. Smistamento: a quali percorsi va — */
  const tipo = tipoDocumento(sguardo.triage.tipoProbabile);
  const dove = smistamento(tipo, DOCUMENTI_ATTIVI);
  console.log(
    `\nSMISTAMENTO  ${dove.length > 0 ? dove.map((d) => `${d.doc} → ${d.sezione}`).join(" · ") : "nessun percorso attivo lo chiede"}`,
  );

  /* — 5. Lettura — */
  const voce = voceMotore(sguardo.triage.tipoProbabile);
  if (!voce?.schema) {
    console.log("LETTURA  tipo dichiarato ma non ancora leggibile.");
    return { sguardo, decisione, lettura: null };
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
      `         livello: ${lettura.livello}${lettura.escalatoDa ? ` (salito da ${lettura.escalatoDa}: ${lettura.escalatoPerche})` : " (nessuna escalation)"}`,
    );
  }
  if (lettura.uso) {
    console.log(
      `         modello: ${lettura.uso.modello}\n         ${lettura.uso.tokenIngresso} token in / ${lettura.uso.tokenUscita} out · ${sec(lettura.uso.durataMs)} · ${euro(lettura.uso.costoMicro)}`,
    );
  }

  if (lettura.esito === "ok") {
    console.log(`         qualità: ${lettura.qualita} · forma: ${lettura.forma}`);
    if (lettura.campi?.length) {
      console.log("\n  CAMPI (scheda)");
      for (const c of lettura.campi) {
        console.log(
          `   ${c.campo.padEnd(22)} ${String(c.valore ?? "—").padEnd(28)} conf ${c.confidenza?.toFixed(2)} · ${c.fonteLettura}${c.estrattoDa ? ` · «${c.estrattoDa}»` : ""}`,
        );
      }
    }
    if (lettura.righe?.length) {
      console.log(`\n  RIGHE (${lettura.righe.length})`);
      for (const r of lettura.righe) {
        console.log(
          `\n  ── riga ${r.indice} ── conf ${r.confidenza?.toFixed(2)} · ${r.fonteLettura} · pagina ${r.pagina ?? "—"}`,
        );
        if (r.estrattoDa) console.log(`     testo di origine: «${r.estrattoDa}»`);
        if (r.nota) console.log(`     nota: ${r.nota}`);
        for (const c of r.celle) {
          console.log(
            `     ${c.chiave.padEnd(20)} ${String(c.valore ?? "—").padEnd(30)}${c.unita ? ` ${c.unita}` : ""}`,
          );
        }
        if (r.avvisi?.length) r.avvisi.forEach((a) => console.log(`     ⚠ ${a}`));
      }
    }
    if (lettura.avvisi?.length) {
      console.log("\n  AVVISI NOSTRI (controlli di plausibilità)");
      lettura.avvisi.forEach((a) => console.log(`   ⚠ ${a}`));
    }
    if (lettura.avvertenze?.length) {
      console.log("\n  AVVERTENZE DEL DOCUMENTO (riportate dal modello)");
      lettura.avvertenze.forEach((a) => console.log(`   · ${a}`));
    }
    console.log(`\n  fuori periodo: ${lettura.fuoriPeriodo}`);
  } else {
    console.log(`         messaggio: ${lettura.messaggio ?? "(nessuno)"}`);
    if (lettura.grezzo) console.log(`         grezzo: ${JSON.stringify(lettura.grezzo).slice(0, 400)}`);
  }

  // Si conserva il grezzo: rileggerlo non costa, rifare la lettura sì.
  writeFileSync(
    `/tmp/collaudo-${nome.replace(/[^a-z0-9]+/gi, "-")}.json`,
    JSON.stringify({ triage: sguardo, decisione, lettura }, null, 2),
  );

  const speso =
    (sguardo.uso?.costoMicro ?? 0) + (lettura.uso?.costoMicro ?? 0);
  console.log(
    `\n  TOTALE DOCUMENTO  ${euro(speso)} · ${sec(totale)} dall'inizio del triage`,
  );
  return { sguardo, decisione, lettura, speso, totale };
}

/* ------------------------------------------------------------------ */

const esiti = {};

esiti.pdf = await esamina({
  nome: "registro-presenze-corso.pdf",
  dati: readFileSync(PDF),
  mime: "application/pdf",
});

esiti.foto = await esamina({
  nome: "registro-presenze-corso.jpg",
  dati: convertiHeic(HEIC),
  mime: "image/jpeg",
});

/* — L'HEIC crudo: quello che l'API non legge — */
intestazione("HEIC CRUDO — il formato che l'API non legge");
const crudo = readFileSync(HEIC);
console.log(`file: ${(crudo.byteLength / 1024).toFixed(0)} kB · image/heic`);
const rifiuto = await leggiDocumento({
  dati: new Uint8Array(crudo),
  mime: "image/heic",
  voce: voceMotore("formazione"),
  annoRendicontazione: ANNO,
});
console.log(`esito: ${rifiuto.esito}`);
console.log(`messaggio: ${rifiuto.messaggio}`);
console.log(`speso: ${rifiuto.uso ? euro(rifiuto.uso.costoMicro) : "niente — fermato prima della rete"}`);

/* ------------------------------------------------------------------ */
intestazione("RIEPILOGO");
const speso =
  (esiti.pdf?.speso ?? 0) + (esiti.foto?.speso ?? 0);
console.log(`Speso in tutto: ${euro(speso)}`);
