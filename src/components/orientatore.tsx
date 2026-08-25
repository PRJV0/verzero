"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, Search } from "lucide-react";

import { EVENTI, traccia } from "@/lib/eventi";
import { SCELTE_RAPIDE } from "@/lib/scelte-rapide";
import type { Bisogno } from "@/lib/catalog";
import type { GruppoRisultati, Risultato } from "@/lib/orientatore";

/**
 * L'ORIENTATORE IN HOME — «che cosa ti serve?».
 *
 * ═══ DEVE SEMBRARE UNA RICERCA, NON UN MODULO ═══
 * Un campo con la lente, un segnaposto brevissimo, e sotto quattro-cinque
 * scelte rapide che stanno lì DA SUBITO. Nessuna etichetta, nessuna
 * istruzione d'uso, nessuna spiegazione di che cos'è: chi arriva
 * riconosce la forma e la usa. Le scelte rapide fanno il lavoro che
 * facevano le istruzioni, e lo fanno meglio, perché si cliccano.
 *
 * ═══ LA CORRISPONDENZA GIRA QUI, NON SULLA RETE ═══
 * `orienta()` è pura: mentre si scrive, i risultati si calcolano nel
 * browser. Istantanei, gratuiti, senza una richiesta per tasto — che
 * sarebbe finita contro il limite di frequenza e avrebbe scritto una
 * riga di registro per ogni lettera.
 *
 * Alla rete si va una volta sola, quando la ricerca si ferma: serve al
 * ripiego col modello (se qui non si è trovato nulla) e a registrare la
 * ricerca. Una ricerca, una riga.
 *
 * ═══ MA NON PESA SU CHI NON CERCA ═══
 * `orienta()` si porta dietro catalogo, guide, registro delle norme e
 * listino: 145 kB di codice in home, per una barra che la maggioranza
 * dei visitatori guarda e non tocca. Quindi il modulo si carica al
 * primo contatto col campo — passaggio del mouse, fuoco, tocco su un
 * chip — e non al caricamento della pagina. Al momento di scrivere è
 * già lì.
 *
 * Se quel caricamento fallisce non si rompe niente: restano la rete,
 * che sa rispondere lo stesso, e il modulo senza JavaScript.
 *
 * ═══ SENZA JAVASCRIPT FUNZIONA LO STESSO ═══
 * È un `<form method="get" action="/servizi">`: senza JS il browser manda
 * la frase al catalogo, che la interpreta con la stessa identica
 * funzione. Non è un ripiego degradato — è la stessa risposta, servita
 * da un'altra pagina.
 *
 * ═══ NIENTE PANNELLI SOPRA LA PAGINA ═══
 * Chip e risultati occupano LO STESSO spazio, sotto la barra: si sostituiscono,
 * non si sovrappongono. Il contenitore non scende mai sotto l'altezza dei
 * chip, così il passaggio non fa saltare quello che c'è più giù.
 */

type Esito = {
  risultati: Risultato[];
  situazioni: Bisogno[];
  via: "deterministica" | "modello" | "nessuna";
};

/** Il ritardo prima di ricalcolare: senza, i risultati ballano a ogni tasto. */
const RITARDO_VISIVO = 200;

/**
 * Quanto silenzio serve per considerare finita una ricerca.
 *
 * È il momento in cui si va in rete: una volta, non a ogni lettera. Chi
 * si ferma più a lungo di così in mezzo a una frase produce una riga di
 * registro in più, col solo pezzo scritto fino a lì — un difetto che
 * costa una riga di analitica e non un risultato sbagliato.
 */
const ATTESA_FINE = 1200;

type Motore = typeof import("@/lib/orientatore");

