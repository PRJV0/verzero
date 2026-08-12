import type { MetadataRoute } from "next";

import { SERVIZI } from "@/lib/catalog";
import { SITO } from "@/lib/seo";

/**
 * Sitemap generata dalle stesse fonti che generano le pagine: aggiungere
 * un servizio al catalogo lo mette in sitemap senza doverselo ricordare.
 *
 * Restano FUORI le pagine transazionali (/acquista, /login, /dashboard):
 * non portano traffico organico e diluiscono la scansione.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const oggi = new Date();
  const url = (path: string) => `${SITO.url}${path}`;

  const pagine: MetadataRoute.Sitemap = [
    { url: url("/"), lastModified: oggi, changeFrequency: "weekly", priority: 1 },
    {
      url: url("/servizi"),
      lastModified: oggi,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: url("/come-funziona"),
      lastModified: oggi,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: url("/sigillo"),
      lastModified: oggi,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: url("/chi-siamo"),
      lastModified: oggi,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: url("/partner"),
      lastModified: oggi,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: url("/contatti"),
      lastModified: oggi,
      changeFrequency: "yearly",
      priority: 0.6,
    },
    {
      url: url("/termini"),
      lastModified: oggi,
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];

  const servizi: MetadataRoute.Sitemap = SERVIZI.map((s) => ({
    url: url(`/servizi/${s.slug}`),
    lastModified: oggi,
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  return [...pagine, ...servizi];
}
