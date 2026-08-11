import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  PackageCheck,
  Boxes,
  Briefcase,
  LifeBuoy,
  Users,
} from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import {
  RICHIAMO_SUPPORTO_AUDIT,
  SERVIZI_CERTIFICABILI,
  getServizio,
} from "@/lib/catalog";
import { DIMENSIONE_LABEL } from "@/lib/pricing";

/** Fuori dall'indice: l'ecosistema è visibile solo dopo l'accesso. */
export const metadata: Metadata = {
  title: "Il tuo ecosistema",
  robots: { index: false, follow: false },
};

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

const nomeServizio = (slug: string) => getServizio(slug)?.name ?? slug;

/**
 * L'ecosistema (SPEC §12.K) — due profili sulla stessa pagina:
 * - IMPRESA: vede il proprio ecosistema (la RLS filtra da sola sulla
 *   organizzazione del profilo, nessun filtro manuale da ricordare);
 * - CONSULENTE PARTNER: selettore cliente sui mandati attivi e vista
 *   filtrata sull'organizzazione scelta. Il filtro esplicito qui è di
 *   presentazione: il perimetro vero lo impone la RLS, che mostra al
 *   consulente solo le organizzazioni con mandato attivo.
 */
export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ cliente?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profilo } = await supabase
    .from("profiles")
    .select("ruolo")
    .eq("id", user.id)
    .maybeSingle();

  /* ------------------------------------------------------------------ */
  /* Consulente partner: selettore cliente + vista filtrata              */
  /* ------------------------------------------------------------------ */
  if (profilo?.ruolo === "consulente") {
    const { cliente } = await searchParams;

    // Le organizzazioni con mandato attivo (la RLS non ne mostra altre).
    const { data: clienti } = await supabase
      .from("organizations")
      .select("id, ragione_sociale, partita_iva, dimensione")
      .order("ragione_sociale");

    const selezionato =
      (cliente && (clienti ?? []).find((c) => c.id === cliente)) ||
      (clienti ?? [])[0] ||
      null;

    const [{ data: ordini }, { data: moduli }] = selezionato
      ? await Promise.all([
          supabase
            .from("orders")
            .select("*")
            .eq("organization_id", selezionato.id)
            .order("created_at", { ascending: false }),
          supabase
            .from("module_activations")
            .select("*")
            .eq("organization_id", selezionato.id)
            .order("created_at", { ascending: false }),
        ])
      : [{ data: [] }, { data: [] }];

    return (
      <main className="mx-auto max-w-3xl px-5 py-12">
        <p className="flex items-center gap-2 text-xs font-semibold tracking-widest text-pine">
          <Briefcase size={14} /> CONSULENTE PARTNER
        </p>
        <h1 className="mt-2 font-display text-3xl font-semibold text-pine">
          I tuoi clienti
        </h1>
        <p className="mt-2 text-sm text-gray-warm">
          Accesso come{" "}
          <strong className="font-medium text-ink">{user.email}</strong>. Vedi
          solo le imprese che ti hanno dato mandato; ogni mandato è revocabile
          dall&apos;impresa in qualsiasi momento.
        </p>

        {(clienti ?? []).length === 0 ? (
          <div className="mt-8 rounded-xl border border-line bg-white p-5">
            <p className="text-sm text-gray-warm">
              Nessun cliente collegato: quando un&apos;impresa ti darà mandato,
              il suo ecosistema comparirà qui. Nel frattempo puoi scoprire il{" "}
              <Link
                href="/partner"
                className="font-medium text-pine hover:underline"
              >
                programma partner
              </Link>
              .
            </p>
          </div>
        ) : (
          <>
            {/* Selettore cliente: filtra tutta la vista */}
            <nav aria-label="Seleziona il cliente" className="mt-6">
              <p className="flex items-center gap-2 text-sm font-semibold text-ink">
                <Users size={16} className="text-pine" /> Cliente selezionato
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {(clienti ?? []).map((c) => {
                  const attivo = c.id === selezionato?.id;
                  return (
                    <Link
                      key={c.id}
                      href={`/dashboard?cliente=${c.id}`}
                      aria-current={attivo ? "true" : undefined}
                      className={
                        "rounded-full border px-3.5 py-1.5 text-sm transition-colors " +
                        (attivo
                          ? "border-pine bg-pine font-medium text-white"
                          : "border-line bg-white text-gray-warm hover:border-pine/40")
                      }
                    >
                      {c.ragione_sociale}
                    </Link>
                  );
                })}
              </div>
            </nav>

            {selezionato && (
              <section className="mt-6 rounded-2xl border border-line bg-white p-5">
                <h2 className="font-display text-xl text-ink">
                  {selezionato.ragione_sociale}
                </h2>
                <p className="mt-1 text-xs text-gray-warm">
                  P.IVA {selezionato.partita_iva} · impresa{" "}
                  {DIMENSIONE_LABEL[selezionato.dimensione] ??
                    selezionato.dimensione}
                </p>

                <h3 className="mt-5 flex items-center gap-2 text-sm font-semibold text-ink">
                  <PackageCheck size={15} className="text-pine" /> Ordini
                </h3>
                {(ordini ?? []).length > 0 ? (
                  <div className="mt-2 space-y-2">
                    {(ordini ?? []).map((o) => (
                      <div
                        key={o.id}
                        className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line/70 bg-paper px-3.5 py-2.5"
                      >
                        <p className="text-sm font-medium text-ink">
                          {nomeServizio(o.servizio_slug)}
                        </p>
                        <span
                          className={
                            "rounded-full px-2.5 py-0.5 text-xs font-medium " +
                            (STATO_BADGE[o.stato] ?? "bg-paper text-gray-warm")
                          }
                        >
                          {STATO_LABEL[o.stato] ?? o.stato}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-gray-warm">
                    Nessun ordine per questo cliente.
                  </p>
                )}

                <h3 className="mt-5 flex items-center gap-2 text-sm font-semibold text-ink">
                  <Boxes size={15} className="text-pine" /> Moduli
                </h3>
                {(moduli ?? []).length > 0 ? (
                  <div className="mt-2 space-y-2">
                    {(moduli ?? []).map((m) => (
                      <div
                        key={m.id}
                        className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line/70 bg-paper px-3.5 py-2.5"
                      >
                        <p className="text-sm font-medium text-ink">
                          {nomeServizio(m.module)}
                        </p>
                        <span
                          className={
                            "rounded-full px-2.5 py-0.5 text-xs font-medium " +
                            (STATO_BADGE[m.stato] ?? "bg-paper text-gray-warm")
                          }
                        >
                          {STATO_LABEL[m.stato] ?? m.stato}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-gray-warm">
                    Nessun modulo attivo per questo cliente.
                  </p>
                )}

                <p className="mt-5 border-t border-line pt-3 text-xs text-gray-light">
                  In questa fase la vista del consulente è in sola lettura: le
                  attivazioni per conto del cliente arrivano con le prossime
                  fasi del programma partner.
                </p>
              </section>
            )}
          </>
        )}
      </main>
    );
  }

  /* ------------------------------------------------------------------ */
  /* Impresa: il proprio ecosistema (la RLS filtra da sola)              */
  /* ------------------------------------------------------------------ */
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

  return (
    <main className="mx-auto max-w-3xl px-5 py-12">
      <h1 className="font-display text-3xl font-semibold text-pine">
        {org ? org.ragione_sociale : "Il tuo ecosistema"}
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
            catalogo per creare il tuo ecosistema.
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
