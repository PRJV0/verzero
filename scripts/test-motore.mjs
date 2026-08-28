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
  istruzioni,
  riepilogo,
} from "../src/lib/motore/estrazione.ts";
import {
  REGISTRO_MOTORE,
  siSaLeggere,
  tipiDichiarati,
  tipiLeggibili,
  voceMotore,
} from "../src/lib/motore/famiglie.ts";
import { TIPI_DOCUMENTO } from "../src/lib/documenti.ts";
import {
  DOLLARO,
  MESSAGGIO_AL_CLIENTE,
  TETTI,
  notaAllarme,
  verdettoSpesa,
} from "../src/lib/motore/tetti.ts";
import {
  FAIR_USE,
  MESSAGGI_USO,
  USO_TIPICO,
  casoPeggiore,
  etichettaContatore,
  statoUso,
} from "../src/lib/motore/fair-use.ts";
import {
  MESSAGGIO_CICLI_RAVVICINATI,
  MESSAGGIO_RIUSO,
  VERSIONI_RAVVICINATE,
  decidiRigenerazione,
  serveRileggere,
} from "../src/lib/motore/riuso.ts";
import {
  TETTO_MANOSCRITTO,
  canonicalizza,
  dataValida,
  completatoOltreLaFonte,
  normalizzaCampi,
  normalizzaRighe,
  verificaBollettaElettrica,
} from "../src/lib/motore/plausibilita.ts";
import {
  MAX_AVVERTENZE,
  ordinaAvvertenze,
} from "../src/lib/motore/estrazione.ts";
import {
  CAMPI_BOLLETTA_ELETTRICA,
  COLONNE_FORMAZIONE,
} from "../src/lib/motore/schemi.ts";
import { formattaValore, raggruppaLetture, livelloConfidenza } from "../src/lib/motore/portale.ts";
import { naturaPdf, testoDelPdf } from "../src/lib/motore/pdf.ts";
import {
  CATEGORIE_PARTICOLARI,
  NOME_CATEGORIA,
  decidiTriage,
  istruzioniTriage,
  messaggioDatiParticolari,
  serveTriage,
} from "../src/lib/motore/triage.ts";
import {
  CAPACITA_DI_LIVELLO,
  MODELLO_DI_LIVELLO,
  livelloIniziale,
  manoscrittoAtteso,
  serveEscalation,
} from "../src/lib/motore/livelli.ts";
import {
  bozzaConDocumenti,
  completamentoBozza,
  segmentiBozza,
} from "../src/lib/bozza.ts";
import {
  costoMicroDollari,
  extractionConfig,
  tettoToken,
} from "../src/lib/motore/costi.ts";

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

const TESTA = new Set([
  "tipoRilevato",
  "tipoEffettivo",
  "qualita",
  "piuPod",
  "avvertenze",
  "campi",
]);

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
    tipoRilevato: "atteso",
    tipoEffettivo: "",
    qualita: "leggibile",
    piuPod: false,
    avvertenze: [],
    noteLibere: [],
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
  "un tipo dichiarato ma senza schema non è un errore: semplicemente non si legge",
  !siSaLeggere("verbali") &&
    voceMotore("verbali") !== undefined &&
    voceMotore("verbali").schema === undefined,
);
verifica(
  "un tipo che non esiste proprio non esiste",
  voceMotore("cartolina-dalle-maldive") === undefined,
);
verifica("la famiglia è dichiarata", VOCE.famiglia === "fonte");
verifica("e anche la forma", VOCE.forma === "scheda");
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
  riepilogo(sana).letti === 10 && riepilogo(sana).totali === 10,
  JSON.stringify(riepilogo(sana)),
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
  "un consumo negativo viene segnalato dal vincolo dichiarato",
  campoDi(negativo, "consumoTotaleKwh").avvisi.some((a) => a.includes("minimo")),
  campoDi(negativo, "consumoTotaleKwh").avvisi.join(" | "),
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
  bollettaSana({
    tipoRilevato: "altro-documento-dello-stesso-genere",
    tipoEffettivo: "una bolletta del gas",
  }),
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
  "il tipo davvero rilevato viene riportato al cliente",
  gas.tipoRilevato === "una bolletta del gas",
  gas.tipoRilevato,
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
  [],
  { annoRendicontazione: 2025, grezzo: { piuPod: false } },
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
    { document_id: "d1", riga: 0, campo: "consumoTotaleKwh", etichetta: "Consumo del periodo", valore: "12000", unita: "kWh", stato: "confermato" },
    { document_id: "d1", riga: 0, campo: "importoEuro", etichetta: "Importo", valore: "2880", unita: "€", stato: "rifiutato" },
    { document_id: "d1", riga: 0, campo: "pod", etichetta: "Codice POD", valore: "IT001E12345678", unita: null, stato: "da_confermare" },
    { document_id: "d2", riga: 0, campo: "pod", etichetta: "Codice POD", valore: "IT002E87654321", unita: null, stato: "da_confermare" },
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


/* ================================================================== */
console.log("\n— la tassonomia: famiglie, forme, dichiarato vs implementato —\n");

verifica(
  "ogni voce del registro dichiara famiglia, forma, cosa estrae e l'attesa",
  REGISTRO_MOTORE.every(
    (v) =>
      ["fonte", "opera"].includes(v.famiglia) &&
      ["scheda", "tabella"].includes(v.forma) &&
      Array.isArray(v.estrae) &&
      v.estrae.length > 0 &&
      typeof v.attesa?.nota === "string",
  ),
);
verifica(
  "ogni tipo del registro esiste anche nello smistamento, e viceversa",
  REGISTRO_MOTORE.every((v) => TIPI_DOCUMENTO.some((t) => t.chiave === v.tipo)) &&
    TIPI_DOCUMENTO.every((t) => REGISTRO_MOTORE.some((v) => v.tipo === t.chiave)),
);
verifica(
  "chi ha lo schema ha anche versione e campi: non esistono mezze voci",
  tipiLeggibili().every((v) => v.versione && v.campi?.length),
);
verifica(
  "un verificatore PROPRIO è facoltativo: i vincoli dichiarati bastano",
  tipiLeggibili().some((v) => !v.verifica),
  tipiLeggibili().filter((v) => !v.verifica).map((v) => v.tipo).join(", "),
);
verifica(
  "le versioni di schema sono tutte diverse: due letture devono distinguersi",
  new Set(tipiLeggibili().map((v) => v.versione)).size === tipiLeggibili().length,
);
verifica(
  "i quattro tipi del cuneo si sanno leggere",
  ["bolletta-elettrica", "visura", "organigramma", "organico", "formazione"].every(
    siSaLeggere,
  ),
);
verifica(
  "i tipi dichiarati e non implementati sono dichiarati per davvero",
  tipiDichiarati().length > 0 &&
    tipiDichiarati().every((v) => v.estrae.length > 0 && !v.schema),
);
verifica(
  "esiste almeno un documento-OPERA: la famiglia non è teorica",
  REGISTRO_MOTORE.some((v) => v.famiglia === "opera" && v.schema),
);
verifica(
  "e almeno una TABELLA implementata: la forma non è teorica",
  tipiLeggibili().some((v) => v.forma === "tabella"),
);

