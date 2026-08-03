import Link from "next/link";
import { ArrowRight, Leaf, Mail } from "lucide-react";

import { VETRINA } from "@/lib/catalog";
import { GRANDE_IMPRESA, prezzoDa } from "@/lib/pricing";

/**
 * Vetrina a catalogo per categorie (SPEC §12.Y): Sostenibilità nei tre
 * pilastri E/S/G + famiglia Sistemi di gestione. Voci attive con
 * "da X €/mese" (X = fascia micro dalla matrice §12.X) e link al dettaglio;
 * voci di roadmap marcate "In arrivo", non cliccabili verso l'acquisto.
 * Il Percorso Ver0 resta in evidenza come bundle sopra il catalogo;
 * sotto, l'aggancio sartoriale per la grande impresa.
 */
export function CatalogoVetrina() {
  return (
    <div>
      {/* Bundle in evidenza */}
      <Link
        href="/servizi/percorso-ver0"
        className="group flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-white p-5 shadow-soft ring-2 ring-pine transition-all hover:-translate-y-0.5 hover:shadow-lift"
      >
        <div className="flex min-w-0 items-center gap-4">
          <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-moss text-pine">
            <Leaf size={20} />
          </span>
          <div className="min-w-0">
            <span className="rounded-full bg-pine px-2.5 py-0.5 text-xs font-medium text-white">
              Il più scelto
            </span>
            <p className="mt-1 font-display text-xl text-ink">Percorso Ver0</p>
            <p className="text-sm text-gray-warm">
              Piattaforma + carbon footprint + bilancio VSME. La via diretta al
              Sigillo.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <p className="font-display text-lg tabular-nums text-pine">
            {prezzoDa("percorso-ver0")}
          </p>
          <span className="inline-flex items-center gap-1 rounded-lg bg-pine px-3.5 py-2 text-sm font-medium text-white">
            Scopri{" "}
            <ArrowRight
              size={14}
              className="transition-transform group-hover:translate-x-0.5"
            />
          </span>
        </div>
      </Link>

      {/* Catalogo per categorie */}
      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        {VETRINA.map((cat) => (
          <section
            key={cat.key}
            className="rounded-2xl border border-line/70 bg-white shadow-soft"
          >
            <header className="border-b border-line/70 px-5 py-3.5">
              <h3 className="font-display text-lg text-ink">{cat.title}</h3>
              <p className="text-xs text-gray-warm">{cat.sub}</p>
            </header>
            <ul>
              {cat.voci.map((v, i) => {
                const inner = (
                  <>
                    <div className="min-w-0">
                      <p
                        className={
                          "text-sm font-medium " +
                          (v.roadmap ? "text-gray-warm" : "text-ink")
                        }
                      >
                        {v.name}
                      </p>
                      <p className="text-xs text-gray-warm">{v.benefit}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      {v.roadmap ? (
                        <span className="rounded-full border border-line bg-paper px-2.5 py-1 text-xs text-gray-warm">
                          In arrivo
                        </span>
                      ) : (
                        <span className="text-sm font-medium tabular-nums text-pine">
                          {v.slug ? prezzoDa(v.slug) : null}
                        </span>
                      )}
                    </div>
                  </>
                );
                const rowClass =
                  "flex items-center justify-between gap-3 px-5 py-3" +
                  (i > 0 ? " border-t border-line/60" : "");
                return (
                  <li key={v.name}>
                    {v.slug && !v.roadmap ? (
                      <Link
                        href={`/servizi/${v.slug}`}
                        className={rowClass + " transition-colors hover:bg-moss/40"}
                      >
                        {inner}
                      </Link>
                    ) : (
                      <div className={rowClass}>{inner}</div>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>

      {/* Aggancio grande impresa (§12.X) */}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3 rounded-2xl border border-line/70 bg-paper px-5 py-4 text-center">
        <p className="text-sm text-gray-warm">{GRANDE_IMPRESA.copy}</p>
        <a
          href={GRANDE_IMPRESA.href}
          className="inline-flex items-center gap-1.5 rounded-lg border border-pine bg-white px-3.5 py-2 text-sm font-medium text-pine"
        >
          <Mail size={14} /> {GRANDE_IMPRESA.cta}
        </a>
      </div>
    </div>
  );
}
