"use client";

import { useEffect, useRef } from "react";

import { canaleAiDa } from "@/lib/ai-canali";
import { EVENTI, traccia } from "@/lib/eventi";

/** Chiave di sessione: una visita da un assistente si conta una volta. */
const SEGNO = "vz-arrivo-ai";

/**
 * RICONOSCE CHI ARRIVA DA UN ASSISTENTE AI.
 *
 * La domanda a cui deve rispondere è una sola: il canale porta persone,
 * o solo scansioni? Un crawler lo vede il server (`accessi-ai.ts`); una
 * persona che clicca un link dentro una risposta di ChatGPT arriva con un
 * browser vero e un referrer, e la si riconosce solo qui.
 *
 * UNA VOLTA PER SESSIONE. Il referrer resta attaccato alla prima pagina,
 * ma navigando dentro il sito l'evento si ripeterebbe a ogni cambio di
 * rotta: conteremmo pagine viste al posto di arrivi. `sessionStorage`
 * chiude la questione e si svuota da solo alla chiusura della scheda.
 *
 * NIENTE COOKIE, NIENTE CONSENSO. `sessionStorage` con un segno di
 * presenza non profila nessuno, e l'evento registra il canale — non chi
 * è arrivato. È lo stesso perimetro dichiarato nella cookie policy.
 */
export function RiconosciArrivoAi() {
  const fatto = useRef(false);
  useEffect(() => {
    if (fatto.current) return;
    fatto.current = true;
    try {
      if (sessionStorage.getItem(SEGNO)) return;
      const canale = canaleAiDa(document.referrer);
      if (!canale) return;
      sessionStorage.setItem(SEGNO, canale);
      traccia(EVENTI.ARRIVO_AI, { canale });
    } catch {
      // Modalità private con storage bloccato: si rinuncia al conteggio,
      // non alla pagina.
    }
  }, []);
  return null;
}
