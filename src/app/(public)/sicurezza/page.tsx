import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Database,
  KeyRound,
  Lock,
  ShieldCheck,
  Trash2,
} from "lucide-react";

import { JsonLd } from "@/components/json-ld";
import { jsonLdBreadcrumb, metadataPagina } from "@/lib/seo";
import {
  DOMANDE_DIRETTE,
  GARANZIE,
  VERIFICA_FORNITORI,
  aggiornatoIl,
} from "@/lib/sicurezza";

export const metadata: Metadata = metadataPagina({
  title: "Sicurezza e riservatezza dei tuoi dati",
  description:
    "Dove vivono i dati, come sono isolati fra imprese, chi può vederli e cosa non facciamo. Con i test automatici che lo dimostrano a ogni rilascio.",
  path: "/sicurezza",
});

/**
 * /sicurezza — le GARANZIE, mai l'implementazione.
 *
 * La regola che governa questa pagina sta in CLAUDE.md ed è vincolante:
 * si dichiara la natura delle protezioni, dove vivono i dati, chi accede
 * e con quale titolo, l'esistenza e l'oggetto dei test, la revocabilità
 * e la tracciabilità. NON si dichiarano struttura del database, testo
 * delle politiche, modelli e istruzioni, schemi di estrazione, soglie,
 * versioni o percorsi di file.
 *
 * Criterio: se un'informazione permette a un concorrente di replicare il
 * metodo o a un attaccante di orientarsi, non va in pagina. Per
 * questionari fornitori e audit IT la sede è un documento riservato su
 * richiesta, non il sito pubblico.
 *
 * Secondo vincolo: NESSUN CLAIM NON DIMOSTRABILE. Niente «sicurezza di
 * livello bancario», nessun sigillo che non possediamo. Tutto ciò che è
 * scritto qui è stato verificato alla data dichiarata, e ciò che è in
 * corso è detto come tale.
 */
