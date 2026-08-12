import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  BookMarked,
  ClipboardList,
  FileCheck2,
  Info,
  LifeBuoy,
  ListOrdered,
  Sparkles,
} from "lucide-react";

import { JsonLd } from "@/components/json-ld";
import {
  RICHIAMO_SUPPORTO_AUDIT,
  SERVIZI,
  SERVIZI_CERTIFICABILI,
  SOLO_STANDARD_UFFICIALI,
  getServizio,
} from "@/lib/catalog";
import { prezzoDa, prezzoDettaglio, prezzoUnaTantum } from "@/lib/pricing";
import { jsonLdBreadcrumb, jsonLdService, metadataPagina } from "@/lib/seo";

import { PrezzoBox } from "./prezzo-box";

/** Pre-genera le pagine di dettaglio a build time. */
export function generateStaticParams() {
  return SERVIZI.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const s = getServizio(slug);
  if (!s) return { title: "Servizio non trovato" };
  // La description nasce dalla riga breve del catalogo, non dal paragrafo
  // "cos'è": quello supera i 300 caratteri e verrebbe troncato a metà frase.
  const prezzo = prezzoDa(s.slug);
  const descrizione = `${s.short}${prezzo ? ` Prezzo pubblico ${prezzo}, per fascia dimensionale.` : ""}`;
  // I nomi brevi da soli fanno un titolo povero: si allungano con ciò che
  // la pagina offre davvero. Quelli già lunghi restano come sono.
  const titolo =
    s.name.length >= 30 ? s.name : `${s.name} — prezzi e come funziona`;
  return metadataPagina({
    title: titolo,
    description: descrizione.slice(0, 160),
    path: `/servizi/${s.slug}`,
  });
}

/**
 * Pagina servizio con la struttura fissa §12.Q:
 * cos'è / come funziona con Ver0 / cosa ottieni / requisiti e vincoli /
 * Opportunità (che resta in ogni pagina).
 */