/* ================================================================== */
console.log("\n— le tabelle: N righe, non un campo ripetuto —\n");

const VOCE_FORMAZIONE = voceMotore("formazione");
const cella = (colonna, valore) => ({ colonna, valore: String(valore) });
const rigaCorso = (sovrascrivi = {}) => ({
  celle: [
    cella("corso", "Sicurezza generale"),
    cella("data", "2025-03-12"),
    cella("oreTotali", "4"),
    cella("partecipanti", "8"),
    cella("partecipantiDonne", "3"),
    cella("ambito", "sicurezza"),
  ],
  confidenza: 0.9,
  pagina: 1,
  estrattoDa: "Sicurezza generale 12/03/2025 4h 8 partecipanti",
  fonteLettura: "testo",
  nota: "",
  ...sovrascrivi,
});
const tabellaSana = (righe, extra = {}) => ({
  tipoRilevato: "atteso",
  tipoEffettivo: "",
  qualita: "leggibile",
  righe,
  avvertenze: [],
  noteLibere: [],
  ...extra,
});

const treCorsi = interpretaRisposta(
  tabellaSana([rigaCorso(), rigaCorso(), rigaCorso()]),
  VOCE_FORMAZIONE,
  CTX,
);
verifica("una tabella con tre righe dà tre righe", treCorsi.righe?.length === 3, String(treCorsi.esito));
verifica("e nessun campo: le due forme non si mescolano", treCorsi.campi?.length === 0);
verifica(
  "le righe sono numerate nell'ordine del foglio",
  treCorsi.righe.map((r) => r.indice).join(",") === "1,2,3",
);
verifica(
  "ogni riga porta la propria provenienza",
  treCorsi.righe.every((r) => r.pagina === 1 && r.estrattoDa),
);
verifica(
  "le celle tornano nell'ordine delle colonne dichiarate, non in quello d'arrivo",
  treCorsi.righe[0].celle.map((c) => c.chiave).join(",") ===
    VOCE_FORMAZIONE.campi.map((c) => c.chiave).join(","),
);
verifica(
  "una colonna non letta è una cella vuota, non una cella assente",
  treCorsi.righe[0].celle.length === VOCE_FORMAZIONE.campi.length &&
    treCorsi.righe[0].celle.find((c) => c.chiave === "docente").valore === null,
);

const conRigaVuota = interpretaRisposta(
  tabellaSana([rigaCorso(), { ...rigaCorso(), celle: [] }]),
  VOCE_FORMAZIONE,
  CTX,
);
verifica(
  "una riga senza nessuna cella piena si scarta: è un'intestazione, non un dato",
  conRigaVuota.righe.length === 1,
  String(conRigaVuota.righe.length),
);

const tabellaVuota = interpretaRisposta(tabellaSana([]), VOCE_FORMAZIONE, CTX);
verifica(
  "una tabella senza righe è un esito «illeggibile», non un successo vuoto",
  tabellaVuota.esito === "illeggibile",
  tabellaVuota.esito,
);

/* — Il manoscritto, sulle righe — */
const aMano = interpretaRisposta(
  tabellaSana([rigaCorso({ fonteLettura: "manoscritto", confidenza: 1 })]),
  VOCE_FORMAZIONE,
  CTX,
);
verifica(
  `una riga manoscritta non supera ${TETTO_MANOSCRITTO}, come un campo manoscritto`,
  aMano.righe[0].confidenza <= TETTO_MANOSCRITTO,
  String(aMano.righe[0].confidenza),
);
verifica(
  "e porta il suo avviso",
  aMano.righe[0].avvisi.some((a) => a.includes("mano")),
);

/* — I controlli di senso sulla formazione — */
const donneImpossibili = interpretaRisposta(
  tabellaSana([
    rigaCorso({
      celle: [cella("corso", "Parità"), cella("data", "2025-05-01"), cella("partecipanti", "4"), cella("partecipantiDonne", "9")],
    }),
  ]),
  VOCE_FORMAZIONE,
  CTX,
);
verifica(
  "più donne che partecipanti viene segnalato",
  donneImpossibili.righe[0].avvisi.length > 0,
);
const annoSbagliato = interpretaRisposta(
  tabellaSana([
    rigaCorso({
      celle: [cella("corso", "Vecchio"), cella("data", "2019-05-01"), cella("partecipanti", "4")],
      // La citazione deve REGGERE la data: prima diceva «12/03/2025» e
      // la cella diceva 2019, e da quando il valore non può aggiungere
      // niente alla fonte quella riga non è più «fuori periodo» — è una
      // data inventata, e il controllo giusto la azzera prima. Il
      // fixture era incoerente e non se n'era accorto nessuno.
      estrattoDa: "Vecchio corso 01/05/2019 4 partecipanti",
    }),
  ]),
  VOCE_FORMAZIONE,
  CTX,
);
verifica(
  "un corso di un altro anno si segnala e si dichiara fuori periodo",
  annoSbagliato.avvisi.length > 0 && annoSbagliato.fuoriPeriodo === true,
);

/* ================================================================== */
console.log("\n— organico: riservatezza prima di tutto —\n");

