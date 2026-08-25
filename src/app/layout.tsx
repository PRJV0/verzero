import type { Metadata, Viewport } from "next";
import { Fraunces, Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";

import { publicEnv } from "@/lib/env";
import { SITO } from "@/lib/seo";

import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["400", "600"],
  // Il corsivo Fraunces è l'accento tipografico delle "parole-zero" (art direction).
  style: ["normal", "italic"],
  variable: "--font-fraunces",
  display: "swap",
});

/**
 * Metadati radice: base comune a tutte le pagine (SPEC — regola SEO
 * permanente, v. src/lib/seo.ts). `metadataBase` rende assoluti i canonical
 * e le immagini social; il template aggiunge il marchio al titolo di ogni
 * pagina, così le singole pagine dichiarano solo la propria parte.
 */
export const metadata: Metadata = {
  metadataBase: new URL(publicEnv.siteUrl),
  title: {
    // Il titolo del SITO è marchio più payoff, composto dalla fonte
    // unica: scriverlo a mano qui vorrebbe dire tenerlo allineato a
    // memoria a ogni revisione del payoff.
    default: `${SITO.nome} — ${SITO.payoff}`,
    template: `%s — ${SITO.nome}`,
  },
  description:
    "Consulenza digitale con l'AI Ver0: sostenibilità, sistemi di gestione, consulenti veri. Percorsi verificabili e prezzi in chiaro, per imprese di ogni dimensione.",
  applicationName: SITO.nome,
  authors: [{ name: SITO.nome }],
  creator: SITO.nome,
  publisher: SITO.nome,
  formatDetection: { telephone: false, address: false, email: false },
  openGraph: {
    type: "website",
    locale: "it_IT",
    siteName: SITO.nome,
    url: "/",
    images: [{ url: SITO.ogImage, width: 1200, height: 630, alt: SITO.nome }],
  },
  twitter: { card: "summary_large_image", images: [SITO.ogImage] },
  /**
   * Verifica della proprietà del dominio per i motori di ricerca. I
   * codici arrivano da variabili d'ambiente: sono pubblici (finiscono in
   * un meta tag), ma tenerli fuori dal codice permette di cambiarli
   * senza un rilascio. Se mancano, Next non emette il tag.
   */
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
    other: process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION
      ? { "msvalidate.01": process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION }
      : {},
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
};

// Mobile-first: l'app deve essere pienamente fruibile da smartphone (SPEC §2).
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="it" className={`${inter.variable} ${fraunces.variable}`}>
      <body className="font-sans antialiased">
        {children}
        {/* Traffico e sorgenti: nessun cookie, quindi fuori dal consenso.
            Gli eventi di business vivono invece in casa nostra, accanto
            agli ordini e ai lead — vedi src/lib/eventi.ts. */}
        <Analytics />
      </body>
    </html>
  );
}
