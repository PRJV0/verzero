import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, FileText, Leaf, UserCheck } from "lucide-react";

import { Sigillo } from "@/components/brand/sigillo";
import {
  Scrolly,
  ScrollyProgress,
  ScrollyStage,
  ScrollyStep,
  ScrollySteps,
} from "@/components/scrolly";
import { FasciaListaAttesa } from "@/components/lista-attesa";
import { HeroHome } from "@/components/hero-home";
import { OndaParticelle } from "@/components/onda-particelle";
import { PrezzoPrincipio } from "@/components/prezzo-principio";
import { QualitaOutput } from "@/components/qualita-output";
import { FONDO_SOGLIA, PRESET } from "@/lib/onda";
import { MotoreInAzione } from "@/components/motore-in-azione";
import { JsonLd } from "@/components/json-ld";
import { PhotoDuotone } from "@/components/photo-duotone";
import { SOLO_STANDARD_UFFICIALI } from "@/lib/catalog";
import { SITO, jsonLdOrganization } from "@/lib/seo";

/**
 * Home come MANIFESTO (SPEC §12.J): vende la potenza del Motore e il
 * risultato, NON spiega il processo. Ogni sezione: un titolo-statement
 * (2-5 parole, display grande) + massimo 2 righe + una CTA imperativa.
 * La profondità tecnica vive in /come-funziona e nelle pagine servizio —
 * anche come protezione del know-how: il «come» non si regala in home.
 *
 * Grafica: contrasto pino/bianco netto, niente gradienti, blocchi decisi,
 * bottoni grandi, spazi generosi attorno a pochi elementi grandi. Le
 * filigrane (zeri giganti, foto in trasparenza) restano.
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

/** Bottone-manifesto: grande, netto, verbo imperativo. */
function CtaGrande({
  href,
  children,
  tone = "pine",
}: {
  href: string;
  children: React.ReactNode;
  tone?: "pine" | "white";
}) {
  return (
    <Link
      href={href}
      className={
        "vz-press inline-flex items-center gap-2 rounded-xl px-7 py-4 text-base font-semibold hover:-translate-y-0.5 " +
        (tone === "pine"
          ? "bg-pine text-white"
          : "bg-white text-pine")
      }
    >
      {children} <ArrowRight size={18} />
    </Link>
  );
}

/* --- Dati di pagina --- */

