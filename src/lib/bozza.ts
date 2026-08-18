import { getServizio } from "@/lib/catalog";

/**
 * LA BOZZA DEL DOCUMENTO (SPEC §12.G — «mai una checklist vuota»).
 *
 * La schermata di un percorso attivo si apre sul lavoro già svolto: la
 * struttura reale del documento in uscita, con le sezioni già impostate
 * dal Motore, quelle popolate coi dati disponibili (e la provenienza
 * dichiarata) e quelle in attesa — segnate ma visibili, perché il
 * cliente deve vedere la forma del suo documento dal primo minuto.
 *
 * Finché la 2.1 (arricchimento) non è attiva, la precompilazione onesta
 * è: anagrafica dalla registrazione, struttura e riferimenti normativi
 * del percorso già impostati, il resto marcato come lavoro del Motore o
 * in attesa dei documenti del fascicolo.
 */

export type StatoSezione =
  /** Leggibile coi dati veri, provenienza dichiarata. */
  | "popolata"
  /** Struttura e riferimenti già impostati dal Motore. */
  | "impostata"
  /** Visibile ma in attesa: si compila coi documenti del fascicolo. */
  | "in-attesa";

export type SezioneBozza = {
  titolo: string;
  stato: StatoSezione;
  /** Righe leggibili (solo per le sezioni popolate). */
  righe?: { etichetta: string; valore: string }[];
  /** La fonte del contenuto: "registrazione", "UNI EN ISO 14064-1"… */
  fonte?: string;
  /** Per le sezioni in attesa: cosa le sblocca. */
  attende?: string;
};

export type VoceDaFornire = {
  documento: string;
  /** Il perché, sempre: mai il tono del compito assegnato. */
  perche: string;
};

export type Bozza = {
  /** Intestazione del foglio: "Bozza · Inventario GHG 2026". */
  intestazione: string;
  sezioni: SezioneBozza[];
  daFornire: VoceDaFornire[];
};

type DatiOrg = { ragione_sociale: string; partita_iva: string };

const ANNO = 2026;

/** Anagrafica dalla registrazione: la sezione popolata di ogni bozza. */
function sezioneAnagrafica(org: DatiOrg): SezioneBozza {
  return {
    titolo: "Anagrafica e identificazione dell'organizzazione",
    stato: "popolata",
    fonte: "registrazione",
    righe: [
      { etichetta: "Organizzazione", valore: org.ragione_sociale },
      { etichetta: "Partita IVA", valore: org.partita_iva },
      { etichetta: "Anno di riferimento", valore: String(ANNO) },
    ],
  };
}

function bozzaCarbon(org: DatiOrg, conScope3: boolean): Bozza {
  return {
    intestazione: `Bozza · Inventario GHG ${ANNO}`,
    sezioni: [
      sezioneAnagrafica(org),
      {
        titolo: "Perimetro organizzativo e periodo di rendicontazione",
        stato: "impostata",
        fonte: "UNI EN ISO 14064-1:2019 §5",
      },
      {
        titolo: "Metodologia e fattori di emissione",
        stato: "impostata",
        fonte: "GHG Protocol · fattori ISPRA/DEFRA",
      },
      {
        titolo: "Scope 1 — emissioni dirette",
        stato: "in-attesa",
        attende: "registri o fatture dei carburanti",
      },
      {
        titolo: "Scope 2 — energia acquistata (location e market based)",
        stato: "in-attesa",
        attende: "bollette elettriche dei POD attivi",
      },
      ...(conScope3
        ? [
            {
              titolo: "Scope 3 — emissioni indirette di filiera",
              stato: "in-attesa" as const,
              attende: "categorie di spesa dalla contabilità fornitori",
            },
          ]
        : []),
      {
        titolo: "Risultati, intensità emissiva e dichiarazioni",
        stato: "in-attesa",
        attende: "il calcolo sui dati confermati",
      },
    ],
    daFornire: [
      {
        documento: "Bollette di energia elettrica (tutti i POD)",
        perche: "documentano il consumo elettrico per lo Scope 2",
      },
      {
        documento: "Bollette del gas o altri combustibili",
        perche: "servono alle emissioni dirette da riscaldamento (Scope 1)",
      },
      {
        documento: "Registri o fatture dei carburanti",
        perche: "coprono flotta e mezzi d'opera nello Scope 1",
      },
      ...(conScope3
        ? [
            {
              documento: "Categorie di spesa dalla contabilità fornitori",
              perche: "stimano le emissioni di filiera dello Scope 3",
            },
          ]
        : []),
    ],
  };
}

function bozzaVsme(org: DatiOrg, avanzato: boolean): Bozza {
  return {
    intestazione: `Bozza · Bilancio di Sostenibilità (VSME) ${ANNO}`,
    sezioni: [
      sezioneAnagrafica(org),
      {
        titolo: "Struttura del bilancio secondo lo standard EFRAG",
        stato: "impostata",
        fonte: `Standard VSME, modulo base${avanzato ? " + completo" : ""}`,
      },
      {
        titolo: "Indicatori ambientali",
        stato: "in-attesa",
        attende: "i dati dei moduli carbon o le bollette",
      },
      {
        titolo: "Indicatori sociali e di governance",
        stato: "in-attesa",
        attende: "i dati di organico aggregati",
      },
      ...(avanzato
        ? [
            {
              titolo: "Politiche, azioni e obiettivi (modulo completo)",
              stato: "in-attesa" as const,
              attende: "le politiche formalizzate dell'impresa",
            },
          ]
        : []),
      {
        titolo: "Narrativa e prospetto finale",
        stato: "in-attesa",
        attende: "gli indicatori confermati",
      },
    ],
    daFornire: [
      {
        documento: "Dati di organico aggregati",
        perche: "compilano gli indicatori sociali dello standard",
      },
      {
        documento: "Composizione degli organi sociali",
        perche: "serve agli indicatori di governance",
      },
      {
        documento: "Dati ambientali (o modulo carbon attivo)",
        perche: "alimentano la sezione ambientale del bilancio",
      },
      ...(avanzato
        ? [
            {
              documento: "Politiche e obiettivi formalizzati",
              perche: "entrano nel modulo completo per i finanziatori",
            },
          ]
        : []),
    ],
  };
}

