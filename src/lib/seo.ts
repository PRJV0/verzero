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
  /**
   * LA DESCRIZIONE DELL'ENTITÀ — una sola, ovunque si descriva l'azienda.
   *
   * Non è la meta description di una pagina: quelle descrivono PAGINE e
   * restano diverse l'una dall'altra. Questa descrive VERZERO, e va usata
   * identica nei dati strutturati, in llms.txt e — quando esisteranno —
   * nei profili esterni (LinkedIn, Google Business Profile, registri di
   * settore). Un'entità descritta in tre modi diversi in tre posti è
   * un'entità che un modello fatica a riconoscere come una sola.
   *
   * Scritta per reggere FUORI dal sito: soggetto esplicito, nessun
   * rimando al contesto, ogni affermazione verificabile in pagina.
   */
  descrizione:
    "Verzero è la piattaforma italiana che qualifica le imprese su sostenibilità e sistemi di gestione: un'AI proprietaria compone i documenti a partire da quelli che l'impresa ha già, un professionista li valida prima della consegna e i prezzi sono pubblici per fascia dimensionale.",
  /** Le due righe di contesto che accompagnano la descrizione in llms.txt. */
  contesto:
    "I percorsi coprono carbon footprint di organizzazione, bilancio di sostenibilità in formato VSME, sistemi di gestione ISO, parità di genere UNI/PdR 125 e altri standard ufficiali. I documenti prodotti sono di parte prima: la certificazione, dove prevista, resta di competenza di un organismo accreditato. Il Sigillo Ver0 è la targa verificabile che attesta i percorsi conclusi.",
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

/**
 * I PROFILI UFFICIALI, per `sameAs`.
 *
 * `sameAs` è la riga che dice «questa azienda e quel profilo sono la
 * stessa entità»: è il modo più diretto per far convergere ciò che di noi
 * sta in posti diversi su un'identità sola. Oggi l'elenco è VUOTO, e deve
 * restarlo finché i profili non esistono davvero: dichiarare un URL che
 * non risponde, o che appartiene a qualcun altro, è peggio che tacere.
 *
 * Quando nascono — LinkedIn, Google Business Profile, registri di settore
 * — si aggiungono qui e compaiono nei dati strutturati da soli. Sul
 * profilo va usata la STESSA descrizione (`SITO.descrizione`) e lo stesso
 * nome: è quella coincidenza a rendere il collegamento credibile.
 */
export const PROFILI_UFFICIALI: string[] = [];

/**
 * Gli argomenti su cui l'entità è competente.
 *
 * `knowsAbout` non è una lista di parole chiave da riempire: è la
 * dichiarazione di che cosa questa organizzazione sa fare, e ogni voce
 * deve corrispondere a un percorso o a un contenuto che il sito espone
 * davvero. Sono gli argomenti su cui vogliamo essere l'entità che un
 * modello nomina quando qualcuno chiede «chi lo fa in Italia».
 */
const COMPETENZE = [
  "Carbon footprint di organizzazione",
  "Rendicontazione di sostenibilità VSME",
  "Sistemi di gestione ISO 9001, ISO 14001, ISO 45001",
  "Parità di genere UNI/PdR 125",
  "Responsabilità sociale SA8000",
  "Economia circolare UNI/TS 11820",
  "Qualifica fornitori e questionari ESG",
];

/**
 * L'organizzazione: una volta sola, in home.
 *
 * `@id` stabile e riusato altrove (WebSite, provider dei servizi): senza,
 * ogni blocco JSON-LD descrive un'organizzazione che sembra diversa dalle
 * altre, e il grafo che ne esce ha tre nodi invece di uno.
 */
export function idOrganizzazione() {
  return `${SITO.url}/#organizzazione`;
}

export function jsonLdOrganization() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": idOrganizzazione(),
    name: SITO.nome,
    // Il monogramma resta come nome alternativo: chi cerca «Ver0» deve
    // comunque trovare noi.
    alternateName: SITO.monogramma,
    url: SITO.url,
    logo: {
      "@type": "ImageObject",
      url: `${SITO.url}/brand/logo-verzero.svg`,
    },
    image: `${SITO.url}${SITO.ogImage}`,
    description: SITO.descrizione,
    email: SITO.email,
    areaServed: { "@type": "Country", name: "Italia" },
    knowsAbout: COMPETENZE,
    // `sameAs` compare solo se abbiamo davvero dei profili: una riga
    // vuota nel markup è una promessa non mantenuta.
    ...(PROFILI_UFFICIALI.length > 0 ? { sameAs: PROFILI_UFFICIALI } : {}),
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

/**
 * Il sito come entità distinta dall'organizzazione che lo pubblica.
 *
 * Serve a legare i due nodi: senza, restano un'azienda e un dominio che
 * si somigliano. Il collegamento `publisher` dice che sono la stessa
 * storia.
 */
export function jsonLdWebSite() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITO.url}/#sito`,
    url: SITO.url,
    name: SITO.nome,
    description: SITO.descrizione,
    inLanguage: "it-IT",
    publisher: { "@id": idOrganizzazione() },
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
    // Stesso `@id` dell'Organization dichiarata in home: il fornitore di
    // questo servizio dev'essere lo STESSO nodo, non un omonimo.
    provider: {
      "@type": "Organization",
      "@id": idOrganizzazione(),
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

/**
 * Un contenuto informativo: le guide.
 *
 * `Article` e non `BlogPosting`: non è un blog e non finge di esserlo —
 * sono schede di fatto, aggiornate quando la norma cambia, non post
 * datati che invecchiano in ordine cronologico. Per lo stesso motivo
 * non si dichiara `datePublished` se non lo si tiene aggiornato: una
 * data sbagliata nei dati strutturati è peggio di una data assente.
 */
export function jsonLdArticle({
  titolo,
  descrizione,
  path,
  aggiornatoIl,
}: {
  titolo: string;
  descrizione: string;
  path: string;
  /** ISO 8601. La data in cui la fonte è stata verificata l'ultima volta. */
  aggiornatoIl: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: titolo,
    description: descrizione,
    inLanguage: "it-IT",
    mainEntityOfPage: { "@type": "WebPage", "@id": `${SITO.url}${path}` },
    dateModified: aggiornatoIl,
    // Stesso `@id` dell'organizzazione: l'autore delle guide è l'entità
    // già descritta in home, non un secondo soggetto con lo stesso nome.
    author: { "@id": idOrganizzazione() },
    publisher: { "@id": idOrganizzazione() },
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
