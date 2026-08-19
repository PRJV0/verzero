"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Cookie, X } from "lucide-react";

import {
  CATEGORIE_DESCRITTE,
  COOKIE_CONSENSO,
  CONSENSO_PREDEFINITO,
  DURATA_CONSENSO_GIORNI,
  serializzaConsenso,
  type CategorieConsenso,
} from "@/lib/consenso-cookie";

/** Evento con cui il footer riapre le preferenze: la scelta è revocabile. */
export const EVENTO_PREFERENZE = "vz:preferenze-cookie";

/**
 * BANNER DI CONSENSO.
 *
 * Tre regole di forma, che sono anche di sostanza:
 *  1. «Accetta» e «Rifiuta» hanno lo STESSO peso visivo. Un rifiuto più
 *     piccolo o più pallido è un consenso estorto, e vale meno di zero.
 *  2. Chiudere senza scegliere non equivale ad accettare: il banner non
 *     ha una X che «acconsente in silenzio».
 *  3. Nessuno script non necessario parte prima della scelta — oggi è
 *     facile, perché non ne abbiamo nessuno.
 */
export function CookieBanner({ giaScelto }: { giaScelto: boolean }) {
  const [visibile, setVisibile] = useState(!giaScelto);
  const [preferenze, setPreferenze] = useState(false);
  const [scelte, setScelte] = useState<CategorieConsenso>(CONSENSO_PREDEFINITO);

  const salva = useCallback((categorie: CategorieConsenso) => {
    const valore = serializzaConsenso(categorie);
    document.cookie = [
      `${COOKIE_CONSENSO}=${valore}`,
      "path=/",
      `max-age=${DURATA_CONSENSO_GIORNI * 24 * 60 * 60}`,
      "SameSite=Lax",
      location.protocol === "https:" ? "Secure" : "",
    ]
      .filter(Boolean)
      .join("; ");
    setVisibile(false);
    setPreferenze(false);
  }, []);

  // Il footer può riaprire le preferenze in qualunque momento.
  useEffect(() => {
    const riapri = () => {
      setPreferenze(true);
      setVisibile(true);
    };
    window.addEventListener(EVENTO_PREFERENZE, riapri);
    return () => window.removeEventListener(EVENTO_PREFERENZE, riapri);
  }, []);

  useEffect(() => {
    if (!preferenze) return;
    const suEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPreferenze(false);
    };
    document.addEventListener("keydown", suEsc);
    return () => document.removeEventListener("keydown", suEsc);
  }, [preferenze]);

  if (!visibile) return null;

  const bottone =
    "w-full rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors sm:w-auto";

  if (preferenze) {
    return (
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="pref-cookie-h"
        className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-4 sm:items-center"
      >
        <div className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-line bg-white p-6 shadow-soft">
          <div className="flex items-start justify-between gap-4">
            <h2
              id="pref-cookie-h"
              className="font-display text-2xl text-ink"
            >
              Le tue preferenze
            </h2>
            <button
              type="button"
              onClick={() => setPreferenze(false)}
              aria-label="Chiudi le preferenze senza salvare"
              className="rounded-lg p-1 text-gray-warm hover:bg-paper"
            >
              <X size={18} />
            </button>
          </div>

          <p className="mt-2 text-sm leading-relaxed text-gray-warm">
            Oggi usiamo solo cookie necessari. Le altre categorie restano
            qui perché tu possa decidere in anticipo: se un giorno le
            attiveremo, varrà la scelta che fai adesso.
          </p>

          <ul className="mt-4 space-y-3">
            {CATEGORIE_DESCRITTE.map((c) => {
              const attiva = c.obbligatorio || scelte[c.chiave] === true;
              return (
                <li
                  key={c.chiave}
                  className="rounded-xl border border-line p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-ink">
                        {c.titolo}
                      </p>
                      <p className="mt-1 text-sm leading-relaxed text-gray-warm">
                        {c.testo}
                      </p>
                      <p className="mt-1 text-xs text-gray-light">{c.esempi}</p>
                    </div>
                    {c.obbligatorio ? (
                      <span className="shrink-0 rounded-full bg-moss px-2.5 py-1 text-[11px] font-semibold text-pine">
                        Sempre attivi
                      </span>
                    ) : (
                      <label className="flex shrink-0 cursor-pointer items-center gap-2 text-xs text-gray-warm">
                        <input
                          type="checkbox"
                          checked={attiva}
                          onChange={(e) =>
                            setScelte((s) => ({
                              ...s,
                              [c.chiave]: e.target.checked,
                            }))
                          }
                          className="h-4 w-4 accent-pine"
                        />
                        {attiva ? "Attivi" : "Disattivi"}
                      </label>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>

          <div className="mt-5 flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={() => salva(scelte)}
              className={`${bottone} bg-pine text-white`}
            >
              Salva le preferenze
            </button>
            <button
              type="button"
              onClick={() =>
                salva({ necessari: true, misurazione: false, marketing: false })
              }
              className={`${bottone} border border-pine text-pine hover:bg-moss`}
            >
              Solo i necessari
            </button>
          </div>

          <p className="mt-4 text-xs leading-relaxed text-gray-light">
            Puoi cambiare idea quando vuoi dal link «Cookie» in fondo a ogni
            pagina. Il dettaglio è nella{" "}
            <Link href="/cookie-policy" className="text-pine underline">
              cookie policy
            </Link>
            .
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      role="region"
      aria-label="Informativa sui cookie"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-line bg-white p-4 shadow-soft sm:p-5"
    >
      <div className="mx-auto flex max-w-5xl flex-col gap-4 lg:flex-row lg:items-center">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <Cookie size={20} className="mt-0.5 shrink-0 text-pine" />
          <p className="text-sm leading-relaxed text-gray-warm">
            <strong className="font-semibold text-ink">
              Oggi usiamo solo cookie necessari
            </strong>{" "}
            — quelli che tengono aperta la tua sessione. Non abbiamo
            strumenti di statistica né di profilazione. Se un giorno li
            aggiungeremo, non partiranno senza il tuo sì: decidi adesso, e
            cambia idea quando vuoi.{" "}
            <Link href="/cookie-policy" className="text-pine underline">
              Cookie policy
            </Link>{" "}
            ·{" "}
            <Link href="/privacy" className="text-pine underline">
              Privacy
            </Link>
          </p>
        </div>

        {/* Accetta e rifiuta hanno lo stesso peso: è il punto. */}
        <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={() =>
              salva({ necessari: true, misurazione: true, marketing: true })
            }
            className={`${bottone} bg-pine text-white`}
          >
            Accetta tutto
          </button>
          <button
            type="button"
            onClick={() =>
              salva({ necessari: true, misurazione: false, marketing: false })
            }
            className={`${bottone} bg-pine text-white`}
          >
            Rifiuta i non necessari
          </button>
          <button
            type="button"
            onClick={() => setPreferenze(true)}
            className={`${bottone} border border-line text-gray-warm hover:border-pine/40 hover:text-pine`}
          >
            Preferenze
          </button>
        </div>
      </div>
    </div>
  );
}

/** Il comando del footer che riapre le preferenze: la scelta è revocabile. */
export function LinkPreferenzeCookie({
  className = "",
}: {
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event(EVENTO_PREFERENZE))}
      className={className}
    >
      Cookie
    </button>
  );
}
