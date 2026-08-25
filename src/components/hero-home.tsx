"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

import { Orientatore } from "@/components/orientatore";
import { ArrowRight } from "lucide-react";

import { OndaParticelle } from "@/components/onda-particelle";
import { FONDO_SOGLIA, ONDA_CONTENUTA, ONDA_SOGLIA } from "@/lib/onda";

/**
 * LA SOGLIA — l'hero su fondo scuro.
 *
 * Il resto del sito resta chiaro: questa è una soglia, e una soglia si
 * attraversa. Sul pino profondo cade il vincolo che ci frenava — il
 * testo è bianco e parte da 15:1 di contrasto — quindi il fascio può
 * essere luminoso davvero: bagliore additivo, scie, particelle fino a
 * sei pixel.
 *
 * IL CLAIM HA DUE PESI, non uno. «I tuoi consulenti» è la premessa e sta
 * in peso normale; «in cloud.» è la promessa e vale una volta e mezza, a
 * piena forza. L'occhio ci cade sopra perché è più grande, non perché è
 * colorato: il colore l'avrebbe reso più CHIARO, cioè più fragile sopra
 * le particelle. L'accento menta è una sottolineatura tracciata a mano
 * sotto «cloud» — un segno, non un cambio di colore del testo.
 *
 * LE MASCHERE RESTANO. Sembra controintuitivo su fondo scuro, ma
 * particelle chiare dietro testo bianco abbassano il contrasto
 * esattamente come le scure sotto testo scuro: il vincolo si allenta
 * molto, non sparisce.
 */

/** La sottolineatura di «cloud»: un tratto, non un rettangolo. */
function TrattoMenta() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 200 12"
      preserveAspectRatio="none"
      className="absolute inset-x-0 -bottom-1 h-[0.14em] w-full overflow-visible"
    >
      {/* Due passate leggermente sfalsate, come una penna che torna
          indietro: un rettangolo menta sarebbe stato un evidenziatore. */}
      <path
        d="M2 8.2 C 38 4.1, 76 5.4, 116 6.2 S 176 4.6, 198 5.1"
        fill="none"
        stroke="#2FCF9A"
        strokeWidth="3.4"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
      <path
        d="M8 10 C 52 7.6, 96 8.8, 140 8.1 S 184 7.2, 194 7.8"
        fill="none"
        stroke="#2FCF9A"
        strokeOpacity="0.45"
        strokeWidth="2"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

