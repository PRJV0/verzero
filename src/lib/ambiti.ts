import { modelliDiAmbito, type ModelloElaborato } from "./elaborati";

/**
 * GLI AMBITI DI CONSULENZA — il livello sopra tutto il resto.
 *
 * Ver0 nasce sulla sostenibilità e sui sistemi di gestione, ma il Motore
 * è una macchina per leggere documenti e comporre elaborati conformi: non
 * ha nulla di specificamente ambientale. Gli ambiti che verranno —
 * Modello 231, privacy e GDPR, sicurezza informatica, e altri che oggi
 * non sappiamo nominare — devono entrare come CONFIGURAZIONE.
 *
 * ═══ CHE COS'È UN AMBITO ═══
 * Quattro elenchi, e nient'altro:
 *   1. i TIPI DI DOCUMENTO che porta con sé (registro del Motore);
 *   2. le NORME di riferimento (registro norme);
 *   3. i MODELLI di elaborato che produce (`elaborati.ts`);
 *   4. i PERCORSI del catalogo che lo vendono.
 *
 * Nessuno dei quattro è codice. La pipeline — riconoscimento, estrazione,
 * validazione, plausibilità, composizione della bozza, controllo di
 * conformità — non sa che gli ambiti esistano: riceve schemi e modelli e
 * li applica.
 *
 * ═══ LA PROVA ═══
 * `scripts/test-ambiti.mjs` aggiunge il **Modello 231** usando solo dati
 * — tipi di documento, norme, modello di elaborato — e verifica che
 * estrazione, composizione e controllo di conformità funzionino senza che
 * una riga della pipeline cambi. Se un domani quella prova richiedesse di
 * toccare la pipeline, sarebbe l'architettura a essere sbagliata, non la
 * prova.
 */

export type Ambito = {
  id: string;
  /** Come si chiama davanti al cliente. */
  nome: string;
  /** Che problema risolve, in una riga. */
  descrizione: string;
  /** Le chiavi dei tipi di documento (src/lib/motore/famiglie.ts). */
  tipiDocumento: string[];
  /** Le designazioni di riferimento (src/lib/norme.ts). */
  norme: string[];
  /** Gli slug del catalogo che vendono questo ambito. */
  percorsi: string[];
  /** Vero quando l'ambito è servito oggi; falso quando è solo previsto. */
  attivo: boolean;
};

export const AMBITI: Ambito[] = [
  {
    id: "sostenibilita",
    nome: "Sostenibilità e rendicontazione",
    descrizione:
      "Misurare e rendicontare l'impronta dell'impresa per banche, committenti e bandi.",
    tipiDocumento: [
      "bolletta-elettrica",
      "bolletta-gas",
      "teleriscaldamento",
      "carburanti",
      "visura",
      "bilancio",
      "organico",
      "formazione",
      "rifiuti",
      "autorizzazioni",
      "questionari-esg",
      "certificato",
      "contratti",
    ],
    norme: ["UNI EN ISO 14064-1:2019", "UNI/TS 11820:2024"],
    percorsi: [
      "percorso-ver0",
      "carbon-footprint-scope-1-2",
      "carbon-footprint-scope-1-2-3",
      "bilancio-sostenibilita-vsme-base",
      "bilancio-sostenibilita-vsme-avanzato",
      "rating-economia-circolare",
    ],
    attivo: true,
  },
  {
    id: "sistemi-gestione",
    nome: "Sistemi di gestione",
    descrizione:
      "Costruire, aggiornare e mantenere i manuali e le procedure che le norme richiedono.",
    tipiDocumento: [
      "visura",
      "organigramma",
      "organico",
      "formazione",
      "procedure",
      "politiche",
      "verbali",
      "manutenzione",
      "dvr",
      "manuale-sistema",
      "certificato",
    ],
    norme: [
      "UNI EN ISO 9001:2015+A1:2024",
      "UNI EN ISO 14001:2026",
      "UNI EN ISO 45001:2023+A1:2024",
      "UNI CEI EN ISO/IEC 27001:2024+A1:2024",
      "UNI/PdR 125:2022",
    ],
    percorsi: [
      "manuale-sistema-gestione-iso-9001",
      "manuale-sistema-gestione-iso-14001",
      "manuale-sistema-gestione-iso-45001",
      "manuale-sistema-gestione-iso-27001",
      "parita-di-genere-pdr-125",
      "aggiornamento-sistema-gestione",
      "iso-45003",
      "iso-30415",
      "sa8000",
      "supporto-audit",
    ],
    attivo: true,
  },
];

const PER_ID = new Map(AMBITI.map((a) => [a.id, a]));

export function ambito(id: string): Ambito | undefined {
  return PER_ID.get(id);
}

/** I modelli di elaborato di un ambito. */
export function elaboratiDiAmbito(id: string): ModelloElaborato[] {
  return modelliDiAmbito(id);
}

/** A quale ambito appartiene un percorso del catalogo. */
export function ambitoDiPercorso(slug: string): Ambito | undefined {
  return AMBITI.find((a) => a.percorsi.includes(slug));
}

/** Gli ambiti che usano un certo tipo di documento: un tipo può servirne più d'uno. */
export function ambitiCheUsano(tipo: string): Ambito[] {
  return AMBITI.filter((a) => a.tipiDocumento.includes(tipo));
}
