import type { Metadata } from "next";
import { BellRing, Megaphone, Target } from "lucide-react";

import { caricaContesto } from "../_contesto";
import { IntestazioneSezione, SelettoreCliente } from "../_ui";

export const metadata: Metadata = {
  title: "Bandi — il tuo ecosistema",
  robots: { index: false, follow: false },
};

/**
 * BANDI (SPEC §12.H, sezione 6 di 8): l'osservatorio incluso
 * nell'abbonamento. Il flusso automatico arriva con le tappe successive:
 * la sezione racconta cosa farà, da opportunità.
 */
export default async function BandiPage({
  searchParams,
}: {
  searchParams: Promise<{ cliente?: string }>;
}) {
  const { cliente } = await searchParams;
  const contesto = await caricaContesto(cliente, "/dashboard/bandi");

  const COSA = [
    {
      icon: Target,
      t: "Sul tuo profilo",
      d: "Bandi e incentivi filtrati su settore, dimensione e territorio della tua impresa: mai un elenco generico.",
    },
    {
      icon: BellRing,
      t: "Ti avvisiamo noi",
      d: "Quando esce un'opportunità che premia le tue qualifiche, la trovi qui — con la scadenza in chiaro.",
    },
    {
      icon: Megaphone,
      t: "Le qualifiche contano",
      d: "Molti bandi premiano certificazioni e rendicontazioni: i tuoi percorsi Ver0 diventano punteggio.",
    },
  ];

  return (
    <main>
      <IntestazioneSezione
        eyebrow="BANDI"
        titolo="L'osservatorio per il tuo profilo"
        sotto="Incluso in ogni abbonamento: il monitoraggio delle opportunità pubbliche che premiano le qualifiche della tua impresa. Si accende con le prossime tappe."
      />

      <SelettoreCliente contesto={contesto} base="/dashboard/bandi" />

      <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {COSA.map((c) => {
          const Icon = c.icon;
          return (
            <div
              key={c.t}
              className="rounded-2xl border border-line bg-white p-5"
            >
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-moss text-pine">
                <Icon size={20} />
              </span>
              <p className="mt-3 font-display text-lg text-ink">{c.t}</p>
              <p className="mt-1.5 text-sm leading-relaxed text-gray-warm">
                {c.d}
              </p>
            </div>
          );
        })}
      </div>
    </main>
  );
}
