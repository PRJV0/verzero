import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, LifeBuoy } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import {
  RICHIAMO_SUPPORTO_AUDIT,
  SERVIZI_CERTIFICABILI,
  getServizio,
} from "@/lib/catalog";
import {
  bozzaPercorso,
  completamentoBozza,
  type SezioneBozza,
} from "@/lib/bozza";

import { caricaContesto } from "../_contesto";
import { AnelloSigillo } from "../_anello";
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

/** Righe di testo accennate: la metafora del documento in composizione. */
function RigheAccennate({ quante = 2 }: { quante?: number }) {
  return (
    <div aria-hidden className="mt-2 space-y-1.5">
      {Array.from({ length: quante }, (_, i) => (
        <div
          key={i}
          className="h-2 rounded-sm bg-line/50"
          style={{ width: `${88 - i * 26}%` }}
        />
      ))}
    </div>
  );
}

/** Una sezione del foglio-bozza, numerata, con lo stato dichiarato. */
function SezioneFoglio({
  sezione,
  numero,
}: {
  sezione: SezioneBozza;
  numero: number;
}) {
  return (
    <div className="border-t border-line/70 px-5 py-4 first:border-t-0 sm:px-6">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <p className="min-w-0 text-sm font-semibold text-ink">
          <span className="mr-2 tabular-nums text-gray-light">{numero}.</span>
          {sezione.titolo}
        </p>
        {sezione.stato === "in-attesa" ? (
          <span className="shrink-0 rounded-full bg-paper px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-warm">
            In attesa
          </span>
        ) : (
          <span className="shrink-0 rounded-full bg-mint/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-mint">
            Dal Motore{sezione.fonte ? ` · ${sezione.fonte}` : ""}
          </span>
        )}
      </div>

      {sezione.stato === "popolata" && sezione.righe && (
        <dl className="mt-2 space-y-1">
          {sezione.righe.map((r) => (
            <div
              key={r.etichetta}
              className="flex flex-wrap justify-between gap-x-4 text-sm"
            >
              <dt className="text-gray-warm">{r.etichetta}</dt>
              <dd className="font-semibold tabular-nums text-ink">
                {r.valore}
              </dd>
            </div>
          ))}
        </dl>
      )}

      {sezione.stato === "impostata" && <RigheAccennate quante={2} />}

      {sezione.stato === "in-attesa" && (
        <>
          <RigheAccennate quante={1} />
          {sezione.attende && (
            <p className="mt-1.5 text-xs text-gray-light">
              Si compila con {sezione.attende}.
            </p>
          )}
        </>
      )}
    </div>
  );
}

/**
 * I TUOI PERCORSI (SPEC §12.G + §12.H): la vista si apre sul LAVORO GIÀ
 * SVOLTO — il foglio-bozza del documento con le sezioni composte dal
 * Motore — con l'anello del Sigillo come cruscotto. La lista di ciò che
 * manca è secondaria, quieta, e ogni voce dice il perché.
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
        titolo="Il Motore ha già iniziato"
        sotto="Ogni percorso si apre sulla bozza del documento: le sezioni già composte si leggono, quelle in attesa sono al loro posto. Sotto, le poche cose che servono da te — col perché."
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
        <div className="mt-8 space-y-8">
          {attivi.map((m) => {
            const s = getServizio(m.module);
            const bozza = contesto.org
              ? bozzaPercorso(m.module, contesto.org)
              : null;
            if (!bozza) return null;
            const percentuale = completamentoBozza(bozza);
            const composte = bozza.sezioni.filter(
              (x) => x.stato !== "in-attesa",
            ).length;

            return (
              <article key={m.id}>
                {/* Intestazione del percorso */}
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <div className="min-w-0">
                    <h2 className="font-display text-2xl text-ink">
                      {s?.name ?? m.module}
                    </h2>
                    {s?.taglio && (
                      <p className="text-xs font-medium text-gray-warm">
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

                {/* PRIMA il lavoro svolto: foglio-bozza + anello (§12.G) */}
                <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[1fr_260px]">
                  {/* Il fascicolo come oggetto di carta */}
                  <div className="overflow-hidden rounded-xl border-2 border-line bg-white shadow-soft">
                    <div className="flex items-center justify-between gap-3 border-b-2 border-line bg-paper px-5 py-3 sm:px-6">
                      <p className="font-display text-lg text-ink">
                        {bozza.intestazione}
                      </p>
                      <span className="shrink-0 text-[10px] font-semibold uppercase tracking-widest text-gray-light">
                        Anteprima
                      </span>
                    </div>
                    {bozza.sezioni.map((sez, i) => (
                      <SezioneFoglio
                        key={sez.titolo}
                        sezione={sez}
                        numero={i + 1}
                      />
                    ))}
                  </div>

                  {/* Colonna quieta: anello-cruscotto + cosa serve, col perché */}
                  <aside className="space-y-4">
                    <div className="flex flex-col items-center rounded-xl border border-line bg-white p-5 text-center">
                      <AnelloSigillo
                        totale={bozza.sezioni.length}
                        pieni={composte}
                        percentuale={percentuale}
                      />
                      <p className="mt-3 text-xs leading-relaxed text-gray-warm">
                        <span className="font-semibold tabular-nums text-pine">
                          {composte} sezioni su {bozza.sezioni.length}
                        </span>{" "}
                        già composte dal Motore
                      </p>
                    </div>

                    <div className="rounded-xl bg-moss/50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-pine">
                        Per completare ci serve
                      </p>
                      <ul className="mt-2.5 space-y-2">
                        {bozza.daFornire.map((v) => (
                          <li
                            key={v.documento}
                            className="rounded-lg border border-amber-ink/20 bg-amber-soft/70 px-3 py-2.5"
                          >
                            <p className="text-xs font-semibold text-ink">
                              {v.documento}
                            </p>
                            <p className="mt-0.5 text-[11px] leading-snug text-gray-warm">
                              {v.perche}
                            </p>
                          </li>
                        ))}
                      </ul>
                      <p className="mt-2.5 text-[11px] leading-relaxed text-gray-light">
                        Il caricamento guidato apre con la prossima tappa: ti
                        avvisiamo noi.
                      </p>
                    </div>
                  </aside>
                </div>

                {/* Percorsi certificabili: i rilievi si adeguano qui. */}
                {SERVIZI_CERTIFICABILI.includes(m.module) && (
                  <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-line bg-white px-4 py-3">
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
              </article>
            );
          })}
        </div>
      )}
    </main>
  );
}
