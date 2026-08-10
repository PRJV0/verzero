import type { Metadata } from "next";
import Link from "next/link";
import {
  Leaf,
  Scale,
  Users,
  BookMarked,
  CircleCheck,
  ClipboardList,
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
import { MotoreScrolly } from "@/components/motore-scrolly";
import {
  Scrolly,
  ScrollyProgress,
  ScrollyStage,
  ScrollyStep,
  ScrollySteps,
} from "@/components/scrolly";
import { JsonLd } from "@/components/json-ld";
import { PhotoDuotone } from "@/components/photo-duotone";
import { CANONE_INCLUDE } from "@/lib/canone";
import { SOLO_STANDARD_UFFICIALI } from "@/lib/catalog";
import { SITO, jsonLdOrganization } from "@/lib/seo";

/**
 * Home del sito pubblico — direzione grafica a tre registri (SPEC §12.W):
 * - Registro A "editoriale vivo": impianto generale — gerarchia Fraunces
 *   drammatica, parole-Zero in corsivo menta, foto duotone verde.
 * - Registro B "tech botanico": SOLO la macro-sezione del Motore Ver0 —
 *   pino scuro, bagliori menta, flusso animato, card in vetro.
 * - Registro scuro istituzionale: Motore Ver0, teaser del Sigillo e
 *   manifesto — pino profondo, sigillo tono-su-tono, bagliori menta.
 * Il registro "carta e timbro" (crema/terracotta) è stato ritirato.
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
    m: "Non zero coinvolgimento: ti chiediamo solo i documenti che hai già — circa un'ora del tuo tempo. Il resto lo fa il Motore.",
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

/** Raccolta documentale guidata (§12.P): metodo e rigore, mai onnipotenza. */

/** Esempi concreti di checklist per percorso (§12.P). */


const PILASTRI = [
  "Prezzi in chiaro, sotto la media di mercato",
  "Effort minimo: mai un dato che sappiamo già",
  "Qualifica verificabile da chiunque",
];

/**
 * La home tiene il titolo pieno del marchio (senza suffisso, che altrimenti
 * lo ripeterebbe) ma dichiara comunque canonical e social come le altre.
 */
export const metadata: Metadata = {
  title: { absolute: "Ver0 — la piattaforma che qualifica la tua impresa" },
  description:
    "Sostenibilità, sistemi di gestione e consulenza con il Motore Ver0: documenti conformi in giorni, verificati da professionisti, con prezzi pubblici.",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "it_IT",
    siteName: SITO.nome,
    title: "Ver0 — la piattaforma che qualifica la tua impresa",
    description:
      "Sostenibilità, sistemi di gestione e consulenza con il Motore Ver0: documenti conformi in giorni, verificati da professionisti, con prezzi pubblici.",
    url: "/",
    images: [{ url: SITO.ogImage, width: 1200, height: 630, alt: SITO.nome }],
  },
};

