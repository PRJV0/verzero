import Link from "next/link";

import { Logo } from "@/components/brand/logo";

/** Voci di navigazione del sito pubblico. */
const NAV = [
  { label: "Come funziona", href: "/#come-funziona" },
  { label: "Servizi e prezzi", href: "/servizi" },
  { label: "Il Sigillo", href: "/sigillo" },
  { label: "Partner", href: "/partner" },
];

/** Header condiviso da tutte le pagine pubbliche. */
export function SiteHeader() {
  return (
    <header className="flex items-center justify-between border-b border-line bg-white px-5 py-3">
      <Link href="/" aria-label="Ver0 — home">
        <Logo />
      </Link>
      <nav className="hidden gap-5 text-xs text-gray-warm sm:flex">
        {NAV.map((n) => (
          <Link key={n.href} href={n.href} className="hover:text-pine">
            {n.label}
          </Link>
        ))}
      </nav>
      <Link
        href="/login"
        className="rounded-lg bg-pine px-3.5 py-2 text-xs font-medium text-white"
      >
        Inizia ora
      </Link>
    </header>
  );
}
