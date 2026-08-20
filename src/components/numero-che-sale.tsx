"use client";

import { useEffect, useRef, useState } from "react";

/**
 * IL NUMERO CHE SALE (brief §3.3).
 *
 * Micro-momento, altissima soddisfazione: la percentuale non «è» — ci
 * arriva, sotto gli occhi di chi ha appena caricato un documento.
 *
 * Due scelte che lo rendono onesto invece che decorativo:
 *
 *  1. PARTE DA DOVE ERAVAMO. Se l'ultima volta la bozza era al 33% e
 *     ora è al 42%, l'anello sale da 33 a 42: il movimento misura il
 *     progresso vero, non fa scena da zero ogni volta. Il valore
 *     precedente sta in localStorage sotto una chiave per anello.
 *  2. IL VALORE VERO È GIÀ NEL DOCUMENTO. Il render iniziale mostra la
 *     percentuale finale: senza JS, con «riduci movimento» o se qualcosa
 *     va storto, si legge il numero giusto. L'animazione è un di più che
 *     parte dopo, mai una condizione per vedere il dato.
 */
export function NumeroCheSale({
  valore,
  chiave,
  durata = 700,
}: {
  valore: number;
  /** Identifica l'anello fra un accesso e l'altro (es. lo slug del percorso). */
  chiave?: string;
  durata?: number;
}) {
  const [mostrato, setMostrato] = useState(valore);
  const fatto = useRef(false);

  useEffect(() => {
    if (fatto.current) return;
    fatto.current = true;

    const menoMovimento =
      typeof matchMedia === "function" &&
      matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (menoMovimento) return;

    const memoria = chiave ? `vz-anello-${chiave}` : null;
    let da = 0;
    try {
      if (memoria) {
        const salvato = Number(localStorage.getItem(memoria));
        if (Number.isFinite(salvato) && salvato >= 0 && salvato <= 100) {
          da = salvato;
        }
      }
    } catch {
      /* storage negato: si parte da zero, che è comunque vero all'inizio */
    }

    // Nessun movimento se non c'è niente da raccontare: un anello che
    // «sale» da 42 a 42 sarebbe un effetto per l'effetto.
    if (da === valore) return;

    const inizio = performance.now();
    let frame = 0;
    const passo = (ora: number) => {
      const avanzamento = Math.min(1, (ora - inizio) / durata);
      // Stessa curva del resto del prodotto, in forma esplicita.
      const morbido = 1 - Math.pow(1 - avanzamento, 3);
      setMostrato(Math.round(da + (valore - da) * morbido));
      if (avanzamento < 1) frame = requestAnimationFrame(passo);
    };
    // Nessun setState sincrono qui: il primo fotogramma di `passo` mette
    // già il valore di partenza. Nel frattempo resta scritto il numero
    // vero, che è il fallback giusto in ogni caso.
    frame = requestAnimationFrame(passo);

    try {
      if (memoria) localStorage.setItem(memoria, String(valore));
    } catch {
      /* la memoria è un lusso: senza, si riparte da zero la volta dopo */
    }

    return () => cancelAnimationFrame(frame);
  }, [valore, chiave, durata]);

  return <>{mostrato}%</>;
}
