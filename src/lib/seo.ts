import type { Metadata } from "next";

import { publicEnv } from "@/lib/env";

/**
 * SEO — regole e utilità condivise.
 *
 * REGOLA PERMANENTE DEL PROGETTO (vale ora e in ogni sessione futura):
 * ogni pagina nuova o modificata deve avere
 *  1. title unico (~55 caratteri) e meta description unica (~155),
 *  2. UN SOLO <h1>, con gerarchia h2/h3 coerente sotto,
 *  3. URL parlante e canonical dichiarato,
 *  4. Open Graph e Twitter card,
 *  5. JSON-LD dove pertinente (Organization, Service/Offer, FAQPage,
 *     BreadcrumbList),
 *  6. alt descrittivi su ogni immagine che porta significato (vuoto solo
 *     se davvero decorativa),
 *  7. link interni verso le pagine correlate,
 *  8. la pagina deve entrare in sitemap.ts se pubblica e indicizzabile.
 * Le pagine transazionali (funnel, login, area riservata) restano
 * volutamente fuori dall'indice: non portano traffico e diluiscono.
 */

export const SITO = {
  /**
   * Il MARCHIO è il nome per esteso (variante B del brand book): è quello
   * che compare nel logotipo, nei dati strutturati e nel titolo delle
   * pagine. «Ver0» resta il monogramma — favicon, Sigillo, spazi stretti —
   * e resta il nome del PRODOTTO dentro i testi (Sigillo Ver0, AI Ver0).
   */
  nome: "Verzero",
  /** Il monogramma, per gli usi di spazio ridotto. */
  monogramma: "Ver0",
  descrizione:
    "La piattaforma che qualifica la tua impresa: sostenibilità, sistemi di gestione e consulenza con prezzi in chiaro.",
  get url() {
    return publicEnv.siteUrl;
  },
  /** Immagine di condivisione predefinita (foto già ottimizzata). */
  ogImage: "/photos/sito1.jpg",
  email: "info@verzero.it",
} as const;

/** Lunghezze consigliate: superarle non rompe nulla, ma il motore tronca. */
export const SEO_LIMITI = { title: 60, description: 160 } as const;

type OpzioniPagina = {
  /** Senza il suffisso del marchio: lo aggiunge il template del layout. */
  title: string;
  description: string;
  /** Percorso assoluto dalla radice, es. "/servizi". */
  path: string;
  /** Fuori indice: funnel, login, area riservata. */
  noindex?: boolean;
  /** Immagine di condivisione specifica della pagina. */
  image?: string;
};

/**
 * Costruisce i metadati di una pagina: canonical, Open Graph e Twitter
 * card in un colpo solo, così non capita più di dimenticarne uno.
 */
export function metadataPagina({
  title,
  description,
  path,
  noindex,
  image,
}: OpzioniPagina): Metadata {
  const url = path;
  const og = image ?? SITO.ogImage;
  return {
    title,
    description,
    alternates: { canonical: url },
    robots: noindex ? { index: false, follow: true } : undefined,
    openGraph: {
      type: "website",
      locale: "it_IT",
      siteName: SITO.nome,
      title: `${title} — ${SITO.nome}`,
      description,
      url,
      images: [{ url: og, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} — ${SITO.nome}`,
      description,
      images: [og],
    },
  };
}

/* ------------------------------------------------------------------ */
/* Dati strutturati (JSON-LD)                                          */
/* ------------------------------------------------------------------ */

/** L'organizzazione: una volta sola, in home. */
export function jsonLdOrganization() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITO.nome,
    // Il monogramma resta come nome alternativo: chi cerca «Ver0» deve
    // comunque trovare noi.
    alternateName: SITO.monogramma,
    url: SITO.url,
    logo: `${SITO.url}/brand/logo-verzero.svg`,
    description: SITO.descrizione,
    email: SITO.email,
    areaServed: { "@type": "Country", name: "Italia" },
    contactPoint: [
      {
        "@type": "ContactPoint",
        contactType: "informazioni commerciali",
        email: SITO.email,
        availableLanguage: ["it"],
        url: `${SITO.url}/contatti`,
      },
    ],
  };
}

/** Briciole di pane: aiutano il motore a capire la gerarchia del sito. */
export function jsonLdBreadcrumb(voci: { nome: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: voci.map((v, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: v.nome,
      item: `${SITO.url}${v.path}`,
    })),
  };
}

type OffertaCanone = { tipo: "canone"; mensile: number };
type OffertaUnaTantum = { tipo: "una-tantum"; importo: number };

/** Un servizio con la sua offerta: canone mensile oppure una tantum. */
export function jsonLdService({
  nome,
  descrizione,
  path,
  offerta,
}: {
  nome: string;
  descrizione: string;
  path: string;
  offerta: OffertaCanone | OffertaUnaTantum | null;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: nome,
    description: descrizione,
    url: `${SITO.url}${path}`,
    serviceType: "Consulenza per la qualifica d'impresa",
    provider: {
      "@type": "Organization",
      name: SITO.nome,
      url: SITO.url,
    },
    areaServed: { "@type": "Country", name: "Italia" },
    ...(offerta
      ? {
          offers: {
            "@type": "Offer",
            priceCurrency: "EUR",
            url: `${SITO.url}${path}`,
            availability: "https://schema.org/InStock",
            ...(offerta.tipo === "canone"
              ? {
                  price: offerta.mensile,
                  priceSpecification: {
                    "@type": "UnitPriceSpecification",
                    price: offerta.mensile,
                    priceCurrency: "EUR",
                    // Prezzo a mese, come esposto in pagina.
                    unitCode: "MON",
                    billingIncrement: 1,
                  },
                }
              : { price: offerta.importo }),
          },
        }
      : {}),
  };
}

/** Domande e risposte reali presenti in pagina: mai inventate per il markup. */
export function jsonLdFaq(voci: { domanda: string; risposta: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: voci.map((v) => ({
      "@type": "Question",
      name: v.domanda,
      acceptedAnswer: { "@type": "Answer", text: v.risposta },
    })),
  };
}
