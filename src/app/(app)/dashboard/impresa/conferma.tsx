"use client";

import { useEffect, useState, useTransition } from "react";
import { Check, X } from "lucide-react";

import { confermaCampo, rifiutaCampo } from "./azioni";

/**
 * LA CONFERMA DI UN DATO (brief §3.5): gesto singolo, risposta immediata
 * e fisica — la spunta si disegna, la riga cambia stato, il contatore
 * scende.
 *
 * Perché non basta il form con l'azione server: fra il click e la
 * revalidazione passa un viaggio di rete, e in quel tempo non succede
 * niente. Il click deve rispondere subito; il server conferma dopo, e se
 * qualcosa andasse storto la revalidazione rimette la verità al suo
 * posto — l'ottimismo dura al massimo un istante e non inventa nulla.
 *
 * L'evento sul window è il modo più leggero perché il contatore in cima
 * alla pagina scenda insieme: nessun contesto React, nessuno stato
 * globale, e la pagina resta un server component.
 */

export const EVENTO_CONFERMA = "vz:campo-confermato";

export function AzioniCampo({ chiave }: { chiave: string }) {
  const [esito, setEsito] = useState<null | "confermato" | "respinto">(null);
  const [, avvia] = useTransition();

  if (esito === "confermato") {
    return (
      <span className="mt-0.5 inline-flex items-center gap-1 rounded-full bg-mint/15 px-2 py-0.5 text-[10px] font-semibold text-mint">
        <Check
          size={11}
          strokeWidth={3}
          className="vz-spunta"
          aria-hidden
        />
        Confermato da te
      </span>
    );
  }
  if (esito === "respinto") {
    return (
      <span className="mt-0.5 inline-flex items-center gap-1 rounded-full bg-paper px-2 py-0.5 text-[10px] font-semibold text-gray-warm">
        <X size={11} strokeWidth={3} aria-hidden /> Proposta respinta da te
      </span>
    );
  }

  return (
    <div className="mt-0.5 flex flex-wrap justify-end gap-1.5">
      <button
        type="button"
        onClick={() => {
          setEsito("confermato");
          window.dispatchEvent(new CustomEvent(EVENTO_CONFERMA));
          avvia(() => {
            void confermaCampo(chiave);
          });
        }}
        className="vz-interattivo inline-flex min-h-11 items-center gap-1 rounded-lg border border-pine px-3 py-1 text-[11px] font-semibold text-pine hover:bg-moss sm:min-h-0"
      >
        <Check size={11} strokeWidth={3} /> È corretto
      </button>
      {/* Il rifiuto è alla pari della conferma: senza, «da confermare»
          sarebbe solo un rinvio. */}
      <button
        type="button"
        onClick={() => {
          setEsito("respinto");
          window.dispatchEvent(new CustomEvent(EVENTO_CONFERMA));
          avvia(() => {
            void rifiutaCampo(chiave);
          });
        }}
        className="vz-interattivo inline-flex min-h-11 items-center gap-1 rounded-lg border border-line px-3 py-1 text-[11px] font-medium text-gray-warm hover:border-amber-ink/50 hover:text-amber-ink sm:min-h-0"
      >
        <X size={11} strokeWidth={3} /> Non è corretto
      </button>
    </div>
  );
}

/**
 * Il contatore che scende. Parte dal numero vero calcolato sul server e
 * si abbassa a ogni decisione presa in pagina: se il conteggio restasse
 * fermo mentre le righe cambiano, l'avviso in cima direbbe una cosa e la
 * pagina un'altra.
 */
export function ContatoreDaConfermare({ iniziale }: { iniziale: number }) {
  const [quanti, setQuanti] = useState(iniziale);

  useEffect(() => {
    const giu = () => setQuanti((n) => Math.max(0, n - 1));
    window.addEventListener(EVENTO_CONFERMA, giu);
    return () => window.removeEventListener(EVENTO_CONFERMA, giu);
  }, []);

  if (quanti === 0) {
    return (
      <p className="vz-stato flex items-center gap-2 rounded-xl border border-mint/40 bg-mint/5 px-4 py-3 text-sm leading-relaxed text-pine-dark">
        <Check size={15} strokeWidth={3} className="vz-spunta text-mint" />
        Hai deciso su tutto: nessun dato aspetta più la tua conferma.
      </p>
    );
  }

  return (
    <p className="vz-stato rounded-xl border border-amber-ink/25 bg-amber-soft/60 px-4 py-3 text-sm leading-relaxed text-amber-ink">
      <strong className="font-semibold tabular-nums">
        {quanti}{" "}
        {quanti === 1
          ? "dato aspetta la tua conferma"
          : "dati aspettano la tua conferma"}
      </strong>
      : li abbiamo recuperati noi, ma entrano nei tuoi documenti solo quando
      ci dici che sono giusti.
    </p>
  );
}
