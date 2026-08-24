/**
 * COLLAUDO END-TO-END DEL MOTORE — con l'API vera.
 *
 * `test-motore.mjs` prova la logica con risposte simulate e non tocca la
 * rete. Questo fa il contrario: prende un documento, lo manda davvero
 * all'API, e verifica che quello che torna sia giusto. Serve a due cose
 * che le simulazioni non possono dare — sapere se la catena regge
 * (blocco documento, vincolo di formato, ragionamento adattivo) e sapere
 * QUANTO COSTA sul serio, coi token effettivi invece che con una stima.
 *
 *   node --import ./scripts/risolutore-ts.mjs scripts/collaudo-motore.mjs
 *   node --import ./scripts/risolutore-ts.mjs scripts/collaudo-motore.mjs /percorso/bolletta.pdf
 *
 * Senza argomenti costruisce una bolletta finta ma realistica, di
 * un'impresa dichiaratamente inventata. Con un percorso, legge quella —
 * ed è così che si collauda con un documento vero.
 */

import { readFileSync, writeFileSync } from "node:fs";
import { basename } from "node:path";

process.loadEnvFile(".env.local");

const { leggiDocumento } = await import("../src/lib/motore/chiamata.ts");
const { voceMotore } = await import("../src/lib/motore/famiglie.ts");
const { costoLeggibile, extractionConfig } = await import(
  "../src/lib/motore/costi.ts"
);
const { naturaPdf } = await import("../src/lib/motore/pdf.ts");
const { formattaValore } = await import("../src/lib/motore/portale.ts");

/* ------------------------------------------------------------------ */
/* Una bolletta finta, ma fatta come sono fatte quelle vere            */
/* ------------------------------------------------------------------ */

/** I valori attesi: è su questi che si giudica la lettura. */
const ATTESI = {
  pod: "IT001E98765432",
  periodoInizio: "2025-01-01",
  periodoFine: "2025-01-31",
  consumoTotaleKwh: 12500,
  consumoF1Kwh: 6420,
  consumoF2Kwh: 3180,
  consumoF3Kwh: 2900,
  importoEuro: 3187.45,
};

/** Un registro di formazione: la forma TABELLA, N righe uguali. */
const RIGHE_FORMAZIONE = [
  ["REGISTRO DELLA FORMAZIONE - ANNO 2025", 14],
  ["Officina Lombardi S.r.l. (impresa di esempio)", 10],
  ["", 10],
  ["Corso                          Data        Ore  Part.  Donne  Ambito", 10],
  ["Sicurezza generale             12/03/2025   4     8      3    sicurezza", 10],
  ["Antincendio rischio medio      08/04/2025   8    12      4    sicurezza", 10],
  ["Aggiornamento ISO 9001         21/05/2025   6     5      2    qualita", 10],
  ["Gestione rifiuti               17/06/2025   4     7      1    ambiente", 10],
  ["Parita di genere e inclusione  09/09/2025   3    22     11    parita", 10],
  ["Primo soccorso                 14/10/2025  12     6      2    sicurezza", 10],
  ["", 10],
  ["Docente: Studio Formazione Padana - Documento di esempio.", 8],
];

const ATTESI_FORMAZIONE = { righe: 6, primoCorso: "Sicurezza generale" };

const RIGHE = [
  ["ENERGIA PADANA S.p.A.", 16],
  ["Fattura per la fornitura di energia elettrica", 11],
  ["", 10],
  ["Cliente: Officina Lombardi S.r.l. (impresa di esempio)", 10],
  ["Partita IVA: 01234567890", 10],
  ["Indirizzo di fornitura: Via delle Officine 12, Brescia", 10],
  ["", 10],
  ["Numero fattura: 2025/000481          Data emissione: 08/02/2025", 10],
  ["Codice POD: IT001E98765432", 11],
  ["Periodo di riferimento: dal 01/01/2025 al 31/01/2025", 11],
  ["Tipo di lettura: effettiva", 10],
  ["Potenza impegnata: 95 kW          Potenza disponibile: 104,5 kW", 10],
  ["Tensione di alimentazione: BT", 10],
  ["", 10],
  ["DETTAGLIO DEI CONSUMI FATTURATI (kWh)", 11],
  ["Fascia F1 (lun-ven 8-19)                            6.420", 10],
  ["Fascia F2 (lun-ven 7-8 e 19-23, sab 7-23)           3.180", 10],
  ["Fascia F3 (restanti ore e festivi)                  2.900", 10],
  ["Totale consumo fatturato del periodo               12.500", 11],
  ["", 10],
  ["RIEPILOGO IMPORTI", 11],
  ["Spesa per la materia energia                    1.958,20 EUR", 10],
  ["Spesa per il trasporto e la gestione del contatore 412,90 EUR", 10],
  ["Spesa per oneri di sistema                        241,15 EUR", 10],
  ["Imposte e IVA                                     575,20 EUR", 10],
  ["TOTALE DA PAGARE                                3.187,45 EUR", 12],
  ["", 10],
  ["La fornitura non e' assistita da Garanzia di Origine.", 9],
  ["Documento di esempio, generato per il collaudo del Motore Ver0.", 8],
];

