"use client";

import { useEffect, useRef, type RefObject } from "react";

import {
  ONDA_DECISA,
  SBORDO,
  accento,
  assesta,
  avanza,
  coloriDi,
  fattoreMaschere,
  opacita,
  posizionePerLarghezza,
  quante,
  raggioDi,
  semina,
  type ConfigOnda,
  type MascheraTesto,
  type Particella,
} from "@/lib/onda";

/**
 * L'ONDA — firma visiva del marchio, una sola implementazione.
 *
 * Codice nostro: un canvas, un requestAnimationFrame, il campo di rumore
 * di `@/lib/rumore` e la geometria di `@/lib/onda`. Nessuna libreria —
 * three.js o particles.js sarebbero centinaia di KB per fare meno.
 *
 * Qui dentro resta solo il plumbing, perché le proprietà che contano si
 * provano con `scripts/test-onda.mjs` invece che a occhio: un difetto
 * che compare al terzo minuto non si vede guardando lo schermo.
 *
 * LE DECISIONI CHE FANNO LA RESA
 *
 * 1. NIENTE CERCHI DISEGNATI A OGNI FOTOGRAMMA. Ogni particella è
 *    un'immagine già pronta — un gradiente radiale renderizzato una
 *    volta sola, in otto gradazioni fra colore base e accento — e
 *    disegnarla costa una `drawImage`. Un `arc()` con
 *    `createRadialGradient` per particella per fotogramma costerebbe
 *    molto di più e darebbe bordi netti e aliasati: i 60fps e i bordi
 *    morbidi sono la stessa scelta, non due.
 *
 * 2. IL BAGLIORE DEL PRIMO PIANO è un secondo sprite, più largo e più
 *    tenue, disegnato sotto: costa una drawImage in più solo sul 7%
 *    delle particelle, e su fondo bianco è ciò che le fa vibrare invece
 *    di stare appiccicate.
 *
 * 3. RISOLUZIONE VERA. Il buffer è grande quanto lo schermo (dpr fino a
 *    2), quindi su Retina non si scala nulla al ribasso e non si sgrana.
 *
 * 4. IL CANVAS SBORDA dal contenitore: l'onda entra ed esce dal campo
 *    invece di cominciare e finire dentro l'inquadratura.
 *
 * 5. IL TESTO NON VIENE EVITATO, VIENE PROTETTO: una maschera per riga,
 *    dove l'onda si spegne per gradi. Il claim galleggia sopra l'onda
 *    invece di stare in una radura.
 */

/** Gradazioni pre-renderizzate fra colore base e accento. */
const GRADAZIONI = 8;
/** Lato dello sprite: abbondante, così non si sgrana ingrandito. */
const LATO_SPRITE = 64;

function sprite(
  colore: readonly [number, number, number],
  bagliore = false,
): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = LATO_SPRITE;
  c.height = LATO_SPRITE;
  const g = c.getContext("2d")!;
  const m = LATO_SPRITE / 2;
  const grad = g.createRadialGradient(m, m, 0, m, m, m);
  const [r, v, b] = colore;
  if (bagliore) {
    // Alone largo e tenue: non ha nucleo, serve solo a far vibrare la
    // particella che gli sta sopra.
    grad.addColorStop(0, `rgba(${r},${v},${b},0.34)`);
    grad.addColorStop(0.45, `rgba(${r},${v},${b},0.12)`);
    grad.addColorStop(1, `rgba(${r},${v},${b},0)`);
  } else {
    // Nucleo piccolo e coda lunga: è ciò che rende il bordo morbido
    // invece che tagliato.
    grad.addColorStop(0, `rgba(${r},${v},${b},1)`);
    grad.addColorStop(0.35, `rgba(${r},${v},${b},0.55)`);
    grad.addColorStop(0.7, `rgba(${r},${v},${b},0.12)`);
    grad.addColorStop(1, `rgba(${r},${v},${b},0)`);
  }
  g.fillStyle = grad;
  g.fillRect(0, 0, LATO_SPRITE, LATO_SPRITE);
  return c;
}