export default function SicurezzaPage() {
  return (
    <main>
      <JsonLd
        dati={jsonLdBreadcrumb([
          { nome: "Home", path: "/" },
          { nome: "Sicurezza", path: "/sicurezza" },
        ])}
      />

      {/* ── LA TESTATA, non un'apertura ──────────────────────────────
          Questa pagina è un DOCUMENTO, e su questo tema la credibilità
          viene dall'assenza di spettacolo: chi legge una pagina sulla
          sicurezza e trova un fondo colorato, un titolo da manifesto e
          un fascio di particelle si chiede che cosa stiamo compensando.

          Quindi niente fascia salvia, niente centraggio, titolo a corpo
          da documento e non da manifesto, e la data della verifica
          SUBITO SOTTO IL TITOLO — dove sta la data su un documento
          serio — invece che in fondo in grigio chiaro. */}
      <section className="border-b border-line bg-white px-5 pb-10 pt-14 md:pb-12 md:pt-16">
        <div className="mx-auto max-w-4xl">
          <p className="text-[13px] font-semibold uppercase tracking-[0.16em] text-pine">
            Sicurezza e riservatezza
          </p>
          <h1 className="mt-5 max-w-[18ch] font-display text-[2.1rem] leading-[1.1] tracking-[-0.02em] text-ink md:text-[2.9rem]">
            I tuoi documenti restano tuoi.
          </h1>
          <p className="mt-3 text-[13px] font-medium text-gray-light">
            Verifiche svolte il {aggiornatoIl}.
          </p>
          <p className="mt-6 max-w-[64ch] text-[16px] leading-[1.7] text-gray-warm">
            Questa pagina dice dove vivono i dati, chi può vederli e cosa non
            facciamo. Senza formule: quello che c&apos;è scritto è verificato,
            e quello che è ancora in corso lo diciamo.
          </p>
        </div>
      </section>

      {/* LIVELLO 1 — le garanzie, in parole comuni. Ogni blocco ha il suo
          livello 2 richiudibile per chi sa leggerlo. */}
      <section className="bg-white px-5 py-14 md:py-16">
        <div className="mx-auto max-w-4xl space-y-4">
          {GARANZIE.map((g) => {
            const Icona = {
              lock: Lock,
              database: Database,
              key: KeyRound,
              trash: Trash2,
            }[g.icona];
            return (
              <article
                key={g.titolo}
                className="rounded-2xl border border-line bg-white p-5 sm:p-6"
              >
                <div className="flex items-start gap-4">
                  <span
                    aria-hidden
                    className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-moss text-pine"
                  >
                    <Icona size={19} />
                  </span>
                  <div className="min-w-0">
                    <h2 className="font-display text-2xl leading-tight text-ink">
                      {g.titolo}
                    </h2>
                    <ul className="mt-3 space-y-2">
                      {g.punti.map((p) => (
                        <li
                          key={p}
                          className="flex gap-2.5 text-sm leading-relaxed text-gray-warm"
                        >
                          <span
                            aria-hidden
                            className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-mint"
                          />
                          {p}
                        </li>
                      ))}
                    </ul>
                    {g.tecnico.length > 0 && (
                      <details className="group mt-4 rounded-xl border border-line bg-paper">
                        <summary className="vz-interattivo cursor-pointer list-none px-4 py-3 text-xs font-semibold text-pine">
                          I dettagli tecnici
                        </summary>
                        <ul className="space-y-2 px-4 pb-4 pt-1">
                          {g.tecnico.map((t) => (
                            <li
                              key={t}
                              className="flex gap-2 text-xs leading-relaxed text-gray-warm"
                            >
                              <span
                                aria-hidden
                                className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-pine/40"
                              />
                              {t}
                            </li>
                          ))}
                        </ul>
                      </details>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* LA PROVA, NON LA PROMESSA — l'affermazione più forte della pagina. */}
      {/* LA PROVA — era una fascia scura a tutta larghezza con il fascio
          di particelle, cioè il momento più spettacolare del sito su una
          pagina che deve essere la meno spettacolare di tutte. Il fatto
          è forte da solo: cinquantatré controlli che fermano un rilascio
          non hanno bisogno di un fondo animato. Qui è un riquadro
          rientrato, con il filetto menta a sinistra come una citazione
          in un documento tecnico. */}
      <section className="bg-white px-5 pb-14 md:pb-16">
        <div className="mx-auto max-w-4xl border-l-2 border-mint pl-6 md:pl-8">
          <p className="flex items-center gap-2.5 text-[13px] font-semibold uppercase tracking-[0.16em] text-pine">
            <ShieldCheck size={16} aria-hidden className="shrink-0" />
            La prova, non la promessa
          </p>
          <h2 className="mt-5 max-w-[26ch] font-display text-[1.7rem] leading-[1.2] text-ink md:text-[2.2rem]">
            L&apos;isolamento fra imprese è coperto da{" "}
            <span className="text-pine">53 test automatici</span>, eseguiti a
            ogni rilascio.
          </h2>
          <p className="mt-5 max-w-[64ch] text-[16px] leading-[1.7] text-gray-warm">
            Non è una dichiarazione d&apos;intenti: è una suite che gira contro
            il database vero e che, se fallisce anche un solo controllo, ferma
            il rilascio. Ecco cosa verifica, in concreto.
          </p>
          <ul className="mt-7 grid max-w-3xl grid-cols-1 gap-2.5 sm:grid-cols-2">
            {[
              "Un'impresa non legge né scrive i dati di un'altra.",
              "Chi non ha fatto l'accesso non vede nulla.",
              "Il consulente senza mandato attivo non entra.",
              "L'amministratore di piattaforma non apre gli archivi documenti dei clienti.",
            ].map((t) => (
              <li
                key={t}
                className="rounded-xl border border-line bg-paper/70 px-4 py-3 text-[15px] leading-relaxed text-ink"
              >
                {t}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* I FORNITORI — chi sono, cosa fanno, cosa risulta dalle loro
          condizioni. Verificato, con la data. */}
      <section className="bg-white px-5 pb-14 md:pb-16">
        <div className="mx-auto max-w-4xl">
          <h2 className="font-display text-[1.7rem] leading-[1.2] text-ink md:text-[2.2rem]">
            Chi tocca i tuoi dati, e per fare cosa.
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-gray-warm">
            Nessuna piattaforma è un&apos;isola. Questi sono i fornitori di cui
            ci serviamo, il loro ruolo e cosa dicono le loro condizioni —
            verificate il {aggiornatoIl}.
          </p>
          <div className="mt-8 space-y-3">
            {VERIFICA_FORNITORI.map((f) => (
              <article
                key={f.nome}
                className="rounded-2xl border border-line bg-white p-5"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                  <h3 className="font-display text-xl text-ink">{f.nome}</h3>
                  <p className="text-xs font-medium text-pine">{f.ruolo}</p>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-gray-warm">
                  {f.risultato}
                </p>
                <a
                  href={f.fonte}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-pine hover:underline"
                >
                  La fonte <ArrowRight size={13} />
                </a>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* DOMANDE DIRETTE, RISPOSTE DIRETTE */}
      <section className="border-t border-line bg-white px-5 py-14 md:py-16">
        <div className="mx-auto max-w-3xl">
          <h2 className="font-display text-[1.7rem] leading-[1.2] text-ink md:text-[2.2rem]">
            Domande dirette, risposte dirette.
          </h2>
          <dl className="mt-8 space-y-5">
            {DOMANDE_DIRETTE.map((d) => (
              <div key={d.domanda} className="border-l-2 border-mint pl-4">
                <dt className="font-display text-lg leading-snug text-ink">
                  {d.domanda}
                </dt>
                <dd className="mt-1.5 text-sm leading-relaxed text-gray-warm">
                  {d.risposta}
                </dd>
              </div>
            ))}
          </dl>
          <p className="mt-10 rounded-2xl border border-line bg-paper p-5 text-sm leading-relaxed text-gray-warm">
            <strong className="font-semibold text-ink">
              Ti serve di più per un questionario fornitori o un audit IT?
            </strong>{" "}
            Prepariamo un documento tecnico riservato, su richiesta e sotto
            riservatezza. Su una pagina pubblica ci fermiamo alle garanzie:
            spiegare come sono fatte le serrature aiuta chi vuole aprirle.{" "}
            <Link
              href="/contatti"
              className="font-semibold text-pine hover:underline"
            >
              Scrivici
            </Link>
            .
          </p>
        </div>
      </section>
    </main>
  );
}
