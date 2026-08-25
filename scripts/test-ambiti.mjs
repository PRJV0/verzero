/**
 * LA PROVA CHE L'ARCHITETTURA REGGE — un ambito nuovo, solo con dati.
 *
 * Il Motore serve oggi la sostenibilità e i sistemi di gestione. Domani
 * dovrà servire il Modello 231, la privacy, la sicurezza informatica, e
 * ambiti che oggi non sappiamo nominare. La promessa dell'architettura è
 * che aggiungerne uno sia CONFIGURAZIONE e non codice.
 *
 * Questa prova la verifica sul serio: dichiara qui dentro — **senza
 * toccare una riga di `src/`** — i tipi di documento, i vincoli, il
 * modello di elaborato e le norme di un ambito che il prodotto non
 * conosce, e poi ci fa girare sopra la pipeline vera: estrazione,
 * validazione, plausibilità, composizione della bozza, controllo di
 * conformità.
 *
 * Se un giorno per far passare questa prova servisse modificare la
 * pipeline, sarebbe l'architettura a essere sbagliata — non la prova.
 *
 *   node --import ./scripts/risolutore-ts.mjs scripts/test-ambiti.mjs
 */

import { z } from "zod";

import { interpretaRisposta, istruzioni } from "../src/lib/motore/estrazione.ts";
import { schemaScheda, schemaTabella } from "../src/lib/motore/schemi.ts";
import { bozzaDaModello, completamentoBozza } from "../src/lib/bozza.ts";
import { controllaConformita, tuttiIModelli } from "../src/lib/elaborati.ts";
import { AMBITI, ambitoDiPercorso, ambitiCheUsano } from "../src/lib/ambiti.ts";
import { REGISTRO_MOTORE } from "../src/lib/motore/famiglie.ts";
import { REGISTRO_NORME } from "../src/lib/norme.ts";

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

/* ================================================================== */
/* L'AMBITO NUOVO, DICHIARATO QUI E SOLO QUI                           */
/* ================================================================== */

/* — 1. I TIPI DI DOCUMENTO (andrebbero in famiglie.ts) — */

/** La mappatura delle attività a rischio reato: una tabella. */
const COLONNE_MAPPATURA_231 = [
  {
    chiave: "area",
    etichetta: "Area o processo aziendale",
    tipo: "testo",
    essenziale: true,
  },
  {
    chiave: "reatoPresupposto",
    etichetta: "Reato presupposto",
    tipo: "testo",
    essenziale: true,
  },
  {
    chiave: "articolo",
    etichetta: "Articolo del decreto",
    tipo: "testo",
    // Un vincolo DICHIARATO, non scritto in codice: la pipeline lo fa
    // rispettare senza sapere che cosa sia l'art. 24-ter.
    formato: "^(art\\.?\\s?)?\\d{1,2}(-[a-z]+)?(\\s?bis|\\s?ter|\\s?quater)?$",
    formatoNota:
      "Non ha la forma di un articolo del decreto (per esempio «24-bis»).",
  },
  {
    chiave: "livelloRischio",
    etichetta: "Livello di rischio",
    tipo: "scelta",
    valori: ["alto", "medio", "basso"],
    essenziale: true,
  },
  { chiave: "protocollo", etichetta: "Protocollo di controllo", tipo: "testo" },
  {
    chiave: "presidiEsistenti",
    etichetta: "Presidi già in essere",
    tipo: "numero",
    min: 0,
    max: 50,
  },
];

/** I verbali dell'Organismo di Vigilanza: una tabella, spesso a mano. */
const COLONNE_VERBALI_ODV = [
  { chiave: "data", etichetta: "Data della seduta", tipo: "data", essenziale: true, dentroLAnno: true },
  { chiave: "oggetto", etichetta: "Oggetto", tipo: "testo", essenziale: true },
  { chiave: "presenti", etichetta: "Componenti presenti", tipo: "numero", min: 1, max: 15 },
  { chiave: "deliberazione", etichetta: "Deliberazione", tipo: "testo" },
];

/** La nomina dell'Organismo di Vigilanza: una scheda. */
const CAMPI_NOMINA_ODV = [
  { chiave: "dataNomina", etichetta: "Data della nomina", tipo: "data", essenziale: true },
  {
    chiave: "composizione",
    etichetta: "Composizione",
    tipo: "scelta",
    valori: ["monocratico", "collegiale"],
    essenziale: true,
  },
  { chiave: "durataAnni", etichetta: "Durata in carica", tipo: "numero", unita: "anni", min: 1, max: 5 },
  { chiave: "organoNominante", etichetta: "Organo che ha nominato", tipo: "testo" },
];

