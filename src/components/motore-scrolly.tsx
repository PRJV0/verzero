import { Check, FileText, PenLine } from "lucide-react";

import { FascicoloPercorso } from "@/components/fascicolo-percorso";
import {
  CAMPI_ESTRATTI,
  DOCUMENTO_GENERATO,
  MOTORE_FASI,
  VERIFICA_UMANA,
  ZERO_EFFORT_DEFINIZIONE,
} from "@/lib/motore";

import {
  Scrolly,
  ScrollyProgress,
  ScrollyStage,
  ScrollyStep,
  ScrollySteps,
} from "./scrolly";

/**
 * Sezione del Motore Ver0 (home e chi-siamo).
 *
 * SPEC §12.O — CONCRETEZZA: niente «zero da cui succedono cose». In testa
 * IL FASCICOLO DEL PERCORSO (fascicolo-percorso.tsx): l'anteprima fedele
 * della dashboard, con tab per percorso e lo stato dei documenti. Sotto,
 * le tre fasi del racconto — i campi estratti con i loro valori, il
 * documento generato con la norma citata, l'esito della verifica umana —
 * ognuna con cosa entra, cosa esce e su quale norma.
 * Le animazioni servono solo a passare da una fase all'altra.
 *
 * Ogni fase è una RIGA COMPLETA (artefatto + spiegazione): così quando lo
 * scrollytelling degrada — su mobile, senza JS, con «riduci movimento» — la
 * sequenza statica resta accoppiata e leggibile invece di separare i
 * documenti dai loro testi.
 *
 * Attenzione: la sezione non deve avere overflow nascosto. Un antenato che
 * ritaglia diventa il contenitore di scorrimento del palco sticky e della
 * ViewTimeline, e li disattiva entrambi (v. scrolly.tsx).
 */

/** Cornice comune degli artefatti: una superficie chiara sul fondo scuro,
 *  che li fa leggere come documenti veri e non come decorazioni. */
function Foglio({
  titolo,
  icona: Icona,
  children,
}: {
  titolo: string;
  icona: typeof FileText;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-lift sm:p-5">
      <div className="flex items-center gap-2 border-b border-line pb-3">
        <Icona size={15} className="shrink-0 text-pine" />
        <p className="text-xs font-semibold text-ink">{titolo}</p>
        <span className="ml-auto shrink-0 text-[10px] uppercase tracking-widest text-gray-light">
          esempio
        </span>
      </div>
      {children}
    </div>
  );
}

