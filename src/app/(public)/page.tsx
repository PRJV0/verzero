import Link from "next/link";
import {
  Leaf,
  Scale,
  Users,
  Landmark,
  CircleCheck,
  Upload,
  FileCheck2,
  FileSearch,
  Database,
  ShieldCheck,
  ArrowRight,
  CalendarDays,
  UserCheck,
  LifeBuoy,
} from "lucide-react";

import { Sigillo } from "@/components/brand/sigillo";
import { CatalogoVetrina } from "@/components/catalogo-vetrina";
import { PhotoDuotone } from "@/components/photo-duotone";

/**
 * Home del sito pubblico — direzione grafica a tre registri (SPEC §12.W):
 * - Registro A "editoriale vivo": impianto generale — gerarchia Fraunces
 *   drammatica, parole-Zero in corsivo menta, foto duotone verde.
 * - Registro B "tech botanico": SOLO la macro-sezione del Motore Ver0 —
 *   pino scuro, bagliori menta, flusso animato, card in vetro.
 * - Registro C "carta e timbro": SOLO il teaser del Sigillo (momento di
 *   fiducia) — crema caldo, sigillo timbrato, un accento terracotta.
 * I registri speciali non convivono mai nella stessa schermata.
 *
 * Copy secondo "Il sistema dello Zero": dominante "zero effort", claim di
 * firma invariato, promesse verificabili — mai iperboli.
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

/** Parola-Zero: accento ricorrente del Registro A (corsivo menta). */
function ZeroWord({
  children,
  tone = "light",
}: {
  children: React.ReactNode;
  tone?: "light" | "dark";
}) {
  return (
    <em
      className={
        "font-display font-semibold " +
        (tone === "dark" ? "text-mint-bright" : "text-mint")
      }
    >
      {children}
    </em>
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

const CONSULENZA_PUNTI = [
  {
    icon: CalendarDays,
    t: "Corner da 30 o 60 minuti",
    d: "Prenoti uno specialista sulla tua pratica, quando serve a te.",
  },
  {
    icon: UserCheck,
    t: "Verifica umana su ogni documento",
    d: "Le validazioni portano il nome di chi le ha fatte.",
  },
  {
    icon: LifeBuoy,
    t: "Supporto continuo",
    d: "Se ti fermi, ci accorgiamo noi: nessuna pratica resta bloccata.",
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

const FLUSSO = [
  {
    icon: Upload,
    title: "Porti quello che hai",
    desc: "Bollette, visure, organigrammi, i report che hai già. Un PDF o una foto.",
  },
  {
    // Il nodo centrale è il Motore: reso a parte con lo zero E1 e il bagliore.
    icon: null,
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
      {/* HERO — Registro A: fondo salvia, dominante "zero effort", CTA singola */}
      <section className="relative overflow-hidden bg-gradient-to-b from-moss via-moss to-paper px-5 py-16 text-center">
        <ZeroWatermark
          tone="pine"
          className="-right-10 -top-16 text-[22rem] md:text-[32rem]"
        />
        <DottedRing className="-left-16 top-24 h-56 w-56 border-mint/20" />

        <div className="relative mx-auto max-w-3xl">
          <p className="mb-5 text-xs font-semibold tracking-widest text-pine">
            SOSTENIBILITÀ · SISTEMI DI GESTIONE · CONSULENZA
          </p>
          <h1 className="font-display text-5xl leading-[1.05] text-pine-dark md:text-7xl">
            I tuoi consulenti in cloud. La crescita della tua azienda, in
            abbonamento.
          </h1>
          <p className="mx-auto mt-7 max-w-xl font-display text-2xl text-pine md:text-3xl">
            La consulenza con <ZeroWord>zero</ZeroWord> effort: mai un dato che
            sappiamo già.
          </p>
          <p className="mx-auto mt-3 max-w-lg text-sm text-gray-warm">
            Il Motore Ver0 fa il lavoro pesante, le persone verificano, tu
            raccogli il risultato — a una frazione del prezzo della consulenza
            tradizionale.
          </p>

          <div className="mt-8 flex justify-center">
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

          {/* SLOT FOTO 1 — vicino all'hero (Registro A, duotone) */}
          <PhotoDuotone
            src="/img/placeholder-impresa.svg"
            className="vz-reveal mx-auto mt-12 aspect-[21/9] max-w-4xl rounded-2xl shadow-lift"
          />
        </div>
      </section>

      {/* AMBITI — Registro A, fondo bianco */}
      <section id="ambiti" className="bg-white px-5 py-16">
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

      {/* LO ZERO DI VER0 — Registro A, fondo salvia, sezione firma */}
      <section className="relative overflow-hidden bg-gradient-to-b from-paper via-moss to-moss px-5 py-20">
        <ZeroWatermark tone="pine" className="-bottom-24 -left-10 text-[26rem]" />
        <div className="relative mx-auto max-w-4xl">
          <div className="text-center">
            <h2 className="font-display text-4xl text-ink md:text-5xl">
              Lo <ZeroWord>Zero</ZeroWord> di Ver0
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-sm text-gray-warm">
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
                    <ZeroWord>{z.accent}</ZeroWord> {z.tail}
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

      {/* CONSULENZA — Registro A editoriale, foto duotone (SLOT FOTO 2) */}
      <section className="bg-white px-5 py-20">
        <div className="mx-auto grid max-w-4xl grid-cols-1 items-center gap-10 md:grid-cols-2">
          <PhotoDuotone
            src="/img/placeholder-consulenza.svg"
            className="vz-reveal aspect-[4/3] rounded-2xl shadow-lift"
          />
          <div>
            <p className="mb-3 text-xs font-semibold tracking-widest text-pine">
              CONSULENZA
            </p>
            <h2 className="font-display text-4xl text-ink md:text-5xl">
              Dietro lo schermo, consulenti veri.
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-gray-warm">
              La piattaforma corre, ma la responsabilità resta di persone con
              nome e cognome. Sai sempre chi ha verificato cosa.
            </p>
            <ul className="mt-6 space-y-4">
              {CONSULENZA_PUNTI.map((p) => {
                const Icon = p.icon;
                return (
                  <li key={p.t} className="flex items-start gap-3">
                    <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-moss text-pine">
                      <Icon size={17} />
                    </span>
                    <span>
                      <span className="block text-sm font-semibold text-ink">
                        {p.t}
                      </span>
                      <span className="block text-xs text-gray-warm">
                        {p.d}
                      </span>
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </section>

      {/* IL MOTORE VER0 — Registro B "tech botanico": unica sezione speciale
          della schermata — pino scuro, bagliori menta, flusso animato, vetro */}
      <section className="relative overflow-hidden bg-pine-dark px-5 py-20">
        {/* Bagliori menta */}
        <span
          aria-hidden
          className="pointer-events-none absolute -left-24 top-10 h-80 w-80 rounded-full bg-mint-bright/15 blur-3xl"
        />
        <span
          aria-hidden
          className="pointer-events-none absolute -right-28 bottom-0 h-96 w-96 rounded-full bg-mint-bright/10 blur-3xl"
        />
        <ZeroWatermark
          tone="light"
          className="-right-8 top-1/2 -translate-y-1/2 text-[24rem]"
        />

        <div className="relative mx-auto max-w-4xl">
          <div className="text-center">
            <p className="mb-3 text-xs font-semibold tracking-widest text-mint-bright">
              IL NOSTRO MOTORE
            </p>
            <h2 className="font-display text-4xl text-white md:text-5xl">
              Fai una cosa sola: porti quello che hai.
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-sm text-moss">
              Nessun modulo da imparare, nessun questionario infinito. Il Motore
              Ver0 legge i tuoi documenti, li incrocia con le banche dati
              ufficiali e genera i documenti conformi — e li tiene aggiornati.
              Tu hai sempre l&apos;ultima parola.
            </p>
          </div>

          {/* Flusso documenti → Motore → output */}
          <ol className="vz-reveal mt-14 grid grid-cols-1 gap-10 sm:grid-cols-3 sm:gap-6">
            {FLUSSO.map((m, i) => {
              const Icon = m.icon;
              return (
                <li
                  key={m.title}
                  className="relative flex flex-col items-center text-center"
                >
                  {/* Connettore animato verso il passo successivo (da sm in su) */}
                  {i < FLUSSO.length - 1 && (
                    <span
                      aria-hidden
                      className="vz-flow-track absolute left-1/2 top-8 hidden h-0.5 w-full sm:block"
                    />
                  )}
                  {Icon ? (
                    <span className="relative z-10 inline-flex h-16 w-16 items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-mint-bright backdrop-blur-sm">
                      <Icon size={24} />
                    </span>
                  ) : (
                    /* Nodo centrale: il Motore, zero E1 con alone che respira */
                    <span className="vz-motore-glow relative z-10 inline-flex h-16 w-16 items-center justify-center rounded-full border border-mint-bright/50 bg-pine">
                      <svg
                        viewBox="0 0 30 40"
                        className="h-8 w-auto"
                        fill="none"
                        aria-hidden="true"
                      >
                        <ellipse
                          cx="15"
                          cy="20"
                          rx="11"
                          ry="15"
                          stroke="#2FCF9A"
                          strokeWidth="4"
                        />
                      </svg>
                    </span>
                  )}
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

          {/* Le tre capacità — card in vetro */}
          <div className="vz-reveal mt-14 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {MOTORE.map((c) => {
              const Icon = c.icon;
              return (
                <article
                  key={c.title}
                  className="rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:border-mint-bright/40"
                >
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-mint-bright/15 text-mint-bright">
                    <Icon size={20} />
                  </span>
                  <p className="mt-3 text-sm font-semibold text-white">
                    {c.title}
                  </p>
                  <p className="mt-1.5 text-xs leading-relaxed text-moss">
                    {c.desc}
                  </p>
                </article>
              );
            })}
          </div>

          {/* Esempi multipli: porta quello che hai, non solo la bolletta */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-2">
            <span className="text-xs uppercase tracking-widest text-mint-bright">
              Per esempio
            </span>
            {ESEMPI.map((e) => (
              <span
                key={e}
                className="rounded-full border border-mint-bright/25 bg-white/10 px-3.5 py-1.5 text-xs text-moss"
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

      {/* SERVIZI E PREZZI — Registro A, fondo bianco */}
      <section id="servizi" className="bg-white px-5 py-20">
        <div className="mx-auto max-w-4xl">
          <div className="text-center">
            <h2 className="font-display text-4xl text-ink md:text-5xl">
              Servizi e prezzi, in chiaro
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-sm text-gray-warm">
              <ZeroWord>Zero</ZeroWord>{" "}
              <span className="font-display text-base text-pine">sorprese</span>
              : prezzi pubblici, nessun preventivo da chiedere. Attivi quello
              che ti serve, quando ti serve.
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
      <section className="bg-white px-5 pb-16">
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

      {/* SIGILLO — Registro C "carta e timbro": crema caldo, sigillo timbrato,
          un solo accento terracotta in questa schermata */}
      <section id="sigillo" className="bg-cream px-5 py-16">
        <Link
          href="/sigillo"
          className="group mx-auto flex max-w-3xl flex-col items-center gap-6 rounded-2xl bg-white p-6 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-lift sm:flex-row sm:gap-8"
        >
          <Sigillo className="h-28 w-28 shrink-0 -rotate-6 transition-transform group-hover:-rotate-3" />
          <div className="min-w-0 text-center sm:text-left">
            <h3 className="font-display text-2xl text-ink md:text-3xl">
              <ZeroWord>Zero</ZeroWord> scorciatoie: il Sigillo non si compra.{" "}
              <em className="font-semibold text-terracotta">Si dimostra.</em>
            </h3>
            <p className="mt-2 text-sm text-gray-warm">
              Criteri pubblici, dati verificati, QR di controllo. Millesimato:
              ogni anno va riconquistato.
            </p>
            <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-pine">
              Scopri il Sigillo{" "}
              <ArrowRight
                size={14}
                className="transition-transform group-hover:translate-x-0.5"
              />
            </span>
          </div>
        </Link>
      </section>

      {/* MANIFESTO DELLO ZERO — fascia finale su pino scuro con foto in
          filigrana (SLOT FOTO 3, Registro A in chiusura) */}
      <section className="relative overflow-hidden bg-pine-dark px-5 py-24 text-center">
        <PhotoDuotone
          src="/img/placeholder-orizzonte.svg"
          className="absolute inset-0 opacity-20"
        />
        <div aria-hidden className="absolute inset-0 bg-pine-dark/60" />
        <ZeroWatermark
          tone="light"
          className="left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-[30rem]"
        />
        <DottedRing className="left-1/2 top-14 h-40 w-40 -translate-x-1/2 border-mint/25" />
        <div className="relative mx-auto max-w-2xl">
          <div className="mb-8 flex justify-center">
            <Sigillo tone="dark" className="h-24 w-24" />
          </div>
          <p className="font-display text-3xl leading-snug text-white md:text-4xl">
            Ci chiamiamo Ver0 per un principio solo, lo Zero, che torna in ogni
            promessa: <ZeroWord tone="dark">zero</ZeroWord> effort,{" "}
            <ZeroWord tone="dark">zero</ZeroWord> domande inutili,{" "}
            <ZeroWord tone="dark">zero</ZeroWord> sorprese sul prezzo,{" "}
            <ZeroWord tone="dark">zero</ZeroWord> scorciatoie sul Sigillo. E per
            la direzione di marcia: <ZeroWord tone="dark">verso zero</ZeroWord>{" "}
            sprechi, <ZeroWord tone="dark">verso zero</ZeroWord> emissioni.
          </p>
          <p className="mt-7 font-display text-2xl text-moss md:text-3xl">
            Lo Zero, da noi, non è il niente — è il traguardo.
          </p>
          <div className="mt-9 flex justify-center">
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
