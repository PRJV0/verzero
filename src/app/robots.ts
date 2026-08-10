import type { MetadataRoute } from "next";

import { SITO } from "@/lib/seo";

/**
 * robots.txt generato.
 *
 * Escludiamo ciò che non ha senso in un indice pubblico: il funnel
 * d'acquisto, l'autenticazione, l'area riservata e le API. Sono le stesse
 * zone tenute fuori dalla sitemap: le due liste vanno lette insieme.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/acquista/", "/login", "/dashboard", "/api/", "/auth/"],
      },
    ],
    sitemap: `${SITO.url}/sitemap.xml`,
    host: SITO.url,
  };
}
