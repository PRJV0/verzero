"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowUpRight, Check, HelpCircle } from "lucide-react";

import {
  FAMIGLIE_NORMA,
  NORME_VERIFICATE_IL,
  controllaEdizione,
} from "@/lib/norme";

/**
 * CONTROLLO GRATUITO DELL'EDIZIONE.
 *
 * Chi ha un manuale in azienda non si chiede «quale percorso attivo»: si
 * chiede se quello che ha è ancora buono. È una domanda a cui possiamo
 * rispondere in due secondi e senza chiedere niente in cambio, perché la
 * risposta è un fatto pubblico — la designazione in vigore sta nel
 * catalogo UNI — e perché il registro che ci serve ce l'abbiamo già:
 * è lo stesso con cui `scripts/controllo-norme.mjs` sorveglia il nostro
 * sito (`src/lib/norme.ts`).
 *
 * ═══ REGOLE DI ONESTÀ, VINCOLANTI ═══
 *
 * 1. NESSUNA PROMESSA SULL'ESITO DI UN AUDIT. Lo strumento dice una cosa
 *    sola: quale edizione risulta citata e da quando la precedente è
 *    ritirata. Che cosa ne pensi un auditor non lo sappiamo e non lo
 *    diciamo — l'esito di un audit non dipende dal manuale soltanto.
 * 2. L'ANNO NON BASTA A ESSERE CERTI. Un manuale dello stesso anno in cui
 *    l'edizione è cambiata può citare l'una o l'altra: lì si risponde
 *    «da verificare», non si tira a indovinare. Un risultato inventato
 *    per fare colpo è un risultato che si smonta aprendo il documento.
 * 3. NESSUNA REGISTRAZIONE PER VEDERE IL RISULTATO. L'invito a lasciare i
 *    contatti arriva dopo, e solo se qualcosa risulta indietro.
 * 4. LA FONTE È SEMPRE IN VISTA: ogni riga porta il link alla pagina UNI.
 *
 * Tutto in memoria: niente rete, niente registrazione, niente evento —
 * la risposta si calcola nel browser da dati che sono già nella pagina.
 */

const ANNO_MINIMO = 2008;

