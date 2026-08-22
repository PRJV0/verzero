import { headers } from "next/headers";

import { RevealObserver } from "@/components/reveal-observer";
import { RiconosciArrivoAi } from "@/components/riconosci-arrivo-ai";
import { registraAccessoAi } from "@/lib/accessi-ai";
import { PERCORSO_HEADER } from "@/lib/supabase/middleware";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { CookieBanner } from "@/components/cookie-banner";
import { COOKIE_CONSENSO, leggiConsenso } from "@/lib/consenso-cookie";
import { leggiSessionePubblica } from "@/lib/sessione-pubblica";
import { cookies } from "next/headers";

/**
 * Layout delle pagine pubbliche (home, servizi, sigillo, partner): header e
 * footer condivisi, contenuto in mezzo. Le aree (auth) e (app) hanno chrome
 * proprio e non passano di qui.
 */
export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Letta qui, una volta sola per pagina: header e footer devono dire la
  // stessa cosa, e devono dirla già al primo caricamento.
  const sessione = await leggiSessionePubblica();
  // La scelta sui cookie si legge lato server: chi ha già deciso non
  // deve rivedere il banner comparire e sparire a ogni pagina.
  const consenso = leggiConsenso((await cookies()).get(COOKIE_CONSENSO)?.value);
  // Chi ci sta leggendo: un agente AI non esegue JavaScript, quindi il
  // suo passaggio si può registrare solo qui. La scrittura avviene dopo
  // che la risposta è partita (v. accessi-ai.ts): la pagina non aspetta.
  const intestazioni = await headers();
  registraAccessoAi(
    intestazioni.get("user-agent"),
    intestazioni.get(PERCORSO_HEADER) ?? "/",
  );
  return (
    <div className="flex min-h-dvh flex-col bg-paper">
      <RevealObserver />
      <RiconosciArrivoAi />
      <SiteHeader sessione={sessione} />
      <div className="flex-1">{children}</div>
      <SiteFooter sessione={sessione} />
      <CookieBanner giaScelto={consenso !== null} />
    </div>
  );
}
