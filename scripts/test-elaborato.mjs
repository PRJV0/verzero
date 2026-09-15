/**
 * LA GENERAZIONE DELL'ELABORATO — le prove.
 *
 *   node --import ./scripts/risolutore-ts.mjs scripts/test-elaborato.mjs
 *
 * Il documento consegnato è la cosa che il cliente porta in banca e in
 * audit. Queste prove non verificano che «esca un PDF»: verificano le
 * proprietà per cui quel PDF regge una verifica.
 *
 *   1. il controllo di consegna BLOCCA — dato non confermato, mese
 *      scoperto, bolletta doppia, norma ritirata o non registrata,
 *      segnaposto, sezione non componibile, valore senza fonte, fonte non
 *      confermata anche a monte di un calcolo, versione superata, esercizio
 *      incoerente — e dice a chi tocca rimediare;
 *   2. nessun dato non confermato entra nel documento, nemmeno per sbaglio;
 *   3. i numeri tornano rifatti a mano, fattore per fattore;
 *   4. niente si indovina: un «11.840» scritto a mano o una data «06/03/2025»
 *      fermano il documento invece di cambiargli i totali, e ogni blocco ha
 *      un rimedio — anche quelli che nessun documento può sciogliere, con
 *      una dichiarazione dell'organizzazione;
 *   5. la sigla dice chi ha scritto il numero: letto, riscritto, ricavato;
 *   6. la veste verifica colore e logo prima di usarli, e il logo non
 *      costa gigabyte di memoria;
 *   7. l'impronta cambia quando deve e solo quando deve;
 *   8. PDF e DOCX escono dallo stesso contenuto, e l'anteprima no;
 *   9. un ambito nuovo compone il suo documento dichiarando solo il modello.
 */

import { readFileSync } from "node:fs";

import sharp from "sharp";

import { randomBytes } from "node:crypto";
import { crc32, deflateSync } from "node:zlib";

import {
  CAMPI_DOCUMENTO_ESEMPIO,
  CAMPI_IMPRESA_ESEMPIO,
  DOCUMENTI_ESEMPIO,
  ingressoEsempio,
  ORG_ESEMPIO,
  POD_ESEMPIO,
} from "./esempio-elaborato.mjs";

const { MODELLI_ELABORATO, modelloElaborato, tuttiIModelli } = await import("../src/lib/elaborati.ts");
const { REGISTRO_NORME } = await import("../src/lib/norme.ts");
const { componiElaborato } = await import("../src/lib/elaborato/componi.ts");
const { verificaConsegna, FORMA_DESIGNAZIONE, tuttiIValori } = await import("../src/lib/elaborato/consegna.ts");
const { testoCompleto } = await import("../src/lib/elaborato/contenuto.ts");
const { improntaElaborato } = await import("../src/lib/elaborato/impronta.ts");
const { pdfElaborato, pdfAnteprima } = await import("../src/lib/elaborato/pdf.ts");
const { docxElaborato } = await import("../src/lib/elaborato/docx.ts");
const veste = await import("../src/lib/elaborato/veste.ts");
const { preparaLogo } = await import("../src/lib/elaborato/logo.ts");
const { contrasto } = await import("../src/lib/contrasto.ts");
const ghg = await import("../src/lib/calc/ghg.ts");
const { FATTORI_EMISSIONE, fattorePer } = await import("../src/lib/calc/fattori.ts");
const { decidiRigenerazione } = await import("../src/lib/motore/riuso.ts");
const { numeroCanonico } = await import("../src/lib/elaborato/compositori.ts");
const dich = await import("../src/lib/elaborato/dichiarazioni.ts");
const { valoreCorretto } = await import("../src/lib/motore/plausibilita.ts");
const { AVVISO_SCRITTO_DA_TE } = await import("../src/lib/motore/portale.ts");

let superati = 0;
let falliti = 0;
function verifica(nome, esito, dettaglio = "") {
  if (esito) {
    superati++;
    console.log(`✅ ${nome}`);
  } else {
    falliti++;
    console.log(`❌ ${nome}${dettaglio ? ` — ${dettaglio}` : ""}`);
  }
}
const vicino = (a, b, tolleranza = 1e-6) => Math.abs(a - b) <= tolleranza * Math.max(1, Math.abs(b));
const clona = (x) => structuredClone(x);

const CARBON = modelloElaborato("carbon-footprint", 2025);

function componiEControlla(ingresso, modello = ingresso.modello) {
  const composizione = componiElaborato(ingresso);
  const esito = verificaConsegna(composizione.elaborato, {
    modello,
    opzioni: ingresso.opzioni,
    mancanzeComposizione: composizione.mancanze,
    esercizio: ingresso.organizzazione.anno_rendicontazione,
  });
  return { ...composizione, esito };
}

/* ══════════════════════════════════════════════════════════════════ */
console.log("\n— IL DOCUMENTO D'ESEMPIO SI CONSEGNA —\n");

const base = componiEControlla(ingressoEsempio(CARBON));
const e = base.elaborato;
verifica(
  "★ con tutti i dati confermati l'Inventario GHG 2025 passa il controllo di consegna",
  base.esito.consegnabile,
  base.esito.mancanze?.map((m) => m.messaggio).join(" | "),
);
verifica("la copertina dichiara titolo, impresa, esercizio e versione dello standard",
  e.frontespizio.titolo === "Inventario GHG 2025" &&
    e.frontespizio.organizzazione === "Officina Lombardi S.r.l." &&
    e.frontespizio.esercizio === 2025 &&
    e.frontespizio.costruitoSu === "UNI EN ISO 14064-1:2019",
);
verifica("il codice del documento ha sigla, esercizio, impresa e revisione", /^GHG-2025-[0-9A-F]{6}-R0$/.test(e.frontespizio.codice), e.frontespizio.codice);
verifica("le sezioni sono quelle del modello per il taglio, nell'ordine del modello (Scope 3 esclusa)",
  JSON.stringify(e.sezioni.map((s) => s.titolo)) ===
    JSON.stringify(CARBON.sezioni.filter((s) => !s.soloSe).map((s) => s.titolo)),
);
verifica("ogni sezione è piena", e.sezioni.every((s) => s.piena), e.sezioni.filter((s) => !s.piena).map((s) => s.titolo).join(", "));

const valori = tuttiIValori(e);
const perId = new Map(e.fonti.map((f) => [f.id, f]));
verifica("★ ogni dato del documento porta una sigla che esiste nel registro delle fonti",
  valori.length > 100 && valori.every((v) => v.fonte && perId.has(v.fonte)),
  `${valori.filter((v) => !v.fonte || !perId.has(v.fonte)).length} senza fonte su ${valori.length}`,
);
const perTipo = e.fonti.reduce((t, f) => ({ ...t, [f.tipo]: (t[f.tipo] ?? 0) + 1 }), {});
verifica("tre provenienze e i dati inseriti: 22 documenti, 7 banche dati, calcoli e dati inseriti",
  perTipo.documento === 22 && perTipo["banca-dati"] === 7 && perTipo.calcolato >= 10 && perTipo.inserito === 3,
  JSON.stringify(perTipo),
);
verifica("le sigle sono uniche e numerate senza buchi per tipo",
  ["D", "B", "C", "I"].every((l) => {
    const n = e.fonti.filter((f) => f.id.startsWith(l)).map((f) => Number(f.id.slice(1))).sort((a, b) => a - b);
    return n.every((x, i) => x === i + 1);
  }),
);
verifica("ogni calcolo dichiara da quali fonti parte, e sono fonti che esistono",
  e.fonti.filter((f) => f.tipo === "calcolato").every((f) => f.ingressi?.length > 0 && f.ingressi.every((i) => perId.has(i))),
);
verifica("ogni fonte-documento dice file, pagine e data di conferma",
  e.fonti.filter((f) => f.tipo === "documento").every((f) => f.dettaglio.some((d) => d.startsWith("File «")) && f.dettaglio.some((d) => /^Pagin/.test(d)) && f.confermataIl),
);
verifica("ogni fattore di emissione è citato con pubblicazione, tabella e indirizzo ufficiale",
  e.fonti.filter((f) => f.tipo === "banca-dati" && /ISPRA|AIB|Ministero|DESNZ/.test(f.titolo)).every((f) => f.url?.startsWith("https://") && f.dettaglio.some((d) => /Tabella|Foglio|fattore/i.test(d))),
);
verifica("nessun segnaposto resta nel testo", !testoCompleto(e).some((t) => /\{[a-zA-Z]+\}/.test(t)));
verifica("i riferimenti normativi vengono dal registro, con stato ed edizione",
  e.riferimenti.find((r) => r.designazione === "UNI EN ISO 14064-1:2019")?.stato === "in vigore" &&
    e.riferimenti.find((r) => r.designazione === "UNI EN ISO 14064-1:2019")?.titolo?.startsWith("Gas ad effetto serra") &&
    e.riferimenti.filter((r) => r.designazione.startsWith("GHG Protocol")).length === 2,
);
verifica("il registro delle revisioni contiene la revisione corrente", e.revisioni.length === 1 && e.revisioni[0].motivo === "Prima emissione");
verifica("la validazione è dichiarata in attesa, non stampata vuota", e.validazione.stato === "in_attesa" && e.testi.validazioneInAttesa.length > 40);
verifica("il documento d'esempio si dichiara tale", e.esempio === true);
verifica("il DOCX non è fra i formati di un inventario", JSON.stringify(e.formati) === JSON.stringify(["pdf"]));

const lessico = /\bfirm(a|e|i|o|ano|ato|ata|ati|ate|are|ando|atario|atari)?\b/i;
verifica("★ il testo generato non dice mai che i professionisti «firmano»", !testoCompleto(e).some((t) => lessico.test(t)));
verifica("le designazioni del testo sono tutte registrate e in vigore",
  testoCompleto(e).every((t) => [...t.matchAll(FORMA_DESIGNAZIONE)].every((m) => REGISTRO_NORME.some((n) => n.codice === m[0] && n.stato === "in vigore"))),
);

