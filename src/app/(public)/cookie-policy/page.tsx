import type { Metadata } from "next";
import Link from "next/link";

import {
  DaValidare,
  IntestazioneLegale,
  SezioneLegale,
  TabellaLegale,
} from "@/components/legale";
import { PulsanteRivediCookie } from "./rivedi";
import { metadataPagina } from "@/lib/seo";

export const metadata: Metadata = metadataPagina({
  title: "Cookie policy",
  description:
    "Quali cookie usa Ver0 e perché. Oggi solo cookie tecnici necessari: nessuna statistica, nessuna profilazione. Come cambiare la tua scelta in ogni momento.",
  path: "/cookie-policy",
});

const AGGIORNATO = "19 agosto 2026";

/**
 * COOKIE POLICY.
 *
 * Il fatto centrale: oggi non installiamo nulla di non necessario, e per
 * i cookie tecnici il consenso non serve. Il banner esiste perché il
 * giorno in cui aggiungeremo una misurazione la scelta sia già raccolta
 * e rispettata prima che quello script parta.
 */
export default function CookiePolicyPage() {
  return (
    <main className="mx-auto max-w-3xl px-5 py-16">
      <IntestazioneLegale
        titolo="Cookie policy"
        sotto="I cookie sono piccoli file che un sito lascia nel tuo browser. Qui trovi esattamente quali usiamo, a cosa servono e quanto durano — e il modo per cambiare idea in ogni momento."
        aggiornato={AGGIORNATO}
        altra={{ href: "/privacy", label: "Vai all'informativa privacy" }}
      />

      <div className="mt-8 rounded-xl border border-line bg-moss/40 px-5 py-4">
        <p className="text-sm leading-relaxed text-pine-dark">
          <strong className="font-semibold">In breve.</strong> Oggi Ver0 usa
          solo cookie tecnici necessari a farti restare dentro dopo
          l&apos;accesso. Non abbiamo Google Analytics né alcun altro strumento
          di statistica, non abbiamo pixel pubblicitari e non profiliamo
          nessuno. Per i cookie necessari la legge non chiede il consenso:
          chiede di spiegarli, ed è ciò che questa pagina fa.
        </p>
      </div>

      <SezioneLegale id="quali" titolo="Quali cookie troverai davvero">
        <TabellaLegale
          colonne={["Nome", "A cosa serve", "Durata", "Chi lo mette"]}
          righe={[
            [
              <code key="a" className="text-xs">sb-…-auth-token</code>,
              "Tiene aperta la tua sessione dopo l'accesso: senza, dovresti rifare il login a ogni pagina.",
              "Fino a 400 giorni, rinnovato a ogni visita",
              "Ver0 (tramite Supabase)",
            ],
            [
              <code key="b" className="text-xs">vz-consenso</code>,
              "Ricorda la scelta che hai fatto su questa pagina, così non ti richiediamo la stessa cosa ogni volta.",
              "6 mesi",
              "Ver0",
            ],
          ]}
        />
        <p className="mt-4">
          Sono entrambi cookie di prima parte: restano fra il tuo browser e noi,
          nessuno li condivide con terzi per finalità proprie.
        </p>
      </SezioneLegale>

      <SezioneLegale id="perche-banner" titolo="Perché allora c'è un banner">
        <p>
          Perché la scelta va raccolta <em>prima</em>, non dopo. Il giorno in
          cui aggiungeremo uno strumento di misurazione — per capire quali
          pagine aiutano e quali confondono — quel codice non dovrà partire
          senza il tuo sì. Il banner e le preferenze che vedi oggi servono
          esattamente a questo: la macchina del consenso è già montata e
          funzionante, e in assenza di una tua scelta esplicita tutto ciò che
          non è necessario resta spento.
        </p>
        <p>
          Per lo stesso motivo «Accetta tutto» e «Rifiuta i non necessari»
          hanno lo stesso identico peso visivo. Un rifiuto scritto più piccolo o
          più pallido è un consenso estorto, e un consenso estorto non è valido.
        </p>
      </SezioneLegale>

      <SezioneLegale id="cambiare" titolo="Come cambiare la tua scelta">
        <p>
          Da qui, in qualunque momento, oppure dal link «Cookie» in fondo a ogni
          pagina del sito. La revoca dev&apos;essere facile quanto il consenso:
          se non lo fosse, non sarebbe una scelta libera.
        </p>
        <PulsanteRivediCookie />
        <p className="mt-3 text-xs leading-relaxed text-gray-light">
          Puoi anche cancellare o bloccare i cookie dalle impostazioni del tuo
          browser. Attenzione: bloccando quelli necessari l&apos;accesso al
          portale smetterà di funzionare, perché è proprio quel cookie a
          ricordare che sei entrato.
        </p>
      </SezioneLegale>

      <SezioneLegale id="cambiamenti" titolo="Se qualcosa cambierà">
        <p>
          Se aggiungeremo strumenti che richiedono consenso, aggiorneremo questa
          pagina e ti ripresenteremo la scelta prima di attivarli — non dopo. La
          data in cima dice sempre a quando risale l&apos;ultima versione.
        </p>
        <DaValidare>
          l&apos;elenco dei cookie va riverificato a ogni nuovo strumento
          introdotto, e la qualificazione dei cookie di sessione come
          «tecnici» va confermata dal legale insieme all&apos;informativa
          privacy. Da valutare anche se le linee guida del Garante richiedano,
          per il caso specifico, una riproposizione del banner a intervalli
          diversi dai sei mesi previsti qui.
        </DaValidare>
      </SezioneLegale>

      <SezioneLegale id="contatti" titolo="Domande">
        <p>
          Scrivi a{" "}
          <a
            href="mailto:privacy@verzero.it"
            className="font-medium text-pine underline"
          >
            privacy@verzero.it
          </a>
          . Il quadro completo dei trattamenti è nell&apos;{" "}
          <Link href="/privacy" className="font-medium text-pine underline">
            informativa privacy
          </Link>
          .
        </p>
      </SezioneLegale>
    </main>
  );
}
