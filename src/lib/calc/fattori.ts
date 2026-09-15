/**
 * IL REGISTRO DEI FATTORI DI EMISSIONE — la banca dati da cui il calcolo legge.
 *
 * ═══ PERCHÉ IN UN REGISTRO VERIFICATO, E NON A MEMORIA ═══
 * Un fattore sbagliato non dà errore da nessuna parte: produce un
 * inventario plausibile e falso, in un documento che il cliente porta in
 * banca. Qui ogni numero sta accanto alla pubblicazione UFFICIALE da cui
 * viene — edizione, tabella, indirizzo — e alla data in cui l'abbiamo
 * riletto sul documento originale. Nel documento generato il fattore
 * compare con la sigla di banca dati e la stessa fonte per esteso: chi
 * controlla apre la tabella indicata e ci trova quel numero.
 *
 * SPEC §4 prevedeva una tabella `emission_factors` a banca dati, per
 * aggiornare i fattori senza rilascio. Stanno qui per la stessa ragione per
 * cui qui sta il registro delle norme: ogni fattore nuovo deve passare
 * da una verifica sulla fonte e da una revisione, e il documento generato
 * lo copia dentro la versione. È una scelta da rivedere quando i fattori
 * da mantenere diventeranno molti (docs/decisioni-da-rivedere.md).
 *
 * ═══ UNA REVISIONE SI AGGIUNGE ═══
 * Come per gli standard: l'anno nuovo è una voce nuova, la precedente non
 * si tocca e continua a valere per il suo esercizio. Un inventario 2024
 * resta calcolato coi fattori del 2024 anche quando esistono quelli del 2025.
 *
 * ═══ VERIFICATO ═══ 15 settembre 2026, sui documenti originali indicati
 * in ciascuna voce (PDF e fogli di calcolo dei pubblicatori).
 */

export const FATTORI_VERIFICATI_IL = {
  iso: "2026-09-15",
  esteso: "15 settembre 2026",
} as const;

export type Vettore =
  /** Energia elettrica prelevata dalla rete: metodo location-based. */
  | "energia-elettrica-rete"
  /** Energia elettrica senza garanzie d'origine: mix residuale, metodo market-based. */
  | "energia-elettrica-residuale"
  | "gas-naturale"
  | "gasolio"
  | "benzina"
  | "gpl";

export type FattoreEmissione = {
  id: string;
  vettore: Vettore;
  /** kg per unità: il numero che entra nel calcolo. */
  valore: number;
  unita: "kWh" | "Smc" | "l";
  /** Il valore come lo scrive la fonte, con la sua unità: serve a chi controlla. */
  comeNellaFonte: string;
  /** Che cosa copre: sola CO₂, o CO₂ equivalente con gli altri gas. */
  gas: "CO2" | "CO2e";
  /** Il potenziale di riscaldamento globale usato dalla fonte, quando c'è. */
  gwp?: string;
  /** L'esercizio di rendicontazione per cui la fonte rende applicabile il dato. */
  esercizio: number;
  /** Dato provvisorio della fonte, soggetto a ricalcolo nell'edizione successiva. */
  preliminare?: boolean;
  fonte: {
    ente: string;
    pubblicazione: string;
    /** Dove, dentro la pubblicazione. */
    dove: string;
    pubblicataIl: string;
    url: string;
  };
  nota?: string;
};

const ISPRA_430 = {
  ente: "ISPRA — Istituto Superiore per la Protezione e la Ricerca Ambientale",
  pubblicazione:
    "Settore elettrico: emissioni di CO2 e altri impatti. Edizione 2026 (Rapporti 430/2026)",
  pubblicataIl: "giugno 2026",
  url: "https://www.isprambiente.gov.it/files2026/pubblicazioni/rapporti/r430-2026-2.pdf",
};

