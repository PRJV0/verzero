import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, FileCheck2, Sparkles } from "lucide-react";

import { SERVIZI, getServizio } from "@/lib/catalog";

import { PrezzoBox } from "./prezzo-box";

/** Pre-genera le sei pagine di dettaglio a build time. */
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
    description: s.desc,
  };
}

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
          <h1 className="mb-1 font-display text-2xl text-ink">{s.name}</h1>
          <p className="mb-4 text-sm text-gray-warm">{s.desc}</p>

          {/* Cosa ottieni */}
          <div className="mb-3 rounded-xl border border-line bg-white p-4">
            <p className="mb-2 text-sm font-semibold text-ink">Cosa ottieni</p>
            <div className="space-y-1.5 text-sm text-gray-warm">
              {s.output.map((x) => (
                <p key={x} className="flex items-start gap-2">
                  <FileCheck2
                    size={15}
                    className="mt-0.5 shrink-0 text-pine"
                  />{" "}
                  {x}
                </p>
              ))}
            </div>
          </div>

          {/* Perché conviene adesso (ganci) */}
          <div className="mb-3 rounded-xl bg-moss p-4">
            <p className="mb-2 text-sm font-semibold text-pine-dark">
              Perché conviene adesso
            </p>
            <div className="space-y-1.5 text-sm text-pine">
              {s.ganci.map((x) => (
                <p key={x} className="flex items-start gap-2">
                  <Sparkles size={15} className="mt-0.5 shrink-0 text-mint" />{" "}
                  {x}
                </p>
              ))}
            </div>
          </div>

          {/* Quanto tempo ti chiede */}
          <div className="rounded-xl border border-line bg-white p-4">
            <p className="mb-2 text-sm font-semibold text-ink">
              Quanto tempo ti chiede
            </p>
            <p className="text-sm text-gray-warm">{s.effort}</p>
          </div>
        </div>

        {/* Box prezzo con selettore di dimensione (matrice §12.X) */}
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
