"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Motore dei reveal `.vz-reveal` (v. globals.css).
 *
 * Un solo IntersectionObserver per pagina, nessuna dipendenza. Regole:
 * - lo stato nascosto (`data-reveal="attesa"`) si applica SOLO qui, mai
 *   in CSS puro: se questo codice non gira, tutto resta visibile;
 * - un elemento già dentro il viewport al montaggio non viene nascosto:
 *   niente lampi di vuoto sopra la piega;
 * - con «riduci movimento» o senza IntersectionObserver non si fa nulla.
 *
 * Montato nel layout pubblico; si ri-esegue a ogni cambio di rotta.
 */
export function RevealObserver() {
  const pathname = usePathname();

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!("IntersectionObserver" in window)) return;

    // Prova di vitalità: per specifica l'observer consegna SUBITO una
    // callback con lo stato iniziale di ogni elemento osservato. Esistono
    // però ambienti in-app dove non consegna mai nulla (verificato: nemmeno
    // su un elemento fisso al centro dello schermo). Se entro il timeout
    // non è arrivato alcun segnale, si rivela tutto: mai contenuti mancanti.
    let vivo = false;

    const osservatore = new IntersectionObserver(
      (voci) => {
        vivo = true;
        for (const voce of voci) {
          if (!voce.isIntersecting) continue;
          (voce.target as HTMLElement).dataset.reveal = "visibile";
          osservatore.unobserve(voce.target);
        }
      },
      // Parte poco prima che l'elemento entri davvero in scena.
      { rootMargin: "0px 0px -8% 0px", threshold: 0.05 },
    );

    const paracadute = window.setTimeout(() => {
      if (vivo) return;
      osservatore.disconnect();
      for (const el of document.querySelectorAll<HTMLElement>(
        '.vz-reveal[data-reveal="attesa"]',
      )) {
        delete el.dataset.reveal;
      }
    }, 1500);

    const elementi =
      document.querySelectorAll<HTMLElement>(".vz-reveal");
    const margine = window.innerHeight * 0.92;
    for (const el of elementi) {
      // Già rivelato in una visita precedente della stessa pagina: fermo.
      if (el.dataset.reveal === "visibile") continue;
      // Sopra la piega: resta visibile da subito, senza animazione.
      if (el.getBoundingClientRect().top < margine) continue;
      el.dataset.reveal = "attesa";
      osservatore.observe(el);
    }

    return () => {
      window.clearTimeout(paracadute);
      osservatore.disconnect();
      // Mai lasciare elementi nascosti quando l'observer non c'è più.
      for (const el of document.querySelectorAll<HTMLElement>(
        '.vz-reveal[data-reveal="attesa"]',
      )) {
        delete el.dataset.reveal;
      }
    };
  }, [pathname]);

  return null;
}
