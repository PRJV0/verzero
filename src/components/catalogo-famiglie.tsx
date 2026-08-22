"use client";

import { useState } from "react";
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

export function CatalogoFamiglie() {
  const [bisogno, setBisogno] = useState<Bisogno | null>(null);

  const famiglie = FAMIGLIE.map((f) => ({
    ...f,
    voci: bisogno ? f.voci.filter((v) => v.bisogni.includes(bisogno)) : f.voci,
  })).filter((f) => f.voci.length > 0);
  const quanti = famiglie.reduce((n, f) => n + f.voci.length, 0);
  const percorso = prezzoDettaglio("percorso-ver0", "micro");

  return (
    <div>
      {/* IL PERCORSO VER0 — resta in testa: è l'unico che unisce tre
          risultati con un solo inserimento dati, e non appartiene a una
          famiglia sola. Non entra nel filtro per la stessa ragione. */}
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

      {/* LE FAMIGLIE. Ognuna si apre dicendo cosa OTTIENI, non cosa contiene. */}
      {famiglie.map((f) => {
        const Icona = f.icona;
        return (
          <section key={f.key} className="mt-10">
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
