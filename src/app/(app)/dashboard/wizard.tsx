"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { ArrowRight, Building2, ClipboardList, Route, X } from "lucide-react";

import { segnaWizardVisto } from "./azioni";

/**
 * Wizard di primo accesso (SPEC §12.H): tre passi, mostrato una sola
 * volta (profiles.wizard_visto_at), sempre saltabile. Non è un modale
 * bloccante: è un benvenuto che accompagna, sopra la Panoramica.
 *
 * Passi: CONFERMA I TUOI DATI → ECCO IL TUO PERCORSO → COSA SERVE DA TE.
 */
export function WizardPrimoAccesso({
  ragioneSociale,
  partitaIva,
  percorsi,
  documenti,
}: {
  ragioneSociale: string;
  partitaIva: string;
  /** I nomi dei percorsi attivi (vuoto: si parte dal catalogo). */
  percorsi: string[];
  /** I documenti richiesti dal primo percorso attivo. */
  documenti: string[];
}) {
  const [passo, setPasso] = useState(0);
  const [chiuso, setChiuso] = useState(false);
  const [, avvia] = useTransition();

  // «Mostrato una sola volta» alla lettera: si marca visto al primo
  // render, non alla chiusura. Chi naviga via senza chiuderlo non se lo
  // ritrova a ogni visita; se il salvataggio fallisse, ricomparire una
  // volta è il fallimento più benigno possibile.
  useEffect(() => {
    avvia(() => segnaWizardVisto());
  }, [avvia]);

  if (chiuso) return null;

  const chiudi = () => setChiuso(true);

  const PASSI = [
    {
      icona: Building2,
      titolo: "Conferma i tuoi dati",
      contenuto: (
        <div>
          <p className="text-sm leading-relaxed text-gray-warm">
            Questa è la tua impresa come l&apos;hai registrata. Dalla sezione
            «La tua impresa» potrai vedere ogni dato con la sua provenienza —
            e presto il Motore recupererà il resto per te.
          </p>
          <dl className="mt-3 space-y-1.5 rounded-xl bg-paper p-4 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-gray-warm">Ragione sociale</dt>
              <dd className="font-semibold text-ink">{ragioneSociale}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-gray-warm">Partita IVA</dt>
              <dd className="font-semibold tabular-nums text-ink">
                {partitaIva}
              </dd>
            </div>
          </dl>
          <span className="mt-2 inline-block rounded-full bg-moss px-2.5 py-1 text-[11px] font-semibold text-pine">
            Inserito da te · registrazione
          </span>
        </div>
      ),
    },
    {
      icona: Route,
      titolo: "Ecco il tuo percorso",
      contenuto: (
        <div>
          {percorsi.length > 0 ? (
            <>
              <p className="text-sm leading-relaxed text-gray-warm">
                {percorsi.length === 1
                  ? "Il tuo percorso è attivo e ti aspetta nella sezione «I tuoi percorsi»:"
                  : "I tuoi percorsi sono attivi e ti aspettano nella sezione «I tuoi percorsi»:"}
              </p>
              <ul className="mt-3 space-y-1.5">
                {percorsi.map((p) => (
                  <li
                    key={p}
                    className="rounded-lg bg-paper px-3.5 py-2.5 text-sm font-semibold text-ink"
                  >
                    {p}
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="text-sm leading-relaxed text-gray-warm">
              Non hai ancora un percorso attivo: il catalogo è il punto di
              partenza — prezzi pubblici, attivi quello che serve quando
              serve.
            </p>
          )}
        </div>
      ),
    },
    {
      icona: ClipboardList,
      titolo: "Cosa serve da te",
      contenuto: (
        <div>
          <p className="text-sm leading-relaxed text-gray-warm">
            {documenti.length > 0
              ? "Solo ciò che solo tu puoi darci — i documenti che hai già. Per il tuo percorso servono:"
              : "Quando attiverai un percorso, il Motore ti chiederà una lista precisa di documenti — quelli che hai già in azienda. Di tutto il resto si occupa lui."}
          </p>
          {documenti.length > 0 && (
            <ul className="mt-3 space-y-1.5">
              {documenti.slice(0, 4).map((d) => (
                <li
                  key={d}
                  className="rounded-lg bg-paper px-3.5 py-2 text-sm text-gray-warm"
                >
                  {d}
                </li>
              ))}
            </ul>
          )}
        </div>
      ),
    },
  ];

  const corrente = PASSI[passo];
  const Icona = corrente.icona;
  const ultimo = passo === PASSI.length - 1;

  return (
    <section
      aria-label="Benvenuto nel tuo ecosistema"
      className="relative mb-8 overflow-hidden rounded-2xl bg-pine-deep p-5 text-white sm:p-6"
    >
      <span
        aria-hidden
        className="pointer-events-none absolute -right-8 -top-12 select-none font-display text-[10rem] leading-none text-white/[0.05]"
      >
        0
      </span>
      <button
        type="button"
        onClick={chiudi}
        aria-label="Salta il benvenuto"
        className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-lg text-moss transition-colors hover:bg-white/10 hover:text-white"
      >
        <X size={17} />
      </button>

      <div className="relative">
        <p className="text-xs font-semibold tracking-widest text-mint-bright">
          BENVENUTO · PASSO {passo + 1} DI {PASSI.length}
        </p>
        <div className="mt-3 flex items-start gap-4">
          <span className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/10 text-mint-bright sm:inline-flex">
            <Icona size={22} />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-2xl">{corrente.titolo}</h2>
            <div className="mt-2 [&_.text-gray-warm]:text-moss [&_.bg-paper]:bg-white/10 [&_.text-ink]:text-white [&_.bg-moss]:bg-mint-bright/15 [&_.text-pine]:text-mint-bright">
              {corrente.contenuto}
            </div>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          {/* Avanzamento: un trattino per passo */}
          <div className="flex gap-1.5" aria-hidden>
            {PASSI.map((_, i) => (
              <span
                key={i}
                className={
                  "h-1 w-8 rounded-full " +
                  (i <= passo ? "bg-mint-bright" : "bg-white/20")
                }
              />
            ))}
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={chiudi}
              className="text-sm text-moss hover:text-white hover:underline"
            >
              Salta
            </button>
            {ultimo ? (
              <Link
                href={documenti.length > 0 ? "/dashboard/percorsi" : "/servizi"}
                onClick={chiudi}
                className="vz-press inline-flex items-center gap-1.5 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-pine"
              >
                {documenti.length > 0 ? "Vai al percorso" : "Apri il catalogo"}
                <ArrowRight size={15} />
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => setPasso((p) => p + 1)}
                className="vz-press inline-flex items-center gap-1.5 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-pine"
              >
                Avanti <ArrowRight size={15} />
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
