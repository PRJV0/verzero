import type { MetadataRoute } from "next";

import {
  AREE_ESCLUSE,
  CRAWLER_ADDESTRAMENTO,
  CRAWLER_RICERCA,
} from "@/lib/ai-canali";
import { SITO } from "@/lib/seo";

/**
 * robots.txt — tre famiglie dichiarate, non una regola sola.
 *
 * Una riga `User-agent: *` basterebbe tecnicamente: tutti i crawler la
 * leggono. Ma dichiarare esplicitamente le famiglie fa due cose che la
 * regola generica non fa. Primo, rende la scelta LEGGIBILE: chi apre
 * questo file — noi fra un anno, o chiunque controlli — vede che i
 * crawler di ricerca e quelli di addestramento sono stati considerati
 * uno per uno. Secondo, la mette al riparo da un cambio di default:
 * se un giorno decidessimo di chiudere la regola generica, i permessi
 * espliciti resterebbero dove li abbiamo messi, invece di sparire
 * insieme a lei.
 *
 * Le esclusioni sono le stesse per tutti — funnel d'acquisto,
 * autenticazione, area riservata, API — e sono le stesse tenute fuori
 * dalla sitemap: le due liste vanno lette insieme.
 *
 * `host` non viene dichiarato: è una direttiva non standard che Google
 * ignora, e la sua presenza sposterebbe `Sitemap` a metà file. La riga
 * della sitemap sta in fondo, dove la si cerca.
 */
export default function robots(): MetadataRoute.Robots {
  const regola = (userAgent: string | string[]) => ({
    userAgent,
    allow: "/",
    disallow: AREE_ESCLUSE,
  });

  return {
    rules: [
      // 1. Ricerca e citazione: è da qui che possono arrivare persone.
      regola(CRAWLER_RICERCA),
      // 2. Addestramento: non porta traffico domani, porta il fatto che
      //    il modello sappia chi siamo. Per un marchio nuovo conviene.
      regola(CRAWLER_ADDESTRAMENTO),
      // 3. Tutti gli altri.
      regola("*"),
    ],
    sitemap: `${SITO.url}/sitemap.xml`,
  };
}
