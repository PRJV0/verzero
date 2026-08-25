import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, FileText, UserCheck } from "lucide-react";

import { Sigillo } from "@/components/brand/sigillo";
import { NastroZero } from "@/components/nastro-zero";
import { NarrazioneZero } from "@/components/zero-narrazione";
import { FasciaListaAttesa } from "@/components/lista-attesa";
import { HeroHome } from "@/components/hero-home";
import { OndaParticelle } from "@/components/onda-particelle";
import { PrezzoPrincipio } from "@/components/prezzo-principio";
import { FONDO_SOGLIA, PRESET } from "@/lib/onda";
import { MotoreInAzione } from "@/components/motore-in-azione";
import { JsonLd } from "@/components/json-ld";
import { PhotoDuotone } from "@/components/photo-duotone";
import { SOLO_STANDARD_UFFICIALI } from "@/lib/catalog";
import { SITO, jsonLdOrganization, jsonLdWebSite } from "@/lib/seo";

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

/** Le tre battute della sezione documenti (§12.J): secche, senza processo. */
const BATTUTE = [
  { icon: FileText, t: "Solo il necessario." },
  { icon: null, t: "L'AI Ver0 lavora." }, // icona: lo zero E1, disegnato sotto
  { icon: UserCheck, t: "Un professionista valida." },
];

export const metadata: Metadata = {
  title: { absolute: `${SITO.nome} — ${SITO.payoff}` },
  description:
    "Sostenibilità, sistemi di gestione e consulenza con l'AI Ver0: documenti conformi in giorni, verificati da professionisti, con prezzi pubblici.",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "it_IT",
    siteName: SITO.nome,
    title: `${SITO.nome} — ${SITO.payoff}`,
    description:
      "Sostenibilità, sistemi di gestione e consulenza con l'AI Ver0: documenti conformi in giorni, verificati da professionisti, con prezzi pubblici.",
    url: "/",
    images: [
      {
        url: SITO.ogMarchio,
        width: 1200,
        height: 630,
        alt: `${SITO.nome} — ${SITO.payoff}`,
      },
    ],
  },
};

export default function HomePage() {
  return (
    <>
      {/* L'entità: chi siamo, e il sito che la pubblica. Due nodi legati
          dallo stesso `@id`, così chi legge il markup trova un'azienda
          sola invece di due che si somigliano. */}
      <JsonLd dati={jsonLdOrganization()} />
      <JsonLd dati={jsonLdWebSite()} />

      <HeroHome />

      {/* LO ZERO DI VER0 — un contenuto, due presentazioni.
          Le sei declinazioni vengono dalla stessa fonte (`src/lib/zeri.ts`);
          cambia il modo di mostrarle, perché i due contesti non hanno gli
          stessi vincoli.

          SU LARGO la narrazione allo scorrimento: c'è spazio per una
          parola alla volta grande quanto un titolo, e la corsa di
          scorrimento è abbastanza lunga perché l'avvicendamento si legga.

          SU STRETTO il nastro che scorre da solo: lì il palco sticky ruba
          spazio alla lettura (SPEC §12.O) e il movimento legato allo
          scorrimento non regge — chi scorre veloce salta le fasi, chi
          scorre piano le vede a strappi.

          La scelta la fa il CSS, non JavaScript: entrambe stanno nel
          markup e una sola è visibile alla volta. `display: none` toglie
          l'altra anche dall'albero di accessibilità e ne ferma le
          animazioni, quindi non c'è nulla che giri o venga letto due
          volte — e non c'è lo sfarfallio che darebbe una scelta fatta
          dopo l'idratazione. */}
      {/* NIENTE `overflow-hidden` su questa sezione: un antenato che
          ritaglia annulla il `position: sticky` del palco, e la
          narrazione perde l'ancoraggio senza dare alcun errore. Chi
          ritaglia lo fa per conto suo — la filigrana qui sotto e il
          nastro dentro di sé. */}
      <section className="relative bg-moss py-16 md:py-24">
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          <ZeroWatermark tone="pine" className="-bottom-24 -left-10 text-[26rem]" />
        </div>
        <div className="relative">
          <div className="mx-auto max-w-4xl px-5 text-center">
            <h2 className="font-display text-5xl text-ink md:text-6xl">
              Lo <ZeroWord>Zero</ZeroWord> di Ver0
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-sm text-gray-warm md:text-base">
              Un principio solo, che regge sempre la stessa domanda:
              «dimostramelo».
            </p>
          </div>

          {/* Da 768px in su: la narrazione. */}
          <div className="hidden px-5 md:block">
            <div className="mx-auto max-w-4xl">
              <NarrazioneZero />
            </div>
          </div>

          {/* Sotto i 768px: il nastro. */}
          <div className="mt-10 border-y border-pine/12 py-6 md:hidden">
            <NastroZero />
          </div>
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
            {/* «Solo standard ufficiali» era una sezione a sé, bianca, fra
                il prezzo e il Sigillo. È la stessa promessa che fa il
                Sigillo — un attestato vale se dietro c'è una norma vera —
                e ripeterla due volte a due schermate di distanza la
                indeboliva invece di rafforzarla. Qui è dove serve. */}
            <p className="mt-4 max-w-lg text-sm text-moss/80">
              {SOLO_STANDARD_UFFICIALI}
            </p>
            <div className="mt-7">
              <CtaGrande href="/sigillo" tone="white">
                Scopri il Sigillo
              </CtaGrande>
            </div>
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