const VOCE_ORGANICO = voceMotore("organico");
const rigaOrganico = (celle, extra = {}) => ({
  celle,
  confidenza: 0.9,
  pagina: 1,
  estrattoDa: "riga",
  fonteLettura: "testo",
  nota: "",
  ...extra,
});

const gruppoDiUno = interpretaRisposta(
  tabellaSana([
    rigaOrganico([cella("categoria", "Dirigenti"), cella("genere", "donne"), cella("numero", "1"), cella("retribuzioneMediaLorda", "82000")]),
    rigaOrganico([cella("categoria", "Operai"), cella("genere", "uomini"), cella("numero", "24")]),
  ]),
  VOCE_ORGANICO,
  CTX,
);
verifica(
  "un gruppo di una persona sola viene segnalato: non è un dato aggregato",
  gruppoDiUno.avvisi.some((a) => a.includes("una persona sola")),
  gruppoDiUno.avvisi.join(" | "),
);

const partiIncoerenti = interpretaRisposta(
  tabellaSana([
    rigaOrganico([cella("categoria", "Impiegati"), cella("genere", "donne"), cella("numero", "10"), cella("partTime", "14")]),
    rigaOrganico([cella("categoria", "Impiegati"), cella("genere", "uomini"), cella("numero", "12")]),
  ]),
  VOCE_ORGANICO,
  CTX,
);
verifica(
  "più part time che addetti viene segnalato",
  partiIncoerenti.righe[0].avvisi.length > 0,
);

const retribuzioneMensile = interpretaRisposta(
  tabellaSana([
    rigaOrganico([cella("categoria", "Operai"), cella("genere", "uomini"), cella("numero", "10"), cella("retribuzioneMediaLorda", "1800")]),
    rigaOrganico([cella("categoria", "Operai"), cella("genere", "donne"), cella("numero", "6")]),
  ]),
  VOCE_ORGANICO,
  CTX,
);
verifica(
  "una retribuzione annua da 1.800 € viene segnalata (è un importo mensile)",
  retribuzioneMensile.righe[0].avvisi.some((a) => a.includes("mensile")),
);

const unSoloGenere = interpretaRisposta(
  tabellaSana([
    rigaOrganico([cella("categoria", "Operai"), cella("genere", "uomini"), cella("numero", "10")]),
  ]),
  VOCE_ORGANICO,
  CTX,
);
verifica(
  "dati non distinti per genere: si dice che gli indicatori di parità non si calcolano",
  unSoloGenere.avvisi.some((a) => a.includes("genere")),
);

/* ================================================================== */
console.log("\n— organigramma: ruoli, non persone —\n");

const VOCE_ORGANIGRAMMA = voceMotore("organigramma");
const conNome = interpretaRisposta(
  tabellaSana([
    rigaOrganico([cella("ruolo", "Sig. Rossi Responsabile Produzione"), cella("riportaA", "Direzione")]),
    rigaOrganico([cella("ruolo", "Direzione")]),
  ]),
  VOCE_ORGANIGRAMMA,
  CTX,
);
verifica(
  "un nome di persona in un ruolo viene segnalato: nel manuale va il ruolo",
  conNome.righe[0].avvisi.some((a) => a.includes("nome di una persona")),
  conNome.righe[0].avvisi.join(" | "),
);
const ruoliDoppi = interpretaRisposta(
  tabellaSana([
    rigaOrganico([cella("ruolo", "RSPP"), cella("riportaA", "Direzione")]),
    rigaOrganico([cella("ruolo", "rspp"), cella("riportaA", "Direzione")]),
  ]),
  VOCE_ORGANIGRAMMA,
  CTX,
);
verifica(
  "due volte lo stesso ruolo viene segnalato",
  ruoliDoppi.avvisi.some((a) => a.includes("più di una volta")),
);

/* ================================================================== */
console.log("\n— visura: la partita IVA si verifica, non si crede —\n");

const VOCE_VISURA = voceMotore("visura");
const visura = (sovrascrivi = {}) => {
  const campi = {
    ragioneSociale: c("Officina Lombardi S.r.l."),
    partitaIva: c("00743110157"),
    sedeLegale: c("Via delle Officine 12, Brescia"),
    ateco: c("25.62.00"),
  };
  const testa = { tipoRilevato: "atteso", tipoEffettivo: "", qualita: "leggibile", avvertenze: [], noteLibere: [] };
  for (const [k, v] of Object.entries(sovrascrivi)) {
    if (["tipoRilevato", "tipoEffettivo", "qualita", "avvertenze"].includes(k)) testa[k] = v;
    else campi[k] = v;
  }
  return { ...testa, campi: Object.entries(campi).map(([nome, v]) => ({ nome, ...v })) };
};

const visuraSana = interpretaRisposta(visura(), VOCE_VISURA, CTX);
verifica("una visura sana si legge", visuraSana.esito === "ok", visuraSana.esito);
verifica(
  "una partita IVA con la cifra di controllo giusta non fa rumore",
  visuraSana.campi.find((x) => x.chiave === "partitaIva").avvisi.length === 0,
);
const pivaStorta = interpretaRisposta(visura({ partitaIva: c("00743110158") }), VOCE_VISURA, CTX);
verifica(
  "una cifra sbagliata nella partita IVA viene colta dalla cifra di controllo",
  pivaStorta.campi.find((x) => x.chiave === "partitaIva").avvisi.length > 0,
);
const pivaCorta = interpretaRisposta(visura({ partitaIva: c("12345") }), VOCE_VISURA, CTX);
verifica(
  "una partita IVA che non ha undici cifre viene segnalata",
  pivaCorta.campi.find((x) => x.chiave === "partitaIva").avvisi.length > 0,
);
const atecoStorto = interpretaRisposta(visura({ ateco: c("venticinque") }), VOCE_VISURA, CTX);
verifica(
  "un ATECO che non è un ATECO viene segnalato",
  atecoStorto.campi.find((x) => x.chiave === "ateco").avvisi.length > 0,
);

/* ================================================================== */
console.log("\n— le istruzioni si compongono dai campi, non si scrivono a mano —\n");

