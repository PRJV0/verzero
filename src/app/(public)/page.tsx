import Link from "next/link";

/**
 * Home del sito pubblico. Segnaposto di fase 0: i tre messaggi guida
 * (prezzo, qualifica, effort) ci sono, la resa grafica arriva più avanti
 * riprendendo il prototipo.
 */
export default function HomePage() {
  return (
    <main className="mx-auto max-w-3xl px-5 py-16">
      <p className="text-xs font-medium tracking-widest text-mint">
        SOSTENIBILITÀ · EFFICIENZA ENERGETICA · SISTEMI DI GESTIONE
      </p>

      <h1 className="mt-4 font-display text-4xl font-semibold text-pine sm:text-5xl">
        Qualifica la tua azienda con l&apos;effort più basso di sempre.
      </h1>

      <p className="mt-4 text-base text-gray-warm">
        Carichi le bollette, l&apos;AI estrae i dati, tu confermi. Il resto —
        calcolo, report, conformità — lo fa la piattaforma. Dietro lo schermo ci
        sono sempre persone che verificano.
      </p>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href="/login"
          className="rounded-lg bg-pine px-4 py-2.5 text-sm font-medium text-white"
        >
          Accedi all&apos;area riservata
        </Link>
      </div>
    </main>
  );
}