/* ══════════════════════════════════════════════════════════════════ */
console.log("\n— I NUMERI, RIFATTI A MANO —\n");

const giorni = (dal, al) => (Date.parse(`${al}T00:00:00Z`) - Date.parse(`${dal}T00:00:00Z`)) / 86400000 + 1;
const dentro = (dal, al) => {
  const d = Math.max(Date.parse(`${dal}T00:00:00Z`), Date.parse("2025-01-01T00:00:00Z"));
  const a = Math.min(Date.parse(`${al}T00:00:00Z`), Date.parse("2025-12-31T00:00:00Z"));
  return a >= d ? (a - d) / 86400000 + 1 : 0;
};
const campo = (doc, nome) => CAMPI_DOCUMENTO_ESEMPIO.find((c) => c.document_id === doc && c.campo === nome && c.riga === 0)?.valore;
let kwh = 0, kwhRinnovabili = 0, smc = 0;
for (const d of DOCUMENTI_ESEMPIO) {
  if (d.tipo === "bolletta-elettrica") {
    const q = Number(campo(d.id, "consumoTotaleKwh")) * dentro(campo(d.id, "periodoInizio"), campo(d.id, "periodoFine")) / giorni(campo(d.id, "periodoInizio"), campo(d.id, "periodoFine"));
    kwh += q;
    if (campo(d.id, "energiaRinnovabile") === "si") kwhRinnovabili += q;
  }
  if (d.tipo === "bolletta-gas") {
    smc += Number(campo(d.id, "consumoSmc")) * dentro(campo(d.id, "periodoInizio"), campo(d.id, "periodoFine")) / giorni(campo(d.id, "periodoInizio"), campo(d.id, "periodoFine"));
  }
}
const litri = { gasolio: 0, benzina: 0 };
const righe = new Map();
for (const c of CAMPI_DOCUMENTO_ESEMPIO.filter((c) => c.riga > 0)) righe.set(c.riga, { ...(righe.get(c.riga) ?? {}), [c.campo]: c.valore });
for (const r of righe.values()) litri[r.tipoCarburante] += Number(r.litri);

const f = (id) => FATTORI_EMISSIONE.find((x) => x.id === id).valore;
const lb = kwh * f("ispra-consumi-2025");
const mb = (kwh - kwhRinnovabili) * f("aib-residuale-2025");
const s1 = smc * f("mase-gas-2022-2024") + litri.gasolio * f("desnz-gasolio-2025") + litri.benzina * f("desnz-benzina-2025");
const cifre = e.sezioni.at(-1).blocchi.find((b) => b.tipo === "cifre").voci;
verifica("★ totale location-based = Scope 1 + kWh attribuiti × fattore ISPRA", vicino(cifre[0].valore.numero, s1 + lb), `${cifre[0].valore.numero} vs ${s1 + lb}`);
verifica("★ totale market-based = Scope 1 + kWh non rinnovabili × mix residuale AIB", vicino(cifre[1].valore.numero, s1 + mb), `${cifre[1].valore.numero} vs ${s1 + mb}`);
verifica("l'intensità per addetto divide il totale location-based per i 18 addetti confermati", vicino(cifre[2].valore.numero, (s1 + lb) / 18));
verifica("i totali si presentano arrotondati solo nel testo: il numero resta pieno", cifre[0].valore.testo === `${((s1 + lb) / 1000).toLocaleString("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2, useGrouping: "always" })} t CO₂e`);

verifica("una bolletta dal 16 dicembre al 15 gennaio pesa sull'anno nuovo per 15 giorni su 31",
  (() => { const q = ghg.quotaNellEsercizio({ dal: "2024-12-16", al: "2025-01-15" }, 2025); return q.giorniPeriodo === 31 && q.giorniNellEsercizio === 15; })(),
);
const mesi = (salta = -1) => Array.from({ length: 12 }, (_, i) => i).filter((i) => i !== salta).map((i) => ({
  dal: `2025-${String(i + 1).padStart(2, "0")}-01`,
  al: new Date(Date.UTC(2025, i + 1, 0)).toISOString().slice(0, 10),
}));
verifica("dodici bollette contigue coprono l'esercizio senza buchi né doppioni",
  (() => { const c = ghg.copertura(mesi(), 2025); return c.scoperti.length === 0 && c.sovrapposti.length === 0; })(),
);
verifica("senza la bolletta di marzo, lo scoperto è esattamente marzo",
  (() => { const c = ghg.copertura(mesi(2), 2025); return c.scoperti.length === 1 && c.scoperti[0].dal === "2025-03-01" && c.scoperti[0].al === "2025-03-31"; })(),
);
verifica("la stessa bolletta due volte è un doppione",
  ghg.copertura([...mesi(), mesi()[4]], 2025).sovrapposti.length === 1,
);
verifica("tre giorni di scarto fra due bollette sono una convenzione, non un buco",
  ghg.copertura([{ dal: "2025-01-01", al: "2025-06-27" }, { dal: "2025-07-01", al: "2025-12-31" }], 2025).scoperti.length === 0,
);
verifica("la fornitura «non dichiarata» pesa come non rinnovabile nel market-based",
  (() => {
    const r = ghg.scope2([{ punto: "P", periodo: { dal: "2025-01-01", al: "2025-12-31" }, quantita: 1000, rinnovabile: "non-dichiarato", rif: "x" }], 2025, { location: { id: "l", valore: 0.2, unita: "kWh" }, mercato: { id: "m", valore: 0.4, unita: "kWh" } });
    return vicino(r.mercato, 400) && vicino(r.location, 200);
  })(),
);
verifica("un rifornimento fuori esercizio non si conta, un carburante senza fattore non si stima",
  (() => {
    const r = ghg.carburanti([
      { data: "2025-03-01", carburante: "gasolio", mezzo: null, litri: 50, rif: "a" },
      { data: "2024-12-30", carburante: "gasolio", mezzo: null, litri: 70, rif: "b" },
      { data: "2025-04-01", carburante: "metano", mezzo: null, litri: 10, rif: "c" },
    ], 2025, (c) => (c === "gasolio" ? { id: "g", valore: 2, unita: "l" } : undefined));
    return r.fuori.length === 1 && r.senzaFattore[0]?.carburante === "metano" && vicino(r.emissioni, 100);
  })(),
);

/* ══════════════════════════════════════════════════════════════════ */
console.log("\n— IL REGISTRO DEI FATTORI —\n");

verifica("ogni fattore ha fonte ufficiale con indirizzo, tabella e data di pubblicazione",
  FATTORI_EMISSIONE.every((x) => x.valore > 0 && x.fonte.url.startsWith("https://") && x.fonte.dove && x.fonte.pubblicataIl && x.comeNellaFonte),
);
verifica("un solo fattore per vettore ed esercizio", new Set(FATTORI_EMISSIONE.map((x) => `${x.vettore}|${x.esercizio}`)).size === FATTORI_EMISSIONE.length);
verifica("gli identificativi dei fattori sono unici", new Set(FATTORI_EMISSIONE.map((x) => x.id)).size === FATTORI_EMISSIONE.length);
verifica("il valore in kg corrisponde a quello scritto nella fonte",
  FATTORI_EMISSIONE.every((x) => {
    const n = Number(x.comeNellaFonte.replace(/\./g, "").replace(",", ".").match(/[\d.]+/)[0]);
    const scala = /^.*\bg CO/.test(x.comeNellaFonte) ? 1000 : /t CO₂\/1000/.test(x.comeNellaFonte) ? 1 : 1;
    return vicino(x.valore, n / scala, 1e-9);
  }),
);
verifica("per l'esercizio 2025 si usa il dato ISPRA del 2025", fattorePer("energia-elettrica-rete", 2025)?.fattore.id === "ispra-consumi-2025");
verifica("per il 2026, finché non c'è, si usa l'ultimo disponibile e lo si dichiara", fattorePer("energia-elettrica-rete", 2026)?.scarto === 1);
verifica("★ mai un fattore di un anno successivo all'esercizio", fattorePer("energia-elettrica-rete", 2023) === undefined && fattorePer("gasolio", 2024) === undefined);
verifica("oltre due anni di scarto il fattore è troppo vecchio per usarlo", fattorePer("gas-naturale", 2028) === undefined);

/* ══════════════════════════════════════════════════════════════════ */
console.log("\n— IL CONTROLLO DI CONSEGNA BLOCCA —\n");

const tipi = (esito) => (esito.mancanze ?? []).map((m) => m.tipo);
const conCampi = (modifica) => {
  const ingresso = ingressoEsempio(CARBON);
  return { ...ingresso, campiDocumento: modifica(clona(CAMPI_DOCUMENTO_ESEMPIO)) };
};

// 1. Un valore letto e non confermato.
const primaBolletta = DOCUMENTI_ESEMPIO.find((d) => d.tipo === "bolletta-elettrica" && d.nome_file.includes("marzo")).id;
const nonConfermato = componiEControlla(conCampi((cc) => cc.map((c) => (c.document_id === primaBolletta && c.campo === "consumoTotaleKwh" ? { ...c, stato: "da_confermare", confirmed_at: null } : c))));
verifica("★ un consumo letto e non confermato blocca la consegna", !nonConfermato.esito.consegnabile && tipi(nonConfermato.esito).includes("dato-da-confermare"));
const mancanzaConferma = nonConfermato.esito.mancanze.find((m) => m.tipo === "dato-da-confermare");
verifica("e dice all'impresa dove confermarlo, con il link al documento", mancanzaConferma?.chi === "impresa" && mancanzaConferma?.azione?.href === `/dashboard/documenti/${primaBolletta}`);
const kwhMarzo = Number(CAMPI_DOCUMENTO_ESEMPIO.find((c) => c.document_id === primaBolletta && c.campo === "consumoTotaleKwh").valore).toLocaleString("it-IT", { useGrouping: "always" });
verifica("★ il valore non confermato NON compare da nessuna parte nel documento composto", !testoCompleto(nonConfermato.elaborato).some((t) => t.includes(`${kwhMarzo} kWh`)), kwhMarzo);
verifica("e la bolletta senza conferma lascia scoperto il suo periodo, detto a parte", tipi(nonConfermato.esito).includes("periodo-scoperto"));