const testoIstruzioni = istruzioni(VOCE_FORMAZIONE, CTX);
verifica(
  "ogni colonna dichiarata compare nelle istruzioni",
  VOCE_FORMAZIONE.campi.every((c) => testoIstruzioni.includes(c.chiave)),
);
verifica(
  "le istruzioni di una tabella parlano di righe, non di campi",
  testoIstruzioni.includes("TABELLA") && testoIstruzioni.includes("CONFIDENZA PER RIGA"),
);
verifica(
  "quelle di una scheda parlano di campi",
  istruzioni(VOCE, CTX).includes("CONFIDENZA PER CAMPO"),
);
verifica(
  "i valori ammessi di una scelta vengono detti al modello",
  testoIstruzioni.includes("parita-e-inclusione"),
);
verifica(
  "l'anno di rendicontazione entra nelle istruzioni",
  testoIstruzioni.includes("2025"),
);

/* ================================================================== */
console.log("\n— i tetti di spesa: invisibili, ma reali —\n");

verifica(
  "sotto tutte le soglie si procede",
  verdettoSpesa({ pratica: 0, organizzazione: 0, giorno: 0 }).esito === "procedi",
);
verifica(
  "superata la soglia della pratica si avvisa, e si continua",
  verdettoSpesa({ pratica: TETTI.pratica.soglia, organizzazione: 0, giorno: 0 })
    .esito === "avvisa",
);
verifica(
  "superato il tetto della pratica ci si ferma",
  verdettoSpesa({ pratica: TETTI.pratica.tetto, organizzazione: 0, giorno: 0 })
    .esito === "ferma",
);
verifica(
  "il tetto del giorno vince su quello della pratica: dice che il problema non è del cliente",
  verdettoSpesa({
    pratica: TETTI.pratica.tetto,
    organizzazione: 0,
    giorno: TETTI.giorno.tetto,
  }).ambito === "giorno",
);
verifica(
  "ogni tetto porta la sua motivazione: senza, nessuno saprà rivederlo",
  Object.values(TETTI).every((t) => t.perche.length > 40),
);
verifica(
  "il tetto tecnico di una pratica sta SOPRA il caso peggiore contrattuale",
  TETTI.pratica.tetto > casoPeggiore(1).costoMicro,
  `$${(TETTI.pratica.tetto / DOLLARO).toFixed(0)} contro $${(casoPeggiore(1).costoMicro / DOLLARO).toFixed(2)}`,
);
verifica(
  "e quello dell'organizzazione sopra il caso peggiore di quattro percorsi",
  TETTI.organizzazione.tetto > casoPeggiore(4).costoMicro,
);
verifica(
  "l'allarme di pratica sta appena sopra l'uso tipico: le anomalie si vedono presto",
  TETTI.pratica.soglia <= 3 * DOLLARO,
);
verifica(
  "il messaggio al cliente non nomina né tetti né costi né energia",
  !/tetto|limite|costo|spesa|budget|energi/i.test(MESSAGGIO_AL_CLIENTE),
  MESSAGGIO_AL_CLIENTE,
);
verifica(
  "la nota di back-office invece i numeri li dice",
  notaAllarme(
    verdettoSpesa({ pratica: TETTI.pratica.tetto, organizzazione: 0, giorno: 0 }),
  ).includes("FERMATO"),
);

/* ================================================================== */
console.log("\n— il riuso: non è un limite, ed è importante che non lo sembri —\n");

const IMPRONTA = { dati: "a", documenti: "b", norme: "c", modello: "d" };
const ORA = new Date("2026-08-24T10:00:00Z");
const IERI = new Date("2026-08-23T10:00:00Z");

const primaVolta = decidiRigenerazione({
  adesso: IMPRONTA,
  ultima: null,
  ultimaIl: null,
  versioniNellUltimaOra: 0,
  ora: ORA,
});
verifica("la prima volta si genera: non c'è niente da riusare", primaVolta.azione === "rigenera");

const nullaCambiato = decidiRigenerazione({
  adesso: IMPRONTA,
  ultima: IMPRONTA,
  ultimaIl: IERI,
  versioniNellUltimaOra: 0,
  ora: ORA,
});
verifica("nulla è cambiato: si riusa", nullaCambiato.azione === "riusa");
verifica(
  "col messaggio esatto, parola per parola",
  nullaCambiato.messaggio === MESSAGGIO_RIUSO,
);
verifica(
  "che parla di costo energetico e NON di limiti, quote o budget",
  /costo energetico/.test(MESSAGGIO_RIUSO) &&
    !/limite|quota|budget|non puoi|hai superato/i.test(MESSAGGIO_RIUSO),
);

for (const [campo, atteso] of [
  ["dati", "confermato dati nuovi"],
  ["documenti", "documenti nuovi"],
  ["norme", "cambiato edizione"],
  ["modello", "modello del documento"],
]) {
  const d = decidiRigenerazione({
    adesso: { ...IMPRONTA, [campo]: "cambiato" },
    ultima: IMPRONTA,
    ultimaIl: IERI,
    versioniNellUltimaOra: 0,
    ora: ORA,
  });
  verifica(
    `se cambia «${campo}» si rigenera senza obiezioni, dicendo cosa è cambiato`,
    d.azione === "rigenera" && d.avviso === undefined && d.cambiato.some((c) => c.includes(atteso)),
    JSON.stringify(d),
  );
}

const ravvicinate = decidiRigenerazione({
  adesso: { ...IMPRONTA, dati: "cambiato" },
  ultima: IMPRONTA,
  ultimaIl: IERI,
  versioniNellUltimaOra: VERSIONI_RAVVICINATE,
  ora: ORA,
});
verifica(
  "cicli ravvicinati: si rigenera lo stesso, con un invito gentile",
  ravvicinate.azione === "rigenera" && ravvicinate.avviso === MESSAGGIO_CICLI_RAVVICINATI,
);
verifica(
  "l'invito invita, non vieta",
  /conviene/.test(MESSAGGIO_CICLI_RAVVICINATI) &&
    !/non puoi|impedito|bloccat/i.test(MESSAGGIO_CICLI_RAVVICINATI),
);

