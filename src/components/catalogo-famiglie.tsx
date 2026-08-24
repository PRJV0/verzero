"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, Leaf, Mail, Plus } from "lucide-react";

import { CANONE_INLINE } from "@/lib/canone";
import {
  BISOGNI,
  FAMIGLIE,
  PILASTRO_LABEL,
  getServizio,
  titoloServizio,
  type Bisogno,
  type VoceCatalogo,
} from "@/lib/catalog";
import {
  GRANDE_IMPRESA,
  RINNOVO_LIBERO,
  prezzoDettaglio,
  prezzoUnaTantum,
} from "@/lib/pricing";

/**
 * IL CATALOGO PER FAMIGLIE, con il filtro per bisogno.
 *
 * ═══ PERCHÉ È UN COMPONENTE CLIENT ═══
 * Solo per il filtro. Tutto il resto è statico e viene reso dal server:
 * senza JavaScript la pagina mostra il catalogo intero, che è lo stato
 * di partenza. Il filtro toglie, non aggiunge — se non parte, non manca
 * niente a nessuno.
 *
 * ═══ IL PREZZO SI DICHIARA «A PARTIRE DA» ═══
 * Un prezzo secco in vetrina sembra valido per tutti e non lo è: il
 * listino è per fascia dimensionale. Qui compare il valore della fascia
 * micro con la formula «a partire da» e la ragione accanto — il prezzo
 * esatto si compone nella pagina del servizio. È la stessa cautela per
 * cui non si scrive mai un prezzo a mano: viene da `pricing.ts`.
 *
 * ═══ GERARCHIA DELLA SCHEDA ═══
 * nome tecnico completo (§12.I) → riga di beneficio in lingua corrente →
 * norma di riferimento → prezzo → stato e via d'uscita. In quest'ordine
 * perché è l'ordine in cui si decide: che cos'è, a che serve, su cosa si
 * basa, quanto costa, cosa faccio adesso.
 */

const eur = (n: number) => n.toLocaleString("it-IT");

/**
 * I bisogni a cui risponde il Percorso Ver0.
 *
 * Non stanno in `FAMIGLIE` perché il bundle non appartiene a una
 * famiglia: qui vale la stessa regola del catalogo — la dichiarazione
 * dev'essere sostenibile con quello che la scheda già scrive. La sua
 * riga «a chi serve» dice «imprese a cui una banca, un capofiliera o un
 * bando chiedono dati di sostenibilità»: sono questi tre.
 */
const BISOGNI_PERCORSO_VER0: Bisogno[] = ["banca", "committente", "bando"];

/** «a partire da 45 €/mese», oppure la forma una tantum. `null` se in arrivo. */
function prezzoDaFascia(slug: string | undefined) {
  if (!slug) return null;
  const unaTantum = prezzoUnaTantum(slug, "micro");
  if (unaTantum !== null) {
    return { importo: eur(unaTantum), unita: "€ una tantum" };
  }
  const p = prezzoDettaglio(slug, "micro");
  return p ? { importo: eur(p.mensile), unita: "€/mese" } : null;
}

