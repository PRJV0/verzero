import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Handshake, Repeat, Users } from "lucide-react";

import { JsonLd } from "@/components/json-ld";
import { jsonLdBreadcrumb, metadataPagina } from "@/lib/seo";

export const metadata: Metadata = metadataPagina({
  title: "Programma partner per commercialisti e consulenti",
  description:
    "Dashboard multi-cliente, percorsi standardizzati e documenti pronti: il programma partner Ver0 per commercialisti e consulenti che affiancano già le imprese.",
  path: "/partner",
});

/*
 * Il partner si racconta con gli STRUMENTI e con la qualità, mai con i
 * numeri: provvigioni, percentuali e ritorni economici non stanno su una
 * pagina pubblica. Sono condizioni commerciali, e le condizioni
 * commerciali si trattano in privato — anche perché una percentuale
 * scritta sul sito diventa un impegno verso chiunque passi di lì.
 */
const PUNTI = [
  {
    icon: Users,
    title: "Una dashboard multi-cliente",
    desc: "Un accesso solo, il selettore per passare da un'impresa all'altra. Vedi le imprese che ti hanno dato il mandato, e solo finché è attivo.",
  },
  {
    icon: Repeat,
    title: "Percorsi standardizzati",
    desc: "Lo stesso impianto per ogni cliente: documenti conformi alle norme citate, dati tracciati alla fonte, ogni elaborato validato prima della consegna.",
  },
  {
    icon: Handshake,
    title: "Il cliente resta tuo",
    desc: "Porti la relazione, noi mettiamo la piattaforma e la validazione professionale. Nessuna sovrapposizione sul tuo lavoro.",
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
        Sei un commercialista o un consulente? Con il programma partner Ver0
        porti i tuoi clienti verso una qualifica verificabile usando gli
        strumenti della piattaforma: una dashboard che tiene insieme tutte le
        imprese che segui, percorsi standardizzati e documenti pronti da
        consegnare.
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
        Condizioni dedicate ai partner, su richiesta · il mandato del cliente
        resta revocabile in ogni momento
        i canali partner
      </p>
    </main>
  );
}
