import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, PackageCheck, Boxes, LifeBuoy } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import {
  RICHIAMO_SUPPORTO_AUDIT,
  SERVIZI_CERTIFICABILI,
  getServizio,
} from "@/lib/catalog";
import { DIMENSIONE_LABEL } from "@/lib/pricing";

/**
 * Area riservata — fase 1: legge organizzazione, ordini e moduli dal
 * DATABASE tramite il client di sessione (la RLS filtra da sola sulla
 * organizzazione dell'utente: nessun filtro manuale da ricordare).
 */
export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [{ data: org }, { data: ordini }, { data: moduli }] = await Promise.all([
    supabase.from("organizations").select("*").maybeSingle(),
    supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false }),
    supabase
      .from("module_activations")
      .select("*")
      .order("created_at", { ascending: false }),
  ]);

  const nomeServizio = (slug: string) => getServizio(slug)?.name ?? slug;

  const STATO_BADGE: Record<string, string> = {
    in_attivazione: "bg-amber-soft text-amber-ink",
    attivo: "bg-moss text-pine",
    sospeso: "bg-paper text-gray-warm",
    disdetto: "bg-paper text-gray-light",
  };
  const STATO_LABEL: Record<string, string> = {
    in_attivazione: "In attivazione",
    attivo: "Attivo",
    sospeso: "Sospeso",
    disdetto: "Disdetto",
  };

  return (
    <main className="mx-auto max-w-3xl px-5 py-12">
      <h1 className="font-display text-3xl font-semibold text-pine">
        {org ? org.ragione_sociale : "Area riservata"}
      </h1>
      <p className="mt-2 text-sm text-gray-warm">
        {org ? (
          <>
            P.IVA {org.partita_iva} · impresa{" "}
            {DIMENSIONE_LABEL[org.dimensione] ?? org.dimensione} · accesso come{" "}
            <strong className="font-medium text-ink">{user.email}</strong>
          </>
        ) : (
          <>
            Sei autenticato come{" "}
            <strong className="font-medium text-ink">{user.email}</strong>. La
            tua impresa non è ancora registrata: completa un acquisto dal
            catalogo per crearla.
          </>
        )}
      </p>

      {/* Ordini */}
      {(ordini ?? []).length > 0 && (
        <section className="mt-8">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-ink">
            <PackageCheck size={16} className="text-pine" /> I tuoi ordini
          </h2>
          <div className="mt-3 space-y-2">
            {(ordini ?? []).map((o) => (
              <div
                key={o.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-white p-4"
              >
                <div>
                  <p className="text-sm font-semibold text-ink">
                    {nomeServizio(o.servizio_slug)}
                  </p>
                  <p className="text-xs text-gray-warm">
                    {DIMENSIONE_LABEL[o.dimensione] ?? o.dimensione} ·{" "}
                    {/* Una tantum e canone si escludono a vicenda. */}
                    {o.formula === "una_tantum" || o.prezzo_canone === null
                      ? `una tantum · ${(o.prezzo_una_tantum ?? 0).toLocaleString("it-IT")} €`
                      : `formula ${o.formula} · ${o.prezzo_canone.toLocaleString("it-IT")} €/${
                          o.formula === "mensile" ? "mese" : "anno"
                        }`}
                  </p>
                </div>
                <span
                  className={
                    "rounded-full px-3 py-1 text-xs font-medium " +
                    (STATO_BADGE[o.stato] ?? "bg-paper text-gray-warm")
                  }
                >
                  {STATO_LABEL[o.stato] ?? o.stato}
                </span>
              </div>
            ))}
          </div>
          <p className="mt-2 text-xs text-gray-light">
            Gli ordini «in attivazione» non hanno generato alcun addebito: ti
            ricontattiamo per l&apos;attivazione del pagamento.
          </p>
        </section>
      )}

      {/* Moduli */}
      <section className="mt-8">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-ink">
          <Boxes size={16} className="text-pine" /> I tuoi moduli
        </h2>
        {(moduli ?? []).length > 0 ? (
          <div className="mt-3 space-y-2">
            {(moduli ?? []).map((m) => (
              <div
                key={m.id}
                className="rounded-xl border border-line bg-white p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-ink">
                    {nomeServizio(m.module)}
                  </p>
                  <span
                    className={
                      "rounded-full px-3 py-1 text-xs font-medium " +
                      (STATO_BADGE[m.stato] ?? "bg-paper text-gray-warm")
                    }
                  >
                    {STATO_LABEL[m.stato] ?? m.stato}
                  </span>
                </div>

                {/* Azione contestuale sui percorsi certificabili: l'audit lo
                    fa un organismo terzo, i rilievi però si adeguano qui.
                    Fase 2: al posto dell'acquisto arriverà il caricamento
                    vero dei rilievi, con il resto della pipeline documentale. */}
                {SERVIZI_CERTIFICABILI.includes(m.module) && (
                  <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-line pt-3">
                    <LifeBuoy size={16} className="shrink-0 text-pine" />
                    <p className="min-w-0 flex-1 text-xs text-gray-warm">
                      Hai ricevuto rilievi dall&apos;ente? Caricali qui: li
                      associamo ai requisiti di norma e adeguiamo i documenti.
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
            ))}
          </div>
        ) : (
          <div className="mt-3 rounded-xl border border-line bg-white p-5">
            <p className="text-sm text-gray-warm">
              Nessun modulo ancora attivo: gli spazi di lavoro (carbon, VSME,
              sistemi di gestione) compaiono qui dopo l&apos;acquisto.
            </p>
          </div>
        )}
      </section>
    </main>
  );
}