// 2. Un mese mancante.
const senzaMese = { ...ingressoEsempio(CARBON), documenti: DOCUMENTI_ESEMPIO.filter((d) => d.id !== primaBolletta) };
const esitoSenzaMese = componiEControlla(senzaMese);
verifica("★ una bolletta mancante blocca con il periodo scoperto per esteso", !esitoSenzaMese.esito.consegnabile && esitoSenzaMese.esito.mancanze.some((m) => m.tipo === "periodo-scoperto" && m.messaggio.includes(POD_ESEMPIO) && /16 febbraio 2025/.test(m.messaggio)));

// 3. Una bolletta doppia.
const doppia = clona(DOCUMENTI_ESEMPIO.find((d) => d.id === primaBolletta));
doppia.id = "e0000000-0000-4000-8000-999999999999";
const campiDoppia = CAMPI_DOCUMENTO_ESEMPIO.filter((c) => c.document_id === primaBolletta).map((c) => ({ ...c, document_id: doppia.id }));
const esitoDoppia = componiEControlla({ ...ingressoEsempio(CARBON), documenti: [...DOCUMENTI_ESEMPIO, doppia], campiDocumento: [...CAMPI_DOCUMENTO_ESEMPIO, ...campiDoppia] });
verifica("★ la stessa bolletta caricata due volte blocca: il consumo conterebbe due volte", !esitoDoppia.esito.consegnabile && tipi(esitoDoppia.esito).includes("periodo-sovrapposto"));
const doppiaScartata = componiEControlla({
  ...ingressoEsempio(CARBON),
  documenti: [...DOCUMENTI_ESEMPIO, doppia],
  campiDocumento: [
    ...CAMPI_DOCUMENTO_ESEMPIO,
    ...campiDoppia.map((c) => (["periodoInizio", "periodoFine", "consumoTotaleKwh"].includes(c.campo) ? { ...c, stato: "rifiutato", confirmed_at: null } : c)),
  ],
});
verifica("★ il rimedio proposto per la bolletta doppia funziona: rifiutati periodo e consumo, il documento si consegna",
  esitoDoppia.esito.mancanze.find((m) => m.tipo === "periodo-sovrapposto")?.rimedio.includes("rifiutane periodo e consumo") && doppiaScartata.esito.consegnabile,
  doppiaScartata.esito.mancanze?.map((m) => m.messaggio).join(" | "),
);

// 4. Una norma ritirata nel modello.
const conRitirata = { ...CARBON, norme: ["UNI EN ISO 14001:2015+A1:2024"] };
const esitoRitirata = componiEControlla(ingressoEsempio(conRitirata), conRitirata);
verifica("★ una norma ritirata citata dal modello blocca, e tocca a noi", esitoRitirata.esito.mancanze?.some((m) => m.tipo === "norma-ritirata" && m.chi === "verzero"));

// 5. Una designazione scritta a mano e non registrata.
const conSconosciuta = clona(CARBON);
conSconosciuta.sezioni[2].componi.unshift({ testo: "Si applica anche la UNI EN ISO 50001:2018." });
const esitoSconosciuta = componiEControlla(ingressoEsempio(conSconosciuta), conSconosciuta);
verifica("★ una designazione nel testo che non è nel registro blocca", tipi(esitoSconosciuta.esito).includes("norma-non-registrata"));

// 6. Un segnaposto non sciolto.
const conSegnaposto = clona(CARBON);
conSegnaposto.sezioni[0].componi.unshift({ testo: "Valore: {inesistente}." });
verifica("un segnaposto rimasto nel testo blocca", tipi(componiEControlla(ingressoEsempio(conSegnaposto), conSegnaposto).esito).includes("segnaposto"));

// 7. Una sezione senza composizione.
const vsme = modelloElaborato("bilancio-vsme", 2025);
const esitoVsme = componiEControlla({ ...ingressoEsempio(vsme), percorso: "bilancio-sostenibilita-vsme-base" }, vsme);
verifica("★ una sezione che la piattaforma non sa ancora comporre blocca, e non si finge piena",
  !esitoVsme.esito.consegnabile && esitoVsme.esito.mancanze.some((m) => m.tipo === "composizione-non-disponibile" && m.chi === "verzero"),
);

// 8–10. Il controllo non si fida della composizione.
const manomesso = clona(e);
manomesso.sezioni[3].blocchi.find((b) => b.tipo === "tabella").righe[0][1] = { testo: "999 Smc" };
verifica("★ un valore senza fonte infilato nel documento blocca", tipi(verificaConsegna(manomesso, { modello: CARBON, opzioni: [], mancanzeComposizione: [], esercizio: 2025 })).includes("valore-senza-fonte"));
const nonConfermata = clona(e);
nonConfermata.fonti.find((x) => x.tipo === "documento").confermata = false;
verifica("una fonte non confermata blocca", tipi(verificaConsegna(nonConfermata, { modello: CARBON, opzioni: [], mancanzeComposizione: [], esercizio: 2025 })).includes("fonte-non-confermata"));
const aMonte = clona(e);
const calcolo = aMonte.fonti.find((x) => x.tipo === "calcolato" && x.titolo.startsWith("Totali"));
const radice = aMonte.fonti.find((x) => x.id === aMonte.fonti.find((y) => y.id === calcolo.ingressi[0]).ingressi[0]);
radice.confermata = false;
const esitoAMonte = verificaConsegna(aMonte, { modello: CARBON, opzioni: [], mancanzeComposizione: [], esercizio: 2025 });
verifica("★ un totale è confermato solo se lo sono tutte le fonti da cui discende, fino in fondo",
  esitoAMonte.mancanze.some((m) => m.tipo === "fonte-non-confermata"),
);
verifica("e la mancanza nomina la fonte da confermare davvero, non il totale che ne discende",
  esitoAMonte.mancanze.some((m) => m.tipo === "fonte-non-confermata" && m.messaggio.includes(`${radice.id} `)) &&
    !esitoAMonte.mancanze.some((m) => m.tipo === "fonte-non-confermata" && m.messaggio.includes(`${calcolo.id} `)),
);
const senzaIngressi = clona(e);
const calcoloVuoto = senzaIngressi.fonti.find((x) => x.tipo === "calcolato" && x.titolo.startsWith("Totali"));
calcoloVuoto.ingressi = [];
const esitoSenzaIngressi = verificaConsegna(senzaIngressi, { modello: CARBON, opzioni: [], mancanzeComposizione: [], esercizio: 2025 });
verifica("★ un calcolo che non dichiara da dove parte è un difetto nostro, non una conferma chiesta al cliente",
  esitoSenzaIngressi.mancanze.some((m) => m.tipo === "valore-senza-fonte" && m.chi === "verzero" && m.messaggio.includes(calcoloVuoto.id)) &&
    !esitoSenzaIngressi.mancanze.some((m) => m.tipo === "fonte-non-confermata"),
);
const conValidatore = clona(e);
conValidatore.validazione = { stato: "validata", professionista: "Dott.ssa {nome}", qualifica: "Revisore", il: "2026-09-15", rilievi: [] };
verifica("anche il nome di chi valida passa dal controllo del testo: un segnaposto lì blocca",
  tipi(verificaConsegna(conValidatore, { modello: CARBON, opzioni: [], mancanzeComposizione: [], esercizio: 2025 })).includes("segnaposto"),
);

// 11. La versione dello standard.
const vecchioVsme = MODELLI_ELABORATO.find((m) => m.chiave === "bilancio-vsme");
const superato = { ...vecchioVsme, versione: "efrag-2024" };
const esitoSuperato = verificaConsegna(e, { modello: superato, opzioni: [], mancanzeComposizione: [], esercizio: 2025 });
verifica("una struttura costruita su una versione superata per l'esercizio blocca", tipi(esitoSuperato).includes("versione-superata"));

// 12–13. L'esercizio.
const altroAnno = clona(e);
altroAnno.frontespizio.esercizio = 2024;
verifica("una copertina con un esercizio diverso da quello dell'impresa blocca", tipi(verificaConsegna(altroAnno, { modello: CARBON, opzioni: [], mancanzeComposizione: [], esercizio: 2025 })).includes("fuori-esercizio"));
const fonteVecchia = clona(e);
fonteVecchia.fonti.find((x) => x.periodo).periodo = { dal: "2023-01-01", al: "2023-01-31" };
verifica("un documento di origine di un altro anno usato nel documento blocca", tipi(verificaConsegna(fonteVecchia, { modello: CARBON, opzioni: [], mancanzeComposizione: [], esercizio: 2025 })).includes("fuori-esercizio"));

// 14. Un dato anagrafico richiesto.
const senzaSede = componiEControlla({ ...ingressoEsempio(CARBON), campi: CAMPI_IMPRESA_ESEMPIO.filter((c) => c.campo !== "sede_legale") });
verifica("senza sede legale confermata blocca, e manda alla scheda impresa", senzaSede.esito.mancanze?.some((m) => m.tipo === "dato-mancante" && m.azione?.href === "/dashboard/impresa"));
const sedeDaConfermare = componiEControlla({ ...ingressoEsempio(CARBON), campi: CAMPI_IMPRESA_ESEMPIO.map((c) => (c.campo === "sede_legale" ? { ...c, stato: "da_confermare", confirmed_at: null } : c)) });
verifica("una sede recuperata e non confermata non entra: si chiede di confermarla", sedeDaConfermare.esito.mancanze?.some((m) => m.tipo === "dato-da-confermare" && m.messaggio.includes("Sede legale")) && !testoCompleto(sedeDaConfermare.elaborato).some((t) => t.includes("Via delle Industrie 14")));

