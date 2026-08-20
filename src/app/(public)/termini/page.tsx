import type { Metadata } from "next";

import { metadataPagina } from "@/lib/seo";

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
    </main>
  );
}
