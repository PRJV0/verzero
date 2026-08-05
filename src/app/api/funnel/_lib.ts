import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

/** Versione dei testi accettati nel funnel (SPEC §15.1: tracciata nei consensi). */
export const DOC_VERSION = "2026-08-preliminare";

/**
 * Risolve l'utente per le route del funnel: prima la sessione (via cookie),
 * altrimenti lo userId esplicito appena creato dalla signUp — necessario
 * quando il progetto Supabase richiede la conferma email e la signUp non
 * apre sessione. In quel caso verifichiamo che l'id esista davvero in auth.
 */
export async function risolviUtente(
  userId: string | undefined,
): Promise<{ id: string; email: string | null; metadata: Record<string, unknown> } | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    return {
      id: user.id,
      email: user.email ?? null,
      metadata: (user.user_metadata ?? {}) as Record<string, unknown>,
    };
  }
  if (!userId) return null;
  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.getUserById(userId);
  if (error || !data.user) return null;
  return {
    id: data.user.id,
    email: data.user.email ?? null,
    metadata: (data.user.user_metadata ?? {}) as Record<string, unknown>,
  };
}