/* — Lo stesso principio sulla lettura — */
verifica(
  "un documento mai letto si legge",
  serveRileggere({
    lettaIl: null,
    versioneSchema: null,
    versioneAdesso: "v1",
    documentoAggiornatoIl: null,
  }).serve,
);
verifica(
  "un documento già letto, immutato e con lo stesso schema non si rilegge",
  !serveRileggere({
    lettaIl: ORA,
    versioneSchema: "v1",
    versioneAdesso: "v1",
    documentoAggiornatoIl: IERI,
  }).serve,
);
verifica(
  "se cambia lo schema si rilegge",
  serveRileggere({
    lettaIl: ORA,
    versioneSchema: "v1",
    versioneAdesso: "v2",
    documentoAggiornatoIl: IERI,
  }).serve,
);
verifica(
  "se il file è stato sostituito si rilegge",
  serveRileggere({
    lettaIl: IERI,
    versioneSchema: "v1",
    versioneAdesso: "v1",
    documentoAggiornatoIl: ORA,
  }).serve,
);


/* ================================================================== */
console.log("\n— i limiti di uso corretto: in documenti, non in dollari —\n");

verifica(
  "la dotazione è un multiplo largo dell'uso reale misurato",
  FAIR_USE.documenti.inclusi >= USO_TIPICO.documenti * 5 &&
    FAIR_USE.generazioni.inclusi >= USO_TIPICO.generazioni * 3,
);
verifica(
  "l'uso tipico non sfiora la dotazione: nemmeno un quinto",
  statoUso({ documenti: USO_TIPICO.documenti, generazioni: USO_TIPICO.generazioni }, 1)
    .quota < 0.2,
);
verifica(
  "sotto la dotazione tutto è normale e non si dice niente",
  statoUso({ documenti: 100, generazioni: 5 }, 1).livello === "normale" &&
    MESSAGGI_USO.normale === null,
);
verifica(
  "oltre la dotazione si passa in differita, non ci si ferma",
  statoUso({ documenti: FAIR_USE.documenti.inclusi + 1, generazioni: 0 }, 1)
    .livello === "differita",
);
verifica(
  "molto oltre si chiede di parlarne",
  statoUso({ documenti: FAIR_USE.documenti.differita + 1, generazioni: 0 }, 1)
    .livello === "contatto",
);
verifica(
  "anche le generazioni fanno scattare il gradino, e si sa quale",
  statoUso({ documenti: 0, generazioni: FAIR_USE.generazioni.inclusi + 1 }, 1)
    .causa === "generazioni",
);
verifica(
  "la dotazione si moltiplica per i percorsi attivi",
  statoUso({ documenti: FAIR_USE.documenti.inclusi + 1, generazioni: 0 }, 3)
    .livello === "normale",
);
verifica(
  "chi non ha ancora percorsi ha comunque una dotazione: nessun muro al primo documento",
  statoUso({ documenti: 5, generazioni: 0 }, 0).livello === "normale",
);
verifica(
  "nessun messaggio al cliente parla di costi, limiti superati o colpe",
  Object.values(MESSAGGI_USO)
    .filter(Boolean)
    .every((m) => !/\$|costo|budget|superat|eccedut|non puoi|troppo/i.test(m)),
  Object.values(MESSAGGI_USO).filter(Boolean).join(" | "),
);
verifica(
  "il messaggio della differita dice che arrivano TUTTE",
  /arrivano tutte/i.test(MESSAGGI_USO.differita),
);
verifica(
  "quello del contatto dice che il lavoro in corso continua",
  /continua/i.test(MESSAGGI_USO.contatto),
);
verifica(
  "il contatore si legge in documenti",
  /documenti elaborati/.test(
    etichettaContatore(statoUso({ documenti: 38, generazioni: 0 }, 1)),
  ),
  etichettaContatore(statoUso({ documenti: 38, generazioni: 0 }, 1)),
);

/* — Il caso peggiore, che è il numero del piano economico — */
const peggiore = casoPeggiore(1);
verifica(
  "il caso peggiore per percorso è certo e calcolabile",
  peggiore.documenti === FAIR_USE.documenti.differita &&
    peggiore.costoMicro > 0,
  `$${(peggiore.costoMicro / DOLLARO).toFixed(2)}`,
);
verifica(
  "e cresce in modo lineare coi percorsi: nessuna sorpresa nel modello",
  Math.abs(casoPeggiore(4).costoMicro - peggiore.costoMicro * 4) < 10,
);


/* ================================================================== */
console.log("\n— quale modello per quale compito —\n");

const VOCE_VISURA_L = voceMotore("visura");
const VOCE_ORGANIGRAMMA_L = voceMotore("organigramma");
const VOCE_FORMAZIONE_L = voceMotore("formazione");

verifica(
  "un documento nativo a campi fissi parte dal livello leggero",
  livelloIniziale(VOCE, { nativo: true, manoscrittoAtteso: false }) === "leggero",
);
verifica(
  "una scansione parte dall'intermedio: la posizione sulla pagina è metà dell'informazione",
  livelloIniziale(VOCE, { nativo: false, manoscrittoAtteso: false }) === "intermedio",
);
verifica(
  "una tabella parte dall'intermedio anche se nativa",
  livelloIniziale(VOCE_FORMAZIONE_L, { nativo: true, manoscrittoAtteso: false }) ===
    "intermedio",
);
verifica(
  "un documento-OPERA parte dal superiore: è analisi, non trascrizione",
  livelloIniziale(VOCE_ORGANIGRAMMA_L, { nativo: true, manoscrittoAtteso: false }) ===
    "superiore",
);
verifica(
  "un tipo spesso manoscritto, arrivato SCANSIONATO, parte dal superiore",
  livelloIniziale(VOCE, { nativo: false, manoscrittoAtteso: true }) === "superiore",
);
verifica(
  "lo stesso tipo arrivato NATIVO no: in uno strato di testo una grafia non ci sta",
  livelloIniziale(VOCE_FORMAZIONE_L, { nativo: true, manoscrittoAtteso: true }) ===
    "intermedio",
);
verifica(
  "l'attesa dichiarata dice quali tipi sono manoscritti: la formazione sì, la visura no",
  manoscrittoAtteso(VOCE_FORMAZIONE_L) && !manoscrittoAtteso(VOCE_VISURA_L),
);
verifica(
  "il livello leggero non chiede né ragionamento adattivo né effort: quel modello li rifiuta",
  !CAPACITA_DI_LIVELLO.leggero.ragionamentoAdattivo &&
    !CAPACITA_DI_LIVELLO.leggero.effort,
);
verifica(
  "gli altri due li accettano entrambi",
  CAPACITA_DI_LIVELLO.intermedio.effort && CAPACITA_DI_LIVELLO.superiore.ragionamentoAdattivo,
);

