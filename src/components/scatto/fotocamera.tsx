"use client";

import { useEffect, useRef, useState } from "react";
import {
  Camera,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  Crop,
  Loader2,
  RotateCw,
  Trash2,
  X,
} from "lucide-react";

import {
  ErroreScatto,
  MAX_PAGINE,
  preparaPagina,
  type OpzioniScatto,
  type Pagina,
} from "@/lib/scatto/immagine";

/**
 * FOTOGRAFA UN DOCUMENTO — tutto in una schermata.
 *
 * ═══ IL CASO VERO È IL REGISTRO SU PIÙ FOGLI ═══
 * Non «una foto»: quattro pagine di un registro di manutenzione, in
 * sequenza, tenendo il telefono con una mano. Per questo le pagine si
 * accumulano con le miniature davanti agli occhi, si riordinano, si
 * rifanno una per una — e alla fine diventano UN documento solo, non
 * quattro righe in archivio da classificare quattro volte.
 *
 * ═══ MEGLIO UNO SCATTO IN PIÙ CHE UN'ESTRAZIONE SBAGLIATA ═══
 * Ogni pagina viene misurata prima dell'invio: mossa, storta, scura,
 * troppo piccola. Gli avvisi INVITANO a rifare e non impediscono di
 * mandare — chi ha in mano l'unica copia di un registro sbiadito del
 * 2019 deve poterlo mandare lo stesso.
 *
 * ═══ UNA MANO SOLA ═══
 * I comandi che si usano stanno in basso, dove arriva il pollice; le
 * aree toccabili non scendono sotto i 44 punti; nulla richiede due dita.
 */

type Stato = "chiuso" | "aperto";