// Lo Zero, principio unico: già manifesto per natura. Messaggi a una riga.
const ZERI = [
  {
    accent: "Zero",
    tail: "effort",
    m: "Bastano i documenti che hai già: l'AI Ver0 li trasforma, un professionista valida.",
  },
  {
    accent: "Zero",
    tail: "documenti che invecchiano",
    m: "Quando una norma cambia, i documenti interessati vengono rivisti.",
  },
  {
    accent: "Zero",
    tail: "domande inutili",
    m: "La visura l'abbiamo già letta noi.",
  },
  {
    accent: "Zero",
    tail: "blocchi",
    m: "Se un dato manca, lo stimiamo insieme e lo dichiariamo.",
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

/** Le tre battute della sezione documenti (§12.J): secche, senza processo. */
const BATTUTE = [
  { icon: FileText, t: "Solo il necessario." },
  { icon: null, t: "L'AI Ver0 lavora." }, // icona: lo zero E1, disegnato sotto
  { icon: UserCheck, t: "Un professionista valida." },
];

export const metadata: Metadata = {
  title: { absolute: "Verzero — la piattaforma che qualifica la tua impresa" },
  description:
    "Sostenibilità, sistemi di gestione e consulenza con l'AI Ver0: documenti conformi in giorni, verificati da professionisti, con prezzi pubblici.",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "it_IT",
    siteName: SITO.nome,
    title: "Verzero — la piattaforma che qualifica la tua impresa",
    description:
      "Sostenibilità, sistemi di gestione e consulenza con l'AI Ver0: documenti conformi in giorni, verificati da professionisti, con prezzi pubblici.",
    url: "/",
    images: [{ url: SITO.ogImage, width: 1200, height: 630, alt: SITO.nome }],
  },
};

export default function HomePage() {
  return (
    <>
      <JsonLd dati={jsonLdOrganization()} />

      <HeroHome />

      {/* LO ZERO DI VER0 — la sezione distintiva: statements per natura. */}
      <section className="relative bg-moss px-5 py-16 md:py-24">
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          <ZeroWatermark tone="pine" className="-bottom-24 -left-10 text-[26rem]" />
        </div>
        <div className="relative mx-auto max-w-4xl">
          <div className="text-center">
            <h2 className="font-display text-5xl text-ink md:text-6xl">
              Lo <ZeroWord>Zero</ZeroWord> di Ver0
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-sm text-gray-warm md:text-base">
              Un principio solo, che regge sempre la stessa domanda:
              «dimostramelo».
            </p>
          </div>

          <Scrolly steps={6} className="mt-8">
            <ScrollyStage>
              <div className="relative mx-auto max-w-2xl py-6 text-center">
                <span
                  aria-hidden
                  className="pointer-events-none absolute left-1/2 top-1/2 -z-10 -translate-x-1/2 -translate-y-1/2 select-none font-display text-[18rem] leading-none text-pine/[0.07] md:text-[26rem]"
                >
                  0
                </span>

                <ScrollySteps className="min-h-[12rem] place-items-center">
                  {ZERI.map((z, i) => (
                    <ScrollyStep key={z.tail} index={i + 1}>
                      <h3 className="font-display text-4xl text-ink md:text-6xl">
                        <ZeroWord>{z.accent}</ZeroWord> {z.tail}
                        {z.leaf && (
                          <Leaf
                            size={24}
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

      {/* IL MOTORE — manifesto della potenza, senza fasi né meccanismi
          (§12.J: il «come» vive dentro, in /come-funziona). */}
      <section className="relative isolate overflow-hidden bg-pine-deep px-5 py-16 md:py-24">
        {/* L'onda torna qui in palette invertita e più nitida: è la
            sezione del Motore, e le si addice un carattere tecnico. */}
        <OndaParticelle config={PRESET.tecnica} className="-z-10" />
        <ZeroWatermark
          tone="light"
          className="-left-20 top-1/2 -translate-y-1/2 text-[28rem]"
        />
        {/* Glow menta discreti: profondità sulle superfici scure */}
        <span aria-hidden className="pointer-events-none absolute -right-32 -top-24 h-96 w-96 rounded-full bg-mint-bright/10 blur-3xl" />
        <span aria-hidden className="pointer-events-none absolute -bottom-32 left-1/4 h-80 w-80 rounded-full bg-mint-bright/[0.07] blur-3xl" />
        <div className="relative mx-auto max-w-4xl text-center">
          {/* Mai "VER0" in maiuscoletto: si legge "VERO" (decisione già presa). */}
          <p className="mb-6 text-xs font-semibold tracking-widest text-mint-bright">
            LA NOSTRA AI
          </p>
          <h2 className="font-display text-5xl leading-[1.02] text-white md:text-7xl">
            Un&apos;AI proprietaria.
          </h2>
          <p className="mx-auto mt-5 max-w-2xl font-display text-2xl leading-snug text-moss md:text-3xl">
            Costruito per i documenti d&apos;impresa. Verificato da
            professionisti.
          </p>

          {/* LA SCENA MADRE: qui il Motore smette di essere raccontato e
              si vede lavorare. È il protagonista della sezione — le tre
              battute qui sotto sono la sua didascalia, non un secondo
              centro di attenzione (brief §2a, §3.2). */}
          <div className="mt-12">
            <MotoreInAzione />
          </div>

          {/* Le tre battute della sezione documenti: secche, visual minimi. */}
          <div className="mx-auto mt-14 grid max-w-3xl grid-cols-1 gap-3 sm:grid-cols-3">
            {BATTUTE.map((b) => {
              const Icon = b.icon;
              return (
                <div
                  key={b.t}
                  className="border border-white/15 bg-white/[0.03] px-5 py-8"
                >
                  <span className="mx-auto flex h-12 w-12 items-center justify-center text-mint-bright">
                    {Icon ? (
                      <Icon size={30} strokeWidth={1.6} />
                    ) : (
                      /* Lo zero E1: l'icona del Motore */
                      <svg viewBox="0 0 30 40" className="h-9 w-auto" fill="none" aria-hidden>
                        <ellipse cx="15" cy="20" rx="11" ry="15" stroke="currentColor" strokeWidth="3" />
                      </svg>
                    )}
                  </span>
                  <p className="mt-4 font-display text-xl text-white">{b.t}</p>
                </div>
              );
            })}
          </div>

          <div className="mt-12">
            <CtaGrande href="/come-funziona" tone="white">
              Guarda come funziona
            </CtaGrande>
          </div>
        </div>
      </section>

      {/* CONSULENZA — statement + due righe + CTA. Il dettaglio vive dentro. */}
      <section className="bg-white px-5 py-16 md:py-24">
        <div className="mx-auto grid max-w-5xl grid-cols-1 items-center gap-10 md:grid-cols-2">
          <PhotoDuotone
            src="/photos/consulenza.jpg"
            alt="Due professionisti al lavoro su documenti d'impresa: la verifica umana che chiude ogni percorso Ver0."
            intensity="soft"
            className="vz-reveal aspect-[4/3] rounded-3xl shadow-lift"
          />
          <div>
            <h2 className="font-display text-5xl leading-[1.02] text-ink md:text-6xl">
              Dietro lo schermo, consulenti veri.
            </h2>
            <p className="mt-5 max-w-md text-sm leading-relaxed text-gray-warm md:text-base">
              Ogni documento passa da una verifica umana e porta il nome di chi
              l&apos;ha fatta. Specialisti prenotabili quando servono a te.
            </p>
            <div className="mt-8">
              <CtaGrande href="/chi-siamo">Conosci chi verifica</CtaGrande>
            </div>
          </div>
        </div>
      </section>

      {/* SERVIZI E PREZZI — il cuore della conversione: statement + vetrina. */}
      {/* IL PREZZO COME PRINCIPIO. Qui c'erano due sezioni: la griglia
          del catalogo coi prezzi e il blocco del canone. La griglia se ne
          va — elenco e prezzi per servizio hanno una sola casa, ed è la
          pagina Servizi — e il canone non sparisce ma diventa una delle
          tre prove di questo blocco, altrimenti sarebbe una ripetizione.

          Fondo scuro di proposito: fra «consulenti veri» e «solo standard
          ufficiali» c'era una corsa di cinque sezioni chiare di fila, e
          un manifesto sul prezzo è esattamente il punto in cui la pagina
          deve cambiare respiro. */}
      <section
        id="prezzo"
        className="relative isolate overflow-hidden px-5 py-16 md:py-24"
        style={{
          background: `linear-gradient(to bottom, ${FONDO_SOGLIA[0]}, ${FONDO_SOGLIA[1]})`,
        }}
      >
        <OndaParticelle config={PRESET.tecnica} className="-z-10" />
        <div className="relative">
          <PrezzoPrincipio />
        </div>
      </section>

      {/* SOLO STANDARD UFFICIALI — una riga di principio (§12.P). */}
      <section className="border-y-2 border-line bg-white px-5 py-12">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-display text-3xl text-ink md:text-4xl">
            Solo standard ufficiali.
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-gray-warm">
            {SOLO_STANDARD_UFFICIALI}
          </p>
          <Link
            href="/come-funziona"
            className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-pine hover:underline"
          >
            Le norme, citate una per una <ArrowRight size={15} />
          </Link>
        </div>
      </section>

      {/* LA QUALITÀ DEGLI ELABORATI. Mancava: si raccontava il metodo e
          il prezzo, mai il livello del documento che esce — che è la
          prima cosa che guarda chi deve portarlo in banca o in audit. */}
      <section className="bg-paper px-5 py-16 md:py-24">
        <div className="mx-auto max-w-5xl">
          <div className="mx-auto max-w-2xl text-center">
            <p className="mb-4 text-xs font-semibold tracking-widest text-pine">
              GLI ELABORATI
            </p>
            <h2 className="font-display text-4xl leading-[1.05] text-ink md:text-5xl">
              Documenti che reggono la lettura di chi li riceve.
            </h2>
            <p className="mx-auto mt-4 text-sm leading-relaxed text-gray-warm md:text-base">
              Banca, capofiliera, stazione appaltante, organismo di
              certificazione: chi li legge sa cosa cercare.
            </p>
          </div>
          <div className="mt-10">
            <QualitaOutput />
          </div>
        </div>
      </section>

      {/* SIGILLO — registro scuro istituzionale (§11.X). */}
      <section id="sigillo" className="relative isolate overflow-hidden bg-pine-deep px-5 py-16 md:py-24">
        <OndaParticelle config={PRESET.tenueScura} className="-z-10" />
        <div className="relative mx-auto flex max-w-4xl flex-col items-center gap-8 text-center sm:flex-row sm:gap-10 sm:text-left">
          <Sigillo tone="dark" className="h-32 w-32 shrink-0 md:h-40 md:w-40" />
          <div className="min-w-0">
            <h2 className="font-display text-4xl leading-[1.05] text-white md:text-6xl">
              Il Sigillo non si compra. Si dimostra.
            </h2>
            <p className="mt-4 max-w-lg text-sm text-moss md:text-base">
              Criteri pubblici, dati verificati, QR di controllo. Millesimato:
              ogni anno va riconquistato.
            </p>
            <div className="mt-7">
              <CtaGrande href="/sigillo" tone="white">
                Scopri il Sigillo
              </CtaGrande>
            </div>
          </div>
        </div>
      </section>

      {/* MANIFESTO DELLO ZERO — chiusa su pino scuro, foto in filigrana. */}
      <section className="relative overflow-hidden bg-pine-dark px-5 py-16 md:py-24 text-center">
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
        <div className="relative mx-auto max-w-3xl">
          {/* I sei Zeri sono già elencati sopra, uno per uno: rifarne
              quattro qui era ripetere, non rilanciare. Resta la riga che
              li tiene insieme, che è l'unica cosa nuova. */}
          <p className="font-display text-4xl leading-snug text-white md:text-6xl">
            Lo <ZeroWord tone="dark">Zero</ZeroWord>, da noi, non è il niente
            — è il traguardo.
          </p>
          <div className="mt-10 flex justify-center">
            <CtaGrande href="/servizi/percorso-ver0" tone="white">
              Attiva il Percorso Ver0
            </CtaGrande>
          </div>
        </div>
      </section>

      {/* LISTA D'ATTESA (fascia dedicata): dice una cosa scomoda —
          apriamo a pochi — e la trasforma nella ragione per lasciare il
          contatto. Testi decisi dal fondatore, alla lettera. */}
      <FasciaListaAttesa interesse="home" />
    </>
  );
}
