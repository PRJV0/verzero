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
import { FoglioDocumento } from "@/components/documento-esito";
import { IMPRESA_ESEMPIO } from "@/lib/impresa-esempio";

/**
 * LA GUIDA IN CINQUE PASSI — che cosa succede, dal posto in cui sta il
 * cliente.
 *
 * ═══ IL VISIVO COMANDA, E RIEMPIE ═══
 * La prima versione metteva una cartolina di 448 px in mezzo a un palco
 * alto una schermata intera: il contenuto ne occupava il 40%, e una
 * sezione mezza vuota sembra una sezione non finita. Ora il mockup
 * prende il 60% della larghezza e cresce fino a riempire l'altezza
 * utile; se avanza spazio cresce il mockup, non il margine. Il testo sta
 * in colonna stretta, centrato sul mezzo ottico del visivo.
 *
 * ═══ CINQUE INQUADRATURE, NON CINQUE IMMAGINI ═══
 * La cornice è UNA e non si muove: la stessa finestra, la stessa barra,
 * gli stessi ancoraggi. Fra un passo e l'altro cambia il contenuto, ma
 * ciò che i due passi hanno in comune resta al suo posto — l'anello che
 * sale da 68 a 84 a 100, il documento che si riempie, la scheda che
 * nasce dal risultato scelto al passo prima. Con l'avvicendamento in
 * dissolvenza questo si legge come una progressione; se ogni passo
 * ridisegnasse tutto, si leggerebbero cinque schermate slegate.
 *
 * ═══ MOCKUP, NON SCREENSHOT ═══
 * SVG e CSS, nel linguaggio già in uso: nessuna libreria, nessuna
 * illustrazione estranea, nessuna immagine di prodotto. L'impresa è
 * quella dichiaratamente inventata (`IMPRESA_ESEMPIO`) e i PREZZI
 * arrivano dal listino vero, passati dalla pagina: un prezzo scritto a
 * mano dentro un mockup è comunque un prezzo scritto a mano.
 *
 * ═══ COSA NON C'È, E NON DEVE ARRIVARCI ═══
 * Nessun documento associato a una norma, nessuna sezione alimentata da
 * un documento, nessuna logica di lettura, nessuna banca dati nominata,
 * nessun tempo promesso. La provenienza dei campi si dice con le parole
 * del prodotto — «letto», «da confermare» — non con la mappa di quale
 * documento produce cosa.
 */

/* ------------------------------------------------------------------ */
/* Quello che la pagina passa: prezzi e nomi veri, mai riscritti qui   */
/* ------------------------------------------------------------------ */

export type VetrinaGuida = {
  /** I tre risultati sotto la barra di ricerca, al passo 1. */
  risultati: { nome: string; taglio: string; prezzo: string; riga: string }[];
  /** La scheda che si apre al passo 2. */
  scheda: { nome: string; taglio: string; prezzo: string; copre: string[] };
};

/* ------------------------------------------------------------------ */
/* La cornice, unica per tutti e cinque                                */
/* ------------------------------------------------------------------ */

/**
 * La finestra. Non è un browser disegnato: è un riquadro con una barra,
 * quel tanto che basta perché si legga «questa è un'interfaccia».
 * `h-full` e la colonna interna in `flex` sono ciò che fa riempire
 * l'altezza al contenuto invece di lasciare una fascia vuota in fondo.
 */
function Finestra({
  luogo,
  children,
}: {
  luogo: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-full w-full flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-lift">
      <div className="flex shrink-0 items-center gap-2.5 border-b border-line bg-paper px-4 py-2.5">
        <span aria-hidden className="flex gap-1.5">
          {["bg-line", "bg-line", "bg-line"].map((c, i) => (
            <span key={i} className={`block h-2 w-2 rounded-full ${c}`} />
          ))}
        </span>
        <span className="truncate rounded-md bg-white px-2.5 py-1 text-[11px] text-gray-light ring-1 ring-line">
          {luogo}
        </span>
      </div>
      <div className="flex min-h-0 flex-1 flex-col p-4 sm:p-5">{children}</div>
    </div>
  );
}

/* Qui c'era `Riga`, il rettangolo grigio che faceva da testo finto.
   Non serve più: nessuna delle cinque schermate contiene segnaposto —
   i risultati hanno i nomi e i prezzi veri del catalogo, i campi
   mancanti dicono «ancora da inserire», e il documento del quinto passo
   è quello vero. Un mockup credibile non ha righe grigie dentro. */

