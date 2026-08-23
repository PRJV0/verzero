import type { MetadataRoute } from "next";

import { SERVIZI } from "@/lib/catalog";
import { GUIDE } from "@/lib/guide";
import { PAGINE_PUBBLICHE } from "@/lib/pagine-pubbliche";
import { SITO } from "@/lib/seo";

/**
 * Sitemap generata dalle stesse fonti che generano le pagine: aggiungere
 * un servizio al catalogo, o una pagina a `pagine-pubbliche.ts`, la mette
 * in sitemap senza doverselo ricordare — e nello stesso momento la mette
 * in llms.txt, che legge lo stesso elenco.
 *
 * Restano FUORI le pagine transazionali (/acquista, /login, /dashboard):
 * non portano traffico organico e diluiscono la scansione.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const oggi = new Date();
  const url = (path: string) => `${SITO.url}${path}`;

  const pagine: MetadataRoute.Sitemap = PAGINE_PUBBLICHE.map((p) => ({
    url: url(p.path),
    lastModified: oggi,
    changeFrequency: p.frequenza,
    priority: p.priorita,
  }));

  const servizi: MetadataRoute.Sitemap = SERVIZI.map((s) => ({
    url: url(`/servizi/${s.slug}`),
    lastModified: oggi,
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  const guide: MetadataRoute.Sitemap = GUIDE.map((g) => ({
    url: url(`/guide/${g.slug}`),
    lastModified: oggi,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  return [...pagine, ...servizi, ...guide];
}
