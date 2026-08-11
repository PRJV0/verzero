import Link from "next/link";

import { Logo } from "@/components/brand/logo";
import { MobileMenu } from "@/components/mobile-menu";

/**
 * Voci di navigazione del sito pubblico. "Home" apre il menu anche se il
 * logo resta cliccabile: chi legge una voce di menu non deve indovinare
 * che il marchio sia un link.
 */
const NAV = [
  { label: "Home", href: "/" },
  { label: "Chi siamo", href: "/chi-siamo" },
  { label: "Come funziona", href: "/#come-funziona" },
  { label: "Servizi", href: "/servizi" },
  { label: "Il Sigillo", href: "/sigillo" },
  { label: "Partner", href: "/partner" },
  { label: "Contatti", href: "/contatti" },
];

/**
 * Header condiviso da tutte le pagine pubbliche. "Accedi" è sempre
 * visibile, su desktop e mobile (SPEC §12.K): è la porta dell'ecosistema.
 * Sotto i 768px la navigazione passa dal menu a scomparsa.
 */
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-line bg-white px-5 py-3">
      <Link href="/" aria-label="Ver0 — home">
        <Logo />
      </Link>
      <nav
        aria-label="Navigazione principale"
        className="hidden gap-5 text-xs text-gray-warm md:flex"
      >
        {NAV.map((n) => (
          <Link key={n.href} href={n.href} className="hover:text-pine">
            {n.label}
          </Link>
        ))}
      </nav>
      <div className="flex items-center gap-2">
        <Link
          href="/login"
          className="rounded-lg bg-pine px-3.5 py-2 text-xs font-medium text-white"
        >
          Accedi
        </Link>
        <MobileMenu voci={NAV} />
      </div>
    </header>
  );
}
