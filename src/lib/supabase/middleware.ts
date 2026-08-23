import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { publicEnv } from "@/lib/env";

/**
 * L'intestazione con cui il proxy passa il percorso ai componenti server.
 * Nome nostro, prefissato: le intestazioni interne di Next non sono un
 * contratto pubblico e cambiano fra una versione e l'altra.
 */
export const PERCORSO_HEADER = "x-vz-percorso";

/** Percorsi accessibili senza login (sito pubblico, auth, pagine di verifica del Sigillo). */
const PUBLIC_PREFIXES = [
  "/",
  "/login",
  "/auth",
  // Recupero password: la richiesta è pubblica per definizione, e la pagina
  // della nuova password deve poter dire «link scaduto» invece di rimbalzare
  // al login lasciando la persona senza spiegazione (SPEC §12.E).
  "/password-dimenticata",
  "/reset-password",
  // Le route API gestiscono da sole l'autenticazione e devono rispondere
  // JSON (401), MAI un redirect HTML alla pagina di login: un redirect
  // seguito da fetch() torna 200 e maschera l'errore al chiamante.
  "/api",
  "/servizi",
  "/acquista",
  "/termini",
  // Informative legali e pagina sicurezza: devono essere leggibili da
  // chiunque, sempre — una privacy policy dietro un login non è una
  // privacy policy, e una pagina che spiega come proteggiamo i dati la
  // deve poter leggere chi NON è ancora cliente: è lì che serve.
  "/privacy",
  "/cookie-policy",
  "/sicurezza",
  "/sigillo",
  "/bollino",
  "/chi-siamo",
  "/come-funziona",
  "/guide",
  "/contatti",
  "/partner",
  "/verifica",
  "/registro",
  // File per i motori di ricerca: senza questi due il proxy li reindirizzava
  // alla pagina di login, rendendoli invisibili ai crawler.
  "/robots.txt",
  "/sitemap.xml",
  "/llms.txt",
];

function isPublic(pathname: string) {
  return PUBLIC_PREFIXES.some(
    (p) => pathname === p || (p !== "/" && pathname.startsWith(`${p}/`)),
  );
}

/**
 * Rinfresca la sessione a ogni richiesta e protegge l'area riservata.
 * Nota: la RLS resta la barriera di sicurezza primaria (SPEC §3); questo
 * middleware è comodità di navigazione, non un controllo di autorizzazione.
 */
export async function updateSession(request: NextRequest) {
  /*
   * Il percorso, passato ai componenti server come intestazione: dentro un
   * layout non esiste altro modo di sapere quale pagina si sta rendendo, e
   * serve per registrare QUALI pagine un agente AI legge (lib/accessi-ai).
   * Senza, potremmo dire solo che qualcuno è passato.
   *
   * Le intestazioni si ricostruiscono a OGNI chiamata, non una volta sola:
   * `request.cookies.set()` scrive nell'intestazione `cookie` della
   * richiesta, e una copia fatta prima del refresh dei token porterebbe
   * ai componenti server la sessione vecchia. È lo stesso motivo per cui
   * il modello di Supabase ricrea la risposta dentro `setAll`.
   *
   * Il valore in ingresso, se qualcuno lo inventasse, viene sovrascritto:
   * `set` sostituisce, non aggiunge.
   */
  const conPercorso = () => {
    const intestazioni = new Headers(request.headers);
    intestazioni.set(PERCORSO_HEADER, request.nextUrl.pathname);
    return { headers: intestazioni };
  };

  let response = NextResponse.next({ request: conPercorso() });

  const supabase = createServerClient(
    publicEnv.supabaseUrl,
    publicEnv.supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request: conPercorso() });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Non inserire codice tra createServerClient e getUser(): il refresh del token
  // avviene qui e va lasciato indisturbato.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && !isPublic(request.nextUrl.pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  return response;
}