export const FATTORI_EMISSIONE: FattoreEmissione[] = [
  /* ══ Energia elettrica, location-based — ISPRA ══════════════════════ */
  {
    id: "ispra-consumi-2024",
    vettore: "energia-elettrica-rete",
    valore: 0.19404,
    unita: "kWh",
    comeNellaFonte: "194,04 g CO₂eq/kWh",
    gas: "CO2e",
    gwp: "IPCC AR5 (CH₄ = 28, N₂O = 265)",
    esercizio: 2024,
    fonte: {
      ...ISPRA_430,
      dove: "Tabella 1.18 — Fattori di emissione di gas serra per il consumo elettrico, anno 2024",
    },
  },
  {
    id: "ispra-consumi-2025",
    vettore: "energia-elettrica-rete",
    valore: 0.20101,
    unita: "kWh",
    comeNellaFonte: "201,01 g CO₂eq/kWh",
    gas: "CO2e",
    gwp: "IPCC AR5 (CH₄ = 28, N₂O = 265)",
    esercizio: 2025,
    preliminare: true,
    fonte: {
      ...ISPRA_430,
      dove: "Tabella 1.18 — Fattori di emissione di gas serra per il consumo elettrico, anno 2025 (dato preliminare)",
    },
    nota:
      "ISPRA indica il 2025 come dato preliminare, da ricalcolare nell'edizione successiva: quando uscirà, il fattore definitivo è motivo di una nuova revisione del documento.",
  },

  /* ══ Energia elettrica, market-based — mix residuale AIB ═════════════ */
  {
    id: "aib-residuale-2024",
    vettore: "energia-elettrica-residuale",
    valore: 0.4412,
    unita: "kWh",
    comeNellaFonte: "441,20 g CO₂/kWh",
    gas: "CO2",
    esercizio: 2024,
    fonte: {
      ente: "AIB — Association of Issuing Bodies",
      pubblicazione: "European Residual Mixes 2024 (versione 1.1 dell'11 agosto 2025)",
      dove: "Tabella 2, riga Italia — mix residuale, emissioni di CO₂",
      pubblicataIl: "30 maggio 2025",
      url: "https://www.aib-net.org/sites/default/files/assets/eecs/Residual%20Mix/2024_Final%20_Residual%20mix%20calculation%20results_11082025.pdf",
    },
  },
  {
    id: "aib-residuale-2025",
    vettore: "energia-elettrica-residuale",
    valore: 0.4202,
    unita: "kWh",
    comeNellaFonte: "420,2 g CO₂/kWh",
    gas: "CO2",
    esercizio: 2025,
    fonte: {
      ente: "AIB — Association of Issuing Bodies",
      pubblicazione: "European Residual Mixes 2025 (versione 1.0)",
      dove: "Tabella 2, riga Italia — mix residuale, emissioni di CO₂",
      pubblicataIl: "28 maggio 2026",
      url: "https://www.aib-net.org/sites/default/files/assets/eecs/Residual%20Mix/AIB_2025_Residual_Mix_Final%20Results_%2026052026.pdf",
    },
    nota:
      "Nella stessa pubblicazione un grafico riporta per l'Italia 428 g CO₂/kWh: la nota 6 della Tabella 2 dichiara corretti i valori della tabella, aggiornati per ultimi.",
  },

  /* ══ Gas naturale — parametri standard nazionali MASE ═══════════════ */
  {
    id: "mase-gas-2021-2023",
    vettore: "gas-naturale",
    valore: 2.019,
    unita: "Smc",
    comeNellaFonte: "2,019 t CO₂/1000 Stdm³",
    gas: "CO2",
    esercizio: 2024,
    fonte: {
      ente: "Ministero dell'Ambiente e della Sicurezza Energetica (dati ISPRA)",
      pubblicazione: "Tabella dei parametri standard nazionali 2021-2023",
      dove: "Gas naturale (metano) — fattore di emissione per 1000 Stdm³, coefficiente di ossidazione 1",
      pubblicataIl: "14 gennaio 2025",
      url: "https://www.ets.minambiente.it/Download/237/Tabella%20coefficienti%20standard%20nazionali%202021-2023_v1.pdf",
    },
  },
  {
    id: "mase-gas-2022-2024",
    vettore: "gas-naturale",
    valore: 2.026,
    unita: "Smc",
    comeNellaFonte: "2,026 t CO₂/1000 Stdm³",
    gas: "CO2",
    esercizio: 2025,
    fonte: {
      ente: "Ministero dell'Ambiente e della Sicurezza Energetica (dati ISPRA)",
      pubblicazione: "Tabella dei parametri standard nazionali 2022-2024",
      dove: "Gas naturale (metano) — fattore di emissione per 1000 Stdm³, coefficiente di ossidazione 1; applicabile alle emissioni dal 1° gennaio al 31 dicembre 2025",
      pubblicataIl: "22 gennaio 2026",
      url: "https://www.ets.minambiente.it/Download/281/Tabella%20coefficienti%20standard%20nazionali%202022-2024.pdf",
    },
  },

  /* ══ Carburanti per litro — DESNZ (già DEFRA) ═══════════════════════ */
  // Le tabelle nazionali danno i carburanti per tonnellata e non pubblicano
  // una densità ufficiale della benzina: un fattore per litro ricavato da
  // noi sarebbe un calcolo spacciato per fonte. Si usano quindi i fattori
  // per litro del governo britannico, nella variante al 100% minerale:
  // quella «media» incorpora la miscela di biocarburanti del mercato
  // britannico, che non è quella italiana. È la scelta prudente — conta
  // tutto il carbonio come fossile — ed è scritta fra le decisioni da rivedere.
  {
    id: "desnz-gasolio-2025",
    vettore: "gasolio",
    valore: 2.66155,
    unita: "l",
    comeNellaFonte: "2,66155 kg CO₂e/litro",
    gas: "CO2e",
    gwp: "IPCC AR5 (CH₄ = 28, N₂O = 265)",
    esercizio: 2025,
    fonte: {
      ente: "UK Department for Energy Security and Net Zero (DESNZ)",
      pubblicazione: "Greenhouse gas reporting: conversion factors 2025 (full set, versione 1)",
      dove: "Foglio Fuels — Liquid fuels — Diesel (100% mineral diesel), litri",
      pubblicataIl: "10 giugno 2025",
      url: "https://www.gov.uk/government/publications/greenhouse-gas-reporting-conversion-factors-2025",
    },
  },
  {
    id: "desnz-benzina-2025",
    vettore: "benzina",
    valore: 2.33984,
    unita: "l",
    comeNellaFonte: "2,33984 kg CO₂e/litro",
    gas: "CO2e",
    gwp: "IPCC AR5 (CH₄ = 28, N₂O = 265)",
    esercizio: 2025,
    fonte: {
      ente: "UK Department for Energy Security and Net Zero (DESNZ)",
      pubblicazione: "Greenhouse gas reporting: conversion factors 2025 (full set, versione 1)",
      dove: "Foglio Fuels — Liquid fuels — Petrol (100% mineral petrol), litri",
      pubblicataIl: "10 giugno 2025",
      url: "https://www.gov.uk/government/publications/greenhouse-gas-reporting-conversion-factors-2025",
    },
  },
  {
    id: "desnz-gpl-2025",
    vettore: "gpl",
    valore: 1.55713,
    unita: "l",
    comeNellaFonte: "1,55713 kg CO₂e/litro",
    gas: "CO2e",
    gwp: "IPCC AR5 (CH₄ = 28, N₂O = 265)",
    esercizio: 2025,
    fonte: {
      ente: "UK Department for Energy Security and Net Zero (DESNZ)",
      pubblicazione: "Greenhouse gas reporting: conversion factors 2025 (full set, versione 1)",
      dove: "Foglio Fuels — Gaseous fuels — LPG, litri",
      pubblicataIl: "10 giugno 2025",
      url: "https://www.gov.uk/government/publications/greenhouse-gas-reporting-conversion-factors-2025",
    },
  },
];

