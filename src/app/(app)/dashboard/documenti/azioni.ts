"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { documentiAttivi } from "@/lib/bozza";
import {
  MAX_BYTE,
  MIME_AMMESSI,
  riconosciDaNome,
  statoIniziale,
  tipoDocumento,
} from "@/lib/documenti";
import { siSaLeggere } from "@/lib/motore/famiglie";
import { eseguiLettura } from "@/lib/motore/registra";
import { annoRendicontazioneDefault } from "@/lib/periodo";

/**
 * Azioni dell'hub documenti.
 *
 * Il FILE non passa da qui: lo carica il browser direttamente nel bucket
 * privato, dove la RLS dello storage controlla che la cartella sia
 * quella della propria organizzazione. Queste azioni registrano il
 * documento, lo riconoscono e lo smistano — sempre col client di
 * sessione, così la RLS resta l'unico giudice di chi può cosa.
 */

function aggiornaViste() {
  revalidatePath("/dashboard/documenti");
  revalidatePath("/dashboard/percorsi");
  revalidatePath("/dashboard");
}

export type EsitoRegistrazione =
  | { ok: true; id: string; tipo: string | null; stato: string }
  | { ok: false; errore: string };

/**
 * Registra un file già caricato nello storage: lo riconosce dal nome e
 * decide dove va a finire, dati i percorsi attivi.
 */
export async function registraDocumento(dati: {
  percorso: string;
  nomeFile: string;
  mime: string;
  dimensione: number;
}): Promise<EsitoRegistrazione> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, errore: "Sessione scaduta: rientra e riprova." };

  const { data: profilo } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", user.id)
    .maybeSingle();
  const organizationId = profilo?.organization_id;
  if (!organizationId) {
    return { ok: false, errore: "Nessuna impresa collegata a questo accesso." };
  }

  // Ricontrollo lato server ciò che il browser ha già controllato: un
  // client si può ingannare, e il bucket ha i suoi limiti ma non conosce
  // le nostre regole.
  if (dati.dimensione <= 0 || dati.dimensione > MAX_BYTE) {
    return { ok: false, errore: "Il file supera il limite di 20 MB." };
  }
  if (!MIME_AMMESSI.includes(dati.mime)) {
    return { ok: false, errore: "Formato non ammesso." };
  }
  // La cartella deve essere la propria: la RLS lo impone già, ma un
  // percorso incoerente creerebbe una riga che punta al nulla.
  if (!dati.percorso.startsWith(`${organizationId}/`)) {
    return { ok: false, errore: "Percorso del file non valido." };
  }

  const { data: moduli } = await supabase
    .from("module_activations")
    .select("module")
    .eq("organization_id", organizationId)
    .in("stato", ["richiesto", "attivo", "in_attivazione"]);
  const attivi = documentiAttivi((moduli ?? []).map((m) => m.module));

  const { tipo } = riconosciDaNome(dati.nomeFile);
  const stato = statoIniziale(tipo, attivi);

  const { data, error } = await supabase
    .from("documents")
    .insert({
      organization_id: organizationId,
      caricato_da: user.id,
      nome_file: dati.nomeFile.slice(0, 300),
      percorso: dati.percorso,
      mime: dati.mime,
      dimensione: dati.dimensione,
      tipo: tipo?.chiave ?? null,
      tipo_confermato: false,
      stato,
    })
    .select("id")
    .single();

  if (error || !data) {
    return {
      ok: false,
      errore:
        error?.code === "23505"
          ? "Questo file risulta già caricato."
          : "Non siamo riusciti a registrare il documento: riprova.",
    };
  }

  aggiornaViste();
  return { ok: true, id: data.id, tipo: tipo?.chiave ?? null, stato };
}

/**
 * Il cliente corregge (o assegna) il tipo. La sua parola vale più del
 * riconoscimento automatico: da qui in poi il documento è classificato e
 * `tipo_confermato` lo ricorda.
 */
export async function correggiTipoDocumento(id: string, chiaveTipo: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const tipo = tipoDocumento(chiaveTipo);
  if (!tipo) return;

  const { data: profilo } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", user.id)
    .maybeSingle();
  if (!profilo?.organization_id) return;

  const { data: moduli } = await supabase
    .from("module_activations")
    .select("module")
    .eq("organization_id", profilo.organization_id)
    .in("stato", ["richiesto", "attivo", "in_attivazione"]);
  const attivi = documentiAttivi((moduli ?? []).map((m) => m.module));

  await supabase
    .from("documents")
    .update({
      tipo: tipo.chiave,
      tipo_confermato: true,
      stato: statoIniziale(tipo, attivi),
    })
    .eq("id", id);

  aggiornaViste();
}

