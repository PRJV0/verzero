"use client";

import { useRef } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { OndaParticelle } from "@/components/onda-particelle";
import { ONDA_HERO } from "@/lib/onda";

/**
 * PRIMO IMPATTO — il claim galleggia sopra l'onda.
 *
 * L'onda attraversa TUTTO l'hero e passa dietro le lettere: non le
 * evita. Dove ci sono le lettere si spegne per gradi (la maschera vive
 * in `@/lib/onda`), e sotto il blocco c'è un alone bianco che non ha
 * bordi — su fondo bianco un gradiente bianco si vede solo dove copre
 * una particella. Niente riquadri: di un contenitore non si deve
 * accorgere nessuno.
 *
 * IL TRATTAMENTO DI «CLOUD», variante scelta e perché. Le due sul
 * tavolo erano (a) «cloud» in pino pieno col resto più tenue e (b)
 * «cloud» in corsivo display con accento menta, in coerenza con
 * «effort» nel sottotitolo. Ho scelto la (a) per due ragioni concrete:
 *
 *  - sopra un fondo mosso comanda il CONTRASTO, non il colore. In (a)
 *    la parola-chiave è la più scura della riga e regge anche dove
 *    passa una particella; in (b) l'accento menta sarebbe stato il
 *    punto PIÙ CHIARO del claim, cioè il più fragile proprio
 *    sull'unica parola che deve restare leggibile da lontano.
 *  - la menta è già la firma dell'accento nel sottotitolo («effort») e
 *    dell'onda. Usarla tre volte in quattro righe la svuota: un accento
 *    che compare ovunque smette di essere un accento.
 *
 * L'ingresso è scaglionato PER RIGA, mai per lettera: una lettera alla
 * volta è una slide di presentazione, non l'insegna di un'azienda.
 */

export function HeroHome() {
  const blocco = useRef<HTMLDivElement>(null);

  return (
    <section className="relative isolate overflow-hidden bg-white px-5 py-24 md:py-32">
      <OndaParticelle
        config={ONDA_HERO}
        riferimentoTesto={blocco}
        className="-z-20"
      />

      <div ref={blocco} className="relative mx-auto max-w-4xl text-center">
        {/* L'ALONE: un'ellisse di bianco dietro il testo, senza contorni.
            Sul fondo bianco della sezione è invisibile finché non copre
            una particella — che è esattamente il suo unico compito. */}
        <span
          aria-hidden
          className="pointer-events-none absolute -inset-x-12 -inset-y-10 -z-10"
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(255,255,255,0.97) 0%, rgba(255,255,255,0.9) 42%, rgba(255,255,255,0.55) 66%, rgba(255,255,255,0) 82%)",
          }}
        />

        <p
          data-onda-maschera
          className="vz-entra mb-7 inline-block text-xs font-semibold tracking-widest text-pine"
          style={{ "--vz-i": 0 } as React.CSSProperties}
        >
          SOSTENIBILITÀ · SISTEMI DI GESTIONE · CONSULENZA
        </p>

        <h1
          className="font-display text-[2.5rem] font-semibold leading-[1.02] tracking-[-0.022em] text-pine-dark/80 sm:text-[3.25rem] md:text-[4.5rem] xl:text-[5rem]"
          style={{
            // Ombra bianca larga e sfumata: le lettere restano nitide
            // sopra le particelle senza che si veda un contenitore.
            textShadow:
              "0 0 16px rgba(255,255,255,0.95), 0 0 40px rgba(255,255,255,0.8)",
          }}
        >
          <span className="block">
            <span
              data-onda-maschera
              className="vz-entra inline-block"
              style={{ "--vz-i": 1 } as React.CSSProperties}
            >
              I tuoi consulenti
            </span>
          </span>
          <span className="block">
            <span
              data-onda-maschera
              className="vz-entra inline-block"
              style={{ "--vz-i": 2 } as React.CSSProperties}
            >
              in <span className="text-pine">cloud.</span>
            </span>
          </span>
        </h1>

        <p
          data-onda-maschera
          className="vz-entra mx-auto mt-7 max-w-2xl font-display text-2xl leading-snug text-pine md:text-3xl"
          style={{ "--vz-i": 3 } as React.CSSProperties}
        >
          La crescita della tua azienda, in abbonamento. Zero{" "}
          <em className="font-semibold italic text-mint">effort</em>: bastano i
          documenti che hai già.
        </p>

        <div
          data-onda-maschera
          className="vz-entra mt-10 flex flex-wrap justify-center gap-3"
          style={{ "--vz-i": 4 } as React.CSSProperties}
        >
          <Link
            href="/servizi"
            className="vz-press inline-flex items-center gap-2 rounded-xl bg-pine px-7 py-4 text-base font-semibold text-white"
          >
            Calcola il prezzo <ArrowRight size={18} />
          </Link>
          <Link
            href="/come-funziona"
            className="vz-press inline-flex items-center gap-2 rounded-xl border-2 border-pine bg-white/80 px-7 py-4 text-base font-semibold text-pine"
          >
            Guarda come funziona
          </Link>
        </div>
      </div>
    </section>
  );
}
