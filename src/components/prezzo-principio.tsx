import Link from "next/link";
import { ArrowRight, Check, RefreshCw, Scale } from "lucide-react";

import { CANONE_INCLUDE } from "@/lib/canone";
import { getServizio } from "@/lib/catalog";
import { prezzoDettaglio } from "@/lib/pricing";

/**
 * IL PREZZO COME PRINCIPIO — non un listino.
 *
 * In home il catalogo non c'è più: elenco e prezzi per servizio vivono
 * nella pagina Servizi, che ne è l'unica sede. Qui resta la ragione per
 * cui i prezzi sono pubblici, con tre prove concrete invece di tre
 * aggettivi.
 *
 * DUE REGOLE CHE GOVERNANO QUESTO BLOCCO.
 *
 * 1. I PREZZI NON SI SCRIVONO A MANO. Vengono da `pricing.ts`, come
 *    ovunque: un numero ricopiato è un numero che un giorno mentirà.
 *
 * 2. MAI DENIGRARE LA CONSULENZA. Il confronto con il mercato è un
 *    ordine di grandezza, dichiarato come tale, e la ragione della
 *    differenza è il METODO — automazione e banche dati abbattono il
 *    costo di erogazione — non l'avidità di qualcuno. Un consulente che
 *    lavora su misura, in azienda, fa un mestiere diverso dal nostro e
 *    lo fa costare quello che costa. Dirlo è corretto ed è anche più
 *    credibile.
 */

/**
 * Gli ordini di grandezza del mercato della consulenza tradizionale,
 * dall'indagine annotata in SPEC §12.S. Sono intervalli, non listini
 * altrui: si citano come tali.
 */
const CONFRONTO = [
  {
    slug: "bilancio-sostenibilita-vsme-base",
    mercato: "5.000 – 10.000 €",
  },
  {
    slug: "carbon-footprint-scope-1-2",
    mercato: "1.500 – 3.000 €",
  },
  {
    slug: "manuale-sistema-gestione-iso-9001",
    mercato: "1.500 – 2.500 €",
  },
] as const;

/** I fatti, verificabili sul sito stesso. Nessun aggettivo. */
const FATTI = [
  "Prezzi pubblici: li leggi prima di parlare con noi.",
  "Documenti in giorni, non in mesi.",
  "Nessun costo nascosto: quello che vedi è quello che paghi.",
  "Sigillo, bandi, aggiornamenti e Kit inclusi nel canone.",
  "Disdetta libera dopo i primi dodici mesi.",
];

export function PrezzoPrincipio() {
  return (
    <div className="mx-auto max-w-4xl">
      <div className="text-center">
        <p className="mb-4 text-xs font-semibold tracking-widest text-mint-bright">
          IL PREZZO
        </p>
        <h2 className="font-display text-4xl leading-[1.04] text-white md:text-6xl">
          I prezzi li trovi scritti.
          <br />
          Prima di parlare con noi.
        </h2>
        <p className="mx-auto mt-5 max-w-2xl text-sm leading-relaxed text-moss/80 md:text-base">
          Non è una promozione: è una scelta. Un preventivo da chiedere è un
          filtro che tiene fuori chi non ha tempo di aspettarlo — e sono
          quasi sempre le imprese più piccole.
        </p>
      </div>

      {/* PROVA 1 — l'ordine di grandezza, senza denigrare nessuno. */}
      <div className="mt-12 rounded-2xl border border-white/12 bg-white/[0.04] p-5 sm:p-6">
        <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-mint-bright/80">
          <Scale size={14} aria-hidden /> Quanto costa lo stesso documento
        </p>
        <ul className="mt-4 space-y-2">
          {CONFRONTO.map((c) => {
            const s = getServizio(c.slug);
            const p = prezzoDettaglio(c.slug, "micro");
            if (!s || !p) return null;
            return (
              <li
                key={c.slug}
                className="grid grid-cols-1 gap-1 border-b border-white/10 py-3 last:border-0 sm:grid-cols-[1.4fr_1fr_1fr] sm:items-baseline sm:gap-4"
              >
                <span className="text-sm font-semibold text-white">
                  {s.name}
                  {s.taglio && (
                    <span className="ml-2 text-xs font-normal text-moss/60">
                      {s.taglio}
                    </span>
                  )}
                </span>
                <span className="text-sm text-moss/70">
                  <span className="text-xs uppercase tracking-wide text-moss/50">
                    in consulenza{" "}
                  </span>
                  {c.mercato}
                </span>
                <span className="text-sm font-semibold tabular-nums text-mint-bright sm:text-right">
                  {p.annuale.toLocaleString("it-IT")} € il primo anno
                </span>
              </li>
            );
          })}
        </ul>
        <p className="mt-3 text-xs leading-relaxed text-moss/60">
          Ordini di grandezza rilevati sul mercato della consulenza
          tradizionale, per un&apos;impresa micro, IVA esclusa; dal secondo
          anno il canone scende. La differenza non è uno sconto: è il metodo.
          Automazione e banche dati ufficiali abbattono il costo di
          erogazione — un consulente che lavora su misura e in azienda fa un
          altro mestiere, e vale quello che costa. Sul manuale ISO 9001 il
          margine è stretto e lo lasciamo scritto: preferiamo un confronto
          che regge a uno che impressiona.
        </p>
      </div>

      {/* PROVE 2 e 3 — cosa c'è dentro, e cosa succede negli anni. */}
      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-white/12 bg-white/[0.04] p-5 sm:p-6">
          <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-mint-bright/80">
            <Check size={14} strokeWidth={3} aria-hidden /> Tutto nel canone
          </p>
          <p className="mt-3 text-sm leading-relaxed text-moss/80">
            Nessuno di questi è un modulo da aggiungere al carrello.
          </p>
          <ul className="mt-4 space-y-2">
            {CANONE_INCLUDE.map((b) => (
              <li
                key={b.title}
                className="flex gap-2.5 text-sm leading-snug text-white"
              >
                <Check
                  size={15}
                  strokeWidth={3}
                  aria-hidden
                  className="mt-0.5 shrink-0 text-mint-bright"
                />
                {b.title}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-white/12 bg-white/[0.04] p-5 sm:p-6">
          <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-mint-bright/80">
            <RefreshCw size={14} aria-hidden /> Dal secondo anno costa meno
          </p>
          <p className="mt-3 text-sm leading-relaxed text-moss/80">
            Il primo anno si costruisce il documento; dagli anni successivi si
            mantiene, e il canone scende. Nessun vincolo oltre i primi dodici
            mesi: si disdice quando si vuole, e il lavoro fatto resta tuo.
          </p>
          <ul className="mt-4 space-y-2">
            {FATTI.map((f) => (
              <li
                key={f}
                className="flex gap-2.5 text-sm leading-snug text-white"
              >
                <Check
                  size={15}
                  strokeWidth={3}
                  aria-hidden
                  className="mt-0.5 shrink-0 text-mint-bright"
                />
                {f}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* UNA sola CTA: da qui si va al catalogo, che è la sua casa. */}
      <div className="mt-10 text-center">
        <Link
          href="/servizi"
          className="vz-press inline-flex items-center gap-2 rounded-xl bg-white px-7 py-4 text-base font-semibold text-pine-deep"
        >
          Vedi tutti i servizi e i prezzi <ArrowRight size={18} />
        </Link>
      </div>
    </div>
  );
}
