"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Mail } from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { publicEnv } from "@/lib/env";
import { messaggioErroreAuth, type ErroreAuth } from "@/lib/auth-errori";

/**
 * PASSWORD DIMENTICATA — passo 1 di 2 (SPEC §12.E).
 *
 * Chiediamo l'email e mandiamo il link di recupero. La conferma è
 * volutamente NEUTRA: non diciamo se quell'indirizzo ha un account,
 * altrimenti la pagina diventa uno strumento per scoprire chi è cliente.
 */
export function RichiestaResetForm() {
  const [email, setEmail] = useState("");
  const [stato, setStato] = useState<"idle" | "invio" | "inviato">("idle");
  const [errore, setErrore] = useState<ErroreAuth | null>(null);

  async function richiedi(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStato("invio");
    setErrore(null);

    const supabase = createClient();
    // Il link porta alla callback, che riconosce il recupero e apre la
    // pagina dove si sceglie la nuova password.
    const redirectTo = `${publicEnv.siteUrl}/auth/callback?next=${encodeURIComponent("/reset-password")}`;
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });
    if (error) {
      setErrore(messaggioErroreAuth(error, "reset"));
      setStato("idle");
      return;
    }
    setStato("inviato");
  }

  if (stato === "inviato") {
    return (
      <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-5 py-12">
        <div className="rounded-2xl border border-line bg-white p-6 text-center">
          <span className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-xl bg-moss text-pine">
            <Mail size={22} />
          </span>
          <h1 className="mt-4 font-display text-2xl text-ink">
            Controlla la tua email
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-gray-warm">
            Se <strong className="text-ink">{email}</strong> corrisponde a un
            account, hai ricevuto un link per scegliere una nuova password.
            Vale un&apos;ora e una volta sola. Se non lo trovi, guarda nella
            posta indesiderata.
          </p>
          <Link
            href="/login"
            className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-pine hover:underline"
          >
            <ArrowLeft size={15} /> Torna all&apos;accesso
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-5 py-12">
      <Link
        href="/login"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-warm hover:text-pine"
      >
        <ArrowLeft size={15} /> Torna all&apos;accesso
      </Link>

      <h1 className="mt-6 font-display text-3xl font-semibold text-pine">
        Reimposta la password
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-gray-warm">
        Scrivi l&apos;email con cui accedi: ti mandiamo un link per sceglierne
        una nuova. Il tuo ecosistema e i tuoi documenti restano dove sono.
      </p>

      <form onSubmit={richiedi} className="mt-6 flex flex-col gap-1.5">
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
          className="w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm outline-none transition-colors focus:border-mint"
          placeholder="nome@azienda.it"
        />
        <button
          type="submit"
          disabled={stato === "invio"}
          className="vz-press mt-4 inline-flex items-center justify-center gap-1.5 rounded-lg bg-pine px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
        >
          {stato === "invio" ? "Un istante…" : "Mandami il link"}
          {stato !== "invio" && <ArrowRight size={15} />}
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