/** Rimuove un documento: prima il file, poi la riga. */
export async function eliminaDocumento(id: string) {
  const supabase = await createClient();
  const { data: documento } = await supabase
    .from("documents")
    .select("percorso")
    .eq("id", id)
    .maybeSingle();
  if (!documento) return;

  // Se la rimozione del file fallisce non cancelliamo la riga: meglio un
  // documento ancora elencato che un file orfano invisibile nel bucket.
  const { error } = await supabase.storage
    .from("documenti")
    .remove([documento.percorso]);
  if (error) return;

  await supabase.from("documents").delete().eq("id", id);
  aggiornaViste();
}

/* ================================================================== */
/* IL MOTORE — lettura del contenuto (docs/motore.md)                  */
/* ================================================================== */

/**
 * Legge un documento e ne registra i campi.
 *
 * Le due cose che questa azione NON fa, e sono le più importanti: non
 * scrive niente a stato `confermato` — i campi nascono sempre da
 * confermare — e non legge documenti che non siano dell'organizzazione di
 * chi chiede, perché il documento si recupera col client di sessione e la
 * RLS non lascia passare gli altri.
 */
export async function leggiDocumentoAzione(
  id: string,
): Promise<{ ok: boolean; messaggio: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, messaggio: "Sessione scaduta: rientra e riprova." };
  }

  // Il documento si legge con la RLS attiva: se non è tuo, non esiste.
  const { data: documento } = await supabase
    .from("documents")
    .select("id, organization_id, percorso, mime, tipo, stato")
    .eq("id", id)
    .maybeSingle();
  if (!documento) {
    return { ok: false, messaggio: "Documento non trovato." };
  }

  const { data: profilo } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", user.id)
    .maybeSingle();
  // Il consulente legge il fascicolo del cliente, non ci scrive dentro:
  // la lettura di un documento crea dati che il cliente dovrà confermare,
  // e chi conferma dev'essere chi risponde di quei dati.
  if (profilo?.organization_id !== documento.organization_id) {
    return {
      ok: false,
      messaggio: "La lettura dei documenti la avvia l'impresa titolare.",
    };
  }

  if (!siSaLeggere(documento.tipo)) {
    return {
      ok: false,
      messaggio:
        "Questo tipo di documento non lo sappiamo ancora leggere: resta in archivio e alimenta i percorsi come prima.",
    };
  }
  if (documento.stato === "in_lettura") {
    return { ok: false, messaggio: "Questo documento è già in lettura." };
  }

  const { data: org } = await supabase
    .from("organizations")
    .select("anno_rendicontazione")
    .eq("id", documento.organization_id)
    .maybeSingle();

  const esito = await eseguiLettura({
    documentId: documento.id,
    organizationId: documento.organization_id,
    percorso: documento.percorso,
    mime: documento.mime,
    tipo: documento.tipo as string,
    annoRendicontazione:
      org?.anno_rendicontazione ?? annoRendicontazioneDefault(),
  });

  aggiornaViste();
  return { ok: esito.ok, messaggio: esito.messaggio };
}

/**
 * Il cliente conferma un campo: da qui in poi il dato conta. È il gesto
 * che fa salire l'anello a peso pieno, ed è anche il posizionamento
 * legale del prodotto — l'AI assiste, il cliente valida.
 */
export async function confermaCampo(id: string) {
  const supabase = await createClient();
  await supabase
    .from("document_fields")
    .update({ stato: "confermato", confirmed_at: new Date().toISOString() })
    .eq("id", id);
  aggiornaViste();
}

/** Il cliente dice che il dato è sbagliato: non si ripropone. */
export async function rifiutaCampo(id: string) {
  const supabase = await createClient();
  await supabase
    .from("document_fields")
    .update({ stato: "rifiutato", confirmed_at: null })
    .eq("id", id);
  aggiornaViste();
}

/**
 * Il cliente corregge il valore e con ciò lo conferma: se l'ha scritto
 * lui, è confermato per definizione. La provenienza (pagina, estratto,
 * confidenza) resta quella della lettura: dice come ci eravamo arrivati
 * noi, e serve a capire perché avevamo sbagliato.
 */
export async function correggiCampo(id: string, valore: string) {
  const pulito = valore.trim().slice(0, 500);
  if (pulito.length === 0) return;
  const supabase = await createClient();
  await supabase
    .from("document_fields")
    .update({
      valore: pulito,
      stato: "confermato",
      confirmed_at: new Date().toISOString(),
    })
    .eq("id", id);
  aggiornaViste();
}

/** Un indirizzo temporaneo per aprire il file: il bucket resta privato. */
export async function linkDocumento(id: string): Promise<string | null> {
  const supabase = await createClient();
  const { data: documento } = await supabase
    .from("documents")
    .select("percorso")
    .eq("id", id)
    .maybeSingle();
  if (!documento) return null;

  const { data } = await supabase.storage
    .from("documenti")
    .createSignedUrl(documento.percorso, 60);
  return data?.signedUrl ?? null;
}
