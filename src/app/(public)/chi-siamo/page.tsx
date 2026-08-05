import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  BookMarked,
  ClipboardList,
  Database,
  Eye,
  FileSearch,
  Globe,
  ShieldCheck,
  UserCheck,
  Users,
} from "lucide-react";

import { Sigillo } from "@/components/brand/sigillo";
import { PhotoDuotone } from "@/components/photo-duotone";
import { SOLO_STANDARD_UFFICIALI } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Chi siamo — Ver0",
  description:
    "Abbiamo costruito il Motore Ver0 per unire la potenza dell'AI alle competenze di professionisti veri: raccolta documentale guidata, banche dati ufficiali, solo standard riconosciuti, verifica umana. Zero protagonismo: il team dietro lo schermo, i risultati davanti.",
};

/**
 * Chi siamo — Registro A pieno: tipografia drammatica, foto duotone, fondi
 * alternati (salvia / bianco / pino profondo), reveal allo scroll.
 *
 * VINCOLI (decisione del fondatore): nessun claim di primato assoluto, solo
 * formule di identità; nessun dato societario finché la società non esiste;
 * nessun numero inventato; per il team nessun nome, foto o riferimento
 * personale/geografico — racconto collettivo.
 */

const PROBLEMA = [
  {
    t: "Tempi",
    d: "Settimane per un preventivo, mesi per un documento: quando arriva, la gara è chiusa o la banca ha già deciso.",
  },
  {
    t: "Costi",
    d: "Parcelle costruite sulle ore di un professionista, non sul valore del documento: migliaia di euro per output standardizzati.",
  },
  {
    t: "Imprese escluse",
    d: "Chi sta sotto una certa soglia di fatturato resta fuori: non perché non serva, ma perché non conviene a chi vende consulenza a ore.",
  },
];

const MOTORE_PASSI = [
  {
    icon: ClipboardList,
    t: "Raccolta documentale guidata",
    d: "Per ogni percorso il Motore indica la lista precisa dei documenti che servono — non «carica quello che vuoi» — e segnala cosa manca.",
  },
  {
    icon: FileSearch,
    t: "Lettura e struttura",
    d: "Estrae i dati da bollette, visure, bilanci e registri, li normalizza e li etichetta per qualità: misurato, da documento, stimato.",
  },
  {
    icon: Database,
    t: "Incrocio con le banche dati",
    d: "Collega i dati alle fonti camerali ed energetiche ufficiali: anagrafica, ATECO, addetti, consumi. Mai chiederti ciò che una fonte pubblica sa già.",
  },
  {
    icon: BadgeCheck,
    t: "Generazione conforme",
    d: "Costruisce i documenti sulla struttura della norma di riferimento, con ogni valore tracciabile alla sua fonte.",
  },
  {
    icon: UserCheck,
    t: "Verifica umana",
    d: "Un professionista valida prima dell'emissione. La responsabilità resta di una persona, con nome e cognome dentro la piattaforma.",
  },
];

const PRINCIPI = [
  {
    icon: BookMarked,
    title: "Solo standard ufficiali",
    desc: SOLO_STANDARD_UFFICIALI,
  },
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
];

