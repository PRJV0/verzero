"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { Check, PenLine, SkipForward, X } from "lucide-react";

import { livelloConfidenza, formattaValore } from "@/lib/motore/portale";

import {
  confermaRiga,
  confermaRigheSicure,
  correggiCampo,
  rifiutaRiga,
} from "../azioni";

/**
 * LA CONFERMA AFFIANCATA — il manoscritto trattato come caso normale.
 *
 * ═══ IL PROBLEMA ═══
 * Un registro di manutenzione o un foglio firma arriva scritto a penna.
 * Le regole non si toccano: confidenza ridotta d'ufficio e conferma
 * umana obbligatoria, sempre. Ma se confermare venti righe costa venti
 * viaggi avanti e indietro fra lo schermo e il foglio, nessuno lo fa — e
 * una regola che nessuno rispetta non protegge nessuno. La conferma
 * obbligatoria si difende rendendola VELOCE, non alleggerendola.
 *
 * ═══ COME ═══
 * 1. IL DOCUMENTO STA ACCANTO, sempre, aperto sulla pagina della riga in
 *    corso: nessun viaggio, nessuna finestra da cercare.
 * 2. UNA RIGA ALLA VOLTA, grande e leggibile, con accanto la riga così
 *    com'è scritta sul foglio: si confronta con un colpo d'occhio.
 * 3. LA TASTIERA BASTA: Invio conferma e passa avanti, E corregge, X
 *    scarta, ↓ salta. Venti righe diventano venti battute.
 * 4. AVANZAMENTO VISIBILE: si vede quanto manca, e finisce.
 * 5. IL BLOCCO C'È MA NON TOCCA IL MANOSCRITTO: «conferma quelle che
 *    tornano» esclude sempre ciò che è stato letto a mano — nessun
 *    automatismo può confermare una grafia (docs/motore.md §3).
 */

export type CellaVista = {
  id: string;
  chiave: string;
  etichetta: string;
  valore: string | null;
  unita: string | null;
};

export type RigaVista = {
  riga: number;
  celle: CellaVista[];
  confidenza: number;
  pagina: number | null;
  estrattoDa: string | null;
  fonteLettura: "testo" | "immagine" | "manoscritto";
  nota: string | null;
  avvisi: string[];
  stato: "da_confermare" | "confermato" | "rifiutato";
};

