"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Search } from "lucide-react";

import {
  Scrolly,
  ScrollyProgress,
  ScrollyStage,
  ScrollyStep,
  ScrollySteps,
} from "@/components/scrolly";
import { PASSI, type Passo } from "@/lib/guida-passi";
import { IMPRESA_ESEMPIO } from "@/lib/impresa-esempio";

/**
 * LA GUIDA IN CINQUE PASSI — che cosa succede, dal posto in cui sta il
 * cliente.
 *
 * ═══ DUE RESE, UN CONTENUTO (CLAUDE.md, «adattare non degradare») ═══
 * Sul largo la narrazione allo scorrimento, che è l'unica impalcatura
 * del sito (`Scrolly`) e non se ne scrive una seconda. Sullo stretto un
 * passo alla volta con avanti e indietro: non è la sequenza impilata che
 * `Scrolly` fa da sé — quella è ottima per una lista di declinazioni, ma
 * qui i passi sono cinque schermate e impilarle vorrebbe dire cinque
 * schermate di scorrimento per una cosa che si guarda in venti secondi.
 * Per questo `revealSuStretto` è spento: la resa stretta ce l'ha già.
 *
 * Le due rese stanno ENTRAMBE nel markup e sceglie il CSS, così
 * `display: none` toglie quella inattiva anche dall'albero di
 * accessibilità e non c'è nessuna scelta dopo l'idratazione.
 *
 * ═══ LE SCHERMATE SONO DISEGNI, NON SCREENSHOT ═══
 * SVG e CSS, nel linguaggio già in uso: nessuna libreria, nessuna
 * illustrazione estranea, nessuna immagine di prodotto. E l'impresa è
 * quella dichiaratamente inventata (`IMPRESA_ESEMPIO`), come impone la
 * regola sui dati nelle pagine pubbliche.
 *
 * ═══ COSA NON C'È, E NON DEVE ARRIVARCI ═══
 * Nessun documento associato a una norma, nessuna logica di lettura,
 * nessuna banca dati nominata, nessun tempo promesso. I testi stanno in
 * `src/lib/guida-passi.ts` con la stessa avvertenza scritta sopra.
 */

/* ------------------------------------------------------------------ */
/* Le schermate: SVG e nient'altro                                     */
/* ------------------------------------------------------------------ */

/** La cornice comune: una finestra stilizzata, non un browser disegnato. */
function Schermo({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-md rounded-2xl border border-line bg-white p-4 shadow-soft sm:p-5">
      {children}
    </div>
  );
}

/** Una riga di testo finto: un rettangolo, non del lorem ipsum. */
function Riga({ largo = "w-full" }: { largo?: string }) {
  return <div className={`h-2 rounded-full bg-line ${largo}`} />;
}

/** 1 — la barra che riceve una richiesta e restituisce percorsi. */
function SchermoRicerca() {
  return (
    <Schermo>
      <div className="flex items-center gap-2 rounded-xl border-2 border-pine/25 px-3 py-2.5">
        <Search size={15} className="shrink-0 text-pine" aria-hidden />
        <span className="truncate text-[13px] text-ink">
          me lo chiede la banca
        </span>
      </div>
      <p className="mt-3 text-[10px] font-semibold uppercase tracking-widest text-gray-light">
        Tre percorsi che c&apos;entrano
      </p>
      <ul className="mt-2 space-y-2">
        {[0, 1, 2].map((i) => (
          <li
            key={i}
            className="flex items-center gap-3 rounded-lg border border-line px-3 py-2"
          >
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-mint" aria-hidden />
            <div className="min-w-0 flex-1 space-y-1.5">
              <Riga largo={["w-3/4", "w-2/3", "w-4/5"][i]} />
              <Riga largo="w-1/3" />
            </div>
          </li>
        ))}
      </ul>
    </Schermo>
  );
}

/** 2 — la scheda con prezzo e perimetro, e il pulsante di attivazione. */
function SchermoScheda() {
  return (
    <Schermo>
      <div className="flex items-baseline justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-2">
          <Riga largo="w-4/5" />
          <Riga largo="w-1/2" />
        </div>
        <span className="shrink-0 rounded-md bg-pine/10 px-2 py-1 text-[11px] font-semibold text-pine">
          prezzo in chiaro
        </span>
      </div>
      <div className="mt-4 rounded-lg border border-line bg-paper p-3">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-light">
          Cosa comprende, e cosa no
        </p>
        <div className="mt-2 space-y-1.5">
          <Riga largo="w-full" />
          <Riga largo="w-5/6" />
        </div>
      </div>
      <div className="mt-4 h-8 rounded-lg bg-pine" aria-hidden />
    </Schermo>
  );
}