function Scheda({ voce }: { voce: VoceCatalogo }) {
  const servizio = voce.slug ? getServizio(voce.slug) : undefined;
  const prezzo = prezzoDaFascia(voce.slug);
  const attivo = Boolean(servizio && prezzo);
  const nome = servizio ? titoloServizio(servizio) : (voce.nome ?? "");
  const norma = servizio?.riferimenti[0];
  const Icona = servizio?.icon;

  const corpo = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          {Icona && (
            <span
              aria-hidden
              className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-moss text-pine transition-colors group-hover:bg-pine group-hover:text-white"
            >
              <Icona size={17} />
            </span>
          )}
          <p
            className={
              "font-display text-lg leading-tight " +
              (attivo ? "text-ink" : "text-gray-warm")
            }
          >
            {nome}
          </p>
        </div>
        {/* Lo stato, sempre dichiarato: «in arrivo» non è un dettaglio. */}
        {!attivo && (
          <span className="shrink-0 rounded-full border border-line bg-paper px-2.5 py-1 text-[11px] font-semibold text-gray-warm">
            In arrivo
          </span>
        )}
        {voce.addOn && attivo && (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-moss px-2.5 py-1 text-[11px] font-semibold text-pine">
            <Plus size={11} aria-hidden /> Add-on
          </span>
        )}
      </div>

      <p className="mt-2.5 text-sm leading-relaxed text-gray-warm">
        {voce.benefit}
      </p>

      {servizio?.perimetroBreve && (
        <p className="mt-1.5 text-xs leading-relaxed text-amber-ink">
          {servizio.perimetroBreve}
        </p>
      )}

      {norma && (
        <p className="mt-2 text-xs font-medium text-pine">{norma}</p>
      )}

      <div className="mt-3 flex flex-wrap items-end justify-between gap-x-3 gap-y-2 border-t border-line pt-3">
        <div className="min-w-0">
          {prezzo ? (
            <>
              <p className="text-[11px] uppercase tracking-wide text-gray-light">
                a partire da
              </p>
              <p className="font-display text-2xl leading-none tabular-nums text-pine">
                {prezzo.importo}{" "}
                <span className="text-sm text-gray-warm">{prezzo.unita}</span>
              </p>
              <p className="mt-0.5 text-[11px] text-gray-light">
                varia per dimensione d&apos;impresa
              </p>
            </>
          ) : (
            <p className="text-xs text-gray-light">
              Prezzo alla pubblicazione del percorso
            </p>
          )}
        </div>
        {attivo && (
          <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-pine">
            Vedi il percorso
            <ArrowRight
              size={14}
              className="transition-transform group-hover:translate-x-0.5"
            />
          </span>
        )}
      </div>

      <div className="mt-2.5 flex flex-wrap items-center gap-2">
        {/* Il pilastro resta, ma discreto: serve a chi già sa cosa cerca. */}
        <span className="rounded border border-line px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-light">
          {voce.pilastro} · {PILASTRO_LABEL[voce.pilastro]}
        </span>
        {voce.etichetta && (
          <span className="rounded-full bg-moss px-2 py-0.5 text-[10px] font-semibold text-pine">
            {voce.etichetta}
          </span>
        )}
      </div>
    </>
  );

  const classi =
    "group flex h-full flex-col rounded-2xl border border-line bg-white p-4 shadow-soft sm:p-5";

  return voce.slug && attivo ? (
    <Link
      href={`/servizi/${voce.slug}`}
      className={classi + " transition-all hover:-translate-y-0.5 hover:shadow-lift"}
    >
      {corpo}
    </Link>
  ) : (
    <div className={classi + " bg-paper"}>{corpo}</div>
  );
}

/**
 * LA MAPPA DEL CATALOGO — tre blocchi, uno per famiglia.
 *
 * Risponde a una domanda sola: come sono organizzati questi servizi.
 * Non spiega il contesto normativo (quello vive nelle guide), non elenca
 * chi chiede cosa, non argomenta: mostra la STRUTTURA. Una riga per
 * blocco, e i nomi dei primi percorsi come anteprima — perché «Misura e
 * rendiconta» da solo non dice ancora niente a chi non sa cosa ci trova
 * dentro.
 *
 * Sta dentro il componente del catalogo, non accanto: cliccando un
 * blocco si azzera il filtro E si scorre alla famiglia. Se fosse un
 * semplice link ad ancora, con un filtro attivo punterebbe a una sezione
 * che in quel momento non esiste.
 *
 * TRE LAVORI DISTINTI, in fila e senza sovrapposizioni: la mappa mostra
 * la struttura, il selettore filtra per situazione, il catalogo elenca.
 */
