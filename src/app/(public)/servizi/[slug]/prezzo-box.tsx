"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Mail } from "lucide-react";

import {
  DIMENSIONI,
  DIMENSIONE_LABEL,
  GRANDE_IMPRESA,
  prezzoPer,
  type Dimensione,
} from "@/lib/pricing";

/**
 * Box prezzo con selettore di dimensione (SPEC §12.X): micro/piccola/media
 * aggiornano il prezzo dalla matrice; grande mostra "su richiesta" con
 * l'aggancio sartoriale e la CTA di contatto. La dimensione scelta si
 * propaga alla CTA (?dimensione=...), pronta per il checkout di fase 2.
 */
export function PrezzoBox({ slug }: { slug: string }) {
  const [dim, setDim] = useState<Dimensione>("micro");
  const prezzo = prezzoPer(slug, dim);

  return (
    <div className="rounded-xl border-2 border-pine bg-white p-4">
      <p className="text-xs text-gray-warm">Dimensione della tua impresa</p>
      <div
        role="radiogroup"
        aria-label="Dimensione della tua impresa"
        className="mt-2 grid grid-cols-4 gap-1"
      >
        {DIMENSIONI.map((d) => {
          const selected = d === dim;
          return (
            <button
              key={d}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => setDim(d)}
              className={
                "rounded-lg border px-1 py-1.5 text-xs font-medium transition-colors " +
                (selected
                  ? "border-pine bg-moss text-pine-dark"
                  : "border-line bg-white text-gray-warm hover:text-pine")
              }
            >
              {DIMENSIONE_LABEL[d]}
            </button>
          );
        })}
      </div>

      <p className="mt-3 text-xs text-gray-warm">Prezzo</p>
      {prezzo ? (
        <>
          <p className="mb-1 font-display text-2xl tabular-nums text-pine">
            {prezzo}
          </p>
          <p className="mb-3 text-xs text-gray-light">
            IVA esclusa · disdici quando vuoi · −10% con pagamento annuale
          </p>
          <Link
            href={`/login?dimensione=${dim}`}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-pine px-4 py-2.5 text-sm font-medium text-white"
          >
            Procedi all&apos;acquisto <ArrowRight size={15} />
          </Link>
        </>
      ) : (
        <>
          <p className="mb-1 font-display text-2xl text-pine">Su richiesta</p>
          <p className="mb-3 text-sm text-gray-warm">{GRANDE_IMPRESA.copy}</p>
          <a
            href={GRANDE_IMPRESA.href}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-pine px-4 py-2.5 text-sm font-medium text-white"
          >
            <Mail size={15} /> {GRANDE_IMPRESA.cta}
          </a>
        </>
      )}
    </div>
  );
}
