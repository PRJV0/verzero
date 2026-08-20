"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

/**
 * Azioni del back-office lead.
 *
 * Girano con il client di SESSIONE: è la RLS, tramite `is_admin()`, a
 * decidere se questo utente può scrivere — non un controllo qui dentro,
 * che sarebbe aggirabile e comunque duplicato. Il filtro sui valori di
 * stato resta perché un valore fuori elenco romperebbe il vincolo a
 * database con un errore illeggibile.
 */

type Tabella = "orders" | "contact_messages" | "waitlist";

const STATI_AMMESSI: Record<Tabella, string[]> = {
  orders: ["richiesta", "in_attivazione", "attivo", "disdetto"],
  contact_messages: ["nuovo", "in_lavorazione", "chiuso"],
  waitlist: ["nuovo", "contattato", "convertito", "chiuso"],
};

export async function cambiaStatoLead(
  tabella: Tabella,
  id: string,
  stato: string,
) {
  if (!STATI_AMMESSI[tabella]?.includes(stato)) return;
  const supabase = await createClient();
  // Lo stato è già stato validato contro l'elenco della tabella: il cast
  // dice a TypeScript ciò che il controllo qui sopra ha appena garantito.
  await supabase
    .from(tabella)
    .update({ stato } as never)
    .eq("id", id);
  revalidatePath("/dashboard/lead");
}

export async function salvaNota(tabella: Tabella, id: string, nota: string) {
  const pulita = nota.trim().slice(0, 2000);
  const supabase = await createClient();
  await supabase
    .from(tabella)
    .update({ note_interne: pulita === "" ? null : pulita })
    .eq("id", id);
  revalidatePath("/dashboard/lead");
}
