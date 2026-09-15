/**
 * L'IMPRESA INVENTATA DEL COLLAUDO — dati d'esempio nella forma delle righe di banca dati.
 *
 * Officina Lombardi S.r.l. è l'impresa d'esempio del sito (src/lib/impresa-esempio.ts):
 * nome e partita IVA vengono da lì, e la partita IVA è volutamente NON valida.
 * Tutti gli altri identificativi — POD, PDR, indirizzo, sito — sono costruiti
 * per non poter coincidere con quelli di qualcuno: il dominio è `.example`,
 * riservato proprio a questo, e i codici hanno lettere e zeri dove un
 * distributore non li metterebbe.
 *
 * Serve a due script, e per questo sta in un file suo:
 *   · scripts/collaudo-elaborato.mjs  — genera il documento da guardare;
 *   · scripts/test-elaborato.mjs      — ci fa girare sopra le prove.
 * Due copie dei dati diventerebbero due imprese diverse alla prima modifica.
 */

import { IMPRESA_ESEMPIO } from "../src/lib/impresa-esempio.ts";

export const ORG_ESEMPIO = {
  id: "4f2a9c10-7b3e-4d21-9a55-0c1e8d6b2f71",
  ragione_sociale: IMPRESA_ESEMPIO.nome,
  partita_iva: IMPRESA_ESEMPIO.piva,
  anno_rendicontazione: 2025,
  sito_web: "https://www.officinalombardi.example",
  created_at: "2026-02-12T09:30:00Z",
};

const CONFERMA = "2026-03-18T10:12:00Z";
const CARICATO = "2026-03-16T08:40:00Z";

export const CAMPI_IMPRESA_ESEMPIO = [
  {
    campo: "sede_legale",
    valore: "Via delle Industrie 14, 24040 Levate (BG)",
    provenienza: "motore",
    fonte: "VIES",
    fonte_url: null,
    stato: "confermato",
    confirmed_at: "2026-02-12T09:41:00Z",
    updated_at: "2026-02-12T09:41:00Z",
  },
  {
    campo: "ateco",
    valore: "25.62.00 — Lavori di meccanica generale",
    provenienza: "motore",
    fonte: "ISTAT · ATECO 2025",
    fonte_url: null,
    stato: "confermato",
    confirmed_at: "2026-02-12T09:41:00Z",
    updated_at: "2026-02-12T09:41:00Z",
  },
  {
    campo: "dipendenti",
    valore: "18",
    provenienza: "utente",
    fonte: null,
    fonte_url: null,
    stato: "confermato",
    confirmed_at: null,
    updated_at: "2026-02-12T09:44:00Z",
  },
];

/* ── i documenti ─────────────────────────────────────────────────────── */

const documenti = [];
const campiDocumento = [];

function documento(id, nome_file, tipo) {
  documenti.push({
    id,
    nome_file,
    tipo,
    stato: "letto",
    letto_at: CARICATO,
    created_at: CARICATO,
    da_fotocamera: false,
  });
}

function campo(document_id, campo, etichetta, valore, unita = null, riga = 0, pagina = 1) {
  campiDocumento.push({
    document_id,
    riga,
    campo,
    etichetta,
    valore,
    unita,
    pagina,
    fonte_lettura: "testo",
    calcolato: false,
    avvisi: [],
    stato: "confermato",
    confirmed_at: CONFERMA,
  });
}

/* La visura: forma giuridica, addetti. */
documento("d0000000-0000-4000-8000-000000000001", "visura_camerale_2026.pdf", "visura");
campo("d0000000-0000-4000-8000-000000000001", "ragioneSociale", "Denominazione", IMPRESA_ESEMPIO.nome);
campo("d0000000-0000-4000-8000-000000000001", "formaGiuridica", "Forma giuridica", "Società a responsabilità limitata");
campo("d0000000-0000-4000-8000-000000000001", "addetti", "Addetti dichiarati", "18");

/*
 * Energia elettrica: bollette mensili dal 16 al 15, quindi la prima e
 * l'ultima cadono a cavallo d'anno. Da ottobre il contratto passa a
 * un'offerta con energia da fonti rinnovabili dichiarata in bolletta: è
 * il caso in cui le due letture dello Scope 2 divergono davvero.
 */
