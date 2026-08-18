import type { Metadata } from "next";
import { Check, Sparkles } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import {
  componiScheda,
  destinazioniCampo,
  type CampoScheda,
} from "@/lib/impresa";
import { FONTI_DICHIARATE } from "@/lib/arricchimento/orchestratore";

import { caricaContesto } from "../_contesto";
import {
  CardOpportunita,
  ChipDestinazione,
  IntestazioneSezione,
  SelettoreCliente,
} from "../_ui";
import { AggiornaDati } from "./aggiorna";
import { confermaCampo } from "./azioni";

export const metadata: Metadata = {
  title: "La tua impresa — il tuo ecosistema",
  robots: { index: false, follow: false },
};

/** L'icona del Motore: lo zero E1 in miniatura (dato recuperato da noi). */
function IconaMotore({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 14 18" className={className} fill="none" aria-hidden>
      <ellipse cx="7" cy="9" rx="4.6" ry="6.8" stroke="currentColor" strokeWidth="2.2" />
    </svg>
  );
}

/** Il badge di provenienza: la firma visiva della scheda (§12.H). */
function BadgeProvenienza({ campo }: { campo: CampoScheda }) {
  if (campo.daConfermare) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-soft px-2 py-0.5 text-[10px] font-semibold text-amber-ink">
        Da confermare{campo.fonte ? ` · ${campo.fonte}` : ""}
      </span>
    );
  }
  if (campo.provenienza === "motore") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-mint/15 px-2 py-0.5 text-[10px] font-semibold text-mint">
        <IconaMotore className="h-3 w-2" /> Recuperato da noi
        {campo.fonte ? ` · ${campo.fonte}` : ""}
      </span>
    );
  }
  if (campo.provenienza === "utente") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-moss px-2 py-0.5 text-[10px] font-semibold text-pine">
        <Check size={10} strokeWidth={3} /> Inserito da te
        {campo.fonte ? ` · ${campo.fonte}` : ""}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-dashed border-pine/30 bg-white px-2 py-0.5 text-[10px] font-semibold text-gray-warm">
      <Sparkles size={10} className="text-mint" /> Lo recupererà il Motore
      {campo.fonte ? ` · ${campo.fonte}` : ""}
    </span>
  );
}

/**
 * LA TUA IMPRESA (SPEC §12.H, sezioni 2.0 e 2.1): la scheda anagrafica,
 * ogni campo con la sua provenienza e la sua destinazione. Il Motore la
 * compila interrogando le banche dati ufficiali; ciò che porta arriva in
 * stato «da confermare» e diventa definitivo solo quando lo confermi tu.
 */
