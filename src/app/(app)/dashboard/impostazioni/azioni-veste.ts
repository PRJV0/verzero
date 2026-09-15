"use server";

import { createHash } from "node:crypto";

import { revalidatePath } from "next/cache";

import { normalizzaHex } from "@/lib/contrasto";
import { tabellaAssente } from "@/lib/elaborato/archivio";
import { preparaLogo } from "@/lib/elaborato/logo";
import { verificaColore, type TonoMessaggio } from "@/lib/elaborato/veste";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

/**
 * Le azioni della veste dei documenti.
 *
 * Colore, nome in intestazione e contatti sono parole del cliente: si
 * scrivono col client di sessione, e i permessi a colonna della
 * migrazione lasciano toccare solo quelle. Il logo no: passa dai
 * controlli di formato, risoluzione e fondo (`src/lib/elaborato/logo.ts`),
 * e lo registra il server solo se li supera — un file che salta il
 * controllo non deve poter finire in copertina.
 */

const NON_DISPONIBILE = "La veste dei documenti non è ancora attiva su questo ambiente.";

type Messaggio = { tono: TonoMessaggio; testo: string };

type Impresa =
  | { errore: string }
  | { supabase: Awaited<ReturnType<typeof createClient>>; userId: string; organizationId: string };

async function impresaCorrente(): Promise<Impresa> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { errore: "Sessione scaduta: rientra e riprova." };
  const { data: profilo } = await supabase
    .from("profiles")
    .select("organization_id, ruolo")
    .eq("id", user.id)
    .maybeSingle();
  if (!profilo?.organization_id || profilo.ruolo !== "impresa") {
    return { errore: "La veste dei documenti la imposta l'impresa titolare." };
  }
  return { supabase, userId: user.id, organizationId: profilo.organization_id };
}

const pulito = (v: FormDataEntryValue | null, massimo: number) => {
  const s = typeof v === "string" ? v.replace(/\s+/g, " ").trim() : "";
  return s ? s.slice(0, massimo) : null;
};

export async function salvaVesteAzione(
  form: FormData,
): Promise<{ ok: true; avvisi: string[] } | { ok: false; errore: string }> {
  const chi = await impresaCorrente();
  if ("errore" in chi) return { ok: false, errore: chi.errore };

  const coloreGrezzo = pulito(form.get("colore"), 20);
  const colore = coloreGrezzo ? normalizzaHex(coloreGrezzo) : null;
  if (coloreGrezzo && !colore) {
    return { ok: false, errore: "Il colore va scritto come codice esadecimale a sei cifre, per esempio #1F6F5C." };
  }
  const esito = verificaColore(colore);

  const { error } = await chi.supabase.from("brand_settings").upsert(
    {
      organization_id: chi.organizationId,
      colore_accento: colore,
      nome_intestazione: pulito(form.get("nome"), 80),
      indirizzo: pulito(form.get("indirizzo"), 200),
      sito: pulito(form.get("sito"), 200),
      contatto: pulito(form.get("contatto"), 200),
      updated_by: chi.userId,
    },
    { onConflict: "organization_id" },
  );
  if (tabellaAssente(error)) return { ok: false, errore: NON_DISPONIBILE };
  if (error) return { ok: false, errore: "Non siamo riusciti a salvare la veste: riprova." };

  revalidatePath("/dashboard/impostazioni");
  revalidatePath("/dashboard/percorsi");
  return { ok: true, avvisi: esito.avvisi };
}

export async function caricaLogoAzione(
  form: FormData,
): Promise<{ ok: true; messaggi: Messaggio[] } | { ok: false; errore: string; messaggi?: Messaggio[] }> {
  const chi = await impresaCorrente();
  if ("errore" in chi) return { ok: false, errore: chi.errore };

  const file = form.get("logo");
  if (!(file instanceof File) || file.size === 0) return { ok: false, errore: "Scegli un file." };

  const preparato = await preparaLogo(new Uint8Array(await file.arrayBuffer()), file.type);
  if ("errore" in preparato) return { ok: false, errore: preparato.errore };
  if (!preparato.esito.utilizzabile) {
    return {
      ok: false,
      errore: "Questo logo non lo usiamo: in stampa non si vedrebbe bene.",
      messaggi: preparato.esito.messaggi,
    };
  }

  // Il nome del file è l'impronta del contenuto: un logo nuovo non
  // sovrascrive il vecchio, che resta per le versioni già emesse con quello.
  const impronta = createHash("sha256").update(preparato.png).digest("hex").slice(0, 16);
  const percorso = `${chi.organizationId}/logo-${impronta}.png`;
  const servizio = createAdminClient();
  const caricato = await servizio.storage
    .from("marchi")
    .upload(percorso, preparato.png, { contentType: "image/png", upsert: true });
  if (caricato.error) {
    return {
      ok: false,
      errore: /bucket|not found/i.test(caricato.error.message) ? NON_DISPONIBILE : "Non siamo riusciti a salvare il logo: riprova.",
    };
  }

  const { error } = await servizio.from("brand_settings").upsert(
    {
      organization_id: chi.organizationId,
      logo_percorso: percorso,
      logo_larghezza: preparato.larghezza,
      logo_altezza: preparato.altezza,
      logo_vettoriale: preparato.vettoriale,
      logo_esito: preparato.esito.messaggi,
      updated_by: chi.userId,
    },
    { onConflict: "organization_id" },
  );
  if (tabellaAssente(error)) return { ok: false, errore: NON_DISPONIBILE };
  if (error) return { ok: false, errore: "Non siamo riusciti a registrare il logo: riprova." };

  revalidatePath("/dashboard/impostazioni");
  revalidatePath("/dashboard/percorsi");
  return { ok: true, messaggi: preparato.esito.messaggi };
}

/** Toglie il logo dalla veste. Il file resta: le versioni già emesse lo citano. */
export async function rimuoviLogoAzione(): Promise<{ ok: boolean; errore?: string }> {
  const chi = await impresaCorrente();
  if ("errore" in chi) return { ok: false, errore: chi.errore };
  const { error } = await createAdminClient()
    .from("brand_settings")
    .update({ logo_percorso: null, logo_larghezza: null, logo_altezza: null, logo_vettoriale: false, logo_esito: null, updated_by: chi.userId })
    .eq("organization_id", chi.organizationId);
  if (tabellaAssente(error)) return { ok: false, errore: NON_DISPONIBILE };
  if (error) return { ok: false, errore: "Non siamo riusciti a togliere il logo: riprova." };
  revalidatePath("/dashboard/impostazioni");
  revalidatePath("/dashboard/percorsi");
  return { ok: true };
}
