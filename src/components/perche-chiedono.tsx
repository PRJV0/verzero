import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { getServizio, titoloServizio } from "@/lib/catalog";
import { RICHIESTE } from "@/lib/richieste";

/**
 * PERCHÉ LE RICHIESTE STANNO AUMENTANDO.
 *
 * Sostituisce lo schema «qualcuno ti chiede una prova»: quello diceva in
 * forma astratta ciò che il selettore per situazione, poco più sotto, fa
 * già in concreto. Qui ogni riga porta un fatto con la sua fonte — i
 * contenuti e la regola di scrittura stanno in `src/lib/richieste.ts`.
 *
 * IL LINK ALLA FONTE È PARTE DEL CONTENUTO, non una cortesia: una pagina
 * che cita una norma senza dire dove controllarla chiede di essere
 * creduta sulla parola, ed è esattamente il contrario di quello che
 * vendiamo. Va fuori sito, quindi si apre in una scheda nuova e lo
 * dichiara a chi non vede l'icona.
 *
 * I percorsi collegati restano DISCRETI: la riga serve a capire il
 * contesto, non a spingere. Il catalogo comincia dopo.
 */
export function PercheChiedono() {
  return (
    <section
      aria-labelledby="perche-chiedono"
      className="rounded-3xl border border-line bg-white p-5 shadow-soft sm:p-7"
    >
      <h2
        id="perche-chiedono"
        className="font-display text-2xl leading-tight text-ink sm:text-3xl"
      >
        Perché le richieste di dati alle imprese stanno aumentando
      </h2>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-gray-warm">
        Quattro fatti con la norma o la fonte accanto, così puoi
        controllarli senza credere a noi.
      </p>

      <ol className="mt-6 space-y-3">
        {RICHIESTE.map((r) => (
          <li
            key={r.chi}
            className="rounded-2xl border border-line bg-paper p-4 sm:p-5"
          >
            <p className="text-[11px] font-semibold uppercase tracking-widest text-pine">
              {r.chi}
            </p>
            <p className="mt-1.5 text-sm leading-relaxed text-ink">{r.fatto}</p>
            <p className="mt-2.5 border-l-2 border-mint/50 pl-3 text-sm leading-relaxed text-gray-warm">
              {r.comporta}
            </p>

            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-line pt-2.5">
              <a
                href={r.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-start gap-1 text-[11px] leading-relaxed text-gray-light hover:text-pine hover:underline"
              >
                <span className="min-w-0">{r.fonte}</span>
                <ArrowUpRight size={11} aria-hidden className="mt-0.5 shrink-0" />
                <span className="sr-only">(si apre in una nuova scheda)</span>
              </a>
              {r.percorsi.map((slug) => {
                const s = getServizio(slug);
                if (!s) return null;
                return (
                  <Link
                    key={slug}
                    href={`/servizi/${slug}`}
                    className="text-[11px] font-semibold text-pine hover:underline"
                  >
                    {titoloServizio(s)} →
                  </Link>
                );
              })}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
