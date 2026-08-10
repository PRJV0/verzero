import Link from "next/link";

import { Logo } from "@/components/brand/logo";

/** Footer condiviso da tutte le pagine pubbliche. */
export function SiteFooter() {
  return (
    <footer className="border-t border-line px-5 py-6">
      <div className="mx-auto flex max-w-5xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Link href="/" aria-label="Ver0 — home">
          <Logo className="text-lg" />
        </Link>
        <nav
          aria-label="Navigazione footer"
          className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-gray-warm"
        >
          <Link href="/" className="hover:text-pine">
            Home
          </Link>
          <Link href="/chi-siamo" className="hover:text-pine">
            Chi siamo
          </Link>
          <Link href="/servizi" className="hover:text-pine">
            Servizi
          </Link>
          <Link href="/sigillo" className="hover:text-pine">
            Il Sigillo
          </Link>
          <Link href="/partner" className="hover:text-pine">
            Partner
          </Link>
          <Link href="/contatti" className="hover:text-pine">
            Contatti
          </Link>
        </nav>
      </div>
      <div className="mx-auto mt-4 flex max-w-5xl flex-wrap items-center justify-between gap-2 text-xs text-gray-light">
        <span className="flex flex-wrap gap-x-4 gap-y-1">
          <Link href="/partner" className="hover:text-pine">
            Commercialista o consulente? Programma partner con provvigioni
            ricorrenti
          </Link>
          <a
            href="mailto:info@verzero.it?subject=Percorsi%20su%20misura%20%E2%80%94%20grande%20impresa"
            className="hover:text-pine"
          >
            Grande impresa? Percorsi su misura: parliamone
          </a>
        </span>
        <span>
          verzero.it · dati ospitati in UE · dietro lo schermo ci sono sempre
          persone
        </span>
      </div>
    </footer>
  );
}