export function ConfermaAffiancata({
  documentId,
  nomeFile,
  mime,
  url,
  righe,
}: {
  documentId: string;
  nomeFile: string;
  mime: string;
  /** Indirizzo firmato del file, valido un'ora. */
  url: string | null;
  righe: RigaVista[];
}) {
  const daFare = useMemo(
    () => righe.filter((r) => r.stato === "da_confermare"),
    [righe],
  );
  const [fatte, setFatte] = useState<Set<number>>(new Set());
  const [indice, setIndice] = useState(0);
  const [correzione, setCorrezione] = useState<Record<string, string>>({});
  const [inCorreggo, setInCorreggo] = useState(false);
  const [inCorso, avvia] = useTransition();
  const contenitore = useRef<HTMLDivElement>(null);

  const restanti = daFare.filter((r) => !fatte.has(r.riga));
  const corrente = restanti[Math.min(indice, restanti.length - 1)];
  const manoscritte = daFare.filter((r) => r.fonteLettura === "manoscritto").length;
  const sicure = daFare.filter(
    (r) =>
      r.fonteLettura !== "manoscritto" && r.avvisi.length === 0 && r.confidenza >= 0.85,
  ).length;

  /* — La tastiera. È tutto il punto: senza, restano venti clic. — */
  useEffect(() => {
    function tasto(e: KeyboardEvent) {
      if (inCorreggo || !corrente) return;
      const dentroUnCampo =
        e.target instanceof HTMLElement &&
        ["INPUT", "TEXTAREA", "SELECT"].includes(e.target.tagName);
      if (dentroUnCampo) return;

      if (e.key === "Enter") {
        e.preventDefault();
        conferma(corrente.riga);
      } else if (e.key.toLowerCase() === "e") {
        e.preventDefault();
        setInCorreggo(true);
      } else if (e.key.toLowerCase() === "x") {
        e.preventDefault();
        rifiuta(corrente.riga);
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setIndice((i) => Math.min(i + 1, restanti.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setIndice((i) => Math.max(i - 1, 0));
      }
    }
    window.addEventListener("keydown", tasto);
    return () => window.removeEventListener("keydown", tasto);
  });

  function conferma(riga: number) {
    // L'interfaccia avanza subito e il salvataggio la insegue: aspettare
    // il server a ogni riga trasformerebbe un minuto in cinque.
    setFatte((f) => new Set(f).add(riga));
    setInCorreggo(false);
    avvia(async () => {
      await confermaRiga(documentId, riga);
    });
  }

  function rifiuta(riga: number) {
    setFatte((f) => new Set(f).add(riga));
    setInCorreggo(false);
    avvia(async () => {
      await rifiutaRiga(documentId, riga);
    });
  }

  function salvaCorrezione(riga: RigaVista) {
    const modifiche = riga.celle
      .map((c) => ({ c, v: correzione[c.id] }))
      .filter(({ c, v }) => v !== undefined && v !== (c.valore ?? ""));
    setFatte((f) => new Set(f).add(riga.riga));
    setInCorreggo(false);
    avvia(async () => {
      for (const { c, v } of modifiche) await correggiCampo(c.id, v as string);
      await confermaRiga(documentId, riga.riga);
    });
  }

  const pagina = corrente?.pagina ?? 1;
  const immagine = mime.startsWith("image/");

  return (
    <div ref={contenitore} className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {/* ═══ IL DOCUMENTO, sempre accanto ═══ */}
      <div className="lg:sticky lg:top-4 lg:self-start">
        <div className="overflow-hidden rounded-xl border-2 border-line bg-white">
          <div className="flex items-center justify-between gap-3 border-b border-line bg-paper px-4 py-2">
            <p className="truncate text-xs font-semibold text-ink">{nomeFile}</p>
            {corrente?.pagina && (
              <span className="shrink-0 text-[11px] text-gray-warm">
                pagina {corrente.pagina}
              </span>
            )}
          </div>
          {url ? (
            immagine ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={url}
                alt={`Il documento «${nomeFile}», da confrontare con i dati letti`}
                className="max-h-[70vh] w-full bg-paper object-contain"
              />
            ) : (
              <iframe
                // La chiave forza il ricaricamento quando cambia pagina:
                // un iframe non rilegge il frammento #page da solo.
                key={pagina}
                src={`${url}#page=${pagina}&view=FitH`}
                title={`Il documento «${nomeFile}»`}
                className="h-[70vh] w-full bg-paper"
              />
            )
          ) : (
            <p className="p-6 text-sm text-gray-warm">
              Non siamo riusciti ad aprire l&apos;anteprima del documento. Puoi
              confermare comunque, ma conviene tenere il foglio davanti.
            </p>
          )}
        </div>
      </div>

      {/* ═══ LE RIGHE ═══ */}
      <div>
        {/* Avanzamento: si vede che finisce. */}
        <div className="rounded-xl border border-line bg-white p-4">
          <div className="flex items-baseline justify-between gap-3">
            <p className="text-sm font-semibold text-ink">
              {restanti.length === 0
                ? "Hai controllato tutto."
                : `${restanti.length} ${restanti.length === 1 ? "riga" : "righe"} da controllare`}
            </p>
            <p className="text-xs tabular-nums text-gray-light">
              {daFare.length - restanti.length} di {daFare.length}
            </p>
          </div>
          <div
            className="mt-2 h-1.5 overflow-hidden rounded-full bg-line"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={daFare.length}
            aria-valuenow={daFare.length - restanti.length}
            aria-label="Righe controllate"
          >
            <div
              className="h-full rounded-full bg-mint transition-[width] duration-300"
              style={{
                width: `${daFare.length === 0 ? 100 : ((daFare.length - restanti.length) / daFare.length) * 100}%`,
              }}
            />
          </div>

          {sicure > 0 && restanti.length > 0 && (
            <form
              action={async () => {
                await confermaRigheSicure(documentId);
              }}
              className="mt-3"
            >
              <button
                type="submit"
                className="vz-press inline-flex items-center gap-1.5 rounded-lg border border-pine px-3 py-1.5 text-xs font-semibold text-pine transition-colors hover:bg-moss"
              >
                <Check size={13} aria-hidden />
                Conferma le {sicure} righe che tornano
              </button>
              <p className="mt-1.5 text-[11px] leading-relaxed text-gray-light">
                Sono le righe lette in chiaro, senza avvisi.
                {manoscritte > 0 && (
                  <>
                    {" "}
                    Le {manoscritte} righe scritte a mano restano da guardare una
                    per una: una grafia non la conferma un automatismo.
                  </>
                )}
              </p>
            </form>
          )}
        </div>

        {/* La riga in corso, grande. */}
        {corrente ? (
          <div className="mt-3 rounded-xl border-2 border-pine/30 bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-warm">
                Riga {corrente.riga}
              </p>
              <span
                className={
                  "rounded-full px-2 py-0.5 text-[10px] font-semibold " +
                  (corrente.fonteLettura === "manoscritto"
                    ? "bg-amber-soft text-amber-ink"
                    : livelloConfidenza(corrente.confidenza).chiave === "alta"
                      ? "bg-mint/15 text-mint"
                      : "bg-paper text-gray-warm")
                }
              >
                {corrente.fonteLettura === "manoscritto"
                  ? "scritta a mano"
                  : livelloConfidenza(corrente.confidenza).etichetta}
              </span>
            </div>

            {/* Com'è scritta sul foglio: il confronto, senza cercarlo. */}
            {corrente.estrattoDa && (
              <p className="mt-2 rounded-lg bg-paper px-3 py-2 font-mono text-[11px] leading-relaxed text-gray-warm">
                {corrente.estrattoDa}
              </p>
            )}

            <dl className="mt-3 space-y-1.5">
              {corrente.celle.map((c) => (
                <div
                  key={c.id}
                  className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1"
                >
                  <dt className="text-xs text-gray-warm">{c.etichetta}</dt>
                  <dd className="flex-1 text-right">
                    {inCorreggo ? (
                      <>
                        <label htmlFor={`c-${c.id}`} className="sr-only">
                          {c.etichetta}
                        </label>
                        <input
                          id={`c-${c.id}`}
                          defaultValue={c.valore ?? ""}
                          onChange={(e) =>
                            setCorrezione((v) => ({ ...v, [c.id]: e.target.value }))
                          }
                          className="w-full max-w-[14rem] rounded-lg border border-line px-2 py-1 text-sm text-ink outline-none focus:border-mint"
                        />
                      </>
                    ) : (
                      <span className="text-sm font-semibold tabular-nums text-ink">
                        {c.valore === null ? (
                          <span className="font-normal text-gray-light">—</span>
                        ) : (
                          formattaValore(c.valore, c.unita)
                        )}
                      </span>
                    )}
                  </dd>
                </div>
              ))}
            </dl>

            {corrente.nota && (
              <p className="mt-2 text-[11px] leading-relaxed text-gray-warm">
                {corrente.nota}
              </p>
            )}
            {corrente.avvisi.map((a) => (
              <p key={a} className="mt-1 text-[11px] leading-relaxed text-amber-ink">
                {a}
              </p>
            ))}

            <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-line pt-3">
              {inCorreggo ? (
                <>
                  <button
                    type="button"
                    onClick={() => salvaCorrezione(corrente)}
                    className="vz-press inline-flex items-center gap-1.5 rounded-lg bg-pine px-3 py-1.5 text-xs font-semibold text-white"
                  >
                    <Check size={13} aria-hidden /> Salva e conferma
                  </button>
                  <button
                    type="button"
                    onClick={() => setInCorreggo(false)}
                    className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-gray-light hover:text-ink"
                  >
                    Lascia com&apos;era
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => conferma(corrente.riga)}
                    className="vz-press inline-flex items-center gap-1.5 rounded-lg bg-pine px-3 py-1.5 text-xs font-semibold text-white"
                  >
                    <Check size={13} aria-hidden /> Confermo
                    <kbd className="ml-1 rounded bg-white/20 px-1 text-[10px]">
                      Invio
                    </kbd>
                  </button>
                  <button
                    type="button"
                    onClick={() => setInCorreggo(true)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-1.5 text-xs font-medium text-gray-warm hover:border-pine hover:text-pine"
                  >
                    <PenLine size={13} aria-hidden /> Correggo
                    <kbd className="rounded bg-paper px-1 text-[10px]">E</kbd>
                  </button>
                  <button
                    type="button"
                    onClick={() => rifiuta(corrente.riga)}
                    className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-gray-light hover:text-amber-ink"
                  >
                    <X size={13} aria-hidden /> Scarta
                    <kbd className="rounded bg-paper px-1 text-[10px]">X</kbd>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setIndice((i) => Math.min(i + 1, restanti.length - 1))
                    }
                    className="ml-auto inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium text-gray-light hover:text-ink"
                  >
                    <SkipForward size={13} aria-hidden /> Dopo
                  </button>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="mt-3 rounded-xl border border-mint/40 bg-mint/5 p-5">
            <p className="text-sm font-semibold text-pine">
              Tutto controllato. I dati confermati sono entrati nei tuoi documenti.
            </p>
            <p className="mt-1 text-xs leading-relaxed text-gray-warm">
              Quello che hai scartato resta fuori e non te lo riproporremo.
            </p>
          </div>
        )}

        {/* Le prossime, in piccolo: si vede cosa arriva. */}
        {restanti.length > 1 && (
          <ul className="mt-3 space-y-1">
            {restanti.slice(indice + 1, indice + 6).map((r) => (
              <li
                key={r.riga}
                className="flex items-center gap-2 rounded-lg border border-line bg-white px-3 py-1.5 text-xs text-gray-warm"
              >
                <span className="tabular-nums text-gray-light">{r.riga}</span>
                <span className="min-w-0 flex-1 truncate">
                  {r.celle
                    .filter((c) => c.valore !== null)
                    .slice(0, 3)
                    .map((c) => formattaValore(c.valore as string, c.unita))
                    .join(" · ")}
                </span>
                {r.fonteLettura === "manoscritto" && (
                  <span className="shrink-0 text-[10px] font-medium text-amber-ink">
                    a mano
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}

        <p className="mt-3 text-[11px] leading-relaxed text-gray-light">
          Invio conferma e passa alla riga dopo · E per correggere · X per
          scartare · ↑ ↓ per muoverti.
          {inCorso && <span className="ml-2 text-mint">salvataggio…</span>}
        </p>
      </div>
    </div>
  );
}
