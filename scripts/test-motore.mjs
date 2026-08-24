/**
 * TEST DEL MOTORE — validazione, plausibilità, confidenza, provenienza.
 *
 * Tutto quello che sta qui gira SENZA RETE, con risposte simulate. È una
 * scelta di progetto, non una comodità: la logica di cui ci fidiamo —
 * quella che decide se un dato entra o no in un documento che il cliente
 * porta in banca — non deve dipendere da una chiamata all'API per essere
 * verificata. La chiamata si prova a parte, con un documento vero.
 *
 * I casi storti sono più della metà, e non per pignoleria: un estrattore
 * si giudica su cosa fa quando il documento è sbagliato, non su cosa fa
 * quando è giusto.
 *
 *   node --import ./scripts/risolutore-ts.mjs scripts/test-motore.mjs
 */

import {
  interpretaRisposta,
  riepilogo,
} from "../src/lib/motore/estrazione.ts";
import { voceMotore, siSaLeggere } from "../src/lib/motore/famiglie.ts";
import {
  TETTO_MANOSCRITTO,
  canonicalizza,
  dataValida,
  normalizzaCampi,
  verificaBollettaElettrica,
} from "../src/lib/motore/plausibilita.ts";
import { CAMPI_BOLLETTA_ELETTRICA } from "../src/lib/motore/schemi.ts";
import { formattaValore, raggruppaLetture, livelloConfidenza } from "../src/lib/motore/portale.ts";
import { naturaPdf } from "../src/lib/motore/pdf.ts";
import {
  bozzaConDocumenti,
  completamentoBozza,
  segmentiBozza,
} from "../src/lib/bozza.ts";
import { costoMicroDollari, extractionConfig } from "../src/lib/motore/costi.ts";

let superati = 0;
let falliti = 0;
function verifica(descrizione, condizione, dettaglio = "") {
  if (condizione) {
    console.log(`✅ ${descrizione}`);
    superati++;
  } else {
    console.log(`❌ ${descrizione}${dettaglio ? ` — ${dettaglio}` : ""}`);
    falliti++;
  }
}

const VOCE = voceMotore("bolletta-elettrica");
const CTX = { annoRendicontazione: 2025, nativo: true };

/**
 * Un campo dello schema, coi valori predefiniti di una lettura pulita.
 * `null` significa «non letto», e nello schema si dice con la stringa
 * vuota: nessun campo è annullabile, perché l'API ammette al massimo 16
 * parametri con tipo unione e quaranta erano troppi (v. schemi.ts).
 */
const c = (valore, extra = {}) => ({
  valore: valore === null ? "" : String(valore),
  confidenza: 0.95,
  pagina: 1,
  estrattoDa: valore === null ? "" : String(valore),
  fonteLettura: "testo",
  nota: "",
  ...extra,
});

const TESTA = new Set(["tipoRilevato", "qualita", "piuPod", "avvertenze", "campi"]);

/** Una risposta completa e sana, da cui partono quasi tutti i casi. */
const bollettaSana = (sovrascrivi = {}) => {
  const campi = {
    pod: c("IT001E12345678"),
    fornitore: c("Enel Energia"),
    periodoInizio: c("2025-01-01"),
    periodoFine: c("2025-01-31"),
    consumoTotaleKwh: c(12000),
    consumoF1Kwh: c(6000),
    consumoF2Kwh: c(3500),
    consumoF3Kwh: c(2500),
    importoEuro: c(2880),
    energiaRinnovabile: c("non-dichiarato"),
  };
  const testa = {
    tipoRilevato: "bolletta-elettrica",
    qualita: "leggibile",
    piuPod: false,
    avvertenze: [],
  };
  for (const [k, v] of Object.entries(sovrascrivi)) {
    if (TESTA.has(k)) testa[k] = v;
    else campi[k] = v;
  }
  return {
    ...testa,
    campi: testa.campi ?? Object.entries(campi).map(([nome, v]) => ({ nome, ...v })),
  };
};

const campoDi = (esito, chiave) => esito.campi.find((x) => x.chiave === chiave);

