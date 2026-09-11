"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
  type KeyboardEvent as EventoTasto,
} from "react";
import { Check, PenLine, SkipForward, X } from "lucide-react";

import {
  formattaValore,
  livelloConfidenza,
  statoCella,
  type FonteVista,
  type StatoCella,
} from "@/lib/motore/portale";

import {
  confermaCelle,
  confermaRigheSicure,
  correggiCampo,
  rifiutaCampo,
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
 *
 * ═══ DUE LIVELLI, UNA SOLA TASTIERA ═══
 * Da quando la verificabilità sta nella CELLA e non più nella riga, la
 * scheda ha due livelli — ma il gesto veloce non è cambiato di una
 * battuta, ed è la condizione che li tiene insieme.
 *
 *   LIVELLO RIGA (dove si arriva)   Invio conferma quello che resta
 *                                   aperto e passa alla riga dopo. È il
 *                                   percorso di venti righe in un minuto,
 *                                   identico a prima.
 *   LIVELLO CELLA (dove si scende)  → o E scendono sulla prima cella che
 *                                   chiede attenzione — non sulla prima
 *                                   in ordine: chi scende vuole guardare
 *                                   QUELLA. Lì Invio la conferma e salta
 *                                   alla prossima da guardare, E la
 *                                   corregge, X la scarta, Esc risale.
 *
 * Chi non scende non paga niente per l'esistenza del livello di sotto:
 * è l'unico modo di aggiungere precisione senza togliere velocità.
 *
 * ═══ IL SALVATAGGIO INSEGUE, NON PRECEDE ═══
 * Ogni decisione cambia subito quello che si vede e parte per il server
 * dietro le quinte. Aspettare la risposta a ogni riga trasformerebbe un
 * minuto in cinque — e il minuto è il requisito, non un desiderio.
 */

export type CellaVista = {
  id: string;
  chiave: string;
  etichetta: string;
  valore: string | null;
  unita: string | null;
  /** Di QUESTA cella: non più copiata da quella della riga. */
  confidenza: number;
  /** Il pezzo di documento da cui viene QUESTO valore. */
  estrattoDa: string | null;
  fonteLettura: FonteVista;
  calcolato: boolean;
  avvisi: string[];
  stato: "da_confermare" | "confermato" | "rifiutato";
};

export type RigaVista = {
  riga: number;
  celle: CellaVista[];
  /** Il minimo fra le celle piene: una riga vale quanto la più debole. */
  confidenza: number;
  pagina: number | null;
  /** Solo se è davvero di tutta la riga (documenti letti prima). */
  estrattoDa: string | null;
  fonteLettura: FonteVista;
  nota: string | null;
  avvisi: string[];
  stato: "da_confermare" | "confermato" | "rifiutato";
};

/* ------------------------------------------------------------------ */
/* I SEGNI — quattro, e uno è l'assenza di segno                       */
/* ------------------------------------------------------------------ */

/**
 * Il filetto a sinistra della cella è il segno principale, e la targa
 * scritta lo spiega. Le celle lette in chiaro hanno un filetto quieto e
 * NESSUNA targa: se anche il caso normale porta un'etichetta, nessuna
 * etichetta si vede più.
 *
 * Il filetto del CALCOLATO è tratteggiato, e non per decorazione: una
 * linea interrotta dice che fra il documento e quel valore manca un
 * pezzo — che è esattamente il fatto da comunicare.
 */
const SEGNO: Record<StatoCella["chiave"], { filetto: string; targa: string }> = {
  certa: { filetto: "bg-mint/50", targa: "" },
  incerta: { filetto: "bg-amber-ink/40", targa: "bg-paper text-gray-warm" },
  manoscritta: { filetto: "bg-amber-ink", targa: "bg-amber-soft text-amber-ink" },
  calcolata: {
    filetto:
      "bg-[repeating-linear-gradient(180deg,var(--color-pine)_0_3px,transparent_3px_7px)]",
    targa: "bg-moss text-pine",
  },
  vuota: { filetto: "bg-line", targa: "bg-paper text-gray-warm" },
};

/**
 * LA TERZA PROVENIENZA. Un valore riscritto dal cliente non è più né
 * letto né calcolato: continuare a mostrargli «calcolato da noi» sul
 * valore che ha appena scritto lui sarebbe attribuirgli un difetto che
 * non è suo. È anche la provenienza più forte delle tre, e si vede.
 */
const RISCRITTA = {
  chiave: "certa" as const,
  etichetta: "scritto da te",
  spiega: "Questo valore l'hai scritto tu: non viene dalla nostra lettura.",
  attenzione: false,
};
const SEGNO_RISCRITTA = {
  filetto: "bg-pine",
  targa: "bg-pine text-white",
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
  /** Le celle già decise da sole, dentro una riga ancora aperta. */
  const [decise, setDecise] = useState<
    Record<string, "confermata" | "scartata">
  >({});
  /** I valori riscritti dal cliente: si vedono subito, non al giro dopo. */
  const [corretti, setCorretti] = useState<Record<string, string>>({});
  const [indice, setIndice] = useState(0);
  /** null = livello riga; un numero = quella cella della riga in corso. */
  const [cella, setCella] = useState<number | null>(null);
  const [scrivo, setScrivo] = useState(false);
  const [bozza, setBozza] = useState("");
  const [inCorso, avvia] = useTransition();
  const campo = useRef<HTMLInputElement>(null);
  const bottoni = useRef<Array<HTMLButtonElement | null>>([]);

  const restanti = daFare.filter((r) => !fatte.has(r.riga));
  const corrente = restanti[Math.min(indice, restanti.length - 1)];
  const manoscritte = daFare.filter((r) => r.fonteLettura === "manoscritto").length;
  const sicure = daFare.filter((r) =>
    r.celle.every((c) => !statoCella(c).attenzione),
  ).length;

  /** Il valore da mostrare: quello riscritto vince su quello letto. */
  const mostra = (c: CellaVista) => corretti[c.id] ?? c.valore;

  /** Le celle di questa riga su cui il cliente non si è ancora espresso. */
  const aperte = (r: RigaVista) =>
    r.celle.filter((c) => c.stato === "da_confermare" && !decise[c.id]);

  /** La prossima che chiede di essere guardata, da `da` in poi. */
  function daGuardare(r: RigaVista, da: number): number | null {
    for (let i = Math.max(0, da); i < r.celle.length; i++) {
      const c = r.celle[i];
      if (decise[c.id] || c.stato !== "da_confermare") continue;
      if (statoCella(c).attenzione) return i;
    }
    return null;
  }

  /** Dove scendere quando si scende: la prima da guardare, o la prima. */
  const dove = (r: RigaVista) => daGuardare(r, 0) ?? 0;

  /* ── le decisioni ────────────────────────────────────────────────── */

  function risali() {
    setCella(null);
    setScrivo(false);
  }

  function confermaResto(r: RigaVista) {
    const ids = aperte(r).map((c) => c.id);
    setFatte((f) => new Set(f).add(r.riga));
    risali();
    avvia(async () => {
      if (ids.length > 0) await confermaCelle(ids);
    });
  }

  function scartaRiga(r: RigaVista) {
    setFatte((f) => new Set(f).add(r.riga));
    risali();
    avvia(async () => {
      await rifiutaRiga(documentId, r.riga);
    });
  }

  function confermaCella(c: CellaVista) {
    setDecise((d) => ({ ...d, [c.id]: "confermata" }));
    avvia(async () => {
      await confermaCelle([c.id]);
    });
  }

  function scartaCella(c: CellaVista) {
    setDecise((d) => ({ ...d, [c.id]: "scartata" }));
    avvia(async () => {
      await rifiutaCampo(c.id);
    });
  }

  function salvaCella(c: CellaVista, valore: string) {
    const pulito = valore.trim();
    // Riscrivere lo stesso valore è confermarlo: non si inventa una
    // correzione per un testo che non è cambiato.
    if (pulito === "" || pulito === (mostra(c) ?? "")) {
      confermaCella(c);
      return;
    }
    setDecise((d) => ({ ...d, [c.id]: "confermata" }));
    setCorretti((m) => ({ ...m, [c.id]: pulito }));
    avvia(async () => {
      await correggiCampo(c.id, pulito);
    });
  }

  function apri(r: RigaVista, i: number) {
    setCella(i);
    setBozza(mostra(r.celle[i]) ?? "");
    setScrivo(true);
  }

  /* ── il fuoco segue il livello ───────────────────────────────────── */
  useEffect(() => {
    if (scrivo) campo.current?.focus();
    else if (cella !== null) bottoni.current[cella]?.focus();
  }, [cella, scrivo]);

  /* ── La tastiera. È tutto il punto: senza, restano venti clic. ───── */
  useEffect(() => {
    function tasto(e: KeyboardEvent) {
      if (!corrente) return;
      // Mentre si scrive comanda il campo, che ha il suo gestore.
      const dentroUnCampo =
        e.target instanceof HTMLElement &&
        ["INPUT", "TEXTAREA", "SELECT"].includes(e.target.tagName);
      if (dentroUnCampo) return;

      const k = e.key;
      const basso = k.toLowerCase();

      /* — livello riga — */
      if (cella === null) {
        if (k === "Enter") {
          e.preventDefault();
          confermaResto(corrente);
        } else if (basso === "e") {
          e.preventDefault();
          apri(corrente, dove(corrente));
        } else if (basso === "x") {
          e.preventDefault();
          scartaRiga(corrente);
        } else if (k === "ArrowRight" || k === "Tab") {
          e.preventDefault();
          setCella(dove(corrente));
        } else if (k === "ArrowDown") {
          e.preventDefault();
          setIndice((i) => Math.min(i + 1, restanti.length - 1));
        } else if (k === "ArrowUp") {
          e.preventDefault();
          setIndice((i) => Math.max(i - 1, 0));
        }
        return;
      }

      /* — livello cella — */
      const c = corrente.celle[cella];
      if (!c) return;

      if (k === "Enter") {
        e.preventDefault();
        const dopo = daGuardare(corrente, cella + 1);
        // Se non resta niente da guardare, l'Invio vale quello che
        // valeva al livello di sopra: chiude la riga e passa avanti.
        if (dopo === null) confermaResto(corrente);
        else {
          confermaCella(c);
          setCella(dopo);
        }
      } else if (basso === "e") {
        e.preventDefault();
        apri(corrente, cella);
      } else if (basso === "x") {
        e.preventDefault();
        scartaCella(c);
        const dopo = daGuardare(corrente, cella + 1);
        if (dopo !== null) setCella(dopo);
      } else if (k === "ArrowRight") {
        e.preventDefault();
        setCella(Math.min(cella + 1, corrente.celle.length - 1));
      } else if (k === "ArrowLeft") {
        e.preventDefault();
        if (cella === 0) risali();
        else setCella(cella - 1);
      } else if (k === "Escape" || k === "ArrowUp") {
        e.preventDefault();
        risali();
      } else if (k === "ArrowDown") {
        e.preventDefault();
        risali();
        setIndice((i) => Math.min(i + 1, restanti.length - 1));
      }
    }
    window.addEventListener("keydown", tasto);
    return () => window.removeEventListener("keydown", tasto);
  });

  /* ── la tastiera dentro il campo di scrittura ────────────────────── */
  function tastoNelCampo(e: EventoTasto<HTMLInputElement>) {
    if (!corrente || cella === null) return;
    const c = corrente.celle[cella];
    if (!c) return;

    if (e.key === "Enter") {
      e.preventDefault();
      salvaCella(c, bozza);
      const dopo = daGuardare(corrente, cella + 1);
      if (dopo === null) confermaResto(corrente);
      else apri(corrente, dopo);
    } else if (e.key === "Tab") {
      // Tab scorre le colonne una per una: è il modo di riscrivere una
      // riga intera senza mai staccare le mani dalla tastiera.
      e.preventDefault();
      salvaCella(c, bozza);
      const passo = e.shiftKey ? -1 : 1;
      const dopo = cella + passo;
      if (dopo < 0 || dopo >= corrente.celle.length) confermaResto(corrente);
      else apri(corrente, dopo);
    } else if (e.key === "Escape") {
      e.preventDefault();
      setScrivo(false);
    }
  }

  const pagina = corrente?.pagina ?? 1;
  const immagine = mime.startsWith("image/");

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
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
                {sicure === 1
                  ? "Conferma la riga che torna"
                  : `Conferma le ${sicure} righe che tornano`}
              </button>
              <p className="mt-1.5 text-[11px] leading-relaxed text-gray-light">
                {sicure === 1
                  ? "È una riga in cui ogni singola cella è stata letta in chiaro sul documento."
                  : "Sono le righe in cui ogni singola cella è stata letta in chiaro sul documento."}
                {manoscritte > 0 && (
                  <>
                    {" "}
                    {manoscritte === 1
                      ? "La riga scritta a mano resta da guardare"
                      : `Le ${manoscritte} righe scritte a mano restano da guardare una per una`}
                    : una grafia non la conferma un automatismo.
                  </>
                )}
              </p>
            </form>
          )}
        </div>

        {/* La riga in corso, grande. */}
        {corrente ? (
          <div
            key={corrente.riga}
            className="mt-3 rounded-xl border-2 border-pine/30 bg-white p-4"
          >
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

            {/* Com'è scritta sul foglio. Solo quando la citazione è
                davvero di tutta la riga: nei documenti letti adesso ogni
                cella porta la sua, e si vede sotto la cella scelta. */}
            {corrente.estrattoDa && (
              <p className="mt-2 rounded-lg bg-paper px-3 py-2 font-mono text-[11px] leading-relaxed text-gray-warm">
                {corrente.estrattoDa}
              </p>
            )}

            {/* ═══ LE CELLE ═══ */}
            <ul className="mt-3 space-y-1">
              {corrente.celle.map((c, i) => {
                const riscritta = corretti[c.id] !== undefined;
                const giudizio = riscritta
                  ? RISCRITTA
                  : statoCella({ ...c, valore: mostra(c) });
                const segno = riscritta ? SEGNO_RISCRITTA : SEGNO[giudizio.chiave];
                const scelta = decise[c.id];
                const scelto = cella === i;
                const valore = mostra(c);
                return (
                  <li key={c.id} className="flex items-stretch gap-2">
                    <span
                      aria-hidden
                      className={`w-[3px] shrink-0 rounded-full ${segno.filetto}`}
                    />
                    <div className="min-w-0 flex-1">
                      <button
                        ref={(n) => {
                          bottoni.current[i] = n;
                        }}
                        type="button"
                        onClick={() => setCella(i)}
                        // Anche il Tab del browser sceglie la cella: due
                        // modi di muoversi che portassero a stati diversi
                        // sarebbero un'interfaccia che mente.
                        onFocus={() => setCella(i)}
                        onDoubleClick={() => apri(corrente, i)}
                        aria-current={scelto ? "true" : undefined}
                        className={
                          "flex w-full flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 rounded-lg px-2 py-1 text-left outline-none transition-colors " +
                          (scelto
                            ? "bg-moss ring-2 ring-pine"
                            : "hover:bg-paper focus-visible:ring-2 focus-visible:ring-pine")
                        }
                      >
                        <span className="flex items-baseline gap-1.5 text-xs text-gray-warm">
                          {c.etichetta}
                          {giudizio.etichetta && (
                            <span
                              title={giudizio.spiega}
                              className={`rounded px-1 py-px text-[9px] font-semibold uppercase tracking-wide ${segno.targa}`}
                            >
                              {giudizio.etichetta}
                            </span>
                          )}
                        </span>

                        {scrivo && scelto ? (
                          <span className="flex-1 text-right text-[11px] text-gray-light">
                            scrivi qui sotto
                          </span>
                        ) : (
                          <span
                            className={
                              "flex-1 text-right text-sm font-semibold tabular-nums " +
                              (scelta === "scartata"
                                ? "text-gray-light line-through"
                                : "text-ink")
                            }
                          >
                            {valore === null || valore === "" ? (
                              <span className="font-normal text-gray-light">—</span>
                            ) : (
                              formattaValore(valore, c.unita)
                            )}
                            {scelta === "confermata" && (
                              <Check
                                size={12}
                                aria-hidden
                                className="ml-1 inline text-mint"
                              />
                            )}
                          </span>
                        )}
                        {/* Quello che il segno dice, per chi non lo vede. */}
                        <span className="sr-only">{giudizio.spiega}</span>
                      </button>

                      {/* Il campo di scrittura, dentro la cella scelta. */}
                      {scrivo && scelto && (
                        <div className="mt-1 px-2">
                          <label htmlFor={`c-${c.id}`} className="sr-only">
                            {c.etichetta}
                          </label>
                          <input
                            id={`c-${c.id}`}
                            ref={campo}
                            value={bozza}
                            onChange={(e) => setBozza(e.target.value)}
                            onKeyDown={tastoNelCampo}
                            className="w-full rounded-lg border border-pine px-2 py-1 text-sm text-ink outline-none focus:border-mint"
                          />
                          <p className="mt-1 text-[10px] text-gray-light">
                            Invio salva e va alla prossima da guardare · Tab alla
                            colonna dopo · Esc lascia com&apos;era
                          </p>
                        </div>
                      )}

                      {/* LA PROVENIENZA DELLA CELLA SCELTA: il pezzo di
                          documento da cui viene QUESTO valore, non la riga
                          intera. È la differenza che rende la conferma una
                          verifica invece di un gesto. */}
                      {scelto && !scrivo && c.estrattoDa && !corrente.estrattoDa && (
                        <p className="mt-1 rounded-lg bg-paper px-2 py-1 font-mono text-[10px] leading-relaxed text-gray-warm">
                          {c.estrattoDa}
                        </p>
                      )}
                      {/* Gli avvisi parlavano del NOSTRO valore: su uno
                          riscritto dal cliente non hanno più oggetto. */}
                      {scelto &&
                        !riscritta &&
                        c.avvisi.map((a) => (
                          <p
                            key={a}
                            className="mt-1 px-2 text-[10px] leading-relaxed text-amber-ink"
                          >
                            {a}
                          </p>
                        ))}
                    </div>
                  </li>
                );
              })}
            </ul>

            {corrente.nota && (
              <p className="mt-2 text-[11px] leading-relaxed text-gray-warm">
                {corrente.nota}
              </p>
            )}

            {/* Gli avvisi della riga si mostrano solo al livello riga: al
                livello cella sarebbero ripetuti sotto la cella che li ha
                generati, e due volte la stessa frase si smette di leggerla. */}
            {cella === null &&
              corrente.avvisi.map((a) => (
                <p key={a} className="mt-1 text-[11px] leading-relaxed text-amber-ink">
                  {a}
                </p>
              ))}

            <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-line pt-3">
              {cella === null ? (
                <>
                  <button
                    type="button"
                    onClick={() => confermaResto(corrente)}
                    className="vz-press inline-flex items-center gap-1.5 rounded-lg bg-pine px-3 py-1.5 text-xs font-semibold text-white"
                  >
                    <Check size={13} aria-hidden /> Confermo la riga
                    <kbd className="ml-1 rounded bg-white/20 px-1 text-[10px]">
                      Invio
                    </kbd>
                  </button>
                  <button
                    type="button"
                    onClick={() => apri(corrente, dove(corrente))}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-1.5 text-xs font-medium text-gray-warm hover:border-pine hover:text-pine"
                  >
                    <PenLine size={13} aria-hidden /> Correggo
                    <kbd className="rounded bg-paper px-1 text-[10px]">E</kbd>
                  </button>
                  <button
                    type="button"
                    onClick={() => scartaRiga(corrente)}
                    className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-gray-light hover:text-amber-ink"
                  >
                    <X size={13} aria-hidden /> Scarto la riga
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
              ) : (
                <>
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-pine">
                    {corrente.celle[cella]?.etichetta}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const c = corrente.celle[cella];
                      const dopo = daGuardare(corrente, cella + 1);
                      if (dopo === null) confermaResto(corrente);
                      else {
                        confermaCella(c);
                        setCella(dopo);
                      }
                    }}
                    className="vz-press inline-flex items-center gap-1.5 rounded-lg bg-pine px-3 py-1.5 text-xs font-semibold text-white"
                  >
                    <Check size={13} aria-hidden /> Confermo la cella
                    <kbd className="ml-1 rounded bg-white/20 px-1 text-[10px]">
                      Invio
                    </kbd>
                  </button>
                  <button
                    type="button"
                    onClick={() => apri(corrente, cella)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-1.5 text-xs font-medium text-gray-warm hover:border-pine hover:text-pine"
                  >
                    <PenLine size={13} aria-hidden /> Correggo
                    <kbd className="rounded bg-paper px-1 text-[10px]">E</kbd>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      scartaCella(corrente.celle[cella]);
                      const dopo = daGuardare(corrente, cella + 1);
                      if (dopo !== null) setCella(dopo);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-gray-light hover:text-amber-ink"
                  >
                    <X size={13} aria-hidden /> Scarto la cella
                    <kbd className="rounded bg-paper px-1 text-[10px]">X</kbd>
                  </button>
                  <button
                    type="button"
                    onClick={risali}
                    className="ml-auto rounded-lg px-2 py-1.5 text-xs font-medium text-gray-light hover:text-ink"
                  >
                    Torno alla riga
                    <kbd className="ml-1 rounded bg-paper px-1 text-[10px]">Esc</kbd>
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
          {cella === null ? (
            <>
              Invio conferma la riga e passa alla dopo · E corregge · X scarta ·
              ↑ ↓ per muoverti · → per scendere sulla cella da guardare.
            </>
          ) : (
            <>
              Invio conferma la cella e salta alla prossima da guardare · E
              corregge · X scarta solo questa · ← → fra le colonne · Esc torna
              alla riga.
            </>
          )}
          {inCorso && <span className="ml-2 text-mint">salvataggio…</span>}
        </p>
      </div>
    </div>
  );
}
