import Link from "next/link";
import { ArrowRight, Leaf, Mail } from "lucide-react";

import { ContaNumero } from "@/components/conta-numero";
import { VETRINA, getServizio } from "@/lib/catalog";
import {
  GRANDE_IMPRESA,
  RINNOVO_LIBERO,
  prezzoDettaglio,
  prezzoUnaTantum,
} from "@/lib/pricing";
import { CANONE_INLINE } from "@/lib/canone";

const eur = (n: number) => n.toLocaleString("it-IT");

/**
 * Vetrina a catalogo per categorie (SPEC §12.Y): Sostenibilità nei tre
 * pilastri E/S/G + famiglia Sistemi di gestione.
 *
 * Card con spinta: ombre stratificate e sollevamento marcato all'hover,
 * gerarchia del prezzo (canone grande, ciclo di vita §12.Q leggibile),
 * badge di famiglia colorato, icona del servizio, CTA sempre presente.
 * Il Percorso Ver0 domina visivamente la griglia.
 */

/** Colore del badge di famiglia: un tocco, non un baraccone. */
const FAMIGLIA_STILE: Record<string, string> = {
  ambiente: "bg-mint/15 text-pine",
  sociale: "bg-amber-soft text-amber-ink",
  governance: "bg-moss text-pine-dark",
  "sistemi-di-gestione": "bg-pine/10 text-pine",
};

const FAMIGLIA_LABEL: Record<string, string> = {
  ambiente: "Ambiente · E",
  sociale: "Sociale · S",
  governance: "Governance · G",
  "sistemi-di-gestione": "Sistemi di gestione",
};

/** Riga compatta del ciclo di vita per le card (§12.Q), fascia micro. */
function cicloVitaCompatto(slug: string): string | null {
  const p = prezzoDettaglio(slug, "micro");
  if (!p) return null;
  return p.rinnovoTipo === "mantenimento"
    ? `dal 2° anno ${eur(p.rinnovoMensile)} €/mese`
    : `−20% al rinnovo (${eur(p.rinnovoMensile)} €/mese)`;
}

