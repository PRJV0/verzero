import { titoloServizio, type Servizio } from "@/lib/catalog";
import {
  DIMENSIONE_RANGE,
  prezzoDettaglio,
  prezzoUnaTantum,
} from "@/lib/pricing";

/**
 * LE DOMANDE FREQUENTI DI UN PERCORSO, composte dal catalogo.
 *
 * ═══ PERCHÉ ESISTONO ═══
 *
 * Un motore di ricerca manda una persona sulla pagina; un assistente
 * legge la pagina e RISPONDE al posto suo. Cambia cosa deve fare il
 * testo: non basta più essere convincente scorrendolo dall'alto, deve
 * poter essere ESTRATTO a pezzi. Una frase come «costa 45 € al mese» è
 * inutilizzabile fuori dal suo paragrafo — 45 € al mese di che cosa, per
 * chi, IVA compresa? — mentre «il Carbon Footprint di Organizzazione di
 * Verzero costa 45 € al mese, IVA esclusa, per le microimprese fino a 9
 * addetti» regge da sola dentro una risposta altrui.
 *
 * ═══ LA REGOLA DI SCRITTURA ═══
 *
 * Ogni risposta nomina il soggetto (Verzero) e l'oggetto (il percorso per
 * esteso), e non rimanda mai a ciò che sta sopra o sotto in pagina.
 * Niente «questo servizio», niente «come visto», niente «il prezzo
 * indicato». Se una frase non si può ritagliare e incollare altrove senza
 * diventare ambigua, qui non ci va.
 *
 * ═══ COMPOSTE, NON SCRITTE A MANO ═══
 *
 * Vengono dal catalogo e dal listino, che sono già le fonti uniche. Un
 * testo scritto a mano per quattordici percorsi sarebbe, alla seconda
 * revisione di prezzo, quattordici testi che dicono il falso. Qui un
 * prezzo cambia in `pricing.ts` e cambia anche nelle risposte.
 *
 * ═══ VINCOLI ═══
 *
 * - Nessuna quantificazione di tempo o impegno del cliente (SPEC §12.O).
 * - Nessun confronto economico con il mercato (CLAUDE.md).
 * - Nessuna mappatura documento → norma → sezione: si dice che i
 *   documenti li chiede il portale dopo l'attivazione, non quali sono.
 * - Mai «certificato»: i documenti sono di parte prima (SPEC §13.7).
 * - Le domande e le risposte generate qui sono le STESSE mostrate in
 *   pagina e le stesse marcate con FAQPage. Il markup non può dichiarare
 *   nulla che non sia visibile: è una violazione delle linee guida, e
 *   soprattutto è una bugia verificabile in tre secondi.
 */

export type DomandaRisposta = { domanda: string; risposta: string };

const eur = (n: number) => n.toLocaleString("it-IT");

/**
 * Le fasce al plurale.
 *
 * `DIMENSIONE_LABEL` non serve qui: è l'etichetta singolare del selettore
 * («Micro», «Piccola»), e infilata in una frase produce «per le piccola
 * imprese». In una risposta destinata a essere citata altrove, un errore
 * di concordanza è la prima cosa che si nota.
 */
const FASCIA_PLURALE: Record<"micro" | "piccola" | "media", string> = {
  micro: "microimprese",
  piccola: "piccole imprese",
  media: "medie imprese",
};

/** «45 €/mese per le microimprese (fino a 9 addetti)». */
function rigaFascia(slug: string, dim: "micro" | "piccola" | "media"): string | null {
  const p = prezzoDettaglio(slug, dim);
  const unaTantum = prezzoUnaTantum(slug, dim);
  const etichetta = `${FASCIA_PLURALE[dim]} (${DIMENSIONE_RANGE[dim]})`;
  if (unaTantum !== null) return `${eur(unaTantum)} € per le ${etichetta}`;
  if (p) return `${eur(p.mensile)} €/mese per le ${etichetta}`;
  return null;
}

function rispostaPrezzo(s: Servizio): string | null {
  const titolo = titoloServizio(s);
  const fasce = (["micro", "piccola", "media"] as const)
    .map((d) => rigaFascia(s.slug, d))
    .filter((r): r is string => r !== null);
  if (fasce.length === 0) return null;

  const unaTantum = prezzoUnaTantum(s.slug, "micro") !== null;
  const micro = prezzoDettaglio(s.slug, "micro");

  const apertura = unaTantum
    ? `Il ${titolo} di Verzero si paga una tantum, senza canone`
    : `Il ${titolo} di Verzero ha un canone pubblico, scritto sul sito prima di attivare`;

  const rinnovo =
    micro && !unaTantum
      ? ` Dal secondo anno il canone scende a ${eur(micro.rinnovoMensile)} €/mese in fascia micro, e il rinnovo resta libero: nessun vincolo dopo i primi dodici mesi.`
      : "";

  return (
    `${apertura}: ${fasce.join(", ")}. Tutti gli importi sono IVA esclusa. ` +
    `Per le grandi imprese (250+ addetti) il percorso è su misura e il prezzo si concorda.${rinnovo}`
  );
}

export function faqServizio(s: Servizio): DomandaRisposta[] {
  const titolo = titoloServizio(s);
  const voci: DomandaRisposta[] = [];

  const prezzo = rispostaPrezzo(s);
  if (prezzo) {
    voci.push({ domanda: `Quanto costa il ${titolo}?`, risposta: prezzo });
  }

  voci.push({
    domanda: `A chi serve il ${titolo}?`,
    risposta: `${s.perChi} Verzero lo eroga in tutta Italia, dalla microimpresa alla grande impresa.`,
  });

  voci.push({
    domanda: `Che cosa consegna Verzero con il ${titolo}?`,
    risposta: `Con il ${titolo} Verzero consegna: ${s.output
      .map((o) => o.replace(/\.$/, ""))
      .join("; ")}. Ogni documento dichiara la norma su cui è costruito e riporta la fonte di ogni dato.`,
  });

  if (s.riferimenti.length > 0) {
    voci.push({
      domanda: `Su quali norme è costruito il ${titolo}?`,
      risposta: `Il ${titolo} di Verzero è costruito su ${s.riferimenti.join(
        ", ",
      )}. Verzero lavora solo su standard e norme riconosciute: nessun protocollo proprietario inventato da noi.`,
    });
  }

  // Cosa serve dall'impresa: il METODO, mai la lista dei documenti — che
  // è mappatura operativa e vive nel portale (regola in CLAUDE.md).
  voci.push({
    domanda: `Che cosa serve dall'impresa per il ${titolo}?`,
    risposta:
      `Per il ${titolo} servono di norma documenti che l'impresa ha già in azienda. ` +
      `Dopo l'attivazione il portale di Verzero li chiede uno per uno, li legge e segnala che cosa manca; le banche dati ufficiali le interroga Verzero, sul mandato che l'impresa rilascia e che può revocare in qualunque momento.` +
      (s.requisiti[0] ? ` ${s.requisiti[0].replace(/\.$/, "")}.` : ""),
  });

  if (s.perimetro) {
    voci.push({
      domanda: `Che cosa non è compreso nel ${titolo}?`,
      // Il perimetro è scritto per la pagina, dove il titolo sta sopra:
      // estratto da solo perderebbe il soggetto. Qui glielo si rimette.
      risposta: `Il ${titolo} di Verzero ha un perimetro dichiarato prima dell'attivazione. ${s.perimetro.replace(
        /\.$/,
        "",
      )}.`,
    });
  }

  return voci;
}
