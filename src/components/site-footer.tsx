import Link from "next/link";

import { Logo } from "@/components/brand/logo";
import { LinkPreferenzeCookie } from "@/components/cookie-banner";
import { SERVIZI } from "@/lib/catalog";
import type { SessionePubblica } from "@/lib/sessione-pubblica";

/**
 * IL FOOTER COME MAPPA, non come striscia di link.
 *
 * Il menu in alto si è ridotto a cinque voci: quello che ne è uscito non
 * può sparire, deve avere una casa. Qui, in quattro colonne che dicono
 * cosa contengono — Servizi, L'azienda, Fiducia, Legale — così chi cerca
 * Partner, Sicurezza o le condizioni sa dove guardare senza indovinare.
 *
 * Regola: nessun link orfano. Ogni pagina pubblica del sito è
 * raggiungibile da qui o dal menu.
 */

/** Le colonne fisse. I servizi arrivano dal catalogo, mai scritti a mano. */
const AZIENDA = [
  { label: "Chi siamo", href: "/chi-siamo" },
  { label: "Come funziona", href: "/come-funziona" },
  // Fuori dal menu principale per scelta (v. /guide): il footer è la
  // mappa del sito, ed è lì che i contenuti informativi si trovano.
  { label: "Guide: perché te lo chiedono", href: "/guide" },
  { label: "Programma partner", href: "/partner" },
  { label: "Contatti", href: "/contatti" },
];

const FIDUCIA = [
  { label: "Il Sigillo Ver0", href: "/sigillo" },
  { label: "Sicurezza e riservatezza", href: "/sicurezza" },
];

function Colonna({
  titolo,
  voci,
}: {
  titolo: string;
  voci: { label: string; href: string }[];
}) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-light">
        {titolo}
      </p>
      <ul className="mt-3 space-y-1.5">
        {voci.map((v) => (
          <li key={v.href}>
            <Link
              href={v.href}
              className="text-xs leading-relaxed text-gray-warm hover:text-pine"
            >
              {v.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function SiteFooter({ sessione }: { sessione: SessionePubblica }) {
  // I primi percorsi nell'ordine del catalogo, non tutti: il footer è una
  // mappa, non la vetrina — che sta a un clic. Se un giorno il catalogo
  // cresce, qui non cambia niente.
  const servizi = SERVIZI.slice(0, 5);

  return (
    <footer className="border-t border-line px-5 py-10">
      <div className="mx-auto grid max-w-5xl grid-cols-2 gap-x-6 gap-y-8 md:grid-cols-4">
        <Colonna
          titolo="Servizi"
          voci={[
            // Il taglio fa parte del nome quando c'è: senza, nel footer
            // comparirebbero due voci identiche che portano a pagine
            // diverse — il modo più rapido per far sbagliare clic.
            ...servizi.map((s) => ({
              label: s.taglio ? `${s.name} · ${s.taglio}` : s.name,
              href: `/servizi/${s.slug}`,
            })),
            { label: "Tutti i servizi e i prezzi", href: "/servizi" },
          ]}
        />
        <Colonna titolo="L'azienda" voci={AZIENDA} />
        <Colonna titolo="Fiducia" voci={FIDUCIA} />
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-light">
            Legale
          </p>
          <ul className="mt-3 space-y-1.5">
            <li>
              <Link
                href="/privacy"
                className="text-xs leading-relaxed text-gray-warm hover:text-pine"
              >
                Privacy
              </Link>
            </li>
            <li>
              <Link
                href="/cookie-policy"
                className="text-xs leading-relaxed text-gray-warm hover:text-pine"
              >
                Cookie policy
              </Link>
            </li>
            <li>
              {/* La scelta sui cookie dev'essere revocabile con la stessa
                  facilità con cui è stata data (SPEC §15). */}
              <LinkPreferenzeCookie className="text-xs leading-relaxed text-gray-warm hover:text-pine" />
            </li>
            <li>
              <Link
                href="/termini"
                className="text-xs leading-relaxed text-gray-warm hover:text-pine"
              >
                Condizioni di servizio
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="mx-auto mt-10 flex max-w-5xl flex-col gap-4 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between">
        <Link href="/" aria-label="Verzero — torna alla home">
          <Logo className="text-lg" />
        </Link>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-gray-light">
          <a
            href="mailto:info@verzero.it?subject=Percorsi%20su%20misura%20%E2%80%94%20grande%20impresa"
            className="hover:text-pine"
          >
            Grande impresa? Percorsi su misura
          </a>
          {/* A chi è già dentro non si dice «Accedi»: si offre la porta
              giusta (SPEC §12.K). */}
          <Link
            href={sessione.autenticato ? "/dashboard" : "/login"}
            className="font-medium text-pine hover:underline"
          >
            {sessione.autenticato ? "Il mio ecosistema" : "Accedi"}
          </Link>
          <span>verzero.it · dietro lo schermo ci sono sempre persone</span>
        </div>
      </div>
    </footer>
  );
}