/* ================================================================== */
console.log("\n— il registro: tipo → famiglia → schema —\n");

verifica("la bolletta elettrica si sa leggere", siSaLeggere("bolletta-elettrica"));
verifica(
  "un tipo senza schema non è un errore: semplicemente non si legge",
  !siSaLeggere("organigramma") && voceMotore("organigramma") === undefined,
);
verifica("la famiglia è dichiarata", VOCE.famiglia === "fonte");
verifica(
  "la versione dello schema esiste: senza, due letture non si distinguono",
  typeof VOCE.versione === "string" && VOCE.versione.length > 0,
);

/* ================================================================== */
console.log("\n— la lettura pulita —\n");

const sana = interpretaRisposta(bollettaSana(), VOCE, CTX);
verifica("una bolletta sana si legge", sana.esito === "ok", sana.esito);
verifica(
  "tutti i campi essenziali sono valorizzati",
  ["pod", "periodoInizio", "periodoFine", "consumoTotaleKwh"].every(
    (k) => campoDi(sana, k).valore !== null,
  ),
);
verifica(
  "nessun avviso su un documento che torna",
  sana.avvisi.length === 0,
  sana.avvisi.join(" | "),
);
verifica(
  "la provenienza c'è su ogni campo letto: pagina ed estratto",
  sana.campi
    .filter((x) => x.valore !== null)
    .every((x) => x.pagina !== null && x.estrattoDa !== null),
);
verifica(
  "il riepilogo conta i campi letti",
  riepilogo(sana.campi).letti === 10 && riepilogo(sana.campi).totali === 10,
  JSON.stringify(riepilogo(sana.campi)),
);

/* ================================================================== */
console.log("\n— caso storto: campi mancanti —\n");

const senzaFasce = interpretaRisposta(
  bollettaSana({
    consumoF1Kwh: c(null),
    consumoF2Kwh: c(null),
    consumoF3Kwh: c(null),
  }),
  VOCE,
  CTX,
);
verifica(
  "una bolletta senza fasce si legge lo stesso: le fasce non sono essenziali",
  senzaFasce.esito === "ok",
);
verifica(
  "un campo vuoto ha confidenza zero, non la confidenza dichiarata dal modello",
  campoDi(senzaFasce, "consumoF1Kwh").confidenza === 0,
  String(campoDi(senzaFasce, "consumoF1Kwh").confidenza),
);
verifica(
  "senza fasce non si inventa nessuna verifica di somma",
  senzaFasce.avvisi.length === 0,
  senzaFasce.avvisi.join(" | "),
);

const vuota = interpretaRisposta(
  bollettaSana({
    pod: c(null),
    periodoInizio: c(null),
    periodoFine: c(null),
    consumoTotaleKwh: c(null),
    consumoF1Kwh: c(null),
    consumoF2Kwh: c(null),
    consumoF3Kwh: c(null),
  }),
  VOCE,
  CTX,
);
verifica(
  "nessun campo essenziale letto: si dice che non è servita, non si mostra una tabella vuota",
  vuota.esito === "illeggibile",
  vuota.esito,
);

/* ================================================================== */
console.log("\n— caso storto: valori assurdi —\n");

const assurdo = interpretaRisposta(
  bollettaSana({
    consumoTotaleKwh: c(4_000_000_000),
    consumoF1Kwh: c(null),
    consumoF2Kwh: c(null),
    consumoF3Kwh: c(null),
  }),
  VOCE,
  CTX,
);
verifica(
  "quattro miliardi di kWh passano lo schema e NON passano la plausibilità",
  campoDi(assurdo, "consumoTotaleKwh").avvisi.length > 0,
);
verifica(
  "il valore assurdo resta visibile: tolto, il cliente non potrebbe correggerlo",
  campoDi(assurdo, "consumoTotaleKwh").valore !== null,
);
verifica(
  "la confidenza di un valore assurdo crolla",
  campoDi(assurdo, "consumoTotaleKwh").confidenza <= 0.5,
  String(campoDi(assurdo, "consumoTotaleKwh").confidenza),
);

