import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { JsonLd } from "@/components/json-ld";
import { GUIDE, VERIFICATE_IL } from "@/lib/guide";
import { jsonLdBreadcrumb, metadataPagina } from "@/lib/seo";

export const metadata: Metadata = metadataPagina({
  title: "Guide: perché ti chiedono dati di sostenibilità",
  description:
    "Banche, committenti e bandi chiedono dati di sostenibilità alle imprese. Quattro guide brevi che spiegano perché, con la norma citata e la fonte da controllare.",
  path: "/guide",
});

/**
 * /guide — i contenuti informativi.
 *
 * FUORI DAL MENU, per scelta: la navigazione principale porta a quello
 * che vendiamo, e cinque voci sono già il massimo prima che un menu
 * smetta di orientare. Queste pagine si raggiungono dal footer e dai
 * rimandi contestuali — dalla pagina Servizi e dalle schede — cioè da
 * dove la domanda nasce. E dai motori: sono scritte per essere trovate
 * cercando la domanda, non navigando il sito.
 */
export default function GuidePage() {
  return (
    <main className="mx-auto max-w-3xl px-5 py-16">
      <JsonLd
        dati={jsonLdBreadcrumb([
          { nome: "Home", path: "/" },
          { nome: "Guide", path: "/guide" },
        ])}
      />
      <h1 className="font-display text-4xl leading-[1.05] text-ink md:text-5xl">
        Perché te lo chiedono
      </h1>
      <p className="mt-4 max-w-2xl text-base leading-relaxed text-gray-warm">
        Quando una banca, un committente o un bando chiedono dati di
        sostenibilità, di solito c&apos;è una norma dietro. Qui sotto ci sono
        quattro guide brevi che dicono quale, cosa comporta per la tua impresa
        e dove controllare senza credere a noi.
      </p>

      <ul className="mt-10 space-y-3">
        {GUIDE.map((g) => (
          <li key={g.slug}>
            <Link
              href={`/guide/${g.slug}`}
              className="group block rounded-2xl border border-line bg-white p-5 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-lift"
            >
              <p className="text-[11px] font-semibold uppercase tracking-widest text-pine">
                {g.chi}
              </p>
              <h2 className="mt-1.5 font-display text-xl leading-tight text-ink md:text-2xl">
                {g.domanda}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-gray-warm">
                {g.descrizione}
              </p>
              <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-pine">
                Leggi
                <ArrowRight
                  size={14}
                  aria-hidden
                  className="transition-transform group-hover:translate-x-0.5"
                />
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <p className="mt-8 text-xs text-gray-light">
        Norme e fonti verificate il {VERIFICATE_IL.esteso}. Le norme cambiano:
        se trovi un riferimento superato,{" "}
        <Link href="/contatti" className="font-medium text-pine hover:underline">
          scrivicelo
        </Link>
        .
      </p>

      <nav
        aria-label="Pagine correlate"
        className="mt-8 flex flex-wrap gap-x-5 gap-y-2 border-t border-line pt-6 text-sm"
      >
        <Link href="/servizi" className="font-medium text-pine hover:underline">
          I percorsi e i prezzi
        </Link>
        <Link href="/come-funziona" className="font-medium text-pine hover:underline">
          Come lavoriamo
        </Link>
        <Link href="/sigillo" className="font-medium text-pine hover:underline">
          Che cos&apos;è il Sigillo Ver0
        </Link>
      </nav>
    </main>
  );
}
