import type { VoceLeggibile } from "./famiglie";

/**
 * QUALE MODELLO PER QUALE COMPITO (docs/motore.md §9).
 *
 * Finora girava tutto sul modello di punta, e su una bolletta nativa —
 * dieci campi scritti in chiaro — è come mandare un perito a leggere un
 * cartello. La scelta per compito non è un compromesso sulla qualità: è
 * il riconoscimento che i compiti sono diversi.
 *
 *   LEGGERO      trascrizione da un documento nativo, schema semplice:
 *                il valore è scritto lì, e leggerlo non richiede di
 *                ragionare.
 *   INTERMEDIO   il caso normale: tabelle, scansioni, schemi larghi.
 *                Serve capire la struttura, non solo copiarla.
 *   SUPERIORE    manoscritto, documenti-OPERA, analisi degli
 *                scostamenti: i casi in cui la differenza fra modelli
 *                non è stilistica ma è il numero di campi giusti.
 *
 * ═══ L'ESCALATION È CIÒ CHE RENDE SICURA LA SCELTA ═══
 * Un modello leggero che sbaglia in silenzio sarebbe il peggior modo di
 * risparmiare. Per questo la scelta non è definitiva: se la prima
 * lettura torna con confidenza bassa o senza i campi essenziali, si
 * rilegge con il livello sopra. Si paga il prezzo pieno **solo quando
 * serve** — e il costo di una lettura leggera buttata via è qualche
 * millesimo, mentre il costo di un dato sbagliato è il documento intero.
 *
 * La regola implicita, che vale la pena rendere esplicita: **la qualità
 * non si contratta, il costo sì**. Se i numeri dicessero che il livello
 * leggero sbaglia più di rado di quanto costi rileggere, resterebbe; se
 * dicessero il contrario, si toglie. Si decide sui numeri, e i numeri li
 * dà il log tecnico.
 */

export type Livello = "leggero" | "intermedio" | "superiore";

export const MODELLO_DI_LIVELLO: Record<Livello, string> = {
  leggero: "claude-haiku-4-5",
  intermedio: "claude-sonnet-5",
  superiore: "claude-opus-5",
};

/**
 * CHE COSA ACCETTA CIASCUN LIVELLO.
 *
 * Non tutti i modelli prendono gli stessi parametri, e scoprirlo a
 * runtime significa un 400 e una lettura persa: Haiku 4.5 rifiuta sia
 * `output_config.effort` sia il ragionamento adattivo (verificato il 25
 * agosto 2026, `invalid_request_error`). Dichiararlo qui costa una riga
 * e trasforma un errore in una scelta.
 *
 * È anche coerente col compito: al livello leggero chiediamo di
 * trascrivere quello che c'è scritto, e per trascrivere non serve
 * ragionare.
 */
export const CAPACITA_DI_LIVELLO: Record<
  Livello,
  { ragionamentoAdattivo: boolean; effort: boolean }
> = {
  leggero: { ragionamentoAdattivo: false, effort: false },
  intermedio: { ragionamentoAdattivo: true, effort: true },
  superiore: { ragionamentoAdattivo: true, effort: true },
};

/** Il livello sopra, per l'escalation. `null` se siamo già in cima. */
export function livelloSuperiore(l: Livello): Livello | null {
  return l === "leggero" ? "intermedio" : l === "intermedio" ? "superiore" : null;
}

/** Oltre questo numero di campi, lo schema non è più «semplice». */
const CAMPI_SEMPLICI = 12;

export type ContestoScelta = {
  /** Il PDF ha uno strato di testo (rilevato in locale). */
  nativo: boolean;
  /** Il tipo è dichiarato come spesso manoscritto. */
  manoscrittoAtteso: boolean;
};

/**
 * Il livello di partenza. Dichiarativo: legge la voce del registro — che
 * già dice famiglia, forma e attesa di qualità — e non contiene nessuna
 * conoscenza di dominio.
 */
export function livelloIniziale(
  voce: VoceLeggibile,
  ctx: ContestoScelta,
): Livello {
  // OPERA è analisi, non trascrizione: la struttura di un manuale non si
  // legge, si ricostruisce.
  if (voce.famiglia === "opera") return "superiore";

  // Il manoscritto è il caso in cui un modello meno capace non sbaglia di
  // poco: sbaglia una cifra, che è un ordine di grandezza.
  if (ctx.manoscrittoAtteso) return "superiore";

  // Un documento non nativo va interpretato: la posizione sulla pagina è
  // metà dell'informazione.
  if (!ctx.nativo) return "intermedio";

  // Nativo, a campi fissi, schema corto: è trascrizione.
  if (voce.forma === "scheda" && voce.campi.length <= CAMPI_SEMPLICI) {
    return "leggero";
  }

  return "intermedio";
}

/** Il tipo è dichiarato come spesso o quasi sempre manoscritto? */
export function manoscrittoAtteso(voce: VoceLeggibile): boolean {
  return voce.attesa.manoscritto === "prevalente" || voce.attesa.manoscritto === "frequente";
}

/* ------------------------------------------------------------------ */
/* Quando conviene rileggere con il livello sopra                      */
/* ------------------------------------------------------------------ */

/** Sotto questa confidenza media, la lettura non è abbastanza sicura. */
export const CONFIDENZA_MINIMA = 0.75;

export type Misura = {
  /** Quanti campi (o righe) hanno un valore. */
  letti: number;
  /** Quanti ne erano attesi. */
  attesi: number;
  /** Quanti campi ESSENZIALI sono rimasti vuoti. */
  essenzialiMancanti: number;
  confidenzaMedia: number;
  /** La lettura ha trovato qualcosa che non torna. */
  conAvvisi: number;
};

export type Escalation =
  | { serve: false }
  | { serve: true; motivo: string; verso: Livello };

/**
 * Serve rileggere con un modello più capace?
 *
 * Tre ragioni, in ordine di gravità: manca un campo essenziale (la
 * lettura non è servita a niente), la confidenza media è sotto soglia
 * (il modello stesso dice di non essere sicuro), oppure è tornato meno
 * della metà di quello che il documento dovrebbe contenere.
 *
 * Pura, così si prova senza rete.
 */
export function serveEscalation(
  livello: Livello,
  m: Misura,
  esitoBuono: boolean,
): Escalation {
  const verso = livelloSuperiore(livello);
  if (!verso) return { serve: false };

  // Un esito non buono che NON dipende dal modello — documento di altro
  // tipo, illeggibile — non si rilegge: fallirebbe uguale e costerebbe
  // due volte.
  if (!esitoBuono) return { serve: false };

  if (m.essenzialiMancanti > 0) {
    return {
      serve: true,
      verso,
      motivo: `${m.essenzialiMancanti} campi essenziali non letti`,
    };
  }
  if (m.confidenzaMedia < CONFIDENZA_MINIMA) {
    return {
      serve: true,
      verso,
      motivo: `confidenza media ${m.confidenzaMedia.toFixed(2)} sotto ${CONFIDENZA_MINIMA}`,
    };
  }
  if (m.attesi > 0 && m.letti / m.attesi < 0.5) {
    return {
      serve: true,
      verso,
      motivo: `letti ${m.letti} valori su ${m.attesi}`,
    };
  }
  return { serve: false };
}
