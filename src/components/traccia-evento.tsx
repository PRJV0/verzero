"use client";

import { useEffect, useRef } from "react";

import { traccia, type NomeEvento } from "@/lib/eventi";

/**
 * Registra un evento all'apertura della pagina. Va montato dentro una
 * pagina server: è l'unico pezzo che deve girare nel browser, perché è
 * lì che l'utente esiste.
 *
 * Il riferimento `giaFatto` serve contro il doppio montaggio in sviluppo
 * (React in modalità rigorosa monta due volte): senza, ogni pagina vista
 * conterebbe due volte e i numeri direbbero il falso.
 */
export function TracciaApertura({
  evento,
  dettagli,
}: {
  evento: NomeEvento;
  dettagli?: Record<string, string | number>;
}) {
  const giaFatto = useRef(false);
  useEffect(() => {
    if (giaFatto.current) return;
    giaFatto.current = true;
    traccia(evento, dettagli);
    // Le dipendenze restano vuote di proposito: l'apertura è una sola.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}
