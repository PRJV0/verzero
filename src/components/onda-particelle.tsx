"use client";

import { useEffect, useRef } from "react";

import {
  MARGINE,
  MENTA,
  PINO,
  curva,
  mentosita,
  opacita,
  oscillazione,
  quante,
  semina,
  type Particella,
} from "@/lib/onda";

/**
 * ONDA DI PARTICELLE — lo sfondo dell'hero.
 *
 * Codice nostro, niente librerie: un canvas, un requestAnimationFrame e
 * la geometria che vive in `@/lib/onda`. Three.js o particles.js qui
 * sarebbero centinaia di KB per fare meno di così.
 *
 * Qui dentro resta solo il plumbing — contesto, buffer, ciclo, sprite —
 * perché le proprietà che contano (dove passa la fascia, la densità al
 * centro, quanta menta e dove, che nessuna particella si muova come
 * un'altra) si provano con `scripts/test-onda.mjs` invece che a occhio:
 * un difetto che compare ogni quaranta secondi, o solo a 2560px, non si
 * vede guardando lo schermo per dieci secondi.
 *
 * LE DUE DECISIONI CHE FANNO LA RESA.
 *
 * 1. NIENTE CERCHI DISEGNATI A OGNI FOTOGRAMMA. Ogni particella è
 *    un'immagine già pronta — un gradiente radiale renderizzato una
 *    volta sola, in otto gradazioni fra pino e menta — e disegnarla
 *    costa una `drawImage`. Un `arc()` con `createRadialGradient` per
 *    particella per fotogramma costerebbe molto di più e darebbe bordi
 *    netti e aliasati: i 60fps e i bordi morbidi sono la stessa scelta.
 *
 * 2. RISOLUZIONE VERA. Il buffer è grande quanto lo schermo (dpr fino a
 *    2), quindi su Retina non si scala nulla al ribasso e non si sgrana.
 *
 * Con «riduci movimento» l'onda si disegna una volta e resta ferma.
 */

/** Gradazioni pre-renderizzate fra pino e menta. */
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
  // Il nucleo pieno è piccolo e la coda è lunga: è ciò che rende il
  // bordo morbido invece che tagliato.
  grad.addColorStop(0, `rgba(${r},${v},${b},1)`);
  grad.addColorStop(0.35, `rgba(${r},${v},${b},0.55)`);
  grad.addColorStop(0.7, `rgba(${r},${v},${b},0.12)`);
  grad.addColorStop(1, `rgba(${r},${v},${b},0)`);
  g.fillStyle = grad;
  g.fillRect(0, 0, LATO_SPRITE, LATO_SPRITE);
  return c;
}

export function OndaParticelle({ className = "" }: { className?: string }) {
  const riferimento = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const tela = riferimento.current;
    if (!tela) return;
    const ctx = tela.getContext("2d", { alpha: false });
    if (!ctx) return;

    const menoMovimento =
      typeof matchMedia === "function" &&
      matchMedia("(prefers-reduced-motion: reduce)").matches;

    const sprites = Array.from({ length: GRADAZIONI }, (_, i) => {
      const k = i / (GRADAZIONI - 1);
      return sprite([
        Math.round(PINO[0] + (MENTA[0] - PINO[0]) * k),
        Math.round(PINO[1] + (MENTA[1] - PINO[1]) * k),
        Math.round(PINO[2] + (MENTA[2] - PINO[2]) * k),
      ]);
    });

    let L = 0;
    let H = 0;
    let particelle: Particella[] = [];

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
      // Assegnare width/height AZZERA il buffer, e un contesto senza
      // canale alfa si azzera a NERO PIENO. Se il primo disegno arrivasse
      // solo dal requestAnimationFrame — che in una scheda aperta in
      // secondo piano non parte finché non la si guarda — l'hero
      // resterebbe un rettangolo nero. Quindi bianco subito, qui.
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, L, H);
      particelle = semina(quante(L), L);
    };

    const disegna = (t: number) => {
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, L, H);
      for (const p of particelle) {
        const alfa = opacita(p, L);
        if (alfa <= 0.004) continue;
        // L'ampiezza dell'oscillazione cresce verso il centro e si
        // smorza ai lati, con lo stesso profilo della densità.
        const smorzo = 0.35 + 0.65 * Math.min(1, alfa / p.a);
        const y =
          curva(p.x, t, L, H) + p.dv + oscillazione(p, t) * p.amp * smorzo;
        const g = sprites[Math.round(mentosita(p, L) * (GRADAZIONI - 1))];
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
      for (const p of particelle) {
        p.x += p.v * dt;
        if (p.x > L + MARGINE) p.x -= L + MARGINE * 2;
      }
      ultimoT = t;
      disegna(t);
      rafId = requestAnimationFrame(passo);
    };

    misura();
    // Un fotogramma subito, sempre: l'onda c'è già prima che il primo
    // rAF arrivi, e chi ha chiesto meno movimento vede questo e basta.
    disegna(0);
    if (!menoMovimento) rafId = requestAnimationFrame(passo);

    const osservatore = new ResizeObserver(() => {
      misura();
      disegna(ultimoT);
    });
    osservatore.observe(tela);

    return () => {
      cancelAnimationFrame(rafId);
      osservatore.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={riferimento}
      aria-hidden
      className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}
    />
  );
}
