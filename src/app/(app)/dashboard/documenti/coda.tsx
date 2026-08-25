"use client";

import { useEffect, useState, useTransition } from "react";
import { Clock } from "lucide-react";

import { drenaCodaAzione } from "./azioni";

/**
 * LA CODA CHE SI SVUOTA DA SOLA.
 *
 * Quando un'organizzazione supera la dotazione di uso corretto, le
 * letture entrano in coda invece di partire subito. «Bassa priorità»
 * qui è letterale e onesta: un documento per visita, il più vecchio
 * prima, e solo mentre qualcuno sta guardando l'archivio.
 *
 * Non è un blocco e non deve sembrarlo: si vede quanti documenti
 * aspettano, si vede che il numero cala, e non c'è nulla da fare.
 */
export function CodaInLavorazione({ quanti }: { quanti: number }) {
  // `key` sul componente chiamante non serve: il conteggio arriva dal
  // server a ogni ricarica, e qui si tiene solo quanti ne abbiamo
  // lavorati DA ALLORA. Sincronizzare lo stato con la prop dentro un
  // effetto sarebbe un doppio rendering per niente.
  const [fatti, setFatti] = useState(0);
  const [inCorso, avvia] = useTransition();
  const restanti = Math.max(0, quanti - fatti);

  useEffect(() => {
    if (restanti <= 0 || inCorso) return;
    // Un documento per volta, con una pausa: la coda non deve rubare la
    // pagina a chi la sta usando.
    const attesa = setTimeout(() => {
      avvia(async () => {
        const esito = await drenaCodaAzione();
        if (esito.fatto) setFatti((f) => f + 1);
      });
    }, 1500);
    return () => clearTimeout(attesa);
  }, [restanti, inCorso]);

  if (restanti <= 0) return null;

  return (
    <p
      className="mt-3 flex items-start gap-2.5 rounded-xl border border-line bg-paper px-4 py-3 text-sm leading-relaxed text-gray-warm"
      role="status"
    >
      <Clock size={16} className="mt-0.5 shrink-0 text-gray-light" aria-hidden />
      <span>
        <strong className="font-semibold text-ink">
          {restanti} {restanti === 1 ? "documento è" : "documenti sono"} in coda
        </strong>
        : li stiamo leggendo uno alla volta e arrivano tutti. Puoi lasciare
        aperta questa pagina o tornare più tardi — non devi fare nulla.
      </span>
    </p>
  );
}