/** Quanti anni indietro si accetta un fattore, quando quello dell'esercizio non c'è ancora. */
export const SCARTO_MASSIMO_ANNI = 2;

export type FattoreScelto = {
  fattore: FattoreEmissione;
  /** Anni fra l'esercizio e il dato usato: zero = dato dello stesso esercizio. */
  scarto: number;
};

/**
 * Il fattore da usare per un vettore in un esercizio.
 *
 * Quello dello stesso esercizio, se c'è. Altrimenti il più recente fra
 * quelli PRECEDENTI, entro due anni — le fonti pubblicano con uno o due
 * anni di ritardo, ed è la pratica dichiarata nel documento. Mai un dato
 * successivo all'esercizio: un inventario 2023 calcolato coi fattori del
 * 2025 descriverebbe una rete che nel 2023 non c'era.
 */
export function fattorePer(vettore: Vettore, esercizio: number): FattoreScelto | undefined {
  const candidati = FATTORI_EMISSIONE.filter(
    (f) => f.vettore === vettore && f.esercizio <= esercizio && esercizio - f.esercizio <= SCARTO_MASSIMO_ANNI,
  ).sort((a, b) => b.esercizio - a.esercizio);
  const fattore = candidati[0];
  return fattore ? { fattore, scarto: esercizio - fattore.esercizio } : undefined;
}

/** Il vettore di un carburante come lo dichiara il registro letto. */
export function vettoreCarburante(carburante: string): Vettore | undefined {
  switch (carburante) {
    case "gasolio":
      return "gasolio";
    case "benzina":
      return "benzina";
    case "gpl":
      return "gpl";
    default:
      return undefined;
  }
}