/** Un PDF vero: base-14 Helvetica, xref corretta, nessuna dipendenza. */
function costruisciPdf(righe) {
  const esc = (t) => t.replace(/([\\()])/g, "\\$1");
  let y = 790;
  const comandi = ["BT"];
  for (const [testo, corpo] of righe) {
    if (testo !== "") {
      comandi.push(`/F1 ${corpo} Tf`, `1 0 0 1 56 ${y} Tm`, `(${esc(testo)}) Tj`);
    }
    y -= corpo + 6;
  }
  comandi.push("ET");
  const flusso = comandi.join("\n");

  const oggetti = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>",
    `<< /Length ${Buffer.byteLength(flusso, "latin1")} >>\nstream\n${flusso}\nendstream`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>",
  ];

  let pdf = "%PDF-1.4\n";
  const offset = [];
  oggetti.forEach((corpo, i) => {
    offset.push(Buffer.byteLength(pdf, "latin1"));
    pdf += `${i + 1} 0 obj\n${corpo}\nendobj\n`;
  });
  const inizioXref = Buffer.byteLength(pdf, "latin1");
  pdf += `xref\n0 ${oggetti.length + 1}\n0000000000 65535 f \n`;
  for (const o of offset) pdf += `${String(o).padStart(10, "0")} 00000 n \n`;
  pdf += `trailer\n<< /Size ${oggetti.length + 1} /Root 1 0 R >>\nstartxref\n${inizioXref}\n%%EOF\n`;

  return Buffer.from(pdf, "latin1");
}

/* ------------------------------------------------------------------ */

let superati = 0;
let falliti = 0;
function verifica(descrizione, condizione, dettaglio = "") {
  console.log(
    `${condizione ? "✅" : "❌"} ${descrizione}${dettaglio ? ` — ${dettaglio}` : ""}`,
  );
  condizione ? superati++ : falliti++;
}

const tipoScelto =
  process.argv.find((a) => a.startsWith("--tipo="))?.slice(7) ?? "bolletta-elettrica";
const percorso = process.argv.find((a) => !a.startsWith("--") && a !== process.argv[0] && a !== process.argv[1]);
const vero = Boolean(percorso);
const tabella = tipoScelto === "formazione";
const dati = vero
  ? new Uint8Array(readFileSync(percorso))
  : new Uint8Array(costruisciPdf(tabella ? RIGHE_FORMAZIONE : RIGHE));

if (!vero) {
  const nome = tabella ? "/tmp/formazione-collaudo.pdf" : "/tmp/bolletta-collaudo.pdf";
  writeFileSync(nome, dati);
  console.log(`Documento di collaudo scritto in ${nome}`);
}

const config = extractionConfig();
const natura = naturaPdf(dati);

console.log(`
Documento : ${vero ? basename(percorso) : "bolletta generata (impresa di esempio)"}
Dimensione: ${(dati.byteLength / 1024).toFixed(1)} kB
Natura    : ${natura.nativo ? "PDF nativo" : "scansione o immagine"} · ${natura.pagine} pagina/e · ${natura.caratteriTesto} caratteri di testo
Modello   : ${config.model} · max ${config.maxTokens} token
`);

console.log("Chiamata all'API in corso…\n");
const esito = await leggiDocumento({
  dati,
  mime: percorso?.match(/\.(jpe?g|png|webp)$/i)
    ? `image/${percorso.toLowerCase().endsWith(".png") ? "png" : percorso.toLowerCase().endsWith(".webp") ? "webp" : "jpeg"}`
    : "application/pdf",
  voce: voceMotore(tipoScelto),
  annoRendicontazione: 2025,
});

if (esito.uso) {
  const u = esito.uso;
  console.log(
    `Token: ${u.tokenIngresso} in / ${u.tokenUscita} out · ${(u.durataMs / 1000).toFixed(1)} s · costo ${costoLeggibile(u.costoMicro)}\n`,
  );
}

verifica("l'esito è una lettura riuscita", esito.esito === "ok", esito.esito);

if (esito.esito !== "ok") {
  console.log(`\n${"messaggio" in esito ? esito.messaggio : ""}\n`);
  process.exit(1);
}

