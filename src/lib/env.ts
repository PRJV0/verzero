/**
 * Lettura centralizzata delle variabili d'ambiente.
 * Fallire subito e con un messaggio chiaro è meglio di un errore opaco
 * dentro al client Supabase a runtime.
 */

function required(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `Variabile d'ambiente mancante: ${name}. Copia .env.local.example in .env.local e compilala.`,
    );
  }
  return value;
}

/** Sicure da usare anche nel browser. */
export const publicEnv = {
  supabaseUrl: required(
    "NEXT_PUBLIC_SUPABASE_URL",
    process.env.NEXT_PUBLIC_SUPABASE_URL,
  ),
  supabaseAnonKey: required(
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  ),
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
};

/**
 * Solo server. Importare questo modulo da un client component fa fallire
 * la build, ed è voluto: la service role key non deve mai raggiungere il browser.
 */
export function serverEnv() {
  return {
    supabaseServiceRoleKey: required(
      "SUPABASE_SERVICE_ROLE_KEY",
      process.env.SUPABASE_SERVICE_ROLE_KEY,
    ),
    anthropicApiKey: required(
      "ANTHROPIC_API_KEY",
      process.env.ANTHROPIC_API_KEY,
    ),
  };
}