// 15. Il fattore che non c'è: le stesse bollette spostate al 2023, un
//     esercizio per cui il registro non ha fattori verificati.
const dueAnniPrima = (v) => (/^\d{4}-\d{2}-\d{2}$/.test(v ?? "") ? `${Number(v.slice(0, 4)) - 2}${v.slice(4)}` : v);
const esercizio2023 = componiEControlla(
  ingressoEsempio(modelloElaborato("carbon-footprint", 2023), {
    organizzazione: { ...ORG_ESEMPIO, anno_rendicontazione: 2023 },
    campiDocumento: CAMPI_DOCUMENTO_ESEMPIO.map((c) => ({ ...c, valore: dueAnniPrima(c.valore) })),
  }),
);
verifica("★ senza fattore verificato per l'esercizio il documento non esce, e tocca a noi", esercizio2023.esito.mancanze?.some((m) => m.tipo === "fattore-mancante" && m.chi === "verzero"));

// 16. Le mancanze dell'impresa prima delle nostre.
const miste = esitoRitirata.esito.mancanze ?? [];
verifica("le mancanze sono ordinate: prima quelle su cui l'impresa può agire", miste.findIndex((m) => m.chi === "verzero") === -1 || miste.slice(miste.findIndex((m) => m.chi === "verzero")).every((m) => m.chi === "verzero"));

// Un campo rifiutato non torna a galla.
const rifiutato = componiEControlla(conCampi((cc) => cc.map((c) => (c.document_id === "d0000000-0000-4000-8000-000000000001" && c.campo === "formaGiuridica" ? { ...c, stato: "rifiutato" } : c))));
verifica("un valore rifiutato dal cliente non entra e non genera una mancanza", rifiutato.esito.consegnabile && !testoCompleto(rifiutato.elaborato).some((t) => t.includes("Società a responsabilità limitata")));

/* ══════════════════════════════════════════════════════════════════ */
console.log("\n— NIENTE SI INDOVINA —\n");

const REGISTRO = "c0000000-0000-4000-8000-000000000001";
const messaggi = (r) => (r.esito.mancanze ?? []).map((m) => m.messaggio).join(" | ");

verifica("la forma canonica è una sola: «11840» è un numero, «11.840» e «45.50» no",
  numeroCanonico("11840") === 11840 && numeroCanonico("45.5") === 45.5 && numeroCanonico("11.840") === null && numeroCanonico("45.50") === null && numeroCanonico("1e3") === null,
);
const kwhMarzoGrezzo = CAMPI_DOCUMENTO_ESEMPIO.find((c) => c.document_id === primaBolletta && c.campo === "consumoTotaleKwh").valore;
const conPunto = `${kwhMarzoGrezzo.slice(0, -3)}.${kwhMarzoGrezzo.slice(-3)}`;
const scrittoMale = componiEControlla(
  conCampi((cc) => cc.map((c) => (c.document_id === primaBolletta && c.campo === "consumoTotaleKwh" ? { ...c, valore: conPunto, avvisi: [AVVISO_SCRITTO_DA_TE] } : c))),
);
verifica(`★ un consumo scritto «${conPunto}» non diventa ${conPunto.replace(".", ",")} kWh: il documento si ferma e chiede di riscriverlo`,
  !scrittoMale.esito.consegnabile && scrittoMale.esito.mancanze.some((m) => m.tipo === "valore-non-calcolabile" && m.chi === "impresa" && m.messaggio.includes(conPunto)),
  messaggi(scrittoMale),
);
const dataAllItaliana = componiEControlla(
  conCampi((cc) => cc.map((c) => (c.document_id === REGISTRO && c.riga === 6 && c.campo === "data" ? { ...c, valore: "06/03/2025" } : c))),
);
verifica("★ una data di rifornimento «06/03/2025» non fa uscire la riga dall'anno in silenzio: si ferma e lo dice",
  !dataAllItaliana.esito.consegnabile && dataAllItaliana.esito.mancanze.some((m) => m.tipo === "valore-non-calcolabile" && m.messaggio.includes("06/03/2025")),
  messaggi(dataAllItaliana),
);
verifica("★ una correzione «11.840» si salva 11840, come l'avrebbe scritta la lettura",
  valoreCorretto("11.840", { tipo: "numero" }).valore === "11840" && valoreCorretto("11.840", { tipo: "numero" }).avviso === null && valoreCorretto("45,5 l", { tipo: "numero" }).valore === "45.5",
);
verifica("una data scritta «06/03/2025» si salva 2025-03-06; una data impossibile resta com'è, con un avviso",
  valoreCorretto("06/03/2025", { tipo: "data" }).valore === "2025-03-06" &&
    valoreCorretto("31/02/2025", { tipo: "data" }).valore === "31/02/2025" &&
    valoreCorretto("31/02/2025", { tipo: "data" }).avviso !== null,
);
const scelta = { tipo: "scelta", valori: ["si", "no", "non-dichiarato"] };
verifica("«Sì» e «Non dichiarato» si salvano come le scelte dello schema; «forse» porta un avviso",
  valoreCorretto("Sì", scelta).valore === "si" && valoreCorretto("Non dichiarato", scelta).valore === "non-dichiarato" && valoreCorretto("forse", scelta).avviso !== null,
);

/* La sigla dice chi ha scritto il numero. */
const scrittoBene = componiEControlla(
  conCampi((cc) => cc.map((c) => (c.document_id === primaBolletta && c.campo === "consumoTotaleKwh" ? { ...c, valore: "11600", avvisi: [AVVISO_SCRITTO_DA_TE] } : c))),
);
const cellaScritta = tuttiIValori(scrittoBene.elaborato).find((v) => v.testo === "11.600 kWh");
const fonteScritta = scrittoBene.elaborato.fonti.find((f) => f.id === cellaScritta?.fonte);
verifica("★ un consumo riscritto dal cliente porta la sigla I, non la D della bolletta: su quella pagina c'è un altro numero",
  scrittoBene.esito.consegnabile && fonteScritta?.tipo === "inserito" && /scritti dall'organizzazione/.test(fonteScritta.titolo),
  `${cellaScritta?.fonte} ${fonteScritta?.titolo}`,
);
verifica("e il consumo attribuito che ne parte lo dichiara fra i suoi ingressi",
  scrittoBene.elaborato.fonti.find((f) => f.titolo === "Consumo di energia elettrica attribuito all'esercizio")?.ingressi?.includes(fonteScritta?.id),
);
const ricavato = componiEControlla(
  conCampi((cc) => cc.map((c) => (c.document_id === REGISTRO && c.riga === 3 && c.campo === "litri" ? { ...c, calcolato: true } : c))),
);
const fonteRicavata = ricavato.elaborato.fonti.find((f) => f.tipo === "calcolato" && f.titolo.startsWith("Valori ricavati"));
verifica("un valore che la lettura ha ricavato da altre celle è C, con il registro come ingresso",
  ricavato.esito.consegnabile &&
    fonteRicavata?.ingressi?.length === 1 &&
    ricavato.elaborato.fonti.find((f) => f.id === fonteRicavata.ingressi[0])?.tipo === "documento" &&
    ricavato.elaborato.fonti.find((f) => f.titolo === "Rifornimenti dell'esercizio per tipo di carburante")?.ingressi?.includes(fonteRicavata.id),
);
const blocchiBase = e.sezioni.flatMap((s) => s.blocchi);
const tabellaLuce = blocchiBase.find((b) => b.tipo === "tabella" && b.didascalia?.startsWith("Bollette di energia elettrica"));
const tabellaFonti = blocchiBase.find((b) => b.tipo === "tabella" && b.didascalia === "Fonti di emissione incluse nell'inventario");
verifica("★ anche i giorni nell'esercizio e i conteggi dei documenti portano una sigla C",
  tabellaLuce.righe.every((r) => typeof r[2] === "object" && perId.get(r[2].fonte)?.tipo === "calcolato") &&
    tabellaFonti.righe.every((r) => typeof r[3] === "object" && perId.get(r[3].fonte)?.tipo === "calcolato"),
);
verifica("le note delle cifre citano la sigla dei numeri che riportano",
  blocchiBase
    .filter((b) => b.tipo === "cifre")
    .flatMap((b) => b.voci)
    .filter((v) => v.nota && /\d/.test(v.nota))
    .every((v) => /\([DBCI]\d+\)/.test(v.nota)),
);

/* I documenti di un altro esercizio non valgono come presenti. */
const soloDel2025 = DOCUMENTI_ESEMPIO.filter((d) => !["e0000000-0000-4000-8000-000000000013", "a0000000-0000-4000-8000-000000000007"].includes(d.id));
const secondoAnno = componiEControlla(
  ingressoEsempio(modelloElaborato("carbon-footprint", 2026), {
    organizzazione: { ...ORG_ESEMPIO, anno_rendicontazione: 2026 },
    documenti: soloDel2025,
  }),
);
verifica("★ al secondo anno, con in archivio solo i documenti del primo, si chiedono quelli nuovi: niente sezioni «vuote, non serve niente da te»",
  !secondoAnno.esito.consegnabile &&
    secondoAnno.esito.mancanze.every((m) => m.chi === "impresa" && m.tipo !== "sezione-vuota") &&
    secondoAnno.esito.mancanze.filter((m) => /altri esercizi/.test(m.messaggio)).length >= 3,
  messaggi(secondoAnno),
);

