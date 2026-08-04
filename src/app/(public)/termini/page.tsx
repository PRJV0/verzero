import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Condizioni di servizio — Ver0",
  description:
    "Condizioni di servizio della piattaforma Ver0: testo in preparazione, versione definitiva prima dell'attivazione dei pagamenti.",
};

/**
 * Stub delle condizioni di servizio: il funnel di acquisto le linka già
 * (SPEC §12.T, consenso a). Il testo definitivo arriva dal legale prima
 * dell'attivazione dei pagamenti (SPEC §15.1) — fino ad allora questa pagina
 * dichiara apertamente lo stato, senza finti legalese.
 */
export default function TerminiPage() {
  return (
    <main className="mx-auto max-w-2xl px-5 py-14">
      <h1 className="font-display text-4xl text-ink md:text-5xl">
        Condizioni di servizio
      </h1>
      <p className="mt-4 text-sm leading-relaxed text-gray-warm">
        Il testo integrale delle condizioni di servizio e dell&apos;informativa
        privacy è in preparazione con il nostro legale e sarà pubblicato qui
        prima dell&apos;attivazione dei pagamenti. Fino ad allora nessun
        addebito viene effettuato e gli ordini restano «in attivazione».
      </p>
      <ul className="mt-6 space-y-2 text-sm text-gray-warm">
        <li>
          · I dati sono ospitati nell&apos;Unione Europea e trattati secondo il
          GDPR.
        </li>
        <li>
          · L&apos;autorizzazione all&apos;accesso alle banche dati è sempre
          revocabile dall&apos;area riservata; alla revoca la piattaforma
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
