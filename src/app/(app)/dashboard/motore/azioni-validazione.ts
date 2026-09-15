"use server";

import { revalidatePath } from "next/cache";

import { registraValidazione, tabellaAssente, type EsitoGenerazione } from "@/lib/elaborato/archivio";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

/**
 * LA VALIDAZIONE PROFESSIONALE, DAL BACK-OFFICE.
 *
 * Chi può: l'amministratore, e lo decide `is_admin()` — la stessa funzione
 * delle policy, chiamata col client di SESSIONE, non un controllo scritto
 * qui. Solo dopo che la sessione l'ha confermato, il service role emette
 * la revisione validata.
 *
 * Il verbo è «validare»: il professionista analizza metodo, perimetro e
 * coerenza e ne registra l'esito. Non assevera e non certifica, e il
 * documento lo dice nella sua pagina di validazione.
 */

async function amministratore() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: admin } = await supabase.rpc("is_admin");
  return admin === true ? { supabase, userId: user.id } : null;
}

export async function validaVersioneAzione(form: FormData): Promise<EsitoGenerazione> {
  const chi = await amministratore();
  if (!chi) return { esito: "errore", messaggio: "La validazione si registra dal back-office." };

  const versioneId = String(form.get("versione") ?? "");
  const professionista = String(form.get("professionista") ?? "").replace(/\s+/g, " ").trim().slice(0, 120);
  const qualifica = String(form.get("qualifica") ?? "").replace(/\s+/g, " ").trim().slice(0, 160);
  const rilievi = String(form.get("rilievi") ?? "")
    .split("\n")
    .map((r) => r.trim())
    .filter(Boolean)
    .slice(0, 40);
  if (!versioneId || !professionista || !qualifica) {
    return { esito: "errore", messaggio: "Servono il nome e la qualifica di chi valida." };
  }

  const esito = await registraValidazione({
    servizio: createAdminClient(),
    amministratoreId: chi.userId,
    versioneId,
    professionista,
    qualifica,
    rilievi,
  });
  if (esito.esito === "generata") {
    revalidatePath("/dashboard/motore");
    revalidatePath("/dashboard/percorsi");
  }
  return esito;
}

/** Il file di una versione, per chi valida: il bucket non ha policy per l'amministratore. */
export async function linkPerValidazioneAzione(versioneId: string): Promise<string | null> {
  const chi = await amministratore();
  if (!chi) return null;
  const servizio = createAdminClient();
  const { data: versione, error } = await servizio
    .from("elaborati_versioni")
    .select("pdf_percorso, codice")
    .eq("id", versioneId)
    .maybeSingle();
  if (tabellaAssente(error) || !versione) return null;
  const { data } = await servizio.storage
    .from("elaborati")
    .createSignedUrl(versione.pdf_percorso, 300, { download: `${versione.codice}.pdf` });
  return data?.signedUrl ?? null;
}
