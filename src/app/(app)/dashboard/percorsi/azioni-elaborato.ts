"use server";

import { revalidatePath } from "next/cache";

import { MODELLO_PER_PERCORSO } from "@/lib/elaborati";
import {
  generaVersione,
  tabellaAssente,
  type EsitoGenerazione,
} from "@/lib/elaborato/archivio";
import {
  chiaveAttivita,
  chiaveFatto,
  FATTI_DICHIARABILI,
  leggiAttivita,
  MAX_PERIODI_ATTIVITA,
  valoreAttivita,
  type AttivitaContatore,
  type FattoDichiarabile,
} from "@/lib/elaborato/dichiarazioni";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

/**
 * Le azioni del documento finale.
 *
 * La generazione la avvia l'IMPRESA titolare, come la lettura dei
 * documenti: un documento consegnato dichiara i dati che l'impresa ha
 * confermato, e chi chiede di emetterlo dev'essere chi ne risponde. Il
 * consulente vede lo stato, le versioni e i file.
 *
 * Tutte le verifiche passano dal client di SESSIONE: il percorso deve
 * essere attivo per quella organizzazione e il modello deve appartenere
 * al percorso. Solo dopo, il service role scrive file e versione.
 */

const STATI_ATTIVI = ["attivo", "in_attivazione"] as const;

export async function generaElaboratoAzione(
  percorso: string,
  chiaveModello: string,
  forza = false,
): Promise<EsitoGenerazione> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { esito: "errore", messaggio: "Sessione scaduta: rientra e riprova." };

  const { data: profilo } = await supabase
    .from("profiles")
    .select("organization_id, ruolo")
    .eq("id", user.id)
    .maybeSingle();
  if (!profilo?.organization_id || profilo.ruolo !== "impresa") {
    return { esito: "errore", messaggio: "Il documento finale lo genera l'impresa titolare dei dati." };
  }

  const voce = (MODELLO_PER_PERCORSO[percorso] ?? []).find((v) => v.modello === chiaveModello);
  if (!voce) return { esito: "errore", messaggio: "Questo documento non appartiene al percorso indicato." };

  const [{ data: org }, { data: attivazione }] = await Promise.all([
    supabase
      .from("organizations")
      .select("id, ragione_sociale, partita_iva, anno_rendicontazione, sito_web, created_at")
      .eq("id", profilo.organization_id)
      .maybeSingle(),
    supabase
      .from("module_activations")
      .select("id, stato")
      .eq("organization_id", profilo.organization_id)
      .eq("module", percorso)
      .in("stato", STATI_ATTIVI)
      .limit(1)
      .maybeSingle(),
  ]);
  if (!org) return { esito: "errore", messaggio: "Nessuna impresa collegata a questo accesso." };
  if (!attivazione) {
    return { esito: "errore", messaggio: "Il documento finale si genera quando il percorso è avviato." };
  }

  const esito = await generaVersione({
    sessione: supabase,
    servizio: createAdminClient(),
    utenteId: user.id,
    organizzazione: org,
    percorso,
    chiaveModello,
    opzioni: voce.opzioni ?? [],
    forza,
  });
  if (esito.esito === "generata") revalidatePath("/dashboard/percorsi");
  return esito;
}

export type RichiestaDichiarazione =
  | { tipo: "fatto"; fatto: FattoDichiarabile; esercizio: number; ritira?: boolean }
  | {
      tipo: "periodo-contatore";
      punto: string;
      esercizio: number;
      ritira?: boolean;
      inattivo?: boolean;
      periodi?: { dal: string; al: string }[];
    };

/**
 * Una dichiarazione dell'organizzazione (src/lib/elaborato/dichiarazioni.ts):
 * resa, corretta o ritirata.
 *
 * La rende l'IMPRESA, come la generazione: dichiarare che nel 2025 non ci
 * sono stati consumi di gas è un'affermazione di chi ne risponde, e il
 * documento la riporta come tale. Si scrive col client di SESSIONE nella
 * scheda impresa: la policy di inserimento vincola la provenienza a
 * `utente` e l'organizzazione a quella di chi chiede, i permessi di colonna
 * lasciano aggiornare solo valore, stato e conferma. Il valore si controlla
 * con lo stesso parser che userà la composizione: una dichiarazione che il
 * documento non saprebbe leggere non si registra.
 */