const negativo = interpretaRisposta(
  bollettaSana({ consumoTotaleKwh: c(-500), consumoF1Kwh: c(null), consumoF2Kwh: c(null), consumoF3Kwh: c(null) }),
  VOCE,
  CTX,
);
verifica(
  "un consumo negativo viene segnalato",
  campoDi(negativo, "consumoTotaleKwh").avvisi.some((a) => a.includes("negativo")),
);

const podStorto = interpretaRisposta(bollettaSana({ pod: c("12345") }), VOCE, CTX);
verifica(
  "un POD che non ha la forma di un POD viene segnalato",
  campoDi(podStorto, "pod").avvisi.length > 0,
);

const dataImpossibile = interpretaRisposta(
  bollettaSana({ periodoFine: c("2025-02-31") }),
  VOCE,
  CTX,
);
verifica(
  "il 31 febbraio supera la forma e non supera il calendario",
  campoDi(dataImpossibile, "periodoFine").avvisi.length > 0,
);
verifica("dataValida rifiuta il 31 febbraio", dataValida("2025-02-31") === null);
verifica("dataValida accetta una data vera", dataValida("2025-01-31") !== null);

const rovesciato = interpretaRisposta(
  bollettaSana({ periodoInizio: c("2025-03-01"), periodoFine: c("2025-01-31") }),
  VOCE,
  CTX,
);
verifica(
  "un periodo che finisce prima di cominciare viene segnalato su entrambe le date",
  campoDi(rovesciato, "periodoInizio").avvisi.length > 0 &&
    campoDi(rovesciato, "periodoFine").avvisi.length > 0,
);

const fasceStorte = interpretaRisposta(
  bollettaSana({ consumoF1Kwh: c(9000) }),
  VOCE,
  CTX,
);
verifica(
  "le fasce che non sommano al totale vengono segnalate",
  fasceStorte.avvisi.some((a) => a.includes("fasce")),
  fasceStorte.avvisi.join(" | "),
);
verifica(
  "quando la somma non torna si segnalano TUTTI i numeri coinvolti: indicare il colpevole sbagliato è peggio",
  ["consumoTotaleKwh", "consumoF1Kwh", "consumoF2Kwh", "consumoF3Kwh"].every(
    (k) => campoDi(fasceStorte, k).avvisi.length > 0,
  ),
);

const fasceQuasi = interpretaRisposta(
  bollettaSana({ consumoF3Kwh: c(2450) }),
  VOCE,
  CTX,
);
verifica(
  "uno scarto dentro la tolleranza non fa rumore",
  fasceQuasi.avvisi.length === 0,
  fasceQuasi.avvisi.join(" | "),
);

const importoStorto = interpretaRisposta(
  bollettaSana({ importoEuro: c(95_000) }),
  VOCE,
  CTX,
);
verifica(
  "importo e consumo che non stanno insieme vengono segnalati",
  campoDi(importoStorto, "importoEuro").avvisi.length > 0,
);

/* ================================================================== */
console.log("\n— caso storto: JSON malformato e forma sbagliata —\n");

for (const [nome, grezzo] of [
  ["null", null],
  ["stringa", "non sono un oggetto"],
  ["oggetto vuoto", {}],
  ["campi non è un elenco", bollettaSana({ campi: { pod: "IT001E12345678" } })],
  ["un campo senza confidenza", bollettaSana({ campi: [{ nome: "pod", valore: "IT001E12345678", pagina: 1, estrattoDa: "x", fonteLettura: "testo", nota: "" }] })],
  ["confidenza fuori scala", bollettaSana({ pod: c("IT001E12345678", { confidenza: 7 }) })],
  ["fonte di lettura inventata", bollettaSana({ pod: c("IT001E12345678", { fonteLettura: "telepatia" }) })],
  ["nome di campo inventato", bollettaSana({ campi: [{ nome: "codiceSegreto", valore: "x", confidenza: 1, pagina: 1, estrattoDa: "x", fonteLettura: "testo", nota: "" }] })],
  ["qualità inventata", bollettaSana({ qualita: "discreta" })],
]) {
  const esito = interpretaRisposta(grezzo, VOCE, CTX);
  verifica(
    `risposta non conforme (${nome}) → non_valido, non un mezzo dato`,
    esito.esito === "non_valido",
    esito.esito,
  );
}

