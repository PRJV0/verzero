import Link from "next/link";

/** Footer condiviso da tutte le pagine pubbliche. */
export function SiteFooter() {
  return (
    <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-line px-5 py-3 text-xs text-gray-light">
      <Link href="/partner" className="hover:text-pine">
        Commercialista o consulente? Programma partner con provvigioni
        ricorrenti
      </Link>
      <span>
        verzero.it · dati ospitati in UE · dietro lo schermo ci sono sempre
        persone
      </span>
    </footer>
  );
}
