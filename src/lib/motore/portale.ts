import type { DatiLetti } from "@/lib/bozza";
import { tipoDocumento } from "@/lib/documenti";

import { MARCA_CALCOLATO, numeroLeggibile } from "./plausibilita";

/**
 * DAI CAMPI ESTRATTI ALLA PAGINA.
 *
 * Sta qui e non dentro una pagina perché lo usano in tre — la dashboard,
 * la schermata dei percorsi e l'hub documenti — e perché è la parte che
 * si può provare senza banca dati né rete: dentro ci sono le due
 * decisioni che contano, quali campi entrano nella bozza e come si
 * formatta un valore letto.
 */

export type RigaCampo = {
  document_id: string;
  /** Zero per le schede; da 1 in su per le righe di una tabella. */
  riga: number;
  campo: string;
  etichetta: string;
  valore: string | null;
  unita: string | null;
  stato: "da_confermare" | "confermato" | "rifiutato";
};

/**
 * Un valore letto, scritto come lo scriverebbe una persona: le date
 * all'italiana, i numeri con le migliaia separate e l'unità accanto.
 * Nella banca dati resta la forma canonica — un numero formattato non si
 * può più sommare, e una data «12 marzo» non si può più confrontare.
 */
export function formattaValore(valore: string, unita: string | null): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(valore)) {
    const d = new Date(`${valore}T00:00:00Z`);
    if (!Number.isNaN(d.getTime())) {
      return d.toLocaleDateString("it-IT", {
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: "UTC",
      });
    }
  }
  const n = Number(valore);
  if (valore.trim() !== "" && Number.isFinite(n)) {
    return unita ? `${numeroLeggibile(n)} ${unita}` : numeroLeggibile(n);
  }
  if (valore === "non-dichiarato") return "non dichiarata";
  if (valore === "si") return "sì";
  return unita ? `${valore} ${unita}` : valore;
}

/**
 * Raggruppa i campi letti per TIPO di documento, che è la chiave con cui
 * le sezioni della bozza dichiarano cosa aspettano (`attendeTipi`). È
 * così che una bolletta finisce nello Scope 2 e non in fondo alla pagina
 * in un pannello «dati estratti» che non significa niente per chi legge.
 *
 * I campi RIFIUTATI non entrano: il cliente ha detto che sono sbagliati,
 * e riproporli in un documento sarebbe la peggior forma di sordità.
 */
export function raggruppaLetture(
  campi: RigaCampo[],
  tipoPerDocumento: Record<string, string | null>,
): DatiLetti {
  const out: DatiLetti = {};
  /** Le righe di tabella si contano, non si elencano: v. sotto. */
  const conteggi = new Map<string, { confermate: Set<string>; totali: Set<string> }>();

  for (const c of campi) {
    if (c.stato === "rifiutato" || c.valore === null) continue;
    const tipo = tipoPerDocumento[c.document_id];
    if (!tipo) continue;

    const gruppo = (out[tipo] ??= {
      righe: [],
      fonti: [],
      daConfermare: 0,
      confermati: 0,
    });
    const nome = tipoDocumento(tipo)?.nome;
    if (nome && !gruppo.fonti.includes(nome)) gruppo.fonti.push(nome);

    if (c.riga === 0) {
      // SCHEDA: ogni campo è una riga leggibile del foglio-bozza.
      gruppo.righe.push({
        etichetta: c.etichetta,
        valore: formattaValore(c.valore, c.unita),
      });
      if (c.stato === "confermato") gruppo.confermati++;
      else gruppo.daConfermare++;
    } else {
      // TABELLA: nella bozza NON si riversano venti righe per sei
      // colonne. Il foglio è un'anteprima del documento in composizione,
      // non un secondo posto dove rifare la conferma: qui basta sapere
      // quante righe sono entrate e quante aspettano ancora.
      const c2 = conteggi.get(tipo) ?? { confermate: new Set(), totali: new Set() };
      const chiave = `${c.document_id}|${c.riga}`;
      c2.totali.add(chiave);
      if (c.stato === "confermato") c2.confermate.add(chiave);
      conteggi.set(tipo, c2);
    }
  }

  for (const [tipo, c] of conteggi) {
    const gruppo = out[tipo];
    if (!gruppo) continue;
    const totali = c.totali.size;
    const confermate = c.confermate.size;
    gruppo.righe.push({
      etichetta: tipoDocumento(tipo)?.nome ?? tipo,
      valore:
        confermate === totali
          ? `${totali} ${totali === 1 ? "riga" : "righe"}`
          : `${confermate} di ${totali} ${totali === 1 ? "riga" : "righe"} confermate`,
    });
    gruppo.confermati += confermate;
    gruppo.daConfermare += totali - confermate;
  }

  return out;
}

