import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { publicEnv } from "@/lib/env";

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
  "/sigillo",
  "/bollino",
  "/chi-siamo",
  "/come-funziona",
  "/contatti",
  "/partner",
  "/verifica",
  "/registro",
  // File per i motori di ricerca: senza questi due il proxy li reindirizzava
  // alla pagina di login, rendendoli invisibili ai crawler.
  "/robots.txt",
  "/sitemap.xml",
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
  let response = NextResponse.next({ request });

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
          response = NextResponse.next({ request });
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
