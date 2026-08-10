import type { Metadata, Viewport } from "next";
import { Fraunces, Inter } from "next/font/google";

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
    default: "Ver0 — la piattaforma che qualifica la tua impresa",
    template: `%s — ${SITO.nome}`,
  },
  description:
    "Consulenza digitale col Motore Ver0: sostenibilità, sistemi di gestione, consulenti veri. Percorsi verificabili e prezzi in chiaro, per imprese di ogni dimensione.",
  applicationName: SITO.nome,
  authors: [{ name: SITO.nomeLegale }],
  creator: SITO.nomeLegale,
  publisher: SITO.nomeLegale,
  formatDetection: { telephone: false, address: false, email: false },
  openGraph: {
    type: "website",
    locale: "it_IT",
    siteName: SITO.nome,
    url: "/",
    images: [{ url: SITO.ogImage, width: 1200, height: 630, alt: SITO.nome }],
  },
  twitter: { card: "summary_large_image", images: [SITO.ogImage] },
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
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
