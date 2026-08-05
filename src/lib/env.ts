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

/**
 * Sicure da usare anche nel browser. Valori esposti come getter *lazy*: la
 * validazione scatta quando il valore viene letto (a runtime, per richiesta),
 * non all'import del modulo. Così `next build` riesce a raccogliere le pagine
 * anche in un checkout pulito senza .env.local (com'è l'ambiente di Vercel):
 * senza questo, la build falliva su "Failed to collect page data".
 * Le variabili NEXT_PUBLIC_* restano inlined a build time dal compilatore Next.
 */
export const publicEnv = {
  get supabaseUrl() {
    return required(
      "NEXT_PUBLIC_SUPABASE_URL",
      process.env.NEXT_PUBLIC_SUPABASE_URL,
    );
  },
  get supabaseAnonKey() {
    return required(
      "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    );
  },
  get siteUrl() {
    return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  },
};

/**
 * Solo server. Importare questo modulo da un client component fa fallire
 * la build, ed è voluto: la service role key non deve mai raggiungere il browser.
 */
export function serverEnv() {
  // Getter lazy per chiave: ogni segreto è richiesto solo quando serve
  // davvero (l'admin client non deve fallire perché manca la chiave AI,
  // che entra in gioco solo con l'estrazione documenti di fase 2).
  return {
    get supabaseServiceRoleKey() {
      return required(
        "SUPABASE_SERVICE_ROLE_KEY",
        process.env.SUPABASE_SERVICE_ROLE_KEY,
      );
    },
    get anthropicApiKey() {
      return required("ANTHROPIC_API_KEY", process.env.ANTHROPIC_API_KEY);
    },
  };
}
