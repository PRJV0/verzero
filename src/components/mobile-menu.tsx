"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogIn, Menu, X } from "lucide-react";

/**
 * Menu di navigazione sotto i 768px (SPEC §12.K): icona in header, pannello
 * a scomparsa con tutte le voci e "Accedi" in evidenza.
 *
 * Accessibilità: aria-expanded sul bottone, focus trap nel pannello,
 * chiusura con Esc e con il tap fuori, focus restituito al bottone alla
 * chiusura, scroll della pagina bloccato finché il pannello è aperto.
 */
export function MobileMenu({
  voci,
}: {
  voci: { label: string; href: string }[];
}) {
  const [aperto, setAperto] = useState(false);
  const pannello = useRef<HTMLDivElement>(null);
  const bottone = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();
  const idPannello = useId();

  // Navigare chiude il menu: ogni voce lo chiude al click (le ancore nella
  // stessa pagina non cambiano rotta, quindi l'evento è più affidabile
  // di un effetto sul pathname).
  const chiudi = () => setAperto(false);

  useEffect(() => {
    if (!aperto) return;
    const el = pannello.current;
    if (!el) return;

    // Blocco dello scroll sotto il pannello.
    const overflowPrima = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // Focus sul primo link appena aperto.
    const focusabili = () =>
      Array.from(
        el.querySelectorAll<HTMLElement>("a[href], button:not([disabled])"),
      );
    focusabili()[0]?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setAperto(false);
        bottone.current?.focus();
        return;
      }
      if (e.key !== "Tab") return;
      // Focus trap: Tab e Shift+Tab girano dentro il pannello.
      const lista = focusabili();
      if (lista.length === 0) return;
      const primo = lista[0];
      const ultimo = lista[lista.length - 1];
      if (e.shiftKey && document.activeElement === primo) {
        e.preventDefault();
        ultimo.focus();
      } else if (!e.shiftKey && document.activeElement === ultimo) {
        e.preventDefault();
        primo.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = overflowPrima;
    };
  }, [aperto]);

  return (
    <div className="md:hidden">
      <button
        ref={bottone}
        type="button"
        aria-expanded={aperto}
        aria-controls={idPannello}
        aria-label={aperto ? "Chiudi il menu" : "Apri il menu"}
        onClick={() => setAperto((a) => !a)}
        className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-line text-ink transition-colors hover:border-pine/40"
      >
        {aperto ? <X size={19} /> : <Menu size={19} />}
      </button>

      {aperto && (
        <>
          {/* Velo: il tap fuori chiude. È decorativo, la chiusura
              accessibile passa da Esc e dal bottone con aria-label. */}
          <div
            aria-hidden
            onClick={() => setAperto(false)}
            className="fixed inset-0 top-[57px] z-40 bg-ink/30"
          />
          <div
            ref={pannello}
            id={idPannello}
            role="dialog"
            aria-modal="true"
            aria-label="Menu di navigazione"
            className="fixed inset-x-0 top-[57px] z-50 border-b border-line bg-white px-5 pb-5 pt-2 shadow-lift"
          >
            <nav aria-label="Navigazione principale" className="flex flex-col">
              {voci.map((v) => (
                <Link
                  key={v.href}
                  href={v.href}
                  onClick={chiudi}
                  aria-current={pathname === v.href ? "page" : undefined}
                  className={
                    "border-b border-line/60 py-3 text-sm transition-colors hover:text-pine " +
                    (pathname === v.href
                      ? "font-semibold text-pine"
                      : "text-ink")
                  }
                >
                  {v.label}
                </Link>
              ))}
            </nav>
            {/* Accedi in evidenza (SPEC §12.K): l'ingresso all'ecosistema. */}
            <Link
              href="/login"
              onClick={chiudi}
              className="mt-4 flex items-center justify-center gap-2 rounded-lg bg-pine px-4 py-3 text-sm font-medium text-white"
            >
              <LogIn size={16} /> Accedi al tuo ecosistema
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
