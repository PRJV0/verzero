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
import { OndaParticelle } from "@/components/onda-particelle";
import { FONDO_SOGLIA, PRESET } from "@/lib/onda";
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

      {/* APERTURA */}
      <section className="bg-moss px-5 py-16 md:py-24">
        <div className="mx-auto max-w-3xl text-center">
          <p className="mb-4 text-xs font-semibold tracking-widest text-pine">
            SICUREZZA E RISERVATEZZA
          </p>
          <h1 className="font-display text-5xl leading-[1.02] text-pine-dark md:text-6xl">
            I tuoi documenti restano tuoi.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-pine">
            Questa pagina dice dove vivono i dati, chi può vederli e cosa non
            facciamo. Senza formule: quello che c&apos;è scritto è verificato,
            e quello che è ancora in corso lo diciamo.
          </p>
          <p className="mt-4 text-xs text-gray-warm">
            Verifiche svolte il {aggiornatoIl}.
          </p>
        </div>
      </section>

      {/* LIVELLO 1 — le garanzie, in parole comuni. Ogni blocco ha il suo
          livello 2 richiudibile per chi sa leggerlo. */}
      <section className="bg-white px-5 py-16 md:py-20">
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
      <section
        className="relative isolate overflow-hidden px-5 py-16 md:py-24"
        style={{
          background: `linear-gradient(to bottom, ${FONDO_SOGLIA[0]}, ${FONDO_SOGLIA[1]})`,
        }}
      >
        <OndaParticelle config={PRESET.tecnica} className="-z-10" />
        <div className="relative mx-auto max-w-3xl text-center">
          <span
            aria-hidden
            className="mx-auto mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-mint-bright/15 text-mint-bright"
          >
            <ShieldCheck size={26} />
          </span>
          <p className="mb-4 text-xs font-semibold tracking-widest text-mint-bright">
            LA PROVA, NON LA PROMESSA
          </p>
          <h2 className="font-display text-4xl leading-[1.05] text-white md:text-5xl">
            L&apos;isolamento fra imprese è coperto da{" "}
            <span className="text-mint-bright">53 test automatici</span>,
            eseguiti a ogni rilascio.
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-sm leading-relaxed text-moss/80">
            Non è una dichiarazione d&apos;intenti: è una suite che gira contro
            il database vero e che, se fallisce anche un solo controllo, ferma
            il rilascio. Ecco cosa verifica, in concreto.
          </p>
          <ul className="mx-auto mt-8 grid max-w-2xl grid-cols-1 gap-2.5 text-left sm:grid-cols-2">
            {[
              "Un'impresa non legge né scrive i dati di un'altra.",
              "Chi non ha fatto l'accesso non vede nulla.",
              "Il consulente senza mandato attivo non entra.",
              "L'amministratore di piattaforma non apre gli archivi documenti dei clienti.",
            ].map((t) => (
              <li
                key={t}
                className="rounded-xl border border-white/12 bg-white/[0.04] px-4 py-3 text-sm leading-relaxed text-white"
              >
                {t}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* I FORNITORI — chi sono, cosa fanno, cosa risulta dalle loro
          condizioni. Verificato, con la data. */}
      <section className="bg-paper px-5 py-16 md:py-20">
        <div className="mx-auto max-w-4xl">
          <h2 className="font-display text-3xl leading-tight text-ink md:text-4xl">
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
      <section className="bg-white px-5 py-16 md:py-20">
        <div className="mx-auto max-w-3xl">
          <h2 className="font-display text-3xl leading-tight text-ink md:text-4xl">
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