function MappaCatalogo({
  vai,
}: {
  vai: (key: string) => void;
}) {
  return (
    <section aria-labelledby="mappa-catalogo" className="mt-10">
      <h2 id="mappa-catalogo" className="text-center text-sm text-gray-warm">
        Ogni percorso produce una qualifica documentata della tua impresa.
      </h2>
      <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {FAMIGLIE.map((f) => {
          const Icona = f.icona;
          const attivi = f.voci.filter((v) => v.slug).length;
          const inArrivo = f.voci.length - attivi;
          // Anteprima: i primi nomi, gli attivi per primi. Tre al massimo —
          // oltre, il blocco torna a essere un elenco.
          const primi = [...f.voci]
            .sort((a, b) => Number(Boolean(b.slug)) - Number(Boolean(a.slug)))
            .slice(0, 3)
            .map((v) => {
              const s = v.slug ? getServizio(v.slug) : undefined;
              return { nome: s ? s.name : (v.nome ?? ""), servizio: s };
            });
          // Due percorsi possono avere lo stesso nome e distinguersi solo
          // per il taglio (Carbon Scope 1 e 2 contro Scope 1, 2 e 3):
          // nell'anteprima comparivano due volte identici. Il taglio si
          // aggiunge solo dove serve a distinguerli.
          const anteprima = primi.map((x) =>
            primi.filter((y) => y.nome === x.nome).length > 1 && x.servizio
              ? titoloServizio(x.servizio)
              : x.nome,
          );
          return (
            <li key={f.key}>
              <button
                type="button"
                onClick={() => vai(f.key)}
                className="vz-interattivo flex h-full w-full flex-col rounded-2xl border border-line bg-white p-4 text-left hover:-translate-y-0.5 hover:border-pine hover:shadow-soft"
              >
                <span
                  aria-hidden
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-moss text-pine"
                >
                  <Icona size={18} />
                </span>
                <span className="mt-2.5 font-display text-lg leading-tight text-ink">
                  {f.titolo}
                </span>
                <span className="mt-1 text-xs leading-relaxed text-gray-warm">
                  {f.sintesi}
                </span>
                <span className="mt-2.5 text-[11px] font-semibold text-pine">
                  {attivi} {attivi === 1 ? "percorso attivo" : "percorsi attivi"}
                  {inArrivo > 0 ? ` · ${inArrivo} in arrivo` : ""}
                </span>
                <span className="mt-1.5 text-[11px] leading-relaxed text-gray-light">
                  {anteprima.join(" · ")}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export function CatalogoFamiglie() {
  const [bisogno, setBisogno] = useState<Bisogno | null>(null);
  const sezioni = useRef(new Map<string, HTMLElement>());

  /** Dalla mappa alla famiglia: si toglie il filtro e poi si scorre. */
  const vaiAllaFamiglia = (key: string) => {
    setBisogno(null);
    // Dopo il render: con un filtro attivo la sezione può non esistere
    // ancora nel momento del click.
    requestAnimationFrame(() => {
      sezioni.current
        .get(key)
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const famiglie = FAMIGLIE.map((f) => ({
    ...f,
    voci: bisogno ? f.voci.filter((v) => v.bisogni.includes(bisogno)) : f.voci,
  })).filter((f) => f.voci.length > 0);
  const quanti = famiglie.reduce((n, f) => n + f.voci.length, 0);
  const percorso = prezzoDettaglio("percorso-ver0", "micro");

  return (
    <div>
      <MappaCatalogo vai={vaiAllaFamiglia} />

      {/* IL FILTRO PER BISOGNO. Toglie, non aggiunge: senza JavaScript
          resta il catalogo intero, che è lo stato di partenza. */}
      <div className="mt-8 rounded-2xl border border-line bg-paper p-4">
        <p
          id="filtro-bisogno"
          className="text-[11px] font-semibold uppercase tracking-widest text-gray-light"
        >
          Perché stai cercando una qualifica?
        </p>
        <div
          role="group"
          aria-labelledby="filtro-bisogno"
          className="mt-2.5 flex flex-wrap gap-2"
        >
          {BISOGNI.map((b) => {
            const scelto = bisogno === b.key;
            return (
              <button
                key={b.key}
                type="button"
                aria-pressed={scelto}
                onClick={() => setBisogno(scelto ? null : b.key)}
                className={
                  "vz-interattivo rounded-full border px-3.5 py-2 text-sm font-medium " +
                  (scelto
                    ? "border-pine bg-pine text-white"
                    : "border-line bg-white text-gray-warm hover:border-pine hover:text-pine")
                }
              >
                {b.label}
              </button>
            );
          })}
          {bisogno && (
            <button
              type="button"
              onClick={() => setBisogno(null)}
              className="vz-interattivo rounded-full px-3 py-2 text-sm font-medium text-pine underline"
            >
              Mostra tutto
            </button>
          )}
        </div>
        <p aria-live="polite" className="mt-2.5 text-xs text-gray-warm">
          {bisogno
            ? `${quanti} percorsi pertinenti su ${FAMIGLIE.reduce((n, f) => n + f.voci.length, 0)}.`
            : "Tutti i percorsi. Scegli una situazione per vedere solo quelli pertinenti."}
        </p>
      </div>

      {/* IL PERCORSO VER0 — la testa del catalogo, dopo il selettore.
          Stava sopra la mappa, e interrompeva la sequenza: la mappa dice
          come sono organizzati i percorsi, e arrivare dopo un percorso
          specifico la faceva leggere al contrario.

          Non appartiene a una famiglia sola — unisce tre risultati con un
          solo inserimento dati — ma il filtro lo riguarda lo stesso: la
          sua riga «a chi serve» nomina banca, capofiliera e bandi, e
          mostrarlo a chi ha chiesto «voglio migliorare» sarebbe una
          risposta fuori tema. */}
      {(bisogno === null || BISOGNI_PERCORSO_VER0.includes(bisogno)) && (
      <Link
        href="/servizi/percorso-ver0"
        className="group relative block overflow-hidden rounded-3xl bg-pine-deep p-6 shadow-lift transition-all hover:-translate-y-1 sm:p-8"
      >
        <span
          aria-hidden
          className="pointer-events-none absolute -right-10 -top-16 select-none font-display text-[16rem] leading-none text-white/[0.04]"
        >
          0
        </span>
        <div className="relative flex flex-wrap items-end justify-between gap-6">
          <div className="min-w-0 max-w-md">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-mint-bright/20 px-3 py-1 text-xs font-semibold text-mint-bright">
              <Leaf size={13} aria-hidden /> Tre risultati, un solo inserimento
            </span>
            <p className="mt-3 font-display text-3xl text-white md:text-4xl">
              Percorso Ver0
            </p>
            <p className="mt-2 text-sm leading-relaxed text-moss">
              Carbon Footprint Scope 1 e 2, Bilancio di Sostenibilità VSME e
              profilo ESG per i questionari di banche e capofiliera.
            </p>
          </div>
          <div className="min-w-0 shrink-0">
            {percorso && (
              <>
                <p className="text-[11px] uppercase tracking-wide text-moss/70">
                  a partire da
                </p>
                <p className="font-display text-4xl tabular-nums text-white">
                  {eur(percorso.mensile)} €
                  <span className="text-lg text-moss">/mese</span>
                </p>
                <p className="mt-0.5 text-xs text-moss/80">
                  varia per dimensione d&apos;impresa
                </p>
              </>
            )}
            <span className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-pine transition-transform group-hover:translate-x-0.5">
              Scopri il Percorso <ArrowRight size={15} aria-hidden />
            </span>
          </div>
        </div>
      </Link>
      )}

      {/* LE FAMIGLIE. Ognuna si apre dicendo cosa OTTIENI, non cosa contiene. */}
      {famiglie.map((f) => {
        const Icona = f.icona;
        return (
          <section
            key={f.key}
            // L'ancora è reale, non solo un bersaglio per il JavaScript
            // della mappa: il footer ci punta con un link normale, e un
            // link normale deve funzionare anche senza JavaScript.
            id={`famiglia-${f.key}`}
            ref={(el) => {
              if (el) sezioni.current.set(f.key, el);
              else sezioni.current.delete(f.key);
            }}
            // Lo scorrimento si ferma sotto l'intestazione fissa, non
            // dietro: senza questo il titolo della famiglia resta coperto.
            className="mt-10 scroll-mt-24"
          >
            <header className="flex items-start gap-3 border-b-2 border-line pb-4">
              <span
                aria-hidden
                className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-moss text-pine"
              >
                <Icona size={20} />
              </span>
              <div className="min-w-0">
                <h2 className="font-display text-2xl leading-tight text-ink md:text-3xl">
                  {f.titolo}
                </h2>
                <p className="mt-1 max-w-2xl text-sm leading-relaxed text-gray-warm">
                  {f.ottieni}
                </p>
              </div>
            </header>
            <ul className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
              {f.voci.map((v) => (
                <li key={v.slug ?? v.nome} className="min-w-0">
                  <Scheda voce={v} />
                </li>
              ))}
            </ul>
          </section>
        );
      })}

      <p className="mt-8 text-center text-xs leading-relaxed text-gray-warm">
        {RINNOVO_LIBERO} {CANONE_INLINE}{" "}
        <Link href="/#prezzo" className="font-medium text-pine hover:underline">
          Perché l&apos;abbonamento
        </Link>
      </p>

      {/* Aggancio grande impresa (§12.X) */}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3 rounded-2xl border border-line/70 bg-paper px-5 py-4 text-center">
        <p className="text-sm text-gray-warm">{GRANDE_IMPRESA.copy}</p>
        <a
          href={GRANDE_IMPRESA.href}
          className="inline-flex items-center gap-1.5 rounded-lg border border-pine bg-white px-3.5 py-2 text-sm font-medium text-pine"
        >
          <Mail size={14} aria-hidden /> {GRANDE_IMPRESA.cta}
        </a>
      </div>
    </div>
  );
}
