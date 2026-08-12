"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Numero che conta all'ingresso in viewport (rifinitura sezioni scure).
 *
 * Regole di sicurezza, nell'ordine:
 * - il valore FINALE è renderizzato da subito (anche lato server): senza
 *   JS, con «riduci movimento» o con un observer morto non manca niente;
 * - l'animazione parte solo quando l'IntersectionObserver dà prova di
 *   vita e l'elemento entra davvero in scena;
 * - easing in uscita, durata breve: un dettaglio, non uno spettacolo.
 */
export function ContaNumero({
  valore,
  durata = 700,
}: {
  valore: number;
  durata?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [mostrato, setMostrato] = useState(valore);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!("IntersectionObserver" in window)) return;
    const el = ref.current;
    if (!el) return;

    let raf = 0;
    const io = new IntersectionObserver(
      (voci) => {
        if (!voci.some((v) => v.isIntersecting)) return;
        io.disconnect();
        const t0 = performance.now();
        const passo = (t: number) => {
          const p = Math.min(1, (t - t0) / durata);
          const ease = 1 - Math.pow(1 - p, 3);
          setMostrato(Math.round(valore * ease));
          if (p < 1) raf = requestAnimationFrame(passo);
        };
        raf = requestAnimationFrame(passo);
      },
      { threshold: 0.4 },
    );
    io.observe(el);

    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
      setMostrato(valore);
    };
  }, [valore, durata]);

  return (
    <span ref={ref} className="tabular-nums">
      {mostrato.toLocaleString("it-IT")}
    </span>
  );
}
