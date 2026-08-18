"use client";

import { useState } from "react";
import { Check, KeyRound, LogOut } from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { PASSWORD_REGOLE, passwordValida } from "@/lib/piva";
import { messaggioErroreAuth, type ErroreAuth } from "@/lib/auth-errori";

/**
 * CAMBIO PASSWORD E USCITA (SPEC §12.E).
 *
 * Il cambio password chiede prima quella attuale: `updateUser` da solo si
 * fida della sessione, e una sessione lasciata aperta su un computer
 * condiviso non deve bastare a prendersi l'account. La verifica avviene
 * ri-autenticando con le credenziali correnti prima di scrivere.
 */
export function AccountAzioni({ email }: { email: string }) {
  const [aperto, setAperto] = useState(false);
  const [attuale, setAttuale] = useState("");
  const [nuova, setNuova] = useState("");
  const [conferma, setConferma] = useState("");
  const [stato, setStato] = useState<"idle" | "invio" | "fatto">("idle");
  const [errore, setErrore] = useState<ErroreAuth | null>(null);

  async function cambia(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrore(null);

    if (!passwordValida(nuova)) {
      setErrore({
        messaggio: "La nuova password non rispetta ancora tutti i requisiti.",
        rimedio: "nessuno",
      });
      return;
    }
    if (nuova !== conferma) {
      setErrore({
        messaggio: "Le due password non coincidono: ricontrolla la seconda.",
        rimedio: "nessuno",
      });
      return;
    }

    setStato("invio");
    const supabase = createClient();

    // Prova del possesso: se la password attuale è sbagliata ci fermiamo qui.
    const { error: erroreVerifica } = await supabase.auth.signInWithPassword({
      email,
      password: attuale,
    });
    if (erroreVerifica) {
      setErrore({
        messaggio:
          "La password attuale non è corretta: senza quella non possiamo cambiarla.",
        rimedio: "nessuno",
      });
      setStato("idle");
      return;
    }

    const { error } = await supabase.auth.updateUser({ password: nuova });
    if (error) {
      setErrore(messaggioErroreAuth(error, "cambio"));
      setStato("idle");
      return;
    }
    setAttuale("");
    setNuova("");
    setConferma("");
    setStato("fatto");
    // Il modulo si richiude: la conferma vive lì, e restare davanti a tre
    // campi vuoti non direbbe a nessuno che l'operazione è riuscita.
    setAperto(false);
  }

  async function esci() {
    const supabase = createClient();
    await supabase.auth.signOut();
    // Ricarico pieno: il proxy deve vedere i cookie di sessione rimossi.
    window.location.assign("/login");
  }

  const input =
    "w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm outline-none transition-colors focus:border-mint";

  return (
    <div className="mt-4 border-t border-line pt-4">
      {!aperto ? (
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <button
            type="button"
            onClick={() => {
              setAperto(true);
              setStato("idle");
            }}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-pine hover:underline"
          >
            <KeyRound size={15} /> Cambia password
          </button>
          <button
            type="button"
            onClick={esci}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-warm hover:text-amber-ink"
          >
            <LogOut size={15} /> Esci dall&apos;ecosistema
          </button>
          {stato === "fatto" && (
            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-mint">
              <Check size={15} strokeWidth={3} /> Password aggiornata
            </span>
          )}
        </div>
      ) : (
        <form onSubmit={cambia} className="flex flex-col gap-1.5">
          <p className="text-sm font-semibold text-ink">Cambia password</p>
          <p className="mb-1 text-xs leading-relaxed text-gray-warm">
            Ti chiediamo prima quella attuale: è la prova che sei tu e non
            qualcuno che ha trovato il computer aperto.
          </p>

          <label htmlFor="attuale" className="text-sm text-gray-warm">
            Password attuale
          </label>
          <input
            id="attuale"
            type="password"
            required
            autoComplete="current-password"
            value={attuale}
            onChange={(e) => setAttuale(e.target.value)}
            className={input}
          />

          <label htmlFor="nuova" className="mt-2 text-sm text-gray-warm">
            Nuova password
          </label>
          <input
            id="nuova"
            type="password"
            required
            autoComplete="new-password"
            value={nuova}
            onChange={(e) => setNuova(e.target.value)}
            className={input}
          />
          <ul className="mt-1 space-y-1">
            {PASSWORD_REGOLE.map((r) => {
              const ok = r.test(nuova);
              return (
                <li
                  key={r.label}
                  className={
                    "flex items-center gap-1.5 text-xs " +
                    (ok ? "text-mint" : "text-gray-light")
                  }
                >
                  <Check size={13} strokeWidth={ok ? 3 : 2} />
                  {r.label}
                </li>
              );
            })}
          </ul>

          <label htmlFor="conferma" className="mt-2 text-sm text-gray-warm">
            Ripeti la nuova password
          </label>
          <input
            id="conferma"
            type="password"
            required
            autoComplete="new-password"
            value={conferma}
            onChange={(e) => setConferma(e.target.value)}
            className={input}
          />

          <div className="mt-3 flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={stato === "invio"}
              className="vz-press rounded-lg bg-pine px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
            >
              {stato === "invio" ? "Un istante…" : "Salva la nuova password"}
            </button>
            <button
              type="button"
              onClick={() => {
                setAperto(false);
                setErrore(null);
              }}
              className="text-sm text-gray-warm hover:text-pine"
            >
              Annulla
            </button>
          </div>

          {errore && (
            <p
              role="alert"
              className="mt-3 rounded-lg border border-amber-ink/30 bg-amber-soft px-3.5 py-2.5 text-sm leading-relaxed text-amber-ink"
            >
              {errore.messaggio}
            </p>
          )}
        </form>
      )}
    </div>
  );
}
