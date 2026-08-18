"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, CircleAlert, ShieldCheck } from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { PASSWORD_REGOLE, passwordValida } from "@/lib/piva";
import { messaggioErroreAuth, type ErroreAuth } from "@/lib/auth-errori";

/**
 * PASSWORD DIMENTICATA — passo 2 di 2 (SPEC §12.E).
 *
 * Ci si arriva solo con la sessione aperta dal link di recupero (la
 * callback la stabilisce e ci manda qui). Se quella sessione non c'è, il
 * link era scaduto o già usato: lo diciamo e rimandiamo a richiederne uno,
 * mai una pagina muta.
 */
export function NuovaPasswordForm() {
  const [sessione, setSessione] = useState<"verifica" | "valida" | "assente">(
    "verifica",
  );
  const [password, setPassword] = useState("");
  const [conferma, setConferma] = useState("");
  const [stato, setStato] = useState<"idle" | "invio" | "fatto">("idle");
  const [errore, setErrore] = useState<ErroreAuth | null>(null);

  useEffect(() => {
    const supabase = createClient();
    // Il link di recupero arriva già scambiato in sessione dalla callback:
    // qui verifichiamo soltanto che ci sia davvero un utente.
    supabase.auth.getUser().then(({ data }) => {
      setSessione(data.user ? "valida" : "assente");
    });
  }, []);

  async function salva(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!passwordValida(password)) {
      setErrore({
        messaggio: "La password non rispetta ancora tutti i requisiti qui sotto.",
        rimedio: "nessuno",
      });
      return;
    }
    if (password !== conferma) {
      setErrore({
        messaggio: "Le due password non coincidono: ricontrolla la seconda.",
        rimedio: "nessuno",
      });
      return;
    }
    setStato("invio");
    setErrore(null);

    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setErrore(messaggioErroreAuth(error, "reset"));
      setStato("idle");
      return;
    }
    setStato("fatto");
  }

  const input =
    "w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm outline-none transition-colors focus:border-mint";

  if (sessione === "verifica") {
    return (
      <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-5 py-12">
        <p className="text-center text-sm text-gray-warm">
          Verifica del link in corso…
        </p>
      </main>
    );
  }

  if (sessione === "assente") {
    return (
      <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-5 py-12">
        <div className="rounded-2xl border border-line bg-white p-6 text-center">
          <span className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-xl bg-amber-soft text-amber-ink">
            <CircleAlert size={22} />
          </span>
          <h1 className="mt-4 font-display text-2xl text-ink">
            Il link non è più valido
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-gray-warm">
            I link di recupero durano un&apos;ora e valgono una volta sola:
            questo è scaduto oppure è già stato usato. Richiedine uno nuovo,
            ci vuole un momento.
          </p>
          <Link
            href="/password-dimenticata"
            className="vz-press mt-5 inline-flex items-center gap-1.5 rounded-lg bg-pine px-4 py-2.5 text-sm font-semibold text-white"
          >
            Richiedi un nuovo link <ArrowRight size={15} />
          </Link>
        </div>
      </main>
    );
  }

  if (stato === "fatto") {
    return (
      <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-5 py-12">
        <div className="rounded-2xl border border-line bg-white p-6 text-center">
          <span className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-xl bg-moss text-pine">
            <ShieldCheck size={22} />
          </span>
          <h1 className="mt-4 font-display text-2xl text-ink">
            Password aggiornata
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-gray-warm">
            D&apos;ora in avanti entri con questa. Sei già dentro: da qui vai
            dritto al tuo ecosistema.
          </p>
          <Link
            href="/dashboard"
            className="vz-press mt-5 inline-flex items-center gap-1.5 rounded-lg bg-pine px-4 py-2.5 text-sm font-semibold text-white"
          >
            Vai al tuo ecosistema <ArrowRight size={15} />
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-5 py-12">
      <h1 className="font-display text-3xl font-semibold text-pine">
        Scegli una nuova password
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-gray-warm">
        Ci siamo quasi: imposta la password con cui entrerai da qui in avanti.
      </p>

      <form onSubmit={salva} className="mt-6 flex flex-col gap-1.5">
        <label htmlFor="password" className="text-sm font-medium text-ink">
          Nuova password
        </label>
        <input
          id="password"
          type="password"
          required
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={input}
        />

        <ul className="mt-2 space-y-1">
          {PASSWORD_REGOLE.map((r) => {
            const ok = r.test(password);
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

        <label
          htmlFor="conferma"
          className="mt-3 text-sm font-medium text-ink"
        >
          Ripeti la password
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

        <button
          type="submit"
          disabled={stato === "invio"}
          className="vz-press mt-4 inline-flex items-center justify-center gap-1.5 rounded-lg bg-pine px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
        >
          {stato === "invio" ? "Un istante…" : "Salva la nuova password"}
        </button>
      </form>

      {errore && (
        <p
          role="alert"
          className="mt-4 rounded-lg border border-amber-ink/30 bg-amber-soft px-4 py-3 text-sm leading-relaxed text-amber-ink"
        >
          {errore.messaggio}
        </p>
      )}
    </main>
  );
}
