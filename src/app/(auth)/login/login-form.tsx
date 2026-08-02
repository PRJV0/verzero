"use client";

import { useState } from "react";

import { createClient } from "@/lib/supabase/client";
import { publicEnv } from "@/lib/env";

/**
 * Form di login via magic link. Nessuna password da gestire, nessuna da
 * custodire: per l'MVP (3-5 aziende pilota) è la scelta con meno superficie
 * di rischio.
 *
 * `initialError` arriva dalla callback (link scaduto/non valido): lo mostriamo
 * in evidenza e il form resta pronto per richiedere subito un nuovo link.
 */
export function LoginForm({
  initialError,
  next,
}: {
  initialError: string | null;
  next: string | null;
}) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">(
    "idle",
  );
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("sending");
    setError(null);

    const redirectTo = new URL(`${publicEnv.siteUrl}/auth/callback`);
    if (next) redirectTo.searchParams.set("next", next);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectTo.toString() },
    });

    if (error) {
      setError(error.message);
      setState("error");
      return;
    }
    setState("sent");
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-5 py-12">
      <h1 className="font-display text-2xl font-semibold text-pine">
        Accedi a Ver0
      </h1>
      <p className="mt-2 text-sm text-gray-warm">
        Ti inviamo un link di accesso via email. Nessuna password da ricordare.
      </p>

      {/* Link scaduto/non valido: messaggio chiaro, mai loop silenzioso. */}
      {initialError && state !== "sent" && (
        <p
          role="alert"
          className="mt-6 rounded-lg border border-amber-ink/30 bg-amber-soft px-4 py-3 text-sm text-amber-ink"
        >
          {initialError}
        </p>
      )}

      {state === "sent" ? (
        <p className="mt-6 rounded-lg border border-line bg-moss px-4 py-3 text-sm text-pine-dark">
          Link inviato a <strong>{email}</strong>. Controlla la casella (anche
          lo spam) e apri il link da questo dispositivo.
        </p>
      ) : (
        <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-3">
          <label htmlFor="email" className="text-sm font-medium text-ink">
            Email aziendale
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-lg border border-line bg-white px-3 py-2.5 text-sm outline-none focus:border-mint"
            placeholder="nome@azienda.it"
          />
          <button
            type="submit"
            disabled={state === "sending"}
            className="rounded-lg bg-pine px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60"
          >
            {state === "sending"
              ? "Invio in corso…"
              : initialError
                ? "Inviami un nuovo link"
                : "Inviami il link"}
          </button>
          {error && <p className="text-sm text-amber-ink">{error}</p>}
        </form>
      )}
    </main>
  );
}