export function Orientatore() {
  const [q, setQ] = useState("");
  const [ritardata, setRitardata] = useState("");
  const [remoto, setRemoto] = useState<{ q: string; esito: Esito } | null>(null);
  const campo = useRef<HTMLInputElement>(null);
  const giaChieste = useRef<Set<string>>(new Set());

  /* — Il motore, caricato al primo contatto —
       Sta in uno STATO e non in un riferimento: il riferimento non si
       può leggere durante il render, e qui il render dipende proprio
       dal fatto che il modulo sia arrivato. */
  const [motore, setMotore] = useState<Motore | null>(null);
  const inCorso = useRef(false);

  const carica = useCallback(async () => {
    if (inCorso.current) return;
    inCorso.current = true;
    try {
      setMotore(await import("@/lib/orientatore"));
    } catch {
      // Riprovabile: al prossimo contatto col campo si tenta di nuovo.
      inCorso.current = false;
    }
  }, []);

  /* — Il ritardo, solo perché non lampeggi — */
  useEffect(() => {
    const t = setTimeout(() => setRitardata(q.trim()), RITARDO_VISIVO);
    return () => clearTimeout(t);
  }, [q]);

  /* — La corrispondenza: qui, subito, senza rete — */
  const locale = useMemo(
    () =>
      motore && ritardata.length > 0
        ? (motore.orienta(ritardata) as Esito)
        : null,
    [motore, ritardata],
  );

  /**
   * La rete, una volta sola per ricerca. Serve a due cose e nessuna delle
   * due è mostrare i risultati: il ripiego col modello quando qui non si
   * è trovato nulla, e la registrazione.
   */
  const chiediAlServer = useCallback(async (testo: string) => {
    if (testo.length === 0 || giaChieste.current.has(testo)) return;
    giaChieste.current.add(testo);
    try {
      const r = await fetch("/api/orientatore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ q: testo }),
      });
      const esito: Esito = await r.json();
      setRemoto({ q: testo, esito });
    } catch {
      // La rete che cade non toglie niente: i risultati sono già in
      // pagina, calcolati qui. Si perde il ripiego e la misurazione.
    }
  }, []);

  /* — Quando la ricerca si ferma — */
  useEffect(() => {
    const testo = q.trim();
    if (testo.length === 0) return;
    const t = setTimeout(() => void chiediAlServer(testo), ATTESA_FINE);
    return () => clearTimeout(t);
  }, [q, chiediAlServer]);

  function cerca(frase: string) {
    const testo = frase.trim();
    if (testo.length === 0) return;
    void carica();
    setQ(testo);
    setRitardata(testo);
    void chiediAlServer(testo);
  }

  /**
   * Il modello ha l'ultima parola solo dove qui non si è trovato niente:
   * è l'unico caso per cui viene interpellato, e sostituire dei risultati
   * già mostrati con altri, un secondo dopo, sarebbe un cambio sotto gli
   * occhi di chi sta leggendo.
   */
  const esito: Esito | null =
    remoto && remoto.q === ritardata && (locale?.risultati.length ?? 0) === 0
      ? remoto.esito
      : locale;

  const gruppi: GruppoRisultati[] = useMemo(
    () => (motore && esito ? motore.raggruppaPerMomento(esito.risultati) : []),
    [motore, esito],
  );

  const situazione = esito?.situazioni?.[0];
  const etichettaSituazione = motore?.etichettaBisogno(situazione);
  const mostraChip = ritardata.length === 0;

  return (
    <div className="mx-auto w-full max-w-xl">
      <form
        // Senza JS: il browser fa una GET al catalogo, che interpreta la
        // stessa frase con la stessa logica.
        action="/servizi"
        method="get"
        onSubmit={(e) => {
          e.preventDefault();
          cerca(q);
        }}
        role="search"
        className="scroll-mt-20"
      >
        <label htmlFor="orientatore" className="sr-only">
          Che cosa ti serve?
        </label>
        {/* Sul pino profondo un bordo grigio chiaro non si vede e la
            barra sembra ritagliata e incollata. Ci vuole invece un anello
            di luce e un'ombra che la appoggi sul fondo: contrasto alto
            per il testo che si scrive, senza il taglio netto. */}
        <div
          onPointerEnter={() => void carica()}
          className="vz-stato flex items-center gap-2 rounded-2xl bg-white p-1.5 shadow-[0_18px_44px_-20px_rgba(0,0,0,0.6)] ring-1 ring-white/25 focus-within:ring-2 focus-within:ring-mint-bright">
          <Search size={18} className="ml-2.5 shrink-0 text-gray-light" aria-hidden />
          <input
            id="orientatore"
            ref={campo}
            name="q"
            type="search"
            maxLength={200}
            autoComplete="off"
            value={q}
            onChange={(e) => {
              void carica();
              setQ(e.target.value);
            }}
            onFocus={() => {
              void carica();
              // Sullo stretto la tastiera si apre e copre metà schermo:
              // se la barra resta a metà pagina, i risultati nascono
              // sotto la tastiera. Portandola in alto lo spazio che
              // resta è tutto per i risultati.
              //
              // Si porta in vista il MODULO, non il campo, e con
              // `scroll-mt-20`: mirare al campo lo infilava sotto
              // l'intestazione appiccicata, e chi scriveva non vedeva
              // più quello che stava scrivendo.
              if (window.innerWidth >= 768) return;
              campo.current?.form?.scrollIntoView({
                block: "start",
                // Lo scorrimento è movimento: chi lo ha chiesto ridotto
                // ottiene lo stesso risultato, senza il tragitto.
                behavior: window.matchMedia("(prefers-reduced-motion: reduce)")
                  .matches
                  ? "auto"
                  : "smooth",
              });
            }}
            placeholder="Che cosa ti serve?"
            className="min-w-0 flex-1 bg-transparent py-2 text-[15px] text-ink outline-none placeholder:text-gray-light"
          />
          <button
            type="submit"
            aria-label="Cerca"
            disabled={q.trim().length === 0}
            className="vz-press inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-pine px-3.5 py-2.5 text-sm font-semibold text-white disabled:opacity-40 sm:px-4"
          >
            <span className="hidden sm:inline">Trova</span>
            <ArrowRight size={15} aria-hidden />
          </button>
        </div>
      </form>

      {/* LO STESSO SPAZIO, sempre: chip finché il campo è vuoto, risultati
          appena si scrive. Il contenitore non scende sotto l'altezza dei
          chip, così il passaggio non sposta il resto della pagina. */}
      <div aria-live="polite" className="mt-4 min-h-[4.5rem]">
        {mostraChip && (
          <ul className="flex flex-wrap justify-center gap-2">
            {SCELTE_RAPIDE.map((s) => (
              <li key={s.testo} className={s.soloLargo ? "hidden sm:block" : undefined}>
                <button
                  type="button"
                  onPointerEnter={() => void carica()}
                  onClick={() => cerca(s.testo)}
                  className="vz-interattivo rounded-full bg-white/10 px-3 py-1.5 text-[12px] text-moss ring-1 ring-white/20 hover:bg-white/20 hover:text-white sm:px-3.5 sm:text-[13px]"
                >
                  {s.testo}
                </button>
              </li>
            ))}
          </ul>
        )}

        {!mostraChip && esito && esito.risultati.length > 0 && (
          <>
            {gruppi.map((gruppo) => (
              <div
                key={gruppo.momento ?? "altro"}
                className="text-left [&+&]:mt-4"
              >
                {/* La riga che dice a QUALE momento risponde questo
                    gruppo. Compare solo quando i gruppi sono più d'uno:
                    su un gruppo solo descriverebbe l'intera lista. */}
                {gruppo.etichetta && (
                  // In tondo, non in maiuscoletto spaziato: è una frase
                  // («se ce l'hai già e potrebbe non essere allineato»),
                  // e una frase in maiuscolo larga tutta la colonna urla
                  // invece di spiegare.
                  <p className="mb-1.5 pl-0.5 text-[13px] font-semibold text-mint-bright">
                    {gruppo.etichetta}
                  </p>
                )}
                <ul className="space-y-2">
                  {gruppo.risultati.map((r, i) => (
                    <li
                      key={r.id}
                      className="vz-entra"
                      style={{ "--vz-i": i } as React.CSSProperties}
                    >
                      <Link
                        href={r.href}
                        onClick={() =>
                          traccia(EVENTI.ORIENTATORE_CLICK, {
                            id: r.id,
                            tipo: r.tipo,
                          })
                        }
                        className="vz-interattivo block rounded-xl border border-line bg-white p-4 hover:border-pine"
                      >
                        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                          <p className="text-[15px] font-bold leading-snug text-ink">
                            {r.nome}
                          </p>
                          {r.inArrivo ? (
                            <span className="shrink-0 rounded-full bg-paper px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-warm">
                              In arrivo
                            </span>
                          ) : r.prezzo ? (
                            <span className="shrink-0 text-xs font-semibold text-pine">
                              {r.prezzo}
                            </span>
                          ) : r.tipo === "guida" ? (
                            <span className="shrink-0 text-[11px] text-gray-light">
                              guida
                            </span>
                          ) : r.tipo === "strumento" ? (
                            <span className="shrink-0 text-[11px] font-semibold text-mint">
                              gratuito
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-1 text-sm leading-relaxed text-gray-warm">
                          {r.perche}
                        </p>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            {/* Se la frase diceva anche la situazione, la si riconosce con
                le parole del selettore: la stessa lingua, non una nuova. */}
            {etichettaSituazione && (
              <p className="mt-3 text-center text-xs text-moss">
                <Link
                  href={`/servizi?bisogno=${situazione}`}
                  className="font-semibold text-mint-bright hover:underline"
                >
                  Tutti i percorsi per «{etichettaSituazione.toLowerCase()}»
                </Link>
              </p>
            )}
          </>
        )}

        {/* Nulla di pertinente: lo si dice, e si manda da una persona. */}
        {!mostraChip && esito && esito.risultati.length === 0 && (
          <div className="rounded-xl border border-line bg-white p-5 text-left">
            <p className="text-sm font-semibold text-ink">
              Su questo non abbiamo un percorso.
            </p>
            <p className="mt-1 text-sm leading-relaxed text-gray-warm">
              Preferiamo dirtelo invece di proporti qualcosa che non risponde.
              Se ci scrivi due righe ti diciamo se possiamo esserti utili — e
              se non possiamo, anche quello.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link
                href="/contatti"
                className="vz-press inline-flex items-center gap-1.5 rounded-lg bg-pine px-4 py-2 text-sm font-semibold text-white"
              >
                Scrivici
              </Link>
              <Link
                href="/servizi"
                className="vz-press inline-flex items-center gap-1.5 rounded-lg border border-pine px-4 py-2 text-sm font-semibold text-pine"
              >
                Sfoglia il catalogo
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
