import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

import { leggiDocumento, type EsitoConUso } from "./chiamata";
import { voceMotore } from "./famiglie";

/**
 * DAL FILE ALLA BANCA DATI — l'orchestrazione di una lettura.
 *
 * Tre scritture, e l'ordine conta: prima si dice che si sta leggendo
 * (così il portale può mostrare avanzamento onesto invece di una pagina
 * ferma), poi si legge, poi si registra l'esito. Il log tecnico si scrive
 * SEMPRE, anche quando la lettura fallisce: è proprio il fallimento la
 * riga che serve a capire cosa non funziona.
 *
 * Il service role serve a due cose sole — scaricare il file dal bucket e
 * scrivere le righe che l'utente non deve poter scrivere (confidenza,
 * pagina, provenienza). Tutto il resto passa dal client di sessione, dove
 * la RLS resta l'unico giudice.
 */

export type EsitoLettura = {
  ok: boolean;
  /** Cosa dire al cliente, in italiano. Sempre presente. */
  messaggio: string;
  /** Quanti campi sono stati scritti (0 se non si è letto nulla). */
  scritti: number;
  /** Quanti erano già confermati e non sono stati toccati. */
  preservati: number;
};

export async function eseguiLettura(opzioni: {
  documentId: string;
  organizationId: string;
  percorso: string;
  mime: string;
  tipo: string;
  annoRendicontazione: number;
}): Promise<EsitoLettura> {
  const { documentId, organizationId, percorso, mime, tipo } = opzioni;
  const admin = createAdminClient();
  const voce = voceMotore(tipo);

  if (!voce) {
    return {
      ok: false,
      messaggio:
        "Questo tipo di documento non lo sappiamo ancora leggere: resta in archivio e alimenta i percorsi come prima.",
      scritti: 0,
      preservati: 0,
    };
  }

  /* — 1. Si dichiara che si sta leggendo — */
  await admin
    .from("documents")
    .update({ stato: "in_lettura", lettura_nota: null })
    .eq("id", documentId)
    .eq("organization_id", organizationId);

  /* — 2. Il file — */
  const scaricato = await admin.storage.from("documenti").download(percorso);
  if (scaricato.error || !scaricato.data) {
    await concludi(documentId, organizationId, "smistato", "Il file non si è aperto.");
    await registraLog({
      documentId,
      organizationId,
      voce,
      esito: { esito: "errore", messaggio: "file non scaricabile" },
    });
    return {
      ok: false,
      messaggio:
        "Non siamo riusciti ad aprire il file archiviato. Riprova a caricarlo.",
      scritti: 0,
      preservati: 0,
    };
  }

  const dati = new Uint8Array(await scaricato.data.arrayBuffer());

  /* — 3. La lettura — */
  const esito = await leggiDocumento({
    dati,
    mime,
    voce,
    annoRendicontazione: opzioni.annoRendicontazione,
  });

  // Il log si scrive sempre, esito buono o cattivo: è il fallimento la
  // riga che serve a capire cosa non funziona.
  await registraLog({ documentId, organizationId, voce, esito });

  /* — 4. L'esito — */
  if (esito.esito === "altro_tipo") {
    // Non «illeggibile»: il documento si legge benissimo, è di un altro
    // tipo. Torna fra quelli da classificare, dove il portale chiede già
    // al cliente che cosa sia — con la nota che spiega perché.
    await concludi(documentId, organizationId, "da_classificare", esito.messaggio);
    return { ok: false, messaggio: esito.messaggio, scritti: 0, preservati: 0 };
  }

  if (esito.esito !== "ok") {
    const stato = esito.esito === "errore" ? "smistato" : "illeggibile";
    await concludi(documentId, organizationId, stato, esito.messaggio);
    return { ok: false, messaggio: esito.messaggio, scritti: 0, preservati: 0 };
  }

  /* — 5. I campi — */
  const { data: esistenti } = await admin
    .from("document_fields")
    .select("campo, stato")
    .eq("document_id", documentId);
  const statoDi = new Map((esistenti ?? []).map((r) => [r.campo, r.stato]));

  let scritti = 0;
  let preservati = 0;

  for (const campo of esito.campi) {
    // La parola del cliente è definitiva in entrambi i sensi: né un campo
    // confermato né uno rifiutato vengono riscritti da una rilettura.
    const precedente = statoDi.get(campo.chiave);
    if (precedente === "confermato" || precedente === "rifiutato") {
      preservati++;
      continue;
    }

    const { error } = await admin.from("document_fields").upsert(
      {
        document_id: documentId,
        organization_id: organizationId,
        campo: campo.chiave,
        etichetta: campo.etichetta,
        valore: campo.valore,
        unita: campo.unita,
        confidenza: campo.confidenza,
        pagina: campo.pagina,
        estratto_da: campo.estrattoDa?.slice(0, 500) ?? null,
        fonte_lettura: campo.fonteLettura,
        nota: campo.nota,
        avvisi: campo.avvisi,
        // Sempre. Non è una comodità: è il posizionamento del prodotto.
        stato: "da_confermare",
        confirmed_at: null,
      },
      { onConflict: "document_id,campo" },
    );
    if (!error) scritti++;
  }

  // In pagina i due elenchi si mostrano insieme — al cliente serve
  // sapere tutto quello che va guardato — ma nel log restano distinti.
  const daDire = [...esito.avvisi, ...esito.avvertenze];
  const nota = daDire.length > 0 ? daDire.join(" ") : null;
  await concludi(documentId, organizationId, "letto", nota, true);

  const letti = esito.campi.filter((c) => c.valore !== null).length;
  return {
    ok: true,
    messaggio:
      letti === 0
        ? "Abbiamo letto il documento ma non ci abbiamo trovato dati utilizzabili."
        : `Letti ${letti} dati su ${esito.campi.length}. Controllali e confermali: finché non lo fai non entrano nei documenti.`,
    scritti,
    preservati,
  };
}