/* — L'escalation — */
const buona = { letti: 9, attesi: 10, essenzialiMancanti: 0, confidenzaMedia: 0.95, conAvvisi: 0 };
verifica(
  "una lettura buona non sale di livello: si paga il pieno solo quando serve",
  serveEscalation("leggero", buona, true).serve === false,
);
verifica(
  "un campo essenziale mancante fa salire",
  serveEscalation("leggero", { ...buona, essenzialiMancanti: 1 }, true).serve === true,
);
verifica(
  "una confidenza sotto soglia fa salire",
  serveEscalation("leggero", { ...buona, confidenzaMedia: 0.5 }, true).serve === true,
);
verifica(
  "meno della metà dei valori attesi fa salire",
  serveEscalation("leggero", { ...buona, letti: 3, attesi: 10 }, true).serve === true,
);
verifica(
  "si sale di UN livello per volta, e si dice perché",
  serveEscalation("leggero", { ...buona, essenzialiMancanti: 2 }, true).verso ===
    "intermedio" &&
    serveEscalation("leggero", { ...buona, essenzialiMancanti: 2 }, true).motivo.includes(
      "essenziali",
    ),
);
verifica(
  "dal livello superiore non si sale: non c'è dove",
  serveEscalation("superiore", { ...buona, essenzialiMancanti: 3 }, true).serve === false,
);
verifica(
  "un documento di altro tipo o illeggibile NON si rilegge: fallirebbe uguale",
  serveEscalation("leggero", { ...buona, essenzialiMancanti: 3 }, false).serve === false,
);
verifica(
  "ogni livello ha il suo modello, tutti diversi",
  new Set(Object.values(MODELLO_DI_LIVELLO)).size === 3,
);

/* ================================================================== */
console.log("\n— il testo estratto in locale, per misurare quanto si perde —\n");

const pdfProva = (testo) => {
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
};

verifica(
  "il testo di un PDF nativo si estrae",
  testoDelPdf(pdfProva("Codice POD: IT001E98765432")).includes("IT001E98765432"),
  testoDelPdf(pdfProva("Codice POD: IT001E98765432")),
);
verifica(
  "un file che non è un PDF non fa esplodere l'estrazione: restituisce vuoto",
  testoDelPdf(new TextEncoder().encode("non sono un pdf")) === "",
);


/* ================================================================== */
console.log("\n— il tetto di token si calcola, non si fissa —\n");

verifica(
  "una scheda si accontenta del tetto di base",
  tettoToken("scheda", 1, 10) === 4000,
  String(tettoToken("scheda", 1, 10)),
);
verifica(
  "una tabella di una pagina ha molto più spazio di una scheda",
  tettoToken("tabella", 1, 8) > 4000,
  String(tettoToken("tabella", 1, 8)),
);
verifica(
  "venti righe da sette colonne ci stanno: sono ~6.100 token misurati",
  tettoToken("tabella", 1, 7) >= 6100,
  String(tettoToken("tabella", 1, 7)),
);
verifica(
  "più pagine, più spazio",
  tettoToken("tabella", 3, 7) >= tettoToken("tabella", 1, 7),
);
verifica(
  "ma esiste un tetto assoluto: un'uscita più lunga è un difetto, non un registro",
  tettoToken("tabella", 100, 20) <= 16_000,
  String(tettoToken("tabella", 100, 20)),
);


/* ================================================================== */
console.log("\n— il triage: si guarda che cos'è, prima di leggerlo —\n");

const PERTINENTI = ["bolletta-elettrica", "organico", "formazione"];
const sguardo = (s) => ({
  tipoProbabile: "bolletta-elettrica",
  datiParticolari: false,
  categoria: "nessuna",
  leggibile: true,
  ...s,
});

/* — 1. Documento pertinente — */
const pertinente = decidiTriage(sguardo(), PERTINENTI);
verifica(
  "un documento pertinente e leggibile passa: si procede all'estrazione",
  pertinente.azione === "procedi",
  pertinente.azione,
);

/* — 2. Documento estraneo ma innocuo — */
const estraneo = decidiTriage(sguardo({ tipoProbabile: "altro" }), PERTINENTI);
verifica(
  "un documento estraneo si ferma prima di estrarre",
  estraneo.azione === "non-pertinente",
  estraneo.azione,
);
verifica(
  "e il messaggio dice che NON l'abbiamo letto",
  /senza leggerlo/i.test(estraneo.messaggio),
  estraneo.messaggio,
);
verifica(
  "e che resta in archivio, non che è stato rifiutato",
  /lasciarlo|archiviato/i.test(estraneo.messaggio) &&
    !/rifiut|respint|errore/i.test(estraneo.messaggio),
);
const noto = decidiTriage(sguardo({ tipoProbabile: "rifiuti" }), PERTINENTI);
verifica(
  "un tipo che conosciamo ma che non serve a questi percorsi si ferma lo stesso",
  noto.azione === "non-pertinente",
);
verifica(
  "e lo si chiama col suo nome, non «un documento»",
  noto.messaggio.includes("registro dei rifiuti"),
  noto.messaggio,
);

/* — 3. Documento con dati sanitari — */
const sanitario = decidiTriage(
  sguardo({ datiParticolari: true, categoria: "salute" }),
  PERTINENTI,
);
verifica(
  "un documento con dati sanitari si ferma",
  sanitario.azione === "dati-particolari",
  sanitario.azione,
);
verifica(
  "e il messaggio dice le tre cose: cosa abbiamo visto, che non lo trattiamo, cosa fare",
  /salute/.test(sanitario.messaggio) &&
    /non ci servono/.test(sanitario.messaggio) &&
    /[Rr]imuovilo/.test(sanitario.messaggio),
  sanitario.messaggio,
);
verifica(
  "e dice esplicitamente che non l'abbiamo letto né conservato",
  /non l'abbiamo letto/i.test(sanitario.messaggio) &&
    /non ne conserviamo il contenuto/i.test(sanitario.messaggio),
);
verifica(
  "senza dare del distratto a nessuno e senza alludere a conseguenze",
  !/errore|sbagli|attenzione|violazione|sanzione|non dovevi/i.test(
    sanitario.messaggio,
  ),
);

