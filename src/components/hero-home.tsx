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
 * della scala — 2,8 a 1. Erano invertite, e chi leggeva vedeva prima il
 * modello di acquisto e poi il risultato: l'ordine sbagliato per chi
 * ancora non sa che cosa vendiamo.
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
        {/* QUI NON C'È PIÙ L'ANNUNCIO DELLA FASE.
            Stava sopra il claim, ed era la prima cosa che si leggeva del
            sito: «stiamo aprendo a poche imprese alla volta». Vera, ma
            in cima dice «non siamo ancora pronti», e ogni affermazione
            che seguiva arrivava a un lettore che aveva già ricevuto una
            riserva. Adesso sta accanto al prezzo e nel catalogo, dove
            chi legge sta già valutando e le condizioni fondatori sono
            una ragione per muoversi (v. `annuncio-fase.tsx`). */}
        <h1 className="font-display text-white">
          {/* Riga 1: che cosa ottieni. È la prima informazione, e sta
              in grande a piena forza.

              QUESTA RIGA PUÒ ANDARE A CAPO, e la seconda no. Il divieto
              di spezzare vale per «In abbonamento.», che lasciato a metà
              mette «In» da solo su una riga; «Qualifica la tua impresa.»
              è una frase e va a capo come una frase. Tenerla su una riga
              sola la inchiodava a 29,6 px sullo stretto — 320 dei 335
              disponibili — e da lì il rapporto con la seconda riga non
              poteva crescere. Lasciandola spezzare parte da 38,4 px.
              `text-balance` fa in modo che le due righe vengano di
              lunghezza simile invece di lasciare una parola sola in
              fondo. */}
          <span className="block">
            <span
              data-onda-maschera
              className="vz-entra inline-block text-balance text-[clamp(2.85rem,6.4vw,5.6rem)] font-bold leading-[0.98] tracking-[-0.038em]"
              style={{ "--vz-i": 0 } as React.CSSProperties}
            >
              Qualifica la tua impresa.
            </span>
          </span>
          {/* Riga 2: come si compra. Seconda informazione, seconda
              scala.

              ═══ LE TRE SCALE DELL'HERO, E PERCHÉ SONO CLAMP ═══
              Il claim deve stare sopra a TUTTE E DUE le righe che lo
              seguono — la seconda riga del claim e il sottotitolo — e
              deve farlo a ogni larghezza, non solo sul desktop. Con i
              corpi a scaglioni (`sm:` / `md:`) i rapporti si rompono
              proprio nelle larghezze in mezzo, che sono quelle che
              nessuno guarda: a 768 px il sottotitolo saltava a 24 px
              mentre la seconda riga del claim restava a 17,7, cioè la
              riga del claim diventava più piccola del corpo del testo.
              Tre `clamp()` con pendenze diverse tengono l'ordine a
              qualunque misura, senza scalini.

                riga 1     clamp(2,85rem  6,4vw  5,6rem)
                riga 2     clamp(1,15rem  2,5vw  2rem)
                sottotitolo clamp(1,1rem  2,3vw  1,8rem)

              Ne esce, misurato in pagina:
                375 e 390   45,6 / 18,4 / 17,6   → 2,6 e 2,5
                768         49,2 / 19,2 / 17,7   → 2,8 e 2,6
                1440        89,6 / 32   / 28,8   → 3,1 e 2,8
              Sotto il rapporto 2:1 non si scende da nessuna parte: era
              1,9 sullo stretto, dove il claim valeva quanto il testo che
              gli stava sotto.

              IL MINIMO DEL CLAIM È 2,85rem E NON DI PIÙ perché a 375 px
              il contenitore è largo 335: a 45,6 px «Qualifica la» e «tua
              impresa.» ci stanno su due righe bilanciate, più su si va a
              tre e l'hero si allunga senza guadagnare gerarchia.
              A 1440 la prima riga misura 969 px in un contenitore da
              1024: il tetto di 5,6rem è tarato lì.

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
              className="vz-entra relative inline-block whitespace-nowrap text-[clamp(1.15rem,2.5vw,2rem)] font-normal leading-[1.1] tracking-[-0.01em] text-moss"
              style={{ "--vz-i": 1 } as React.CSSProperties}
            >
              In{" "}
              <span className="relative inline-block">
                abbonamento.
                <TrattoMenta />
              </span>
            </span>
          </span>
        </h1>

        {/* IL FILETTO DI STACCO — dichiara che sotto comincia un'altra
            cosa.
            Sullo stretto il claim e la riga che segue si leggevano come
            un testo unico: stesso carattere, stesso allineamento
            centrato, e trentadue pixel di distacco che a quella scala
            non sono un distacco. La differenza di corpo da sola non
            basta, perché fra la seconda riga del claim e il sottotitolo
            il salto è piccolo per forza — sono entrambe righe seconde.

            Un filetto corto e chiaro fa il lavoro che la tipografia non
            può fare qui: è un segno, non un contenuto, quindi
            `aria-hidden`. Entra insieme al testo che introduce — stesso
            `--vz-i` del sottotitolo — altrimenti comparirebbe da solo
            su uno spazio ancora vuoto. */}
        <span
          aria-hidden
          className="vz-entra mx-auto mt-10 block h-px w-14 bg-moss/35 sm:mt-12"
          style={{ "--vz-i": 2 } as React.CSSProperties}
        />

        {/* UNA RIGA SOLA fra il claim e la barra, e dice i due asset che
            nessun altro ha: l'AI è NOSTRA e costruita per questo
            mestiere, e chi valida è un professionista che ne risponde.
            Scritta come una frase e non come un elenco — «AI +
            professionisti» separati da un punto sarebbero due voci di
            una scheda prodotto, e una scheda prodotto non riposiziona
            nessuno.

            «INTELLIGENZA ARTIFICIALE», PER ESTESO. Diceva
            «un'intelligenza proprietaria», che è una perifrasi: chi
            legge non sa se stiamo parlando di software, di un metodo o
            di una squadra di persone in gamba. La cosa che rende questa
            riga un asset è proprio che si tratta di un'AI, quindi la
            parola va detta. */}
        <p
          data-onda-maschera
          className="vz-entra mx-auto mt-9 max-w-[32ch] font-display text-[clamp(1.1rem,2.3vw,1.8rem)] leading-[1.5] text-moss/85 sm:max-w-[44ch]"
          style={{ "--vz-i": 2 } as React.CSSProperties}
        >
          Un&apos;intelligenza artificiale{" "}
          <em className="font-semibold not-italic text-mint-bright">
            proprietaria
          </em>
          , costruita per i documenti d&apos;impresa, e professionisti che
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
          style={{ "--vz-i": 3 } as React.CSSProperties}
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
          style={{ "--vz-i": 4 } as React.CSSProperties}
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
