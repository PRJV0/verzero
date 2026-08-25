/**
 * COLLAUDO DEL TRIAGE — con l'API vera, sui quattro casi che contano.
 *
 * `test-motore.mjs` prova la DECISIONE con verdetti simulati e non tocca
 * la rete: quella parte è aritmetica e va provata così. Qui si prova
 * l'altra metà, che nessuna simulazione può dare — se il primo sguardo
 * riconosce davvero un certificato medico, e se non scambia un elenco di
 * addetti per un dato sanitario.
 *
 *   node --import ./scripts/risolutore-ts.mjs scripts/collaudo-triage.mjs
 *
 * Costa qualche millesimo a giro: è il prezzo di sapere invece di
 * sperare, su una regola che se sbaglia sbaglia in silenzio.
 */

process.loadEnvFile(".env.local");

const { eseguiTriage } = await import("../src/lib/motore/chiamata.ts");
const { decidiTriage } = await import("../src/lib/motore/triage.ts");
const { costoLeggibile } = await import("../src/lib/motore/costi.ts");

let superati = 0;
let falliti = 0;
function verifica(descrizione, condizione, dettaglio = "") {
  console.log(
    `${condizione ? "✅" : "❌"} ${descrizione}${dettaglio ? ` — ${dettaglio}` : ""}`,
  );
  condizione ? superati++ : falliti++;
}

/* ------------------------------------------------------------------ */
/* I documenti di prova, tutti dichiaratamente inventati                */
/* ------------------------------------------------------------------ */

function pdf(righe) {
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

  let out = "%PDF-1.4\n";
  const offset = [];
  oggetti.forEach((corpo, i) => {
    offset.push(Buffer.byteLength(out, "latin1"));
    out += `${i + 1} 0 obj\n${corpo}\nendobj\n`;
  });
  const inizioXref = Buffer.byteLength(out, "latin1");
  out += `xref\n0 ${oggetti.length + 1}\n0000000000 65535 f \n`;
  for (const o of offset) out += `${String(o).padStart(10, "0")} 00000 n \n`;
  out += `trailer\n<< /Size ${oggetti.length + 1} /Root 1 0 R >>\nstartxref\n${inizioXref}\n%%EOF\n`;
  return new Uint8Array(Buffer.from(out, "latin1"));
}

const IMPRESA = "Officina Lombardi S.r.l. (impresa di esempio)";

const CASI = [
  {
    nome: "1. PERTINENTE — bolletta elettrica",
    atteso: "procedi",
    righe: [
      ["ENERGIA PADANA S.p.A.", 15],
      ["Fattura per la fornitura di energia elettrica", 11],
      ["", 10],
      [`Cliente: ${IMPRESA}`, 10],
      ["Codice POD: IT001E98765432", 11],
      ["Periodo di riferimento: dal 01/01/2025 al 31/01/2025", 11],
      ["", 10],
      ["DETTAGLIO DEI CONSUMI FATTURATI (kWh)", 11],
      ["Fascia F1                                          6.420", 10],
      ["Fascia F2                                          3.180", 10],
      ["Fascia F3                                          2.900", 10],
      ["Totale consumo fatturato del periodo              12.500", 11],
      ["TOTALE DA PAGARE                               3.187,45 EUR", 11],
    ],
  },
  {
    nome: "2. ESTRANEO INNOCUO — preventivo di un fornitore",
    atteso: "non-pertinente",
    righe: [
      ["TIPOGRAFIA MERIDIANA S.n.c.", 15],
      ["Preventivo n. 214 del 12 marzo 2025", 11],
      ["", 10],
      [`Spett.le ${IMPRESA}`, 10],
      ["", 10],
      ["Stampa di 500 cataloghi formato A4, 24 pagine", 10],
      ["Carta patinata opaca 130 g, copertina 250 g", 10],
      ["Rilegatura a punto metallico, plastificazione lucida", 10],
      ["", 10],
      ["Imponibile                                     1.850,00 EUR", 10],
      ["IVA 22%                                          407,00 EUR", 10],
      ["Totale                                         2.257,00 EUR", 11],
      ["", 10],
      ["Consegna: 15 giorni lavorativi. Validita': 30 giorni.", 9],
    ],
  },
  {
    nome: "3. DATI SANITARI — certificato di idoneità",
    atteso: "dati-particolari",
    righe: [
      ["MEDICO COMPETENTE - Dott. (nome omesso)", 14],
      ["GIUDIZIO DI IDONEITA' ALLA MANSIONE SPECIFICA", 12],
      ["D.Lgs. 81/2008, art. 41", 10],
      ["", 10],
      [`Azienda: ${IMPRESA}`, 10],
      ["Lavoratore: (dati anagrafici omessi in questo esempio)", 10],
      ["Mansione: addetto al reparto verniciatura", 10],
      ["", 10],
      ["Visita periodica del 14/04/2025", 10],
      ["Accertamenti: spirometria, audiometria, esame ematochimico", 10],
      ["", 10],
      ["GIUDIZIO: IDONEO CON PRESCRIZIONI", 12],
      ["Prescrizione: uso obbligatorio di protezione respiratoria;", 10],
      ["limitazione all'esposizione a solventi organici.", 10],
      ["Scadenza del giudizio: 14/04/2026", 10],
      ["", 10],
      ["Documento di esempio, generato per il collaudo del Motore Ver0.", 8],
    ],
  },
  {
    nome: "4. ILLEGGIBILE — pagina quasi vuota",
    atteso: "illeggibile",
    righe: [
      ["...", 9],
      ["", 9],
      ["  .  ", 9],
    ],
  },
];

