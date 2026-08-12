import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookMarked, UserCheck } from "lucide-react";

import { JsonLd } from "@/components/json-ld";
import { MotoreScrolly } from "@/components/motore-scrolly";
import { SOLO_STANDARD_UFFICIALI } from "@/lib/catalog";
import { jsonLdBreadcrumb, metadataPagina } from "@/lib/seo";

export const metadata: Metadata = metadataPagina({
  title: "Come funziona: il Motore, i documenti, la firma",
  description:
    "Il fascicolo del percorso documento per documento, cosa legge il Motore Ver0, cosa genera e chi firma la verifica: la profondità tecnica, con le norme citate.",
  path: "/come-funziona",
});

/**
 * /come-funziona — la casa della profondità tecnica (SPEC §12.J).
 *
 * La home vende la potenza e il risultato; QUI vive il come: il fascicolo
 * del percorso con tab, card-documento e anello di completamento, le fasi
 * con il contratto entra/esce/norma, la verifica umana con esito. Ogni
 * pagina servizio ha poi il suo «Cosa ti chiederemo» specifico.
 */
export default function ComeFunzionaPage() {
  return (
    <main>
      <JsonLd
        dati={jsonLdBreadcrumb([
          { nome: "Home", path: "/" },
          { nome: "Come funziona", path: "/come-funziona" },
        ])}
      />

      {/* Apertura: qui si spiega, e lo si dichiara. */}
      <section className="bg-moss px-5 py-16 md:py-24">
        <div className="mx-auto max-w-3xl text-center">
          <p className="mb-4 text-xs font-semibold tracking-widest text-pine">
            COME FUNZIONA
          </p>
          <h1 className="font-display text-5xl leading-[1.02] text-pine-dark md:text-6xl">
            Nessuna magia. Un metodo.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-sm leading-relaxed text-gray-warm md:text-base">
            Questa pagina mostra il lavoro da vicino: quali documenti chiede il
            Motore Ver0, che cosa ne estrae, che cosa genera e chi mette la
            firma. Tutto su norme citate una per una.
          </p>
        </div>
      </section>

      {/* La profondità: fascicolo del percorso + le tre fasi con
          entra/esce/norma. Vive qui, non in home (§12.J). */}
      <MotoreScrolly />

      {/* La firma umana e il principio delle norme: i due pilastri del metodo */}
      <section className="bg-white px-5 py-16">
        <div className="mx-auto grid max-w-4xl grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="border-2 border-line p-6">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-moss text-pine">
              <UserCheck size={20} />
            </span>
            <h2 className="mt-4 font-display text-2xl text-ink">
              La responsabilità resta di persone
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-gray-warm">
              Nessun documento viene emesso senza una verifica umana, e ogni
              verifica porta il nome di chi l&apos;ha fatta. Le elaborazioni del
              Motore sono sempre dichiarate.
            </p>
            <Link
              href="/chi-siamo"
              className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-pine hover:underline"
            >
              Conosci chi verifica <ArrowRight size={15} />
            </Link>
          </div>
          <div className="border-2 border-line p-6">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-moss text-pine">
              <BookMarked size={20} />
            </span>
            <h2 className="mt-4 font-display text-2xl text-ink">
              Solo standard ufficiali
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-gray-warm">
              {SOLO_STANDARD_UFFICIALI} Ogni documento cita la norma su cui è
              costruito, riga per riga.
            </p>
            <Link
              href="/sigillo"
              className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-pine hover:underline"
            >
              Come si dimostra: il Sigillo <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </section>

      {/* CTA finale: dal metodo al catalogo. */}
      <section className="border-t-2 border-line bg-white px-5 py-16 text-center">
        <h2 className="font-display text-4xl text-ink md:text-5xl">
          Visto il metodo, scegli il percorso.
        </h2>
        <p className="mx-auto mt-3 max-w-lg text-sm text-gray-warm">
          Ogni pagina servizio elenca il suo «Cosa ti chiederemo»: la lista
          esatta dei documenti, prima di attivare.
        </p>
        <div className="mt-7 flex justify-center">
          <Link
            href="/servizi"
            className="vz-press inline-flex items-center gap-2 rounded-xl bg-pine px-7 py-4 text-base font-semibold text-white hover:-translate-y-0.5"
          >
            Calcola il prezzo <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    </main>
  );
}