/** I campi estratti, con il valore in evidenza. */
function FoglioLettura() {
  return (
    <Foglio titolo="Campi estratti dai tuoi documenti" icona={FileText}>
      <div className="mt-3 space-y-3.5">
        {CAMPI_ESTRATTI.map((d) => (
          <div key={d.doc}>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-light">
              {d.doc}
            </p>
            <dl className="mt-1.5 space-y-1">
              {d.campi.map((c) => (
                <div
                  key={c.campo}
                  className="flex items-baseline justify-between gap-3"
                >
                  <dt className="shrink-0 text-xs text-gray-warm">{c.campo}</dt>
                  <dd className="min-w-0 truncate rounded bg-mint/10 px-1.5 py-0.5 text-xs font-medium tabular-nums text-pine">
                    {c.valore}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
      </div>
    </Foglio>
  );
}

/** Fase 3 — il documento in uscita, con la norma citata in chiaro. */
function FoglioGenerazione() {
  return (
    <Foglio titolo={DOCUMENTO_GENERATO.titolo} icona={FileText}>
      <p className="mt-3 text-[11px] leading-relaxed text-pine">
        Redatto secondo {DOCUMENTO_GENERATO.norma}
      </p>
      <table className="mt-3 w-full text-xs">
        <tbody>
          {DOCUMENTO_GENERATO.righe.map((r) => (
            <tr key={r.voce} className="border-t border-line/70">
              <td className="py-1.5 pr-2 text-gray-warm">
                {r.voce}
                <span className="block text-[10px] text-gray-light">
                  fattore: {r.fonte}
                </span>
              </td>
              <td className="py-1.5 text-right font-medium tabular-nums text-ink">
                {r.valore}
              </td>
            </tr>
          ))}
          <tr className="border-t-2 border-pine">
            <td className="py-2 pr-2 text-sm font-semibold text-ink">
              {DOCUMENTO_GENERATO.totale.voce}
            </td>
            <td className="py-2 text-right text-sm font-semibold tabular-nums text-pine">
              {DOCUMENTO_GENERATO.totale.valore}
            </td>
          </tr>
        </tbody>
      </table>
      <p className="mt-3 text-xs text-gray-warm">{DOCUMENTO_GENERATO.nota}</p>
    </Foglio>
  );
}

/** Fase 4 — l'esito della verifica umana, rilievo compreso. */
function FoglioVerifica() {
  return (
    <Foglio titolo="Verifica tecnica" icona={PenLine}>
      <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-mint/10 px-2.5 py-1 text-xs font-medium text-mint">
        <Check size={13} /> {VERIFICA_UMANA.esito}
      </span>
      <ul className="mt-3 space-y-1.5">
        {VERIFICA_UMANA.controlli.map((c) => (
          <li key={c} className="flex items-start gap-2 text-xs text-gray-warm">
            <Check size={13} className="mt-0.5 shrink-0 text-mint" />
            {c}
          </li>
        ))}
      </ul>
      <p className="mt-3 rounded-lg bg-amber-soft px-3 py-2 text-xs leading-relaxed text-amber-ink">
        <strong className="font-semibold">Rilievo: </strong>
        {VERIFICA_UMANA.rilievo}
      </p>
      <p className="mt-3 border-t border-line pt-3 text-xs text-gray-warm">
        {VERIFICA_UMANA.firma}
      </p>
    </Foglio>
  );
}

const FOGLI = [FoglioLettura, FoglioGenerazione, FoglioVerifica];

export function MotoreScrolly() {
  return (
    <section className="relative bg-pine-deep px-5 py-16">
      {/* Bagliori menta — ritagliati qui dentro, non sulla sezione */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <span className="absolute -left-24 top-10 h-80 w-80 rounded-full bg-mint-bright/10 blur-3xl" />
        <span className="absolute -right-28 bottom-0 h-96 w-96 rounded-full bg-mint-bright/10 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-5xl">
        <div className="text-center">
          <p className="mb-3 text-xs font-semibold tracking-widest text-mint-bright">
            IL NOSTRO MOTORE
          </p>
          <h2 className="font-display text-4xl text-white md:text-5xl">
            Che cosa succede ai tuoi documenti
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-moss">
            {ZERO_EFFORT_DEFINIZIONE} Qui sotto, che cosa entra, che cosa esce
            e su quale norma.
          </p>
        </div>

        {/* IL FASCICOLO DEL PERCORSO — l'anteprima fedele della dashboard:
            cosa ti chiediamo, percorso per percorso, con lo stato reale. */}
        <div className="mx-auto mt-10 max-w-3xl">
          <FascicoloPercorso />
        </div>

        {/* Poi il racconto: cosa succede al fascicolo, fase per fase. */}
        <Scrolly steps={3} className="mt-12">
          <ScrollyStage>
            <ScrollySteps>
              {MOTORE_FASI.map((f, i) => {
                const Icona = f.icon;
                const Foglio = FOGLI[i];
                return (
                  <ScrollyStep key={f.titolo} index={i + 1}>
                    <div className="grid grid-cols-1 items-center gap-6 md:grid-cols-2 md:gap-10">
                      <Foglio />

                      <div>
                        <p className="flex items-center gap-2 text-xs font-semibold tracking-widest text-mint-bright">
                          <Icona size={15} /> FASE {i + 1} DI{" "}
                          {MOTORE_FASI.length}
                        </p>
                        <h3 className="mt-2 font-display text-2xl leading-tight text-white md:text-3xl">
                          {f.titolo}
                        </h3>
                        <p className="mt-3 max-w-md text-sm leading-relaxed text-moss">
                          {f.desc}
                        </p>

                        {/* Il contratto della fase: entra / esce / norma */}
                        <dl className="mt-5 space-y-2 border-t border-white/15 pt-4 text-xs">
                          {[
                            ["Entra", f.entra],
                            ["Esce", f.esce],
                            ["Norma", f.norma],
                          ].map(([k, v]) => (
                            <div key={k} className="flex gap-3">
                              <dt className="w-12 shrink-0 font-semibold uppercase tracking-wider text-mint-bright">
                                {k}
                              </dt>
                              <dd className="min-w-0 text-moss">{v}</dd>
                            </div>
                          ))}
                        </dl>
                      </div>
                    </div>
                  </ScrollyStep>
                );
              })}
            </ScrollySteps>

            <div className="mx-auto mt-8 max-w-md">
              <ScrollyProgress tone="dark" />
            </div>
          </ScrollyStage>
        </Scrolly>

        <p className="mt-10 text-center text-xs text-moss/80">
          Le elaborazioni del Motore Ver0 sono sempre dichiarate; le verifiche
          umane portano il nome di chi le ha fatte. Nessun dato entra nei report
          senza la tua conferma.
        </p>
      </div>
    </section>
  );
}