/* ================================================================== */
console.log("\n— caso storto: documento di un altro tipo —\n");

const gas = interpretaRisposta(
  bollettaSana({ tipoRilevato: "bolletta-gas" }),
  VOCE,
  CTX,
);
verifica("una bolletta del gas non si legge come elettrica", gas.esito === "altro_tipo");
verifica(
  "e lo si dice in italiano, dicendo cosa fare",
  gas.messaggio.includes("gas") && gas.messaggio.includes("Correggi"),
  gas.messaggio,
);
verifica(
  "nessun campo estratto da un documento di altro tipo: un'estrazione parziale sembra un successo",
  !("campi" in gas),
);

/* ================================================================== */
console.log("\n— caso storto: scansione illeggibile —\n");

const illeggibile = interpretaRisposta(
  bollettaSana({ qualita: "illeggibile" }),
  VOCE,
  CTX,
);
verifica("una scansione illeggibile è un esito dichiarato", illeggibile.esito === "illeggibile");
verifica(
  "e porta il rimedio, non solo il problema",
  /rifalla|originale/i.test(illeggibile.messaggio),
  illeggibile.messaggio,
);

const faticosa = interpretaRisposta(
  bollettaSana({ qualita: "faticosa" }),
  VOCE,
  { ...CTX, nativo: false },
);
verifica(
  "una scansione faticosa abbassa la confidenza di tutti i campi",
  campoDi(faticosa, "pod").confidenza <= 0.95 - 0.2 + 0.001,
  String(campoDi(faticosa, "pod").confidenza),
);
verifica("ma si legge lo stesso: faticoso non è illeggibile", faticosa.esito === "ok");

/* ================================================================== */
console.log("\n— la regola inviolabile: il manoscritto —\n");

const manoscritto = interpretaRisposta(
  bollettaSana({
    consumoTotaleKwh: c(12000, { fonteLettura: "manoscritto", confidenza: 1 }),
  }),
  VOCE,
  CTX,
);
const campoMano = campoDi(manoscritto, "consumoTotaleKwh");
verifica(
  `il manoscritto non supera ${TETTO_MANOSCRITTO} anche se il modello dichiara 1`,
  campoMano.confidenza <= TETTO_MANOSCRITTO,
  String(campoMano.confidenza),
);
verifica(
  "e porta un avviso esplicito, non una sfumatura di grigio",
  campoMano.avvisi.some((a) => a.includes("mano")),
);
verifica(
  "il tetto vale anche sommato alla penalità di qualità, mai al contrario",
  interpretaRisposta(
    bollettaSana({
      qualita: "faticosa",
      consumoTotaleKwh: c(12000, { fonteLettura: "manoscritto", confidenza: 1 }),
    }),
    VOCE,
    CTX,
  ).campi.find((x) => x.chiave === "consumoTotaleKwh").confidenza <=
    TETTO_MANOSCRITTO,
);

/* ================================================================== */
console.log("\n— fuori dall'anno di rendicontazione —\n");

const altroAnno = interpretaRisposta(
  bollettaSana({
    periodoInizio: c("2023-01-01"),
    periodoFine: c("2023-01-31"),
  }),
  VOCE,
  CTX,
);
verifica(
  "un documento di un altro anno si estrae lo stesso: è un documento vero",
  altroAnno.esito === "ok",
);
verifica("ma si dichiara fuori periodo", altroAnno.fuoriPeriodo === true);
verifica(
  "e lo si dice, con l'anno giusto",
  altroAnno.avvisi.some((a) => a.includes("2025")),
  altroAnno.avvisi.join(" | "),
);

/* ================================================================== */
console.log("\n— più POD nello stesso documento —\n");

