import Link from "next/link";
import {
  Leaf,
  Scale,
  Users,
  Landmark,
  CircleCheck,
  Upload,
  Sparkles,
  FileCheck2,
  FileSearch,
  Database,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";

import { Sigillo } from "@/components/brand/sigillo";
import { CatalogoVetrina } from "@/components/catalogo-vetrina";

/**
 * Home del sito pubblico. Comunicazione secondo "Il sistema dello Zero"
 * (ver0-sistema-dello-zero.md): dominante di pagina "zero effort", claim di
 * firma invariato, lo Zero come principio unico (mai "zeri"). Ogni promessa è
 * verificabile — mai iperboli.
 *
 * Art direction: il "0" del logotipo come motivo ricorrente (filigrana, anello
 * punteggiato, foglia della sola sostenibilità), profondità con ombre morbide,
 * tipografia Fraunces più decisa con le parole-zero in corsivo, ritmo di fondi
 * alternati e reveal allo scroll in puro CSS (globals.css). Mobile-first.
 */

/* --- Elementi decorativi (aria-hidden, puramente grafici) --- */

function ZeroWatermark({
  className = "",
  tone = "pine",
}: {
  className?: string;
  tone?: "pine" | "light";
}) {
  const color = tone === "light" ? "text-white/[0.06]" : "text-pine/[0.05]";
  return (
    <span
      aria-hidden
      className={`pointer-events-none absolute select-none font-display leading-none ${color} ${className}`}
    >
      0
    </span>
  );
}

function DottedRing({ className = "" }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={`pointer-events-none absolute rounded-full border-2 border-dotted ${className}`}
    />
  );
}

/* --- Dati di pagina --- */

const AMBITI = [
  {
    icon: Leaf,
    title: "Sostenibilità",
    desc: "Carbon footprint, bilancio VSME, economia circolare: i documenti che banche e clienti ti chiedono, verificabili da chiunque.",
    leaf: true,
  },
  {
    icon: Scale,
    title: "Sistemi di gestione",
    desc: "Manuali e procedure ISO e parità di genere, generati sui tuoi dati e pronti per l'audit di un ente accreditato.",
  },
  {
    icon: Users,
    title: "Consulenza",
    desc: "Dietro lo schermo, consulenti veri: specialisti prenotabili nei corner da 30 o 60 minuti, verifica umana su ogni documento, supporto continuo.",
  },
];

// Lo Zero, principio unico, declinato sezione per sezione (una selezione).
const ZERI = [
  {
    accent: "Zero",
    tail: "effort",
    m: "Mai un dato che sappiamo già: il Motore Ver0 fa il lavoro pesante, tu confermi.",
  },
  {
    accent: "Zero",
    tail: "sorprese",
    m: "Prezzi pubblici, nessun preventivo da chiedere.",
  },
  {
    accent: "Zero",
    tail: "domande inutili",
    m: "La visura l'abbiamo già letta noi.",
  },
  {
    accent: "Zero",
    tail: "blocchi",
    m: "Se un dato non ce l'hai, lo stimiamo insieme e lo dichiariamo.",
  },
  {
    accent: "Zero",
    tail: "scorciatoie",
    m: "Il Sigillo non si compra, si dimostra. Ogni anno.",
  },
  {
    accent: "Verso zero",
    tail: "emissioni",
    m: "L'impronta della tua impresa: misurata, ridotta, dimostrata.",
    leaf: true,
  },
];

const MAGIA = [
  {
    icon: Upload,
    title: "Porti quello che hai",
    desc: "Bollette, visure, organigrammi, i report che hai già. Un PDF o una foto.",
  },
  {
    icon: Sparkles,
    title: "Il Motore legge e incrocia",
    desc: "Estrae i dati dai tuoi documenti e li incrocia con le banche dati camerali ed energetiche.",
  },
  {
    icon: FileCheck2,
    title: "Genera i documenti conformi, tu confermi",
    desc: "Documenti che seguono la norma di riferimento; tu controlli, correggi, confermi. E restano aggiornati nel tempo.",
  },
];

const ESEMPI = [
  "Bollette → carbon footprint",
  "Visura e organigramma → Manuale ISO 9001",
  "I documenti che hai già → continuità",
];

