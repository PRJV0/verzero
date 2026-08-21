import Link from "next/link";

import { Logo } from "@/components/brand/logo";
import { MenuUtente } from "@/components/menu-utente";
import { MobileMenu } from "@/components/mobile-menu";
import type { SessionePubblica } from "@/lib/sessione-pubblica";

/**
 * CINQUE VOCI, non sette. Un menu si legge se si conta a colpo d'occhio.
 *
 * «Home» è uscita: alla home ci si torna dal marchio, che è un link con
 * l'etichetta accessibile giusta — la convenzione è universale e occupare
 * una voce per ribadirla è spreco.
 *
 * «Partner» è uscita dal menu principale perché parla a un pubblico
 * diverso (i consulenti, non le imprese): vive dentro Chi siamo, e la
 * pagina `/partner` resta raggiungibile da lì, dal footer e dalla pagina
 * di accesso. Nessun link orfano, nessun 404.
 */
export const NAV = [
  { label: "Chi siamo", href: "/chi-siamo" },
  { label: "Come funziona", href: "/come-funziona" },
  { label: "Servizi", href: "/servizi" },
  { label: "Il Sigillo", href: "/sigillo" },
  { label: "Contatti", href: "/contatti" },
];

/**
 * Header condiviso da tutte le pagine pubbliche. "Accedi" è sempre
 * visibile, su desktop e mobile (SPEC §12.K): è la porta dell'ecosistema.
 * Sotto i 768px la navigazione passa dal menu a scomparsa.
 *
 * Chi è già autenticato non vede «Accedi» ma il proprio nome: lo stato
 * arriva già risolto dal server, quindi è giusto al primo fotogramma.
 */
export function SiteHeader({ sessione }: { sessione: SessionePubblica }) {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-line bg-white px-5 py-3">
      <Link href="/" aria-label="Verzero — torna alla home">
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
        {sessione.autenticato ? (
          <MenuUtente
            nome={sessione.nome}
            iniziale={sessione.iniziale}
            email={sessione.email}
          />
        ) : (
          <Link
            href="/login"
            className="rounded-lg bg-pine px-3.5 py-2 text-xs font-medium text-white"
          >
            Accedi
          </Link>
        )}
        <MobileMenu voci={NAV} />
      </div>
    </header>
  );
}
