import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CalendarDays, LifeBuoy, UserCheck } from "lucide-react";

import { caricaContesto } from "../_contesto";
import { IntestazioneSezione, SelettoreCliente } from "../_ui";

export const metadata: Metadata = {
  title: "Consulenza — il tuo ecosistema",
  robots: { index: false, follow: false },
};

/**
 * CONSULENZA (SPEC §12.H, sezione 7 di 8): i corner con gli specialisti
 * e l'assistenza. La prenotazione arriva con il canale partner: intanto
 * l'assistenza risponde davvero, via contatti.
 */
export default async function ConsulenzaPage({
  searchParams,
}: {
  searchParams: Promise<{ cliente?: string }>;
}) {
  const { cliente } = await searchParams;
  const contesto = await caricaContesto(cliente, "/dashboard/consulenza");

  return (
    <main>
      <IntestazioneSezione
        eyebrow="CONSULENZA"
        titolo="Persone vere, quando servono"
        sotto="Dietro ogni documento c'è una verifica umana. E quando serve parlare con uno specialista, si prenota un corner sulla tua pratica."
      />

      <SelettoreCliente contesto={contesto} base="/dashboard/consulenza" />

      <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-line bg-white p-5">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-moss text-pine">
            <CalendarDays size={20} />
          </span>
          <p className="mt-3 font-display text-lg text-ink">
            Corner da 30 o 60 minuti
          </p>
          <p className="mt-1.5 text-sm leading-relaxed text-gray-warm">
            Specialisti selezionati per ambito — sistemi di gestione, parità,
            energia, sostenibilità — prenotabili sulla tua pratica. La
            prenotazione online apre con le prossime tappe.
          </p>
        </div>
        <div className="rounded-2xl border border-line bg-white p-5">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-moss text-pine">
            <UserCheck size={20} />
          </span>
          <p className="mt-3 font-display text-lg text-ink">
            Verifica umana, sempre
          </p>
          <p className="mt-1.5 text-sm leading-relaxed text-gray-warm">
            Ogni documento passa da un professionista prima dell&apos;emissione:
            l&apos;esito della validazione resta nel tuo archivio, con nome e
            data.
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-4 rounded-2xl border border-dashed border-pine/30 bg-moss/40 p-5">
        <LifeBuoy size={20} className="shrink-0 text-pine" />
        <p className="min-w-0 flex-1 text-sm leading-relaxed text-gray-warm">
          Serve una mano adesso? L&apos;assistenza è inclusa nel tuo abbonamento e
          risponde entro un giorno lavorativo.
        </p>
        <Link
          href="/contatti"
          className="vz-press inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-pine px-4 py-2.5 text-sm font-semibold text-white"
        >
          Scrivici <ArrowRight size={15} />
        </Link>
      </div>
    </main>
  );
}