export default async function ImpresaPage({
  searchParams,
}: {
  searchParams: Promise<{ cliente?: string }>;
}) {
  const { cliente } = await searchParams;
  const contesto = await caricaContesto(cliente, "/dashboard/impresa");
  const supabase = await createClient();

  const [{ data: righe }, { data: moduli }] = contesto.org
    ? await Promise.all([
        supabase
          .from("company_fields")
          .select("campo, valore, provenienza, fonte, stato")
          .eq("organization_id", contesto.org.id),
        supabase
          .from("module_activations")
          .select("module")
          .eq("organization_id", contesto.org.id),
      ])
    : [{ data: [] }, { data: [] }];

  const scheda = contesto.org ? componiScheda(contesto.org, righe ?? []) : [];
  const moduliAttivi = (moduli ?? []).map((m) => m.module);
  const daConfermare = scheda
    .flatMap((g) => g.campi)
    .filter((c) => c.daConfermare).length;
  const fontiSpente = FONTI_DICHIARATE.filter((f) => f.stato === "spenta");

  return (
    <main>
      <IntestazioneSezione
        eyebrow="LA TUA IMPRESA"
        titolo="La scheda della tua impresa"
        sotto="Ogni dato dichiara da dove viene — inserito da te, recuperato dal Motore o in arrivo dalle banche dati ufficiali — e a quali documenti sta contribuendo: rispondi una volta sola, il resto lo smista il Motore."
      />

      <SelettoreCliente contesto={contesto} base="/dashboard/impresa" />

      {!contesto.org ? (
        contesto.ruolo === "impresa" ? (
          <div className="mt-8">
            <CardOpportunita
              titolo="La scheda nasce con il primo percorso"
              testo="Alla registrazione la compiliamo con i tuoi dati, e il Motore recupera il resto dalle fonti ufficiali: niente da ricopiare."
              cta={{ href: "/servizi", label: "Apri il catalogo" }}
            />
          </div>
        ) : null
      ) : (
        <div className="mt-8 space-y-4">
          {/* Il recupero automatico, con progressione vera per fonte */}
          <AggiornaDati
            fonti={FONTI_DICHIARATE}
            organizationId={
              contesto.ruolo === "consulente" ? contesto.org.id : undefined
            }
          />

          {daConfermare > 0 && (
            <p className="rounded-xl border border-amber-ink/25 bg-amber-soft/60 px-4 py-3 text-sm leading-relaxed text-amber-ink">
              <strong className="font-semibold">
                {daConfermare}{" "}
                {daConfermare === 1
                  ? "dato aspetta la tua conferma"
                  : "dati aspettano la tua conferma"}
              </strong>
              : li abbiamo recuperati noi, ma entrano nei tuoi documenti solo
              quando ci dici che sono giusti.
            </p>
          )}

          {scheda.map((gruppo) => (
            <section
              key={gruppo.titolo}
              className="overflow-hidden rounded-2xl border border-line bg-white"
            >
              <h2 className="border-b-2 border-line bg-paper px-5 py-3 font-display text-lg text-ink">
                {gruppo.titolo}
              </h2>
              <dl>
                {gruppo.campi.map((c, i) => {
                  // Un dato, più documenti (§12.F): il chip dice a quali
                  // documenti in lavorazione questo campo contribuisce.
                  const dest = destinazioniCampo(c.chiave, moduliAttivi);
                  return (
                    <div
                      key={c.chiave}
                      className={
                        "flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-5 py-3.5" +
                        (i > 0 ? " border-t border-line/60" : "") +
                        (c.daConfermare ? " bg-amber-soft/25" : "")
                      }
                    >
                      <dt className="min-w-0 text-sm text-gray-warm">
                        {c.label}
                        {dest && (
                          <span className="mt-1 flex flex-wrap gap-1">
                            {dest === "tutti" ? (
                              <ChipDestinazione label="tutti i tuoi documenti" />
                            ) : (
                              dest.map((d) => (
                                <ChipDestinazione key={d} label={d} />
                              ))
                            )}
                          </span>
                        )}
                      </dt>
                      <dd className="flex min-w-0 flex-col items-end gap-1 text-right">
                        <span
                          className={
                            "text-sm " +
                            (c.valore
                              ? "font-semibold tabular-nums text-ink"
                              : "text-gray-light")
                          }
                        >
                          {c.valore ?? "—"}
                        </span>
                        <BadgeProvenienza campo={c} />
                        {/* La conferma: il dato diventa tuo, e da lì in poi
                            nessun recupero successivo lo sovrascrive. */}
                        {c.daConfermare && contesto.ruolo === "impresa" && (
                          <form
                            action={async () => {
                              "use server";
                              await confermaCampo(c.chiave);
                            }}
                          >
                            <button
                              type="submit"
                              className="mt-0.5 inline-flex items-center gap-1 rounded-lg border border-pine px-2.5 py-1 text-[11px] font-semibold text-pine transition-colors hover:bg-moss"
                            >
                              <Check size={11} strokeWidth={3} /> È corretto
                            </button>
                          </form>
                        )}
                      </dd>
                    </div>
                  );
                })}
              </dl>
            </section>
          ))}

          {/* Trasparenza sulle fonti che non possiamo ancora interrogare:
              meglio dire perché che lasciar credere a una dimenticanza. */}
          {fontiSpente.length > 0 && (
            <details className="rounded-2xl border border-line bg-white p-5">
              <summary className="cursor-pointer text-sm font-semibold text-ink">
                Perché alcune fonti non le interroghiamo ancora
              </summary>
              <ul className="mt-3 space-y-3">
                {fontiSpente.map((f) => (
                  <li key={f.chiave}>
                    <p className="text-sm font-medium text-ink">{f.nome}</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-gray-warm">
                      {f.vincolo}
                    </p>
                  </li>
                ))}
              </ul>
              <p className="mt-3 border-t border-line pt-3 text-xs leading-relaxed text-gray-light">
                Preferiamo un campo vuoto a un dato preso in modo scorretto:
                è la stessa disciplina con cui costruiamo i tuoi documenti.
              </p>
            </details>
          )}
        </div>
      )}
    </main>
  );
}
