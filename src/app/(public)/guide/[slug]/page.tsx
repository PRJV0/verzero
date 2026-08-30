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

  const correlate = (g.correlate ?? [])
    .map((c) => getGuida(c))
    .filter((c): c is NonNullable<typeof c> => Boolean(c));

  /*
   * LA MISURA DA LETTURA, e non una colonna qualsiasi.
   *
   * Era `max-w-2xl` (672 px) con il corpo a 15 px: fanno novanta
   * caratteri per riga, cioè venti più del punto in cui l'occhio
   * comincia a perdere l'inizio della riga successiva. Qui il corpo sale
   * a 17,5 px e la colonna scende a 38rem: settanta caratteri, la misura
   * classica del testo lungo.
   *
   * Questa pagina non fa altro che farsi leggere — niente fasce, niente
   * schede, niente alternanza di fondi — quindi la misura è l'unica cosa
   * che deve essere giusta.
   */
  return (
    <main className="mx-auto max-w-[38rem] px-5 py-16 md:py-20">
      <JsonLd
        dati={jsonLdArticle({
          titolo: g.domanda,
          descrizione: g.descrizione,
          path: `/guide/${g.slug}`,
          aggiornatoIl: VERIFICATE_IL.iso,
        })}
      />
      {/* FAQPage: la domanda del titolo con la sua risposta d'apertura,
          più le domande in fondo alla guida. Tutte visibili in pagina,
          carattere per carattere: il markup non dichiara nulla che il
          lettore non trovi. */}
      <JsonLd
        dati={jsonLdFaq([
          { domanda: g.domanda, risposta: g.risposta },
          ...(g.domande ?? []),
        ])}
      />
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
      <h1 className="mt-2 font-display text-[2rem] leading-[1.12] tracking-[-0.015em] text-ink md:text-[2.6rem]">
        {g.domanda}
      </h1>

      {/* La risposta, in apertura e autoconclusiva. */}
      <p className="mt-7 border-l-2 border-mint pl-5 text-[18px] leading-[1.65] text-ink">
        {g.risposta}
      </p>

      {/* Il corpo: solo per le guide che hanno qualcosa da spiegare oltre
          alla risposta. Le altre rispondono e basta. */}
      {g.sezioni?.map((s) => (
        <section key={s.titolo}>
          <h2 className="mt-12 font-display text-[1.5rem] leading-tight text-ink">{s.titolo}</h2>
          {s.paragrafi.map((par) => (
            <p key={par} className="mt-4 text-[17.5px] leading-[1.75] text-gray-warm">
              {par}
            </p>
          ))}
        </section>
      ))}

      <h2 className="mt-12 font-display text-[1.5rem] leading-tight text-ink">
        Che cosa comporta per la tua impresa
      </h2>
      <p className="mt-4 text-[17.5px] leading-[1.75] text-gray-warm">
        {g.comporta}
      </p>

      <h2 className="mt-12 font-display text-[1.5rem] leading-tight text-ink">Dove controllare</h2>
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
      {g.altreFonti?.map((f) => (
        <p key={f.url} className="mt-1.5 text-sm leading-relaxed text-gray-warm">
          <a
            href={f.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-start gap-1 font-medium text-pine hover:underline"
          >
            <span className="min-w-0">{f.testo}</span>
            <ArrowUpRight size={13} aria-hidden className="mt-0.5 shrink-0" />
            <span className="sr-only">(si apre in una nuova scheda)</span>
          </a>
        </p>
      ))}
      <p className="mt-1.5 text-xs text-gray-light">
        Verificata il {VERIFICATE_IL.esteso}.
      </p>

      {/* Le domande in fondo: le stesse marcate in FAQPage. */}
      {g.domande && g.domande.length > 0 && (
        <section aria-labelledby="altre-domande">
          <h2
            id="altre-domande"
            className="mt-9 font-display text-2xl text-ink"
          >
            Altre domande
          </h2>
          <dl className="mt-3 divide-y divide-line border-y border-line">
            {g.domande.map((d) => (
              <div key={d.domanda} className="py-4">
                <dt className="font-display text-lg leading-snug text-ink">
                  {d.domanda}
                </dt>
                <dd className="mt-1.5 text-sm leading-relaxed text-gray-warm">
                  {d.risposta}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      )}

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

      {correlate.length > 0 && (
        <>
          <h2 className="mt-9 font-display text-2xl text-ink">
            Guide collegate
          </h2>
          <ul className="mt-3 space-y-2">
            {correlate.map((c) => (
              <li key={c.slug}>
                <Link
                  href={`/guide/${c.slug}`}
                  className="group flex items-center justify-between gap-3 rounded-xl border border-line bg-white p-4 transition-colors hover:border-pine"
                >
                  <span className="min-w-0">
                    <span className="block font-display text-lg leading-tight text-ink">
                      {c.domanda}
                    </span>
                    <span className="mt-0.5 block text-xs leading-relaxed text-gray-warm">
                      {c.descrizione}
                    </span>
                  </span>
                  <ArrowUpRight
                    size={16}
                    aria-hidden
                    className="shrink-0 text-pine transition-transform group-hover:translate-x-0.5"
                  />
                </Link>
              </li>
            ))}
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
