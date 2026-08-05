import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Database,
  Eye,
  FileSearch,
  Globe,
  ShieldCheck,
  UserCheck,
  Users,
} from "lucide-react";

import { Sigillo } from "@/components/brand/sigillo";

export const metadata: Metadata = {
  title: "Chi siamo — Ver0",
  description:
    "Abbiamo costruito il Motore Ver0 per unire la potenza dell'AI alle competenze di professionisti veri: documenti conformi, banche dati ufficiali, verifica umana. Zero protagonismo: il team dietro lo schermo, i risultati davanti.",
};

/**
 * Chi siamo — tono istituzionale in Registro A, con innesto Registro C nel
 * finale (momento di fiducia: crema, sigillo timbrato, un accento terracotta).
 *
 * VINCOLI (decisione del fondatore): nessun claim di primato assoluto, solo
 * formule di identità; nessun dato societario finché la società non esiste;
 * nessun numero inventato; per il team nessun nome, foto o riferimento
 * personale/geografico — racconto collettivo.
 */

const PRINCIPI = [
  {
    icon: ShieldCheck,
    title: "Zero scorciatoie",
    desc: "Il Sigillo non si compra: si dimostra con percorsi verificati, e ogni anno va riconquistato.",
  },
  {
    icon: Globe,
    title: "Dati custoditi in Europa",
    desc: "Infrastruttura e documenti risiedono nell'Unione Europea, trattati secondo il GDPR.",
  },
  {
    icon: Eye,
    title: "Prezzi pubblici",
    desc: "Il listino è in chiaro, per fascia dimensionale: nessun preventivo da chiedere, nessuna sorpresa.",
  },
  {
    icon: UserCheck,
    title: "Verifica umana, sempre",
    desc: "Nessun documento esce senza il controllo di una persona, e le validazioni portano il nome di chi le ha fatte.",
  },
];

const MOTORE_CAPACITA = [
  {
    icon: FileSearch,
    t: "Legge i tuoi documenti",
    d: "Bollette, visure, bilanci, manuali: estrae i dati da ciò che hai già.",
  },
  {
    icon: Database,
    t: "Incrocia le banche dati ufficiali",
    d: "Fonti camerali ed energetiche: mai chiederti ciò che una fonte ufficiale sa già.",
  },
  {
    icon: BadgeCheck,
    t: "Genera documenti conformi",
    d: "Seguono la struttura della norma di riferimento e restano aggiornati nel tempo.",
  },
];

