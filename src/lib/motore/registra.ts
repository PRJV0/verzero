import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

import { leggiDocumento, type EsitoConUso } from "./chiamata";
import { voceLeggibile, type VoceLeggibile } from "./famiglie";
import { serveRileggere } from "./riuso";
import type { FonteLettura } from "./schemi";
import {
  MESSAGGIO_AL_CLIENTE,
  notaAllarme,
  verdettoSpesa,
  type Ambito,
} from "./tetti";

/**
 * DAL FILE ALLA BANCA DATI — l'orchestrazione di una lettura.
 *
 * L'ordine dei passi non è casuale:
 *   0. si guarda se rileggere serve davvero (riuso);
 *   1. si guarda se si può spendere (tetti);
 *   2. si dichiara che si sta leggendo, così il portale può mostrare un
 *      avanzamento onesto invece di una pagina ferma;
 *   3. si legge;
 *   4. si registra l'esito — e il log tecnico si scrive SEMPRE, anche
 *      quando la lettura fallisce: è proprio il fallimento la riga che
 *      serve a capire cosa non funziona.
 *
 * Il service role serve a due cose sole — scaricare il file dal bucket e
 * scrivere i valori che l'utente non deve poter scrivere (confidenza,
 * pagina, provenienza). Tutto il resto passa dal client di sessione, dove
 * la RLS resta l'unico giudice.
 */

export type EsitoLettura = {
  ok: boolean;
  /** Cosa dire al cliente, in italiano. Sempre presente. */
  messaggio: string;
  /** Quanti valori sono stati scritti. */
  scritti: number;
  /** Quanti erano già confermati e non sono stati toccati. */
  preservati: number;
  /** Vero quando non si è letto perché non serviva: è un esito buono. */
  riusato?: boolean;
  /** Vero quando servirebbe il consenso a sostituire righe confermate. */
  chiedeSostituzione?: boolean;
};

export async function eseguiLettura(opzioni: {
  documentId: string;
  organizationId: string;
  percorso: string;
  mime: string;
  tipo: string;
  annoRendicontazione: number;
  /** Il cliente ha chiesto espressamente di rileggere: si rilegge. */
  forza?: boolean;
  /** Il cliente ha accettato di sostituire le righe già confermate. */
  sostituisci?: boolean;
}): Promise<EsitoLettura> {
  const { documentId, organizationId, percorso, mime, tipo } = opzioni;
  const admin = createAdminClient();
  const voce = voceLeggibile(tipo);

  if (!voce) {
    return {
      ok: false,
      messaggio:
        "Questo tipo di documento non lo sappiamo ancora leggere: resta in archivio e alimenta i percorsi come prima.",
      scritti: 0,
      preservati: 0,
    };
  }

  /* — 0. Rileggere serve davvero? (riuso.ts) — */
  const { data: documento } = await admin
    .from("documents")
    .select("letto_at, updated_at")
    .eq("id", documentId)
    .maybeSingle();
  const { data: ultima } = await admin
    .from("extractions")
    .select("versione_schema, created_at")
    .eq("document_id", documentId)
    .eq("esito", "ok")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!opzioni.forza) {
    const rilettura = serveRileggere({
      lettaIl: ultima?.created_at ? new Date(ultima.created_at) : null,
      versioneSchema: ultima?.versione_schema ?? null,
      versioneAdesso: voce.versione,
      documentoAggiornatoIl: documento?.updated_at
        ? new Date(documento.updated_at)
        : null,
    });
    if (!rilettura.serve) {
      return {
        ok: true,
        riusato: true,
        messaggio: rilettura.messaggio ?? "",
        scritti: 0,
        preservati: 0,
      };
    }
  }

  /* — 1. Si può spendere? (tetti.ts) — */
  const verdetto = verdettoSpesa(await spesa(organizationId));
  if (verdetto.esito !== "procedi") {
    await admin.from("motore_allarmi").insert({
      ambito: verdetto.ambito,
      livello: verdetto.esito === "ferma" ? "tetto" : "soglia",
      organization_id: organizationId,
      speso_micro: verdetto.speso,
      tetto_micro:
        verdetto.esito === "ferma" ? verdetto.tetto.tetto : verdetto.tetto.soglia,
      nota: notaAllarme(verdetto),
    });
    if (verdetto.esito === "ferma") {
      // Al cliente si dice che è in coda, che è vero: l'allarme in
      // back-office è ciò che rende vera anche la seconda metà della
      // frase, cioè che qualcuno la guarda. Il tetto resta invisibile,
      // e non lo si traveste da attenzione ambientale (riuso.ts).
      return {
        ok: false,
        messaggio: MESSAGGIO_AL_CLIENTE,
        scritti: 0,
        preservati: 0,
      };
    }
  }

  /* — 1bis. Righe già confermate: non si sostituiscono di nascosto — */
  const { data: esistenti } = await admin
    .from("document_fields")
    .select("riga, campo, stato")
    .eq("document_id", documentId);
  const confermate = (esistenti ?? []).filter(
    (r) => r.riga > 0 && r.stato === "confermato",
  );
  if (voce.forma === "tabella" && confermate.length > 0 && !opzioni.sostituisci) {
    const quante = new Set(confermate.map((r) => r.riga)).size;
    return {
      ok: false,
      chiedeSostituzione: true,
      messaggio: `Hai già confermato ${quante === 1 ? "una riga" : `${quante} righe`} di questo documento. Rileggerlo le sostituirebbe con quelle nuove: se è quello che vuoi, dimmelo e procedo.`,
      scritti: 0,
      preservati: 0,
    };
  }

  /* — 2. Si dichiara che si sta leggendo — */
  await admin
    .from("documents")
    .update({ stato: "in_lettura", lettura_nota: null })
    .eq("id", documentId)
    .eq("organization_id", organizationId);

  /* — 3. Il file, e la lettura — */
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
      messaggio: "Non siamo riusciti ad aprire il file archiviato. Riprova a caricarlo.",
      scritti: 0,
      preservati: 0,
    };
  }

  const esito = await leggiDocumento({
    dati: new Uint8Array(await scaricato.data.arrayBuffer()),
    mime,
    voce,
    annoRendicontazione: opzioni.annoRendicontazione,
  });

  // Il log si scrive sempre, esito buono o cattivo.
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

  /* — 5. I valori — */
  const statoDi = new Map(
    (esistenti ?? []).map((r) => [`${r.riga}|${r.campo}`, r.stato]),
  );
  let scritti = 0;
  let preservati = 0;

  const scrivi = async (
    riga: number,
    campo: {
      chiave: string;
      etichetta: string;
      valore: string | null;
      unita: string | null;
      confidenza: number;
      pagina: number | null;
      estrattoDa: string | null;
      fonteLettura: FonteLettura;
      nota: string | null;
      avvisi: string[];
    },
  ) => {
    // La parola del cliente è definitiva in entrambi i sensi: né un valore
    // confermato né uno rifiutato vengono riscritti da una rilettura.
    const precedente = statoDi.get(`${riga}|${campo.chiave}`);
    if (precedente === "confermato" || precedente === "rifiutato") {
      preservati++;
      return;
    }
    const { error } = await admin.from("document_fields").upsert(
      {
        document_id: documentId,
        organization_id: organizationId,
        riga,
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
      { onConflict: "document_id,riga,campo" },
    );
    if (!error) scritti++;
  };

  if (esito.forma === "scheda") {
    for (const campo of esito.campi) await scrivi(0, campo);
  } else {
    // Una rilettura di tabella riparte pulita: le righe vecchie non
    // confermate spariscono, altrimenti una lettura che ne trova meno
    // lascerebbe in pagina righe fantasma della lettura precedente.
    await admin
      .from("document_fields")
      .delete()
      .eq("document_id", documentId)
      .gt("riga", 0);

    for (const riga of esito.righe) {
      for (const cella of riga.celle) {
        await scrivi(riga.indice, {
          chiave: cella.chiave,
          etichetta: cella.etichetta,
          valore: cella.valore,
          unita: cella.unita,
          confidenza: riga.confidenza,
          pagina: riga.pagina,
          estrattoDa: riga.estrattoDa,
          fonteLettura: riga.fonteLettura,
          nota: riga.nota,
          avvisi: riga.avvisi,
        });
      }
    }
  }

  // In pagina i due elenchi si mostrano insieme — al cliente serve sapere
  // tutto quello che va guardato — ma nel log restano distinti.
  const daDire = [...esito.avvisi, ...esito.avvertenze];
  await concludi(
    documentId,
    organizationId,
    "letto",
    daDire.length > 0 ? daDire.join(" ") : null,
    true,
  );

  const quanti =
    esito.forma === "scheda"
      ? esito.campi.filter((c) => c.valore !== null).length
      : esito.righe.length;
  return {
    ok: true,
    messaggio:
      esito.forma === "scheda"
        ? `Letti ${quanti} dati su ${esito.campi.length}. Controllali e confermali: finché non lo fai non entrano nei documenti.`
        : `Lette ${quanti} righe. Controllale e confermale: finché non lo fai non entrano nei documenti.`,
    scritti,
    preservati,
  };
}