const TIPI_231 = [
  {
    tipo: "mappatura-rischi-231",
    famiglia: "fonte",
    forma: "tabella",
    nome: "mappatura delle attività a rischio reato",
    estrae: ["una riga per area a rischio: reato presupposto, articolo, livello, protocollo"],
    attesa: {
      nativo: "prevalente",
      scansione: "raro",
      manoscritto: "mai",
      nota: "Di solito un foglio di calcolo allegato al Modello.",
    },
    schema: schemaTabella(COLONNE_MAPPATURA_231),
    versione: "mappatura-rischi-231/1",
    campi: COLONNE_MAPPATURA_231,
    effort: "high",
  },
  {
    tipo: "verbali-odv",
    famiglia: "opera",
    forma: "tabella",
    nome: "verbale dell'Organismo di Vigilanza",
    estrae: ["una riga per seduta: data, oggetto, presenti, deliberazione"],
    attesa: {
      nativo: "frequente",
      scansione: "frequente",
      manoscritto: "frequente",
      nota: "Spesso firmato a mano e scansionato.",
    },
    schema: schemaTabella(COLONNE_VERBALI_ODV),
    versione: "verbali-odv/1",
    campi: COLONNE_VERBALI_ODV,
    effort: "high",
  },
  {
    tipo: "nomina-odv",
    famiglia: "fonte",
    forma: "scheda",
    nome: "atto di nomina dell'Organismo di Vigilanza",
    estrae: ["data, composizione, durata, organo nominante"],
    attesa: {
      nativo: "frequente",
      scansione: "frequente",
      manoscritto: "raro",
      nota: "Delibera del consiglio, spesso scansionata con le firme.",
    },
    schema: schemaScheda(CAMPI_NOMINA_ODV),
    versione: "nomina-odv/1",
    campi: CAMPI_NOMINA_ODV,
    effort: "medium",
  },
];

/* — 2. LE NORME (andrebbero in norme.ts) — */

const NORME_231 = [
  {
    codice: "D.Lgs. 231/2001",
    url: "https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:decreto.legislativo:2001-06-08;231",
    stato: "in vigore",
    dal: "8 giugno 2001",
    nota: "Non è una norma UNI: si verifica su Normattiva, non su store.uni.com.",
  },
];

/* — 3. IL MODELLO DI ELABORATO (andrebbe in elaborati.ts) — */

const MODELLO_231 = {
  chiave: "modello-231",
  ambito: "responsabilita-amministrativa",
  documento: "Modello di Organizzazione, Gestione e Controllo",
  intestazione: "Modello di Organizzazione, Gestione e Controllo (231)",
  conAnno: false,
  norme: ["D.Lgs. 231/2001"],
  sezioni: [
    {
      titolo: "Anagrafica e identificazione dell'organizzazione",
      binding: "anagrafica",
      obbligatoria: true,
    },
    {
      titolo: "Parte generale: il decreto e il sistema di responsabilità",
      stato: "impostata",
      obbligatoria: true,
      fonte: "D.Lgs. 231/2001",
      spiega:
        "Che cosa chiede il decreto e perché un modello adottato ed efficace protegge l'impresa.",
    },
    {
      titolo: "Mappatura delle attività a rischio reato",
      stato: "in-attesa",
      obbligatoria: true,
      attende: "la mappatura delle aree a rischio del {anno}",
      attendeTipi: ["mappatura-rischi-231"],
      spiega: "Dove, nel tuo modo di lavorare, un reato presupposto potrebbe accadere.",
    },
    {
      titolo: "Protocolli di controllo per area",
      stato: "in-attesa",
      obbligatoria: true,
      attende: "le procedure esistenti",
      attendeTipi: ["procedure"],
      spiega: "Le regole che rendono difficile che accada, e tracciabile se accade.",
    },
    {
      titolo: "Organismo di Vigilanza: composizione, poteri e flussi",
      stato: "in-attesa",
      obbligatoria: true,
      attende: "l'atto di nomina dell'Organismo di Vigilanza",
      attendeTipi: ["nomina-odv", "verbali-odv"],
      spiega: "Chi vigila sul modello, con quali poteri e chi gli riferisce.",
    },
    {
      titolo: "Sistema disciplinare",
      stato: "impostata",
      obbligatoria: true,
      fonte: "D.Lgs. 231/2001, art. 6 c. 2 lett. e)",
      spiega: "Le conseguenze di chi non rispetta il modello: senza, il modello non regge.",
    },
    {
      titolo: "Formazione e comunicazione del modello",
      stato: "in-attesa",
      attende: "i registri di formazione",
      attendeTipi: ["formazione"],
      spiega: "Un modello che nessuno conosce non è un modello adottato.",
    },
  ],
  daFornire: [
    {
      documento: "Mappatura delle aree a rischio reato",
      tipo: "mappatura-rischi-231",
      perche: "è l'ossatura della parte speciale del modello",
    },
    {
      documento: "Atto di nomina dell'Organismo di Vigilanza",
      tipo: "nomina-odv",
      perche: "il decreto chiede un organismo con autonomia e poteri propri",
    },
    {
      documento: "Verbali delle sedute dell'Organismo di Vigilanza",
      tipo: "verbali-odv",
      perche: "documentano che la vigilanza è reale e non solo scritta",
    },
  ],
};