if (esito.forma === "tabella") {
  console.log(`— le ${esito.righe.length} righe lette —\n`);
  for (const r of esito.righe) {
    const testo = r.celle
      .filter((c) => c.valore !== null)
      .map((c) => `${c.etichetta}: ${formattaValore(c.valore, c.unita)}`)
      .join(" · ");
    console.log(`  ${String(r.indice).padStart(2)}. ${testo}`);
    console.log(
      `      confidenza ${r.confidenza.toFixed(2)} · ${r.fonteLettura}${r.pagina ? ` · pag. ${r.pagina}` : ""}`,
    );
    for (const a of r.avvisi) console.log(`      ⚠ ${a}`);
  }

  if (!vero) {
    console.log("\n— confronto con i valori attesi —\n");
    verifica(
      `${ATTESI_FORMAZIONE.righe} righe`,
      esito.righe.length === ATTESI_FORMAZIONE.righe,
      `lette ${esito.righe.length}`,
    );
    const primo = esito.righe[0]?.celle.find((c) => c.chiave === "corso")?.valore;
    verifica(
      `il primo corso è «${ATTESI_FORMAZIONE.primoCorso}»`,
      primo === ATTESI_FORMAZIONE.primoCorso,
      String(primo),
    );
    const parita = esito.righe.find(
      (r) => r.celle.find((c) => c.chiave === "ambito")?.valore === "parita-e-inclusione",
    );
    verifica(
      "il corso sulla parità è stato ricondotto all'ambito giusto",
      parita !== undefined,
      esito.righe
        .map((r) => r.celle.find((c) => c.chiave === "ambito")?.valore)
        .join(", "),
    );
    verifica(
      "le date sono canoniche",
      esito.righe.every((r) => {
        const d = r.celle.find((c) => c.chiave === "data")?.valore;
        return d === null || /^\d{4}-\d{2}-\d{2}$/.test(d ?? "");
      }),
    );
    verifica(
      "ogni riga porta pagina ed estratto: la provenienza c'è",
      esito.righe.every((r) => r.pagina !== null && r.estrattoDa),
    );
    verifica("nessun avviso di plausibilità", esito.avvisi.length === 0, esito.avvisi.join(" | "));
  }

  console.log(
    `\nRisultato: ${superati}/${superati + falliti} controlli superati${falliti ? ` — ${falliti} FALLITI` : ""}\n`,
  );
  process.exit(falliti === 0 ? 0 : 1);
}

console.log("— i campi letti —\n");
for (const c of esito.campi) {
  const valore =
    c.valore === null ? "(non trovato)" : formattaValore(c.valore, c.unita);
  console.log(
    `  ${c.etichetta.padEnd(32)} ${valore.padEnd(24)} confidenza ${c.confidenza
      .toFixed(2)
      .padStart(4)} · ${c.fonteLettura}${c.pagina ? ` · pag. ${c.pagina}` : ""}`,
  );
  for (const a of c.avvisi) console.log(`      ⚠ ${a}`);
}

console.log("\n— confronto con i valori attesi —\n");

if (!vero) {
  const valoreDi = (k) => esito.campi.find((c) => c.chiave === k)?.valore ?? null;
  for (const [chiave, atteso] of Object.entries(ATTESI)) {
    const letto = valoreDi(chiave);
    const uguale =
      typeof atteso === "number"
        ? Math.abs(Number(letto) - atteso) < 0.01
        : letto === atteso;
    verifica(`${chiave}: atteso ${atteso}`, uguale, `letto ${letto}`);
  }
  verifica(
    "la potenza impegnata NON è stata scambiata per il consumo",
    Number(valoreDi("consumoTotaleKwh")) !== 95,
  );
  verifica(
    "la Garanzia d'Origine assente è «no» o «non dichiarato», mai «sì»",
    valoreDi("energiaRinnovabile") !== "si",
    String(valoreDi("energiaRinnovabile")),
  );
  verifica(
    "nessun avviso di plausibilità: i valori tornano fra loro",
    esito.avvisi.length === 0,
    esito.avvisi.join(" | "),
  );
  if (esito.avvertenze.length > 0) {
    console.log(
      `\n  Avvertenze dichiarate dal documento (non sono difetti della lettura):`,
    );
    for (const a of esito.avvertenze) console.log(`    · ${a}`);
  }
  verifica("il periodo è dentro l'anno di rendicontazione", esito.fuoriPeriodo === false);
} else {
  console.log("  (documento vero: i valori li verifichi tu, guardando la bolletta)\n");
}

console.log(
  `\nRisultato: ${superati}/${superati + falliti} controlli superati${falliti ? ` — ${falliti} FALLITI` : ""}\n`,
);
process.exit(falliti === 0 ? 0 : 1);