const multiPod = interpretaRisposta(bollettaSana({ piuPod: true }), VOCE, CTX);
verifica(
  "più punti di prelievo: si avverte che i totali non sono di un contatore solo",
  multiPod.avvisi.some((a) => a.includes("più punti di prelievo")),
);
verifica(
  "e la confidenza scende su tutto, perché il dubbio è sul documento",
  campoDi(multiPod, "consumoTotaleKwh").confidenza < campoDi(sana, "consumoTotaleKwh").confidenza,
);

/* ================================================================== */
console.log("\n— normalizzazione: le regole che valgono su tutti —\n");

const nudi = normalizzaCampi(
  [{ nome: "pod", valore: "IT001E12345678", confidenza: 2, pagina: 1, estrattoDa: "x", fonteLettura: "testo", nota: "" }],
  CAMPI_BOLLETTA_ELETTRICA,
  "leggibile",
);
verifica(
  "una confidenza fuori scala viene riportata dentro [0,1]",
  nudi[0].confidenza === 1,
  String(nudi[0].confidenza),
);
verifica(
  "un campo assente dalla risposta non esplode: diventa vuoto a confidenza zero",
  nudi[1].valore === null && nudi[1].confidenza === 0,
);

const { avvisiDocumento } = verificaBollettaElettrica(
  normalizzaCampi(bollettaSana().campi, CAMPI_BOLLETTA_ELETTRICA, "leggibile"),
  { annoRendicontazione: 2025, piuPod: false },
);
verifica("la verifica pura non inventa avvisi", avvisiDocumento.length === 0);

/* ================================================================== */
console.log("\n— forma canonica: numeri e date come li scrive un fornitore —\n");

// Il modello riceve l'istruzione di restituire numeri col punto decimale.
// Fidarsi dell'istruzione basterebbe finché un giorno non basta più: qui si
// controlla che qualunque forma arrivi finisca in banca dati canonica.
for (const [scritto, atteso] of [
  ["12500", "12500"],
  ["12.500", "12500"],
  ["12.500,75", "12500.75"],
  ["12,500.75", "12500.75"],
  ["3.187,45", "3187.45"],
  ["1.250", "1250"],
  ["0,5", "0.5"],
  ["12500 kWh", "12500"],
  ["3.187,45 EUR", "3187.45"],
  ["", ""],
]) {
  verifica(
    `numero «${scritto}» → ${atteso}`,
    canonicalizza(scritto, "numero") === atteso,
    canonicalizza(scritto, "numero"),
  );
}
for (const [scritto, atteso] of [
  ["2025-01-31", "2025-01-31"],
  ["31/01/2025", "2025-01-31"],
  ["1/1/2025", "2025-01-01"],
  ["31.01.2025", "2025-01-31"],
]) {
  verifica(
    `data «${scritto}» → ${atteso}`,
    canonicalizza(scritto, "data") === atteso,
    canonicalizza(scritto, "data"),
  );
}
verifica(
  "un numero all'italiana letto dal modello arriva canonico nei campi",
  interpretaRisposta(
    bollettaSana({
      consumoTotaleKwh: c("12.500", { estrattoDa: "12.500 kWh" }),
      consumoF1Kwh: c(null),
      consumoF2Kwh: c(null),
      consumoF3Kwh: c(null),
    }),
    VOCE,
    CTX,
  ).campi.find((x) => x.chiave === "consumoTotaleKwh").valore === "12500",
);
verifica(
  "ma l'estratto conserva la forma del documento: è la prova di com'era scritto",
  interpretaRisposta(
    bollettaSana({ consumoTotaleKwh: c("12.500", { estrattoDa: "12.500 kWh" }) }),
    VOCE,
    CTX,
  ).campi.find((x) => x.chiave === "consumoTotaleKwh").estrattoDa === "12.500 kWh",
);

/* ================================================================== */
console.log("\n— la confidenza detta a una persona —\n");

verifica("0,95 → letto chiaramente", livelloConfidenza(0.95).chiave === "alta");
verifica("0,7 → da rivedere", livelloConfidenza(0.7).chiave === "media");
verifica("0,4 → da controllare", livelloConfidenza(0.4).chiave === "bassa");

