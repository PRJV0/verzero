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
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-gray-warm">
          <Link href="/servizi" className="hover:text-pine">
            Servizi e prezzi
          </Link>
          <Link href="/sigillo" className="hover:text-pine">
            Il Sigillo
          </Link>
          <Link href="/partner" className="hover:text-pine">
            Partner
          </Link>
        </div>
      </div>
      <div className="mx-auto mt-4 flex max-w-5xl flex-wrap items-center justify-between gap-2 text-xs text-gray-light">
        <Link href="/partner" className="hover:text-pine">
          Commercialista o consulente? Programma partner con provvigioni
          ricorrenti
        </Link>
        <span>
          verzero.it · dati ospitati in UE · dietro lo schermo ci sono sempre
          persone
        </span>
      </div>
    </footer>
  );
}