function bozzaManualeIso(org: DatiOrg, norma: string, ambito: string): Bozza {
  return {
    intestazione: `Bozza · Manuale del Sistema di Gestione ${ambito}`,
    sezioni: [
      sezioneAnagrafica(org),
      {
        titolo: "Struttura HLS del manuale e politica",
        stato: "impostata",
        fonte: norma,
      },
      {
        titolo: "Contesto dell'organizzazione e parti interessate",
        stato: "in-attesa",
        attende: "visura e organigramma",
      },
      {
        titolo: "Processi, procedure e modulistica operativa",
        stato: "in-attesa",
        attende: "la mappa dei processi (anche in bozza)",
      },
      {
        titolo: "Piano di audit interni e riesame della direzione",
        stato: "impostata",
        fonte: norma,
      },
    ],
    daFornire: [
      {
        documento: "Organigramma aggiornato",
        perche: "definisce ruoli e responsabilità richiesti dalla norma",
      },
      {
        documento: "Mappa dei processi (anche in bozza)",
        perche: "è l'ossatura su cui il Motore costruisce le procedure",
      },
      {
        documento: "Procedure esistenti, se ci sono",
        perche: "si riusano: nessun lavoro fatto due volte",
      },
    ],
  };
}

function bozzaPdr125(org: DatiOrg): Bozza {
  return {
    intestazione: `Bozza · Sistema di Gestione della Parità ${ANNO}`,
    sezioni: [
      sezioneAnagrafica(org),
      {
        titolo: "Le sei aree di KPI della prassi",
        stato: "impostata",
        fonte: "UNI/PdR 125:2022",
      },
      {
        titolo: "KPI quantitativi per area",
        stato: "in-attesa",
        attende: "i dati di organico aggregati",
      },
      {
        titolo: "Politica della parità e piano strategico",
        stato: "in-attesa",
        attende: "le politiche HR esistenti",
      },
      {
        titolo: "Fascicolo per l'audit dell'organismo",
        stato: "in-attesa",
        attende: "le sezioni precedenti confermate",
      },
    ],
    daFornire: [
      {
        documento: "Dati di organico aggregati per genere e inquadramento",
        perche: "alimentano i KPI delle sei aree (mai dati nominativi)",
      },
      {
        documento: "Politiche HR formalizzate",
        perche: "entrano nel sistema di gestione della parità",
      },
    ],
  };
}

/** Fallback onesto per i percorsi senza bozza dedicata: struttura dal
 *  catalogo (gli output del servizio come sezioni). */
function bozzaGenerica(org: DatiOrg, slug: string): Bozza {
  const s = getServizio(slug);
  const output = s?.output ?? [];
  return {
    intestazione: `Bozza · ${s?.name ?? "Documento del percorso"}`,
    sezioni: [
      sezioneAnagrafica(org),
      ...output.slice(0, 4).map(
        (o, i): SezioneBozza => ({
          titolo: o,
          stato: i === 0 ? "impostata" : "in-attesa",
          fonte: i === 0 ? (s?.riferimenti?.[0] ?? undefined) : undefined,
          attende: i === 0 ? undefined : "i documenti del fascicolo",
        }),
      ),
    ],
    daFornire: (s?.documenti ?? []).slice(0, 4).map((d) => ({
      documento: d,
      perche: `entra nel fascicolo di ${s?.name ?? "questo percorso"}`,
    })),
  };
}

/** La bozza del percorso, con la precompilazione onesta di oggi. */
export function bozzaPercorso(slug: string, org: DatiOrg): Bozza {
  switch (slug) {
    case "carbon-footprint-scope-1-2":
    case "percorso-ver0": // il cuore del bundle è l'inventario GHG
      return bozzaCarbon(org, false);
    case "carbon-footprint-scope-1-2-3":
      return bozzaCarbon(org, true);
    case "bilancio-sostenibilita-vsme-base":
      return bozzaVsme(org, false);
    case "bilancio-sostenibilita-vsme-avanzato":
      return bozzaVsme(org, true);
    case "manuale-sistema-gestione-iso-9001":
      return bozzaManualeIso(org, "UNI EN ISO 9001:2015", "ISO 9001");
    case "manuale-sistema-gestione-iso-14001":
      return bozzaManualeIso(org, "UNI EN ISO 14001:2015", "ISO 14001");
    case "manuale-sistema-gestione-iso-45001":
      return bozzaManualeIso(org, "UNI ISO 45001:2018", "ISO 45001");
    case "parita-di-genere-pdr-125":
      return bozzaPdr125(org);
    default:
      return bozzaGenerica(org, slug);
  }
}

/** Percentuale di completamento della bozza: sezioni già composte dal
 *  Motore (popolate + impostate) sul totale. Onesta e già significativa,
 *  perché la struttura È lavoro fatto. */
export function completamentoBozza(bozza: Bozza): number {
  const fatte = bozza.sezioni.filter((s) => s.stato !== "in-attesa").length;
  return Math.round((fatte / bozza.sezioni.length) * 100);
}