/* ================================================================== */
console.log("\n— i valori come li legge una persona —\n");

verifica(
  "le date all'italiana",
  formattaValore("2025-01-31", null) === "31 gennaio 2025",
  formattaValore("2025-01-31", null),
);
verifica(
  "i numeri con le migliaia e l'unità",
  formattaValore("12000", "kWh") === "12.000 kWh",
  formattaValore("12000", "kWh"),
);
verifica("«si» diventa «sì»", formattaValore("si", null) === "sì");
verifica(
  "un testo resta testo",
  formattaValore("Enel Energia", null) === "Enel Energia",
);

/* ================================================================== */
console.log("\n— l'effetto sulla bozza: peso pieno solo dopo la conferma —\n");

const sezioni = [
  { titolo: "Anagrafica", stato: "popolata" },
  {
    titolo: "Scope 2 — energia acquistata",
    stato: "in-attesa",
    attendeTipi: ["bolletta-elettrica"],
  },
];
const bozzaBase = { intestazione: "Bozza", sezioni, daFornire: [] };

const senzaNulla = completamentoBozza(bozzaBase);
const conDocumento = completamentoBozza(
  bozzaConDocumenti(bozzaBase, new Set(["bolletta-elettrica"])),
);
const conLetturaDaConfermare = completamentoBozza(
  bozzaConDocumenti(bozzaBase, new Set(["bolletta-elettrica"]), {
    "bolletta-elettrica": {
      righe: [{ etichetta: "Consumo del periodo", valore: "12.000 kWh" }],
      fonti: ["Bolletta di energia elettrica"],
      daConfermare: 1,
      confermati: 0,
    },
  }),
);
const conLetturaConfermata = completamentoBozza(
  bozzaConDocumenti(bozzaBase, new Set(["bolletta-elettrica"]), {
    "bolletta-elettrica": {
      righe: [{ etichetta: "Consumo del periodo", valore: "12.000 kWh" }],
      fonti: ["Bolletta di energia elettrica"],
      daConfermare: 0,
      confermati: 1,
    },
  }),
);

verifica(
  "l'anello sale quando il documento arriva",
  conDocumento > senzaNulla,
  `${senzaNulla} → ${conDocumento}`,
);
verifica(
  "sale ancora quando il documento viene letto",
  conLetturaDaConfermare > conDocumento,
  `${conDocumento} → ${conLetturaDaConfermare}`,
);
verifica(
  "ma NON arriva a peso pieno finché il dato è da confermare",
  conLetturaDaConfermare < 100,
  String(conLetturaDaConfermare),
);
verifica(
  "il peso pieno arriva con la conferma, e solo con quella",
  conLetturaConfermata === 100,
  String(conLetturaConfermata),
);

const bozzaLetta = bozzaConDocumenti(bozzaBase, new Set(["bolletta-elettrica"]), {
  "bolletta-elettrica": {
    righe: [{ etichetta: "Consumo del periodo", valore: "12.000 kWh" }],
    fonti: ["Bolletta di energia elettrica"],
    daConfermare: 1,
    confermati: 0,
  },
});
verifica(
  "i valori letti compaiono nella SEZIONE che li aspettava",
  bozzaLetta.sezioni[1].righe?.[0]?.valore === "12.000 kWh",
);
verifica(
  "e la sezione dichiara da dove vengono",
  (bozzaLetta.sezioni[1].fonte ?? "").includes("Bolletta"),
  bozzaLetta.sezioni[1].fonte,
);
verifica(
  "l'anello ha un segmento «letta», distinto da «piena»",
  segmentiBozza(bozzaLetta)[1] === "letta",
  segmentiBozza(bozzaLetta)[1],
);

/* ================================================================== */
console.log("\n— i campi rifiutati non tornano nei documenti —\n");