/**
 * L'ANELLO — l'elemento che attraversa i passi 3, 4 e 5.
 *
 * Sta sempre nella stessa posizione dentro la finestra e cambia solo il
 * riempimento: è quello che fa leggere i tre passi come una cosa sola
 * che avanza invece che come tre schermate diverse.
 */
function Anello({ percento, grande = false }: { percento: number; grande?: boolean }) {
  const r = 28;
  const giro = 2 * Math.PI * r;
  return (
    <svg
      viewBox="0 0 68 68"
      className={grande ? "h-[4.5rem] w-[4.5rem] shrink-0" : "h-14 w-14 shrink-0"}
      aria-hidden
    >
      <circle cx="34" cy="34" r={r} fill="none" stroke="#E3E7E1" strokeWidth="6" />
      <circle
        cx="34"
        cy="34"
        r={r}
        fill="none"
        stroke="#2FCF9A"
        strokeWidth="6"
        strokeLinecap="round"
        strokeDasharray={`${(giro * percento) / 100} ${giro}`}
        transform="rotate(-90 34 34)"
      />
      <text
        x="34"
        y="39"
        textAnchor="middle"
        className="fill-ink font-display text-[16px] font-semibold"
      >
        {percento}%
      </text>
    </svg>
  );
}

/** La testata del documento nel portale: c'è ai passi 3, 4 e 5, uguale. */
function TestataDocumento({
  percento,
  stato,
}: {
  percento: number;
  stato: string;
}) {
  return (
    <div className="flex shrink-0 items-center gap-4 border-b border-line pb-4">
      <Anello percento={percento} />
      <div className="min-w-0 flex-1">
        <p className="truncate font-display text-[17px] font-semibold leading-tight text-ink">
          Bilancio di Sostenibilità
        </p>
        <p className="mt-0.5 truncate text-[12px] text-gray-light">
          {IMPRESA_ESEMPIO.nome} · impresa di esempio
        </p>
      </div>
      <span className="shrink-0 rounded-full bg-mint/12 px-2.5 py-1 text-[11px] font-semibold text-pine">
        {stato}
      </span>
    </div>
  );
}

/** Una riga di dato nel documento: etichetta, valore, provenienza. */
function Campo({
  etichetta,
  valore,
  provenienza,
  daFare = false,
}: {
  etichetta: string;
  valore?: string;
  provenienza?: string;
  daFare?: boolean;
}) {
  return (
    <li
      className={
        "flex items-center gap-3 rounded-lg px-3 py-2.5 " +
        (daFare ? "bg-amber-soft/50 ring-1 ring-amber-ink/20" : "bg-paper/70")
      }
    >
      <span
        aria-hidden
        className={
          "flex h-4 w-4 shrink-0 items-center justify-center rounded-full " +
          (daFare ? "border border-amber-ink/40" : "bg-mint text-white")
        }
      >
        {!daFare && <Check size={10} strokeWidth={3} />}
      </span>
      <span className="w-[38%] shrink-0 truncate text-[12px] text-gray-light">
        {etichetta}
      </span>
      {/* Un valore che manca si dice, non si disegna: una barra grigia
          è un segnaposto, e un segnaposto dentro un mockup che deve
          essere credibile è la cosa che lo rende finto. */}
      <span
        className={
          "min-w-0 flex-1 truncate text-[12.5px] " +
          (valore ? "font-medium text-ink" : "italic text-gray-light")
        }
      >
        {valore ?? "ancora da inserire"}
      </span>
      {provenienza && (
        <span
          className={
            "shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium " +
            (daFare
              ? "bg-amber-ink/10 text-amber-ink"
              : "bg-line/70 text-gray-warm")
          }
        >
          {provenienza}
        </span>
      )}
    </li>
  );
}

/* ------------------------------------------------------------------ */
/* Le cinque inquadrature                                              */
/* ------------------------------------------------------------------ */

