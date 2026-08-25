/**
 * IL CONFRONTO FRA LIVELLI — la scelta del modello si fa sui numeri.
 *
 * Legge lo STESSO documento con i tre livelli e mette in fila accuratezza,
 * costo e durata. Serve a una decisione che non si può prendere a
 * tavolino: se il livello leggero prende tutti i campi giusti su una
 * bolletta nativa, mandarci il modello di punta è spreco; se ne sbaglia
 * uno, il risparmio è la cosa più cara che possiamo comprare.
 *
 *   node --import ./scripts/risolutore-ts.mjs scripts/confronto-livelli.mjs
 *   ... --tipo=formazione        confronta sulla tabella invece che sulla scheda
 *   ... --giri=3                 ripete, perché una misura sola non è una misura
 *
 * Costa qualche centesimo a giro: è il prezzo di sapere invece di credere.
 */

import { readFileSync } from "node:fs";

process.loadEnvFile(".env.local");

const { leggiDocumento } = await import("../src/lib/motore/chiamata.ts");
const { voceMotore } = await import("../src/lib/motore/famiglie.ts");
const { MODELLO_DI_LIVELLO } = await import("../src/lib/motore/livelli.ts");
const { costoLeggibile } = await import("../src/lib/motore/costi.ts");

const tipo =
  process.argv.find((a) => a.startsWith("--tipo="))?.slice(7) ?? "bolletta-elettrica";
const giri = Number(process.argv.find((a) => a.startsWith("--giri="))?.slice(7) ?? 1);
/** Confronta anche l'invio del solo TESTO estratto in locale. */
const conTesto = process.argv.includes("--testo");

/** I valori veri dei documenti di collaudo: è il metro dell'accuratezza. */
const ATTESI = {
  "bolletta-elettrica": {
    file: "/tmp/bolletta-collaudo.pdf",
    forma: "scheda",
    valori: {
      pod: "IT001E98765432",
      fornitore: "ENERGIA PADANA S.p.A.",
      periodoInizio: "2025-01-01",
      periodoFine: "2025-01-31",
      consumoTotaleKwh: "12500",
      consumoF1Kwh: "6420",
      consumoF2Kwh: "3180",
      consumoF3Kwh: "2900",
      importoEuro: "3187.45",
    },
  },
  formazione: {
    file: "/tmp/formazione-collaudo.pdf",
    forma: "tabella",
    righe: 6,
    /** Prima riga, come metro: se sbaglia quella, sbaglia il resto. */
    prima: { corso: "Sicurezza generale", data: "2025-03-12", partecipanti: "8" },
  },
};

const atteso = ATTESI[tipo];
if (!atteso) {
  console.error(`Non so confrontare «${tipo}». Tipi noti: ${Object.keys(ATTESI).join(", ")}`);
  process.exit(1);
}

let dati;
try {
  dati = new Uint8Array(readFileSync(atteso.file));
} catch {
  console.error(
    `Manca ${atteso.file}. Genera prima il documento di collaudo:\n  node --import ./scripts/risolutore-ts.mjs scripts/collaudo-motore.mjs${tipo === "formazione" ? " --tipo=formazione" : ""}`,
  );
  process.exit(1);
}

const voce = voceMotore(tipo);
const PROVE = conTesto
  ? [
      { etichetta: "leggero", livello: "leggero", soloTesto: false },
      { etichetta: "leggero+testo", livello: "leggero", soloTesto: true },
      { etichetta: "intermedio", livello: "intermedio", soloTesto: false },
      { etichetta: "interm.+testo", livello: "intermedio", soloTesto: true },
    ]
  : [
      { etichetta: "leggero", livello: "leggero", soloTesto: false },
      { etichetta: "intermedio", livello: "intermedio", soloTesto: false },
      { etichetta: "superiore", livello: "superiore", soloTesto: false },
    ];

console.log(`\nDocumento: ${atteso.file} (${tipo}, ${atteso.forma})`);
console.log(`Giri per livello: ${giri}\n`);

const risultati = [];