export function ControlloEdizione() {
  const anno = new Date().getFullYear();
  const [scelte, setScelte] = useState<string[]>([]);
  const [annoManuale, setAnnoManuale] = useState<number | null>(null);

  const attiva = (id: string) =>
    setScelte((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const esiti =
    annoManuale === null
      ? []
      : FAMIGLIE_NORMA.filter((f) => scelte.includes(f.id)).map((f) =>
          controllaEdizione(f, annoManuale),
        );
  const superate = esiti.filter((e) => e.stato === "superata");
  const daVerificare = esiti.filter((e) => e.stato === "daVerificare");

  return (
    <section
      aria-labelledby="controllo-edizione"
      className="rounded-2xl border-2 border-pine/20 bg-white p-5 sm:p-6"
    >
      <p className="text-[11px] font-semibold uppercase tracking-widest text-pine">
        Controllo gratuito
      </p>
      <h2
        id="controllo-edizione"
        className="mt-1.5 font-display text-2xl leading-tight text-ink md:text-3xl"
      >
        Il tuo manuale cita un&apos;edizione ancora in vigore?
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-gray-warm">
        Scegli le norme che hai in azienda e l&apos;anno del manuale. La
        risposta è immediata e non serve registrarsi.
      </p>

      {/* 1. Le norme. */}
      <fieldset className="mt-5">
        <legend className="text-sm font-semibold text-ink">
          Quali norme hai in azienda?
        </legend>
        <div className="mt-2.5 flex flex-wrap gap-2">
          {FAMIGLIE_NORMA.map((f) => {
            const scelta = scelte.includes(f.id);
            return (
              <button
                key={f.id}
                type="button"
                aria-pressed={scelta}
                onClick={() => attiva(f.id)}
                className={
                  "vz-interattivo rounded-full border px-3.5 py-2 text-sm font-medium " +
                  (scelta
                    ? "border-pine bg-pine text-white"
                    : "border-line bg-white text-gray-warm hover:border-pine hover:text-pine")
                }
              >
                {f.etichetta}
                <span className="ml-1.5 text-xs opacity-70">{f.ambito}</span>
              </button>
            );
          })}
        </div>
      </fieldset>

      {/* 2. L'anno. */}
      <fieldset className="mt-5">
        <legend className="text-sm font-semibold text-ink">
          Di che anno è il manuale?
        </legend>
        <p className="mt-1 text-xs text-gray-light">
          La data dell&apos;ultima revisione, quella scritta in copertina o nel
          registro delle revisioni.
        </p>
        <div className="mt-2.5 flex flex-wrap items-center gap-2">
          <label htmlFor="anno-manuale" className="sr-only">
            Anno dell&apos;ultima revisione del manuale
          </label>
          <input
            id="anno-manuale"
            type="number"
            inputMode="numeric"
            min={ANNO_MINIMO}
            max={anno}
            placeholder={String(anno - 3)}
            value={annoManuale ?? ""}
            onChange={(e) => {
              const v = Number(e.target.value);
              setAnnoManuale(
                Number.isFinite(v) && v >= ANNO_MINIMO && v <= anno ? v : null,
              );
            }}
            className="w-28 rounded-lg border border-line px-3 py-2 text-sm tabular-nums text-ink focus:border-pine"
          />
          <span className="text-xs text-gray-light">
            fra {ANNO_MINIMO} e {anno}
          </span>
        </div>
      </fieldset>

      {/* 3. L'esito. */}
      <div aria-live="polite" className="mt-6">
        {scelte.length === 0 || annoManuale === null ? (
          <p className="text-sm text-gray-light">
            Scegli almeno una norma e l&apos;anno per vedere l&apos;esito.
          </p>
        ) : (
          <>
            <ul className="space-y-2">
              {esiti.map(({ famiglia: f, stato, citata }) => (
                <li
                  key={f.id}
                  className={
                    "rounded-xl border p-4 " +
                    (stato === "superata"
                      ? "border-amber-ink/30 bg-amber-soft"
                      : "border-line bg-paper")
                  }
                >
                  <p className="flex items-start gap-2 text-sm font-semibold text-ink">
                    {stato === "superata" && (
                      <AlertTriangle
                        size={16}
                        aria-hidden
                        className="mt-0.5 shrink-0 text-amber-ink"
                      />
                    )}
                    {stato === "allineata" && (
                      <Check
                        size={16}
                        aria-hidden
                        className="mt-0.5 shrink-0 text-pine"
                      />
                    )}
                    {stato === "daVerificare" && (
                      <HelpCircle
                        size={16}
                        aria-hidden
                        className="mt-0.5 shrink-0 text-gray-warm"
                      />
                    )}
                    {f.etichetta} — {f.ambito}
                  </p>

                  <p className="mt-1.5 text-sm leading-relaxed text-gray-warm">
                    {stato === "superata" && citata && (
                      <>
                        Un manuale del {annoManuale} cita{" "}
                        <strong className="font-semibold text-ink">
                          {citata.codice}
                        </strong>
                        , ritirata il {citata.ritirataIl}. L&apos;edizione in
                        vigore è {f.vigente}, dal {f.vigenteDal}.
                      </>
                    )}
                    {stato === "superata" && !citata && (
                      <>
                        L&apos;edizione in vigore è {f.vigente}, dal{" "}
                        {f.vigenteDal}: un manuale del {annoManuale}{" "}
                        è anteriore, quindi cita un&apos;edizione precedente —
                        quale, lo dice il documento.
                      </>
                    )}
                    {stato === "daVerificare" && (
                      <>
                        L&apos;edizione in vigore, {f.vigente}, è entrata in
                        vigore proprio nel {f.vigenteDalAnno} ({f.vigenteDal}).
                        Un manuale dello stesso anno può citare l&apos;una o
                        l&apos;altra: va guardato il documento.
                      </>
                    )}
                    {stato === "allineata" && (
                      <>
                        L&apos;edizione in vigore è {f.vigente}, dal{" "}
                        {f.vigenteDal}: un manuale del {annoManuale}{" "}
                        è successivo, quindi la designazione dovrebbe essere
                        quella giusta.
                      </>
                    )}
                  </p>

                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
                    <a
                      href={f.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] text-gray-light hover:text-pine hover:underline"
                    >
                      Verifica su catalogo UNI
                      <ArrowUpRight size={11} aria-hidden />
                      <span className="sr-only">
                        (si apre in una nuova scheda)
                      </span>
                    </a>
                    {f.percorso && (
                      <Link
                        href={`/servizi/${f.percorso}`}
                        className="text-[11px] font-semibold text-pine hover:underline"
                      >
                        Il percorso su {f.etichetta} →
                      </Link>
                    )}
                  </div>
                </li>
              ))}
            </ul>

            {/* L'invito arriva DOPO il risultato, e solo se serve. */}
            {(superate.length > 0 || daVerificare.length > 0) && (
              <div className="mt-4 rounded-xl bg-moss p-4">
                <p className="text-sm leading-relaxed text-pine-dark">
                  {superate.length > 0 ? (
                    <>
                      <strong className="font-semibold">
                        {superate.length === 1
                          ? "Un manuale su cui intervenire"
                          : `${superate.length} manuali su cui intervenire`}
                        .
                      </strong>{" "}
                      L&apos;aggiornamento parte dal documento che hai:
                      l&apos;impianto e i contenuti della tua impresa restano.
                    </>
                  ) : (
                    <>
                      <strong className="font-semibold">Da guardare.</strong>{" "}
                      Con il documento in mano si vede in poche righe quale
                      edizione cita.
                    </>
                  )}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link
                    href="/servizi/aggiornamento-sistema-gestione"
                    className="vz-press inline-flex items-center gap-1.5 rounded-lg bg-pine px-4 py-2.5 text-sm font-semibold text-white"
                  >
                    Come funziona l&apos;aggiornamento
                  </Link>
                  <Link
                    href="/contatti"
                    className="vz-press inline-flex items-center gap-1.5 rounded-lg border border-pine px-4 py-2.5 text-sm font-semibold text-pine"
                  >
                    Lascia i contatti
                  </Link>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <p className="mt-4 border-t border-line pt-3 text-[11px] leading-relaxed text-gray-light">
        Il controllo confronta l&apos;anno del manuale con l&apos;edizione in
        vigore secondo il catalogo UNI, verificata il{" "}
        {NORME_VERIFICATE_IL.esteso}. Dice quale edizione risulta citata, non
        come andrà un audit: l&apos;esito di un audit non dipende dal manuale
        soltanto.
      </p>
    </section>
  );
}
