import type { Metadata } from "next";
import { Briefcase, FileCheck2, Mail, ShieldCheck } from "lucide-react";

import { createClient } from "@/lib/supabase/server";

import { caricaContesto } from "../_contesto";
import { IntestazioneSezione } from "../_ui";
import { revocaMandato } from "../azioni";

export const metadata: Metadata = {
  title: "Impostazioni — il tuo ecosistema",
  robots: { index: false, follow: false },
};

const DATA = (iso: string) =>
  new Date(iso).toLocaleDateString("it-IT", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

const DOC_LABEL: Record<string, string> = {
  condizioni_servizio: "Condizioni di servizio",
  mandato_banche_dati: "Mandato per le banche dati",
};

/**
 * IMPOSTAZIONI (SPEC §12.H, sezione 8 di 8): dati dell'account, consensi
 * registrati e — per l'impresa — i mandati dei consulenti, revocabili in
 * ogni momento (la titolarità dei dati resta all'impresa).
 */
export default async function ImpostazioniPage() {
  const contesto = await caricaContesto();
  const supabase = await createClient();

  const [{ data: consensi }, { data: mandati }] = await Promise.all([
    contesto.org
      ? supabase
          .from("consents")
          .select("doc_type, doc_version, accepted_at")
          .eq("organization_id", contesto.org.id)
          .order("accepted_at", { ascending: false })
      : Promise.resolve({ data: [] as never[] }),
    supabase
      .from("consultant_organizations")
      .select("id, consultant_id, organization_id, stato, created_at")
      .order("created_at", { ascending: false }),
  ]);

  return (
    <main>
      <IntestazioneSezione
        eyebrow="IMPOSTAZIONI"
        titolo="Account, consensi e mandati"
        sotto="I tuoi dati restano tuoi: qui vedi quali consensi hai accettato, chi può accedere al tuo ecosistema e come revocarlo."
      />

      <div className="mt-8 space-y-4">
        {/* Account */}
        <section className="rounded-2xl border border-line bg-white p-5">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-ink">
            <Mail size={15} className="text-pine" /> Il tuo account
          </h2>
          <dl className="mt-3 space-y-1.5 text-sm">
            <div className="flex flex-wrap justify-between gap-2">
              <dt className="text-gray-warm">Email di accesso</dt>
              <dd className="font-semibold text-ink">{contesto.email}</dd>
            </div>
            <div className="flex flex-wrap justify-between gap-2">
              <dt className="text-gray-warm">Profilo</dt>
              <dd className="font-semibold text-ink">
                {contesto.ruolo === "consulente"
                  ? "Consulente partner"
                  : "Impresa"}
              </dd>
            </div>
          </dl>
        </section>

        {/* Consensi registrati (reali, dal database) */}
        {contesto.ruolo === "impresa" && (
          <section className="rounded-2xl border border-line bg-white p-5">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-ink">
              <FileCheck2 size={15} className="text-pine" /> Consensi registrati
            </h2>
            {(consensi ?? []).length === 0 ? (
              <p className="mt-3 text-sm text-gray-warm">
                Nessun consenso ancora registrato: arrivano con il primo
                acquisto dal catalogo.
              </p>
            ) : (
              <ul className="mt-3 space-y-2">
                {(consensi ?? []).map((c, i) => (
                  <li
                    key={i}
                    className="flex flex-wrap items-baseline justify-between gap-2 text-sm"
                  >
                    <span className="text-gray-warm">
                      {DOC_LABEL[c.doc_type] ?? c.doc_type}{" "}
                      <span className="text-xs text-gray-light">
                        v. {c.doc_version}
                      </span>
                    </span>
                    <span className="text-xs tabular-nums text-gray-warm">
                      accettato il {DATA(c.accepted_at)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        {/* Mandati: chi accede al tuo ecosistema / i tuoi clienti */}
        <section className="rounded-2xl border border-line bg-white p-5">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-ink">
            {contesto.ruolo === "impresa" ? (
              <>
                <ShieldCheck size={15} className="text-pine" /> Chi accede al
                tuo ecosistema
              </>
            ) : (
              <>
                <Briefcase size={15} className="text-pine" /> I tuoi mandati
              </>
            )}
          </h2>
          {(mandati ?? []).length === 0 ? (
            <p className="mt-3 text-sm text-gray-warm">
              {contesto.ruolo === "impresa"
                ? "Nessun consulente è collegato al tuo ecosistema. Se un giorno vorrai farti seguire da un consulente partner, il mandato comparirà qui — revocabile in ogni momento."
                : "Nessun mandato attivo: quando un'impresa ti darà accesso, comparirà qui."}
            </p>
          ) : (
            <ul className="mt-3 space-y-2">
              {(mandati ?? []).map((m) => (
                <li
                  key={m.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-paper px-3.5 py-2.5 text-sm"
                >
                  <span className="min-w-0">
                    <span className="block font-medium text-ink">
                      {contesto.ruolo === "impresa"
                        ? "Consulente partner"
                        : (contesto.clienti.find(
                            (c) => c.id === m.organization_id,
                          )?.ragione_sociale ?? "Mandato non più attivo")}
                    </span>
                    <span className="block text-xs text-gray-warm">
                      dal {DATA(m.created_at)} ·{" "}
                      {m.stato === "attivo" ? "attivo" : "revocato"}
                    </span>
                  </span>
                  {contesto.ruolo === "impresa" && m.stato === "attivo" && (
                    <form
                      action={async () => {
                        "use server";
                        await revocaMandato(m.id);
                      }}
                    >
                      <button
                        type="submit"
                        className="rounded-lg border border-amber-ink/40 px-3 py-1.5 text-xs font-medium text-amber-ink transition-colors hover:bg-amber-soft"
                      >
                        Revoca l&apos;accesso
                      </button>
                    </form>
                  )}
                </li>
              ))}
            </ul>
          )}
          {contesto.ruolo === "impresa" && (
            <p className="mt-3 border-t border-line pt-3 text-xs text-gray-light">
              La revoca è immediata: dal momento in cui la confermi, il
              consulente non vede più nulla del tuo ecosistema.
            </p>
          )}
        </section>
      </div>
    </main>
  );
}