export const POD_ESEMPIO = "IT001E0000X0L7";
const bolletteElettriche = [
  ["2024-12-16", "2025-01-15", 11840, "no"],
  ["2025-01-16", "2025-02-15", 12310, "no"],
  ["2025-02-16", "2025-03-15", 11520, "no"],
  ["2025-03-16", "2025-04-15", 12060, "no"],
  ["2025-04-16", "2025-05-15", 11380, "no"],
  ["2025-05-16", "2025-06-15", 11950, "no"],
  ["2025-06-16", "2025-07-15", 12780, "no"],
  ["2025-07-16", "2025-08-15", 8420, "no"],
  ["2025-08-16", "2025-09-15", 10960, "no"],
  ["2025-09-16", "2025-10-15", 12140, "si"],
  ["2025-10-16", "2025-11-15", 12470, "si"],
  ["2025-11-16", "2025-12-15", 11890, "si"],
  ["2025-12-16", "2026-01-15", 10230, "si"],
];
bolletteElettriche.forEach(([dal, al, kwh, rinnovabile], i) => {
  const id = `e0000000-0000-4000-8000-${String(i + 1).padStart(12, "0")}`;
  const mese = new Date(`${al}T00:00:00Z`).toLocaleDateString("it-IT", { month: "long", year: "numeric", timeZone: "UTC" });
  documento(id, `bolletta_luce_${mese.replace(" ", "_")}.pdf`, "bolletta-elettrica");
  campo(id, "pod", "Codice POD", POD_ESEMPIO);
  campo(id, "fornitore", "Fornitore", i < 9 ? "Fornitore Energia Uno (esempio)" : "Fornitore Energia Due (esempio)");
  campo(id, "periodoInizio", "Periodo dal", dal);
  campo(id, "periodoFine", "Periodo al", al);
  campo(id, "consumoTotaleKwh", "Consumo del periodo", String(kwh), "kWh", 0, 2);
  campo(id, "energiaRinnovabile", "Energia rinnovabile dichiarata", rinnovabile, null, 0, 2);
});

/* Gas naturale: bollette bimestrali, riscaldamento dei capannoni. */
export const PDR_ESEMPIO = "00000000004242";
const bolletteGas = [
  ["2024-12-01", "2025-01-31", 2140],
  ["2025-02-01", "2025-03-31", 1680],
  ["2025-04-01", "2025-05-31", 540],
  ["2025-06-01", "2025-07-31", 190],
  ["2025-08-01", "2025-09-30", 230],
  ["2025-10-01", "2025-11-30", 1120],
  ["2025-12-01", "2026-01-31", 2260],
];
bolletteGas.forEach(([dal, al, smc], i) => {
  const id = `a0000000-0000-4000-8000-${String(i + 1).padStart(12, "0")}`;
  documento(id, `bolletta_gas_${dal.slice(0, 7)}.pdf`, "bolletta-gas");
  campo(id, "pdr", "Codice PDR", PDR_ESEMPIO);
  campo(id, "periodoInizio", "Periodo dal", dal);
  campo(id, "periodoFine", "Periodo al", al);
  campo(id, "consumoSmc", "Consumo del periodo", String(smc), "Smc", 0, 1);
});

/* Carburanti: un registro con due furgoni a gasolio e un'auto a benzina. */
const REGISTRO = "c0000000-0000-4000-8000-000000000001";
documento(REGISTRO, "registro_carburanti_2025.pdf", "carburanti");
const rifornimenti = [];
for (let m = 1; m <= 12; m++) {
  const mm = String(m).padStart(2, "0");
  rifornimenti.push([`2025-${mm}-06`, "Furgone 1", "gasolio", 62 + ((m * 7) % 11)]);
  rifornimenti.push([`2025-${mm}-19`, "Furgone 2", "gasolio", 55 + ((m * 5) % 13)]);
  if (m % 2 === 0) rifornimenti.push([`2025-${mm}-24`, "Auto aziendale", "benzina", 38 + ((m * 3) % 7)]);
}
rifornimenti.forEach(([data, mezzo, carburante, litri], i) => {
  const riga = i + 1;
  const pagina = riga <= 22 ? 1 : 2;
  campo(REGISTRO, "data", "Data", data, null, riga, pagina);
  campo(REGISTRO, "mezzo", "Mezzo o impianto", mezzo, null, riga, pagina);
  campo(REGISTRO, "tipoCarburante", "Tipo di carburante", carburante, null, riga, pagina);
  campo(REGISTRO, "litri", "Quantità", String(litri), "l", riga, pagina);
});

export const DOCUMENTI_ESEMPIO = documenti;
export const CAMPI_DOCUMENTO_ESEMPIO = campiDocumento;

/** L'ingresso completo della composizione, per un modello già scelto. */
export function ingressoEsempio(modello, sovrascrivi = {}) {
  return {
    modello,
    opzioni: [],
    percorso: "carbon-footprint-scope-1-2",
    organizzazione: ORG_ESEMPIO,
    campi: CAMPI_IMPRESA_ESEMPIO,
    documenti: DOCUMENTI_ESEMPIO,
    campiDocumento: CAMPI_DOCUMENTO_ESEMPIO,
    revisione: { numero: 0, data: "2026-09-15", motivo: "Prima emissione" },
    validazione: { stato: "in_attesa" },
    revisioniPrecedenti: [],
    esempio: true,
    ...sovrascrivi,
  };
}

/** Il marchio dell'impresa inventata: un colore d'accento e i contatti. */
export const MARCHIO_ESEMPIO = {
  logo_percorso: "esempio/logo.png",
  logo_larghezza: null,
  logo_altezza: null,
  logo_vettoriale: false,
  colore_accento: "#1D4E89",
  nome_intestazione: "Officina Lombardi",
  indirizzo: "Via delle Industrie 14, 24040 Levate (BG)",
  sito: "www.officinalombardi.example",
  contatto: null,
  updated_at: "2026-03-20T15:00:00Z",
};