export default async function ServizioPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const s = getServizio(slug);
  if (!s) notFound();

  // Prezzo di partenza (fascia micro): è quello che dichiariamo nei dati
  // strutturati, coerente con il "da" mostrato in vetrina.
  const canone = prezzoDettaglio(s.slug, "micro");
  const unaTantum = prezzoUnaTantum(s.slug, "micro");

  return (
    <main className="mx-auto max-w-3xl px-4 pb-12 pt-6">
      {/* Dati strutturati: il servizio con la sua offerta in fascia micro,
          la stessa esposta in pagina come prezzo di partenza. */}
      <JsonLd
        dati={jsonLdService({
          nome: s.name,
          descrizione: s.short,
          path: `/servizi/${s.slug}`,
          offerta: canone
            ? { tipo: "canone", mensile: canone.mensile }
            : unaTantum !== null
              ? { tipo: "una-tantum", importo: unaTantum }
              : null,
        })}
      />
      <JsonLd
        dati={jsonLdBreadcrumb([
          { nome: "Home", path: "/" },
          { nome: "Servizi", path: "/servizi" },
          { nome: s.name, path: `/servizi/${s.slug}` },
        ])}
      />

      <Link
        href="/servizi"
        className="mb-4 flex items-center gap-1.5 text-xs text-gray-warm hover:text-pine"
      >
        <ArrowLeft size={13} /> Tutti i servizi
      </Link>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {/* Colonna contenuti */}
        <div className="md:col-span-2">
          <h1 className="mb-1 font-display text-3xl text-ink md:text-4xl">
            {s.name}
          </h1>
          {/* §12.I: il taglio è la riga secondaria, mai parte del nome. */}
          {s.taglio && (
            <p className="mb-1 text-sm font-semibold uppercase tracking-wide text-pine">
              {s.taglio}
            </p>
          )}
          {s.copre && (
            <div className="mb-2 mt-2 flex flex-wrap gap-1.5">
              {s.copre.map((c) => (
                <span
                  key={c}
                  className="rounded-full border border-mint/40 bg-moss px-2.5 py-1 text-xs font-medium text-pine"
                >
                  {c}
                </span>
              ))}
            </div>
          )}

          {/* Cos'è */}
          <p className="mb-4 text-sm leading-relaxed text-gray-warm">
            {s.cosE}
          </p>

          {/* Perimetro del servizio: quando c'è un confine, si dichiara qui,
              subito, non in fondo tra i vincoli (§12.M — DVR escluso). */}
          {s.perimetro && (
            <div className="mb-4 flex items-start gap-3 rounded-xl border border-amber-ink/25 bg-amber-soft p-4">
              <Info size={16} className="mt-0.5 shrink-0 text-amber-ink" />
              <p className="text-sm leading-relaxed text-amber-ink">
                <strong className="font-semibold">Perimetro del servizio: </strong>
                {s.perimetro}
              </p>
            </div>
          )}

          {/* Come funziona con Ver0 */}
          <div className="mb-3 rounded-xl border border-line bg-white p-4">
            <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-ink">
              <ListOrdered size={15} className="text-pine" /> Come funziona con
              Ver0
            </p>
            <ol className="space-y-1.5 text-sm text-gray-warm">
              {s.comeFunziona.map((x, i) => (
                <li key={x} className="flex items-start gap-2">
                  <span
                    aria-hidden
                    className="mt-0.5 inline-flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full bg-moss text-[10px] font-semibold text-pine"
                    style={{ height: 18, width: 18 }}
                  >
                    {i + 1}
                  </span>
                  {x}
                </li>
              ))}
            </ol>
          </div>

          {/* Cosa ti chiederemo — raccolta documentale guidata (§12.P) */}
          <div className="mb-3 rounded-xl border border-line bg-white p-4">
            <p className="mb-1 flex items-center gap-2 text-sm font-semibold text-ink">
              <ClipboardList size={15} className="text-pine" /> Cosa ti
              chiederemo
            </p>
            <p className="mb-2 text-xs text-gray-warm">
              Il Motore Ver0 non accetta documenti qualsiasi: per questo
              percorso chiede esattamente questi, li legge e segnala cosa manca.
            </p>
            <ul className="space-y-1.5 text-sm text-gray-warm">
              {s.documenti.map((d) => (
                <li key={d} className="flex items-start gap-2">
                  <ClipboardList
                    size={15}
                    className="mt-0.5 shrink-0 text-mint"
                  />
                  {d}
                </li>
              ))}
            </ul>
          </div>

          {/* Cosa ottieni */}
          <div className="mb-3 rounded-xl border border-line bg-white p-4">
            <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-ink">
              <FileCheck2 size={15} className="text-pine" /> Cosa ottieni
            </p>
            <div className="space-y-1.5 text-sm text-gray-warm">
              {s.output.map((x) => (
                <p key={x} className="flex items-start gap-2">
                  <FileCheck2 size={15} className="mt-0.5 shrink-0 text-pine" />{" "}
                  {x}
                </p>
              ))}
            </div>
          </div>

          {/* Requisiti e vincoli */}
          <div className="mb-3 rounded-xl border border-line bg-paper p-4">
            <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-ink">
              <Info size={15} className="text-gray-warm" /> Requisiti e vincoli
            </p>
            <div className="space-y-1.5 text-sm text-gray-warm">
              {s.requisiti.map((x) => (
                <p key={x} className="flex items-start gap-2">
                  <span
                    aria-hidden
                    className="mt-2 h-1 w-1 shrink-0 rounded-full bg-gray-warm"
                  />
                  {x}
                </p>
              ))}
            </div>
          </div>

          {/* Riferimenti normativi — solo standard ufficiali (§12.P) */}
          <div className="mb-3 rounded-xl border border-pine/20 bg-white p-4">
            <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-ink">
              <BookMarked size={15} className="text-pine" /> Riferimenti
            </p>
            <div className="flex flex-wrap gap-1.5">
              {s.riferimenti.map((r) => (
                <span
                  key={r}
                  className="rounded-full border border-line bg-paper px-2.5 py-1 text-xs text-pine"
                >
                  {r}
                </span>
              ))}
            </div>
            <p className="mt-2 text-xs leading-relaxed text-gray-warm">
              {SOLO_STANDARD_UFFICIALI}
            </p>
          </div>

          {/* Opportunità (resta in ogni pagina, §12.Q) */}
          <div className="rounded-xl bg-moss p-4">
            <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-pine-dark">
              <Sparkles size={15} className="text-mint" /> Opportunità
            </p>
            <div className="space-y-1.5 text-sm text-pine">
              {s.opportunita.map((x) => (
                <p key={x} className="flex items-start gap-2">
                  <Sparkles size={15} className="mt-0.5 shrink-0 text-mint" />{" "}
                  {x}
                </p>
              ))}
            </div>
          </div>
        </div>

        {/* Box prezzo con selettore di dimensione (matrice §12.X, ciclo §12.Q) */}
        <div>
          <PrezzoBox slug={s.slug} />
          <p className="mt-3 text-center text-xs text-gray-light">
            Dati ospitati in UE · dietro lo schermo ci sono sempre persone
          </p>

          {/* Link interni verso le pagine correlate (regola SEO §seo.ts) */}
          <nav
            aria-label="Pagine correlate"
            className="mt-4 flex flex-col gap-1.5 border-t border-line pt-4 text-sm"
          >
            <Link
              href="/sigillo"
              className="font-medium text-pine hover:underline"
            >
              Come si ottiene il Sigillo Ver0
            </Link>
            <Link
              href="/chi-siamo"
              className="font-medium text-pine hover:underline"
            >
              Chi verifica i documenti
            </Link>
            <Link
              href="/contatti"
              className="font-medium text-pine hover:underline"
            >
              Hai una domanda su questo servizio?
            </Link>
          </nav>
        </div>
      </div>

      {/* Richiamo al supporto all'audit sui soli percorsi certificabili:
          l'audit lo fa un organismo terzo, noi adeguiamo i documenti. */}
      {SERVIZI_CERTIFICABILI.includes(s.slug) && (
        <section className="mx-auto mt-12 max-w-5xl px-5">
          <div className="flex flex-col gap-4 rounded-2xl border border-line bg-paper p-5 sm:flex-row sm:items-center">
            <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-moss text-pine">
              <LifeBuoy size={20} />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-ink">
                {RICHIAMO_SUPPORTO_AUDIT.titolo}
              </p>
              <p className="mt-1 text-sm leading-relaxed text-gray-warm">
                {RICHIAMO_SUPPORTO_AUDIT.testo}
              </p>
            </div>
            <Link
              href={`/servizi/${RICHIAMO_SUPPORTO_AUDIT.slug}`}
              className="inline-flex shrink-0 items-center gap-1.5 self-start rounded-lg border border-pine px-4 py-2 text-sm font-medium text-pine transition-all hover:-translate-y-0.5 hover:shadow-soft sm:self-auto"
            >
              {RICHIAMO_SUPPORTO_AUDIT.cta} <ArrowRight size={15} />
            </Link>
          </div>
        </section>
      )}
    </main>
  );
}
