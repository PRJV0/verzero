import "server-only";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";

import { publicEnv, serverEnv } from "@/lib/env";
import type { Database } from "@/types/database";

/**
 * Client con service role: BYPASSA la Row Level Security.
 *
 * Usare solo dove serve davvero (pipeline di estrazione, job pianificati,
 * seed dei fattori di emissione) e filtrando sempre a mano per organization_id.
 * Per tutto ciò che agisce per conto di un utente usare lib/supabase/server.
 */
export function createAdminClient() {
  return createSupabaseClient<Database>(
    publicEnv.supabaseUrl,
    serverEnv().supabaseServiceRoleKey,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