/* Un documento non letto non è un documento assente. */
const inCoda = { id: "a0000000-0000-4000-8000-900000000001", nome_file: "bolletta_gas_scansione.pdf", tipo: "bolletta-gas", stato: "in_coda", created_at: "2026-09-01T00:00:00Z" };
const esitoInCoda = componiEControlla({ ...ingressoEsempio(CARBON), documenti: [...DOCUMENTI_ESEMPIO, inCoda] });
verifica("una bolletta ancora in coda di lettura ferma il documento, e dice che tocca a noi",
  !esitoInCoda.esito.consegnabile && esitoInCoda.esito.mancanze.some((m) => m.chi === "verzero" && m.messaggio.includes("in coda")),
);
const esitoIlleggibile = componiEControlla({ ...ingressoEsempio(CARBON), documenti: [...DOCUMENTI_ESEMPIO, { ...inCoda, stato: "illeggibile" }] });
verifica("una bolletta illeggibile ferma il documento, e chiede all'impresa una copia leggibile",
  esitoIlleggibile.esito.mancanze?.some((m) => m.chi === "impresa" && m.messaggio.includes("non si è potuto leggere")),
);
const registroVuoto = { id: "c0000000-0000-4000-8000-900000000001", nome_file: "registro_vuoto.pdf", tipo: "carburanti", stato: "letto", created_at: "2026-09-01T00:00:00Z" };
verifica("★ un registro carburanti letto da cui non esce nessun rifornimento non vale come zero: ferma il documento",
  componiEControlla({ ...ingressoEsempio(CARBON), documenti: [...DOCUMENTI_ESEMPIO, registroVuoto] }).esito.mancanze?.some((m) => m.messaggio.includes("non ne è uscito nessun rifornimento")),
);

/* ══════════════════════════════════════════════════════════════════ */
console.log("\n— DOVE NESSUN DOCUMENTO RISPONDE, UNA DICHIARAZIONE —\n");

const dichiarata = (campo, valore) => ({
  campo,
  valore,
  provenienza: "utente",
  fonte: "Dichiarazione resa nel portale",
  fonte_url: null,
  stato: "confermato",
  confirmed_at: "2026-09-14T10:00:00Z",
  updated_at: "2026-09-14T10:00:00Z",
});
const tutteLeMancanze = [];
const annota = (r) => {
  tutteLeMancanze.push(...(r.esito.mancanze ?? []));
  return r;
};

verifica("un periodo di attività si legge solo dentro l'esercizio e nel verso giusto; «inattivo» è l'altra risposta",
  dich.leggiAttivita("2025-05-16/2025-12-31", 2025)?.periodo?.dal === "2025-05-16" &&
    dich.leggiAttivita("2025-12-31/2025-05-16", 2025) === null &&
    dich.leggiAttivita("2024-12-16/2025-12-31", 2025) === null &&
    dich.leggiAttivita("16/05/2025/31/12/2025", 2025) === null &&
    dich.leggiAttivita("inattivo", 2025)?.inattivo === true,
);
verifica("la chiave di un contatore tiene lettere e cifre, sta nei 60 caratteri della scheda, e rifiuta ciò che non è un codice",
  dich.chiaveAttivita("it001e 0000x0l7", 2025) === "ghg_attivita_IT001E0000X0L7_2025" &&
    dich.chiaveAttivita("—", 2025) === null &&
    dich.chiaveAttivita("A".repeat(40), 2025).length <= 60,
);

// Nessuna combustione diretta.
const soloLuce = { ...ingressoEsempio(CARBON), documenti: DOCUMENTI_ESEMPIO.filter((d) => d.tipo !== "bolletta-gas" && d.tipo !== "carburanti") };
const esitoSoloLuce = annota(componiEControlla(soloLuce));
const offertaScope1 = esitoSoloLuce.esito.mancanze?.find((m) => m.dichiarazione?.tipo === "assenza");
verifica("★ senza gas né carburanti lo Scope 1 si ferma, e il rimedio è una dichiarazione, non «scrivici»",
  !esitoSoloLuce.esito.consegnabile && offertaScope1?.dichiarazione.fonte === "combustibili" && offertaScope1.dichiarazione.resa === false && !/scrivici/i.test(offertaScope1.rimedio),
);
const conAssenza = annota(componiEControlla({ ...soloLuce, campi: [...CAMPI_IMPRESA_ESEMPIO, dichiarata("ghg_assenza_combustibili_2025", "si")] }));
const eAssenza = conAssenza.elaborato;
verifica("★ resa la dichiarazione, il documento si consegna", conAssenza.esito.consegnabile, messaggi(conAssenza));
const fonteAssenza = eAssenza.fonti.find((f) => f.tipo === "inserito" && f.titolo.includes("nessun consumo diretto"));
verifica("la dichiarazione ha la sua sigla I, con la frase dichiarata e la data nel registro",
  fonteAssenza?.dettaglio.some((d) => d.includes(dich.testoAssenza("combustibili", 2025))) && Boolean(fonteAssenza?.confermataIl),
);
verifica("★ lo Scope 1 è zero per dichiarazione, e il documento lo dice con queste parole",
  eAssenza.fonti.find((f) => f.titolo === "Totale Scope 1")?.ingressi?.includes(fonteAssenza?.id) &&
    testoCompleto(eAssenza).some((t) => t.includes("per dichiarazione, non per misura")),
);
verifica("e il totale dell'inventario è il solo Scope 2", vicino(eAssenza.sezioni.at(-1).blocchi.find((b) => b.tipo === "cifre").voci[0].valore.numero, lb));
verifica("il testo della dichiarazione non dice mai che qualcuno «firma»", !testoCompleto(eAssenza).some((t) => lessico.test(t)));
const smentita = annota(componiEControlla({ ...ingressoEsempio(CARBON), campi: [...CAMPI_IMPRESA_ESEMPIO, dichiarata("ghg_assenza_combustibili_2025", "si")] }));
verifica("★ una dichiarazione smentita dai documenti ferma il documento, e offre di ritirarla",
  !smentita.esito.consegnabile && smentita.esito.mancanze.some((m) => m.tipo === "dichiarazione-contraddetta" && m.dichiarazione?.resa === true),
);

