import type { Metadata } from "next";
import Link from "next/link";

import { SERVIZI } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Servizi e prezzi — Ver0",
  description:
    "Il catalogo dei servizi Ver0 con prezzi in chiaro: carbon footprint, bilancio VSME, sistemi di gestione ISO, parità di genere, economia circolare.",
};

/** Indice dei servizi: le sei voci del catalogo, ognuna verso il suo dettaglio. */
export default function ServiziPage() {
  return (
    <main className="mx-auto max-w-4xl px-5 py-10">
      <h1 className="text-center font-display text-2xl text-ink md:text-3xl">
        Servizi e prezzi, in chiaro
      </h1>
      <p className="mx-auto mt-2 max-w-lg text-center text-sm text-gray-warm">
        Nessun preventivo da chiedere: attivi quello che ti serve, quando ti
        serve. Ogni servizio riusa i dati che hai già — più moduli attivi, meno
        lavoro per ciascuno.
      </p>

      <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {SERVIZI.map((s) => {
          const Icon = s.icon;
          return (
            <Link
              key={s.slug}
              href={`/servizi/${s.slug}`}
              className={
                "flex flex-col rounded-xl bg-white p-4 transition-shadow hover:shadow-md " +
                (s.featured ? "border-2 border-pine" : "border border-line")
              }
            >
              <div className="mb-2.5 flex items-center justify-between">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-moss text-pine">
                  <Icon size={18} />
                </span>
                {s.featured && (
                  <span className="rounded-full bg-pine px-2.5 py-1 text-xs font-medium text-white">
                    Il più scelto
                  </span>
                )}
              </div>
              <p className="text-sm font-semibold text-ink">{s.name}</p>
              <p className="mb-3 mt-1 flex-1 text-xs text-gray-warm">
                {s.short}
              </p>
              <div className="flex items-center justify-between">
                <p
                  className={
                    "font-display text-lg " +
                    (s.featured ? "text-pine" : "text-ink")
                  }
                >
                  {s.price}
                </p>
                <span
                  className={
                    "rounded-lg border border-pine px-3 py-1.5 text-sm font-medium " +
                    (s.featured ? "bg-pine text-white" : "bg-white text-pine")
                  }
                >
                  Scopri
                </span>
              </div>
            </Link>
          );
        })}
      </div>

      <p className="mt-4 text-center text-xs text-gray-light">
        Prezzi per aziende fino a 50 dipendenti, IVA esclusa · 51-200
        dipendenti: listino +60% · −10% con pagamento annuale
      </p>
    </main>
  );
}