for (const prova of PROVE) {
  const livello = prova.livello;
  const giro = [];
  for (let i = 0; i < giri; i++) {
    const esito = await leggiDocumento({
      dati,
      mime: "application/pdf",
      voce,
      annoRendicontazione: 2025,
      livelloForzato: livello,
      soloTesto: prova.soloTesto,
    });

    if (esito.esito !== "ok") {
      giro.push({ giusti: 0, totali: 1, costo: esito.uso?.costoMicro ?? 0, durata: esito.uso?.durataMs ?? 0, nota: esito.esito });
      continue;
    }

    let giusti = 0;
    let totali = 0;
    let nota = "";

    if (atteso.forma === "scheda") {
      for (const [chiave, valoreAtteso] of Object.entries(atteso.valori)) {
        totali++;
        const letto = esito.campi.find((c) => c.chiave === chiave)?.valore;
        // Il confronto sui testi ignora maiuscole e spazi: «ENERGIA
        // PADANA S.p.A.» e «Energia Padana S.p.A.» sono lo stesso
        // fornitore, e contarlo come errore misurerebbe il nostro metro
        // invece della lettura.
        const uguale =
          Number.isFinite(Number(valoreAtteso)) && Number.isFinite(Number(letto))
            ? Math.abs(Number(letto) - Number(valoreAtteso)) < 0.01
            : String(letto ?? "").trim().toLowerCase() ===
              valoreAtteso.trim().toLowerCase();
        if (uguale) giusti++;
        else nota += `${chiave}=${letto} `;
      }
    } else {
      totali = 1 + Object.keys(atteso.prima).length;
      if (esito.righe.length === atteso.righe) giusti++;
      else nota += `righe=${esito.righe.length} `;
      for (const [chiave, valoreAtteso] of Object.entries(atteso.prima)) {
        const letto = esito.righe[0]?.celle.find((c) => c.chiave === chiave)?.valore;
        if (
          String(letto ?? "").trim().toLowerCase() === valoreAtteso.trim().toLowerCase()
        )
          giusti++;
        else nota += `${chiave}=${letto} `;
      }
    }

    giro.push({
      giusti,
      totali,
      costo: esito.uso?.costoMicro ?? 0,
      durata: esito.uso?.durataMs ?? 0,
      confidenza:
        atteso.forma === "scheda"
          ? esito.campi.filter((c) => c.valore).reduce((t, c) => t + c.confidenza, 0) /
            Math.max(1, esito.campi.filter((c) => c.valore).length)
          : esito.righe.reduce((t, r) => t + r.confidenza, 0) / Math.max(1, esito.righe.length),
      nota: nota.trim(),
    });
  }

  const media = (f) => giro.reduce((t, g) => t + f(g), 0) / giro.length;
  risultati.push({
    livello: prova.etichetta,
    modello: MODELLO_DI_LIVELLO[livello],
    giusti: media((g) => g.giusti),
    totali: giro[0].totali,
    costo: media((g) => g.costo),
    durata: media((g) => g.durata),
    confidenza: media((g) => g.confidenza ?? 0),
    note: [...new Set(giro.map((g) => g.nota).filter(Boolean))].join(" | "),
  });
}

console.log(
  "livello      modello               accuratezza   confidenza   costo      durata",
);
console.log("─".repeat(84));
for (const r of risultati) {
  console.log(
    `${r.livello.padEnd(12)} ${r.modello.padEnd(21)} ${`${r.giusti}/${r.totali}`.padEnd(13)} ${r.confidenza.toFixed(2).padEnd(12)} ${costoLeggibile(Math.round(r.costo)).padEnd(10)} ${(r.durata / 1000).toFixed(1)}s`,
  );
  if (r.note) console.log(`             ↳ sbagliati: ${r.note}`);
}

const migliore = risultati.filter((r) => r.giusti === r.totali);
console.log("");
if (migliore.length > 0) {
  const economico = migliore.reduce((a, b) => (a.costo <= b.costo ? a : b));
  const pieno = risultati[risultati.length - 1];
  const risparmio = 1 - economico.costo / pieno.costo;
  console.log(
    `Il livello più economico che prende TUTTO: ${economico.livello} (${economico.modello}).`,
  );
  console.log(
    `Rispetto al livello superiore: ${(risparmio * 100).toFixed(0)}% in meno (${costoLeggibile(Math.round(pieno.costo - economico.costo))} a documento).`,
  );
} else {
  console.log("Nessun livello prende tutti i campi: qui il modello non è il problema.");
}
console.log("");
