"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, Mail } from "lucide-react";

import {
  DIMENSIONI,
  DIMENSIONE_LABEL,
  DIMENSIONE_RANGE,
  GRANDE_IMPRESA,
  prezzoPer,
  type Dimensione,
} from "@/lib/pricing";
import { CANONE_INLINE } from "@/lib/canone";

/**
 * Box prezzo con selettore di dimensione (SPEC §12.X, scala micro / +20% /
 * +50% / su richiesta): quattro opzioni impilate con etichetta e range di
 * addetti/fatturato — comode al tocco, niente dropdown — fascia selezionata
 * evidente, prezzo che entra con una transizione visibile a ogni click
 * (key={dim} rimonta il nodo). "Grande" mostra "su richiesta" con la CTA di
 * contatto. La dimensione scelta si propaga alla CTA (?dimensione=...).
 */
export function PrezzoBox({ slug }: { slug: string }) {
  const [dim, setDim] = useState<Dimensione>("micro");
  const prezzo = prezzoPer(slug, dim);

  return (
    <div className="rounded-xl border-2 border-pine bg-white p-4">
      <p className="text-xs font-medium text-gray-warm">
        Dimensione della tua impresa
      </p>
      <div
        role="radiogroup"
        aria-label="Dimensione della tua impresa"
        className="mt-2 space-y-1.5"
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
                "flex w-full items-center justify-between gap-2 rounded-lg border px-3 py-2.5 text-left transition-all " +
                (selected
                  ? "border-pine bg-moss shadow-soft"
                  : "border-line bg-white hover:border-pine/40")
              }
            >
              <span>
                <span
                  className={
                    "block text-sm font-semibold " +
                    (selected ? "text-pine-dark" : "text-ink")
                  }
                >
                  {DIMENSIONE_LABEL[d]}
                </span>
                <span className="block text-xs text-gray-warm">
                  {DIMENSIONE_RANGE[d]}
                </span>
              </span>
              <span
                aria-hidden
                className={
                  "inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors " +
                  (selected
                    ? "border-pine bg-pine text-white"
                    : "border-line text-transparent")
                }
              >
                <Check size={12} />
              </span>
            </button>
          );
        })}
      </div>

      <p className="mt-4 text-xs text-gray-warm">Prezzo</p>
      {prezzo ? (
        <div key={dim} className="vz-price-in">
          <p className="mb-1 font-display text-3xl tabular-nums text-pine">
            {prezzo}
          </p>
          <p className="mb-3 text-xs text-gray-light">
            IVA esclusa · disdici quando vuoi · −10% con pagamento annuale
          </p>
          <Link
            href={`/login?dimensione=${dim}`}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-pine px-4 py-2.5 text-sm font-medium text-white transition-all hover:-translate-y-0.5 hover:shadow-soft"
          >
            Procedi all&apos;acquisto <ArrowRight size={15} />
          </Link>
        </div>
      ) : (
        <div key="grande" className="vz-price-in">
          <p className="mb-1 font-display text-3xl text-pine">Su richiesta</p>
          <p className="mb-3 text-sm text-gray-warm">{GRANDE_IMPRESA.copy}</p>
          <a
            href={GRANDE_IMPRESA.href}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-pine px-4 py-2.5 text-sm font-medium text-white transition-all hover:-translate-y-0.5 hover:shadow-soft"
          >
            <Mail size={15} /> {GRANDE_IMPRESA.cta}
          </a>
        </div>
      )}

      {/* Il pacchetto abbonato, sempre visibile accanto al prezzo (SPEC §12.V) */}
      <p className="mt-3 border-t border-line/70 pt-3 text-xs leading-relaxed text-gray-warm">
        {CANONE_INLINE}{" "}
        <Link href="/#canone" className="font-medium text-pine hover:underline">
          Scopri perché l&apos;abbonamento
        </Link>
      </p>
    </div>
  );
}