/* ------------------------------------------------------------------ */
/* Come si dice la confidenza a una persona                            */
/* ------------------------------------------------------------------ */

/**
 * Un numero da 0 a 1 non dice niente a chi non lo ha prodotto. Tre
 * livelli sì — e sono asimmetrici di proposito: sopra 0,85 «letto
 * chiaramente», sotto 0,6 «da controllare». Nel mezzo si invita comunque
 * a guardare, perché il costo di un controllo in più è dieci secondi e
 * quello di un dato sbagliato è il documento intero.
 */
export function livelloConfidenza(
  confidenza: number,
): { chiave: "alta" | "media" | "bassa"; etichetta: string } {
  if (confidenza >= 0.85) return { chiave: "alta", etichetta: "letto chiaramente" };
  if (confidenza >= 0.6) return { chiave: "media", etichetta: "da rivedere" };
  return { chiave: "bassa", etichetta: "da controllare" };
}

/* ------------------------------------------------------------------ */
/* Lo stato di UNA CELLA — la verificabilità scesa dove sta il valore   */
/* ------------------------------------------------------------------ */

/** Come è arrivato un valore fin dentro la tabella. */
export type FonteVista = "testo" | "immagine" | "manoscritto" | "calcolato";

/**
 * Quello che si può dire di una cella guardandola.
 *
 * `attenzione` è la sola cosa che decide se la cella si colora: una
 * pagina che segnala tutto non segnala niente. Le celle lette in chiaro
 * restano volutamente mute — l'assenza di marchio È il marchio.
 */
export type StatoCella = {
  chiave: "certa" | "calcolata" | "manoscritta" | "incerta" | "vuota";
  /** La parola accanto al valore. Vuota per le celle certe. */
  etichetta: string;
  /** La frase estesa: titolo del segno e testo per i lettori di schermo. */
  spiega: string;
  attenzione: boolean;
};

export type CellaGiudicabile = {
  valore: string | null;
  confidenza: number;
  fonteLettura: FonteVista;
  calcolato: boolean;
  avvisi: string[];
};

/**
 * IL CALCOLATO SI RICONOSCE ANCHE SENZA LA SUA COLONNA.
 *
 * La colonna `calcolato` esiste nella migrazione, non ancora nel remoto:
 * fino ad allora il fatto viaggia nell'avviso, che è già persistito. Si
 * legge la marca da `plausibilita` invece di ricopiarne la frase, così il
 * giorno in cui la colonna arriva qui non cambia niente.
 */
export function cellaCalcolata(c: {
  calcolato?: boolean | null;
  fonteLettura?: string | null;
  avvisi?: string[] | null;
}): boolean {
  if (c.calcolato === true) return true;
  if (c.fonteLettura === "calcolato") return true;
  return (c.avvisi ?? []).some((a) => a.includes(MARCA_CALCOLATO));
}

/**
 * Il giudizio su una cella, nell'ordine in cui conta per chi guarda:
 * prima se c'è un valore, poi da dove viene, poi quanto è sicuro.
 *
 * L'ordine non è estetico. «Calcolato da noi» viene prima di «scritto a
 * mano» perché è l'unica categoria in cui il documento del cliente NON
 * dice quel valore: è la distinzione che gli abbiamo promesso, e se
 * finisse sotto un'altra etichetta sparirebbe proprio nel caso in cui
 * serve.
 */