/* — La pertinenza NON salva un documento con dati particolari — */
const sanitarioPertinente = decidiTriage(
  sguardo({
    tipoProbabile: "organico",
    datiParticolari: true,
    categoria: "salute",
  }),
  PERTINENTI,
);
verifica(
  "un documento PERTINENTE con dati sanitari si ferma lo stesso: la pertinenza non conta",
  sanitarioPertinente.azione === "dati-particolari",
  sanitarioPertinente.azione,
);

/* — E nemmeno l'illeggibilità lo fa saltare — */
const sanitarioIlleggibile = decidiTriage(
  sguardo({ datiParticolari: true, categoria: "identita", leggibile: false }),
  PERTINENTI,
);
verifica(
  "un documento d'identità illeggibile si ferma per l'art. 9, non per la qualità",
  sanitarioIlleggibile.azione === "dati-particolari",
  sanitarioIlleggibile.azione,
);
verifica(
  "l'ordine dei controlli è questo: bastava mettere l'art. 9 in fondo per poterlo saltare",
  decidiTriage(
    sguardo({
      tipoProbabile: "altro",
      datiParticolari: true,
      categoria: "giudiziari",
      leggibile: false,
    }),
    PERTINENTI,
  ).azione === "dati-particolari",
);

/* — Un modello che si contraddice: nel dubbio ci si ferma — */
const contraddittorio = decidiTriage(
  sguardo({ datiParticolari: false, categoria: "salute" }),
  PERTINENTI,
);
verifica(
  "«no» più una categoria è una contraddizione: si ferma",
  contraddittorio.azione === "dati-particolari",
);
const soloBandiera = decidiTriage(
  sguardo({ datiParticolari: true, categoria: "nessuna" }),
  PERTINENTI,
);
verifica(
  "e «sì» senza categoria pure, con la categoria generica",
  soloBandiera.azione === "dati-particolari" &&
    soloBandiera.categoria === "altro-art9",
);

/* — 4. Documento illeggibile — */
const illeggibileTriage = decidiTriage(sguardo({ leggibile: false }), PERTINENTI);
verifica(
  "un documento illeggibile si ferma qui, senza spendere l'estrazione",
  illeggibileTriage.azione === "illeggibile",
);
verifica(
  "col rimedio, non solo col problema",
  /rifalla|originale/i.test(illeggibileTriage.messaggio),
);

/* — Ogni categoria ha un nome dicibile — */
verifica(
  "ogni categoria dell'art. 9 ha un nome per il cliente, senza gergo",
  CATEGORIE_PARTICOLARI.filter((c) => c !== "nessuna").every(
    (c) => NOME_CATEGORIA[c] && NOME_CATEGORIA[c].length > 3,
  ),
);
verifica(
  "e il messaggio funziona per tutte",
  CATEGORIE_PARTICOLARI.filter((c) => c !== "nessuna").every((c) =>
    messaggioDatiParticolari(c).includes(NOME_CATEGORIA[c]),
  ),
);

/* — Quando il triage si ripete, e quando no — */
verifica(
  "un documento mai guardato si guarda",
  serveTriage({ esito: null, quando: null, documentoAggiornatoIl: null }),
);
verifica(
  "uno già guardato e immutato non si riguarda: sarebbe la stessa risposta a pagamento",
  !serveTriage({
    esito: "procedi",
    quando: new Date("2026-08-25T10:00:00Z"),
    documentoAggiornatoIl: new Date("2026-08-25T09:00:00Z"),
  }),
);
verifica(
  "ma se il file è stato sostituito si riguarda",
  serveTriage({
    esito: "procedi",
    quando: new Date("2026-08-25T09:00:00Z"),
    documentoAggiornatoIl: new Date("2026-08-25T10:00:00Z"),
  }),
);

/* — Le istruzioni non chiedono contenuto — */
const testoTriage = istruzioniTriage(PERTINENTI);
verifica(
  "le istruzioni vietano esplicitamente di riportare contenuto",
  /NON estrarre dati/.test(testoTriage) &&
    /NON riassumere/.test(testoTriage) &&
    /NON riportare frasi/.test(testoTriage),
);
verifica(
  "e dicono di sbagliare per eccesso di prudenza sull'art. 9",
  /Nel dubbio, DÌ DI SÌ/.test(testoTriage),
);
verifica(
  "mettendo in guardia dal falso positivo più probabile: l'organico non è un dato sanitario",
  /NON è un dato particolare/.test(testoTriage),
);
verifica(
  "e l'elenco dei tipi è quello del registro, non una copia",
  REGISTRO_MOTORE.every((v) => testoTriage.includes(v.tipo)),
);


/* ================================================================== */
console.log("\n═══ IL VALORE NON AGGIUNGE — il caso della data completata ═══\n");
console.log("Misurato su un registro presenze vero, letto tre volte:");
console.log("sul foglio c'è «28/08», una lettura su tre ha scritto 2025-08-28.\n");

/* — L'aritmetica, prima di tutto — */
verifica(
  "una data completata con un anno che nella citazione non c'è viene riconosciuta",
  completatoOltreLaFonte("2025-08-28", "... - 28/08 - Ing. A.Rossi - Ingresso 9:00 - Uscita 18:00"),
);
verifica(
  "una data che nella citazione c'è tutta NON viene toccata",
  !completatoOltreLaFonte("2025-01-31", "Periodo di riferimento: dal 01/01/2025 al 31/01/2025"),
);
verifica(
  "i separatori di migliaia non fanno scattare l'allarme",
  !completatoOltreLaFonte("3187.45", "TOTALE DA PAGARE 3.187,45 EUR"),
);
verifica(
  "e nemmeno le barre di una data all'italiana",
  !completatoOltreLaFonte("2025-08-28", "del 28/08/2025"),
);
verifica(
  "senza citazione non si giudica: l'assenza di prove non è una prova",
  !completatoOltreLaFonte("2025-08-28", ""),
);
verifica(
  "un valore senza cifre non riguarda questa regola",
  !completatoOltreLaFonte("Ing. A.Rossi", "Docente"),
);

