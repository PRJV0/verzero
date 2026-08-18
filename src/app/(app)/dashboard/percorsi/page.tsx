import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ClipboardList, LifeBuoy } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import {
  RICHIAMO_SUPPORTO_AUDIT,
  SERVIZI_CERTIFICABILI,
  getServizio,
} from "@/lib/catalog";

import { caricaContesto } from "../_contesto";
import {
  CardOpportunita,
  IntestazioneSezione,
  STATO_BADGE,
  STATO_LABEL,
  SelettoreCliente,
} from "../_ui";

export const metadata: Metadata = {
  title: "I tuoi percorsi — il tuo ecosistema",
  robots: { index: false, follow: false },
};

/**
 * I TUOI PERCORSI (SPEC §12.H, sezione 3 di 8): le card dei moduli attivi
 * con il fascicolo — cosa serve da te, documento per documento. L'upload
 * vero arriva con la tappa 2.2: oggi la lista è la guida alla raccolta.
 */
export default async function PercorsiPage({
  searchParams,
}: {
  searchParams: Promise<{ cliente?: string }>;
}) {
  const { cliente } = await searchParams;
  const contesto = await caricaContesto(cliente, "/dashboard/percorsi");
  const supabase = await createClient();

  const { data: moduli } = contesto.org
    ? await supabase
        .from("module_activations")
        .select("*")
        .eq("organization_id", contesto.org.id)
        .order("created_at", { ascending: false })
    : { data: [] };

  const attivi = moduli ?? [];

  return (
    <main>
      <IntestazioneSezione
        eyebrow="I TUOI PERCORSI"
        titolo="I percorsi della tua qualifica"
        sotto="Ogni percorso ha il suo fascicolo: la lista precisa dei documenti che servono, con lo stato di ciascuno. Il caricamento guidato arriva con la prossima tappa."
      />

      <SelettoreCliente contesto={contesto} base="/dashboard/percorsi" />

      {attivi.length === 0 ? (
        <div className="mt-8">
          <CardOpportunita
            titolo="Nessun percorso attivo, per ora"
            testo="Dal catalogo attivi quando vuoi: prezzi pubblici, la lista dei documenti dichiarata prima dell'acquisto, validazione umana su tutto."
            cta={{ href: "/servizi", label: "Scegli il percorso" }}
          />
        </div>
      ) : (
        <div className="mt-8 space-y-4">
          {attivi.map((m) => {
            const s = getServizio(m.module);
            return (
              <article
                key={m.id}
                className="overflow-hidden rounded-2xl border border-line bg-white"
              >
                <div className="flex flex-wrap items-start justify-between gap-3 border-b-2 border-line bg-paper px-5 py-4">
                  <div className="min-w-0">
                    <h2 className="font-display text-xl text-ink">
                      {s?.name ?? m.module}
                    </h2>
                    {s?.taglio && (
                      <p className="mt-0.5 text-xs font-medium text-gray-warm">
                        {s.taglio}
                      </p>
                    )}
                  </div>
                  <span
                    className={
                      "shrink-0 rounded-full px-3 py-1 text-xs font-medium " +
                      (STATO_BADGE[m.stato] ?? "bg-paper text-gray-warm")
                    }
                  >
                    {STATO_LABEL[m.stato] ?? m.stato}
                  </span>
                </div>

                <div className="px-5 py-4">
                  <p className="flex items-center gap-2 text-sm font-semibold text-ink">
                    <ClipboardList size={15} className="text-pine" /> Il
                    fascicolo: cosa serve da te
                  </p>
                  <ul className="mt-2 space-y-1.5">
                    {(s?.documenti ?? []).map((d) => (
                      <li
                        key={d}
                        className="flex items-start gap-2 text-sm text-gray-warm"
                      >
                        <span
                          aria-hidden
                          className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-mint"
                        />
                        {d}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-3 border-t border-line pt-3 text-xs text-gray-light">
                    Il caricamento guidato dei documenti apre con la prossima
                    tappa: ti avvisiamo noi quando il fascicolo è pronto a
                    riceverli.
                  </p>

                  {/* Percorsi certificabili: i rilievi si adeguano qui. */}
                  {SERVIZI_CERTIFICABILI.includes(m.module) && (
                    <div className="mt-3 flex flex-wrap items-center gap-3 rounded-xl bg-paper px-3.5 py-3">
                      <LifeBuoy size={16} className="shrink-0 text-pine" />
                      <p className="min-w-0 flex-1 text-xs text-gray-warm">
                        Hai ricevuto rilievi dall&apos;ente? Li associamo ai
                        requisiti di norma e adeguiamo i documenti.
                      </p>
                      <Link
                        href={`/acquista/${RICHIAMO_SUPPORTO_AUDIT.slug}`}
                        className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-pine px-3 py-1.5 text-xs font-medium text-pine transition-colors hover:bg-moss"
                      >
                        Carica i rilievi <ArrowRight size={13} />
                      </Link>
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </main>
  );
}
