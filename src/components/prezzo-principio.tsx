import Link from "next/link";
import { ArrowRight, Check, Package, ReceiptText, RefreshCw } from "lucide-react";

import { CANONE_INCLUDE } from "@/lib/canone";
import { SERVIZI } from "@/lib/catalog";
import { prezzoDettaglio } from "@/lib/pricing";

/**
 * IL PREZZO COME PRINCIPIO — non un listino, e non un confronto.
 *
 * In home il catalogo non c'è: elenco e prezzi per servizio vivono nella
 * pagina Servizi, che ne è l'unica sede. Qui resta la ragione per cui i
 * prezzi sono pubblici, detta parlando SOLO di noi.
 *
 * ═══ REGOLA VINCOLANTE ═══
 * NESSUN CONFRONTO ECONOMICO CON IL MERCATO e nessun giudizio, diretto o
 * implicito, sul lavoro altrui. Non mettiamo il nostro prezzo accanto a
 * quello di qualcun altro, non citiamo cifre di terzi, non insinuiamo
 * cosa farebbe o non farebbe un consulente.
 *
 * Il motivo non è la prudenza: è che un confronto sposta il discorso su
 * qualcun altro proprio quando dovremmo parlare di noi. E le nostre
 * caratteristiche — canone unico, tutto incluso, il prezzo che scende
 * dal secondo anno — reggono da sole.
 *
 * I NUMERI: qui non ce ne sono, tranne il prezzo minimo come rimando al
 * catalogo. E anche quello viene da `pricing.ts`, mai scritto a mano:
 * un numero ricopiato è un numero che un giorno mentirà.
 */

/** Le tre caratteristiche, dette come fatti nostri. */
const PUNTI = [
  {
    icona: ReceiptText,
    titolo: "Un prezzo chiaro e completo",
    testo:
      "Un canone unico per percorso, scritto sul sito. Nessun costo nascosto, nessuna voce che compare dopo, nessuna sorpresa a fine progetto.",
  },
  {
    icona: Package,
    titolo: "Tutto incluso nel canone",
    testo:
      "Sigillo, osservatorio bandi, aggiornamento dei documenti quando cambiano le norme, Kit di comunicazione e assistenza: sono dentro, non moduli da aggiungere.",
  },
  {
    icona: RefreshCw,
    titolo: "Il prezzo segue il percorso",
    testo:
      "Il primo anno si costruisce; dal secondo il canone scende, perché i tuoi dati sono già nel sistema e il lavoro è di mantenimento. Il rinnovo resta libero.",
  },
];

export function PrezzoPrincipio() {
  // Il prezzo minimo reale, calcolato: serve solo come rimando al
  // catalogo, e deve muoversi da sé se il listino cambia.
  const daMensile = Math.min(
    ...SERVIZI.map((s) => prezzoDettaglio(s.slug, "micro")?.mensile).filter(
      (v): v is number => typeof v === "number",
    ),
  );

  return (
    <div className="mx-auto max-w-4xl">
      <div className="text-center">
        <p className="mb-4 text-xs font-semibold tracking-widest text-mint-bright">
          IL PREZZO
        </p>
        <h2 className="font-display text-4xl leading-[1.04] text-white md:text-6xl">
          Pubblici, per fascia dimensionale, tutto incluso.
        </h2>
        <p className="mx-auto mt-5 max-w-2xl text-sm leading-relaxed text-moss/80 md:text-base">
          Li leggi, li confronti, decidi. Senza preventivi da aspettare.
        </p>
      </div>

      <div className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-3">
        {PUNTI.map(({ icona: Icona, titolo, testo }) => (
          <article
            key={titolo}
            className="rounded-2xl border border-white/12 bg-white/[0.04] p-5 sm:p-6"
          >
            <span
              aria-hidden
              className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-mint-bright/15 text-mint-bright"
            >
              <Icona size={19} />
            </span>
            <h3 className="mt-4 font-display text-xl leading-tight text-white">
              {titolo}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-moss/75">{testo}</p>
          </article>
        ))}
      </div>

      {/* Cosa c'è dentro, per esteso: la seconda caratteristica merita i
          suoi nomi, altrimenti «tutto incluso» resta un aggettivo. */}
      <div className="mt-4 rounded-2xl border border-white/12 bg-white/[0.04] p-5 sm:p-6">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-mint-bright/80">
          Compreso nel canone
        </p>
        <ul className="mt-4 grid grid-cols-1 gap-x-8 gap-y-2 sm:grid-cols-2">
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

      {/* UNA sola CTA: da qui si va al catalogo, che è la sua casa. */}
      <div className="mt-10 text-center">
        <Link
          href="/servizi"
          className="vz-press inline-flex items-center gap-2 rounded-xl bg-white px-7 py-4 text-base font-semibold text-pine-deep"
        >
          Vedi tutti i servizi e i prezzi <ArrowRight size={18} />
        </Link>
        <p className="mt-3 text-xs text-moss/60">
          Percorsi da {daMensile} €/mese, IVA esclusa
        </p>
      </div>
    </div>
  );
}