/* — La riga vera, quella che è uscita dall'API — */
const RIGA_REGISTRO = {
  celle: [
    { colonna: "corso", valore: "CORSO DI FORMAZIONE CYBER SECURITY E RISCHI INFORMATICI" },
    { colonna: "data", valore: "2025-08-28" },
    { colonna: "oreTotali", valore: "9" },
    { colonna: "partecipanti", valore: "5" },
    { colonna: "ambito", valore: "tecnico-professionale" },
    { colonna: "docente", valore: "Ing. A.Rossi" },
  ],
  confidenza: 0.62,
  pagina: 1,
  estrattoDa:
    "REGISTRTO PRESENZE - CORSO DI FORMAZIONE CYBER SECURITY E RISCHI INFORMATICI - 28/08 - Ing. A.Rossi - Ingresso 9:00 - Uscita 18:00",
  fonteLettura: "manoscritto",
  nota: "Sul foglio è indicato solo 28/08, senza anno.",
};

const righeRegistro = normalizzaRighe([RIGA_REGISTRO], COLONNE_FORMAZIONE, "faticosa");
const cellaRegistro = (chiave) =>
  righeRegistro[0]?.celle.find((c) => c.chiave === chiave)?.valore ?? null;

verifica(
  "la data completata con l'anno che non c'è viene AZZERATA",
  cellaRegistro("data") === null,
  String(cellaRegistro("data")),
);
verifica(
  "e il cliente legge perché, senza che gli si dia del distratto",
  righeRegistro[0].avvisi.some((a) => /non c'è per intero/.test(a)),
  righeRegistro[0].avvisi.join(" | "),
);
verifica(
  "le ore DEDOTTE dagli orari restano: dedurre da ciò che c'è non è inventare",
  cellaRegistro("oreTotali") === "9",
  String(cellaRegistro("oreTotali")),
);
verifica(
  "i partecipanti contati dalle firme restano",
  cellaRegistro("partecipanti") === "5",
  String(cellaRegistro("partecipanti")),
);
verifica(
  "il testo prestampato non viene toccato: non ha cifre da completare",
  cellaRegistro("docente") === "Ing. A.Rossi",
  String(cellaRegistro("docente")),
);
verifica(
  "la riga non viene scartata: il resto vale ancora",
  righeRegistro.length === 1,
);

/* — E la stessa regola sulle schede — */
const schedaCompletata = normalizzaCampi(
  [
    {
      nome: "periodoFine",
      valore: "31/01/2025",
      confidenza: 0.9,
      pagina: 1,
      estrattoDa: "Periodo: dal 01/01 al 31/01",
      fonteLettura: "testo",
      nota: "",
    },
  ],
  CAMPI_BOLLETTA_ELETTRICA,
  "leggibile",
);
verifica(
  "vale identica sulle schede: un periodo completato con l'anno si azzera",
  schedaCompletata.find((c) => c.chiave === "periodoFine")?.valore === null,
  String(schedaCompletata.find((c) => c.chiave === "periodoFine")?.valore),
);
verifica(
  "e la confidenza scende a zero, non resta alta su un campo vuoto",
  schedaCompletata.find((c) => c.chiave === "periodoFine")?.confidenza === 0,
);


/* ================================================================== */
console.log("\n— le avvertenze: quattro, e l'ordine è nostro —\n");

const SETTE = [
  { testo: "informativa 1", azione: false },
  { testo: "da fare 1", azione: true },
  { testo: "informativa 2", azione: false },
  { testo: "da fare 2", azione: true },
  { testo: "informativa 3", azione: false },
  { testo: "informativa 4", azione: false },
  { testo: "informativa 5", azione: false },
];
const ordinate = ordinaAvvertenze(SETTE);

verifica(
  "non arrivano mai più di quattro avvertenze al cliente",
  ordinate.length === MAX_AVVERTENZE,
  `${ordinate.length}`,
);
verifica(
  "prima quello che chiede un gesto, e nell'ordine in cui stava",
  ordinate[0] === "da fare 1" && ordinate[1] === "da fare 2",
  ordinate.join(" | "),
);
verifica(
  "poi quello che serve solo a sapere",
  ordinate[2] === "informativa 1" && ordinate[3] === "informativa 2",
  ordinate.join(" | "),
);
verifica(
  "un'avvertenza da fare non viene MAI tagliata a favore di una informativa",
  ordinaAvvertenze([
    ...Array.from({ length: 6 }, (_, i) => ({ testo: `info ${i}`, azione: false })),
    { testo: "questa richiede un'azione", azione: true },
  ])[0] === "questa richiede un'azione",
);
verifica(
  "le stringhe nude della forma vecchia non si perdono",
  ordinaAvvertenze(["una", "due"]).length === 2,
);
verifica(
  "le voci vuote non occupano un posto dei quattro",
  ordinaAvvertenze([
    { testo: "   ", azione: true },
    { testo: "vera", azione: false },
  ]).join("") === "vera",
);
verifica(
  "e un'uscita malformata non fa esplodere niente",
  ordinaAvvertenze(null).length === 0 && ordinaAvvertenze("no").length === 0,
);

/* — Il tetto d'uscita: largo abbastanza per il ragionamento — */
verifica(
  "il tetto di una tabella copre il caso peggiore misurato col ragionamento acceso",
  // 1.884 token è l'uscita più alta osservata su un registro di UNA
  // riga; il tetto deve stare sopra con margine, altrimenti si tronca
  // dopo aver già speso il ragionamento.
  tettoToken("tabella", 1, 8) > 1884 * 2,
  `${tettoToken("tabella", 1, 8)} token`,
);
verifica(
  "e cresce con le righe attese, invece di restare fisso",
  tettoToken("tabella", 3, 8) > tettoToken("tabella", 1, 8),
  `${tettoToken("tabella", 1, 8)} → ${tettoToken("tabella", 3, 8)}`,
);
verifica(
  "una scheda resta al tetto suo: pochi campi, nessuna riga",
  tettoToken("scheda", 1, 10) === 4000,
);

console.log(
  `\nRisultato: ${superati}/${superati + falliti} test superati${falliti ? ` — ${falliti} FALLITI` : ""}\n`,
);
process.exit(falliti === 0 ? 0 : 1);
