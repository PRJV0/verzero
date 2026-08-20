"use client";

import { useEffect, useRef, type RefObject } from "react";

import {
  ONDA_HERO,
  SBORDO,
  accento,
  coloriDi,
  curva,
  fattoreMaschere,
  opacita,
  oscillazione,
  posizionePerLarghezza,
  quante,
  semina,
  type ConfigOnda,
  type MascheraTesto,
  type Particella,
} from "@/lib/onda";

/**
 * L'ONDA — firma visiva del marchio, una sola implementazione.
 *
 * Codice nostro: un canvas, un requestAnimationFrame e la geometria di
 * `@/lib/onda`. Nessuna libreria — three.js o particles.js sarebbero
 * centinaia di KB per fare meno di questo.
 *
 * Qui dentro resta solo il plumbing, perché le proprietà che contano si
 * provano con `scripts/test-onda.mjs` invece che a occhio.
 *
 * LE DECISIONI CHE FANNO LA RESA
 *
 * 1. NIENTE CERCHI DISEGNATI A OGNI FOTOGRAMMA. Ogni particella è
 *    un'immagine già pronta — un gradiente radiale renderizzato una
 *    volta sola, in otto gradazioni fra il colore base e l'accento — e
 *    disegnarla costa una `drawImage`. Un `arc()` con
 *    `createRadialGradient` per particella per fotogramma costerebbe
 *    molto di più e darebbe bordi netti e aliasati: i 60fps e i bordi
 *    morbidi sono la stessa scelta, non due.
 *
 * 2. RISOLUZIONE VERA. Il buffer è grande quanto lo schermo (dpr fino a
 *    2), quindi su Retina non si scala nulla al ribasso e non si sgrana.
 *
 * 3. IL CANVAS SBORDA dal contenitore: l'onda entra ed esce dal campo
 *    invece di cominciare e finire dentro l'inquadratura.
 *
 * 4. IL TESTO NON VIENE EVITATO, VIENE PROTETTO. Con `riferimentoTesto`
 *    l'onda passa dietro il blocco di testo e lì si spegne per gradi:
 *    il claim galleggia sopra l'onda invece di stare in una radura.
 */

/** Gradazioni pre-renderizzate fra colore base e accento. */
const GRADAZIONI = 8;
/** Lato dello sprite: abbondante, così non si sgrana ingrandito. */
const LATO_SPRITE = 64;

function sprite(colore: readonly [number, number, number]): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = LATO_SPRITE;
  c.height = LATO_SPRITE;
  const g = c.getContext("2d")!;
  const m = LATO_SPRITE / 2;
  const grad = g.createRadialGradient(m, m, 0, m, m, m);
  const [r, v, b] = colore;
  // Nucleo piccolo e coda lunga: è ciò che rende il bordo morbido
  // invece che tagliato.
  grad.addColorStop(0, `rgba(${r},${v},${b},1)`);
  grad.addColorStop(0.35, `rgba(${r},${v},${b},0.55)`);
  grad.addColorStop(0.7, `rgba(${r},${v},${b},0.12)`);
  grad.addColorStop(1, `rgba(${r},${v},${b},0)`);
  g.fillStyle = grad;
  g.fillRect(0, 0, LATO_SPRITE, LATO_SPRITE);
  return c;
}

export function OndaParticelle({
  config = ONDA_HERO,
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
    const sprites = Array.from({ length: GRADAZIONI }, (_, i) => {
      const k = i / (GRADAZIONI - 1);
      return sprite([
        Math.round(base[0] + (coloreAccento[0] - base[0]) * k),
        Math.round(base[1] + (coloreAccento[1] - base[1]) * k),
        Math.round(base[2] + (coloreAccento[2] - base[2]) * k),
      ]);
    });

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
      const marcati = nodo.querySelectorAll<HTMLElement>("[data-onda-maschera]");
      const elementi = marcati.length > 0 ? Array.from(marcati) : [nodo];
      const t = tela.getBoundingClientRect();
      maschere = elementi
        .map((el) => el.getBoundingClientRect())
        .filter((b) => b.width > 0 && b.height > 0)
        .map((b) => ({
          cx: b.left - t.left + b.width / 2,
          cy: b.top - t.top + b.height / 2,
          // Abbastanza più larga della riga perché gli ANGOLI stiano
          // dentro il pianoro: con margini stretti erano proprio gli
          // angoli a restare scoperti, ed è lì che la misura del
          // contrasto trovava il fondo peggiore.
          rx: (b.width / 2) * 1.45,
          ry: (b.height / 2) * 1.55,
          minimo: 0.09,
        }));
    };

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
      particelle = semina(quante(L, attiva), L, attiva);
      misuraMaschere();
    };

    const disegna = (t: number) => {
      // clearRect e non un fondo pieno: sulle sezioni scure il colore lo
      // mette la sezione, e il canvas non deve saperne niente.
      ctx.clearRect(0, 0, L, H);
      for (const p of particelle) {
        // Senza maschera l'opacità si calcola una volta sola; con la
        // maschera serve prima la posizione, quindi si fa in due passi.
        const alfaLibera = opacita(p, L, attiva);
        if (alfaLibera <= 0.004) continue;
        const smorzo = 0.3 + 0.7 * Math.min(1, alfaLibera / (p.a * attiva.opacita));
        const y =
          curva(p.x, t, L, H, attiva) +
          p.dv * H * 0.075 * attiva.spessore +
          oscillazione(p, t) * p.amp * attiva.ampiezza * smorzo;
        const alfa =
          maschere.length > 0
            ? alfaLibera * fattoreMaschere(p.x, y, maschere)
            : alfaLibera;
        if (alfa <= 0.004) continue;
        const g = sprites[Math.round(accento(p, L) * (GRADAZIONI - 1))];
        const lato = p.r * 6;
        ctx.globalAlpha = alfa;
        ctx.drawImage(g, p.x - lato / 2, y - lato / 2, lato, lato);
      }
      ctx.globalAlpha = 1;
    };

    let rafId = 0;
    let avvio = 0;
    let precedente = 0;
    let ultimoT = 0;
    const passo = (ora: number) => {
      if (!avvio) avvio = ora;
      const t = (ora - avvio) / 1000;
      // Il passo si misura sul tempo vero, non sul fotogramma: su uno
      // schermo a 120Hz l'onda deve scorrere alla stessa velocità, non
      // al doppio. Il taglio a 50ms evita lo scatto quando la scheda
      // torna in primo piano dopo essere stata sospesa.
      const dt = precedente ? Math.min(0.05, (ora - precedente) / 1000) : 0;
      precedente = ora;
      const giro = L + SBORDO * 2;
      for (const p of particelle) {
        p.x += p.v * dt;
        if (p.x > L + SBORDO) p.x -= giro;
        else if (p.x < -SBORDO) p.x += giro;
      }
      ultimoT = t;
      disegna(t);
      rafId = requestAnimationFrame(passo);
    };

    misura();
    // Un fotogramma subito, sempre: l'onda c'è già prima che il primo
    // rAF arrivi — e in una scheda aperta in secondo piano il rAF non
    // parte affatto finché non la si guarda. Chi ha chiesto meno
    // movimento vede questo e basta: una posizione armoniosa, ferma.
    disegna(menoMovimento ? 7.5 : 0);
    if (!menoMovimento) rafId = requestAnimationFrame(passo);

    const osservatore = new ResizeObserver(() => {
      misura();
      disegna(menoMovimento ? 7.5 : ultimoT);
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
      style={{ left: -SBORDO, right: -SBORDO, width: `calc(100% + ${SBORDO * 2}px)` }}
    />
  );
}
