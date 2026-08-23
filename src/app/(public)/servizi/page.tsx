import type { Metadata } from "next";
import Link from "next/link";

import { CatalogoFamiglie } from "@/components/catalogo-famiglie";
import { JsonLd } from "@/components/json-ld";
import { PercheChiedono } from "@/components/perche-chiedono";
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
 * ORDINE DELLA PAGINA: prima i fatti — perché le richieste di dati alle
 * imprese stanno aumentando, con la norma accanto — poi il catalogo. Si
 * apriva sull'elenco, cioè sulla risposta prima della domanda: chi
 * arriva qui non cerca un listino, cerca di capire se questa roba serve
 * al suo problema.
 *
 * Al posto dei fatti c'era uno schema — chi ti valuta, e le tre famiglie
 * come risposte. Vero, e inutile: diceva in forma astratta quello che il
 * selettore per situazione fa già in concreto due schermate più giù.
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
        I percorsi che qualificano la tua impresa.
      </h1>
      <p className="mx-auto mt-3 max-w-2xl text-center text-sm leading-relaxed text-gray-warm">
        Scegli quello che ti serve: prezzo, perimetro e norme di riferimento
        sono scritti prima di iniziare. Ogni percorso riusa i dati che hai già,
        così il secondo costa meno lavoro del primo.
      </p>

      <div className="mt-8">
        <PercheChiedono />
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
