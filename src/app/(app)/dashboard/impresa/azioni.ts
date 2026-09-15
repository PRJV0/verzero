"use server";

import { revalidatePath } from "next/cache";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

/**
 * Conferma di un campo recuperato dall'AI Ver0 (SPEC §12.H, tappa 2.1).
 *
 * Gira con il client di SESSIONE: i permessi a colonna della 2.0
 * consentono all'utente di toccare solo `valore`, `stato` e
 * `confirmed_at` — non può spacciarsi per l'AI Ver0 né riscrivere la
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
 * RIFIUTO di un campo proposto dall'AI Ver0 (SPEC §12.D).
 *
 * Il cliente può respingere OGNI SINGOLA proposta, non solo accettarla:
 * senza questo, «da confermare» sarebbe una conferma rimandata, non una
 * scelta. Il record resta — serve a ricordare all'AI Ver0 di non
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

/**
 * ANNO DI RENDICONTAZIONE (SPEC §12.C): l'anno solare CHIUSO a cui i
 * documenti si riferiscono, che non è l'anno in cui li elaboriamo.
 * Cambiarlo ricompone tutte le bozze: titoli, periodi e richieste.
 */
export async function salvaAnnoRendicontazione(formData: FormData) {
  const anno = Number(formData.get("anno"));
  if (!Number.isInteger(anno) || anno < 2015 || anno > 2100) return;
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
  await supabase
    .from("organizations")
    .update({ anno_rendicontazione: anno })
    .eq("id", profilo.organization_id);
  revalidatePath("/dashboard/impresa");
  revalidatePath("/dashboard/percorsi");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/documenti");
}

/**
 * Correzione di un campo proposto dall'AI Ver0: vince sempre il cliente.
 *
 * E CAMBIA LA PROVENIENZA. Un indirizzo riscritto dal cliente non viene più
 * dal VIES: lasciarlo «recuperato dal VIES» farebbe citare nel documento
 * consegnato una banca dati per un valore che quella banca dati non
 * contiene. Provenienza e fonte il client non le può scrivere (permessi di
 * colonna della 2.0, ed è giusto: non deve potersi spacciare per il
 * Motore); le scrive il server, dopo aver letto la riga con la sessione e
 * sulla sola organizzazione di chi chiede. Riscrivere lo stesso valore è
 * una conferma, e la provenienza resta quella che era.
 */
export async function correggiCampo(campo: string, valore: string) {
  const pulito = valore.trim();
  if (pulito.length === 0 || pulito.length > 2000) return;
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
  const { data: riga } = await supabase
    .from("company_fields")
    .select("valore, provenienza")
    .eq("organization_id", profilo.organization_id)
    .eq("campo", campo)
    .maybeSingle();
  if (!riga) return;

  const adesso = new Date().toISOString();
  if (riga.valore === pulito || riga.provenienza === "utente") {
    await supabase
      .from("company_fields")
      .update({ valore: pulito, stato: "confermato", confirmed_at: adesso })
      .eq("organization_id", profilo.organization_id)
      .eq("campo", campo);
  } else {
    await createAdminClient()
      .from("company_fields")
      .update({
        valore: pulito,
        stato: "confermato",
        confirmed_at: adesso,
        provenienza: "utente",
        fonte: "Corretto dall'impresa nella scheda",
        fonte_url: null,
      })
      .eq("organization_id", profilo.organization_id)
      .eq("campo", campo);
  }
  revalidatePath("/dashboard/impresa");
  revalidatePath("/dashboard/percorsi");
  revalidatePath("/dashboard");
}
