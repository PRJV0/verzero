import type { NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/middleware";

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    // Tutto tranne asset statici, immagini e i percorsi di piattaforma.
    // `_vercel` va escluso: senza, lo script di Analytics finisce nel
    // controllo di sessione e torna la pagina di login al posto del
    // JavaScript — il browser la riceve come script e la rifiuta.
    "/((?!_next/static|_next/image|_vercel|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
