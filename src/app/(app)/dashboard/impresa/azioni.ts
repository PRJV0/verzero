"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

/**
 * Conferma di un campo recuperato dal Motore (SPEC §12.H, tappa 2.1).
 *
 * Gira con il client di SESSIONE: i permessi a colonna della 2.0
 * consentono all'utente di toccare solo `valore`, `stato` e
 * `confirmed_at` — non può spacciarsi per il Motore né riscrivere la
 * provenienza, e i test RLS lo verificano. Qui il campo passa da
 * «da confermare» a «confermato»: da quel momento nessun arricchimento
 * successivo lo sovrascriverà, perché la parola del cliente vale più di
 * quella di una banca dati.
 */
export async function confermaCampo(campo: string) {
  const supabase = await createClient();
  await supabase
    .from("company_fields")
    .update({ stato: "confermato", confirmed_at: new Date().toISOString() })
    .eq("campo", campo)
    .eq("stato", "da_confermare");
  revalidatePath("/dashboard/impresa");
  revalidatePath("/dashboard/percorsi");
  revalidatePath("/dashboard");
}

/** Correzione di un campo proposto dal Motore: vince sempre il cliente. */
export async function correggiCampo(campo: string, valore: string) {
  const pulito = valore.trim();
  if (pulito.length === 0 || pulito.length > 2000) return;
  const supabase = await createClient();
  await supabase
    .from("company_fields")
    .update({
      valore: pulito,
      stato: "confermato",
      confirmed_at: new Date().toISOString(),
    })
    .eq("campo", campo);
  revalidatePath("/dashboard/impresa");
  revalidatePath("/dashboard/percorsi");
  revalidatePath("/dashboard");
}