/* ------------------------------------------------------------------ */

/** I tipi che i percorsi attivi di questa impresa chiedono davvero. */
const PERTINENTI = [
  "bolletta-elettrica",
  "bolletta-gas",
  "carburanti",
  "visura",
  "organico",
  "formazione",
];

console.log(`\nPertinenti per questa impresa: ${PERTINENTI.join(", ")}\n`);

let costoTotale = 0;

for (const caso of CASI) {
  const dati = pdf(caso.righe);
  const sguardo = await eseguiTriage({
    dati,
    mime: "application/pdf",
    tipiPertinenti: PERTINENTI,
  });

  if (!sguardo.ok) {
    verifica(caso.nome, false, `sguardo fallito: ${sguardo.messaggio}`);
    continue;
  }

  costoTotale += sguardo.uso.costoMicro;
  const decisione = decidiTriage(sguardo.triage, PERTINENTI);

  console.log(`\n${caso.nome}`);
  console.log(
    `   visto come: ${sguardo.triage.tipoProbabile} · art.9: ${sguardo.triage.datiParticolari ? sguardo.triage.categoria : "no"} · leggibile: ${sguardo.triage.leggibile}`,
  );
  console.log(
    `   ${sguardo.uso.tokenIngresso} token in / ${sguardo.uso.tokenUscita} out · ${(sguardo.uso.durataMs / 1000).toFixed(1)} s · ${costoLeggibile(sguardo.uso.costoMicro)}`,
  );

  verifica(`   decisione attesa: ${caso.atteso}`, decisione.azione === caso.atteso, decisione.azione);

  if (decisione.azione === "dati-particolari") {
    verifica(
      "   e la categoria è quella sanitaria",
      decisione.categoria === "salute",
      decisione.categoria,
    );
  }
}

/* — Il falso positivo più probabile: l'organico NON è un dato sanitario — */
console.log("\n5. IL FALSO POSITIVO PIÙ PROBABILE — organico per genere");
const organico = pdf([
  ["DATI DI ORGANICO AL 31 DICEMBRE 2025", 14],
  [IMPRESA, 10],
  ["", 10],
  ["Inquadramento      Genere    Addetti  Ind.  P.time  Retrib. media", 9],
  ["Dirigenti          uomini          2     2       0        82.000", 9],
  ["Quadri             donne           3     3       1        54.000", 9],
  ["Quadri             uomini          4     4       0        56.500", 9],
  ["Impiegati          donne          11    10       4        31.200", 9],
  ["Impiegati          uomini          9     9       1        32.800", 9],
  ["Operai             donne           6     5       2        26.400", 9],
  ["Operai             uomini         24    22       0        27.900", 9],
  ["", 9],
  ["Dati aggregati, nessun nominativo. Documento di esempio.", 8],
]);
const sguardoOrganico = await eseguiTriage({
  dati: organico,
  mime: "application/pdf",
  tipiPertinenti: PERTINENTI,
});
if (sguardoOrganico.ok) {
  costoTotale += sguardoOrganico.uso.costoMicro;
  const d = decidiTriage(sguardoOrganico.triage, PERTINENTI);
  console.log(
    `   visto come: ${sguardoOrganico.triage.tipoProbabile} · art.9: ${sguardoOrganico.triage.datiParticolari ? sguardoOrganico.triage.categoria : "no"}`,
  );
  verifica(
    "   un elenco di addetti per genere NON è un dato particolare: si procede",
    d.azione === "procedi",
    d.azione,
  );
}

console.log(
  `\nCosto totale del collaudo: ${costoLeggibile(costoTotale)} su ${CASI.length + 1} documenti — ${costoLeggibile(Math.round(costoTotale / (CASI.length + 1)))} a documento.`,
);
console.log(
  `\nRisultato: ${superati}/${superati + falliti} controlli superati${falliti ? ` — ${falliti} FALLITI` : ""}\n`,
);
process.exit(falliti === 0 ? 0 : 1);
