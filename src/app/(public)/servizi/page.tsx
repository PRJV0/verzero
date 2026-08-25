import type { Metadata } from "next";
import Link from "next/link";

import { CatalogoFamiglie } from "@/components/catalogo-famiglie";
import { BISOGNI, type Bisogno } from "@/lib/catalog";
import { orienta } from "@/lib/orientatore";
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
/**
 * Il catalogo risponde anche a `?q=` e `?bisogno=`.
 *
 * `?q=` è la strada di chi arriva dall'orientatore SENZA JavaScript: il
 * modulo in home è una GET verso questa pagina, e qui la frase si
 * interpreta con la stessa identica funzione (`orienta`). Non è un
 * ripiego degradato — è la stessa risposta servita da un'altra pagina,
 * ed è la ragione per cui la logica sta in una libreria e non dentro un
 * componente client.
 */
export default async function ServiziPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; bisogno?: string }>;
}) {
  const { q, bisogno } = await searchParams;
  const trovato = q ? orienta(q) : null;
  const situazione = BISOGNI.some((b) => b.key === bisogno)
    ? (bisogno as Bisogno)
    : (trovato?.situazioni[0] ?? null);

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

      {/* Chi arriva dall'orientatore senza JavaScript trova qui la sua
          risposta, con le stesse parole e nello stesso ordine. */}
      {trovato && (
        <section
          aria-label="Risultati della ricerca"
          className="mt-6 rounded-2xl border-2 border-pine/20 bg-paper p-5"
        >
          <p className="text-[11px] font-semibold uppercase tracking-widest text-pine">
            Hai cercato
          </p>
          <p className="mt-0.5 text-[15px] font-bold text-ink">«{q}»</p>

          {trovato.risultati.length > 0 ? (
            <ul className="mt-3 space-y-2">
              {trovato.risultati.map((r) => (
                <li key={r.id}>
                  <Link
                    href={r.href}
                    className="vz-interattivo block rounded-xl border border-line bg-white p-4 hover:border-pine"
                  >
                    <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                      <span className="text-[15px] font-bold leading-snug text-ink">
                        {r.nome}
                      </span>
                      {r.inArrivo ? (
                        <span className="shrink-0 rounded-full bg-paper px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-warm">
                          In arrivo
                        </span>
                      ) : r.prezzo ? (
                        <span className="shrink-0 text-xs font-semibold text-pine">
                          {r.prezzo}
                        </span>
                      ) : null}
                    </div>
                    <span className="mt-1 block text-sm leading-relaxed text-gray-warm">
                      {r.perche}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm leading-relaxed text-gray-warm">
              Su questo non abbiamo un percorso, e preferiamo dirtelo invece di
              proporti qualcosa che non risponde.{" "}
              <Link href="/contatti" className="font-semibold text-pine hover:underline">
                Scrivici due righe
              </Link>{" "}
              e ti diciamo se possiamo esserti utili — e se non possiamo, anche
              quello. Sotto trovi comunque tutto il catalogo.
            </p>
          )}
        </section>
      )}

      <div className="mt-4">
        <CatalogoFamiglie iniziale={situazione} />
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
