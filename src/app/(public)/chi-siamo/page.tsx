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
  Gauge,
  Globe,
  ShieldCheck,
  Tag,
  UserCheck,
  Users,
} from "lucide-react";

import { Sigillo } from "@/components/brand/sigillo";
import { JsonLd } from "@/components/json-ld";
import { MotoreScrolly } from "@/components/motore-scrolly";
import { PhotoDuotone } from "@/components/photo-duotone";
import { SOLO_STANDARD_UFFICIALI } from "@/lib/catalog";
import { jsonLdBreadcrumb, metadataPagina } from "@/lib/seo";

export const metadata: Metadata = metadataPagina({
  title: "Chi siamo: siamo partiti da zero, letteralmente",
  description:
    "Abbiamo ricostruito la consulenza: un motore che lavora sui documenti, professionisti che verificano, standard ufficiali e prezzi leggibili prima di firmare.",
  path: "/chi-siamo",
});

/**
 * Chi siamo — Registro A pieno: tipografia drammatica, foto duotone, fondi
 * alternati (salvia / bianco / pino profondo), reveal allo scroll.
 *
 * REGOLA DI TONO (vincolante, decisione del fondatore): la pagina è sempre
 * propositiva. Non si apre mai dal problema, non esistono sezioni negative e
 * non si generalizza mai in negativo sulla categoria dei consulenti: sono
 * partner del modello (v. programma partner), non un bersaglio.
 *
 * Varianti di apertura considerate (scelta: la prima, la più concreta —
 * mette il beneficio del cliente in testa e chiude sull'apertura a tutti):
 * 1. "La qualifica della tua impresa, alla velocità della tua impresa."
 * 2. "La qualifica che la tua impresa merita, nei tempi che la tua impresa ha."
 * 3. "Rendiamo la qualifica d'impresa una cosa che si fa, non una cosa che si aspetta."
 *
 * ALTRI VINCOLI: nessun claim di primato assoluto, solo formule di identità;
 * nessun dato societario finché la società non esiste; nessun numero
 * inventato; per il team nessun nome, foto o riferimento personale.
 */

const POSSIBILE = [
  {
    icon: Gauge,
    t: "Giorni, non mesi",
    d: "Documenti conformi pronti in pochi giorni e aggiornati in tempo reale quando cambia una norma: la qualifica cammina alla velocità con cui decidi.",
  },
  {
    icon: Tag,
    t: "Il prezzo del valore",
    d: "Prezzi pubblici costruiti sul risultato che ricevi, visibili prima di iniziare: sai esattamente cosa spendi e cosa ottieni, dal primo minuto.",
  },
  {
    icon: Users,
    t: "Per ogni impresa",
    d: "Dalla micro alla grande: percorsi e fasce di prezzo pensati perché la qualifica sia alla portata di chi finora ne restava fuori.",
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
      <JsonLd
        dati={jsonLdBreadcrumb([
          { nome: "Home", path: "/" },
          { nome: "Chi siamo", path: "/chi-siamo" },
        ])}
      />
      {/* 1. APERTURA — primissimo contenuto: l'origine raccontata in chiave
          Zero. Registro A pieno: Fraunces grande, salvia in gradiente, foto
          duotone affiancata, reveal discreto. */}
      <section className="bg-gradient-to-b from-moss via-moss to-paper px-5 py-16 md:py-24">
        <div className="mx-auto grid max-w-5xl grid-cols-1 items-center gap-10 md:grid-cols-[1.15fr_1fr]">
          <div className="vz-reveal">
            <p className="mb-4 text-xs font-semibold tracking-widest text-pine">
              CHI SIAMO
            </p>
            <h1 className="font-display text-5xl leading-[1.02] text-pine-dark md:text-7xl">
              Siamo partiti da{" "}
              <em className="font-semibold text-mint">zero</em>. Letteralmente.
            </h1>
            <p className="mt-7 max-w-xl font-display text-xl leading-snug text-pine md:text-2xl">
              E da zero abbiamo ricostruito la consulenza: un motore AI,
              professionisti veri, standard ufficiali, prezzi che si leggono
              prima di firmare.
            </p>
          </div>
          {/* Foto: la più luminosa e propositiva del set (natura + dati).
              Per sostituirla basta cambiare il file mantenendo il path. */}
          <PhotoDuotone
            src="/photos/sito3.jpg"
            alt="Natura e dati insieme: l'immagine che apre il racconto di come è nata Ver0."
            intensity="soft"
            priority
            className="vz-reveal aspect-[4/3] rounded-3xl shadow-lift md:aspect-[4/5]"
          />
        </div>
      </section>

      {/* 2. LA PROMESSA — il manifesto che apriva la pagina, ora sotto
          l'origine: stesso tono propositivo, senza foto per non ripetere
          l'impaginato dell'hero. */}
      <section className="bg-paper px-5 py-16">
        <div className="mx-auto max-w-3xl">
          <h2 className="font-display text-4xl leading-[1.08] text-pine-dark md:text-5xl">
            La qualifica della tua impresa, alla velocità della tua impresa.
          </h2>
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-pine md:text-lg">
            Abbiamo costruito la consulenza che avremmo voluto trovare: chiara
            nei prezzi, rapida nei tempi, aperta a ogni azienda — dalla micro
            alla grande.
          </p>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-gray-warm">
            Un motore proprietario che lavora sui documenti d&apos;impresa,
            professionisti che verificano ogni output, standard ufficiali come
            unico riferimento. È così che una qualifica diventa una cosa che si
            fa — e si dimostra.
          </p>
        </div>
      </section>

      {/* 2. CHE COSA RENDIAMO POSSIBILE — tre card propositive */}
      <section className="bg-white px-5 py-16">
        <div className="mx-auto max-w-4xl">
          <h2 className="font-display text-3xl text-ink md:text-4xl">
            Che cosa rendiamo possibile
          </h2>
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {POSSIBILE.map((p) => {
              const Icon = p.icon;
              return (
                <article
                  key={p.t}
                  className="vz-reveal rounded-2xl border border-line/70 bg-white p-5 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-lift"
                >
                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-moss text-pine">
                    <Icon size={20} />
                  </span>
                  <p className="mt-3 font-display text-xl text-pine">{p.t}</p>
                  <p className="mt-2 text-sm leading-relaxed text-gray-warm">
                    {p.d}
                  </p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* 3. IL MOTORE VER0 — sezione narrativa con scrollytelling:
          il palco resta fermo, le cinque fasi si avvicendano. */}
      <MotoreScrolly />


      {/* 4. LE PERSONE — racconto collettivo con foto */}
      <section className="bg-white px-5 py-16 md:py-24">
        <div className="mx-auto grid max-w-5xl grid-cols-1 items-center gap-10 md:grid-cols-2">
          <PhotoDuotone
            src="/photos/sito2.jpg"
            alt="Il lavoro dietro lo schermo: ingegneri e analisti che validano i documenti prima della consegna."
            intensity="soft"
            className="vz-reveal order-2 aspect-[4/3] rounded-2xl shadow-lift md:order-1"
          />
          <div className="order-1 md:order-2">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-moss text-pine">
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
      <section className="bg-gradient-to-b from-paper via-moss to-moss px-5 py-16 md:py-24">
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
                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-moss text-pine">
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
      <section className="relative overflow-hidden bg-pine-deep px-5 py-16 md:py-24 text-center">
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
