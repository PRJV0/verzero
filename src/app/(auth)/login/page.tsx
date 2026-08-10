import type { Metadata } from "next";

import { LoginForm } from "./login-form";

/** Fuori dall'indice: pagina di accesso, nessun valore organico. */
export const metadata: Metadata = {
  title: "Accedi",
  description: "Accedi alla tua area riservata Ver0.",
  robots: { index: false, follow: false },
};

/** Codici brevi dalla callback -> messaggi leggibili. */
const ERROR_MESSAGES: Record<string, string> = {
  scaduto:
    "Il link di accesso è scaduto o è già stato utilizzato. Richiedine uno nuovo qui sotto.",
  link_non_valido:
    "Il link di accesso non è valido. Richiedine uno nuovo qui sotto.",
  verifica_fallita:
    "Non siamo riusciti a verificare il link di accesso. Richiedine uno nuovo qui sotto.",
};

function safeNext(next: string | undefined): string | null {
  if (!next) return null;
  return next.startsWith("/") && !next.startsWith("//") ? next : null;
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const { error, next } = await searchParams;
  const initialError = error
    ? (ERROR_MESSAGES[error] ?? ERROR_MESSAGES.link_non_valido)
    : null;

  return <LoginForm initialError={initialError} next={safeNext(next)} />;
}
