import type { Metadata } from "next";
import Link from "next/link";

import { CatalogoFamiglie } from "@/components/catalogo-famiglie";
import { JsonLd } from "@/components/json-ld";
import { SchemaQualifica } from "@/components/schema-qualifica";
import { jsonLdBreadcrumb, metadataPagina } from "@/lib/seo";

export const metadata: Metadata = metadataPagina({
  title: "Servizi e prezzi in chiaro, per ogni dimensione",
  description:
    "Misura e rendiconta, sistemi certificabili, qualifica e accesso: i percorsi Verzero con prezzo a partire da e perimetro scritti prima di iniziare.",
  path: "/servizi",
});

/**
 * Indice dei servizi.
 *
 * ORDINE DELLA PAGINA: prima lo schema — chi ti valuta e cosa può
 * rispondere la tua impresa — poi il catalogo. Si apriva sull'elenco,
 * cioè sulla risposta prima della domanda: chi arriva qui non cerca un
 * listino, cerca di capire se questa roba serve al suo problema.
 *
 * Il catalogo è raggruppato per NATURA della qualifica e non più per
 * pilastri E/S/G (SPEC §12.Y.1): i pilastri reggevano come tassonomia e
 * non come guida alla scelta, e facevano comparire lo stesso servizio in
 * due famiglie diverse.
 */
export default function ServiziPage() {
  return (
    <main className="mx-auto max-w-4xl px-5 py-16">
      <JsonLd
        dati={jsonLdBreadcrumb([
          { nome: "Home", path: "/" },
          { nome: "Servizi", path: "/servizi" },
        ])}
      />
      <h1 className="text-center font-display text-4xl text-ink md:text-5xl">
        Servizi, con i prezzi in chiaro
      </h1>
      <p className="mx-auto mt-3 max-w-xl text-center text-sm text-gray-warm">
        Per ogni percorso trovi scritto prima il prezzo e il perimetro: cosa
        produce, e dove si ferma. Attivi quello che ti serve, quando ti serve,
        e ogni servizio riusa i dati che hai già — più percorsi attivi, meno
        lavoro per ciascuno.
      </p>

      <div className="mt-8">
        <SchemaQualifica />
      </div>

      <div className="mt-10">
        <CatalogoFamiglie />
      </div>

      <p className="mt-6 text-center text-xs leading-relaxed text-gray-light">
        Gli importi «a partire da» sono quelli della fascia micro, IVA esclusa:
        il prezzo cresce con la dimensione dell&apos;impresa e si compone per
        intero nella pagina del percorso · −10% con pagamento annuale
      </p>

      {/* Link interni verso le pagine correlate (regola SEO §seo.ts) */}
      <nav
        aria-label="Pagine correlate"
        className="mt-8 flex flex-wrap justify-center gap-x-5 gap-y-2 border-t border-line pt-6 text-sm"
      >
        <Link href="/sigillo" className="font-medium text-pine hover:underline">
          Che cos&apos;è il Sigillo Ver0
        </Link>
        <Link
          href="/chi-siamo"
          className="font-medium text-pine hover:underline"
        >
          Come lavoriamo
        </Link>
        <Link href="/partner" className="font-medium text-pine hover:underline">
          Programma partner
        </Link>
        <Link href="/contatti" className="font-medium text-pine hover:underline">
          Hai una domanda? Scrivici
        </Link>
      </nav>
    </main>
  );
}
