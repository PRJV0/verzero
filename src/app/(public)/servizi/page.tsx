import type { Metadata } from "next";
import Link from "next/link";

import { CatalogoVetrina } from "@/components/catalogo-vetrina";
import { JsonLd } from "@/components/json-ld";
import { jsonLdBreadcrumb, metadataPagina } from "@/lib/seo";

export const metadata: Metadata = metadataPagina({
  title: "Servizi e prezzi in chiaro, per ogni dimensione",
  description:
    "Il catalogo Ver0 per categorie: ambiente, sociale, governance e sistemi di gestione. Prezzi pubblici per fascia dimensionale, nessun preventivo da chiedere.",
  path: "/servizi",
});

/** Indice dei servizi: catalogo per categorie (SPEC §12.Y), prezzi dalla matrice. */
export default function ServiziPage() {
  return (
    <main className="mx-auto max-w-4xl px-5 py-10">
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
        Nessun preventivo da chiedere: attivi quello che ti serve, quando ti
        serve. Ogni servizio riusa i dati che hai già — più moduli attivi, meno
        lavoro per ciascuno.
      </p>

      <div className="mt-8">
        <CatalogoVetrina />
      </div>

      <p className="mt-4 text-center text-xs text-gray-light">
        Prezzi &quot;da&quot; riferiti alla fascia micro, IVA esclusa · il
        prezzo per la tua dimensione si compone nella pagina del servizio ·
        −10% con pagamento annuale
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