// Un contatore attivato a metà anno.
const primeCinque = new Set(Array.from({ length: 5 }, (_, i) => `e0000000-0000-4000-8000-${String(i + 1).padStart(12, "0")}`));
const daMaggio = { ...ingressoEsempio(CARBON), documenti: DOCUMENTI_ESEMPIO.filter((d) => !primeCinque.has(d.id)) };
const esitoDaMaggio = annota(componiEControlla(daMaggio));
const offertaContatore = esitoDaMaggio.esito.mancanze?.find((m) => m.tipo === "periodo-scoperto");
verifica("★ un contatore senza bollette fino a maggio si ferma, e offre di dichiararne il periodo di attività",
  !esitoDaMaggio.esito.consegnabile && offertaContatore?.dichiarazione?.tipo === "periodo-contatore" && offertaContatore.dichiarazione.punto === POD_ESEMPIO,
);
const conFinestra = annota(componiEControlla({ ...daMaggio, campi: [...CAMPI_IMPRESA_ESEMPIO, dichiarata(`ghg_attivita_${POD_ESEMPIO}_2025`, "2025-05-16/2025-12-31")] }));
verifica("★ dichiarato attivo dal 16 maggio, il documento si consegna e riporta la dichiarazione con la sua sigla",
  conFinestra.esito.consegnabile &&
    testoCompleto(conFinestra.elaborato).some((t) => /^Dichiarazione dell'organizzazione \(I\d+\): «Nel 2025 il contatore IT001E0000X0L7 è stato attivo solo dal 16 maggio 2025 al 31 dicembre 2025\.»/.test(t)),
  messaggi(conFinestra),
);
const finestraStretta = annota(componiEControlla({ ...daMaggio, campi: [...CAMPI_IMPRESA_ESEMPIO, dichiarata(`ghg_attivita_${POD_ESEMPIO}_2025`, "2025-06-16/2025-12-31")] }));
verifica("un periodo dichiarato che le bollette smentiscono ferma il documento",
  finestraStretta.esito.mancanze?.some((m) => m.tipo === "dichiarazione-contraddetta" && m.dichiarazione?.resa === true),
);

// Un contatore dell'anno prima che quest'anno non ha bollette.
const vecchioPod = "IT001E0000Y0K9";
const docVecchioPod = { id: "e0000000-0000-4000-8000-900000000001", nome_file: "bolletta_luce_capannone_2_dicembre_2024.pdf", tipo: "bolletta-elettrica", stato: "letto", created_at: "2026-03-16T08:40:00Z" };
const cellaDi = (document_id, campo, valore) => ({ document_id, riga: 0, campo, etichetta: campo, valore, unita: null, pagina: 1, fonte_lettura: "testo", calcolato: false, avvisi: [], stato: "confermato", confirmed_at: "2026-03-18T10:12:00Z" });
const conVecchioPod = {
  ...ingressoEsempio(CARBON),
  documenti: [...DOCUMENTI_ESEMPIO, docVecchioPod],
  campiDocumento: [
    ...CAMPI_DOCUMENTO_ESEMPIO,
    cellaDi(docVecchioPod.id, "pod", vecchioPod),
    cellaDi(docVecchioPod.id, "periodoInizio", "2024-11-16"),
    cellaDi(docVecchioPod.id, "periodoFine", "2024-12-15"),
    cellaDi(docVecchioPod.id, "consumoTotaleKwh", "4200"),
    cellaDi(docVecchioPod.id, "energiaRinnovabile", "no"),
  ],
};
const esitoVecchioPod = annota(componiEControlla(conVecchioPod));
verifica("★ un contatore con bollette dell'anno prima e nessuna di quest'anno ferma il documento: bollette nuove, o una dichiarazione",
  !esitoVecchioPod.esito.consegnabile &&
    esitoVecchioPod.esito.mancanze.some((m) => m.tipo === "documento-mancante" && m.dichiarazione?.tipo === "periodo-contatore" && m.dichiarazione.punto === vecchioPod),
  messaggi(esitoVecchioPod),
);
const podSpento = annota(componiEControlla({ ...conVecchioPod, campi: [...CAMPI_IMPRESA_ESEMPIO, dichiarata(`ghg_attivita_${vecchioPod}_2025`, "inattivo")] }));
verifica("dichiarato non attivo nel 2025, il documento si consegna e lo riporta",
  podSpento.esito.consegnabile && testoCompleto(podSpento.elaborato).some((t) => t.includes(`«Nel 2025 il contatore ${vecchioPod} non è stato attivo.»`)),
  messaggi(podSpento),
);

// I carburanti dell'anno prima, e nessun rifornimento quest'anno.
const unAnnoPrima = (v) => `${Number(v.slice(0, 4)) - 1}${v.slice(4)}`;
const registroDel2024 = CAMPI_DOCUMENTO_ESEMPIO.map((c) => (c.document_id === REGISTRO && c.campo === "data" ? { ...c, valore: unAnnoPrima(c.valore) } : c));
const esitoRegistroVecchio = annota(componiEControlla({ ...ingressoEsempio(CARBON), campiDocumento: registroDel2024 }));
verifica("★ un registro carburanti del 2024 e nessun rifornimento del 2025: si chiede il registro nuovo, o di dichiarare che non ce ne sono stati",
  !esitoRegistroVecchio.esito.consegnabile &&
    esitoRegistroVecchio.esito.mancanze.some((m) => m.dichiarazione?.tipo === "assenza" && m.dichiarazione.fonte === "carburanti"),
  messaggi(esitoRegistroVecchio),
);
const senzaRifornimenti = annota(
  componiEControlla({ ...ingressoEsempio(CARBON), campiDocumento: registroDel2024, campi: [...CAMPI_IMPRESA_ESEMPIO, dichiarata("ghg_assenza_carburanti_2025", "si")] }),
);
const cifreScope1 = senzaRifornimenti.elaborato.sezioni.find((s) => s.titolo.startsWith("Scope 1")).blocchi.filter((b) => b.tipo === "cifre").at(-1);
verifica("★ con la dichiarazione il documento esce, lo Scope 1 è il solo gas — niente carburanti tolti in silenzio né inventati",
  senzaRifornimenti.esito.consegnabile &&
    vicino(cifreScope1?.voci[0].valore.numero, smc * f("mase-gas-2022-2024")) &&
    testoCompleto(senzaRifornimenti.elaborato).some((t) => /^Dichiarazione dell'organizzazione \(I\d+\): «Nel 2025 l'organizzazione non ha fatto rifornimenti/.test(t)),
  messaggi(senzaRifornimenti),
);
const soloRegistroVecchio = annota(
  componiEControlla({ ...soloLuce, documenti: [...soloLuce.documenti, DOCUMENTI_ESEMPIO.find((d) => d.id === REGISTRO)], campiDocumento: registroDel2024 }),
);
verifica("★ un registro con soli rifornimenti di un altro anno non fa uno Scope 1 pari a zero: il documento si ferma",
  !soloRegistroVecchio.esito.consegnabile && soloRegistroVecchio.esito.mancanze.some((m) => m.dichiarazione?.fonte === "combustibili" && /altri esercizi/.test(m.messaggio)),
  messaggi(soloRegistroVecchio),
);
verifica("ogni dichiarazione offerta è un compito dell'impresa, con la frase da dichiarare",
  tutteLeMancanze.filter((m) => m.dichiarazione).length >= 7 && tutteLeMancanze.filter((m) => m.dichiarazione).every((m) => m.chi === "impresa" && m.dichiarazione.testo.length > 20),
);

/* ══════════════════════════════════════════════════════════════════ */
console.log("\n— OGNI MODELLO SI COMPONE, E DICE DOVE NON ARRIVA —\n");

for (const m of tuttiIModelli()) {
  let ok = true;
  let dettaglio = "";
  try {
    const r = componiEControlla({ ...ingressoEsempio(m) }, m);
    const senzaComposizione = m.sezioni.filter((s) => s.obbligatoria && !s.soloSe && !s.componi);
    ok = senzaComposizione.every((s) => r.esito.mancanze?.some((x) => x.sezione === s.titolo && x.tipo === "composizione-non-disponibile"));
    dettaglio = `${r.esito.consegnabile ? "consegnabile" : `${r.esito.mancanze.length} mancanze`}`;
  } catch (err) {
    ok = false;
    dettaglio = String(err);
  }
  verifica(`«${m.chiave}» si compone senza errori e dichiara le sezioni che non sa comporre`, ok, dettaglio);
}

/* ══════════════════════════════════════════════════════════════════ */
console.log("\n— LA VESTE —\n");

verifica("il contrasto segue WCAG 2.1: bianco su nero 21:1, #767676 su bianco 4,54:1", vicino(contrasto("#FFFFFF", "#000000"), 21, 1e-9) && Math.abs(contrasto("#767676", "#FFFFFF") - 4.54) < 0.01);
const neutra = veste.componiVeste({ ragioneSociale: "Officina Lombardi S.r.l.", impostazioni: null });
verifica("senza impostazioni la veste è neutra e completa", neutra.neutra && neutra.logo === null && neutra.nomeIntestazione === "Officina Lombardi S.r.l." && neutra.avvisi.length === 0);
verifica("la veste neutra non usa i verdi di Verzero", !Object.values(neutra.colori).some((c) => ["#21544F", "#206F62", "#15322F", "#193E3A"].includes(String(c).toUpperCase())));
const blu = veste.verificaColore("#1d4e89");
verifica("un blu scuro regge testo, filetti e fasce", blu.scelto === "#1D4E89" && blu.usatoPer.join() === "campitura,segno,testo" && blu.colori.suCampitura === "#FFFFFF");
const medio = veste.verificaColore("#5FA8D3");
verifica("★ un azzurro medio non regge i titoli: si usa per le fasce, i titoli restano scuri, e lo si dice",
  !medio.usatoPer.includes("testo") && medio.usatoPer.includes("campitura") && medio.colori.accentoTesto === veste.COLORI_NEUTRI.inchiostro && medio.avvisi.some((a) => /titoli/i.test(a)),
  `${medio.usatoPer} ${medio.misure?.carta}`,
);
const giallo = veste.verificaColore("#FFF6C8");
verifica("un giallo quasi bianco non si vede su carta: veste neutra, con il perché", giallo.usatoPer.length === 0 && giallo.avvisi[0]?.includes("troppo chiaro"));
verifica("un codice non valido non passa in silenzio", veste.verificaColore("verde").avvisi.length === 1 && veste.verificaColore("verde").scelto === null);
verifica("ogni ruolo usato rispetta la sua soglia misurata sulla carta",
  ["#1D4E89", "#5FA8D3", "#E3A008", "#B91C1C", "#0F766E", "#94A3B8"].every((h) => {
    const r = veste.verificaColore(h);
    const c = contrasto(h, veste.CARTA);
    return (!r.usatoPer.includes("testo") || c >= 4.5) && (!r.usatoPer.includes("segno") || c >= 3) && contrasto(veste.COLORI_NEUTRI.inchiostro, r.colori.tintaAccento) >= 4.5 && (r.colori.suCampitura === null || contrasto(r.colori.suCampitura === "#FFFFFF" ? veste.CARTA : r.colori.suCampitura, r.colori.campitura) >= 4.5);
  }),
);

const pixel = (w, h, disegna) => {
  const a = new Uint8Array(w * h * 4);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) a.set(disegna(x, y), (y * w + x) * 4);
  return a;
};
const scuroSuTrasparente = pixel(100, 40, (x, y) => (x > 20 && x < 80 && y > 10 && y < 30 ? [20, 40, 80, 255] : [0, 0, 0, 0]));
const biancoSuTrasparente = pixel(100, 40, (x, y) => (x > 20 && x < 80 && y > 10 && y < 30 ? [255, 255, 255, 255] : [0, 0, 0, 0]));
const suBianco = pixel(100, 40, (x, y) => (x > 20 && x < 80 && y > 10 && y < 30 ? [20, 40, 80, 255] : [255, 255, 255, 255]));
const suRosso = pixel(100, 40, (x, y) => (x > 20 && x < 80 && y > 10 && y < 30 ? [255, 255, 255, 255] : [180, 20, 30, 255]));
const foto = pixel(100, 40, (x, y) => [(x * 37 + y * 11) % 255, (x * 7) % 255, (y * 23) % 255, 255]);
verifica("un logo scuro su trasparente va bene", veste.analizzaPixel(scuroSuTrasparente, 100, 40).sfondo === "trasparente" && !veste.analizzaPixel(scuroSuTrasparente, 100, 40).inchiostroChiaro);
const giudizioBianco = veste.giudicaLogo({ pxLarghezza: 1600, pxAltezza: 640, vettoriale: false, analisi: veste.analizzaPixel(biancoSuTrasparente, 100, 40) });
verifica("★ un logo bianco su trasparente non si usa: su carta sparirebbe, e si chiede la versione scura", !giudizioBianco.utilizzabile && giudizioBianco.messaggi.some((m) => m.tono === "blocco" && m.testo.includes("versione scura")));
verifica("un logo su fondo bianco pieno va bene", veste.analizzaPixel(suBianco, 100, 40).sfondo === "bianco");
const giudizioRosso = veste.giudicaLogo({ pxLarghezza: 1600, pxAltezza: 640, vettoriale: false, analisi: veste.analizzaPixel(suRosso, 100, 40) });
verifica("un logo su fondo colorato si usa, e si avvisa del riquadro", giudizioRosso.utilizzabile && giudizioRosso.messaggi.some((m) => m.tono === "avviso" && m.testo.includes("riquadro")));
verifica("un'immagine fino ai bordi e disuniforme si dice irregolare", veste.analizzaPixel(foto, 100, 40).sfondo === "irregolare");
const piccolo = veste.giudicaLogo({ pxLarghezza: 300, pxAltezza: 100, vettoriale: false, analisi: veste.analizzaPixel(scuroSuTrasparente, 100, 40) });
verifica("★ un logo a bassa risoluzione si mostra più piccolo per restare nitido (adattare, non degradare)", piccolo.utilizzabile && piccolo.copertina.ridotto && piccolo.copertina.dpi >= veste.DPI_BUONI - 0.01);
const minuscolo = veste.giudicaLogo({ pxLarghezza: 90, pxAltezza: 30, vettoriale: false, analisi: veste.analizzaPixel(scuroSuTrasparente, 100, 40) });
verifica("un logo troppo piccolo anche ridotto al minimo non si usa", !minuscolo.utilizzabile && minuscolo.messaggi.some((m) => m.testo.includes("troppo piccola")));
verifica("un logo vettoriale si posa alla dimensione piena", veste.posaLogo(10, 4, true, veste.SCATOLE_LOGO.copertina).larghezza === 160);

