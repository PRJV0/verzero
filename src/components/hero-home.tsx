import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { PhotoDuotone } from "@/components/photo-duotone";

/**
 * PRIMO IMPATTO (brief §4): direzione C + B.
 *
 * C — tipografia cinetica: il claim si compone parola per parola e la
 * parola «zero» si trasforma nello zero canonico del marchio.
 * B — movimento vettoriale: filigrane che ruotano lentissime e due masse
 * di colore che derivano sul fondo.
 *
 * Tutto è server-rendered e animato in CSS: nessun JS, nessuna libreria,
 * nessun video. Il testo è nel documento al primo byte — l'animazione
 * tocca solo opacity e transform, quindi non sposta nulla e non fa
 * ridisegnare la pagina (CLS invariato, LCP non rinviato: la prima parola
 * del titolo parte senza ritardo).
 *
 * Senza JS o con «riduci movimento» il risultato è la stessa scena,
 * ferma: nessuna parola manca, nessun contenuto è nascosto.
 */

/** Il claim, spezzato in parole per poterle far entrare a scaglioni. */
function ClaimComposto({ testo }: { testo: string }) {
  const parole = testo.split(" ");
  return (
    <>
      {parole.map((parola, i) => (
        <span
          key={`${parola}-${i}`}
          className="vz-parola"
          style={{ "--vz-i": i } as React.CSSProperties}
        >
          {parola}
          {i < parole.length - 1 ? " " : ""}
        </span>
      ))}
    </>
  );
}

/**
 * Lo zero del marchio: anello pieno con la cornice punteggiata, lo stesso
 * segno del Sigillo. Decorativo — la parola «zero» resta nel testo.
 */
function SegnoZero({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      aria-hidden
      className={`vz-zero-segno ${className}`}
    >
      <circle
        cx="50"
        cy="50"
        r="46"
        fill="none"
        stroke="currentColor"
        strokeOpacity="0.35"
        strokeWidth="3"
        strokeDasharray="0.1 9"
        strokeLinecap="round"
      />
      <ellipse
        cx="50"
        cy="50"
        rx="27"
        ry="34"
        fill="none"
        stroke="currentColor"
        strokeWidth="11"
      />
    </svg>
  );
}

/** Filigrana vettoriale: cerchi concentrici sottilissimi, in rotazione. */
function TramaCerchi({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 200"
      aria-hidden
      className={`vz-trama pointer-events-none absolute ${className}`}
    >
      {[92, 74, 56, 38].map((r, i) => (
        <circle
          key={r}
          cx="100"
          cy="100"
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth="0.6"
          strokeDasharray={i % 2 === 0 ? "0.1 5" : "18 10"}
          strokeLinecap="round"
        />
      ))}
    </svg>
  );
}

export function HeroHome() {
  return (
    <section className="relative overflow-hidden bg-moss px-5 py-16 md:py-24">
      {/* STRATO B — profondità. Due masse di colore che derivano su cicli
          lunghissimi e due filigrane che ruotano: si percepisce che la
          superficie è viva, non si vede il movimento. */}
      <span
        aria-hidden
        className="vz-deriva pointer-events-none absolute -right-32 -top-40 h-[34rem] w-[34rem] rounded-full bg-mint/[0.13] blur-3xl"
      />
      <span
        aria-hidden
        className="vz-deriva-lenta pointer-events-none absolute -bottom-48 -left-24 h-[28rem] w-[28rem] rounded-full bg-pine/[0.07] blur-3xl"
      />
      <TramaCerchi className="-left-24 top-10 h-72 w-72 text-pine/25 md:h-96 md:w-96" />
      <span
        aria-hidden
        className="pointer-events-none absolute -right-10 -top-16 select-none font-display leading-none text-pine/[0.05] text-[22rem] md:text-[32rem]"
      >
        0
      </span>

      <div className="relative mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 md:grid-cols-[1.35fr_1fr]">
        <div className="text-left">
          <p
            className="vz-parola mb-6 text-xs font-semibold tracking-widest text-pine"
            style={{ "--vz-i": 0 } as React.CSSProperties}
          >
            SOSTENIBILITÀ · SISTEMI DI GESTIONE · CONSULENZA
          </p>

          {/* Il titolo si compone: quattro parole, 70ms l'una dall'altra.
              La prima parte subito, così il browser misura il contenuto
              principale senza attese aggiunte. */}
          <h1 className="font-display text-6xl leading-[0.98] text-pine-dark md:text-8xl">
            <ClaimComposto testo="I tuoi consulenti in cloud." />
          </h1>

          <p
            className="vz-entra mt-6 max-w-xl font-display text-2xl leading-snug text-pine md:text-4xl"
            style={{ "--vz-i": 4 } as React.CSSProperties}
          >
            La crescita della tua azienda, in abbonamento. Con{" "}
            <span className="vz-zero-morph text-mint">
              <em className="vz-zero-testo font-display font-semibold not-italic italic">
                zero
              </em>
              <SegnoZero />
            </span>{" "}
            effort.
          </p>

          {/* §12.O: la formula canonica — documenti esistenti, AI Ver0,
              validazione umana. Mai numeri, mai il verbo "firmare". */}
          <p
            className="vz-entra mt-5 max-w-lg text-sm leading-relaxed text-gray-warm md:text-base"
            style={{ "--vz-i": 5 } as React.CSSProperties}
          >
            Zero effort, sul serio: bastano i documenti che hai già in
            azienda. L&apos;AI Ver0 li trasforma in qualifiche, un
            professionista le valida.
          </p>

          <div
            className="vz-entra mt-9 flex flex-wrap gap-3"
            style={{ "--vz-i": 6 } as React.CSSProperties}
          >
            <Link
              href="/servizi"
              className="vz-press inline-flex items-center gap-2 rounded-xl bg-pine px-7 py-4 text-base font-semibold text-white"
            >
              Calcola il prezzo <ArrowRight size={18} />
            </Link>
            <Link
              href="/come-funziona"
              className="vz-press inline-flex items-center gap-2 rounded-xl border-2 border-pine px-7 py-4 text-base font-semibold text-pine"
            >
              Guarda come funziona
            </Link>
          </div>
        </div>

        {/* La foto NON entra in scena: è il candidato più probabile a
            «contenuto principale» per il browser, e ritardarla sarebbe
            pagare l'effetto con la velocità. Sta ferma, e carica per
            prima (priority). */}
        <PhotoDuotone
          src="/photos/hero.jpg"
          alt="Paesaggio produttivo italiano: capannoni e campi coltivati, le imprese che Ver0 accompagna verso la qualifica."
          intensity="soft"
          priority
          className="aspect-[16/10] rounded-3xl shadow-lift md:aspect-[4/5]"
        />
      </div>
    </section>
  );
}
