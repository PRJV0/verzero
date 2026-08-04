import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import { OrdinePendente } from "./ordine-pendente";

/**
 * Criterio di completamento della fase 0: "hello world" autenticato.
 * Dalla fase 3 questa pagina diventa la dashboard composta dai soli
 * moduli attivi dell'organizzazione (SPEC §5).
 */
export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <main className="mx-auto max-w-3xl px-5 py-12">
      <h1 className="font-display text-2xl font-semibold text-pine">
        Area riservata
      </h1>
      <p className="mt-2 text-sm text-gray-warm">
        Sei autenticato come <strong>{user.email}</strong>.
      </p>

      <OrdinePendente />

      <div className="mt-6 rounded-xl border border-line bg-white p-5">
        <p className="text-sm text-gray-warm">
          Fase 0 completata. I moduli (carbon footprint, VSME, check-up
          energetico) compaiono qui una volta attivati.
        </p>
      </div>
    </main>
  );
}