export async function dichiarazioneAzione(
  richiesta: RichiestaDichiarazione,
): Promise<{ ok: true } | { ok: false; errore: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, errore: "Sessione scaduta: rientra e riprova." };

  const { data: profilo } = await supabase
    .from("profiles")
    .select("organization_id, ruolo")
    .eq("id", user.id)
    .maybeSingle();
  if (!profilo?.organization_id || profilo.ruolo !== "impresa") {
    return { ok: false, errore: "Le dichiarazioni le rende l'impresa titolare dei dati." };
  }
  const organizationId = profilo.organization_id;
  const { data: org } = await supabase
    .from("organizations")
    .select("anno_rendicontazione")
    .eq("id", organizationId)
    .maybeSingle();
  if (!org || richiesta.esercizio !== org.anno_rendicontazione) {
    return { ok: false, errore: "La dichiarazione riguarda un esercizio diverso da quello che stai rendicontando: ricarica la pagina." };
  }

  let chiave: string | null;
  let valore = "si";
  if (richiesta.tipo === "fatto") {
    if (!FATTI_DICHIARABILI.includes(richiesta.fatto)) return { ok: false, errore: "Dichiarazione non riconosciuta." };
    chiave = chiaveFatto(richiesta.fatto, richiesta.esercizio);
  } else {
    chiave = chiaveAttivita(String(richiesta.punto ?? ""), richiesta.esercizio);
    if (!chiave) return { ok: false, errore: "Il codice del contatore non è valido." };
    if (!richiesta.ritira) {
      const periodi = (richiesta.periodi ?? []).slice(0, MAX_PERIODI_ATTIVITA + 1);
      const attivita: AttivitaContatore | null = richiesta.inattivo
        ? { inattivo: true }
        : leggiAttivita(periodi.map((p) => `${p.dal ?? ""}/${p.al ?? ""}`).join(";"), richiesta.esercizio);
      if (!attivita) {
        return {
          ok: false,
          errore: `Indica da uno a ${MAX_PERIODI_ATTIVITA} periodi del ${richiesta.esercizio}, ciascuno con la fine uguale o successiva all'inizio, e senza sovrapporli.`,
        };
      }
      valore = valoreAttivita(attivita);
    }
  }

  const adesso = new Date().toISOString();
  if (richiesta.ritira) {
    // Ritirata, non cancellata: resta la traccia che c'era, e la
    // composizione legge solo le dichiarazioni confermate.
    const { error } = await supabase
      .from("company_fields")
      .update({ stato: "rifiutato", confirmed_at: null })
      .eq("organization_id", organizationId)
      .eq("campo", chiave);
    if (error) return { ok: false, errore: "Non siamo riusciti a ritirare la dichiarazione: riprova." };
  } else {
    const { error } = await supabase.from("company_fields").insert({
      organization_id: organizationId,
      campo: chiave,
      valore,
      provenienza: "utente",
      fonte: "Dichiarazione resa nel portale",
      stato: "confermato",
      confirmed_at: adesso,
    });
    if (error?.code === "23505") {
      const { error: aggiornamento } = await supabase
        .from("company_fields")
        .update({ valore, stato: "confermato", confirmed_at: adesso })
        .eq("organization_id", organizationId)
        .eq("campo", chiave);
      if (aggiornamento) return { ok: false, errore: "Non siamo riusciti a registrare la dichiarazione: riprova." };
    } else if (error) {
      return { ok: false, errore: "Non siamo riusciti a registrare la dichiarazione: riprova." };
    }
  }

  revalidatePath("/dashboard/percorsi");
  return { ok: true };
}

/**
 * Un indirizzo temporaneo per scaricare il file di una versione.
 *
 * La versione si legge col client di sessione — se non è della tua
 * organizzazione, o di un cliente che ti ha dato mandato, non esiste — e
 * l'indirizzo firmato lo produce lo stesso client, sotto la policy del
 * bucket. Dura un minuto: serve ad aprirlo, non a condividerlo.
 */
export async function linkVersioneAzione(
  versioneId: string,
  formato: "pdf" | "docx",
): Promise<{ url: string } | { errore: string }> {
  const supabase = await createClient();
  const { data: versione, error } = await supabase
    .from("elaborati_versioni")
    .select("codice, pdf_percorso, docx_percorso")
    .eq("id", versioneId)
    .maybeSingle();
  if (tabellaAssente(error)) return { errore: "Le versioni non sono ancora disponibili su questo ambiente." };
  if (!versione) return { errore: "Versione non trovata." };
  const percorso = formato === "pdf" ? versione.pdf_percorso : versione.docx_percorso;
  if (!percorso) return { errore: "Questa versione non ha il formato richiesto." };
  const { data } = await supabase.storage
    .from("elaborati")
    .createSignedUrl(percorso, 60, { download: `${versione.codice}.${formato}` });
  return data?.signedUrl ? { url: data.signedUrl } : { errore: "Il file non è raggiungibile: riprova tra poco." };
}