const AMBITO_231 = {
  id: "responsabilita-amministrativa",
  nome: "Responsabilità amministrativa degli enti",
  descrizione:
    "Adottare e mantenere efficace il Modello 231 per proteggere l'impresa dalla responsabilità da reato.",
  tipiDocumento: [
    "mappatura-rischi-231",
    "nomina-odv",
    "verbali-odv",
    "procedure",
    "politiche",
    "organigramma",
    "formazione",
  ],
  norme: ["D.Lgs. 231/2001"],
  percorsi: ["modello-231"],
  attivo: false,
};

/* ================================================================== */
console.log("\n— l'ambito nuovo è solo un dato —\n");

verifica(
  "un ambito si dichiara con quattro elenchi e nient'altro",
  Object.keys(AMBITO_231).every((k) =>
    ["id", "nome", "descrizione", "tipiDocumento", "norme", "percorsi", "attivo"].includes(k),
  ) && AMBITO_231.tipiDocumento.length > 0,
);
verifica(
  "riusa tipi di documento che esistono già: procedure, organigramma, formazione",
  ["procedure", "organigramma", "formazione"].every((t) =>
    REGISTRO_MOTORE.some((v) => v.tipo === t),
  ),
);
verifica(
  "il registro norme regge già designazioni non UNI (SA8000), quindi regge il decreto",
  REGISTRO_NORME.some((n) => n.nota?.includes("non una norma UNI")) &&
    NORME_231[0].stato === "in vigore" &&
    Object.keys(NORME_231[0]).every((k) =>
      ["codice", "url", "stato", "dal", "ritirataIl", "sostituita", "nota"].includes(k),
    ),
);

/* ================================================================== */
console.log("\n— la PIPELINE DI ESTRAZIONE lo legge senza saperlo —\n");

const cella = (colonna, valore) => ({ colonna, valore: String(valore) });
const riga231 = (celle, extra = {}) => ({
  celle,
  confidenza: 0.9,
  pagina: 1,
  estrattoDa: "riga della mappatura",
  fonteLettura: "testo",
  nota: "",
  ...extra,
});
const rispostaTabella = (righe) => ({
  tipoRilevato: "atteso",
  tipoEffettivo: "",
  qualita: "leggibile",
  righe,
  avvertenze: [],
});

const VOCE_MAPPATURA = TIPI_231[0];
const CTX = { annoRendicontazione: 2025, nativo: true };

const mappatura = interpretaRisposta(
  rispostaTabella([
    riga231([
      cella("area", "Acquisti e gare"),
      cella("reatoPresupposto", "Corruzione tra privati"),
      cella("articolo", "25-ter"),
      cella("livelloRischio", "alto"),
      cella("protocollo", "PRO-07 Selezione fornitori"),
      cella("presidiEsistenti", "3"),
    ]),
    riga231([
      cella("area", "Sicurezza sul lavoro"),
      cella("reatoPresupposto", "Lesioni colpose gravi"),
      cella("articolo", "25-septies"),
      cella("livelloRischio", "medio"),
      cella("presidiEsistenti", "5"),
    ]),
  ]),
  VOCE_MAPPATURA,
  CTX,
);

verifica(
  "l'estrazione di un tipo di un ambito sconosciuto funziona",
  mappatura.esito === "ok",
  mappatura.esito,
);
verifica("con le sue due righe", mappatura.righe.length === 2);
verifica(
  "le colonne tornano nell'ordine dichiarato",
  mappatura.righe[0].celle.map((c) => c.chiave).join(",") ===
    COLONNE_MAPPATURA_231.map((c) => c.chiave).join(","),
);
verifica(
  "e ogni riga porta la sua provenienza, come per ogni altro documento",
  mappatura.righe.every((r) => r.pagina === 1 && r.estrattoDa),
);

