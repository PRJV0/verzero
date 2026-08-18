import { Suspense } from "react";
import Link from "next/link";

import { createClient } from "@/lib/supabase/server";

import { NavPortale } from "./nav";

/**
 * La shell del portale (SPEC §12.H + identità visiva §12.G).
 *
 * Non un pannello di controllo: uno studio professionale che ha già
 * aperto la tua pratica. La barra di comando è pino profondo con il
 * nome dell'impresa e la P.IVA in chiaro e lo zero canonico in
 * filigrana; la navigazione è pino pieno col segmento menta del
 * Sigillo a marcare la voce attiva. Uno screenshot senza logo deve
 * essere riconoscibile come Ver0.
 */
export default async function PortaleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // La barra porta l'intestazione della pratica: per l'impresa nome e
  // P.IVA, per il consulente il suo studio. (Il cliente selezionato del
  // consulente vive nelle pagine: i layout non leggono i searchParams.)
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let intestazione = "Il tuo ecosistema";
  let sottotitolo: string | null = null;
  if (user) {
    const { data: profilo } = await supabase
      .from("profiles")
      .select("ruolo, organization_id")
      .eq("id", user.id)
      .maybeSingle();
    if (profilo?.ruolo === "consulente") {
      intestazione = "Consulente partner";
      sottotitolo = user.email ?? null;
    } else if (profilo?.organization_id) {
      const { data: org } = await supabase
        .from("organizations")
        .select("ragione_sociale, partita_iva")
        .eq("id", profilo.organization_id)
        .maybeSingle();
      if (org) {
        intestazione = org.ragione_sociale;
        sottotitolo = `P.IVA ${org.partita_iva}`;
      }
    }
  }

  return (
    <div className="min-h-dvh bg-paper">
      {/* La barra di comando: pino profondo, la pratica in chiaro,
          lo zero canonico in filigrana sul lato destro. */}
      <header className="relative sticky top-0 z-30 overflow-hidden bg-pine-deep px-5 py-3">
        <span
          aria-hidden
          className="pointer-events-none absolute -right-6 -top-14 select-none font-display text-[11rem] leading-none text-white/[0.05]"
        >
          0
        </span>
        <div className="relative mx-auto flex max-w-6xl items-center justify-between gap-4">
          <Link
            href="/dashboard"
            aria-label="Ver0 — il tuo ecosistema"
            className="font-display text-xl text-white"
          >
            Ver<span className="text-mint-bright">0</span>
          </Link>
          <div className="min-w-0 text-center">
            <p className="truncate font-display text-base leading-tight text-white sm:text-lg">
              {intestazione}
            </p>
            {sottotitolo && (
              <p className="truncate text-[11px] tabular-nums text-moss">
                {sottotitolo}
              </p>
            )}
          </div>
          <Link
            href="/servizi"
            className="shrink-0 rounded-lg border border-white/25 px-3.5 py-2 text-xs font-medium text-white transition-colors hover:border-mint-bright/60 hover:text-mint-bright"
          >
            Catalogo
          </Link>
        </div>
      </header>

      <div className="mx-auto flex max-w-6xl gap-8 px-5 pb-24 pt-8 md:pb-12">
        {/* useSearchParams nella nav richiede un confine di Suspense */}
        <Suspense fallback={<div className="hidden w-56 shrink-0 md:block" />}>
          <NavPortale />
        </Suspense>
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
