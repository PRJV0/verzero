import { createServerClient } from "@supabase/ssr";
import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

import { publicEnv } from "@/lib/env";
import type { Database } from "@/types/database";

/**
 * Callback del magic link. Stabilisce la sessione e porta in dashboard.
 *
 * Gestisce entrambi i formati di link che Supabase può emettere:
 *  - PKCE: `?code=...`            -> exchangeCodeForSession
 *  - token hash: `?token_hash=...&type=...` -> verifyOtp
 *
 * Punto critico: i cookie di sessione vengono scritti DIRETTAMENTE sulla
 * response di redirect che restituiamo. Scriverli sul cookie store di
 * `next/headers` e poi tornare una `NextResponse.redirect` costruita a parte
 * non li propaga in modo affidabile (soprattutto dietro il proxy di Vercel):
 * la sessione non si stabilisce e si finisce in loop sul login.
 */

/** Solo path relativi: evita open redirect via `?next=`.
 *  `predefinito` cambia per il recupero password: chi arriva da lì non va
 *  in dashboard ma alla scelta della nuova password (SPEC §12.E). */
function safePath(next: string | null, predefinito = "/dashboard"): string {
  if (!next) return predefinito;
  return next.startsWith("/") && !next.startsWith("//") ? next : predefinito;
}

/**
 * Su Vercel `nextUrl.origin` può non coincidere con l'host pubblico: i cookie
 * verrebbero scritti per un dominio e la navigazione avverrebbe su un altro.
 * Preferiamo l'host inoltrato dal proxy quando presente.
 */
function baseUrl(request: NextRequest): string {
  const forwardedHost = request.headers.get("x-forwarded-host");
  if (forwardedHost) {
    const proto = request.headers.get("x-forwarded-proto") ?? "https";
    return `${proto}://${forwardedHost}`;
  }
  return request.nextUrl.origin;
}

/** Codici brevi e leggibili passati al login, mappati lì a messaggi in italiano. */
function reasonFrom(raw: string | null | undefined): string {
  if (!raw) return "link_non_valido";
  const v = raw.toLowerCase();
  if (v.includes("expired") || v === "otp_expired" || v.includes("access_denied")) {
    return "scaduto";
  }
  return "verifica_fallita";
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const base = baseUrl(request);

  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  // Il link di recupero apre una sessione buona solo per cambiare la
  // password: la sua destinazione naturale è quella pagina, non il portale.
  const next = safePath(
    searchParams.get("next"),
    type === "recovery" ? "/reset-password" : "/dashboard",
  );

  const loginWithError = (reason: string) =>
    NextResponse.redirect(`${base}/login?error=${encodeURIComponent(reason)}`);

  // Errore già propagato da Supabase (es. link scaduto o già usato): niente
  // loop silenzioso, portiamo l'utente al login con un messaggio chiaro.
  const providerError =
    searchParams.get("error_code") ?? searchParams.get("error");
  if (providerError) {
    return loginWithError(reasonFrom(providerError));
  }

  if (!code && !tokenHash) {
    return loginWithError("link_non_valido");
  }

  // Response di redirect creata PRIMA del client: i cookie di sessione
  // scritti dall'adapter finiscono proprio su questa response.
  const response = NextResponse.redirect(`${base}${next}`);

  const supabase = createServerClient<Database>(
    publicEnv.supabaseUrl,
    publicEnv.supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const { error } = code
    ? await supabase.auth.exchangeCodeForSession(code)
    : await supabase.auth.verifyOtp({
        type: type ?? "email",
        token_hash: tokenHash as string,
      });

  if (error) {
    return loginWithError(reasonFrom(error.message));
  }

  return response;
}
