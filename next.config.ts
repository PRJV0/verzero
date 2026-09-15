import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // La regione delle funzioni sta in `vercel.json` (`dub1`, Dublino):
  // accanto al database, che è in eu-west-1. Non è un dettaglio di
  // latenza — la predefinita di Vercel è Washington, quindi senza quel
  // file l'applicazione girerebbe negli Stati Uniti mentre la pagina
  // pubblica dichiara che i dati vivono in UE.
  experimental: {
    // Il logo arriva a una server action: il limite predefinito (1 MB) è
    // sotto i 4 MB che la veste dei documenti ammette (`MAX_BYTE_LOGO`).
    // Non oltre 4,5: è il tetto delle richieste sulla piattaforma che ospita
    // le funzioni, e un limite più largo qui prometterebbe un file che
    // comunque non arriva.
    serverActions: { bodySizeLimit: "4.5mb" },
  },
  // PDFKit legge a runtime i propri file di dati accanto al codice: se il
  // bundler lo impacchetta, quei percorsi non esistono più.
  serverExternalPackages: ["pdfkit"],
  // I caratteri del generatore stanno fuori da `public/` (non sono una
  // risorsa del sito): vanno portati esplicitamente nelle funzioni che
  // generano documenti, insieme ai dati di PDFKit.
  outputFileTracingIncludes: {
    "/dashboard/**": [
      "./src/lib/elaborato/caratteri/*.ttf",
      "./node_modules/pdfkit/js/data/**/*",
    ],
  },
  // Rebranding: "bollino" -> "Sigillo Ver0". La vecchia rotta reindirizza
  // permanentemente alla nuova, così link e segnalibri esistenti non si rompono.
  async redirects() {
    // Nomenclatura ufficiale §12.I: gli slug vecchi reindirizzano ai nuovi,
    // sia sulle pagine servizio sia sul funnel d'acquisto. Niente catene:
    // ogni vecchio URL punta direttamente alla destinazione finale.
    const RINOMINE: Record<string, string> = {
      "carbon-light": "carbon-footprint-scope-1-2",
      "carbon-completa": "carbon-footprint-scope-1-2-3",
      "bilancio-vsme-base": "bilancio-sostenibilita-vsme-base",
      "bilancio-vsme-avanzato": "bilancio-sostenibilita-vsme-avanzato",
      "manuale-iso-9001": "manuale-sistema-gestione-iso-9001",
      "manuale-iso-14001": "manuale-sistema-gestione-iso-14001",
      "manuale-iso-45001": "manuale-sistema-gestione-iso-45001",
      // La vecchia pagina carbon unica punta al taglio Scope 1 e 2.
      "carbon-footprint-base": "carbon-footprint-scope-1-2",
    };
    return [
      { source: "/bollino", destination: "/sigillo", permanent: true },
      ...Object.entries(RINOMINE).flatMap(([vecchio, nuovo]) => [
        {
          source: `/servizi/${vecchio}`,
          destination: `/servizi/${nuovo}`,
          permanent: true,
        },
        {
          source: `/acquista/${vecchio}`,
          destination: `/acquista/${nuovo}`,
          permanent: true,
        },
      ]),
    ];
  },
};

export default nextConfig;