// Le tre capacità del Motore Ver0 — innovazione concreta, non "AI" generica.
const MOTORE = [
  {
    icon: FileSearch,
    title: "Lettura intelligente dei documenti",
    desc: "Estrae i dati da bollette, visure, fatture e report — qualunque formato, anche una foto — e li struttura al posto tuo.",
  },
  {
    icon: Database,
    title: "Incrocio con le banche dati ufficiali",
    desc: "Collega i tuoi dati alle fonti camerali ed energetiche: anagrafica, ATECO, addetti, consumi. Mai chiederti ciò che una fonte ufficiale sa già.",
  },
  {
    icon: ShieldCheck,
    title: "Generazione conforme, con verifica umana",
    desc: "Produce documenti secondo la struttura della norma di riferimento; il team tecnico li valida prima dell'emissione e li tiene aggiornati.",
  },
];

const PILASTRI = [
  "Prezzi in chiaro, sotto la media di mercato",
  "Effort minimo: mai un dato che sappiamo già",
  "Qualifica verificabile da chiunque",
];

export default function HomePage() {
  return (
    <>
      {/* HERO — fondo salvia, dominante "zero effort", CTA singola */}
      <section className="relative overflow-hidden bg-gradient-to-b from-moss via-moss to-paper px-5 py-16 text-center">
        <ZeroWatermark
          tone="pine"
          className="-right-10 -top-16 text-[22rem] md:text-[30rem]"
        />
        <DottedRing className="-left-16 top-24 h-56 w-56 border-mint/20" />

        <div className="relative mx-auto max-w-2xl">
          <p className="mb-4 text-xs font-semibold tracking-widest text-pine">
            SOSTENIBILITÀ · SISTEMI DI GESTIONE · CONSULENZA
          </p>
          <h1 className="font-display text-4xl leading-[1.1] text-pine-dark md:text-6xl">
            I tuoi consulenti in cloud. La crescita della tua azienda, in
            abbonamento.
          </h1>
          <p className="mx-auto mt-6 max-w-xl font-display text-xl text-pine md:text-2xl">
            La consulenza con <em className="text-pine-dark">zero</em> effort:
            mai un dato che sappiamo già.
          </p>
          <p className="mx-auto mt-3 max-w-lg text-sm text-gray-warm">
            Il Motore Ver0 fa il lavoro pesante, le persone verificano, tu
            raccogli il risultato — a una frazione del prezzo della consulenza
            tradizionale.
          </p>

          <div className="mt-7 flex justify-center">
            <Link
              href="/servizi"
              className="rounded-lg bg-pine px-6 py-3 text-sm font-medium text-white shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-lift"
            >
              Scopri cosa possiamo fare per te
            </Link>
          </div>

          <ul className="mt-6 flex flex-wrap justify-center gap-x-5 gap-y-1 text-xs text-pine">
            {PILASTRI.map((p) => (
              <li key={p} className="flex items-center gap-1.5">
                <CircleCheck size={14} className="shrink-0 text-mint" />
                {p}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* AMBITI — fondo bianco */}
      <section id="ambiti" className="bg-white px-5 py-14">
        <div className="mx-auto grid max-w-4xl grid-cols-1 gap-4 sm:grid-cols-3">
          {AMBITI.map((a) => {
            const Icon = a.icon;
            return (
              <article
                key={a.title}
                className="vz-reveal group rounded-2xl border border-line/70 bg-white p-5 text-center shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-lift"
              >
                <span className="relative inline-flex h-12 w-12 items-center justify-center rounded-full bg-moss text-pine">
                  <Icon size={20} />
                  {a.leaf && (
                    <Leaf
                      size={12}
                      aria-hidden
                      className="absolute -right-1 -top-1 text-mint"
                    />
                  )}
                </span>
                <p className="mt-3 text-sm font-semibold text-ink">{a.title}</p>
                <p className="mt-1.5 text-xs leading-relaxed text-gray-warm">
                  {a.desc}
                </p>
              </article>
            );
          })}
        </div>
      </section>

      {/* LO ZERO DI VER0 — fondo salvia, sezione firma */}
      <section className="relative overflow-hidden bg-gradient-to-b from-paper via-moss to-moss px-5 py-16">
        <ZeroWatermark
          tone="pine"
          className="-bottom-24 -left-10 text-[26rem]"
        />
        <div className="relative mx-auto max-w-4xl">
          <div className="text-center">
            <h2 className="font-display text-3xl text-ink md:text-4xl">
              Lo <em className="text-pine">Zero</em> di Ver0
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm text-gray-warm">
              Il nome è una promessa, un principio solo declinato sezione per
              sezione. Ogni volta che lo incontri, lo Zero regge la domanda
              «dimostramelo»: nessuna iperbole, solo cose che puoi verificare.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {ZERI.map((z) => (
              <article
                key={z.tail}
                className="vz-reveal relative overflow-hidden rounded-2xl bg-white p-5 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-lift"
              >
                <span
                  aria-hidden
                  className="pointer-events-none absolute -right-3 -top-5 select-none font-display text-7xl leading-none text-moss"
                >
                  0
                </span>
                <div className="relative">
                  <h3 className="font-display text-xl text-ink">
                    <em className="text-pine">{z.accent}</em> {z.tail}
                    {z.leaf && (
                      <Leaf
                        size={15}
                        aria-hidden
                        className="ml-1.5 inline text-mint"
                      />
                    )}
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-gray-warm">
                    {z.m}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* LA MAGIA — fondo pino scuro, "porta quello che hai", tre battute */}
      <section className="relative overflow-hidden bg-pine-dark px-5 py-16">
        <ZeroWatermark
          tone="light"
          className="-right-8 top-1/2 -translate-y-1/2 text-[24rem]"
        />
        <div className="relative mx-auto max-w-4xl">
          <div className="text-center">
            <p className="mb-3 text-xs font-semibold tracking-widest text-mint">
              LA MAGIA, IN TRE MOSSE
            </p>
            <h2 className="font-display text-3xl text-white md:text-4xl">
              Fai una cosa sola: porti quello che hai.
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm text-moss">
              Nessun modulo da imparare, nessun questionario infinito. Il Motore
              Ver0 legge i tuoi documenti, li incrocia con le banche dati
              ufficiali e genera i documenti conformi — e li tiene aggiornati.
              Tu hai sempre l&apos;ultima parola.
            </p>
          </div>

          <ol className="vz-reveal mt-12 grid grid-cols-1 gap-8 sm:grid-cols-3">
            {MAGIA.map((m, i) => {
              const Icon = m.icon;
              return (
                <li
                  key={m.title}
                  className="vz-magia-step relative flex flex-col items-center text-center"
                >
                  {i < MAGIA.length - 1 && (
                    <span
                      aria-hidden
                      className="vz-magia-flow absolute left-1/2 top-7 hidden h-px w-full bg-gradient-to-r from-mint/60 via-mint/20 to-mint/60 sm:block"
                    />
                  )}
                  <span className="vz-magia-badge relative z-10 inline-flex h-14 w-14 items-center justify-center rounded-full border border-mint/40 bg-pine text-mint">
                    <Icon size={22} />
                  </span>
                  <p className="mt-4 font-display text-lg text-white">
                    {m.title}
                  </p>
                  <p className="mt-1.5 max-w-[15rem] text-sm text-moss">
                    {m.desc}
                  </p>
                </li>
              );
            })}
          </ol>

          {/* Esempi multipli: porta quello che hai, non solo la bolletta */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-2">
            <span className="text-xs uppercase tracking-widest text-mint">
              Per esempio
            </span>
            {ESEMPI.map((e) => (
              <span
                key={e}
                className="rounded-full border border-mint/30 bg-white/10 px-3.5 py-1.5 text-xs text-moss"
              >
                {e}
              </span>
            ))}
          </div>

          <p className="mt-8 text-center text-xs text-moss/80">
            Le elaborazioni del Motore Ver0 sono sempre dichiarate; le verifiche
            umane portano il nome di chi le ha fatte. Nessun dato entra nei
            report senza la tua conferma.
          </p>
        </div>
      </section>

      {/* IL MOTORE VER0 — vetrina del motore proprietario, fondo salvia */}
      <section className="relative overflow-hidden bg-gradient-to-b from-moss to-paper px-5 py-16">
        <ZeroWatermark tone="pine" className="-right-12 -bottom-20 text-[24rem]" />
        <div className="relative mx-auto max-w-4xl">
          <div className="text-center">
            <p className="mb-3 text-xs font-semibold tracking-widest text-pine">
              IL NOSTRO MOTORE
            </p>
            <h2 className="font-display text-3xl text-ink md:text-4xl">
              Il Motore Ver0
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm text-gray-warm">
              Un motore specializzato nei documenti d&apos;impresa: addestrato su
              bollette, visure, bilanci e manuali — non un motore qualunque.
              Legge, incrocia le fonti ufficiali, genera. Le persone verificano.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {MOTORE.map((c) => {
              const Icon = c.icon;
              return (
                <article
                  key={c.title}
                  className="vz-reveal rounded-2xl border border-line/70 bg-white p-5 shadow-soft"
                >
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-moss text-pine">
                    <Icon size={20} />
                  </span>
                  <p className="mt-3 text-sm font-semibold text-ink">
                    {c.title}
                  </p>
                  <p className="mt-1.5 text-xs leading-relaxed text-gray-warm">
                    {c.desc}
                  </p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* SERVIZI E PREZZI — fondo bianco, dominante soft "zero sorprese" */}
      <section id="servizi" className="bg-white px-5 py-16">
        <div className="mx-auto max-w-4xl">
          <div className="text-center">
            <h2 className="font-display text-3xl text-ink md:text-4xl">
              Servizi e prezzi, in chiaro
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm text-gray-warm">
              <em className="font-display text-base not-italic text-pine">
                Zero sorprese
              </em>
              : prezzi pubblici, nessun preventivo da chiedere. Attivi quello che
              ti serve, quando ti serve.
            </p>
          </div>

          <div className="mt-10">
            <CatalogoVetrina />
          </div>
          <p className="mt-4 text-center text-xs text-gray-warm">
            Prezzi &quot;da&quot; riferiti alla fascia micro, IVA esclusa · il
            prezzo per la tua dimensione si compone nella pagina del servizio ·
            −10% con pagamento annuale
          </p>
        </div>
      </section>

      {/* OSSERVATORIO BANDI — pannello informativo secondario, nessuna promessa */}
      <section className="bg-white px-5 pb-14">
        <div className="mx-auto flex max-w-3xl items-start gap-4 rounded-2xl border border-line/70 bg-paper p-5">
          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-moss text-pine">
            <Landmark size={19} />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-ink">Osservatorio bandi</p>
            <p className="mt-1 text-sm text-gray-warm">
              Ti segnaliamo i fondi che possono coprire i tuoi percorsi: bandi e
              incentivi filtrati sul profilo della tua impresa, con le scadenze
              in chiaro.
            </p>
            <p className="mt-1.5 text-xs text-gray-light">
              Fanno fede i documenti ufficiali degli enti: nessuna promessa di
              ammissione o esito.
            </p>
          </div>
        </div>
      </section>

      {/* SIGILLO — teaser su salvia, dominante soft "zero scorciatoie" */}
      <section id="sigillo" className="bg-moss px-5 py-14">
        <Link
          href="/sigillo"
          className="group mx-auto flex max-w-3xl items-center gap-5 rounded-2xl bg-white p-5 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-lift"
        >
          <Sigillo className="h-20 w-20 shrink-0" />
          <div className="min-w-0">
            <h3 className="font-display text-xl text-ink">
              <em className="text-pine">Zero</em> scorciatoie: il Sigillo non si
              compra, si dimostra.
            </h3>
            <p className="mt-1 text-sm text-gray-warm">
              Criteri pubblici, dati verificati, QR di controllo. Millesimato:
              ogni anno va riconquistato.
            </p>
            <span className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-pine">
              Scopri il Sigillo{" "}
              <ArrowRight
                size={14}
                className="transition-transform group-hover:translate-x-0.5"
              />
            </span>
          </div>
        </Link>
      </section>

      {/* MANIFESTO DELLO ZERO — chiusura su pino scuro */}
      <section className="relative overflow-hidden bg-pine-dark px-5 py-20 text-center">
        <ZeroWatermark
          tone="light"
          className="left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-[30rem]"
        />
        <DottedRing className="left-1/2 top-14 h-40 w-40 -translate-x-1/2 border-mint/25" />
        <div className="relative mx-auto max-w-2xl">
          <div className="mb-6 flex justify-center">
            <Sigillo tone="dark" className="h-24 w-24" />
          </div>
          <p className="font-display text-2xl leading-relaxed text-white md:text-3xl">
            Ci chiamiamo Ver0 per un principio solo, lo Zero, che torna in ogni
            promessa: <em className="text-mint">zero</em> effort,{" "}
            <em className="text-mint">zero</em> domande inutili,{" "}
            <em className="text-mint">zero</em> sorprese sul prezzo,{" "}
            <em className="text-mint">zero</em> scorciatoie sul Sigillo. E per la
            direzione di marcia: <em className="text-mint">verso zero</em>{" "}
            sprechi, <em className="text-mint">verso zero</em> emissioni.
          </p>
          <p className="mt-6 font-display text-xl text-moss md:text-2xl">
            Lo Zero, da noi, non è il niente — è il traguardo.
          </p>
          <div className="mt-8 flex justify-center">
            <Link
              href="/servizi"
              className="inline-flex items-center gap-1.5 rounded-lg bg-white px-5 py-2.5 text-sm font-medium text-pine shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-lift"
            >
              Inizia dal Percorso Ver0 <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
