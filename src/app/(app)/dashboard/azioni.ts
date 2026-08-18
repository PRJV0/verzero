"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

/**
 * Azioni del portale. Girano con il client di SESSIONE: è la RLS a
 * decidere cosa è permesso, mai la fiducia nell'input.
 */

/** Il wizard di primo accesso è stato visto (o saltato): mai più mostrato. */
export async function segnaWizardVisto() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  await supabase
    .from("profiles")
    .update({ wizard_visto_at: new Date().toISOString() })
    .eq("id", user.id);
  revalidatePath("/dashboard");
}

/**
 * Revoca di un mandato consulente (SPEC §12.K: l'impresa è titolare dei
 * propri dati e può revocare in ogni momento). La policy co_revoca
 * consente l'update solo all'impresa interessata.
 */
export async function revocaMandato(mandatoId: string) {
  const supabase = await createClient();
  await supabase
    .from("consultant_organizations")
    .update({ stato: "revocato" })
    .eq("id", mandatoId);
  revalidatePath("/dashboard/impostazioni");
}