export function HeroHome() {
  const blocco = useRef<HTMLDivElement>(null);

  /*
   * Due calibrazioni, da vedere e scegliere: `?onda=contenuta` mostra la
   * versione più discreta. La lettura sta in un effetto perché durante
   * il render il server non ha un URL, e un render diverso fra server e
   * browser è un errore di idratazione.
   */
  const [config, setConfig] = useState(ONDA_SOGLIA);
  useEffect(() => {
    const scelta = new URLSearchParams(window.location.search).get("onda");
    if (scelta === "contenuta") {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- lettura una tantum dell'URL, impossibile durante il render
      setConfig({
        ...ONDA_SOGLIA,
        densita: ONDA_CONTENUTA.densita,
        opacita: 0.7,
        raggio: 0.85,
        primoPiano: 0.05,
      });
    }
  }, []);

  return (
    <section
      className="relative isolate overflow-hidden px-5 py-24 md:py-32"
      // Il fondo lo dipinge anche il canvas, ma qui serve comunque: è
      // ciò che si vede prima che il JS parta e con «riduci movimento».
      style={{
        background: `linear-gradient(to bottom, ${FONDO_SOGLIA[0]}, ${FONDO_SOGLIA[1]})`,
      }}
    >
      <OndaParticelle
        config={config}
        riferimentoTesto={blocco}
        className="-z-10"
      />

      <div ref={blocco} className="relative mx-auto max-w-4xl text-center">
        <p
          data-onda-maschera
          className="vz-entra mb-8 inline-block text-xs font-semibold tracking-[0.18em] text-mint-bright"
          style={{ "--vz-i": 0 } as React.CSSProperties}
        >
          SOSTENIBILITÀ · SISTEMI DI GESTIONE · CONSULENZA
        </p>

        <h1 className="font-display text-white">
          {/* Riga 1: la premessa. Peso normale, scala grande. */}
          <span className="block">
            <span
              data-onda-maschera
              className="vz-entra inline-block text-[2.15rem] font-normal leading-[1.04] tracking-[-0.015em] text-moss sm:text-[2.9rem] md:text-[3.9rem]"
              style={{ "--vz-i": 1 } as React.CSSProperties}
            >
              I tuoi consulenti
            </span>
          </span>
          {/* Riga 2: la promessa. Una volta e mezza, a piena forza. */}
          <span className="mt-1 block">
            <span
              data-onda-maschera
              className="vz-entra relative inline-block text-[3.4rem] font-bold leading-[0.96] tracking-[-0.038em] sm:text-[4.7rem] md:text-[6.2rem] xl:text-[7rem]"
              style={{ "--vz-i": 2 } as React.CSSProperties}
            >
              in{" "}
              <span className="relative inline-block">
                cloud.
                <TrattoMenta />
              </span>
            </span>
          </span>
        </h1>

        {/* UNA RIGA SOLA fra il claim e la barra, e dice che cosa si
            riceve. Il claim dichiara CHI siamo («i tuoi consulenti»), la
            riga dichiara COSA arriva: due lavori diversi, nessuna
            ripetizione fra i due.

            «Zero» porta il peso e il colore del sistema dello Zero —
            semibold in menta viva, esattamente come l'accento del nastro
            (`src/lib/zeri.ts`, `NastroZero`), non in corsivo: il corsivo
            qui era di «effort», che era la coda e non l'accento.

            «in tempo Zero» resta unito: spezzato a capo, «Zero» da solo
            su una riga diventa un numero e non più la parola della
            marca. */}
        <p
          data-onda-maschera
          className="vz-entra mx-auto mt-8 max-w-[26ch] font-display text-[1.3rem] leading-[1.45] text-moss sm:max-w-[34ch] sm:text-[1.55rem] md:text-[1.75rem]"
          style={{ "--vz-i": 3 } as React.CSSProperties}
        >
          Documenti a norma,{" "}
          <span className="whitespace-nowrap">
            in tempo{" "}
            <span className="font-semibold text-mint-bright">Zero</span>.
          </span>
        </p>

        {/* L'ORIENTATORE, subito sotto il claim.
            Prende il posto del bottone «Calcola il prezzo»: portava al
            catalogo, e la barra ci porta pure — ma sapendo già che cosa
            stai cercando. Un campo di ricerca che chiede «che cosa ti
            serve?» è anche una domanda più onesta di un invito a
            calcolare un prezzo prima di aver scelto qualcosa. */}
        <div
          data-onda-maschera
          className="vz-entra mt-9"
          style={{ "--vz-i": 4 } as React.CSSProperties}
        >
          <Orientatore />
        </div>

        {/* UN SOLO RIMANDO, e non è quello di prima.
            «Guarda come funziona» è uscito: sta nel menu, e non risponde
            alla domanda che la barra ha appena fatto. Il catalogo invece
            resta, perché è l'unica strada per chi non sa che cosa
            scrivere e non si riconosce in nessuna delle scelte rapide —
            i chip portano a quattro risultati, non a tutto. */}
        <div
          data-onda-maschera
          className="vz-entra mt-6 text-sm"
          style={{ "--vz-i": 5 } as React.CSSProperties}
        >
          <Link
            href="/servizi"
            className="text-moss hover:text-white hover:underline"
          >
            Oppure sfoglia tutto il catalogo
          </Link>
        </div>
      </div>
    </section>
  );
}
