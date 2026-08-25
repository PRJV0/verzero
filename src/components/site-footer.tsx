import Link from "next/link";

import { Marchio } from "@/components/brand/marchio";
import { LinkPreferenzeCookie } from "@/components/cookie-banner";
import { FAMIGLIE } from "@/lib/catalog";
import { SITO } from "@/lib/seo";
import type { SessionePubblica } from "@/lib/sessione-pubblica";

/**
 * IL FOOTER COME MAPPA DEL SITO.
 *
 * Il menu in alto si è ridotto a cinque voci: quello che ne è uscito non
 * può sparire, deve avere una casa. È qui.
 *
 * ═══ COSA NON ANDAVA IN QUELLO DI PRIMA ═══
 *
 * Elencava i primi CINQUE PERCORSI del catalogo, presi per posizione.
 * Erano nomi tecnici lunghi — «Carbon Footprint di Organizzazione ·
 * Scope 1, 2 e 3» — dentro una colonna stretta, che andavano a capo due
 * volte a testa: la colonna più alta e meno leggibile delle quattro, e
 * per giunta arbitraria, perché mostrava cinque percorsi su quattordici
 * senza dire perché quelli. Ora ci sono le tre FAMIGLIE, che sono la
 * struttura del catalogo e non un suo campione, ciascuna con l'ancora
 * alla sezione corrispondente.
 *
 * Il fondo era chiaro come il resto della pagina e il footer non si
 * distingueva dal contenuto: si capiva che era finita solo perché i
 * caratteri rimpicciolivano. Ora è pino profondo, come le altre fasce
 * scure del sito.
 *
 * Le intestazioni e le voci avevano quasi lo stesso peso (11px contro
 * 12px): una gerarchia che non gerarchizza. Ora l'intestazione è un
 * occhiello in menta e le voci sono testo pieno.
 *
 * ═══ REGOLE ═══
 *
 * - NESSUNA VOCE ORFANA: ogni pagina pubblica è raggiungibile da qui o
 *   dal menu, al più con un passaggio (le schede dal catalogo, le guide
 *   dall'indice). Il collaudo lo verifica sulla sitemap.
 * - NESSUN DATO SOCIETARIO finché la società non esiste: la riga in
 *   fondo porta l'anno e la riserva dei diritti, e basta. Quando ci
 *   saranno sede, registro imprese e capitale, andranno lì.
 */

const AZIENDA = [
  { label: "Chi siamo", href: "/chi-siamo" },
  { label: "Come funziona", href: "/come-funziona" },
  { label: "Il Sigillo Ver0", href: "/sigillo" },
  // Fuori dal menu principale per scelta (v. /guide): il footer è la
  // mappa del sito, ed è qui che i contenuti informativi si trovano.
  { label: "Guide: perché te lo chiedono", href: "/guide" },
  { label: "Programma partner", href: "/partner" },
];

const FIDUCIA = [
  { label: "Sicurezza e riservatezza", href: "/sicurezza" },
  { label: "Informativa privacy", href: "/privacy" },
  { label: "Cookie policy", href: "/cookie-policy" },
  { label: "Condizioni di servizio", href: "/termini" },
];

function Intestazione({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-[11px] font-semibold uppercase tracking-widest text-mint-bright">
      {children}
    </h2>
  );
}

const VOCE = "text-sm leading-relaxed text-moss/80 transition-colors hover:text-white";

