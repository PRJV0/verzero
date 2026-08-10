import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Handshake, Repeat, Users } from "lucide-react";

import { JsonLd } from "@/components/json-ld";
import { jsonLdBreadcrumb, metadataPagina } from "@/lib/seo";

export const metadata: Metadata = metadataPagina({
  title: "Programma partner per commercialisti e consulenti",
  description:
    "Provvigione ricorrente sul canone incassato, uno schema unico e il cliente che resta tuo: il programma partner Ver0 per chi affianca già le imprese.",
  path: "/partner",
});

const PUNTI = [
  {
    icon: Repeat,
    title: "Provvigione ricorrente",
    desc: "Il 20% sul canone incassato, per tutta la durata dell'abbonamento del cliente segnalato.",
  },
  {
    icon: Handshake,
    title: "Uno schema unico",
    desc: "Le stesse condizioni per tutti i canali partner, senza trattative caso per caso.",
  },
  {
    icon: Users,
    title: "Il cliente resta tuo",
    desc: "Porti la relazione, noi mettiamo la piattaforma. Nessuna sovrapposizione sul tuo lavoro.",
  },
];

export default function PartnerPage() {
  return (
    <main className="mx-auto max-w-2xl px-5 py-16 text-center">
      <JsonLd
        dati={jsonLdBreadcrumb([
          { nome: "Home", path: "/" },
          { nome: "Partner", path: "/partner" },
        ])}
      />
      <span className="inline-flex items-center gap-2 rounded-full bg-moss px-3.5 py-1.5 text-xs font-medium text-pine">
        <Handshake size={14} /> In arrivo
      </span>
      <h1 className="mt-5 font-display text-4xl text-ink md:text-5xl">
        Programma partner
      </h1>
      <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-gray-warm">
        Sei un commercialista o un consulente? Stiamo aprendo il programma
        partner Ver0: porti i tuoi clienti verso una qualifica verificabile, con
        una provvigione ricorrente sul canone. Stiamo definendo gli ultimi
        dettagli — lascia che ti avvisiamo appena parte.
      </p>

      <div className="mt-10 grid grid-cols-1 gap-3 text-left sm:grid-cols-3">
        {PUNTI.map((p) => {
          const Icon = p.icon;
          return (
            <div
              key={p.title}
              className="rounded-xl border border-line bg-white p-4"
            >
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-moss text-pine">
                <Icon size={18} />
              </span>
              <p className="mt-3 text-sm font-semibold text-ink">{p.title}</p>
              <p className="mt-1 text-xs leading-relaxed text-gray-warm">
                {p.desc}
              </p>
            </div>
          );
        })}
      </div>

      <div className="mt-10 flex flex-wrap items-center justify-center gap-2.5">
        <a
          href="mailto:partner@verzero.it?subject=Programma%20partner%20Ver0"
          className="rounded-lg bg-pine px-5 py-2.5 text-sm font-medium text-white"
        >
          Scrivici per il programma partner
        </a>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 rounded-lg border border-pine bg-white px-5 py-2.5 text-sm font-medium text-pine"
        >
          <ArrowLeft size={15} /> Torna alla home
        </Link>
      </div>

      <p className="mt-8 text-xs text-gray-light">
        Nessuna provvigione sul canale self-service · condizioni valide per tutti
        i canali partner
      </p>
    </main>
  );
}
