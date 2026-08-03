import type { Metadata } from "next";

import { CatalogoVetrina } from "@/components/catalogo-vetrina";

export const metadata: Metadata = {
  title: "Servizi e prezzi — Ver0",
  description:
    "Il catalogo Ver0 per categorie con prezzi in chiaro: sostenibilità nei pilastri ambiente, sociale e governance, più i sistemi di gestione. Prezzi per fascia dimensionale, per imprese di ogni dimensione.",
};

/** Indice dei servizi: catalogo per categorie (SPEC §12.Y), prezzi dalla matrice. */
export default function ServiziPage() {
  return (
    <main className="mx-auto max-w-4xl px-5 py-10">
      <h1 className="text-center font-display text-4xl text-ink md:text-5xl">
        Servizi e prezzi, in chiaro
      </h1>
      <p className="mx-auto mt-3 max-w-xl text-center text-sm text-gray-warm">
        Nessun preventivo da chiedere: attivi quello che ti serve, quando ti
        serve. Ogni servizio riusa i dati che hai già — più moduli attivi, meno
        lavoro per ciascuno.
      </p>

      <div className="mt-8">
        <CatalogoVetrina />
      </div>

      <p className="mt-4 text-center text-xs text-gray-light">
        Prezzi &quot;da&quot; riferiti alla fascia micro, IVA esclusa · il
        prezzo per la tua dimensione si compone nella pagina del servizio ·
        −10% con pagamento annuale
      </p>
    </main>
  );
}
