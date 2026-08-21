"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

import { attivaReveal } from "@/lib/reveal";

/**
 * Motore dei reveal `.vz-reveal` di pagina.
 *
 * La logica — taratura, scaglionamento, reti di sicurezza — vive in
 * `@/lib/reveal`, perché la usa anche lo scrollytelling quando sullo
 * schermo stretto rinuncia alla narrazione. Qui resta solo il raccordo
 * col ciclo di vita di React.
 *
 * Regola invariata: lo stato nascosto si applica SOLO da JavaScript, mai
 * in CSS puro. Se questo codice non gira, tutto resta visibile.
 */
export function RevealObserver() {
  const pathname = usePathname();

  useEffect(
    () =>
      attivaReveal(
        Array.from(document.querySelectorAll<HTMLElement>(".vz-reveal")),
      ),
    [pathname],
  );

  return null;
}
