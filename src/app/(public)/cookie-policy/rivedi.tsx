"use client";

import { SlidersHorizontal } from "lucide-react";

import { EVENTO_PREFERENZE } from "@/components/cookie-banner";

/**
 * Riapre il pannello delle preferenze dalla cookie policy. La revoca
 * dev'essere facile quanto il consenso: se non lo fosse, la scelta non
 * sarebbe libera — e un consenso non libero non è un consenso.
 */
export function PulsanteRivediCookie() {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event(EVENTO_PREFERENZE))}
      className="vz-press mt-2 inline-flex items-center gap-2 rounded-lg bg-pine px-4 py-2.5 text-sm font-semibold text-white"
    >
      <SlidersHorizontal size={15} /> Rivedi le tue preferenze
    </button>
  );
}