const raggruppati = raggruppaLetture(
  [
    { document_id: "d1", campo: "consumoTotaleKwh", etichetta: "Consumo del periodo", valore: "12000", unita: "kWh", stato: "confermato" },
    { document_id: "d1", campo: "importoEuro", etichetta: "Importo", valore: "2880", unita: "€", stato: "rifiutato" },
    { document_id: "d1", campo: "pod", etichetta: "Codice POD", valore: "IT001E12345678", unita: null, stato: "da_confermare" },
    { document_id: "d2", campo: "pod", etichetta: "Codice POD", valore: "IT002E87654321", unita: null, stato: "da_confermare" },
  ],
  { d1: "bolletta-elettrica", d2: null },
);
verifica(
  "un campo rifiutato non entra: il cliente ha detto che è sbagliato",
  !raggruppati["bolletta-elettrica"].righe.some((r) => r.etichetta === "Importo"),
);
verifica(
  "un documento senza tipo non porta i suoi campi da nessuna parte",
  raggruppati["bolletta-elettrica"].righe.length === 2,
  String(raggruppati["bolletta-elettrica"].righe.length),
);
verifica(
  "confermati e da confermare si contano separati",
  raggruppati["bolletta-elettrica"].confermati === 1 &&
    raggruppati["bolletta-elettrica"].daConfermare === 1,
);

/* ================================================================== */
console.log("\n— nativo o scansione —\n");

/** Un PDF minimo con uno strato di testo vero, senza compressione. */
function pdfConTesto(testo) {
  const flusso = `BT /F1 12 Tf 72 720 Td (${testo}) Tj ET`;
  const corpo = [
    "%PDF-1.4",
    "1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj",
    "2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj",
    "3 0 obj << /Type /Page /Parent 2 0 R /Contents 4 0 R >> endobj",
    `4 0 obj << /Length ${flusso.length} >>\nstream\n${flusso}\nendstream endobj`,
    "trailer << /Root 1 0 R >>",
    "%%EOF",
  ].join("\n");
  return new TextEncoder().encode(corpo);
}

const nativo = naturaPdf(pdfConTesto("A".repeat(400)));
verifica(
  "un PDF con quattrocento caratteri di testo su una pagina è nativo",
  nativo.nativo === true && nativo.pagine === 1,
  JSON.stringify(nativo),
);
const scansione = naturaPdf(pdfConTesto("ab"));
verifica(
  "un PDF con due caratteri è una scansione: nel dubbio si dice scansione",
  scansione.nativo === false,
  JSON.stringify(scansione),
);
const nonPdf = naturaPdf(new TextEncoder().encode("questo non è un PDF"));
verifica(
  "un file che non è un PDF non fa esplodere il rilevamento",
  nonPdf.pagine === 1 && nonPdf.nativo === false,
  JSON.stringify(nonPdf),
);

/* ================================================================== */
console.log("\n— modello e costo —\n");

verifica(
  "il modello predefinito è claude-opus-5, anche con la variabile vuota",
  (() => {
    const prima = process.env.ANTHROPIC_EXTRACTION_MODEL;
    process.env.ANTHROPIC_EXTRACTION_MODEL = "";
    const m = extractionConfig().model;
    if (prima === undefined) delete process.env.ANTHROPIC_EXTRACTION_MODEL;
    else process.env.ANTHROPIC_EXTRACTION_MODEL = prima;
    return m === "claude-opus-5";
  })(),
);
verifica(
  "il costo si calcola dai token effettivi, in milionesimi di dollaro interi",
  costoMicroDollari("claude-opus-5", 5000, 700) === 5000 * 5 + 700 * 25,
  String(costoMicroDollari("claude-opus-5", 5000, 700)),
);
verifica(
  "una bolletta nativa con Opus 5 costa qualche centesimo, non qualche euro",
  costoMicroDollari("claude-opus-5", 5000, 700) / 1_000_000 < 0.1,
);
verifica(
  "un modello sconosciuto non inventa un costo",
  costoMicroDollari("modello-inesistente", 5000, 700) === 0,
);

console.log(
  `\nRisultato: ${superati}/${superati + falliti} test superati${falliti ? ` — ${falliti} FALLITI` : ""}\n`,
);
process.exit(falliti === 0 ? 0 : 1);