export function Fotocamera({
  onPronto,
  inCorso,
  compatto = false,
}: {
  /** Le pagine confermate, in ordine: le cuce e le carica chi ci chiama. */
  onPronto: (pagine: Pagina[]) => void | Promise<void>;
  inCorso?: boolean;
  compatto?: boolean;
}) {
  const [stato, setStato] = useState<Stato>("chiuso");
  const [pagine, setPagine] = useState<Pagina[]>([]);
  const [inLavorazione, setInLavorazione] = useState(false);
  const [errore, setErrore] = useState<string | null>(null);
  const [scelta, setScelta] = useState<number | null>(null);
  const input = useRef<HTMLInputElement>(null);

  // Le anteprime sono URL di oggetti: se non si liberano, un registro di
  // dodici pagine lascia dodici immagini in memoria a ogni ripensamento.
  useEffect(() => {
    return () => {
      for (const p of pagine) URL.revokeObjectURL(p.anteprima);
    };
    // Volutamente al solo smontaggio: durante l'uso le pagine si liberano
    // una per una dove vengono sostituite o tolte.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function aggiungi(files: FileList | null) {
    if (!files || files.length === 0) return;
    setErrore(null);
    setInLavorazione(true);
    try {
      for (const file of [...files]) {
        if (pagine.length >= MAX_PAGINE) {
          setErrore(
            `Un documento può avere al massimo ${MAX_PAGINE} pagine. Se il registro è più lungo, dividilo in due: i dati confluiscono nello stesso posto.`,
          );
          break;
        }
        const pagina = await preparaPagina(file);
        setPagine((p) => [...p, pagina]);
        setScelta(null);
      }
    } catch (e) {
      setErrore(
        e instanceof ErroreScatto
          ? e.message
          : // Il permesso negato non arriva come errore: l'utente annulla e
            // non succede nulla. Questo ramo copre il resto.
            "Qualcosa è andato storto mentre preparavamo la foto. Riprova.",
      );
    } finally {
      setInLavorazione(false);
    }
  }

  /** Rifà una pagina con opzioni diverse, senza chiedere di riscattare. */
  async function rifai(indice: number, opzioni: OpzioniScatto) {
    const vecchia = pagine[indice];
    if (!vecchia) return;
    setInLavorazione(true);
    try {
      const nuova = await preparaPagina(vecchia.originale, opzioni);
      URL.revokeObjectURL(vecchia.anteprima);
      setPagine((p) => p.map((x, i) => (i === indice ? nuova : x)));
    } catch {
      setErrore("Non siamo riusciti a rifare questa pagina.");
    } finally {
      setInLavorazione(false);
    }
  }

  function sposta(indice: number, direzione: -1 | 1) {
    const destinazione = indice + direzione;
    if (destinazione < 0 || destinazione >= pagine.length) return;
    setPagine((p) => {
      const copia = [...p];
      [copia[indice], copia[destinazione]] = [copia[destinazione], copia[indice]];
      return copia;
    });
    setScelta(destinazione);
  }

  function elimina(indice: number) {
    URL.revokeObjectURL(pagine[indice].anteprima);
    setPagine((p) => p.filter((_, i) => i !== indice));
    setScelta(null);
  }

  function chiudi() {
    for (const p of pagine) URL.revokeObjectURL(p.anteprima);
    setPagine([]);
    setScelta(null);
    setErrore(null);
    setStato("chiuso");
  }

  const daGuardare = pagine.filter((p) => !p.qualita.buona).length;
  const corrente = scelta !== null ? pagine[scelta] : null;

  /* ── Il bottone che apre ────────────────────────────────────────── */
  if (stato === "chiuso") {
    return (
      <>
        <button
          type="button"
          onClick={() => setStato("aperto")}
          className={
            compatto
              ? "inline-flex items-center gap-1.5 text-xs font-semibold text-pine hover:underline"
              : "vz-press inline-flex min-h-11 items-center gap-2 rounded-xl border-2 border-pine px-5 py-3 text-sm font-semibold text-pine transition-colors hover:bg-moss"
          }
        >
          <Camera size={compatto ? 13 : 17} aria-hidden />
          Fotografa un documento
        </button>
      </>
    );
  }

  /* ── La schermata ───────────────────────────────────────────────── */
  return (
    <div className="rounded-2xl border-2 border-pine/25 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[15px] font-bold text-ink">Fotografa il documento</p>
          <p className="mt-0.5 text-xs leading-relaxed text-gray-warm">
            Una foto per pagina, in ordine. Alla fine diventano un documento
            solo.
          </p>
        </div>
        <button
          type="button"
          onClick={chiudi}
          aria-label="Chiudi"
          className="-mr-1 -mt-1 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-gray-light hover:bg-paper hover:text-ink"
        >
          <X size={18} />
        </button>
      </div>

      {/*
        `capture="environment"` apre la fotocamera POSTERIORE sul telefono.
        Su desktop l'attributo viene ignorato e resta un normale
        selettore di file: la ricaduta non è un ramo di codice, è il
        comportamento previsto dallo standard.
      */}
      <input
        ref={input}
        type="file"
        accept="image/*"
        capture="environment"
        multiple
        onChange={(e) => {
          void aggiungi(e.target.files);
          e.target.value = "";
        }}
        className="hidden"
      />

      {/* Le pagine già prese. */}
      {pagine.length > 0 && (
        <ul className="mt-4 flex gap-2 overflow-x-auto pb-1">
          {pagine.map((p, i) => (
            <li key={p.id} className="shrink-0">
              <button
                type="button"
                onClick={() => setScelta(scelta === i ? null : i)}
                className={
                  "relative block h-28 w-20 overflow-hidden rounded-lg border-2 transition-colors " +
                  (scelta === i
                    ? "border-pine"
                    : p.qualita.buona
                      ? "border-line"
                      : "border-amber-ink/50")
                }
                aria-label={`Pagina ${i + 1}${p.qualita.buona ? "" : ", da guardare"}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.anteprima}
                  alt=""
                  className="h-full w-full bg-paper object-cover"
                />
                <span className="absolute bottom-0 left-0 rounded-tr bg-ink/70 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                  {i + 1}
                </span>
                {!p.qualita.buona && (
                  <span
                    aria-hidden
                    className="absolute right-0.5 top-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-amber-soft text-amber-ink"
                  >
                    <CircleAlert size={12} />
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* La pagina scelta: cosa abbiamo fatto, e come cambiarlo. */}
      {corrente && scelta !== null && (
        <div className="mt-3 rounded-xl border border-line bg-paper p-3">
          <p className="text-xs font-semibold text-ink">Pagina {scelta + 1}</p>
          <p className="mt-0.5 text-[11px] leading-relaxed text-gray-warm">
            {corrente.ritagliata ? "Ritagliata sul foglio" : "Non ritagliata"}
            {corrente.raddrizzataDi !== 0 &&
              ` · raddrizzata di ${Math.abs(corrente.raddrizzataDi)}°`}
            {` · ${corrente.larghezza}×${corrente.altezza} pixel`}
          </p>

          {corrente.qualita.avvisi.map((a) => (
            <p
              key={a.testo}
              className={
                "mt-1.5 text-[11px] leading-relaxed " +
                (a.grave ? "text-amber-ink" : "text-gray-warm")
              }
            >
              {a.testo}
            </p>
          ))}

          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => void rifai(scelta, { rotazione: 90 })}
              className="inline-flex min-h-9 items-center gap-1 rounded-lg border border-line bg-white px-2.5 text-[11px] font-medium text-gray-warm hover:border-pine hover:text-pine"
            >
              <RotateCw size={12} aria-hidden /> Ruota
            </button>
            <button
              type="button"
              onClick={() =>
                void rifai(scelta, { senzaRitaglio: corrente.ritagliata })
              }
              className="inline-flex min-h-9 items-center gap-1 rounded-lg border border-line bg-white px-2.5 text-[11px] font-medium text-gray-warm hover:border-pine hover:text-pine"
            >
              <Crop size={12} aria-hidden />
              {corrente.ritagliata ? "Tieni tutta la foto" : "Ritaglia sul foglio"}
            </button>
            <button
              type="button"
              onClick={() => sposta(scelta, -1)}
              disabled={scelta === 0}
              aria-label="Sposta indietro"
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-white text-gray-warm disabled:opacity-30"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              type="button"
              onClick={() => sposta(scelta, 1)}
              disabled={scelta === pagine.length - 1}
              aria-label="Sposta avanti"
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-white text-gray-warm disabled:opacity-30"
            >
              <ChevronRight size={14} />
            </button>
            <button
              type="button"
              onClick={() => elimina(scelta)}
              className="ml-auto inline-flex min-h-9 items-center gap-1 rounded-lg px-2.5 text-[11px] font-medium text-gray-light hover:text-amber-ink"
            >
              <Trash2 size={12} aria-hidden /> Elimina e rifai
            </button>
          </div>
        </div>
      )}

      {errore && (
        <p
          role="alert"
          className="mt-3 rounded-xl border border-amber-ink/25 bg-amber-soft/60 px-3 py-2 text-xs leading-relaxed text-amber-ink"
        >
          {errore}
        </p>
      )}

      {/* I comandi stanno in basso: è dove arriva il pollice. */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => input.current?.click()}
          disabled={inLavorazione || inCorso || pagine.length >= MAX_PAGINE}
          className="vz-press inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl border-2 border-pine px-4 text-sm font-semibold text-pine disabled:opacity-50 sm:flex-none"
        >
          {inLavorazione ? (
            <Loader2 size={16} className="animate-spin" aria-hidden />
          ) : (
            <Camera size={16} aria-hidden />
          )}
          {pagine.length === 0 ? "Scatta" : "Aggiungi una pagina"}
        </button>

        {pagine.length > 0 && (
          <button
            type="button"
            onClick={() => void onPronto(pagine)}
            disabled={inLavorazione || inCorso}
            className="vz-press inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-pine px-4 text-sm font-semibold text-white disabled:opacity-50 sm:flex-none"
          >
            {inCorso ? (
              <Loader2 size={16} className="animate-spin" aria-hidden />
            ) : null}
            Usa {pagine.length === 1 ? "questa pagina" : `queste ${pagine.length} pagine`}
          </button>
        )}
      </div>

      {pagine.length > 0 && (
        <p className="mt-2 text-[11px] leading-relaxed text-gray-light">
          {daGuardare > 0 ? (
            <>
              <strong className="font-semibold text-amber-ink">
                {daGuardare === 1
                  ? "Una pagina è da guardare"
                  : `${daGuardare} pagine sono da guardare`}
              </strong>
              : toccala per vedere perché. Puoi mandarla lo stesso — meglio uno
              scatto in più che un dato letto male, ma la scelta è tua.
            </>
          ) : (
            "Le pagine diventano un documento solo, nell'ordine che vedi."
          )}
        </p>
      )}
    </div>
  );
}
