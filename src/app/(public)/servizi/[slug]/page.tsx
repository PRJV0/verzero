import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  FileCheck2,
  Info,
  ListOrdered,
  Sparkles,
} from "lucide-react";

import { SERVIZI, getServizio } from "@/lib/catalog";

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
  if (!s) return { title: "Servizio non trovato — Ver0" };
  return {
    title: `${s.name} — Ver0`,
    description: s.cosE,
  };
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

  return (
    <main className="mx-auto max-w-3xl px-4 pb-12 pt-6">
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
        </div>
      </div>
    </main>
  );
}