/* ------------------------------------------------------------------ */

async function concludi(
  documentId: string,
  organizationId: string,
  stato: "smistato" | "letto" | "illeggibile" | "da_classificare",
  nota: string | null,
  timbra = false,
) {
  const admin = createAdminClient();
  await admin
    .from("documents")
    .update({
      stato,
      lettura_nota: nota,
      ...(timbra ? { letto_at: new Date().toISOString() } : {}),
    })
    .eq("id", documentId)
    .eq("organization_id", organizationId);
}

async function registraLog(opzioni: {
  documentId: string;
  organizationId: string;
  voce: { tipo: string; famiglia: string; versione: string };
  esito: EsitoConUso;
}) {
  const { documentId, organizationId, voce, esito } = opzioni;
  const admin = createAdminClient();

  await admin.from("extractions").insert({
    document_id: documentId,
    organization_id: organizationId,
    famiglia: voce.famiglia,
    tipo: voce.tipo,
    versione_schema: voce.versione,
    modello: esito.uso?.modello ?? "n/d",
    esito: esito.esito,
    qualita: esito.esito === "ok" ? esito.qualita : null,
    pdf_nativo: esito.natura?.nativo ?? null,
    pagine: esito.natura?.pagine ?? null,
    token_ingresso: esito.uso?.tokenIngresso ?? null,
    token_uscita: esito.uso?.tokenUscita ?? null,
    costo_micro: esito.uso?.costoMicro ?? null,
    durata_ms: esito.uso?.durataMs ?? null,
    avvisi:
      esito.esito === "ok" ? [...esito.avvisi, ...esito.avvertenze] : null,
    errore:
      esito.esito === "ok"
        ? null
        : "messaggio" in esito
          ? esito.messaggio
          : null,
    grezzo: esito.esito === "non_valido" ? (esito.grezzo as object) : null,
  });
}
