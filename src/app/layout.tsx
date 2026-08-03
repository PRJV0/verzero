import type { Metadata, Viewport } from "next";
import { Fraunces, Inter } from "next/font/google";

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

export const metadata: Metadata = {
  title: "Ver0 — la piattaforma che qualifica la tua impresa",
  description:
    "Consulenza digitale col Motore Ver0: sostenibilità, sistemi di gestione, consulenti veri. Percorsi verificabili e prezzi in chiaro, per imprese di ogni dimensione.",
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
