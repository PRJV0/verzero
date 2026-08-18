import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Sigillo } from "@/components/brand/sigillo";
import { createClient } from "@/lib/supabase/server";
import { getServizio } from "@/lib/catalog";

import { caricaContesto } from "../_contesto";
import { IntestazioneSezione, SelettoreCliente } from "../_ui";

export const metadata: Metadata = {
  title: "Sigillo — il tuo ecosistema",
  robots: { index: false, follow: false },
};

/**
 * SIGILLO (SPEC §12.H, sezione 5 di 8): lo stato del marchio di verifica.
 * Oggi nessun percorso è ancora completato e validato: la sezione mostra
 * con onestà la strada — mai un vuoto triste.
 */
export default async function SigilloPage({
  searchParams,
}: {
  searchParams: Promise<{ cliente?: string }>;
}) {
  const { cliente } = await searchParams;
  const contesto = await caricaContesto(cliente, "/dashboard/sigillo");
  const supabase = await createClient();

  const { data: moduli } = contesto.org
    ? await supabase
        .from("module_activations")
        .select("module, stato")
        .eq("organization_id", contesto.org.id)
    : { data: [] };
  const attivi = (moduli ?? []).filter((m) => m.stato === "attivo");

  return (
    <main>
      <IntestazioneSezione
        eyebrow="SIGILLO"
        titolo="Il tuo Sigillo Ver0"
        sotto="Il marchio di verifica non si compra: si conquista completando un percorso qualificante, e ogni anno va riconquistato."
      />

      <SelettoreCliente contesto={contesto} base="/dashboard/sigillo" />

      <div className="mt-8 overflow-hidden rounded-2xl bg-pine-deep p-6 text-center sm:p-8">
        <div className="flex justify-center">
          <Sigillo tone="dark" className="h-28 w-28 opacity-60" />
        </div>
        <p className="mt-4 font-display text-2xl text-white">
          Il tuo anello è ancora da riempire
        </p>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-moss">
          {attivi.length > 0
            ? "Il percorso è avviato: quando il fascicolo sarà completo e validato dal team tecnico, il primo segmento si accenderà qui."
            : "Ogni percorso completato e validato accende un segmento dell'anello. Il primo passo è attivare un percorso qualificante."}
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <Link
            href={attivi.length > 0 ? "/dashboard/percorsi" : "/servizi"}
            className="vz-press inline-flex items-center gap-1.5 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-pine"
          >
            {attivi.length > 0 ? "Completa il fascicolo" : "Attiva un percorso"}
            <ArrowRight size={15} />
          </Link>
          <Link
            href="/sigillo"
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/30 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:border-mint-bright/60"
          >
            Come funziona il Sigillo
          </Link>
        </div>
      </div>

      {attivi.length > 0 && (
        <div className="mt-4 rounded-2xl border border-line bg-white p-5">
          <p className="text-sm font-semibold text-ink">
            I tuoi percorsi verso il Sigillo
          </p>
          <ul className="mt-2 space-y-1.5">
            {attivi.map((m) => (
              <li key={m.module} className="text-sm text-gray-warm">
                {getServizio(m.module)?.name ?? m.module} — in corso
              </li>
            ))}
          </ul>
        </div>
      )}
    </main>
  );
}
