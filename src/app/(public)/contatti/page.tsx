import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookMarked, Clock, ShieldCheck } from "lucide-react";

import { JsonLd } from "@/components/json-ld";
import { PROMESSA_RISPOSTA } from "@/lib/contatti";
import { SOLO_STANDARD_UFFICIALI } from "@/lib/catalog";
import { jsonLdBreadcrumb, metadataPagina } from "@/lib/seo";

import { ModuloContatto } from "./modulo-contatto";

export const metadata: Metadata = metadataPagina({
  title: "Contatti — scrivici, rispondiamo in un giorno",
  description:
    "Scrivi a Ver0 per informazioni, per un servizio o per una partnership: il modulo arriva a una persona e la risposta arriva entro un giorno lavorativo.",
  path: "/contatti",
});

/**
 * Pagina contatti.
 *
 * VINCOLO: nessun dato personale, telefono o indirizzo in pagina. Solo il
 * modulo e la promessa di risposta — finché la società non esiste, esporre
 * recapiti sarebbe raccontare una struttura che non c'è.
 */

const GARANZIE = [
  {
    icon: Clock,
    titolo: "Una risposta, non un preventivo da rincorrere",
    testo:
      "Rispondiamo entro un giorno lavorativo. Se la domanda riguarda un prezzo, la risposta breve è che il listino è già pubblico: lo trovi in ogni pagina servizio.",
  },
  {
    icon: ShieldCheck,
    titolo: "Scrive una persona",
    testo:
      "Il messaggio arriva a chi lavora sui percorsi, non a un centralino. Nessuna sequenza automatica di email commerciali dopo l'invio.",
  },
  {
    icon: BookMarked,
    titolo: "Solo standard ufficiali",
    testo: SOLO_STANDARD_UFFICIALI,
  },
];

export default function ContattiPage() {
  return (
    <main className="mx-auto max-w-5xl px-5 pb-16 pt-10">
      <JsonLd
        dati={jsonLdBreadcrumb([
          { nome: "Home", path: "/" },
          { nome: "Contatti", path: "/contatti" },
        ])}
      />

      <div className="max-w-2xl">
        <p className="mb-3 text-xs font-semibold tracking-widest text-pine">
          CONTATTI
        </p>
        <h1 className="font-display text-4xl leading-[1.08] text-ink md:text-5xl">
          Scrivici. Risponde una persona, entro un giorno lavorativo.
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-gray-warm">
          Che tu voglia capire da dove si comincia, chiedere di un servizio
          preciso o proporre una collaborazione, questo modulo è la via più
          diretta. Non serve preparare nulla: bastano il tuo settore e la
          domanda che hai in testa.
        </p>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-[1.3fr_1fr]">
        <section aria-labelledby="modulo-h">
          <h2 id="modulo-h" className="sr-only">
            Modulo di contatto
          </h2>
          <div className="rounded-2xl border border-line bg-white p-5 shadow-soft sm:p-6">
            <ModuloContatto />
          </div>
        </section>

        <aside className="space-y-4">
          <h2 className="font-display text-2xl text-ink">
            Cosa succede dopo l&apos;invio
          </h2>
          {GARANZIE.map((g) => {
            const Icona = g.icon;
            return (
              <div
                key={g.titolo}
                className="rounded-2xl border border-line/70 bg-paper p-4"
              >
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-moss text-pine">
                  <Icona size={18} />
                </span>
                <h3 className="mt-2.5 text-sm font-semibold text-ink">
                  {g.titolo}
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-gray-warm">
                  {g.testo}
                </p>
              </div>
            );
          })}

          {/* Link interni: chi arriva qui spesso cerca prima le risposte. */}
          <div className="rounded-2xl border border-line/70 bg-white p-4">
            <h3 className="text-sm font-semibold text-ink">
              Forse la risposta è già qui
            </h3>
            <ul className="mt-2 space-y-1.5 text-sm">
              {[
                { href: "/servizi", label: "Servizi e prezzi in chiaro" },
                { href: "/sigillo", label: "Come funziona il Sigillo Ver0" },
                { href: "/chi-siamo", label: "Chi siamo e come lavoriamo" },
                { href: "/partner", label: "Programma partner" },
              ].map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="inline-flex items-center gap-1.5 font-medium text-pine hover:underline"
                  >
                    {l.label} <ArrowRight size={13} />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <p className="text-xs leading-relaxed text-gray-light">
            I dati che ci lasci servono solo a risponderti e restano su
            infrastruttura nell&apos;Unione Europea. {PROMESSA_RISPOSTA}
          </p>
        </aside>
      </div>
    </main>
  );
}
