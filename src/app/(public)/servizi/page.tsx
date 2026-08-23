import type { Metadata } from "next";
import Link from "next/link";

import { CatalogoFamiglie } from "@/components/catalogo-famiglie";
import { JsonLd } from "@/components/json-ld";
import { jsonLdBreadcrumb, metadataPagina } from "@/lib/seo";

export const metadata: Metadata = metadataPagina({
  title: "Servizi e prezzi in chiaro, per ogni dimensione",
  description:
    "Misura e rendiconta, sistemi certificabili, qualifica e accesso: i percorsi Verzero con prezzo a partire da e perimetro scritti prima di iniziare.",
  path: "/servizi",
});

/**
 * Indice dei servizi — il catalogo, e nient'altro.
 *
 * ORDINE DELLA PAGINA, tre lavori distinti in fila: la MAPPA mostra come
 * sono organizzati i percorsi (tre famiglie, una riga ciascuna), il
 * SELETTORE filtra per situazione, il CATALOGO elenca. Nessuno dei tre
 * ripete il lavoro degli altri.
 *
 * QUI DENTRO NON C'È PIÙ IL CONTESTO NORMATIVO. C'è stato, in due forme:
 * prima uno schema astratto su chi valuta l'impresa, poi quattro fatti
 * con le norme citate. Il secondo era corretto e verificato, e restava
 * nel posto sbagliato — chi apre un catalogo ha già deciso di guardare
 * cosa vendiamo, e una lezione di contesto davanti all'elenco allunga la
 * strada verso l'unica cosa che era venuto a fare. Quel contenuto vive
 * in /guide, dove la domanda «perché me lo chiedono» nasce davvero, e da
 * qui ci arriva un rimando solo.
 *
 * Il catalogo è raggruppato per NATURA della qualifica e non più per
 * pilastri E/S/G (SPEC §12.Y.1): i pilastri reggevano come tassonomia e
 * non come guida alla scelta, e facevano comparire lo stesso servizio in
 * due famiglie diverse.
 */
export default function ServiziPage() {
  return (
    <main className="mx-auto max-w-4xl px-5 py-16">
      <JsonLd
        dati={jsonLdBreadcrumb([
          { nome: "Home", path: "/" },
          { nome: "Servizi", path: "/servizi" },
        ])}
      />
      <h1 className="text-center font-display text-4xl text-ink md:text-5xl">
        I percorsi che qualificano la tua impresa.
      </h1>
      <p className="mx-auto mt-3 max-w-2xl text-center text-sm leading-relaxed text-gray-warm">
        Scegli quello che ti serve: prezzo, perimetro e norme di riferimento
        sono scritti prima di iniziare. Ogni percorso riusa i dati che hai già,
        così il secondo costa meno lavoro del primo.
      </p>

      {/* Un solo rimando, e discreto: il contesto normativo — perché la
          banca, il committente o un bando chiedono quei dati — è uscito
          da qui. Un catalogo contiene i servizi, il prezzo, cosa tratta
          ciascuno e il modo di scegliere; la lezione di contesto stava
          davanti a chi aveva già deciso di guardare cosa vendiamo. */}
      <p className="mt-5 text-center text-sm text-gray-warm">
        <Link href="/guide" className="font-medium text-pine hover:underline">
          Perché te lo chiedono
        </Link>{" "}
        — le norme dietro le richieste di banche, committenti e bandi.
      </p>

      <div className="mt-4">
        <CatalogoFamiglie />
      </div>

      <p className="mt-6 text-center text-xs leading-relaxed text-gray-light">
        Gli importi «a partire da» sono quelli della fascia micro, IVA esclusa:
        il prezzo cresce con la dimensione dell&apos;impresa e si compone per
        intero nella pagina del percorso · −10% con pagamento annuale
      </p>

      {/* Link interni verso le pagine correlate (regola SEO §seo.ts) */}
      <nav
        aria-label="Pagine correlate"
        className="mt-8 flex flex-wrap justify-center gap-x-5 gap-y-2 border-t border-line pt-6 text-sm"
      >
        <Link href="/sigillo" className="font-medium text-pine hover:underline">
          Che cos&apos;è il Sigillo Ver0
        </Link>
        <Link
          href="/chi-siamo"
          className="font-medium text-pine hover:underline"
        >
          Come lavoriamo
        </Link>
        <Link href="/partner" className="font-medium text-pine hover:underline">
          Programma partner
        </Link>
        <Link href="/contatti" className="font-medium text-pine hover:underline">
          Hai una domanda? Scrivici
        </Link>
      </nav>
    </main>
  );
}