export default function ChiSiamoPage() {
  return (
    <main>
      {/* 1. LA MISSIONE — Registro A, apertura editoriale */}
      <section className="bg-gradient-to-b from-moss via-moss to-paper px-5 py-16 text-center">
        <p className="mb-4 text-xs font-semibold tracking-widest text-pine">
          CHI SIAMO
        </p>
        <h1 className="mx-auto max-w-3xl font-display text-4xl leading-[1.08] text-pine-dark md:text-6xl">
          Abbattere tempi e costi del sistema consulenziale italiano, un settore
          alla volta.
        </h1>
        <p className="mx-auto mt-5 max-w-xl font-display text-2xl text-pine">
          L&apos;AI è il motore di tutto.
        </p>
        <p className="mx-auto mt-5 max-w-2xl text-sm leading-relaxed text-gray-warm">
          La consulenza tradizionale è lenta e costosa: preventivi opachi, mesi
          di attesa, parcelle fuori portata per gran parte delle imprese. Il
          risultato è che chi più avrebbe bisogno di qualificarsi — verso
          banche, clienti capofiliera, stazioni appaltanti — resta fuori.
          Abbiamo scelto di partire da lì.
        </p>
      </section>

      {/* 2. IL MOTORE VER0 — Registro A istituzionale */}
      <section className="bg-white px-5 py-16">
        <div className="mx-auto max-w-4xl">
          <div className="text-center">
            <p className="mb-3 text-xs font-semibold tracking-widest text-pine">
              IL NOSTRO MOTORE
            </p>
            <h2 className="font-display text-4xl text-ink md:text-5xl">
              Il Motore Ver0
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-gray-warm">
              Abbiamo costruito il Motore Ver0 per unire la potenza
              dell&apos;AI alle competenze di professionisti veri. Non è
              un&apos;AI generica: è un motore proprietario specializzato nei
              documenti e nei settori d&apos;impresa.
            </p>
          </div>
          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {MOTORE_CAPACITA.map((c) => {
              const Icon = c.icon;
              return (
                <article
                  key={c.t}
                  className="vz-reveal rounded-2xl border border-line/70 bg-white p-5 text-center shadow-soft"
                >
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-moss text-pine">
                    <Icon size={20} />
                  </span>
                  <p className="mt-3 text-sm font-semibold text-ink">{c.t}</p>
                  <p className="mt-1.5 text-xs leading-relaxed text-gray-warm">
                    {c.d}
                  </p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* 3. LE PERSONE — racconto collettivo, nessun nome */}
      <section className="bg-gradient-to-b from-paper via-moss to-moss px-5 py-16">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-white text-pine shadow-soft">
            <Users size={22} />
          </span>
          <h2 className="mt-4 font-display text-4xl text-ink md:text-5xl">
            Le persone
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-sm leading-relaxed text-gray-warm">
            Dietro lo schermo: ingegneri, analisti ed esperti di settore con
            esperienza pluriennale. Ogni documento passa da una verifica umana
            prima di arrivare a te, e chi valida ci mette il nome — dentro la
            piattaforma, dove conta.
          </p>
          <p className="mx-auto mt-6 max-w-xl font-display text-2xl text-pine-dark">
            <em className="font-semibold text-mint">Zero</em> protagonismo: il
            team resta dietro lo schermo, i risultati davanti.
          </p>
        </div>
      </section>

      {/* 4. I PRINCIPI — quattro card */}
      <section className="bg-white px-5 py-16">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center font-display text-4xl text-ink md:text-5xl">
            I principi
          </h2>
          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {PRINCIPI.map((p) => {
              const Icon = p.icon;
              return (
                <article
                  key={p.title}
                  className="vz-reveal rounded-2xl border border-line/70 bg-white p-5 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-lift"
                >
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-moss text-pine">
                    <Icon size={20} />
                  </span>
                  <p className="mt-3 font-display text-lg text-ink">
                    {p.title}
                  </p>
                  <p className="mt-1.5 text-sm leading-relaxed text-gray-warm">
                    {p.desc}
                  </p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* 5. IL METODO SI DIMOSTRA — innesto Registro C: crema, timbrato,
          un solo accento terracotta */}
      <section className="bg-cream px-5 py-16 text-center">
        <div className="mx-auto max-w-2xl">
          <div className="mb-6 flex justify-center">
            <Sigillo className="h-24 w-24 -rotate-6" />
          </div>
          <h2 className="font-display text-4xl text-ink md:text-5xl">
            Il metodo non si racconta.{" "}
            <em className="text-terracotta">Si dimostra.</em>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-gray-warm">
            Per questo esiste il Sigillo Ver0: criteri pubblici, dati
            verificati, millesimo che ogni anno va riconquistato. Ciò che
            promettiamo qui, lì diventa controllabile da chiunque.
          </p>
          <div className="mt-6 flex justify-center">
            <Link
              href="/sigillo"
              className="inline-flex items-center gap-1.5 rounded-lg bg-pine px-5 py-2.5 text-sm font-medium text-white shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-lift"
            >
              Scopri il Sigillo <ArrowRight size={15} />
            </Link>
          </div>
          <p className="mx-auto mt-10 max-w-xl border-t border-line/60 pt-8 font-display text-xl leading-relaxed text-pine-dark md:text-2xl">
            Ci chiamiamo Ver0 per un principio solo, lo Zero, che torna in ogni
            promessa. Lo Zero, da noi, non è il niente — è il traguardo.
          </p>
        </div>
      </section>
    </main>
  );
}
