"use client";

import { useState } from "react";
import Link from "next/link";

import { createClient } from "@/lib/supabase/client";
import { publicEnv } from "@/lib/env";

/** I due profili di accesso all'ecosistema (SPEC §12.K). La scelta orienta
 *  il copy: l'autenticazione è la stessa, il ruolo vive nel database. */
const PROFILI = [
  {
    id: "impresa",
    label: "Impresa",
    titolo: "Accedi al tuo ecosistema",
    sotto:
      "Moduli attivi, documenti sempre aggiornati e Sigillo: tutto ciò che la tua impresa ha costruito, in un posto solo.",
  },
  {
    id: "consulente",
    label: "Consulente partner",
    titolo: "Gestisci i tuoi clienti",
    sotto:
      "Un'unica dashboard per tutte le imprese che segui: selezioni il cliente e lavori sul suo ecosistema, con il suo mandato.",
  },
] as const;

type Profilo = (typeof PROFILI)[number]["id"];

/**
 * Accesso all'ecosistema: email e password (gli account nascono così dal
 * funnel di acquisto, SPEC §12.T) oppure link via email (magic link), che
 * resta disponibile per gli accessi successivi.
 *
 * `initialError` arriva dalla callback (link scaduto/non valido): lo mostriamo
 * in evidenza e il form resta pronto per riprovare subito.
 */
export function LoginForm({
  initialError,
  next,
}: {
  initialError: string | null;
  next: string | null;
}) {
  const [profilo, setProfilo] = useState<Profilo>("impresa");
  const [mode, setMode] = useState<"password" | "link">("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">(
    "idle",
  );
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("sending");
    setError(null);

    const supabase = createClient();

    if (mode === "password") {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        setError(
          "Accesso non riuscito: controlla email e password. In alternativa usa il link via email.",
        );
        setState("error");
        return;
      }
      // Ricarico pieno: il proxy legge i cookie di sessione appena scritti.
      window.location.assign(next ?? "/dashboard");
      return;
    }

    const redirectTo = new URL(`${publicEnv.siteUrl}/auth/callback`);
    if (next) redirectTo.searchParams.set("next", next);
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

  const input =
    "rounded-lg border border-line bg-white px-3 py-2.5 text-sm outline-none focus:border-mint";

  const scelto = PROFILI.find((p) => p.id === profilo)!;

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-5 py-12">
      {/* Due profili (SPEC §12.K): la scelta orienta, non separa — sotto
          c'è un solo accesso e il ruolo lo conosce il database. */}
      <div
        role="tablist"
        aria-label="Con che profilo accedi"
        className="flex rounded-xl border border-line bg-white p-1"
      >
        {PROFILI.map((p) => {
          const attivo = p.id === profilo;
          return (
            <button
              key={p.id}
              type="button"
              role="tab"
              aria-selected={attivo}
              onClick={() => setProfilo(p.id)}
              className={
                "flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors " +
                (attivo
                  ? "bg-pine text-white shadow-soft"
                  : "text-gray-warm hover:text-pine")
              }
            >
              {p.label}
            </button>
          );
        })}
      </div>

      <h1 className="mt-6 font-display text-3xl font-semibold text-pine">
        {scelto.titolo}
      </h1>
      <p className="mt-2 text-sm text-gray-warm">{scelto.sotto}</p>
      <p className="mt-2 text-xs text-gray-light">
        {mode === "password"
          ? "Entra con l'email e la password del tuo account."
          : "Ti inviamo un link di accesso via email. Nessuna password da ricordare."}
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
            className={input}
            placeholder="nome@azienda.it"
          />

          {mode === "password" && (
            <>
              <label htmlFor="password" className="text-sm font-medium text-ink">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={input}
              />
            </>
          )}

          <button
            type="submit"
            disabled={state === "sending"}
            className="rounded-lg bg-pine px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60"
          >
            {state === "sending"
              ? "Un istante…"
              : mode === "password"
                ? "Accedi"
                : initialError
                  ? "Inviami un nuovo link"
                  : "Inviami il link"}
          </button>
          {error && <p className="text-sm text-amber-ink">{error}</p>}
        </form>
      )}

      {state !== "sent" && (
        <button
          type="button"
          onClick={() => {
            setMode((m) => (m === "password" ? "link" : "password"));
            setError(null);
            setState("idle");
          }}
          className="mt-4 text-left text-sm font-medium text-pine hover:underline"
        >
          {mode === "password"
            ? "Preferisci il link via email? Accedi senza password"
            : "Hai una password? Accedi con email e password"}
        </button>
      )}

      <p className="mt-6 text-xs text-gray-light">
        {profilo === "impresa" ? (
          <>
            Non hai ancora un account? Si crea al primo acquisto, dal catalogo{" "}
            <Link
              href="/servizi"
              className="font-medium text-pine hover:underline"
            >
              servizi
            </Link>
            .
          </>
        ) : (
          <>
            Non sei ancora partner? Scopri il{" "}
            <Link
              href="/partner"
              className="font-medium text-pine hover:underline"
            >
              programma partner
            </Link>{" "}
            per commercialisti e consulenti.
          </>
        )}
      </p>
    </main>
  );
}