export default function HomePage() {
  return (
    <>
      {/* Dati strutturati dell'organizzazione: una volta sola, in home. */}
      <JsonLd dati={jsonLdOrganization()} />

      {/* HERO — Registro A pieno: apertura editoriale asimmetrica, display
          Fraunces grande, parola-Zero in evidenza, foto duotone già sopra la
          piega (a lato su desktop, a fascia su mobile). */}
      <section className="relative overflow-hidden bg-gradient-to-b from-moss via-moss to-paper px-5 py-14 md:py-20">
        <ZeroWatermark
          tone="pine"
          className="-right-10 -top-16 text-[22rem] md:text-[32rem]"
        />
        <DottedRing className="-left-16 top-24 h-56 w-56 border-mint/20" />

        <div className="relative mx-auto grid max-w-5xl grid-cols-1 items-center gap-10 md:grid-cols-[1.2fr_1fr]">
          <div className="text-left">
            <p className="mb-5 text-xs font-semibold tracking-widest text-pine">
              SOSTENIBILITÀ · SISTEMI DI GESTIONE · CONSULENZA
            </p>
            <h1 className="font-display text-5xl leading-[1.02] text-pine-dark md:text-7xl">
              I tuoi consulenti in cloud. La crescita della tua azienda, in
              abbonamento.
            </h1>
            <p className="mt-7 max-w-xl font-display text-2xl leading-snug text-pine md:text-3xl">
              La consulenza con{" "}
              <ZeroWord>
                <span className="text-3xl md:text-4xl">zero</span>
              </ZeroWord>{" "}
              effort: ti chiediamo solo i documenti che hai già.
            </p>
            {/* §12.O: «zero effort» non si dichiara mai da solo — segue sempre
                la definizione, e dove possibile la quantificazione. */}
            <p className="mt-4 max-w-lg text-sm text-gray-warm">
              Zero effort non vuol dire zero coinvolgimento: circa un&apos;ora
              del tuo tempo per ciò che solo tu puoi darci, il resto lo fa il
              Motore Ver0 — con le persone che verificano, prezzi pubblici e
              tempi che si misurano in giorni.
            </p>

            <div className="mt-8">
              <Link
                href="/servizi"
                className="inline-block rounded-lg bg-pine px-6 py-3 text-sm font-medium text-white shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-lift"
              >
                Scopri cosa possiamo fare per te
              </Link>
            </div>

            <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-1 text-xs text-pine">
              {PILASTRI.map((p) => (
                <li key={p} className="flex items-center gap-1.5">
                  <CircleCheck size={14} className="shrink-0 text-mint" />
                  {p}
                </li>
              ))}
            </ul>
          </div>

          {/* SLOT FOTO 1 — hero (Registro A, duotone soft: illustrazione già
              in palette; con uno scatto fotografico passare intensity="full") */}
          <PhotoDuotone
            src="/photos/hero.jpg"
            alt="Paesaggio produttivo italiano: capannoni e campi coltivati, le imprese che Ver0 accompagna verso la qualifica."
            intensity="soft"
            priority
            className="aspect-[16/10] rounded-3xl shadow-lift md:aspect-[4/5]"
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
      {/* Niente overflow nascosto sulla sezione: ritaglierebbe il contenitore
          di scorrimento, disattivando palco sticky e timeline (v. scrolly.tsx).
          La filigrana si ritaglia nel proprio strato. */}
      <section className="relative bg-gradient-to-b from-paper via-moss to-moss px-5 py-20">
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          <ZeroWatermark tone="pine" className="-bottom-24 -left-10 text-[26rem]" />
        </div>
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

          {/* Scrollytelling: lo zero gigante resta fisso, le declinazioni si
              avvicendano dentro e attorno. Fallback: elenco completo. */}
          <Scrolly steps={6} className="mt-8">
            <ScrollyStage>
              <div className="relative mx-auto max-w-2xl py-6 text-center">
                {/* Zero gigante fisso al centro della scena */}
                <span
                  aria-hidden
                  className="pointer-events-none absolute left-1/2 top-1/2 -z-10 -translate-x-1/2 -translate-y-1/2 select-none font-display text-[18rem] leading-none text-pine/[0.07] md:text-[26rem]"
                >
                  0
                </span>

                <ScrollySteps className="min-h-[13rem] place-items-center">
                  {ZERI.map((z, i) => (
                    <ScrollyStep key={z.tail} index={i + 1}>
                      <h3 className="font-display text-3xl text-ink md:text-5xl">
                        <ZeroWord>{z.accent}</ZeroWord> {z.tail}
                        {z.leaf && (
                          <Leaf
                            size={22}
                            aria-hidden
                            className="ml-2 inline text-mint"
                          />
                        )}
                      </h3>
                      <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-gray-warm md:text-base">
                        {z.m}
                      </p>
                    </ScrollyStep>
                  ))}
                </ScrollySteps>

                <div className="mx-auto mt-8 max-w-xs">
                  <ScrollyProgress />
                </div>
              </div>
            </ScrollyStage>
          </Scrolly>
        </div>
      </section>

      {/* CONSULENZA — Registro A editoriale, foto duotone (SLOT FOTO 2) */}
      <section className="bg-white px-5 py-20">
        <div className="mx-auto grid max-w-4xl grid-cols-1 items-center gap-10 md:grid-cols-2">
          {/* SLOT FOTO 2 — consulenza (duotone soft; scatti veri: stesso path) */}
          <PhotoDuotone
            src="/photos/consulenza.jpg"
            alt="Due professionisti al lavoro su documenti d'impresa: la verifica umana che chiude ogni percorso Ver0."
            intensity="soft"
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

      {/* IL MOTORE VER0 — sezione narrativa con scrollytelling
          (le cinque fasi si avvicendano sul palco fisso). */}
      <MotoreScrolly />

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

      {/* PERCHÉ L'ABBONAMENTO — il pacchetto incluso in ogni canone (SPEC
          §12.V). L'osservatorio bandi vive qui come beneficio da abbonati. */}
      <section id="canone" className="bg-white px-5 pb-20">
        <div className="mx-auto max-w-4xl rounded-3xl bg-gradient-to-b from-moss to-paper px-6 py-12 md:px-10">
          <div className="text-center">
            <p className="mb-3 text-xs font-semibold tracking-widest text-pine">
              PERCHÉ L&apos;ABBONAMENTO
            </p>
            <h2 className="font-display text-4xl text-ink md:text-5xl">
              Il tuo canone include
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-sm text-gray-warm">
              Qualunque servizio attivi, l&apos;abbonamento non è un affitto sul
              documento: è ciò che lo tiene vivo.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {CANONE_INCLUDE.map((b) => {
              const Icon = b.icon;
              return (
                <article
                  key={b.title}
                  className="vz-reveal rounded-2xl bg-white p-5 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-lift"
                >
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-moss text-pine">
                    <Icon size={20} />
                  </span>
                  <p className="mt-3 font-display text-lg text-ink">
                    {b.title}
                  </p>
                  <p className="mt-1.5 text-sm leading-relaxed text-gray-warm">
                    {b.desc}
                  </p>
                  {b.note && (
                    <p className="mt-2 text-xs text-gray-light">{b.note}</p>
                  )}
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* SOLO STANDARD UFFICIALI — principio in evidenza (§12.P) */}
      <section className="bg-white px-5 pb-16">
        <div className="mx-auto flex max-w-3xl items-start gap-4 rounded-2xl border border-pine/25 bg-moss/40 p-5">
          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-pine">
            <BookMarked size={19} />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-ink">
              Solo standard ufficiali
            </p>
            <p className="mt-1 text-sm leading-relaxed text-gray-warm">
              {SOLO_STANDARD_UFFICIALI}
            </p>
            <p className="mt-1.5 text-xs text-gray-light">
              UNI EN ISO, UNI/PdR, GHG Protocol, standard EFRAG, direttive e
              decreti: ogni documento cita la norma su cui è costruito.
            </p>
          </div>
        </div>
      </section>

      {/* SIGILLO — registro scuro istituzionale: pino profondo, sigillo
          tono-su-tono con segmento menta acceso (§11.X) */}
      <section id="sigillo" className="bg-pine-deep px-5 py-16">
        <Link
          href="/sigillo"
          className="group mx-auto flex max-w-3xl flex-col items-center gap-6 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:border-mint-bright/40 sm:flex-row sm:gap-8"
        >
          <Sigillo tone="dark" className="h-28 w-28 shrink-0" />
          <div className="min-w-0 text-center sm:text-left">
            <h3 className="font-display text-2xl text-white md:text-3xl">
              <ZeroWord tone="dark">Zero</ZeroWord> scorciatoie: il Sigillo non
              si compra. Si dimostra.
            </h3>
            <p className="mt-2 text-sm text-moss">
              Criteri pubblici, dati verificati, QR di controllo. Millesimato:
              ogni anno va riconquistato.
            </p>
            <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-mint-bright">
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
        {/* SLOT FOTO 3 — filigrana della fascia finale (scatti veri: stesso path) */}
        <PhotoDuotone
          src="/photos/impresa.jpg"
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
          {/* §12.O: la formula «zero effort» non resta mai senza definizione. */}
          <p className="mx-auto mt-6 max-w-xl text-sm leading-relaxed text-moss/90">
            Zero effort non vuol dire zero coinvolgimento: ti chiediamo solo ciò
            che solo tu puoi darci — i documenti che hai già — e ci occupiamo di
            tutto il resto.
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