export default function ChiSiamoPage() {
  return (
    <main>
      {/* 1. LA MISSIONE — apertura editoriale con foto a lato */}
      <section className="bg-gradient-to-b from-moss via-moss to-paper px-5 py-16 md:py-20">
        <div className="mx-auto grid max-w-5xl grid-cols-1 items-center gap-10 md:grid-cols-[1.15fr_1fr]">
          <div>
            <p className="mb-4 text-xs font-semibold tracking-widest text-pine">
              CHI SIAMO
            </p>
            <h1 className="font-display text-4xl leading-[1.05] text-pine-dark md:text-6xl">
              Abbattere tempi e costi del sistema consulenziale italiano, un
              settore alla volta.
            </h1>
            <p className="mt-6 font-display text-2xl text-pine">
              L&apos;AI è il motore di tutto.
            </p>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-gray-warm">
              La consulenza tradizionale è lenta e costosa. Il risultato è che
              chi più avrebbe bisogno di qualificarsi — verso banche, clienti
              capofiliera, stazioni appaltanti — resta fuori. Abbiamo scelto di
              partire da lì.
            </p>
          </div>
          <PhotoDuotone
            src="/photos/sito1.jpg"
            className="aspect-[4/3] rounded-3xl shadow-lift md:aspect-[4/5]"
          />
        </div>
      </section>

      {/* 2. IL PROBLEMA — tre colonne su bianco */}
      <section className="bg-white px-5 py-16">
        <div className="mx-auto max-w-4xl">
          <h2 className="font-display text-3xl text-ink md:text-4xl">
            Che cosa non funziona, oggi
          </h2>
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-3">
            {PROBLEMA.map((p) => (
              <div key={p.t} className="vz-reveal">
                <p className="font-display text-xl text-pine">{p.t}</p>
                <p className="mt-2 text-sm leading-relaxed text-gray-warm">
                  {p.d}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. IL MOTORE VER0 — fondo scuro istituzionale, cinque passi */}
      <section className="relative overflow-hidden bg-pine-deep px-5 py-20">
        <span
          aria-hidden
          className="pointer-events-none absolute -right-24 top-10 h-80 w-80 rounded-full bg-mint-bright/10 blur-3xl"
        />
        <div className="relative mx-auto max-w-4xl">
          <div className="text-center">
            <p className="mb-3 text-xs font-semibold tracking-widest text-mint-bright">
              IL NOSTRO MOTORE
            </p>
            <h2 className="font-display text-4xl text-white md:text-5xl">
              Come lavora il Motore Ver0
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-moss">
              Abbiamo costruito il Motore Ver0 per unire la potenza dell&apos;AI
              alle competenze di professionisti veri. Non è un&apos;AI generica:
              è un motore proprietario specializzato nei documenti e nei settori
              d&apos;impresa, e lavora sempre in questo ordine.
            </p>
          </div>

          <ol className="mt-12 space-y-3">
            {MOTORE_PASSI.map((m, i) => {
              const Icon = m.icon;
              return (
                <li
                  key={m.t}
                  className="vz-reveal flex items-start gap-4 rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm"
                >
                  <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-mint-bright/15 text-mint-bright">
                    <Icon size={20} />
                  </span>
                  <div className="min-w-0">
                    <p className="font-display text-lg text-white">
                      <span className="mr-2 text-mint-bright">{i + 1}.</span>
                      {m.t}
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-moss">
                      {m.d}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      {/* 4. LE PERSONE — racconto collettivo con foto */}
      <section className="bg-white px-5 py-20">
        <div className="mx-auto grid max-w-5xl grid-cols-1 items-center gap-10 md:grid-cols-2">
          <PhotoDuotone
            src="/photos/sito2.jpg"
            intensity="soft"
            className="vz-reveal order-2 aspect-[4/3] rounded-2xl shadow-lift md:order-1"
          />
          <div className="order-1 md:order-2">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-moss text-pine">
              <Users size={22} />
            </span>
            <h2 className="mt-4 font-display text-4xl text-ink md:text-5xl">
              Le persone
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-gray-warm">
              Dietro lo schermo: ingegneri, analisti ed esperti di settore con
              esperienza pluriennale. Ogni documento passa da una verifica umana
              prima di arrivare a te, e chi valida ci mette il nome — dentro la
              piattaforma, dove conta.
            </p>
            <p className="mt-5 font-display text-2xl text-pine-dark">
              <em className="font-semibold text-mint">Zero</em> protagonismo: il
              team resta dietro lo schermo, i risultati davanti.
            </p>
          </div>
        </div>
      </section>

      {/* 5. I PRINCIPI — quattro card su salvia */}
      <section className="bg-gradient-to-b from-paper via-moss to-moss px-5 py-20">
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
                  className="vz-reveal rounded-2xl bg-white p-5 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-lift"
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

      {/* 6. IL METODO SI DIMOSTRA — registro scuro istituzionale con foto in
          filigrana e sigillo tono-su-tono */}
      <section className="relative overflow-hidden bg-pine-deep px-5 py-20 text-center">
        <PhotoDuotone
          src="/photos/sito4.jpg"
          className="absolute inset-0 opacity-15"
        />
        <div aria-hidden className="absolute inset-0 bg-pine-deep/70" />
        <div className="relative mx-auto max-w-2xl">
          <div className="mb-6 flex justify-center">
            <Sigillo tone="dark" className="h-24 w-24" />
          </div>
          <h2 className="font-display text-4xl text-white md:text-5xl">
            Il metodo non si racconta. Si dimostra.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-moss">
            Per questo esiste il Sigillo Ver0: criteri pubblici, dati
            verificati, millesimo che ogni anno va riconquistato. Ciò che
            promettiamo qui, lì diventa controllabile da chiunque.
          </p>
          <div className="mt-6 flex justify-center">
            <Link
              href="/sigillo"
              className="inline-flex items-center gap-1.5 rounded-lg bg-white px-5 py-2.5 text-sm font-medium text-pine shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-lift"
            >
              Scopri il Sigillo <ArrowRight size={15} />
            </Link>
          </div>
          <p className="mx-auto mt-10 max-w-xl border-t border-white/15 pt-8 font-display text-xl leading-relaxed text-moss md:text-2xl">
            Ci chiamiamo Ver0 per un principio solo, lo Zero, che torna in ogni
            promessa. Lo Zero, da noi, non è il niente — è il traguardo.
          </p>
        </div>
      </section>
    </main>
  );
}
