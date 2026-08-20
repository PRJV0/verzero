import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { OndaParticelle } from "@/components/onda-particelle";
import { RISERVA_FONDO } from "@/lib/onda";

/**
 * PRIMO IMPATTO — claim testuale su onda di particelle.
 *
 * Il claim non si trasforma più in niente: si legge, e basta. La
 * sostituzione grafica di «zero» con lo zero del marchio è stata tolta
 * perché costringeva a decifrare una parola invece di leggerla, e in un
 * claim la leggibilità viene prima di qualunque idea. L'unico accento è
 * la parola «effort» in corsivo menta.
 *
 * L'effetto sta tutto dietro, nell'onda: fondo bianco, particelle che
 * scorrono lungo una curva sinuosa. Tecnologia e natura nella stessa
 * immagine, senza che nulla si muova sopra il testo.
 *
 * Il claim entra a scaglioni con il sistema di movimento del prodotto
 * (SPEC §12.X), con la PRIMA parola senza ritardo: qui il titolo è il
 * contenuto principale che il browser misura, e farlo aspettare
 * significherebbe pagare l'effetto con l'LCP.
 */

/** Il claim, spezzato in parole per poterle far entrare a scaglioni. */
function ClaimComposto({ testo }: { testo: string }) {
  const parole = testo.split(" ");
  return (
    <>
      {parole.map((parola, i) => (
        <span key={`${parola}-${i}`}>
          <span
            className="vz-parola"
            style={{ "--vz-i": i } as React.CSSProperties}
          >
            {parola}
          </span>
          {i < parole.length - 1 ? " " : ""}
        </span>
      ))}
    </>
  );
}

export function HeroHome() {
  return (
    <section
      className="relative isolate overflow-hidden bg-white px-5 pt-16 md:pt-24"
      // Lo spazio in fondo non è una scelta di gusto: è quello che
      // l'onda occupa, dichiarato dal modulo che la disegna. Se un
      // giorno la fascia diventa più alta, questo cresce con lei e le
      // particelle non possono salire sul claim.
      style={{ paddingBottom: RISERVA_FONDO }}
    >
      <OndaParticelle className="-z-20" />

      {/* IL VELO: bianco pieno sopra la fascia del testo, che sfuma solo
          dove l'onda comincia. Il primo tentativo lasciava le particelle
          passare attraverso il sottotitolo: leggibile a fatica, cioè non
          leggibile. Il contrasto del claim non può dipendere da dove si
          trova una particella in quel momento. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[68%] bg-gradient-to-b from-white via-white to-white/0"
      />

      <div className="relative mx-auto max-w-4xl text-center">
        <p
          className="vz-parola mb-7 text-xs font-semibold tracking-widest text-pine"
          style={{ "--vz-i": 0 } as React.CSSProperties}
        >
          SOSTENIBILITÀ · SISTEMI DI GESTIONE · CONSULENZA
        </p>

        <h1 className="font-display text-6xl leading-[0.98] text-pine-dark md:text-8xl">
          <ClaimComposto testo="I tuoi consulenti in cloud." />
        </h1>

        <p
          className="vz-entra mx-auto mt-7 max-w-2xl font-display text-2xl leading-snug text-pine md:text-3xl"
          style={{ "--vz-i": 4 } as React.CSSProperties}
        >
          La crescita della tua azienda, in abbonamento. Zero{" "}
          <em className="font-semibold italic text-mint">effort</em>: bastano i
          documenti che hai già.
        </p>

        <div
          className="vz-entra mt-10 flex flex-wrap justify-center gap-3"
          style={{ "--vz-i": 5 } as React.CSSProperties}
        >
          <Link
            href="/servizi"
            className="vz-press inline-flex items-center gap-2 rounded-xl bg-pine px-7 py-4 text-base font-semibold text-white"
          >
            Calcola il prezzo <ArrowRight size={18} />
          </Link>
          <Link
            href="/come-funziona"
            className="vz-press inline-flex items-center gap-2 rounded-xl border-2 border-pine bg-white/70 px-7 py-4 text-base font-semibold text-pine backdrop-blur-sm"
          >
            Guarda come funziona
          </Link>
        </div>
      </div>
    </section>
  );
}