/* ------------------------------------------------------------------ */

/**
 * Lo speso per ambito, in milionesimi di dollaro.
 *
 * «Pratica» oggi coincide col totale storico dell'organizzazione: una
 * pratica È il lavoro di un anno per un cliente, e finché un cliente ha
 * un anno di rendicontazione solo le due cose sono la stessa cosa. Quando
 * esisteranno percorsi pluriennali qui si aggiungerà il filtro sull'anno,
 * e il tetto resterà quello.
 */
async function spesa(organizationId: string): Promise<Record<Ambito, number>> {
  const admin = createAdminClient();
  const somma = (righe: { costo_micro: number | null }[] | null) =>
    (righe ?? []).reduce((t, r) => t + (r.costo_micro ?? 0), 0);

  const inizioMese = new Date();
  inizioMese.setUTCDate(1);
  inizioMese.setUTCHours(0, 0, 0, 0);
  const inizioGiorno = new Date();
  inizioGiorno.setUTCHours(0, 0, 0, 0);

  const [tutto, mese, giorno] = await Promise.all([
    admin
      .from("extractions")
      .select("costo_micro")
      .eq("organization_id", organizationId),
    admin
      .from("extractions")
      .select("costo_micro")
      .eq("organization_id", organizationId)
      .gte("created_at", inizioMese.toISOString()),
    admin
      .from("extractions")
      .select("costo_micro")
      .gte("created_at", inizioGiorno.toISOString()),
  ]);

  return {
    pratica: somma(tutto.data),
    organizzazione: somma(mese.data),
    giorno: somma(giorno.data),
  };
}

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
  voce: VoceLeggibile;
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
    avvisi: esito.esito === "ok" ? [...esito.avvisi, ...esito.avvertenze] : null,
    errore:
      esito.esito === "ok" ? null : "messaggio" in esito ? esito.messaggio : null,
    grezzo: esito.esito === "non_valido" ? (esito.grezzo as object) : null,
  });
}
