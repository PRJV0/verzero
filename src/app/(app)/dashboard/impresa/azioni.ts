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

/**
 * RIFIUTO di un campo proposto dal Motore (SPEC §12.D).
 *
 * Il cliente può respingere OGNI SINGOLA proposta, non solo accettarla:
 * senza questo, «da confermare» sarebbe una conferma rimandata, non una
 * scelta. Il record resta — serve a ricordare al Motore di non
 * riproporlo — ma il valore smette di valere e non entra in nessun
 * documento.
 */
export async function rifiutaCampo(campo: string) {
  const supabase = await createClient();
  await supabase
    .from("company_fields")
    .update({ stato: "rifiutato", confirmed_at: null })
    .eq("campo", campo)
    .eq("stato", "da_confermare");
  revalidatePath("/dashboard/impresa");
  revalidatePath("/dashboard/percorsi");
  revalidatePath("/dashboard");
}

/** Il sito ufficiale dichiarato dal cliente: da lì parte la lettura. */
export async function salvaSitoWeb(formData: FormData) {
  const grezzo = String(formData.get("sito") ?? "").trim();
  if (grezzo.length === 0 || grezzo.length > 300) return;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  const { data: profilo } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", user.id)
    .maybeSingle();
  if (!profilo?.organization_id) return;
  // La RLS consente all'impresa di aggiornare solo la propria riga.
  await supabase
    .from("organizations")
    .update({ sito_web: grezzo })
    .eq("id", profilo.organization_id);
  revalidatePath("/dashboard/impresa");
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