/** L'anello di completamento: lo stesso segno del portale. */
function Anello({ percento }: { percento: number }) {
  const r = 26;
  const giro = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 64 64" className="h-16 w-16 shrink-0" aria-hidden>
      <circle cx="32" cy="32" r={r} fill="none" stroke="#E3E7E1" strokeWidth="6" />
      <circle
        cx="32"
        cy="32"
        r={r}
        fill="none"
        stroke="#2FCF9A"
        strokeWidth="6"
        strokeLinecap="round"
        strokeDasharray={`${(giro * percento) / 100} ${giro}`}
        transform="rotate(-90 32 32)"
      />
      <text
        x="32"
        y="37"
        textAnchor="middle"
        className="fill-ink font-display text-[15px] font-semibold"
      >
        {percento}%
      </text>
    </svg>
  );
}

/** 3 — la dashboard che si apre col lavoro già in buona parte fatto. */
function SchermoDashboard() {
  return (
    <Schermo>
      <div className="flex items-center gap-4">
        <Anello percento={68} />
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-[15px] font-semibold text-ink">
            {IMPRESA_ESEMPIO.nome}
          </p>
          <p className="text-[11px] text-gray-light">impresa di esempio</p>
        </div>
      </div>
      <ul className="mt-4 space-y-2">
        {[true, true, false].map((fatto, i) => (
          <li key={i} className="flex items-center gap-3">
            <span
              aria-hidden
              className={
                "flex h-4 w-4 shrink-0 items-center justify-center rounded-full " +
                (fatto ? "bg-mint text-white" : "border border-line")
              }
            >
              {fatto && <Check size={10} strokeWidth={3} />}
            </span>
            <Riga largo={fatto ? "w-2/3" : "w-1/2"} />
          </li>
        ))}
      </ul>
    </Schermo>
  );
}

