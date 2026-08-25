"use client";

import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import { ArrowRight, Loader2, Search } from "lucide-react";

import { BISOGNI, type Bisogno } from "@/lib/catalog";
import { EVENTI, traccia } from "@/lib/eventi";
import { ESEMPI, type Risultato } from "@/lib/orientatore";

/**
 * L'ORIENTATORE IN HOME — «che cosa ti serve?».
 *
 * ═══ DEVE SEMBRARE UNA RICERCA, NON UN MODULO ═══
 * Un campo con la lente, un segnaposto che mostra come si scrive, e
 * quattro esempi cliccabili sotto. Nessuna etichetta, nessun «invia»,
 * nessun passaggio: chi arriva riconosce la forma e la usa senza
 * leggerne le istruzioni.
 *
 * ═══ SENZA JAVASCRIPT FUNZIONA LO STESSO ═══
 * È un `<form method="get" action="/servizi">`: senza JS il browser
 * manda la frase al catalogo, che la interpreta con la stessa
 * corrispondenza deterministica e mostra gli stessi risultati. Non è un
 * ripiego degradato — è la stessa risposta, servita da un'altra pagina.
 *
 * ═══ I RISULTATI SONO SCHEDE DI CATALOGO ═══
 * Stessi testi di beneficio, stessa forma di prezzo, stessa
 * nomenclatura. Un risultato che dicesse le cose in modo diverso dalla
 * scheda a cui porta sarebbe una seconda promessa.
 */

type Esito = {
  risultati: Risultato[];
  situazioni: Bisogno[];
  via: "deterministica" | "modello" | "nessuna";
};

export function Orientatore() {
  const [q, setQ] = useState("");
  const [esito, setEsito] = useState<Esito | null>(null);
  const [inCorso, avvia] = useTransition();
  const campo = useRef<HTMLInputElement>(null);

  function cerca(frase: string) {
    const testo = frase.trim();
    if (testo.length === 0) return;
    setQ(testo);
    avvia(async () => {
      try {
        const r = await fetch("/api/orientatore", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ q: testo }),
        });
        const dati: Esito = await r.json();
        setEsito(dati);
        // La ricerca la registra il SERVER, che sta già rispondendo e
        // conosce anche i termini. Registrarla anche da qui scriveva due
        // righe per ogni ricerca — una col dettaglio e una senza — e
        // avrebbe fatto contare il doppio. Dal browser resta solo il
        // click sul risultato, che il server non può vedere.
      } catch {
        // Se la rete cade, il modulo resta un modulo: il tasto invio
        // porta comunque al catalogo, che sa rispondere da solo.
        setEsito(null);
        campo.current?.form?.submit();
      }
    });
  }

  const situazione = esito?.situazioni?.[0];
  const etichettaSituazione = BISOGNI.find((b) => b.key === situazione)?.label;

  return (
    <div className="mx-auto w-full max-w-2xl">
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
      >
        <label htmlFor="orientatore" className="sr-only">
          Che cosa ti serve?
        </label>
        <div className="flex items-center gap-2 rounded-2xl border-2 border-line bg-white p-2 transition-colors focus-within:border-pine">
          <Search size={18} className="ml-2 shrink-0 text-gray-light" aria-hidden />
          <input
            id="orientatore"
            ref={campo}
            name="q"
            type="search"
            maxLength={200}
            autoComplete="off"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Che cosa ti serve? Es. mi serve la parità di genere per un bando"
            className="min-w-0 flex-1 bg-transparent py-2 text-[15px] text-ink outline-none placeholder:text-gray-light"
          />
          <button
            type="submit"
            disabled={inCorso || q.trim().length === 0}
            className="vz-press inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-pine px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-40"
          >
            {inCorso ? (
              <Loader2 size={15} className="animate-spin" aria-hidden />
            ) : (
              <>
                Trova
                <ArrowRight size={15} aria-hidden />
              </>
            )}
          </button>
        </div>
      </form>

      {/* Gli esempi: frasi vere, e ognuna dà un risultato.
          Sullo stretto se ne mostrano tre: quattro riempivano mezzo
          schermo e allontanavano tutto il resto della pagina. Il quarto
          non sparisce dal codice — lo nasconde il CSS — così non c'è una
          scelta dopo l'idratazione e non c'è sfarfallio. */}
      <ul className="mt-3 flex flex-wrap justify-center gap-2">
        {ESEMPI.map((e, i) => (
          <li key={e} className={i >= 3 ? "hidden sm:block" : undefined}>
            <button
              type="button"
              onClick={() => cerca(e)}
              className="vz-interattivo rounded-full border border-line bg-white/70 px-3 py-1.5 text-xs text-gray-warm hover:border-pine hover:text-pine"
            >
              {e}
            </button>
          </li>
        ))}
      </ul>

      {/* I risultati. */}
      <div aria-live="polite" className="mt-5">
        {esito && esito.risultati.length > 0 && (
          <>
            <ul className="space-y-2 text-left">
              {esito.risultati.map((r) => (
                <li key={r.id}>
                  <Link
                    href={r.href}
                    onClick={() =>
                      traccia(EVENTI.ORIENTATORE_CLICK, { id: r.id, tipo: r.tipo })
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

            {/* Se la frase diceva anche la situazione, la si riconosce con
                le parole del selettore: la stessa lingua, non una nuova. */}
            {etichettaSituazione && (
              <p className="mt-3 text-center text-xs text-gray-warm">
                Hai scritto che{" "}
                <strong className="font-semibold text-ink">
                  {etichettaSituazione.toLowerCase()}
                </strong>
                :{" "}
                <Link
                  href={`/servizi?bisogno=${situazione}`}
                  className="font-semibold text-pine hover:underline"
                >
                  vedi tutti i percorsi per questa situazione
                </Link>
                .
              </p>
            )}
          </>
        )}

        {/* Nulla di pertinente: lo si dice, e si manda da una persona. */}
        {esito && esito.risultati.length === 0 && (
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