export function CatalogoVetrina() {
  const percorso = prezzoDettaglio("percorso-ver0", "micro");

  return (
    <div>
      {/* Bundle in evidenza — dominante sulla griglia */}
      <Link
        href="/servizi/percorso-ver0"
        className="group relative block overflow-hidden rounded-3xl bg-pine-deep p-6 shadow-lift transition-all hover:-translate-y-1 sm:p-8"
      >
        <span
          aria-hidden
          className="pointer-events-none absolute -right-10 -top-16 select-none font-display text-[16rem] leading-none text-white/[0.04]"
        >
          0
        </span>
        <div className="relative flex flex-wrap items-end justify-between gap-6">
          <div className="min-w-0 max-w-md">
            {/* Etichetta fattuale (§12.M): mai diciture di domanda non
                verificabili — qui il fatto è che il bundle unisce tre servizi. */}
            <span className="inline-flex items-center gap-1.5 rounded-full bg-mint-bright/20 px-3 py-1 text-xs font-semibold text-mint-bright">
              <Leaf size={13} /> Tre servizi in uno
            </span>
            <p className="mt-3 font-display text-3xl text-white md:text-4xl">
              Percorso Ver0
            </p>
            <p className="mt-2 text-sm leading-relaxed text-moss">
              Carbon Footprint Scope 1 e 2 + Bilancio di Sostenibilità (VSME) +
              miglioramento score rating. Un solo inserimento dati.
            </p>
          </div>
          <div className="min-w-0 shrink-0">
            {percorso && (
              <>
                <p className="font-display text-4xl tabular-nums text-white">
                  <ContaNumero valore={percorso.mensile} /> €
                  <span className="text-lg text-moss">/mese</span>
                </p>
                <p className="mt-0.5 text-xs leading-relaxed text-moss">
                  {cicloVitaCompatto("percorso-ver0")}
                  <br />
                  oppure {eur(percorso.annuale)} €/anno · −10% · risparmi{" "}
                  {eur(percorso.risparmio)} €
                </p>
              </>
            )}
            <span className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-pine transition-transform group-hover:translate-x-0.5">
              Scopri il Percorso <ArrowRight size={15} />
            </span>
          </div>
        </div>
      </Link>

      {/* Catalogo per categorie */}
      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        {VETRINA.map((cat) => (
          <section
            key={cat.key}
            className="rounded-2xl border border-line/70 bg-white shadow-soft"
          >
            <header className="flex items-center justify-between gap-3 border-b border-line/70 px-5 py-3.5">
              <div>
                <h3 className="font-display text-lg text-ink">{cat.title}</h3>
                <p className="text-xs text-gray-warm">{cat.sub}</p>
              </div>
              <span
                className={
                  "shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold " +
                  (FAMIGLIA_STILE[cat.key] ?? "bg-moss text-pine")
                }
              >
                {FAMIGLIA_LABEL[cat.key] ?? cat.title}
              </span>
            </header>
            <ul>
              {cat.voci.map((v, i) => {
                const servizio = v.slug ? getServizio(v.slug) : undefined;
                const Icon = servizio?.icon;
                const p = v.slug ? prezzoDettaglio(v.slug, "micro") : null;
                const unaTantum = v.slug
                  ? prezzoUnaTantum(v.slug, "micro")
                  : null;

                const inner = (
                  <>
                    <div className="flex min-w-0 items-start gap-3">
                      {Icon && !v.roadmap && (
                        <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-moss text-pine transition-colors group-hover/row:bg-pine group-hover/row:text-white">
                          <Icon size={16} />
                        </span>
                      )}
                      <div className="min-w-0">
                        {/* §12.I: nome tecnico completo dal catalogo (fonte
                            unica), taglio come riga secondaria. Il nome della
                            voce vetrina resta solo per le voci di roadmap. */}
                        <p
                          className={
                            "text-sm font-semibold " +
                            (v.roadmap ? "text-gray-warm" : "text-ink")
                          }
                        >
                          {servizio?.name ?? v.name}
                        </p>
                        {servizio?.taglio && (
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-pine">
                            {servizio.taglio}
                          </p>
                        )}
                        <p className="mt-0.5 text-xs leading-relaxed text-gray-warm">
                          {v.benefit}
                        </p>
                        {/* Etichette solo fattuali (§12.M) */}
                        {v.etichetta && (
                          <span className="mt-1.5 inline-block rounded-full bg-moss px-2 py-0.5 text-[10px] font-semibold text-pine">
                            {v.etichetta}
                          </span>
                        )}
                        {/* Perimetro dichiarato anche qui, in forma breve:
                            è un punto di contatto come gli altri. */}
                        {servizio?.perimetroBreve && (
                          <span className="mt-1 block text-[11px] leading-relaxed text-amber-ink">
                            {servizio.perimetroBreve}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="w-full shrink-0 pl-11 text-left sm:w-auto sm:pl-0 sm:text-right">
                      {v.roadmap ? (
                        <span className="rounded-full border border-line bg-paper px-2.5 py-1 text-xs text-gray-warm">
                          In arrivo
                        </span>
                      ) : (
                        <>
                          {/* Canone oppure one-shot: mai un "/mese" orfano. */}
                          <span className="block font-display text-lg tabular-nums text-pine">
                            {p ? (
                              <>
                                {eur(p.mensile)} €
                                <span className="text-xs text-gray-warm">
                                  /mese
                                </span>
                              </>
                            ) : unaTantum !== null ? (
                              <>
                                {eur(unaTantum)} €
                                <span className="block text-xs text-gray-warm">
                                  una tantum
                                </span>
                              </>
                            ) : null}
                          </span>
                          <span className="block text-xs text-gray-warm">
                            {p && v.slug ? cicloVitaCompatto(v.slug) : null}
                          </span>
                          <span className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-pine">
                            Scopri
                            <ArrowRight
                              size={12}
                              className="transition-transform group-hover/row:translate-x-0.5"
                            />
                          </span>
                        </>
                      )}
                    </div>
                  </>
                );

                // Nomi tecnici lunghi (§12.I): su mobile il prezzo scende
                // sotto il nome, allineato al testo — mai una parola per riga.
                const rowClass =
                  "group/row flex flex-wrap items-center justify-between gap-x-3 gap-y-2 px-5 py-4" +
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

      {/* Il pacchetto abbonato accanto ai prezzi /mese (§12.V) + rinnovo libero (§12.Q) */}
      <p className="mt-4 text-center text-xs leading-relaxed text-gray-warm">
        {RINNOVO_LIBERO} {CANONE_INLINE}{" "}
        <Link href="/#canone" className="font-medium text-pine hover:underline">
          Perché l&apos;abbonamento
        </Link>
      </p>

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