/** 4 — i pochi dati da confermare, e l'anello che sale. */
function SchermoConferma() {
  return (
    <Schermo>
      <div className="flex items-center justify-between gap-4">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-light">
          Da confermare
        </p>
        <Anello percento={84} />
      </div>
      <ul className="mt-1 space-y-2">
        {["w-3/5", "w-2/3"].map((largo, i) => (
          <li
            key={i}
            className="flex items-center gap-3 rounded-lg border border-line px-3 py-2"
          >
            <div className="min-w-0 flex-1 space-y-1.5">
              <Riga largo={largo} />
            </div>
            <span className="shrink-0 rounded-md bg-mint/15 px-2 py-0.5 text-[10px] font-semibold text-pine">
              conferma
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-[11px] leading-relaxed text-gray-warm">
        E i documenti che hai già in azienda, da portare quando ti fa comodo.
      </p>
    </Schermo>
  );
}

/** 5 — il documento, il Sigillo, il Kit. */
function SchermoConsegna() {
  return (
    <Schermo>
      <div className="grid grid-cols-3 gap-3">
        {[
          { etichetta: "Documento", pieno: true },
          { etichetta: "Sigillo", pieno: false },
          { etichetta: "Kit", pieno: false },
        ].map((c) => (
          <div
            key={c.etichetta}
            className="rounded-lg border border-line p-2.5 text-center"
          >
            <div
              aria-hidden
              className={
                "mx-auto h-10 w-8 rounded-sm " +
                (c.pieno ? "bg-pine/15 ring-1 ring-pine/30" : "bg-paper ring-1 ring-line")
              }
            />
            <p className="mt-2 text-[10px] font-medium text-gray-warm">
              {c.etichetta}
            </p>
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center gap-3 rounded-lg bg-paper px-3 py-2.5">
        <Anello percento={100} />
        <div className="min-w-0 flex-1 space-y-1.5">
          <Riga largo="w-3/4" />
          <Riga largo="w-1/2" />
        </div>
      </div>
    </Schermo>
  );
}

const SCHERMI = [
  SchermoRicerca,
  SchermoScheda,
  SchermoDashboard,
  SchermoConferma,
  SchermoConsegna,
];

/* ------------------------------------------------------------------ */
/* Il testo di un passo, uguale nelle due rese                         */
/* ------------------------------------------------------------------ */

function TestoPasso({ passo }: { passo: Passo }) {
  return (
    <>
      <p className="text-xs font-semibold tracking-widest text-pine">
        PASSO {passo.n} DI {PASSI.length}
      </p>
      <h3 className="mt-3 font-display text-3xl leading-[1.08] text-ink md:text-4xl">
        {passo.titolo}
      </h3>
      <p className="mt-3 max-w-sm text-[15px] leading-relaxed text-gray-warm">
        {passo.riga}
      </p>
    </>
  );
}

/* ------------------------------------------------------------------ */

export function GuidaPassi() {
  /* — La resa stretta: un passo per volta, a mano — */
  const [passo, setPasso] = useState(0);
  /**
   * Finché il JavaScript non è montato, i cinque passi stanno tutti in
   * pagina impilati. È l'unico modo perché su uno schermo stretto senza
   * JS non ne resti visibile uno solo, con quattro contenuti spariti e
   * due bottoni che non fanno niente: nessun testo può mancare per un
   * effetto (regola del movimento, CLAUDE.md).
   */
  const [montato, setMontato] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- è proprio il fatto di ESSERE montati: prima non si può sapere
    setMontato(true);
  }, []);

  return (
    <>
      {/* ═══ LARGO: la narrazione allo scorrimento ═══ */}
      <div className="hidden md:block">
        <Scrolly steps={5} revealSuStretto={false}>
          <ScrollyStage>
            <div className="mx-auto w-full max-w-5xl px-5">
              {/* UNA FASE = testo E schermata insieme, non due colonne
                  che si avvicendano in parallelo. Con due gruppi di fasi
                  affiancati, nel ripiego — riduci movimento, nessuna
                  scroll-timeline — le due colonne si impilano ognuna per
                  conto suo e il passo 5 finisce accanto alla schermata 4.
                  Appaiati stanno insieme in tutte e due le rese. */}
              <ScrollySteps className="min-h-[24rem]">
                {PASSI.map((p, i) => {
                  const Schermata = SCHERMI[i]!;
                  return (
                    <ScrollyStep key={p.n} index={p.n}>
                      <div className="grid grid-cols-[1fr_1.1fr] items-center gap-12">
                        <div>
                          <TestoPasso passo={p} />
                        </div>
                        <Schermata />
                      </div>
                    </ScrollyStep>
                  );
                })}
              </ScrollySteps>
              <div className="mt-10">
                <ScrollyProgress />
              </div>
            </div>
          </ScrollyStage>
        </Scrolly>
      </div>

      {/* ═══ STRETTO: un passo alla volta, con i comandi ═══ */}
      <div className="px-5 md:hidden">
        <div aria-live="polite">
          {PASSI.map((p, i) => {
            const Schermata = SCHERMI[i]!;
            return (
              <div
                key={p.n}
                hidden={montato && i !== passo}
                className={montato ? undefined : "mb-12 last:mb-0"}
              >
                <TestoPasso passo={p} />
                <div className="mt-6">
                  <Schermata />
                </div>
              </div>
            );
          })}
        </div>

        {/* I comandi servono solo dove il JavaScript c'è: senza, i passi
            sono già tutti in pagina e due bottoni inerti sarebbero
            peggio di nessun bottone. */}
        <div
          hidden={!montato}
          className="mt-6 flex items-center justify-between gap-4"
        >
          <button
            type="button"
            onClick={() => setPasso((p) => Math.max(0, p - 1))}
            disabled={passo === 0}
            className="vz-press inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-2 text-sm font-medium text-ink disabled:opacity-35"
          >
            <ArrowLeft size={15} aria-hidden />
            Indietro
          </button>

          {/* I pallini sono anche il comando: si tocca il passo che
              interessa senza passare per quelli in mezzo. */}
          <ol className="flex items-center gap-2">
            {PASSI.map((p, i) => (
              <li key={p.n}>
                <button
                  type="button"
                  onClick={() => setPasso(i)}
                  aria-label={`Passo ${p.n}: ${p.titolo}`}
                  aria-current={i === passo ? "step" : undefined}
                  className={
                    "vz-stato block h-2 w-2 rounded-full " +
                    (i === passo ? "w-5 bg-pine" : "bg-line")
                  }
                />
              </li>
            ))}
          </ol>

          <button
            type="button"
            onClick={() => setPasso((p) => Math.min(PASSI.length - 1, p + 1))}
            disabled={passo === PASSI.length - 1}
            className="vz-press inline-flex items-center gap-1.5 rounded-lg bg-pine px-3 py-2 text-sm font-semibold text-white disabled:opacity-35"
          >
            Avanti
            <ArrowRight size={15} aria-hidden />
          </button>
        </div>
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* La versione ridotta per la home: i soli titoli                      */
/* ------------------------------------------------------------------ */

/**
 * In home i cinque titoli e basta: la home dice CHE c'è un percorso, la
 * pagina lo mostra. Ripetere qui le schermate vorrebbe dire due volte la
 * stessa spiegazione, e la seconda in un posto dove nessuno l'ha chiesta.
 */
export function GuidaPassiTitoli() {
  return (
    <ol className="mx-auto grid max-w-4xl gap-3 sm:grid-cols-5 sm:gap-2">
      {PASSI.map((p, i) => (
        <li
          key={p.n}
          className="vz-reveal flex items-center gap-3 sm:block"
          style={{ "--vz-i": i } as React.CSSProperties}
        >
          <span
            aria-hidden
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-mint-bright/45 font-display text-[13px] text-mint-bright"
          >
            {p.n}
          </span>
          <p className="font-display text-[15px] leading-snug text-white sm:mt-3">
            {p.titolo}
          </p>
        </li>
      ))}
    </ol>
  );
}