/* — I vincoli dichiarati funzionano senza una riga di codice nuova — */
const articoloStorto = interpretaRisposta(
  rispostaTabella([
    riga231([
      cella("area", "Amministrazione"),
      cella("reatoPresupposto", "False comunicazioni sociali"),
      cella("articolo", "venticinque ter"),
      cella("livelloRischio", "alto"),
    ]),
  ]),
  VOCE_MAPPATURA,
  CTX,
);
verifica(
  "un articolo malformato viene segnalato dal VINCOLO DICHIARATO, non da codice",
  articoloStorto.righe[0].avvisi.some((a) => a.includes("articolo del decreto")),
  articoloStorto.righe[0].avvisi.join(" | "),
);

const troppiPresidi = interpretaRisposta(
  rispostaTabella([
    riga231([
      cella("area", "Acquisti"),
      cella("reatoPresupposto", "Corruzione"),
      cella("livelloRischio", "alto"),
      cella("presidiEsistenti", "900"),
    ]),
  ]),
  VOCE_MAPPATURA,
  CTX,
);
verifica(
  "un numero fuori scala viene colto dal massimo dichiarato",
  troppiPresidi.righe[0].avvisi.some((a) => a.includes("massimo")),
);

/* — Il manoscritto vale anche qui, e non è negoziabile — */
const verbaleAMano = interpretaRisposta(
  rispostaTabella([
    riga231(
      [
        cella("data", "2025-06-18"),
        cella("oggetto", "Verifica flussi informativi"),
        cella("presenti", "3"),
      ],
      { fonteLettura: "manoscritto", confidenza: 1 },
    ),
  ]),
  TIPI_231[1],
  CTX,
);
verifica(
  "una riga manoscritta di un ambito nuovo resta sotto il tetto di 0,6",
  verbaleAMano.righe[0].confidenza <= 0.6,
  String(verbaleAMano.righe[0].confidenza),
);

/* — Le schede: stessa storia — */
const nomina = interpretaRisposta(
  {
    tipoRilevato: "atteso",
    tipoEffettivo: "",
    qualita: "leggibile",
    campi: [
      { nome: "dataNomina", valore: "2024-11-12", confidenza: 0.95, pagina: 1, estrattoDa: "12/11/2024", fonteLettura: "testo", nota: "" },
      { nome: "composizione", valore: "collegiale", confidenza: 0.9, pagina: 1, estrattoDa: "collegiale", fonteLettura: "testo", nota: "" },
      { nome: "durataAnni", valore: "3", confidenza: 0.9, pagina: 1, estrattoDa: "tre anni", fonteLettura: "testo", nota: "" },
    ],
    avvertenze: [],
  },
  TIPI_231[2],
  CTX,
);
verifica("anche una scheda di un ambito nuovo si legge", nomina.esito === "ok", nomina.esito);
verifica(
  "e la data viene canonicalizzata come per tutti",
  nomina.campi.find((c) => c.chiave === "dataNomina").valore === "2024-11-12",
);

/* — Le istruzioni si compongono da sole — */
const testo231 = istruzioni(VOCE_MAPPATURA, CTX);
verifica(
  "le istruzioni al modello si compongono dai campi dichiarati",
  COLONNE_MAPPATURA_231.every((c) => testo231.includes(c.chiave)) &&
    testo231.includes("mappatura delle attività a rischio reato"),
);
verifica(
  "compresi i valori ammessi delle scelte",
  testo231.includes("alto, medio, basso"),
);

/* ================================================================== */
console.log("\n— la BOZZA si compone dal modello —\n");

const ORG = {
  ragione_sociale: "Officina Lombardi S.r.l.",
  partita_iva: "00743110157",
  anno_rendicontazione: 2025,
};

const bozza231 = bozzaDaModello(MODELLO_231, ORG, {});
verifica(
  "la bozza di un elaborato mai visto si compone senza codice nuovo",
  bozza231.sezioni.length === MODELLO_231.sezioni.length,
  `${bozza231.sezioni.length} sezioni`,
);
verifica(
  "il binding «anagrafica» funziona anche qui: la prima sezione è popolata",
  bozza231.sezioni[0].stato === "popolata" &&
    bozza231.sezioni[0].righe?.length >= 3,
);
verifica(
  "i segnaposto si sciolgono sull'anno del cliente",
  bozza231.sezioni.some((s) => s.attende?.includes("2025")),
);
verifica(
  "le sezioni in attesa dichiarano quali documenti aspettano",
  bozza231.sezioni.some((s) => s.attendeTipi?.includes("mappatura-rischi-231")),
);
verifica(
  "il completamento si calcola come per ogni altro elaborato",
  completamentoBozza(bozza231) > 0 && completamentoBozza(bozza231) < 100,
  String(completamentoBozza(bozza231)),
);
verifica(
  "i documenti da fornire arrivano dal modello",
  bozza231.daFornire.length === 3,
);

