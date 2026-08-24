import type { DatiLetti } from "@/lib/bozza";
import { tipoDocumento } from "@/lib/documenti";

import { numeroLeggibile } from "./plausibilita";

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

    gruppo.righe.push({
      etichetta: c.etichetta,
      valore: formattaValore(c.valore, c.unita),
    });
    if (c.stato === "confermato") gruppo.confermati++;
    else gruppo.daConfermare++;

    const nome = tipoDocumento(tipo)?.nome;
    if (nome && !gruppo.fonti.includes(nome)) gruppo.fonti.push(nome);
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
