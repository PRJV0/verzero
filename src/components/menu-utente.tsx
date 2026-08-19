"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, ChevronDown, LogOut } from "lucide-react";

import { createClient } from "@/lib/supabase/client";

/**
 * L'indicatore di sessione nell'header pubblico.
 *
 * Chi è già dentro non deve vedere «Accedi»: vede il proprio nome e da
 * lì raggiunge il portale o esce. Lo stato arriva già risolto dal
 * server, quindi è corretto al primo fotogramma — qui ci occupiamo solo
 * dell'apertura del menu.
 */
export function MenuUtente({
  nome,
  iniziale,
  email,
}: {
  nome: string | null;
  iniziale: string;
  email: string | null;
}) {
  const [aperto, setAperto] = useState(false);
  const [uscendo, setUscendo] = useState(false);
  const contenitore = useRef<HTMLDivElement>(null);

  // Chiusura con Esc e col tocco fuori: le stesse regole del menu mobile.
  useEffect(() => {
    if (!aperto) return;
    const suTasto = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAperto(false);
    };
    const suClick = (e: MouseEvent) => {
      if (!contenitore.current?.contains(e.target as Node)) setAperto(false);
    };
    document.addEventListener("keydown", suTasto);
    document.addEventListener("mousedown", suClick);
    return () => {
      document.removeEventListener("keydown", suTasto);
      document.removeEventListener("mousedown", suClick);
    };
  }, [aperto]);

  async function esci() {
    setUscendo(true);
    await createClient().auth.signOut();
    // Ricarico pieno: il proxy e le pagine server devono vedere i cookie
    // di sessione rimossi, altrimenti l'header resterebbe indietro.
    window.location.assign("/");
  }

  const etichetta = nome ?? email ?? "Il tuo ecosistema";

  return (
    <div ref={contenitore} className="relative">
      <button
        type="button"
        onClick={() => setAperto((a) => !a)}
        aria-expanded={aperto}
        aria-haspopup="menu"
        className="flex items-center gap-2 rounded-lg border border-line bg-white py-1.5 pl-1.5 pr-2.5 text-xs font-medium text-ink transition-colors hover:border-pine/40"
      >
        <span
          aria-hidden
          className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-pine font-display text-sm text-white"
        >
          {iniziale}
        </span>
        <span className="hidden max-w-[11rem] truncate sm:inline">
          {etichetta}
        </span>
        <ChevronDown
          size={13}
          className={
            "shrink-0 text-gray-warm transition-transform " +
            (aperto ? "rotate-180" : "")
          }
        />
      </button>

      {aperto && (
        <div
          role="menu"
          className="absolute right-0 z-40 mt-2 w-64 overflow-hidden rounded-xl border border-line bg-white shadow-soft"
        >
          <div className="border-b border-line bg-paper px-4 py-3">
            <p className="truncate text-sm font-semibold text-ink">
              {etichetta}
            </p>
            {email && nome && (
              <p className="truncate text-xs text-gray-warm">{email}</p>
            )}
          </div>
          <Link
            href="/dashboard"
            role="menuitem"
            onClick={() => setAperto(false)}
            className="flex items-center justify-between gap-2 px-4 py-3 text-sm font-medium text-pine hover:bg-moss/50"
          >
            Vai al mio ecosistema <ArrowRight size={15} />
          </Link>
          <button
            type="button"
            role="menuitem"
            onClick={esci}
            disabled={uscendo}
            className="flex w-full items-center justify-between gap-2 border-t border-line px-4 py-3 text-left text-sm text-gray-warm hover:bg-paper hover:text-amber-ink disabled:opacity-60"
          >
            {uscendo ? "Un istante…" : "Esci"} <LogOut size={15} />
          </button>
        </div>
      )}
    </div>
  );
}