/* ================================================================== */
console.log("\n— il CONTROLLO DI CONFORMITÀ non conosce i domini —\n");

const tutteLeSezioni = MODELLO_231.sezioni.map((s) => ({
  titolo: s.titolo,
  piena: true,
}));

verifica(
  "con tutte le sezioni piene il documento è conforme",
  controllaConformita(MODELLO_231, { sezioni: tutteLeSezioni }).conforme,
);

const senzaOdv = tutteLeSezioni.filter(
  (s) => !s.titolo.startsWith("Organismo di Vigilanza"),
);
const mancante = controllaConformita(MODELLO_231, { sezioni: senzaOdv });
verifica(
  "senza l'Organismo di Vigilanza NON è conforme, e lo dice",
  !mancante.conforme && mancante.mancanze[0].includes("Organismo di Vigilanza"),
  mancante.mancanze.join(" | "),
);

const vuota = tutteLeSezioni.map((s) =>
  s.titolo === "Sistema disciplinare" ? { ...s, piena: false } : s,
);
verifica(
  "una sezione obbligatoria vuota blocca la consegna",
  !controllaConformita(MODELLO_231, { sezioni: vuota }).conforme,
);

const conRitirata = controllaConformita(MODELLO_231, {
  sezioni: tutteLeSezioni,
  normeRitirate: ["D.Lgs. 231/2001 (edizione fittizia)"],
});
verifica(
  "una norma ritirata citata blocca la consegna",
  !conRitirata.conforme && conRitirata.mancanze[0].includes("ritirata"),
);

const senzaFonte = controllaConformita(MODELLO_231, {
  sezioni: tutteLeSezioni,
  valoriSenzaFonte: ["numero di sedute dell'OdV"],
});
verifica(
  "un valore senza fonte confermata blocca la consegna",
  !senzaFonte.conforme && senzaFonte.mancanze[0].includes("fonte tracciata"),
);

/* ================================================================== */
console.log("\n— e gli ambiti di oggi restano coerenti —\n");

verifica(
  "ogni percorso di ogni ambito ha un ambito solo",
  AMBITI.every((a) =>
    a.percorsi.every((p) => ambitoDiPercorso(p)?.id === a.id),
  ),
);
verifica(
  "ogni modello di elaborato appartiene a un ambito dichiarato",
  tuttiIModelli().every((m) => AMBITI.some((a) => a.id === m.ambito)),
);
verifica(
  "ogni tipo di documento di un ambito esiste nel registro del Motore",
  AMBITI.every((a) =>
    a.tipiDocumento.every((t) => REGISTRO_MOTORE.some((v) => v.tipo === t)),
  ),
);
verifica(
  "ogni norma dichiarata da un ambito esiste nel registro norme",
  AMBITI.every((a) =>
    a.norme.every((n) => REGISTRO_NORME.some((r) => r.codice === n)),
  ),
);
verifica(
  "ogni norma citata da un modello esiste nel registro norme ed è in vigore",
  tuttiIModelli().every((m) =>
    (m.norme ?? []).every((n) =>
      REGISTRO_NORME.some((r) => r.codice === n && r.stato === "in vigore"),
    ),
  ),
);
verifica(
  "un tipo condiviso serve più ambiti senza appartenere a nessuno",
  ambitiCheUsano("organico").length >= 2,
  ambitiCheUsano("organico").map((a) => a.id).join(", "),
);

/* ================================================================== */
console.log("\n— il verdetto —\n");

verifica(
  "AGGIUNGERE UN AMBITO NON HA RICHIESTO NESSUNA MODIFICA ALLA PIPELINE",
  // Se qualcosa qui sopra fosse fallito, sarebbe stato perché la
  // pipeline ha bisogno di sapere di che dominio si tratta. Nessun
  // fallimento significa che non gliene importa nulla — che è il punto.
  falliti === 0,
  `${falliti} prove fallite`,
);

console.log(
  `\nRisultato: ${superati}/${superati + falliti} test superati${falliti ? ` — ${falliti} FALLITI` : ""}\n`,
);
process.exit(falliti === 0 ? 0 : 1);