export function OndaParticelle({
  config = ONDA_DECISA,
  riferimentoTesto,
  className = "",
}: {
  config?: ConfigOnda;
  /** Il blocco di testo da proteggere: l'onda ci passa dietro e si spegne. */
  riferimentoTesto?: RefObject<HTMLElement | null>;
  className?: string;
}) {
  const riferimento = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const tela = riferimento.current;
    if (!tela) return;
    const ctx = tela.getContext("2d");
    if (!ctx) return;

    const menoMovimento =
      typeof matchMedia === "function" &&
      matchMedia("(prefers-reduced-motion: reduce)").matches;

    const { base, accento: coloreAccento } = coloriDi(config.palette);
    const misto = (k: number): [number, number, number] => [
      Math.round(base[0] + (coloreAccento[0] - base[0]) * k),
      Math.round(base[1] + (coloreAccento[1] - base[1]) * k),
      Math.round(base[2] + (coloreAccento[2] - base[2]) * k),
    ];
    const sprites = Array.from({ length: GRADAZIONI }, (_, i) =>
      sprite(misto(i / (GRADAZIONI - 1))),
    );
    const aloni = Array.from({ length: GRADAZIONI }, (_, i) =>
      sprite(misto(i / (GRADAZIONI - 1)), true),
    );

    let L = 0;
    let H = 0;
    let particelle: Particella[] = [];
    let attiva: ConfigOnda = config;
    let maschere: MascheraTesto[] = [];

    /**
     * Le maschere si ricalcolano a ogni misura: il testo si muove col
     * layout, e una maschera ferma su un testo che si è spostato è
     * peggio di nessuna maschera.
     *
     * Si prendono gli elementi marcati `data-onda-maschera` — una riga
     * ciascuno — e non il blocco intero: fra una riga e l'altra l'onda
     * deve passare.
     */
    const misuraMaschere = () => {
      const nodo = riferimentoTesto?.current;
      if (!nodo) {
        maschere = [];
        return;
      }
      /*
       * UNA MASCHERA PER RIGA sugli schermi larghi, UNA SOLA SUL BLOCCO
       * sotto i 640px.
       *
       * Non è una scorciatoia: su un telefono il claim occupa quasi
       * tutta la larghezza, quindi fra una riga e l'altra non c'è spazio
       * in cui l'onda si possa vedere — e le particelle che stanno in
       * quegli spazi arrivano sul testo col bagliore e basta. Lì l'onda
       * vive sopra e sotto il blocco, dove c'è aria vera; sul desktop
       * invece passa fra le righe, ed è quello che fa galleggiare il
       * claim.
       */
      const stretto = tela.getBoundingClientRect().width - SBORDO * 2 < 640;
      const marcati = stretto
        ? []
        : nodo.querySelectorAll<HTMLElement>("[data-onda-maschera]");
      const elementi = marcati.length > 0 ? Array.from(marcati) : [nodo];
      const t = tela.getBoundingClientRect();
      maschere = elementi
        .map((el) => el.getBoundingClientRect())
        .filter((b) => b.width > 0 && b.height > 0)
        .map((b) => ({
          cx: b.left - t.left + b.width / 2,
          cy: b.top - t.top + b.height / 2,
          /*
           * Questi tre numeri escono da una ricerca, non da un'idea.
           *
           * Misurando la velatura sul testo al variare dei parametri, il
           * `minimo` — quanto resta dell'onda SOTTO le lettere — non
           * cambia il risultato di un punto: da 0,012 a 0,08 la velatura
           * peggiore è la stessa. Vuol dire che a sporcare il testo non
           * sono le particelle mascherate, ma quelle che stanno NEGLI
           * SPAZI fra una riga e l'altra e ci arrivano con il bagliore,
           * largo tre raggi.
           *
           * Quindi conta l'ESTENSIONE, e soprattutto quella verticale:
           * ry 1,55 → 1,9 porta il contrasto sul telefono da 4,16:1 a
           * 5,09:1. E siccome il `minimo` è gratis, si tiene alto: dietro
           * le lettere l'onda resta visibile come un velo, che è il punto
           * — il claim galleggia sopra l'onda, non su una radura.
           */
          rx: (b.width / 2) * 1.5,
          ry: (b.height / 2) * 1.9,
          minimo: 0.06,
        }));
    };

    let ultimoT = 0;

    const misura = () => {
      const b = tela.getBoundingClientRect();
      L = Math.max(1, Math.round(b.width));
      H = Math.max(1, Math.round(b.height));
      // Fino a 2: su Retina si disegna alla risoluzione vera, oltre non
      // si guadagna nulla di visibile e si perdono fotogrammi.
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      tela.width = Math.round(L * dpr);
      tela.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      attiva = { ...config, posizione: posizionePerLarghezza(L, config) };
      particelle = semina(quante(L, attiva), L, H, attiva);
      // Il campo parte già a regime: senza questo, al primo fotogramma
      // tutte le particelle sarebbero allineate sulla stessa riga e si
      // vedrebbe il fascio «formarsi», che è un momento di scena.
      assesta(particelle, ultimoT, L, H, attiva);
      misuraMaschere();
    };

    const disegna = (t: number) => {
      // clearRect e non un fondo pieno: sulle sezioni scure il colore lo
      // mette la sezione, e il canvas non deve saperne niente.
      ctx.clearRect(0, 0, L, H);
      for (const p of particelle) {
        const alfaLibera = opacita(p, t, L, H, attiva);
        if (alfaLibera <= 0.004) continue;
        const alfa =
          maschere.length > 0
            ? alfaLibera * fattoreMaschere(p.x, p.y, maschere)
            : alfaLibera;
        if (alfa <= 0.004) continue;
        const indice = Math.round(accento(p, L) * (GRADAZIONI - 1));
        const raggio = raggioDi(p, t, L, H, attiva);
        const lato = raggio * 6;
        if (p.avanti) {
          const largo = lato * 2.6;
          ctx.globalAlpha = alfa * 0.55;
          ctx.drawImage(
            aloni[indice],
            p.x - largo / 2,
            p.y - largo / 2,
            largo,
            largo,
          );
        }
        ctx.globalAlpha = alfa;
        ctx.drawImage(
          sprites[indice],
          p.x - lato / 2,
          p.y - lato / 2,
          lato,
          lato,
        );
      }
      ctx.globalAlpha = 1;
    };

    let rafId = 0;
    let avvio = 0;
    let precedente = 0;
    const passo = (ora: number) => {
      if (!avvio) avvio = ora;
      const t = (ora - avvio) / 1000;
      // Il passo si misura sul tempo vero, non sul fotogramma: su uno
      // schermo a 120Hz l'onda deve scorrere alla stessa velocità, non
      // al doppio.
      const dt = precedente ? (ora - precedente) / 1000 : 1 / 60;
      precedente = ora;
      avanza(particelle, dt, t, L, H, attiva);
      ultimoT = t;
      disegna(t);
      rafId = requestAnimationFrame(passo);
    };

    // Con «riduci movimento» si disegna una configurazione ferma e
    // armoniosa, scelta a campo già evoluto: non l'istante zero, che è
    // sempre il meno interessante.
    ultimoT = menoMovimento ? 37 : 0;
    misura();
    // Un fotogramma subito, sempre: l'onda c'è già prima che il primo
    // rAF arrivi — e in una scheda aperta in secondo piano il rAF non
    // parte affatto finché non la si guarda.
    disegna(ultimoT);
    if (!menoMovimento) rafId = requestAnimationFrame(passo);

    const osservatore = new ResizeObserver(() => {
      misura();
      disegna(ultimoT);
    });
    osservatore.observe(tela);
    const nodoTesto = riferimentoTesto?.current;
    if (nodoTesto) osservatore.observe(nodoTesto);

    return () => {
      cancelAnimationFrame(rafId);
      osservatore.disconnect();
    };
  }, [config, riferimentoTesto]);

  return (
    <canvas
      ref={riferimento}
      aria-hidden
      // Sborda lateralmente: l'onda entra ed esce dal campo invece di
      // cominciare e finire dentro l'inquadratura.
      className={`pointer-events-none absolute inset-y-0 h-full ${className}`}
      style={{
        left: -SBORDO,
        right: -SBORDO,
        width: `calc(100% + ${SBORDO * 2}px)`,
      }}
    />
  );
}
