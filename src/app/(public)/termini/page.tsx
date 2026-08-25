import type { Metadata } from "next";

import { metadataPagina } from "@/lib/seo";
import { FAIR_USE, USO_TIPICO } from "@/lib/motore/fair-use";

export const metadata: Metadata = metadataPagina({
  title: "Condizioni di servizio",
  description:
    "Le regole che valgono tra te e Ver0: dove stanno i dati, come si revoca l'autorizzazione alle banche dati, a chi scrivere.",
  path: "/termini",
});

/**
 * Le condizioni in forma breve: il funnel le linka già (SPEC §12.T,
 * consenso a). Il contratto integrale lo redige il legale e si consegna
 * prima dell'avvio (SPEC §15.1). Questa pagina dice al presente ciò che
 * vale oggi, senza finto legalese e senza annunci di cantiere.
 */
export default function TerminiPage() {
  // I numeri vengono dalla fonte unica dei limiti: un valore scritto a
  // mano in pagina sarebbe un impegno contrattuale che diverge dal
  // comportamento del prodotto alla prima taratura.
  return (
    <main className="mx-auto max-w-2xl px-5 py-16">
      <h1 className="font-display text-4xl text-ink md:text-5xl">
        Condizioni di servizio
      </h1>
      <p className="mt-4 text-sm leading-relaxed text-gray-warm">
        Queste sono le regole che valgono fra te e Ver0. Il contratto
        integrale, redatto con il nostro legale, te lo consegniamo prima di
        qualunque avvio: nulla parte, e nulla si paga, senza che tu lo abbia
        letto e accettato.
      </p>
      <ul className="mt-6 space-y-2 text-sm text-gray-warm">
        <li>
          · Dal sito si invia una richiesta di attivazione, non un acquisto:
          nessun addebito avviene finché non concordiamo insieme l&apos;inizio
          delle attività.
        </li>
        <li>
          · I dati sono ospitati nell&apos;Unione Europea e trattati secondo il
          GDPR.
        </li>
        <li>
          · L&apos;autorizzazione all&apos;accesso alle banche dati è sempre
          revocabile dal tuo ecosistema; alla revoca la piattaforma
          continua a funzionare con inserimento manuale.
        </li>
        <li>
          · <strong className="font-semibold text-ink">Quanto puoi elaborare</strong>:
          il limite è generoso e sta scritto qui sotto, per non doverlo mai
          scoprire per caso.
        </li>
        <li>
          · Per qualunque domanda:{" "}
          <a
            href="mailto:info@verzero.it"
            className="font-medium text-pine hover:underline"
          >
            info@verzero.it
          </a>
          .
        </li>
      </ul>

      {/* ══ QUANTO PUOI ELABORARE ═══════════════════════════════════
          I limiti stanno scritti in unità che una persona capisce —
          documenti e generazioni — e mai in valuta: quanto ci costa
          leggere un documento è un conto nostro. Il tono non è quello
          di un divieto perché non è un divieto: è la descrizione di
          una dotazione, con la promessa che nulla si ferma di colpo. */}
      <section aria-labelledby="quanto-elabori" className="mt-10 rounded-2xl border border-line bg-paper p-6">
        <h2 id="quanto-elabori" className="font-display text-2xl text-ink">
          Quanto puoi elaborare
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-gray-warm">
          Ogni percorso attivo comprende, per ciascun anno di
          rendicontazione,{" "}
          <strong className="font-semibold text-ink">
            {FAIR_USE.documenti.inclusi} documenti elaborati
          </strong>{" "}
          e{" "}
          <strong className="font-semibold text-ink">
            {FAIR_USE.generazioni.inclusi} generazioni dell&apos;elaborato
          </strong>
          . Le dotazioni dei percorsi si sommano: con tre percorsi attivi hai{" "}
          {FAIR_USE.documenti.inclusi * 3} documenti, da usare dove ti servono.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-gray-warm">
          Sono numeri larghi di proposito. Una pratica completa — un anno di
          bollette, i registri, la visura, i dati di organico — ne consuma
          in media {USO_TIPICO.documenti}: la dotazione è{" "}
          {Math.round(FAIR_USE.documenti.inclusi / USO_TIPICO.documenti)} volte
          tanto, perché non la incontri mai lavorando normalmente.
        </p>

        <h3 className="mt-6 text-sm font-semibold text-ink">
          E se li superi
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-gray-warm">
          Non succede niente di brusco, e soprattutto niente in silenzio.
        </p>
        <ul className="mt-3 space-y-2 text-sm leading-relaxed text-gray-warm">
          <li>
            · <strong className="font-semibold text-ink">Oltre la dotazione</strong>:
            il servizio continua. Le letture entrano in coda e arrivano un po&apos;
            più tardi, tutte. Non devi fare nulla e non paghi nulla in più.
          </li>
          <li>
            · <strong className="font-semibold text-ink">
              Molto oltre
            </strong>{" "}
            (dal doppio della dotazione): ti scriviamo per capire come
            proseguire al meglio. Quello che hai in corso continua: non
            interrompiamo un lavoro a metà.
          </li>
        </ul>
        <p className="mt-3 text-sm leading-relaxed text-gray-warm">
          Nel tuo ecosistema trovi sempre quanti documenti hai elaborato:
          nessuna sorpresa, e nessun conteggio da tenere a mente.
        </p>
      </section>
    </main>
  );
}
