import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight } from "lucide-react";

import { JsonLd } from "@/components/json-ld";
import { getServizio, titoloServizio } from "@/lib/catalog";
import { GUIDE, VERIFICATE_IL, getGuida } from "@/lib/guide";
import {
  jsonLdArticle,
  jsonLdBreadcrumb,
  jsonLdFaq,
  metadataPagina,
} from "@/lib/seo";

export function generateStaticParams() {
  return GUIDE.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const g = getGuida(slug);
  if (!g) return { title: "Guida non trovata" };
  return metadataPagina({
    // Il titolo È la domanda: è la stringa che deve combaciare con quella
    // che una persona scrive nel motore o chiede a un assistente.
    title: g.domanda,
    description: g.descrizione,
    path: `/guide/${g.slug}`,
  });
}

/**
 * Una guida.
 *
 * ORDINE: la domanda come h1, la risposta autoconclusiva subito sotto,
 * poi cosa comporta, la fonte da aprire e i percorsi pertinenti. Non c'è
 * un paragrafo «il fatto»: c'era, e ripeteva l'apertura parola per
 * parola — la risposta autoconclusiva È già il fatto per esteso. È l'ordine di chi risponde, non quello di chi racconta:
 * chi arriva qui ha già la domanda in testa e vuole la risposta prima
 * della spiegazione — e un assistente che cita la pagina prende le prime
 * righe, non le ultime.
 *
 * DATI STRUTTURATI: `Article` per il contenuto e `FAQPage` con l'unica
 * coppia domanda/risposta che la pagina mostra davvero — il titolo e
 * l'apertura, carattere per carattere. Mai una voce che non sia visibile.
 */
export default async function GuidaPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const g = getGuida(slug);
  if (!g) notFound();

  return (
    <main className="mx-auto max-w-2xl px-5 py-12">
      <JsonLd
        dati={jsonLdArticle({
          titolo: g.domanda,
          descrizione: g.descrizione,
          path: `/guide/${g.slug}`,
          aggiornatoIl: VERIFICATE_IL.iso,
        })}
      />
      <JsonLd dati={jsonLdFaq([{ domanda: g.domanda, risposta: g.risposta }])} />
      <JsonLd
        dati={jsonLdBreadcrumb([
          { nome: "Home", path: "/" },
          { nome: "Guide", path: "/guide" },
          { nome: g.domanda, path: `/guide/${g.slug}` },
        ])}
      />

      <Link
        href="/guide"
        className="inline-flex items-center gap-1.5 text-xs text-gray-warm hover:text-pine"
      >
        <ArrowLeft size={13} aria-hidden /> Tutte le guide
      </Link>

      <p className="mt-6 text-[11px] font-semibold uppercase tracking-widest text-pine">
        {g.chi}
      </p>
      <h1 className="mt-1.5 font-display text-3xl leading-[1.08] text-ink md:text-4xl">
        {g.domanda}
      </h1>

      {/* La risposta, in apertura e autoconclusiva. */}
      <p className="mt-5 border-l-2 border-mint pl-4 text-base leading-relaxed text-ink">
        {g.risposta}
      </p>

      <h2 className="mt-9 font-display text-2xl text-ink">
        Che cosa comporta per la tua impresa
      </h2>
      <p className="mt-2 text-[15px] leading-relaxed text-gray-warm">
        {g.comporta}
      </p>

      <h2 className="mt-7 font-display text-2xl text-ink">Dove controllare</h2>
      <p className="mt-2 text-sm leading-relaxed text-gray-warm">
        <a
          href={g.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-start gap-1 font-medium text-pine hover:underline"
        >
          <span className="min-w-0">{g.fonte}</span>
          <ArrowUpRight size={13} aria-hidden className="mt-0.5 shrink-0" />
          <span className="sr-only">(si apre in una nuova scheda)</span>
        </a>
      </p>
      <p className="mt-1.5 text-xs text-gray-light">
        Verificata il {VERIFICATE_IL.esteso}.
      </p>

      {g.percorsi.length > 0 && (
        <>
          <h2 className="mt-9 font-display text-2xl text-ink">
            I percorsi che rispondono
          </h2>
          <ul className="mt-3 space-y-2">
            {g.percorsi.map((p) => {
              const s = getServizio(p);
              if (!s) return null;
              return (
                <li key={p}>
                  <Link
                    href={`/servizi/${p}`}
                    className="group flex items-center justify-between gap-3 rounded-xl border border-line bg-white p-4 transition-colors hover:border-pine"
                  >
                    <span className="min-w-0">
                      <span className="block font-display text-lg leading-tight text-ink">
                        {titoloServizio(s)}
                      </span>
                      <span className="mt-0.5 block text-xs leading-relaxed text-gray-warm">
                        {s.short}
                      </span>
                    </span>
                    <ArrowUpRight
                      size={16}
                      aria-hidden
                      className="shrink-0 text-pine transition-transform group-hover:translate-x-0.5"
                    />
                  </Link>
                </li>
              );
            })}
          </ul>
        </>
      )}

      <nav
        aria-label="Pagine correlate"
        className="mt-10 flex flex-wrap gap-x-5 gap-y-2 border-t border-line pt-6 text-sm"
      >
        <Link href="/guide" className="font-medium text-pine hover:underline">
          Le altre guide
        </Link>
        <Link href="/servizi" className="font-medium text-pine hover:underline">
          Tutti i percorsi e i prezzi
        </Link>
        <Link href="/contatti" className="font-medium text-pine hover:underline">
          Hai una domanda? Scrivici
        </Link>
      </nav>
    </main>
  );
}
