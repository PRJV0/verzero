import Link from "next/link";
import { Leaf, Zap, Scale, CircleCheck, Upload, ShieldCheck } from "lucide-react";

import { SERVIZI } from "@/lib/catalog";

/**
 * Home del sito pubblico. Resa grafica ripresa dal riferimento visivo
 * ufficiale (docs/riferimenti/verzero-prototipo.jsx): hero su fondo salvia,
 * i tre pilastri, gli ambiti, la fascia scura della qualifica, i servizi con
 * prezzi in chiaro, la fascia bollino. Header e footer sono nel layout (public).
 *
 * Messaggio guida (SPEC §1): prezzo, qualifica, effort su ogni sezione.
 */

const AMBITI = [
  {
    icon: Leaf,
    title: "Sostenibilità",
    desc: "Carbon footprint, bilancio VSME, economia circolare: i documenti che banche e clienti ti chiedono, verificabili da chiunque.",
  },
  {
    icon: Zap,
    title: "Efficienza energetica",
    desc: "Dai consumi reali alle opportunità di risparmio: la tua energia letta, misurata e messa al lavoro.",
  },
  {
    icon: Scale,
    title: "Sistemi di gestione",
    desc: "Manuali e procedure ISO e parità di genere, generati sui tuoi dati e pronti per la certificazione.",
  },
];

