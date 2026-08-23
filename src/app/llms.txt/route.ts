import { SERVIZI, titoloServizio } from "@/lib/catalog";
import { GUIDE } from "@/lib/guide";
import { PAGINE_PUBBLICHE } from "@/lib/pagine-pubbliche";
import { prezzoDa } from "@/lib/pricing";
import { SITO } from "@/lib/seo";

/**
 * /llms.txt — l'indice del sito scritto per un modello.
 *
 * CHE COS'È, ONESTAMENTE. Una convenzione emergente, non uno standard:
 * nessun fornitore garantisce oggi di leggerlo, e nessuno ha dimostrato
 * che porti visibilità. Lo pubblichiamo per due ragioni entrambe modeste
 * e verificabili: il costo di manutenzione è nullo — si genera dalle
 * stesse fonti di sitemap e catalogo, quindi non può invecchiare da solo
 * — e se un giorno verrà letto, sarà già lì. Nessuna aspettativa di
 * effetto immediato: se fra sei mesi la convenzione sarà morta, questo
 * file si cancella in un minuto e non lascia debiti.
 *
 * COSA CI SCRIVIAMO. Solo ciò che è già pubblico e già vero altrove: la
 * descrizione dell'entità (la stessa dei dati strutturati), le pagine con
 * una riga ciascuna, i percorsi con il prezzo di partenza e le norme.
 * Nessun contenuto che esista solo qui: un file che dice cose che il sito
 * non dice è un file che mente appena qualcuno lo controlla.
 *
 * COSA NON CI SCRIVIAMO. Le aree transazionali e private, che restano
 * escluse ovunque, e le mappature operative documento → norma → sezione
 * (regola in CLAUDE.md): un indice per modelli non è una scorciatoia per
 * pubblicare ciò che abbiamo deciso di non pubblicare.
 */

export const dynamic = "force-dynamic";

export function GET() {
  const url = (path: string) => `${SITO.url}${path}`;

  const righe: string[] = [
    `# ${SITO.nome}`,
    "",
    `> ${SITO.descrizione}`,
    "",
    SITO.contesto,
    "",
    "## Pagine principali",
    "",
    ...PAGINE_PUBBLICHE.map(
      (p) => `- [${p.titolo}](${url(p.path)}): ${p.riga}`,
    ),
    "",
    "## Percorsi di qualifica",
    "",
    ...SERVIZI.map((s) => {
      const prezzo = prezzoDa(s.slug);
      const norme = s.riferimenti.join("; ");
      return (
        `- [${titoloServizio(s)}](${url(`/servizi/${s.slug}`)}): ${s.short}` +
        (prezzo ? ` Prezzo pubblico ${prezzo} (IVA esclusa), per fascia dimensionale.` : "") +
        (norme ? ` Riferimenti normativi: ${norme}.` : "")
      );
    }),
    "",
    "## Guide",
    "",
    ...GUIDE.map((g) => `- [${g.domanda}](${url(`/guide/${g.slug}`)}): ${g.descrizione}`),
    "",
    "## Note",
    "",
    `- Contatto: ${SITO.email}`,
    "- Le pagine di acquisto, di accesso e l'area riservata non sono indicizzate e non compaiono in questo indice.",
    "- I prezzi indicati sono il punto di partenza della fascia micro (fino a 9 addetti); il prezzo esatto per ogni fascia è pubblicato sulla pagina del percorso.",
    "- I documenti prodotti sono di parte prima: l'eventuale certificazione è rilasciata da un organismo accreditato al termine di un audit, e non è compresa nei percorsi.",
    "",
  ];

  return new Response(righe.join("\n"), {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      // Un indice che cambia con il catalogo: un giorno di cache basta e
      // avanza, e toglie il file dal percorso critico di ogni scansione.
      "cache-control": "public, max-age=0, s-maxage=86400",
    },
  });
}