export function statoCella(c: CellaGiudicabile): StatoCella {
  if (c.valore === null || c.valore === "") {
    // Una cella vuota CON avviso è un valore che un presidio ha tolto: va
    // guardata. Una cella vuota e basta è una colonna che su quella riga
    // non c'era — chiedere di confermare il nulla è lavoro inventato.
    const tolta = c.avvisi.length > 0;
    return {
      chiave: "vuota",
      etichetta: tolta ? "lasciata vuota" : "",
      spiega: tolta
        ? "Su questa cella il documento non dice abbastanza: l'abbiamo lasciata vuota invece di completarla noi."
        : "Su questa riga questa colonna non è compilata.",
      attenzione: tolta,
    };
  }
  if (cellaCalcolata(c)) {
    return {
      chiave: "calcolata",
      etichetta: "calcolato da noi",
      spiega:
        "Questo valore non è scritto sul documento: l'abbiamo ricavato dalle altre celle. Controllalo.",
      attenzione: true,
    };
  }
  if (c.fonteLettura === "manoscritto") {
    return {
      chiave: "manoscritta",
      etichetta: "scritto a mano",
      spiega:
        "Letto da una scrittura a mano: confrontalo col foglio: nessun automatismo può confermare una grafia.",
      attenzione: true,
    };
  }
  if (c.confidenza < 0.85 || c.avvisi.length > 0) {
    return {
      chiave: "incerta",
      etichetta: livelloConfidenza(c.confidenza).etichetta,
      spiega:
        "Su questa cella la lettura non è netta: guardala sul documento prima di confermarla.",
      attenzione: true,
    };
  }
  return {
    chiave: "certa",
    etichetta: "",
    spiega: "Letto in chiaro sul documento.",
    attenzione: false,
  };
}

/* ------------------------------------------------------------------ */
/* Dalle celle alla riga — un riassunto, non una copia                  */
/* ------------------------------------------------------------------ */

/** Quel tanto di una cella in archivio che serve a riassumere la riga. */
export type CellaArchivio = {
  valore: string | null;
  confidenza: number;
  estrattoDa: string | null;
  fonteLettura: FonteVista;
  avvisi: string[];
  stato: "da_confermare" | "confermato" | "rifiutato";
};

export type RiassuntoRiga = {
  confidenza: number;
  /** Solo se la citazione è davvero di TUTTA la riga. Altrimenti `null`. */
  estrattoDa: string | null;
  fonteLettura: FonteVista;
  stato: "da_confermare" | "confermato" | "rifiutato";
};

/**
 * IL RIASSUNTO DI RIGA SI CALCOLA, NON SI COPIA DALLA PRIMA CELLA.
 *
 * Finché il Motore scriveva la provenienza della riga su tutte le sue
 * celle, leggere la prima e chiamarla «la riga» funzionava per caso.
 * Adesso le celle sono diverse fra loro, e la riga va riassunta con tre
 * regole che stanno tutte dalla parte prudente:
 *
 *   CONFIDENZA   il minimo fra le celle piene: una riga vale quanto la
 *                sua cella più debole, non quanto la media.
 *   CITAZIONE    si mostra come citazione DI RIGA solo se tutte le celle
 *                piene ne portano una identica — che è il caso dei
 *                documenti letti prima, e la ragione per cui restano
 *                leggibili. Se le celle hanno citazioni proprie, quella
 *                di riga non esiste e non se ne inventa una.
 *   MANOSCRITTO  basta UNA cella scritta a mano perché la riga lo sia: il
 *                presidio non si diluisce nella maggioranza.
 *
 * È la funzione che rende dimostrabile la compatibilità: le stesse celle
 * in forma vecchia e in forma nuova devono restare entrambe confermabili.
 */
export function riassumiRiga(celle: CellaArchivio[]): RiassuntoRiga {
  const prima = celle[0];
  const piene = celle.filter((c) => c.valore !== null && c.valore !== "");

  const citazioni = new Set(piene.map((c) => c.estrattoDa ?? ""));

  return {
    confidenza:
      piene.length > 0
        ? Math.min(...piene.map((c) => c.confidenza))
        : (prima?.confidenza ?? 0),
    estrattoDa: citazioni.size === 1 ? ([...citazioni][0] || null) : null,
    fonteLettura: celle.some((c) => c.fonteLettura === "manoscritto")
      ? "manoscritto"
      : (prima?.fonteLettura ?? "testo"),
    stato: celle.some((c) => c.stato === "da_confermare")
      ? "da_confermare"
      : celle.length > 0 && celle.every((c) => c.stato === "rifiutato")
        ? "rifiutato"
        : "confermato",
  };
}
