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
 * ═══ PERCHÉ NON DICE PIÙ «I TUOI CONSULENTI IN CLOUD» ═══
 * Perché ci metteva dentro la categoria che vogliamo lasciare. Un
 * cliente che legge «consulenti» pensa a un consulente, e da lì confronta
 * quello che facciamo con quello che fa un consulente: parcelle,
 * giornate, un preventivo da aspettare. Il claim ora dichiara il CAMBIO
 * DI MODELLO — una qualifica che si attiva come un abbonamento — e lascia
 * al lettore il compito di accorgersi che non è la stessa cosa.
 *
 * IL CLAIM HA DUE PESI, e l'ordine conta. La prima informazione è COSA
 * OTTIENI — «Qualifica la tua impresa» — e sta in grande, in peso pieno.
 * «In abbonamento.» è la seconda: dice come si compra, che è
 * un'informazione preziosa ma successiva, e sta a poco più di un terzo
 * della scala. Erano invertite, e chi leggeva vedeva prima il modello di
 * acquisto e poi il risultato: l'ordine sbagliato per chi ancora non sa
 * che cosa vendiamo.
 *
 * La sottolineatura menta resta sulla seconda riga. Serve a non farla
 * sparire ora che è più piccola — è un segno, non un cambio di colore
 * del testo: il colore l'avrebbe resa più CHIARA, cioè più fragile
 * sopra le particelle.
 *
 * LE MASCHERE RESTANO. Sembra controintuitivo su fondo scuro, ma
 * particelle chiare dietro testo bianco abbassano il contrasto
 * esattamente come le scure sotto testo scuro: il vincolo si allenta
 * molto, non sparisce.
 */

/** La sottolineatura del claim: un tratto, non un rettangolo. */
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

      <div ref={blocco} className="relative mx-auto max-w-5xl text-center">
        {/* LA FASE, DETTA SUBITO E NON IN FONDO.
            Stava in fondo alla home, dopo che le CTA avevano già
            invitato ad attivare: si scopriva alla fine di essere in fila.
            Detta qui diventa un'altra cosa — non una scusa, una ragione
            per muoversi adesso — e le CTA che seguono dicono quello che
            succede davvero, cioè una richiesta senza addebito.
            Prende il posto dell'occhiello con le tre parole di dominio:
            quelle le dice ora il sottotitolo, e questa riga vale di più. */}
        <p
          data-onda-maschera
          className="vz-entra mb-8 inline-flex max-w-full items-center gap-2.5 rounded-full border border-mint-bright/30 bg-mint-bright/[0.07] px-4 py-2 text-left text-[12.5px] leading-snug text-moss sm:py-1.5"
          style={{ "--vz-i": 0 } as React.CSSProperties}
        >
          <span
            aria-hidden
            className="h-1.5 w-1.5 shrink-0 rounded-full bg-mint-bright"
          />
          {/* UN SOLO figlio di testo, e non due. Con il testo spezzato
              fra un nodo e uno `<strong>` il flex li tratta come due
              elementi: su schermo stretto andavano a capo come blocchi
              separati, col pallino da una parte e mezza frase
              dall'altra. Dentro un unico span il testo va a capo come
              testo. */}
          <span>
            Stiamo aprendo a poche imprese alla volta —{" "}
            <strong className="font-semibold text-mint-bright">
              condizioni fondatori per le prime
            </strong>
          </span>
        </p>

        <h1 className="font-display text-white">
          {/* Riga 1: che cosa ottieni. È la prima informazione, e sta
              in grande a piena forza. */}
          <span className="block">
            <span
              data-onda-maschera
              className="vz-entra inline-block whitespace-nowrap text-[clamp(1.85rem,5.6vw,5rem)] font-bold leading-[1.02] tracking-[-0.035em]"
              style={{ "--vz-i": 1 } as React.CSSProperties}
            >
              Qualifica la tua impresa.
            </span>
          </span>
          {/* Riga 2: come si compra. Seconda informazione, seconda
              scala — poco più di un terzo della prima.

              NOWRAP E MISURA IN VW, tutte e due necessarie. «In
              abbonamento.» spezzato lascia «In» da solo su una riga, che
              non è un claim: è un errore di impaginazione. Ma fissare il
              corpo a scaglioni vuol dire che a una certa larghezza si
              rompe comunque — basta una lingua, un carattere di ripiego
              o uno schermo che non avevamo previsto. Legandolo alla
              larghezza della finestra la riga non può rompersi a nessuna
              misura. */}
          <span className="mt-3 block">
            <span
              data-onda-maschera
              className="vz-entra relative inline-block whitespace-nowrap text-[clamp(1.25rem,3.1vw,2.6rem)] font-normal leading-[1.1] tracking-[-0.02em] text-moss"
              style={{ "--vz-i": 2 } as React.CSSProperties}
            >
              In{" "}
              <span className="relative inline-block">
                abbonamento.
                <TrattoMenta />
              </span>
            </span>
          </span>
        </h1>

        {/* UNA RIGA SOLA fra il claim e la barra, e dice i due asset che
            nessun altro ha: l'intelligenza è NOSTRA e costruita per
            questo mestiere, e chi valida è un professionista che ne
            risponde. Scritta come una frase e non come un elenco — «AI +
            professionisti» separati da un punto sarebbero due voci di
            una scheda prodotto, e una scheda prodotto non riposiziona
            nessuno. */}
        <p
          data-onda-maschera
          className="vz-entra mx-auto mt-8 max-w-[30ch] font-display text-[1.25rem] leading-[1.45] text-moss sm:max-w-[42ch] sm:text-[1.5rem] md:text-[1.7rem]"
          style={{ "--vz-i": 3 } as React.CSSProperties}
        >
          Un&apos;intelligenza{" "}
          <em className="font-semibold not-italic text-mint-bright">
            proprietaria
          </em>{" "}
          costruita per i documenti d&apos;impresa, e professionisti che
          validano prima della consegna.
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