function Colonna({
  titolo,
  voci,
}: {
  titolo: string;
  voci: { label: string; href: string }[];
}) {
  return (
    <div className="min-w-0">
      <Intestazione>{titolo}</Intestazione>
      <ul className="mt-4 space-y-2.5">
        {voci.map((v) => (
          <li key={v.href}>
            <Link href={v.href} className={VOCE}>
              {v.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function SiteFooter({ sessione }: { sessione: SessionePubblica }) {
  const anno = new Date().getFullYear();

  return (
    <footer className="bg-pine-deep px-5 py-14 text-moss">
      <div className="mx-auto max-w-5xl">
        {/* Il marchio in testa, con la riga che dice che cosa siamo:
            chi arriva in fondo alla pagina da una guida può non aver mai
            letto la home. */}
        <div className="border-b border-white/12 pb-8">
          <Link
            href="/"
            aria-label="Verzero — torna alla home"
            className="inline-block text-white"
          >
            {/* IL LOCKUP ESTESO. Il payoff non è più una riga di testo
                sotto al logotipo: è la seconda riga del MARCHIO, e lo
                zero grande la chiude insieme al nome. Il footer c'è su
                ogni pagina, comprese le istituzionali, quindi il lockup
                accompagna il marchio dappertutto senza ripeterlo pagina
                per pagina. */}
            <Marchio variante="estesa" dimensione={60} />
          </Link>
          <p className="mt-7 max-w-xl text-sm leading-relaxed text-moss/75">
            La piattaforma italiana che qualifica le imprese su sostenibilità
            e sistemi di gestione: documenti costruiti sui dati che hai già,
            validati da un professionista, con i prezzi pubblici.
          </p>
        </div>

        {/* Quattro colonne. Su schermo stretto due, non una: le voci sono
            corte e una colonna sola allungherebbe il footer per niente.
            Nessuna sezione arriva a cinque voci scarse, quindi nessun
            accordion: un accordion su quattro voci nasconde quello che
            stava già bene dov'era, e aggiunge JavaScript a un footer che
            non ne ha. */}
        <nav
          aria-label="Mappa del sito"
          className="grid grid-cols-2 gap-x-6 gap-y-10 py-10 md:grid-cols-4 md:gap-x-8"
        >
          <div className="min-w-0">
            <Intestazione>Percorsi</Intestazione>
            <ul className="mt-4 space-y-2.5">
              {FAMIGLIE.map((f) => (
                <li key={f.key}>
                  <Link href={`/servizi#famiglia-${f.key}`} className={VOCE}>
                    {f.titolo}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href="/servizi"
                  className="text-sm font-semibold leading-relaxed text-mint-bright transition-colors hover:text-white"
                >
                  Tutti i percorsi e i prezzi
                </Link>
              </li>
            </ul>
          </div>

          <Colonna titolo="L'azienda" voci={AZIENDA} />
          <Colonna titolo="Fiducia" voci={FIDUCIA} />

          <div className="min-w-0">
            <Intestazione>Contatti</Intestazione>
            <ul className="mt-4 space-y-2.5">
              <li>
                <Link href="/contatti" className={VOCE}>
                  Scrivici
                </Link>
              </li>
              <li>
                <a href={`mailto:${SITO.email}`} className={VOCE}>
                  {SITO.email}
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${SITO.email}?subject=Percorsi%20su%20misura%20%E2%80%94%20grande%20impresa`}
                  className={VOCE}
                >
                  Grande impresa? Percorsi su misura
                </a>
              </li>
              <li>
                {/* A chi è già dentro non si dice «Accedi»: si offre la
                    porta giusta (SPEC §12.K). */}
                <Link
                  href={sessione.autenticato ? "/dashboard" : "/login"}
                  className="text-sm font-semibold leading-relaxed text-mint-bright transition-colors hover:text-white"
                >
                  {sessione.autenticato ? "Il mio ecosistema" : "Accedi"}
                </Link>
              </li>
            </ul>
            <p className="mt-4 text-xs leading-relaxed text-moss/55">
              Dietro lo schermo ci sono sempre persone.
            </p>
          </div>
        </nav>

        {/* La riga sottile: anno, riserva dei diritti, e la revoca del
            consenso ai cookie — che dev'essere facile da trovare quanto
            lo è stato darlo (SPEC §15). Nessun dato societario. */}
        <div className="flex flex-col gap-3 border-t border-white/12 pt-6 text-xs text-moss/55 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {anno} {SITO.nome}. Tutti i diritti riservati.
          </p>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <LinkPreferenzeCookie className="transition-colors hover:text-white" />
            <span>verzero.it</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
