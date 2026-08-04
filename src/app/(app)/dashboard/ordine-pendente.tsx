"use client";

import { useEffect, useState } from "react";
import { PackageCheck } from "lucide-react";

import { DIMENSIONE_LABEL, type Dimensione } from "@/lib/pricing";

type Ordine = {
  slug: string;
  nome: string;
  dimensione: Dimensione;
  formula: "mensile" | "annuale";
  stato: string;
  data: string;
};

/**
 * Mostra l'ordine completato nel funnel (stato "in attivazione"). Per ora
 * l'ordine vive in localStorage: con la fase 1 del database migrerà nelle
 * tabelle `module_activations` e `consents` e questo widget leggerà da lì.
 */
export function OrdinePendente() {
  const [ordine, setOrdine] = useState<Ordine | null>(null);

  // Lettura una tantum da localStorage: deve stare in un effect (SSR-safe),
  // il singolo setState al mount non genera cascate.
  useEffect(() => {
    try {
      const raw = localStorage.getItem("vz-ordine");
      // eslint-disable-next-line react-hooks/set-state-in-effect -- lettura una tantum al mount da localStorage (SSR-safe)
      if (raw) setOrdine(JSON.parse(raw));
    } catch {
      /* nessun ordine leggibile */
    }
  }, []);

  if (!ordine) return null;

  return (
    <div className="mt-6 rounded-xl border-2 border-pine bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-moss text-pine">
            <PackageCheck size={19} />
          </span>
          <div>
            <p className="text-sm font-semibold text-ink">{ordine.nome}</p>
            <p className="text-xs text-gray-warm">
              {DIMENSIONE_LABEL[ordine.dimensione]} · formula{" "}
              {ordine.formula === "mensile" ? "mensile" : "annuale"}
            </p>
          </div>
        </div>
        <span className="rounded-full bg-amber-soft px-3 py-1 text-xs font-medium text-amber-ink">
          In attivazione
        </span>
      </div>
      <p className="mt-3 text-xs text-gray-warm">
        Ordine ricevuto: nessun addebito effettuato. Ti ricontattiamo per
        l&apos;attivazione del pagamento e l&apos;avvio del servizio.
      </p>
    </div>
  );
}
