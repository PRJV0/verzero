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
  // Il prezzo minimo reale, calcolato: è il numero che apre la sezione,
  // e deve muoversi da sé se il listino cambia.
  const daMensile = Math.min(
    ...SERVIZI.map((s) => prezzoDettaglio(s.slug, "micro")?.mensile).filter(
      (v): v is number => typeof v === "number",
    ),
  );

  return (
    <div className="mx-auto max-w-4xl">
      <div className="text-center">
        {/* L'OCCHIELLO DEVE DIRE DI CHE SEZIONE SI TRATTA. Era «IL
            PREZZO» in caratteri minuscoli, e chi scorreva leggeva solo il
            titolo — «Pubblico, prima di parlare con noi» — senza capire
            di che cosa fosse pubblico. Un occhiello che non si legge non
            è un occhiello. */}
        <p className="mb-8 text-[13px] font-semibold uppercase tracking-[0.16em] text-mint-bright">
          Prezzi e canone
        </p>

        {/* IL NUMERO VIENE PRIMA DEL TITOLO, e non dopo.
            Era già grande — 128 px contro i 70 del titolo — e passava
            comunque inosservato, perché la grandezza non è l'unica cosa
            che decide che cosa si vede per primo: sopra c'era un titolo
            di quarantadue caratteri su due righe, che di inchiostro ne
            copriva molto di più dei 145 px della cifra. Si leggeva
            l'occhiello, poi il titolo, e alla cifra ci si arrivava
            quando ormai era «dentro al testo».

            Adesso la cifra è la prima cosa della sezione — è la notizia
            — e il titolo la commenta: leggi «45 €/mese» e poi scopri che
            la cosa notevole è che sia scritto lì, prima di parlare con
            noi. Ed è cresciuta a 160 px, che sono più del doppio del
            titolo più grande della pagina.

            La cifra viene da `pricing.ts` — mai ricopiata, perché un
            numero ricopiato è un numero che un giorno mentirà. */}
        <p className="flex flex-wrap items-baseline justify-center gap-x-3 gap-y-1">
          <span className="font-display text-[1.1rem] font-medium text-moss/70 md:text-[1.4rem]">
            da
          </span>
          <span className="font-display text-[6.5rem] font-semibold leading-[0.82] tracking-[-0.045em] text-white tabular-nums md:text-[10rem]">
            {daMensile}
          </span>
          <span className="font-display text-[2.4rem] font-semibold leading-none text-mint-bright md:text-[3.4rem]">
            €/mese
          </span>
        </p>
        <p className="mt-5 text-[14px] font-medium tracking-wide text-moss/70">
          IVA esclusa, tutto incluso
        </p>

        <h2 className="mx-auto mt-10 max-w-3xl font-display text-[2rem] leading-[1.06] tracking-[-0.02em] text-white md:text-[3.2rem]">
          Pubblici, prima ancora di parlare con noi.
        </h2>
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
        {/* La cifra la dice già il titolo, in grande: ripeterla qui in
            piccolo la indebolirebbe. Resta quello che il titolo non
            dice, cioè che il prezzo cambia con la dimensione. */}
        <p className="mt-3 text-xs text-moss/60">
          Il canone segue la fascia dimensionale dell&apos;impresa
        </p>
      </div>
    </div>
  );
}