const pngVero = await sharp({ create: { width: 1800, height: 700, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
  .composite([{ input: await sharp({ create: { width: 1000, height: 400, channels: 4, background: { r: 29, g: 78, b: 137, alpha: 1 } } }).png().toBuffer(), left: 400, top: 150 }])
  .png()
  .toBuffer();
const preparato = await preparaLogo(new Uint8Array(pngVero), "image/png");
verifica("il logo caricato si rifila dei margini vuoti prima di posarlo", !("errore" in preparato) && preparato.larghezza === 1000 && preparato.altezza === 400 && preparato.esito.utilizzabile, JSON.stringify("errore" in preparato ? preparato : { l: preparato.larghezza, a: preparato.altezza, m: preparato.esito.messaggi }));
verifica("un formato non ammesso si rifiuta con la ragione", "errore" in (await preparaLogo(new Uint8Array(pngVero), "image/gif")));
const svgConScript = new TextEncoder().encode('<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><script>alert(1)</script><rect width="10" height="10"/></svg>');
verifica("★ un SVG con script non si apre nemmeno", "errore" in (await preparaLogo(svgConScript, "image/svg+xml")));
verifica("★ un SVG con script travestito da PNG si riconosce e non si apre", "errore" in (await preparaLogo(svgConScript, "image/png")));
const svgEsterno = new TextEncoder().encode('<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="10" height="10"><image xlink:href="https://esempio.example/x.png" width="10" height="10"/></svg>');
verifica("un SVG che richiama risorse esterne non si apre", "errore" in (await preparaLogo(svgEsterno, "image/svg+xml")));
const svgPulito = new TextEncoder().encode('<svg xmlns="http://www.w3.org/2000/svg" width="300" height="100" viewBox="0 0 300 100"><rect x="10" y="10" width="280" height="80" rx="12" fill="#1D4E89"/></svg>');
const vettoriale = await preparaLogo(svgPulito, "image/svg+xml");
verifica("un SVG semplice si rasterizza ad alta risoluzione e resta marcato vettoriale", !("errore" in vettoriale) && vettoriale.vettoriale && vettoriale.larghezza >= 2000);
const svgEnorme = new TextEncoder().encode('<svg xmlns="http://www.w3.org/2000/svg" width="10000" height="4000" viewBox="0 0 10000 4000"><rect x="100" y="100" width="9800" height="3800" fill="#1D4E89"/></svg>');
const enorme = await preparaLogo(svgEnorme, "image/svg+xml");
verifica("un SVG dichiarato largo diecimila punti esce largo quanto serve, non ottantamila pixel",
  !("errore" in enorme) && enorme.larghezza <= 2400 && enorme.larghezza >= 2000,
  JSON.stringify("errore" in enorme ? enorme : { l: enorme.larghezza, a: enorme.altezza }),
);
const svgEntita = new TextEncoder().encode('<?xml version="1.0"?><!DOCTYPE svg [<!ENTITY a "aaaaaaaaaa">]><svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><text>&a;</text></svg>');
verifica("★ un SVG con DOCTYPE ed entità non si dà nemmeno al lettore d'immagini", "errore" in (await preparaLogo(svgEntita, "image/svg+xml")));

// Un PNG da 12.000 × 12.000 pixel che pesa pochi kilobyte: un bit per pixel,
// tutti uguali. Decodificato come immagine a colori costerebbe più di un
// gigabyte; il controllo deve fermarsi all'intestazione.
const pezzo = (tipo, dati) => {
  const lunghezza = Buffer.alloc(4);
  lunghezza.writeUInt32BE(dati.length);
  const corpo = Buffer.concat([Buffer.from(tipo, "latin1"), dati]);
  const controllo = Buffer.alloc(4);
  controllo.writeUInt32BE(crc32(corpo) >>> 0);
  return Buffer.concat([lunghezza, corpo, controllo]);
};
const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(12000, 0);
ihdr.writeUInt32BE(12000, 4);
ihdr.set([1, 0, 0, 0, 0], 8);
const pngGigante = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  pezzo("IHDR", ihdr),
  pezzo("IDAT", deflateSync(Buffer.alloc(12000 * (1 + 1500)))),
  pezzo("IEND", Buffer.alloc(0)),
]);
const primaDelGigante = process.memoryUsage().rss;
const gigante = await preparaLogo(new Uint8Array(pngGigante), "image/png");
verifica("★ un'immagine da 12.000 × 12.000 pixel si rifiuta leggendo l'intestazione, senza decodificarla",
  "errore" in gigante && /12000 × 12000/.test(gigante.errore) && process.memoryUsage().rss - primaDelGigante < 200 * 1024 * 1024,
  JSON.stringify(gigante),
);
const rumore = await sharp(randomBytes(2000 * 2000 * 3), { raw: { width: 2000, height: 2000, channels: 3 } }).jpeg({ quality: 60 }).toBuffer();
const fotografia = await preparaLogo(new Uint8Array(rumore), "image/jpeg");
verifica("una fotografia fitta di dettagli, sotto il limite di caricamento, esce sotto il peso massimo dell'archivio",
  rumore.byteLength <= veste.MAX_BYTE_LOGO && ("errore" in fotografia || fotografia.png.byteLength <= veste.MAX_BYTE_PNG_LOGO),
  `${rumore.byteLength} → ${"errore" in fotografia ? fotografia.errore : fotografia.png.byteLength}`,
);
verifica("il limite di caricamento sta sotto quello delle richieste della piattaforma, e la pagina dice lo stesso numero",
  veste.MAX_BYTE_LOGO <= 4.5 * 1024 * 1024 &&
    /bodySizeLimit: "4\.5mb"/.test(readFileSync("next.config.ts", "utf8")) &&
    !/fino a 5 MB/.test(readFileSync("src/app/(app)/dashboard/impostazioni/veste.tsx", "utf8")),
);

/* ══════════════════════════════════════════════════════════════════ */
console.log("\n— L'IMPRONTA —\n");

const impronta = (ingresso, vesteTesto = "neutra") => improntaElaborato(ingresso, componiElaborato(ingresso), vesteTesto);
const i0 = impronta(ingressoEsempio(CARBON));
verifica("stessi ingressi, stessa impronta", JSON.stringify(i0) === JSON.stringify(impronta(ingressoEsempio(CARBON))));
const riconfermato = impronta({ ...ingressoEsempio(CARBON), campiDocumento: CAMPI_DOCUMENTO_ESEMPIO.map((c) => ({ ...c, confirmed_at: "2026-09-01T10:00:00Z" })) });
verifica("★ riconfermare gli stessi valori non cambia l'impronta: non si rigenera per niente", JSON.stringify(i0) === JSON.stringify(riconfermato));
const corretto = impronta(conCampi((cc) => cc.map((c) => (c.document_id === primaBolletta && c.campo === "consumoTotaleKwh" ? { ...c, valore: "11070" } : c))));
const decisione = decidiRigenerazione({ adesso: corretto, ultima: i0, ultimaIl: new Date("2026-09-10"), versioniNellUltimaOra: 0, ora: new Date("2026-09-15") });
verifica("★ un valore corretto cambia i dati, e la rigenerazione dice perché", decisione.azione === "rigenera" && decisione.cambiato.includes("hai confermato dati nuovi"));
verifica("nulla è cambiato → si riapre la versione esistente", decidiRigenerazione({ adesso: i0, ultima: i0, ultimaIl: new Date("2026-09-10"), versioniNellUltimaOra: 0, ora: new Date("2026-09-15") }).azione === "riusa");
const conLogo = impronta(ingressoEsempio(CARBON), "marchi/logo-nuovo.png|#1D4E89");
verifica("una veste nuova rigenera, e lo dice con le sue parole", decidiRigenerazione({ adesso: conLogo, ultima: i0, ultimaIl: new Date("2026-09-10"), versioniNellUltimaOra: 0, ora: new Date("2026-09-15") }).cambiato?.includes("è cambiata la veste grafica del documento"));
const conOrganigramma = impronta({ ...ingressoEsempio(CARBON), documenti: [...DOCUMENTI_ESEMPIO, { id: "o1", nome_file: "organigramma.pdf", tipo: "organigramma", stato: "letto", created_at: "2026-09-01T00:00:00Z" }] });
verifica("un documento che il modello non legge non rende nuovo l'inventario", JSON.stringify(conOrganigramma) === JSON.stringify(i0));
const stessoNumeroRiscritto = impronta(conCampi((cc) => cc.map((c) => (c.document_id === primaBolletta && c.campo === "consumoTotaleKwh" ? { ...c, avvisi: [AVVISO_SCRITTO_DA_TE] } : c))));
verifica("lo stesso numero riscritto a mano cambia l'impronta: nel documento la sua sigla passa da D a I", stessoNumeroRiscritto.dati !== i0.dati);
const conDichiarazioneResa = impronta({ ...ingressoEsempio(CARBON), campi: [...CAMPI_IMPRESA_ESEMPIO, dichiarata(`ghg_attivita_${POD_ESEMPIO}_2025`, "2025-01-01/2025-12-31")] });
verifica("una dichiarazione resa cambia l'impronta", conDichiarazioneResa.dati !== i0.dati);
const { VERSIONE_GENERATORE } = await import("../src/lib/elaborato/componi.ts");
verifica("la versione del generatore entra nell'impronta del modello: una correzione del calcolo non riapre il documento vecchio",
  improntaElaborato(ingressoEsempio(CARBON), componiElaborato(ingressoEsempio(CARBON)), "neutra").modello === i0.modello &&
    readFileSync("src/lib/elaborato/componi.ts", "utf8").includes("generatore: VERSIONE_GENERATORE") &&
    /^\d{4}-\d{2}-\d{2}\.\d+$/.test(VERSIONE_GENERATORE),
);

/* ══════════════════════════════════════════════════════════════════ */
console.log("\n— I FORMATI —\n");

const conMarchio = veste.componiVeste({
  ragioneSociale: "Officina Lombardi S.r.l.",
  impostazioni: { logo_percorso: "x", logo_larghezza: preparato.larghezza, logo_altezza: preparato.altezza, logo_vettoriale: false, colore_accento: "#1D4E89", nome_intestazione: null, indirizzo: null, sito: null, contatto: null, updated_at: null },
  logoPng: preparato.png,
});
const pdf = await pdfElaborato(base.esito.elaborato, conMarchio);
const testoPdf = Buffer.from(pdf.byte).toString("latin1");
verifica("il PDF è un PDF 1.7 con i caratteri incorporati", testoPdf.startsWith("%PDF-1.7") && testoPdf.includes("/FontFile2"));
verifica("il PDF ha copertina, indice, sezioni e appendici", pdf.pagine >= 12, `${pdf.pagine} pagine`);
verifica("le sigle portano alle voci del registro", testoPdf.includes("fonte-D1") && testoPdf.includes("fonte-C1") && testoPdf.includes("/GoTo"));
verifica("l'indice porta alle sezioni", testoPdf.includes("parte-sezione-1") && testoPdf.includes("parte-fonti"));
verifica("il logo si incorpora una volta sola, non una per pagina", (testoPdf.match(/\/Subtype \/Image/g) ?? []).length <= 2, String((testoPdf.match(/\/Subtype \/Image/g) ?? []).length));
const anteprima = await pdfAnteprima(nonConfermato.elaborato, conMarchio);
verifica("★ l'anteprima della veste si genera anche da un documento non consegnabile, ed è di due pagine", anteprima.pagine === 2);
verifica("e non porta collegamenti a un registro delle fonti che non contiene", !Buffer.from(anteprima.byte).toString("latin1").includes("/GoTo"));
const lungo = clona(nonConfermato.elaborato);
const primaSezione = lungo.sezioni.find((s) => s.blocchi.length > 0);
primaSezione.blocchi.unshift({
  tipo: "coppie",
  righe: [{ etichetta: "Unità locali", valore: { testo: Array.from({ length: 90 }, (_, i) => `Unità locale ${i + 1}: via dell'Esempio ${i + 1}, Levate (BG)`).join("\n"), fonte: "I1" } }],
});
primaSezione.blocchi.unshift({ tipo: "cifre", voci: [{ etichetta: "Totale", valore: { testo: "1.020.130,13 t CO₂e", fonte: "C12" } }, { etichetta: "Altro", valore: { testo: "12,5 t CO₂e", fonte: "C3" } }, { etichetta: "Terzo", valore: { testo: "7 t CO₂e", fonte: "C4" } }] });
let lungoOk = true;
let pagineLungo = 0;
try {
  pagineLungo = (await pdfAnteprima(lungo, conMarchio)).pagine;
} catch (err) {
  lungoOk = String(err);
}
verifica("una riga più alta di una pagina e una cifra enorme si impaginano senza errori, su più pagine", lungoOk === true && pagineLungo >= 3, `${lungoOk} ${pagineLungo}`);

const docx = await docxElaborato(base.esito.elaborato, neutra);
const zip = Buffer.from(docx.byte);
verifica("il DOCX è un pacchetto Office valido", zip.subarray(0, 2).toString() === "PK" && zip.length > 10_000);
const { execFileSync } = await import("node:child_process");
let xml = "";
try {
  const { mkdtempSync, writeFileSync } = await import("node:fs");
  const { join } = await import("node:path");
  const { tmpdir } = await import("node:os");
  const dir = mkdtempSync(join(tmpdir(), "vz-docx-"));
  writeFileSync(join(dir, "d.docx"), zip);
  xml = execFileSync("unzip", ["-p", join(dir, "d.docx"), "word/document.xml"]).toString("utf8");
} catch {
  xml = "";
}
verifica("il DOCX contiene le stesse sezioni, il registro delle fonti e i segnalibri delle sigle",
  xml.includes("Registro delle fonti") && xml.includes("Scope 2") && xml.includes('w:name="fonte-D1"') && xml.includes("TOC"),
);

/* ══════════════════════════════════════════════════════════════════ */
console.log("\n— UN AMBITO NUOVO COMPONE IL SUO DOCUMENTO —\n");

REGISTRO_NORME.push({ codice: "D.Lgs. 231/2001 (prova)", stato: "in vigore" });
const MODELLO_231 = {
  chiave: "modello-231-prova",
  ambito: "compliance-231",
  documento: "Modello 231",
  intestazione: "Modello di Organizzazione, Gestione e Controllo",
  norme: ["D.Lgs. 231/2001 (prova)"],
  sezioni: [
    { titolo: "Parte generale", obbligatoria: true, componi: [{ testo: "Il modello di {organizzazione} per l'esercizio {anno}." }, { blocco: "anagrafica" }] },
    {
      titolo: "Mappatura delle attività a rischio",
      obbligatoria: true,
      componi: [{ blocco: "tabella-documenti", parametri: { tipo: "mappatura-rischi-231", colonne: [{ campo: "area", titolo: "Area" }, { campo: "livello", titolo: "Livello di rischio" }] } }],
    },
  ],
  daFornire: [],
  formati: ["pdf", "docx"],
};
const docMappa = { id: "m2310000-0000-4000-8000-000000000001", nome_file: "mappatura.pdf", tipo: "mappatura-rischi-231", stato: "letto", created_at: "2026-05-01T00:00:00Z" };
const righeMappa = [["Acquisti", "alto"], ["Tesoreria", "medio"]].flatMap(([area, livello], i) => [
  { document_id: docMappa.id, riga: i + 1, campo: "area", etichetta: "Area", valore: area, unita: null, pagina: 1, fonte_lettura: "testo", avvisi: [], stato: "confermato", confirmed_at: "2026-05-02T00:00:00Z" },
  { document_id: docMappa.id, riga: i + 1, campo: "livello", etichetta: "Livello", valore: livello, unita: null, pagina: 1, fonte_lettura: "testo", avvisi: [], stato: "confermato", confirmed_at: "2026-05-02T00:00:00Z" },
]);
const ingresso231 = { ...ingressoEsempio(MODELLO_231), percorso: "modello-231", documenti: [...DOCUMENTI_ESEMPIO, docMappa], campiDocumento: [...CAMPI_DOCUMENTO_ESEMPIO, ...righeMappa] };
const esito231 = componiEControlla(ingresso231, MODELLO_231);
verifica("★ un modello dichiarato nella prova, con un tipo di documento mai visto, si consegna senza codice nuovo", esito231.esito.consegnabile, esito231.esito.mancanze?.map((m) => m.messaggio).join(" | "));
verifica("e la sua tabella porta le sigle dei documenti, cella per cella",
  esito231.elaborato.sezioni[1].blocchi[0].righe.flat().every((c) => typeof c === "object" && c.fonte?.startsWith("D")),
);
const senzaRighe = componiEControlla({ ...ingresso231, campiDocumento: CAMPI_DOCUMENTO_ESEMPIO }, MODELLO_231);
verifica("senza le righe della mappatura la consegna si ferma e chiede il documento", !senzaRighe.esito.consegnabile);
const docx231 = await docxElaborato(esito231.esito.elaborato, neutra);
verifica("dove il modello lo dichiara, esce anche il DOCX", Buffer.from(docx231.byte).subarray(0, 2).toString() === "PK");
REGISTRO_NORME.pop();

/* ══════════════════════════════════════════════════════════════════ */
console.log("\n— LE DUE VERITÀ CHE DEVONO COINCIDERE —\n");

const script = readFileSync("scripts/controllo-norme.mjs", "utf8");
const formaScript = /const FORMA =\s*\n?\s*(\/.*\/g);/.exec(script)?.[1];
verifica("la forma delle designazioni è la stessa del controllo delle pagine", formaScript === String(FORMA_DESIGNAZIONE), `${formaScript} vs ${FORMA_DESIGNAZIONE}`);
const pdfTs = readFileSync("src/lib/elaborato/pdf.ts", "utf8");
const vesteTs = readFileSync("src/lib/elaborato/veste.ts", "utf8");
verifica("il logotipo Verzero nel documento ha i suoi colori, e la veste del cliente non li conosce",
  /const pino = "#21544F"/.test(pdfTs) && !/#21544F/i.test(vesteTs),
);

console.log(`\n${superati} prove superate, ${falliti} fallite`);
process.exit(falliti === 0 ? 0 : 1);
