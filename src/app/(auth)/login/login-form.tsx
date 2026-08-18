"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Mail } from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { publicEnv } from "@/lib/env";
import { messaggioErroreAuth, type ErroreAuth } from "@/lib/auth-errori";

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
 * ACCESSO ALL'ECOSISTEMA (SPEC §12.E).
 *
 * Email e password sono LA VIA PRINCIPALE: è così che nasce l'account nel
 * funnel d'acquisto. Il link via email resta come alternativa dichiarata,
 * mai come unica strada. Ogni errore dice la verità e offre il rimedio:
 * reimposta la password, rimanda la conferma, aspetta il tempo giusto.
 */
export function LoginForm({
  initialError,
  next,
}: {
  initialError: string | null;
  next: string | null;
}) {
  const [profilo, setProfilo] = useState<Profilo>("impresa");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [stato, setStato] = useState<
    "idle" | "invio" | "linkInviato" | "confermaInviata"
  >("idle");
  const [errore, setErrore] = useState<ErroreAuth | null>(null);

  const supabase = () => createClient();
  const urlCallback = () => {
    const u = new URL(`${publicEnv.siteUrl}/auth/callback`);
    if (next) u.searchParams.set("next", next);
    return u.toString();
  };

  /** La via principale: email e password. */
  async function accedi(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStato("invio");
    setErrore(null);

    const { error } = await supabase().auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      setErrore(messaggioErroreAuth(error, "accesso"));
      setStato("idle");
      return;
    }
    // Ricarico pieno: il proxy legge i cookie di sessione appena scritti.
    window.location.assign(next ?? "/dashboard");
  }

  /** Alternativa dichiarata: il link via email. */
  async function inviaLink() {
    if (!email) {
      setErrore({
        messaggio: "Scrivi prima la tua email: è lì che mandiamo il link.",
        rimedio: "nessuno",
      });
      return;
    }
    setStato("invio");
    setErrore(null);
    const { error } = await supabase().auth.signInWithOtp({
      email,
      options: { emailRedirectTo: urlCallback() },
    });
    if (error) {
      setErrore(messaggioErroreAuth(error, "accesso"));
      setStato("idle");
      return;
    }
    setStato("linkInviato");
  }

  /** Rimedio: rimanda la conferma dell'indirizzo. */
  async function rimandaConferma() {
    setStato("invio");
    const { error } = await supabase().auth.resend({ type: "signup", email });
    if (error) {
      setErrore(messaggioErroreAuth(error, "accesso"));
      setStato("idle");
      return;
    }
    setErrore(null);
    setStato("confermaInviata");
  }

  const input =
    "w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm outline-none transition-colors focus:border-mint";

  const scelto = PROFILI.find((p) => p.id === profilo)!;
  const inviando = stato === "invio";

  if (stato === "linkInviato" || stato === "confermaInviata") {
    return (
      <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-5 py-12">
        <div className="rounded-2xl border border-line bg-white p-6 text-center">
          <span className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-xl bg-moss text-pine">
            <Mail size={22} />
          </span>
          <h1 className="mt-4 font-display text-2xl text-ink">
            {stato === "linkInviato"
              ? "Link inviato"
              : "Conferma inviata"}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-gray-warm">
            Abbiamo scritto a <strong className="text-ink">{email}</strong>.
            Apri il messaggio da questo dispositivo e sei dentro. Se non lo
            trovi, guarda nella posta indesiderata.
          </p>
          <button
            type="button"
            onClick={() => setStato("idle")}
            className="mt-5 text-sm font-medium text-pine hover:underline"
          >
            Torna all&apos;accesso
          </button>
        </div>
      </main>
    );
  }

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
      <p className="mt-2 text-sm leading-relaxed text-gray-warm">
        {scelto.sotto}
      </p>

      {/* Link scaduto/non valido dalla callback. */}
      {initialError && !errore && (
        <p
          role="alert"
          className="mt-6 rounded-lg border border-amber-ink/30 bg-amber-soft px-4 py-3 text-sm text-amber-ink"
        >
          {initialError}
        </p>
      )}

      <form onSubmit={accedi} className="mt-6 flex flex-col gap-1.5">
        <label htmlFor="email" className="text-sm font-medium text-ink">
          Email
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

        <div className="mt-2 flex items-baseline justify-between gap-3">
          <label htmlFor="password" className="text-sm font-medium text-ink">
            Password
          </label>
          <Link
            href="/password-dimenticata"
            className="text-xs font-medium text-pine hover:underline"
          >
            Password dimenticata?
          </Link>
        </div>
        <input
          id="password"
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={input}
        />

        <button
          type="submit"
          disabled={inviando}
          className="vz-press mt-4 inline-flex items-center justify-center gap-1.5 rounded-lg bg-pine px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
        >
          {inviando ? "Un istante…" : "Accedi"}
          {!inviando && <ArrowRight size={15} />}
        </button>
      </form>

      {/* L'errore dice la verità e offre il rimedio giusto. */}
      {errore && (
        <div
          role="alert"
          className="mt-4 rounded-lg border border-amber-ink/30 bg-amber-soft px-4 py-3"
        >
          <p className="text-sm leading-relaxed text-amber-ink">
            {errore.messaggio}
          </p>
          {errore.rimedio === "reset" && (
            <Link
              href="/password-dimenticata"
              className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-amber-ink underline"
            >
              Reimposta la password <ArrowRight size={14} />
            </Link>
          )}
          {errore.rimedio === "conferma" && (
            <button
              type="button"
              onClick={rimandaConferma}
              disabled={inviando}
              className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-amber-ink underline disabled:opacity-60"
            >
              Rimandami il link di conferma <ArrowRight size={14} />
            </button>
          )}
        </div>
      )}

      {/* L'alternativa, dichiarata come tale: mai l'unica via. */}
      <div className="mt-6 border-t border-line pt-5">
        <p className="text-xs text-gray-light">
          Non ricordi la password e preferisci non reimpostarla adesso?
        </p>
        <button
          type="button"
          onClick={inviaLink}
          disabled={inviando}
          className="mt-1.5 inline-flex items-center gap-1.5 text-sm font-medium text-pine hover:underline disabled:opacity-60"
        >
          <Mail size={15} /> Mandami un link di accesso via email
        </button>
      </div>

      <p className="mt-6 text-xs leading-relaxed text-gray-light">
        {profilo === "impresa" ? (
          <>
            Non hai ancora un account? Si crea al primo acquisto, dal{" "}
            <Link
              href="/servizi"
              className="font-medium text-pine hover:underline"
            >
              catalogo dei servizi
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
