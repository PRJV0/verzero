import Link from "next/link";

import { Logo } from "@/components/brand/logo";
import { LinkPreferenzeCookie } from "@/components/cookie-banner";
import type { SessionePubblica } from "@/lib/sessione-pubblica";

/** Footer condiviso da tutte le pagine pubbliche. */
export function SiteFooter({ sessione }: { sessione: SessionePubblica }) {
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
          <Link href="/come-funziona" className="hover:text-pine">
            Come funziona
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
          {/* Richiamo all'ecosistema (SPEC §12.K): a chi è già dentro non
              si dice «Accedi», si offre la porta giusta. */}
          <Link
            href={sessione.autenticato ? "/dashboard" : "/login"}
            className="font-medium text-pine hover:underline"
          >
            {sessione.autenticato ? "Il mio ecosistema" : "Accedi"}
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
          {sessione.autenticato ? (
            <Link href="/dashboard" className="hover:text-pine">
              Torna al tuo ecosistema
            </Link>
          ) : (
            <Link href="/login" className="hover:text-pine">
              Sei già cliente o consulente partner? Accedi al tuo ecosistema
            </Link>
          )}
        </span>
        <span className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <Link href="/privacy" className="hover:text-pine">
            Privacy
          </Link>
          <Link href="/cookie-policy" className="hover:text-pine">
            Cookie policy
          </Link>
          {/* La scelta sui cookie dev'essere revocabile con la stessa
              facilità con cui è stata data (SPEC §15). */}
          <LinkPreferenzeCookie className="hover:text-pine" />
          <Link href="/termini" className="hover:text-pine">
            Termini
          </Link>
          <span>
            verzero.it · dati ospitati in UE · dietro lo schermo ci sono
            sempre persone
          </span>
        </span>
      </div>
    </footer>
  );
}