/** 1 — la barra riceve una richiesta e restituisce percorsi. */
function VistaRicerca({ vetrina }: { vetrina: VetrinaGuida }) {
  return (
    <Finestra luogo="verzero.it">
      <div className="flex items-center gap-2.5 rounded-xl border-2 border-pine/30 bg-white px-3.5 py-3">
        <Search size={16} className="shrink-0 text-pine" aria-hidden />
        <span className="truncate text-[14px] text-ink">
          me lo chiede la banca
        </span>
        <span
          aria-hidden
          className="ml-auto h-4 w-px shrink-0 animate-pulse bg-pine"
        />
      </div>

      <p className="mt-4 shrink-0 text-[11px] font-semibold text-mint">
        Se parti da zero
      </p>

      <ul className="mt-2 flex min-h-0 flex-1 flex-col gap-2.5">
        {vetrina.risultati.map((r, i) => (
          <li
            key={r.nome + r.taglio}
            className={
              "flex flex-1 items-center gap-3 rounded-xl border px-3.5 py-3 " +
              (i === 0 ? "border-pine/40 bg-pine/[0.04]" : "border-line")
            }
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-3">
                <p className="truncate text-[13.5px] font-semibold leading-tight text-ink">
                  {r.nome}
                </p>
                <span className="shrink-0 text-[12px] font-semibold text-pine">
                  {r.prezzo}
                </span>
              </div>
              <p className="mt-0.5 truncate text-[11.5px] text-gray-light">
                {r.taglio}
              </p>
              <p className="mt-1.5 line-clamp-2 text-[11.5px] leading-relaxed text-gray-warm">
                {r.riga}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </Finestra>
  );
}

/** 2 — il primo risultato si apre: prezzo, perimetro, attivazione. */
function VistaScheda({ vetrina }: { vetrina: VetrinaGuida }) {
  return (
    <Finestra luogo="verzero.it / percorso">
      <div className="flex shrink-0 items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="font-display text-[19px] font-semibold leading-tight text-ink">
            {vetrina.scheda.nome}
          </p>
          <p className="mt-1 text-[12px] text-gray-light">
            {vetrina.scheda.taglio}
          </p>
        </div>
        <p className="shrink-0 font-display text-[17px] font-semibold text-pine">
          {vetrina.scheda.prezzo}
        </p>
      </div>

      <div className="mt-4 flex min-h-0 flex-1 flex-col rounded-xl border border-line bg-paper/60 p-3.5">
        <p className="shrink-0 text-[10px] font-semibold uppercase tracking-widest text-gray-light">
          Cosa comprende
        </p>
        <ul className="mt-2.5 flex min-h-0 flex-1 flex-col justify-around gap-2">
          {vetrina.scheda.copre.map((c) => (
            <li key={c} className="flex items-center gap-2.5">
              <Check size={13} className="shrink-0 text-mint" strokeWidth={3} />
              <span className="truncate text-[12.5px] text-ink">{c}</span>
            </li>
          ))}
          <li className="flex items-center gap-2.5 border-t border-line pt-2">
            <span
              aria-hidden
              className="h-px w-3 shrink-0 bg-gray-light"
            />
            <span className="truncate text-[12px] text-gray-light">
              La certificazione la rilascia un organismo terzo
            </span>
          </li>
        </ul>
      </div>

      <div className="mt-4 flex shrink-0 items-center justify-center rounded-xl bg-pine px-4 py-3 text-[13px] font-semibold text-white">
        Richiedi l&apos;attivazione
      </div>
    </Finestra>
  );
}

/** 3 — si entra e il documento è già in buona parte compilato. */
function VistaDashboard() {
  return (
    <Finestra luogo={`${IMPRESA_ESEMPIO.nome} · il tuo spazio`}>
      <TestataDocumento percento={68} stato="in lavorazione" />
      <ul className="mt-3.5 flex min-h-0 flex-1 flex-col justify-between gap-2">
        <Campo
          etichetta="Denominazione"
          valore={IMPRESA_ESEMPIO.nome}
          provenienza="letto"
        />
        <Campo
          etichetta="Partita IVA"
          valore={IMPRESA_ESEMPIO.piva}
          provenienza="letto"
        />
        <Campo etichetta="Sede legale" valore="Brescia (BS)" provenienza="letto" />
        <Campo etichetta="Addetti" valore="34" provenienza="letto" />
        <Campo etichetta="Consumi dell'anno" daFare provenienza="manca" />
        <Campo etichetta="Ore di formazione" daFare provenienza="manca" />
      </ul>
    </Finestra>
  );
}

/** 4 — restano pochi dati: si confermano, e l'anello sale. */
function VistaConferma() {
  return (
    <Finestra luogo={`${IMPRESA_ESEMPIO.nome} · il tuo spazio`}>
      <TestataDocumento percento={84} stato="da confermare" />
      <ul className="mt-3.5 flex min-h-0 flex-1 flex-col justify-between gap-2">
        <Campo
          etichetta="Denominazione"
          valore={IMPRESA_ESEMPIO.nome}
          provenienza="confermato"
        />
        <Campo
          etichetta="Partita IVA"
          valore={IMPRESA_ESEMPIO.piva}
          provenienza="confermato"
        />
        <Campo etichetta="Sede legale" valore="Brescia (BS)" provenienza="confermato" />
        <Campo etichetta="Addetti" valore="34" provenienza="confermato" />
        <Campo
          etichetta="Consumi dell'anno"
          valore="128.400 kWh"
          provenienza="da confermare"
          daFare
        />
        <Campo etichetta="Ore di formazione" daFare provenienza="manca" />
      </ul>
      <div className="mt-3.5 flex shrink-0 items-center gap-3">
        <span className="flex-1 text-[11.5px] leading-relaxed text-gray-warm">
          E i documenti che hai già in azienda, da portare quando ti fa comodo.
        </span>
        <span className="shrink-0 rounded-lg bg-pine px-3.5 py-2 text-[12px] font-semibold text-white">
          Conferma
        </span>
      </div>
    </Finestra>
  );
}

/**
 * 5 — il documento è finito: si ritira, e con lui il Sigillo e il Kit.
 *
 * Il foglio è lo STESSO che mostra `/come-funziona` — copertina,
 * riferimento normativo, indice, tabella dei dati, pagina di
 * validazione — e non un secondo disegno: è quello che nei passi 3 e 4
 * si stava completando, e la testata sopra è identica a quella di
 * prima con l'anello arrivato a cento. Prima qui c'erano righe grigie:
 * un documento «pronto» fatto di segnaposto dice il contrario di quello
 * che l'anello ha appena detto.
 */
function VistaConsegna() {
  return (
    <Finestra luogo={`${IMPRESA_ESEMPIO.nome} · il tuo spazio`}>
      <TestataDocumento percento={100} stato="pronto" />
      <div className="mt-3.5 grid min-h-0 flex-1 grid-cols-[1.25fr_1fr] gap-3">
        <FoglioDocumento compatto grande />

        <div className="grid min-h-0 grid-rows-2 gap-3">
          <div className="flex min-h-0 flex-col items-center justify-center gap-2 rounded-xl border border-line bg-paper/60 p-3">
            <svg viewBox="0 0 48 48" className="h-14 w-14 shrink-0" aria-hidden>
              <circle
                cx="24"
                cy="24"
                r="20"
                fill="none"
                stroke="#2FCF9A"
                strokeWidth="2.5"
                strokeDasharray="0.2 5.2"
                strokeLinecap="round"
              />
              <ellipse
                cx="24"
                cy="24"
                rx="7"
                ry="10"
                fill="none"
                stroke="#0E5238"
                strokeWidth="2.5"
              />
            </svg>
            <div className="text-center">
              <p className="text-[11.5px] font-semibold leading-tight text-ink">
                Sigillo Ver0
              </p>
              <p className="mt-0.5 text-[10.5px] text-gray-light">da esporre</p>
            </div>
          </div>

          <div className="flex min-h-0 flex-col justify-center gap-2 rounded-xl border border-line bg-paper/60 p-3">
            <p className="text-[11.5px] font-semibold leading-tight text-ink">
              Kit di comunicazione
            </p>
            <ul className="space-y-1.5">
              {["Testo per il sito", "Riga per la firma", "Immagine social"].map(
                (v) => (
                  <li key={v} className="flex items-center gap-2">
                    <Check size={11} className="shrink-0 text-mint" strokeWidth={3} />
                    <span className="truncate text-[10.5px] text-gray-warm">{v}</span>
                  </li>
                ),
              )}
            </ul>
          </div>
        </div>
      </div>
    </Finestra>
  );
}

function Vista({ n, vetrina }: { n: number; vetrina: VetrinaGuida }) {
  if (n === 1) return <VistaRicerca vetrina={vetrina} />;
  if (n === 2) return <VistaScheda vetrina={vetrina} />;
  if (n === 3) return <VistaDashboard />;
  if (n === 4) return <VistaConferma />;
  return <VistaConsegna />;
}

/* ------------------------------------------------------------------ */
/* Il testo di un passo, uguale nelle due rese                         */
/* ------------------------------------------------------------------ */

function TestoPasso({ passo }: { passo: Passo }) {
  return (
    <>
      <p className="text-[11px] font-semibold tracking-widest text-pine">
        PASSO {passo.n} DI {PASSI.length}
      </p>
      <h3 className="mt-3 font-display text-[2rem] leading-[1.06] text-ink lg:text-[2.4rem]">
        {passo.titolo}
      </h3>
      <p className="mt-4 text-[15px] leading-relaxed text-gray-warm">
        {passo.riga}
      </p>
    </>
  );
}

/* ------------------------------------------------------------------ */

/**
 * L'ALTEZZA DEL VISIVO, ed è il numero che decide tutto.
 *
 * Il palco è alto una schermata; il mockup ne prende 76 centesimi, il
 * resto lo occupano la barra di avanzamento e il respiro sotto — e con
 * quelli il contenuto arriva a riempirne il 79%. A 72 si fermava al
 * 74,2%: misurato, non stimato. Sotto le 20rem non si scende — su uno
 * schermo basso il mockup diventerebbe illeggibile — e sopra le 44rem
 * non si sale, perché su un monitor alto una finestra di mille pixel non
 * sembra più un'interfaccia.
 */
const ALTEZZA_VISIVO = "h-[clamp(20rem,76svh,44rem)]";

export function GuidaPassi({ vetrina }: { vetrina: VetrinaGuida }) {
  const [passo, setPasso] = useState(0);
  /**
   * Finché il JavaScript non è montato, i cinque passi stanno tutti in
   * pagina impilati: su uno schermo stretto senza JS non deve restarne
   * visibile uno solo, con quattro contenuti spariti e due bottoni che
   * non fanno niente.
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
            <div className="mx-auto w-full max-w-6xl px-6">
              {/* Testo e visivo nella STESSA fase: nel ripiego due
                  colonne separate si impilerebbero ognuna per conto suo
                  e il passo 5 finirebbe accanto alla schermata 4. */}
              <ScrollySteps>
                {PASSI.map((p) => (
                  <ScrollyStep key={p.n} index={p.n}>
                    <div className="grid grid-cols-[minmax(0,36fr)_minmax(0,60fr)] items-center gap-8 lg:gap-12">
                      <div>
                        <TestoPasso passo={p} />
                      </div>
                      <div className={ALTEZZA_VISIVO}>
                        <Vista n={p.n} vetrina={vetrina} />
                      </div>
                    </div>
                  </ScrollyStep>
                ))}
              </ScrollySteps>
              <div className="mt-6">
                <ScrollyProgress />
              </div>
            </div>
          </ScrollyStage>
        </Scrolly>
      </div>

      {/* ═══ STRETTO: il visivo resta protagonista, il testo sta sotto ═══ */}
      <div className="px-5 md:hidden">
        <div aria-live="polite">
          {PASSI.map((p, i) => (
            <div
              key={p.n}
              hidden={montato && i !== passo}
              className={montato ? undefined : "mb-14 last:mb-0"}
            >
              <div className="h-[clamp(19rem,58svh,30rem)]">
                <Vista n={p.n} vetrina={vetrina} />
              </div>
              <div className="mt-6">
                <TestoPasso passo={p} />
              </div>
            </div>
          ))}
        </div>

        {/* I comandi servono solo dove il JavaScript c'è: senza, i passi
            sono già tutti in pagina e due bottoni inerti sarebbero
            peggio di nessun bottone. */}
        <div
          hidden={!montato}
          className="mt-7 flex items-center justify-between gap-4"
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
/* L'anteprima per la home                                             */
/* ------------------------------------------------------------------ */

/**
 * L'ANTEPRIMA IN HOME — cinque momenti, non cinque voci di elenco.
 *
 * ═══ PERCHÉ NON BASTAVANO I TITOLI ═══
 * Prima c'erano i cinque titoli su un binario, con i numeri dentro un
 * pallino. Sulla pagina si leggeva come un elenco numerato: nessuno dei
 * cinque momenti aveva una faccia, quindi nessuno si distingueva dagli
 * altri, e la sequenza non si vedeva — si contava. In una home che per
 * il resto ha un protagonista visivo per sezione, era l'unico blocco a
 * non averne nessuno.
 *
 * ═══ MICRO-SCHERMATE, NON ICONE GENERICHE ═══
 * Ogni passo porta una rappresentazione minima della schermata che la
 * guida mostra per intero: la barra di ricerca, la scheda col prezzo, il
 * documento con l'anello, le conferme, il documento finito col Sigillo.
 * Sono gli stessi elementi della pagina — la stessa cornice, lo stesso
 * anello, gli stessi colori — ridotti a quello che si riconosce a 200 px
 * di larghezza. Un'icona presa da un repertorio avrebbe detto
 * «documento» in astratto; questa dice «quel documento, lì».
 *
 * ═══ LA PROGRESSIONE SI VEDE ═══
 * L'anello attraversa i passi 3, 4 e 5 e sale — 62, 88, 100 — come nella
 * guida. È l'elemento che fa leggere i cinque riquadri come una cosa
 * sola che avanza invece che come cinque riquadri.
 *
 * ═══ NIENTE PROMESSE DI TEMPI ═══
 * Come nella guida: nessun passo dice quanto ci vuole (SPEC §12.O). La
 * tentazione qui è forte perché una sequenza sembra chiedere una durata.
 * Non la chiede.
 */

/** L'anello dell'anteprima: piccolo e senza percentuale scritta. */
function AnelloMini({ percento }: { percento: number }) {
  const r = 13;
  const giro = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 32 32" className="h-8 w-8 shrink-0" aria-hidden>
      <circle cx="16" cy="16" r={r} fill="none" stroke="#E3E7E1" strokeWidth="3.5" />
      <circle
        cx="16"
        cy="16"
        r={r}
        fill="none"
        stroke="#2FCF9A"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeDasharray={`${(giro * percento) / 100} ${giro}`}
        transform="rotate(-90 16 16)"
      />
    </svg>
  );
}

/** Una riga di testo finto: qui il segnaposto è legittimo, è un'anteprima. */
function Tratto({ w, scuro = false }: { w: string; scuro?: boolean }) {
  return (
    <span
      aria-hidden
      className={`block h-1.5 rounded-full ${scuro ? "bg-pine/25" : "bg-line"}`}
      style={{ width: w }}
    />
  );
}

/** La cornice comune: è la stessa finestra della guida, in miniatura. */
function MiniFinestra({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-[104px] w-full flex-col overflow-hidden rounded-xl border border-line bg-white">
      <div className="flex shrink-0 items-center gap-1 border-b border-line bg-paper px-2.5 py-1.5">
        {[0, 1, 2].map((i) => (
          <span key={i} aria-hidden className="block h-1 w-1 rounded-full bg-line" />
        ))}
      </div>
      <div className="flex min-h-0 flex-1 flex-col justify-center gap-1.5 p-2.5">
        {children}
      </div>
    </div>
  );
}

/** Le cinque micro-schermate, una per passo. */
function MiniSchermo({ n }: { n: number }) {
  if (n === 1) {
    // La barra di ricerca: è la prima cosa che il cliente incontra.
    return (
      <MiniFinestra>
        <span className="flex items-center gap-2 rounded-lg border border-pine/25 bg-paper/60 px-2.5 py-2">
          <Search size={12} className="shrink-0 text-pine" aria-hidden />
          <Tratto w="62%" scuro />
        </span>
        <span className="mt-0.5 flex flex-col gap-1 pl-1">
          <Tratto w="78%" />
          <Tratto w="54%" />
        </span>
      </MiniFinestra>
    );
  }
  if (n === 2) {
    // La scheda del percorso: quello che si vede è il prezzo.
    return (
      <MiniFinestra>
        <span className="flex items-start justify-between gap-2 rounded-lg border border-line bg-paper/50 p-2">
          <span className="flex flex-col gap-1 pt-0.5">
            <Tratto w="72px" scuro />
            <Tratto w="46px" />
          </span>
          <span className="shrink-0 rounded-md bg-pine px-1.5 py-1 font-display text-[9px] font-semibold leading-none text-white">
            €/mese
          </span>
        </span>
        <Tratto w="58%" />
      </MiniFinestra>
    );
  }
  if (n === 5) {
    // Il documento finito, e accanto il Sigillo.
    return (
      <MiniFinestra>
        <span className="flex items-center gap-2.5">
          <span className="flex h-[52px] w-[40px] shrink-0 flex-col justify-center gap-1 rounded-[3px] border border-line bg-white px-1.5 shadow-soft">
            <Tratto w="100%" scuro />
            <Tratto w="70%" />
            <Tratto w="88%" />
            <Tratto w="60%" />
          </span>
          <span className="flex flex-col gap-1.5">
            <span className="flex items-center gap-1.5">
              <span
                aria-hidden
                className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-mint-bright font-display text-[10px] font-semibold text-pine"
              >
                0
              </span>
              <Tratto w="44px" scuro />
            </span>
            <Tratto w="66px" />
          </span>
        </span>
      </MiniFinestra>
    );
  }
  // Passi 3 e 4: lo stesso documento, e l'anello che sale.
  const percento = n === 3 ? 62 : 88;
  return (
    <MiniFinestra>
      <span className="flex items-center gap-2.5">
        <AnelloMini percento={percento} />
        <span className="flex flex-1 flex-col gap-1">
          <Tratto w="82%" scuro />
          <Tratto w="60%" />
        </span>
      </span>
      <span className="mt-0.5 flex flex-col gap-1 pl-1">
        {n === 4 ? (
          <>
            <span className="flex items-center gap-1.5">
              <Check size={10} strokeWidth={3} className="shrink-0 text-mint" aria-hidden />
              <Tratto w="58%" />
            </span>
            <span className="flex items-center gap-1.5">
              <Check size={10} strokeWidth={3} className="shrink-0 text-mint" aria-hidden />
              <Tratto w="42%" />
            </span>
          </>
        ) : (
          <>
            <Tratto w="70%" />
            <Tratto w="48%" />
          </>
        )}
      </span>
    </MiniFinestra>
  );
}

export function AnteprimaPassi() {
  return (
    <ol className="relative mx-auto grid max-w-6xl gap-6 lg:grid-cols-5 lg:gap-4">
      {/* IL BINARIO passa dietro i numeri e lega i cinque riquadri.
          Comincia e finisce nei CENTRI del primo e dell'ultimo, non ai
          bordi: una riga che sborda dal primo punto suggerisce che la
          sequenza venga da prima e continui dopo, e non è così.

          IL 9,4% È MISURATO. Un decimo per lato sarebbe il centro se le
          colonne fossero attaccate; con `gap-4` fra cinque colonne il
          centro della prima cade a (100% − 4·gap)/10, cioè al 9,44% con
          il contenitore al massimo (1152 px) e al 9,35% dove la fila
          comincia (1024). Col 10% il binario restava sei pixel dentro i
          due numeri estremi, abbastanza per vedersi; col 9,4% sborda di
          due, e due pixel dietro una pastiglia opaca da ventotto non si
          vedono.

          LA FILA COMINCIA A `lg`, non a `sm`. A 768 px le cinque colonne
          scendevano a 133 px l'una e le descrizioni andavano a cinque
          righe da ventun caratteri: leggibili per modo di dire. Sotto i
          1024 i passi si impilano, e impilati una riga orizzontale non
          collegherebbe niente — quindi il binario compare con la fila. */}
      <span
        aria-hidden
        className="absolute left-[9.4%] right-[9.4%] top-3.5 hidden h-px bg-pine/20 lg:block"
      />
      {PASSI.map((p, i) => (
        <li
          key={p.n}
          className="vz-reveal relative"
          style={{ "--vz-i": i } as React.CSSProperties}
        >
          <span
            aria-hidden
            className={
              "relative z-10 flex h-7 w-7 items-center justify-center rounded-full font-display text-[13px] font-semibold lg:mx-auto " +
              (i === 0 || i === PASSI.length - 1
                ? "bg-pine text-white"
                : "border border-pine/30 bg-paper text-pine")
            }
          >
            {p.n}
          </span>
          <div className="mt-4">
            <MiniSchermo n={p.n} />
          </div>
          <p className="mt-3.5 font-display text-[16px] leading-snug text-ink lg:text-center lg:text-[15.5px]">
            {p.titolo}
          </p>
          <p className="mt-1.5 text-[12.5px] leading-snug text-gray-warm lg:text-center">
            {p.riga}
          </p>
        </li>
      ))}
    </ol>
  );
}
