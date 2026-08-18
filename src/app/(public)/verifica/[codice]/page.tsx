import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";

import { Sigillo } from "@/components/brand/sigillo";
import { createAdminClient } from "@/lib/supabase/admin";
import { componentiPercorso } from "@/lib/bozza";
import { getServizio } from "@/lib/catalog";

/**
 * PAGINA PUBBLICA DI VERIFICA DELL'AVVIO (SPEC §12.F).
 *
 * È la destinazione del QR sulla targa di avvio: dichiara che il
 * percorso è AVVIATO e in corso di completamento — mai un risultato.
 * Wording rigoroso e anti-greenwashing: dice esplicitamente cosa questa
 * pagina NON attesta. L'anello resta punteggiato, senza segmenti pieni:
 * quelli si accendono solo a percorso verificato.
 *
 * Lettura via service_role filtrata sul codice non indovinabile: il
 * database resta chiuso al pubblico (nessuna policy anon). Fuori da
 * sitemap e indice: la pagina si raggiunge dal QR e dal link diretto.
 */
export const metadata: Metadata = {
  title: "Percorso avviato — verifica pubblica",
  description:
    "Verifica pubblica dello stato di un percorso di qualificazione Ver0: avviato e in corso di completamento.",
  robots: { index: false, follow: false },
};

export default async function VerificaPage({
  params,
}: {
  params: Promise<{ codice: string }>;
}) {
  const { codice } = await params;
  // Il codice è esadecimale corto: tutto il resto non merita una query.
  if (!/^[0-9a-f]{8,16}$/.test(codice)) notFound();

  const admin = createAdminClient();
  const { data: org } = await admin
    .from("organizations")
    .select("id, ragione_sociale, partita_iva")
    .eq("codice_verifica", codice)
    .maybeSingle();
  if (!org) notFound();

  const { data: moduli } = await admin
    .from("module_activations")
    .select("module, stato, activated_at, created_at")
    .eq("organization_id", org.id)
    .eq("stato", "attivo")
    .order("created_at", { ascending: true });
  const attivi = moduli ?? [];
  // Una pagina che dichiara un avvio esiste solo se l'avvio c'è.
  if (attivi.length === 0) notFound();

  const avvio = new Date(
    attivi[0].activated_at ?? attivi[0].created_at,
  ).toLocaleDateString("it-IT", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <main className="mx-auto max-w-3xl px-5 py-14 md:py-20">
      <p className="text-xs font-semibold tracking-widest text-pine">
        VERIFICA PUBBLICA · SIGILLO VER0
      </p>
      <div className="mt-6 overflow-hidden rounded-2xl border-2 border-line bg-white shadow-soft">
        <div className="flex flex-col items-center gap-6 px-6 py-10 text-center sm:px-10">
          <Sigillo className="h-32 w-32" />
          <div>
            <h1 className="font-display text-3xl text-ink md:text-4xl">
              Percorso avviato
            </h1>
            <p className="mt-3 font-display text-xl text-pine">
              {org.ragione_sociale}
            </p>
            <p className="mt-1 text-sm tabular-nums text-gray-warm">
              Partita IVA {org.partita_iva}
            </p>
            <p className="mt-4 text-sm leading-relaxed text-gray-warm">
              Questa impresa ha avviato il suo percorso di qualificazione il{" "}
              <strong className="font-semibold text-ink">{avvio}</strong>. Il
              percorso è{" "}
              <strong className="font-semibold text-ink">
                in corso di completamento
              </strong>
              .
            </p>
          </div>
        </div>

        <div className="border-t-2 border-line bg-paper px-6 py-5 sm:px-10">
          <p className="text-xs font-semibold uppercase tracking-wide text-pine">
            Percorsi in corso
          </p>
          <ul className="mt-2 space-y-1.5">
            {attivi.map((m) => {
              const s = getServizio(m.module);
              const componenti = componentiPercorso(m.module, org);
              return (
                <li key={m.module} className="text-sm text-gray-warm">
                  <span className="font-semibold text-ink">
                    {s?.name ?? m.module}
                  </span>
                  {s?.taglio ? ` — ${s.taglio}` : ""}
                  {componenti.length > 1 && (
                    <span className="mt-0.5 block text-xs text-gray-light">
                      Comprende:{" "}
                      {componenti
                        .map((c) => c.nome + (c.taglio ? ` (${c.taglio})` : ""))
                        .join(" · ")}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      {/* Cosa questa pagina NON dice: il wording che non simula risultati. */}
      <div className="mt-5 rounded-xl border border-line bg-white p-5 text-sm leading-relaxed text-gray-warm">
        <p className="font-semibold text-ink">Cosa attesta questa pagina</p>
        <p className="mt-1.5">
          Attesta soltanto che il percorso è stato avviato ed è in
          lavorazione. Non è un risultato, non è una certificazione e non è il
          Sigillo Ver0: l&apos;anello qui sopra è punteggiato proprio per
          questo. I segmenti si accendono solo quando un percorso è stato
          completato e validato — e allora sarà scritto qui.
        </p>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-4">
        <Link
          href="/sigillo"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-pine hover:underline"
        >
          Come funziona il Sigillo Ver0 <ArrowRight size={15} />
        </Link>
        <Link
          href="/come-funziona"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-warm hover:text-pine"
        >
          Come lavora Ver0
        </Link>
      </div>
    </main>
  );
}