const PASSI = [
  {
    icon: Upload,
    title: "1. Carica i documenti",
    desc: "Bollette e fatture: li legge l'AI",
  },
  {
    icon: CircleCheck,
    title: "2. Verifica e conferma",
    desc: "Tu controlli, la piattaforma calcola",
  },
  {
    icon: ShieldCheck,
    title: "3. Ottieni report e bollino",
    desc: "Documenti difendibili, verificabili da chiunque",
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
      {/* Hero */}
      <section className="bg-moss px-5 py-14 text-center">
        <p className="mb-3 text-xs font-medium tracking-widest text-mint">
          SOSTENIBILITÀ · EFFICIENZA ENERGETICA · SISTEMI DI GESTIONE
        </p>
        <h1 className="mx-auto max-w-2xl font-display text-3xl leading-tight text-pine-dark md:text-4xl">
          I tuoi consulenti in cloud. La crescita della tua azienda, in
          abbonamento.
        </h1>
        <p className="mx-auto mt-4 max-w-lg text-sm text-pine">
          La consulenza per la tua impresa, a portata di un cl
          <span className="text-mint">AI</span>ck: l&apos;AI fa il lavoro
          pesante, le persone verificano, tu raccogli il risultato — a una
          frazione del prezzo della consulenza tradizionale.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2.5">
          <Link
            href="/servizi"
            className="rounded-lg bg-pine px-5 py-2.5 text-sm font-medium text-white"
          >
            Scopri cosa possiamo fare per te
          </Link>
          <Link
            href="/bollino"
            className="rounded-lg border border-pine bg-white px-5 py-2.5 text-sm font-medium text-pine"
          >
            Verifica un bollino
          </Link>
        </div>
        {/* I tre pilastri con le spunte */}
        <ul className="mt-5 flex flex-wrap justify-center gap-x-5 gap-y-1 text-xs text-pine">
          {PILASTRI.map((p) => (
            <li key={p} className="flex items-center gap-1.5">
              <CircleCheck size={14} className="shrink-0 text-mint" />
              {p}
            </li>
          ))}
        </ul>
      </section>

      {/* Le tre card degli ambiti */}
      <section
        id="ambiti"
        className="mx-auto grid max-w-4xl grid-cols-1 gap-4 px-5 py-10 sm:grid-cols-3"
      >
        {AMBITI.map((a) => {
          const Icon = a.icon;
          return (
            <article
              key={a.title}
              className="rounded-xl border border-line bg-white p-5 text-center"
            >
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-moss text-pine">
                <Icon size={20} />
              </span>
              <p className="mt-3 text-sm font-semibold text-ink">{a.title}</p>
              <p className="mt-1.5 text-xs leading-relaxed text-gray-warm">
                {a.desc}
              </p>
            </article>
          );
        })}
      </section>

      {/* Fascia scura: Ver0 qualifica la tua impresa */}
      <section className="bg-pine-dark px-5 py-10">
        <div className="mx-auto flex max-w-4xl flex-col items-center gap-6 md:flex-row">
          <div className="flex h-24 w-24 shrink-0 flex-col items-center justify-center rounded-full border-[3px] border-white bg-moss">
            <span className="font-display text-3xl font-semibold leading-none text-pine">
              0
            </span>
            <span className="mt-0.5 text-[10px] tracking-widest text-pine-dark">
              2026
            </span>
          </div>
          <div className="text-center md:text-left">
            <p className="font-display text-2xl text-white">
              Ver0 qualifica la tua impresa.
            </p>
            <p className="mt-2 max-w-lg text-sm text-moss">
              Non ti consegniamo solo documenti: ti accompagniamo a una
              qualifica verificabile da chiunque, che vale davanti a banche,
              capofiliera e stazioni appaltanti. Il bollino non si compra — si
              dimostra, ogni anno.
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-2 md:justify-start">
              {["Reputazione", "Attendibilità", "Riconoscimento"].map((t) => (
                <span
                  key={t}
                  className="rounded-full border border-mint bg-white/10 px-3.5 py-1.5 text-xs text-white"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Come funziona */}
      <section
        id="come-funziona"
        className="mx-auto grid max-w-4xl grid-cols-1 gap-4 px-5 py-8 text-center sm:grid-cols-3"
      >
        {PASSI.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.title}>
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-moss text-pine">
                <Icon size={19} />
              </span>
              <p className="mt-2 text-sm font-semibold text-ink">{s.title}</p>
              <p className="mt-0.5 text-xs text-gray-warm">{s.desc}</p>
            </div>
          );
        })}
      </section>

      {/* Servizi e prezzi */}
      <section id="servizi" className="mx-auto max-w-4xl px-5 pb-8">
        <p className="mb-1 text-center font-display text-xl text-ink">
          Servizi e prezzi, in chiaro
        </p>
        <p className="mb-4 text-center text-xs text-gray-warm">
          Nessun preventivo da chiedere: attivi quello che ti serve, quando ti
          serve.
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {SERVIZI.map((s) => (
            <Link
              key={s.slug}
              href={`/servizi/${s.slug}`}
              className={
                "flex flex-col rounded-xl bg-white p-4 transition-shadow hover:shadow-md " +
                (s.featured ? "border-2 border-pine" : "border border-line")
              }
            >
              {s.featured && (
                <span className="mb-2 self-start rounded-full bg-pine px-2.5 py-1 text-xs font-medium text-white">
                  Il più scelto
                </span>
              )}
              <p className="text-sm font-semibold text-ink">{s.name}</p>
              <p className="mb-3 mt-1 flex-1 text-xs text-gray-warm">
                {s.short}
              </p>
              <div className="flex items-center justify-between">
                <p
                  className={
                    "font-display text-lg " +
                    (s.featured ? "text-pine" : "text-ink")
                  }
                >
                  {s.price}
                </p>
                <span
                  className={
                    "rounded-lg border border-pine px-3 py-1.5 text-sm font-medium " +
                    (s.featured ? "bg-pine text-white" : "bg-white text-pine")
                  }
                >
                  Scopri
                </span>
              </div>
            </Link>
          ))}
        </div>
        <p className="mt-3 text-center text-xs text-gray-light">
          Prezzi per aziende fino a 50 dipendenti, IVA esclusa · 51-200
          dipendenti: listino +60% · −10% con pagamento annuale
        </p>
      </section>

      {/* Fascia bollino */}
      <section id="bollino" className="px-5 pb-10">
        <Link
          href="/bollino"
          className="mx-auto flex max-w-3xl items-center gap-4 rounded-xl border border-line bg-paper p-4 transition-shadow hover:shadow-md"
        >
          <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-full border-[2.5px] border-pine bg-moss">
            <span className="font-display text-lg font-semibold leading-none text-pine">
              0
            </span>
            <span className="text-[9px] tracking-wide text-pine-dark">2026</span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-ink">
              Il bollino non si compra. Si dimostra.
            </p>
            <p className="text-xs text-gray-warm">
              Criteri pubblici, dati verificati, QR di controllo. Millesimato:
              ogni anno va riconquistato.
            </p>
          </div>
        </Link>
      </section>
    </>
  );
}
