import "server-only";

import { createHash } from "node:crypto";

import { createAdminClient } from "@/lib/supabase/admin";
import { documentiAttivi } from "@/lib/bozza";
import { tipiRichiesti } from "@/lib/documenti";

import { eseguiTriage, leggiDocumento, type EsitoConUso } from "./chiamata";
import { voceLeggibile, type VoceLeggibile } from "./famiglie";
import { MESSAGGI_USO, statoUso } from "./fair-use";
import { serveRileggere } from "./riuso";
import {
  decidiTriage,
  serveTriage,
  type CategoriaParticolare,
} from "./triage";
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
  /** La lettura è stata accodata: arriverà, più tardi. */
  accodato?: boolean;
  /**
   * Il triage ha fermato tutto per dati particolari: il portale mostra
   * l'azione di rimozione a un clic, e nessun dato è stato letto.
   */
  datiParticolari?: CategoriaParticolare;
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
  /** La chiamata viene dalla coda: i limiti sono già stati guardati. */
  daCoda?: boolean;
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

  /* — 0bis. L'uso corretto: i gradini contrattuali (fair-use.ts) — */
  // Prima dei tetti tecnici, perché è la regola che il cliente CONOSCE:
  // sta scritta nelle condizioni di servizio, si conta in documenti e
  // non in valuta, e non blocca mai in silenzio.
  if (!opzioni.daCoda) {
    const uso = await usoCorrente(organizationId);
    if (uso.livello === "contatto") {
      // Non è un blocco: è un invito a parlare. Il documento resta in
      // coda, e quello che è già in corso continua.
      await concludi(documentId, organizationId, "in_coda", MESSAGGI_USO.contatto);
      return {
        ok: true,
        accodato: true,
        messaggio: MESSAGGI_USO.contatto ?? "",
        scritti: 0,
        preservati: 0,
      };
    }
    if (uso.livello === "differita") {
      await concludi(documentId, organizationId, "in_coda", MESSAGGI_USO.differita);
      return {
        ok: true,
        accodato: true,
        messaggio: MESSAGGI_USO.differita ?? "",
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

  const dati = new Uint8Array(await scaricato.data.arrayBuffer());

  /* — 3bis. Lo stesso file, già letto? (riuso del CONTENUTO) — */
  // Non il nome, non il percorso: l'impronta dei byte. Due copie dello
  // stesso PDF caricate con nomi diversi sono lo stesso lavoro, e
  // rifarlo è spendere due volte per lo stesso risultato. Il confronto
  // non attraversa MAI il confine fra due organizzazioni.
  const impronta = createHash("sha256").update(dati).digest("hex");
  await admin.from("documents").update({ impronta }).eq("id", documentId);

  if (!opzioni.forza) {
    const copiato = await copiaDaGemello(documentId, organizationId, impronta, voce.versione);
    if (copiato) {
      await concludi(documentId, organizationId, "letto", copiato.nota, true);
      return {
        ok: true,
        riusato: true,
        messaggio: copiato.messaggio,
        scritti: copiato.scritti,
        preservati: 0,
      };
    }
  }

  /* — 3ter. IL TRIAGE: si guarda che cos'è, prima di leggerlo — */
  const { data: prima } = await admin
    .from("documents")
    .select("triage_esito, triage_at")
    .eq("id", documentId)
    .maybeSingle();

  if (
    serveTriage({
      esito: prima?.triage_esito ?? null,
      quando: prima?.triage_at ? new Date(prima.triage_at) : null,
      documentoAggiornatoIl: documento?.updated_at
        ? new Date(documento.updated_at)
        : null,
    })
  ) {
    const fermato = await guarda({
      documentId,
      organizationId,
      dati,
      mime,
      voce,
    });
    if (fermato) return fermato;
  }

  const esito = await leggiDocumento({
    dati,
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
  // tutto quello che va guardato — ma nel log restano distinti. Le note
  // libere NO: quelle non sono cose da guardare, sono cose che il
  // cliente ha scritto, e vanno in una colonna loro.
  const daDire = [...esito.avvisi, ...esito.avvertenze];
  await concludi(
    documentId,
    organizationId,
    "letto",
    daDire.length > 0 ? daDire.join(" ") : null,
    true,
    esito.noteLibere.length > 0 ? esito.noteLibere : null,
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

/**
 * IL PRIMO SGUARDO, e le sue conseguenze.
 *
 * Restituisce un esito solo quando c'è da FERMARSI: `null` significa che
 * si può procedere con l'estrazione. Il triage che fallisce — rete,
 * quota, risposta storta — restituisce `null` anche lui: fermare un
 * cliente per un guasto nostro sarebbe fargli pagare due volte, e
 * l'estrazione ha comunque le sue difese.
 */
async function guarda(opzioni: {
  documentId: string;
  organizationId: string;
  dati: Uint8Array;
  mime: string;
  voce: VoceLeggibile;
}): Promise<EsitoLettura | null> {
  const { documentId, organizationId, dati, mime, voce } = opzioni;
  const admin = createAdminClient();

  // I tipi che servono davvero ai percorsi attivi: è la definizione di
  // «pertinente», e viene dal catalogo, non da un elenco a parte.
  const { data: moduli } = await admin
    .from("module_activations")
    .select("module")
    .eq("organization_id", organizationId)
    .in("stato", ["richiesto", "attivo", "in_attivazione"]);
  const attivi = documentiAttivi((moduli ?? []).map((m) => m.module));
  const tipiPertinenti = tipiRichiesti(attivi).map((r) => r.tipo.chiave);

  const sguardo = await eseguiTriage({ dati, mime, tipiPertinenti });

  await admin.from("extractions").insert({
    document_id: documentId,
    organization_id: organizationId,
    fase: "triage",
    famiglia: voce.famiglia,
    tipo: voce.tipo,
    versione_schema: "triage/1",
    modello: sguardo.uso?.modello ?? "n/d",
    esito: sguardo.ok ? "ok" : "errore",
    livello: "leggero",
    token_ingresso: sguardo.uso?.tokenIngresso ?? null,
    token_uscita: sguardo.uso?.tokenUscita ?? null,
    costo_micro: sguardo.uso?.costoMicro ?? null,
    durata_ms: sguardo.uso?.durataMs ?? null,
    // Del contenuto non resta niente: nel log c'è la DECISIONE, non il
    // documento. Nessun grezzo, nessun estratto, nessun riassunto.
    grezzo: null,
    errore: sguardo.ok ? null : sguardo.messaggio,
  });

  if (!sguardo.ok) return null;

  const decisione = decidiTriage(sguardo.triage, tipiPertinenti);

  const segna = async (
    esito: "non_pertinente" | "dati_particolari" | "illeggibile",
    stato: "non_pertinente" | "dati_particolari" | "illeggibile",
    messaggio: string,
    categoria?: CategoriaParticolare,
  ) => {
    await admin
      .from("documents")
      .update({
        stato,
        lettura_nota: messaggio,
        triage_esito: esito,
        triage_categoria: categoria ?? null,
        triage_at: new Date().toISOString(),
      })
      .eq("id", documentId)
      .eq("organization_id", organizationId);
  };

  if (decisione.azione === "dati-particolari") {
    await segna(
      "dati_particolari",
      "dati_particolari",
      decisione.messaggio,
      decisione.categoria,
    );
    return {
      ok: false,
      datiParticolari: decisione.categoria,
      messaggio: decisione.messaggio,
      scritti: 0,
      preservati: 0,
    };
  }

  if (decisione.azione === "non-pertinente") {
    await segna("non_pertinente", "non_pertinente", decisione.messaggio);
    return { ok: false, messaggio: decisione.messaggio, scritti: 0, preservati: 0 };
  }

  if (decisione.azione === "illeggibile") {
    await segna("illeggibile", "illeggibile", decisione.messaggio);
    return { ok: false, messaggio: decisione.messaggio, scritti: 0, preservati: 0 };
  }

  // Si procede: si registra che il triage è passato, così non si ripete.
  await admin
    .from("documents")
    .update({
      triage_esito: "procedi",
      triage_categoria: null,
      triage_at: new Date().toISOString(),
    })
    .eq("id", documentId)
    .eq("organization_id", organizationId);

  return null;
}

/**
 * Quanto ha elaborato un'organizzazione, e a che gradino la mette.
 *
 * I documenti si contano UNA VOLTA ciascuno, non una per lettura: una
 * rilettura non consuma dotazione, perché il cliente non ha portato un
 * documento nuovo. Le generazioni si conteranno quando la generazione
 * esisterà — oggi sono zero, e dirlo è più onesto che stimarle.
 */
export async function usoCorrente(organizationId: string) {
  const admin = createAdminClient();
  const [{ count: documenti }, { data: moduli }] = await Promise.all([
    admin
      .from("documents")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .in("stato", ["letto", "illeggibile"]),
    admin
      .from("module_activations")
      .select("module")
      .eq("organization_id", organizationId)
      .in("stato", ["richiesto", "attivo", "in_attivazione"]),
  ]);

  return statoUso(
    { documenti: documenti ?? 0, generazioni: 0 },
    (moduli ?? []).length,
  );
}

/**
 * Svuota la coda di un'organizzazione, un documento alla volta.
 *
 * «Bassa priorità» qui è letterale: si legge un documento per chiamata,
 * il più vecchio, e solo quando qualcuno sta guardando. Chi è dentro la
 * dotazione non passa mai di qui e non aspetta nessuno.
 */
export async function drenaCoda(organizationId: string): Promise<EsitoLettura | null> {
  const admin = createAdminClient();
  const { data: documento } = await admin
    .from("documents")
    .select("id, percorso, mime, tipo")
    .eq("organization_id", organizationId)
    .eq("stato", "in_coda")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (!documento) return null;

  const { data: org } = await admin
    .from("organizations")
    .select("anno_rendicontazione")
    .eq("id", organizationId)
    .maybeSingle();

  return eseguiLettura({
    documentId: documento.id,
    organizationId,
    percorso: documento.percorso,
    mime: documento.mime,
    tipo: documento.tipo ?? "",
    annoRendicontazione: org?.anno_rendicontazione ?? new Date().getFullYear() - 1,
    daCoda: true,
    forza: true,
  });
}

/**
 * Cerca un documento GEMELLO — stesso contenuto, stessa organizzazione,
 * già letto con lo stesso schema — e ne copia i valori.
 *
 * I valori copiati nascono `da_confermare` come tutti gli altri: il
 * fatto che il cliente abbia già confermato il gemello non vale per
 * questo, perché sono due documenti distinti nel suo archivio e potrebbe
 * volerli trattare in modo diverso. Si risparmia la lettura, non la
 * conferma.
 */
async function copiaDaGemello(
  documentId: string,
  organizationId: string,
  impronta: string,
  versioneSchema: string,
): Promise<{ scritti: number; messaggio: string; nota: string | null } | null> {
  const admin = createAdminClient();

  const { data: gemelli } = await admin
    .from("documents")
    .select("id, nome_file, lettura_nota")
    .eq("organization_id", organizationId)
    .eq("impronta", impronta)
    .eq("stato", "letto")
    .neq("id", documentId)
    .limit(5);
  if (!gemelli || gemelli.length === 0) return null;

  // Solo un gemello letto con LO STESSO SCHEMA: con uno schema diverso i
  // campi non corrisponderebbero, e copiarli sarebbe peggio che rileggere.
  for (const g of gemelli) {
    const { data: lettura } = await admin
      .from("extractions")
      .select("versione_schema")
      .eq("document_id", g.id)
      .eq("esito", "ok")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (lettura?.versione_schema !== versioneSchema) continue;

    const { data: campi } = await admin
      .from("document_fields")
      .select("*")
      .eq("document_id", g.id);
    if (!campi || campi.length === 0) continue;

    const righe = campi.map((c) => ({
      document_id: documentId,
      organization_id: organizationId,
      riga: c.riga,
      campo: c.campo,
      etichetta: c.etichetta,
      valore: c.valore,
      unita: c.unita,
      confidenza: c.confidenza,
      pagina: c.pagina,
      estratto_da: c.estratto_da,
      fonte_lettura: c.fonte_lettura,
      nota: c.nota,
      avvisi: c.avvisi,
      // Sempre da confermare: si risparmia la lettura, non il gesto.
      stato: "da_confermare" as const,
      confirmed_at: null,
    }));
    const { error } = await admin
      .from("document_fields")
      .upsert(righe, { onConflict: "document_id,riga,campo" });
    if (error) continue;

    return {
      scritti: righe.length,
      nota: g.lettura_nota,
      messaggio: `Questo file è identico a «${g.nome_file}», che avevamo già letto: ti riportiamo qui gli stessi dati, da confermare. Ogni elaborazione ha un costo energetico e non ha senso spenderlo due volte per lo stesso risultato.`,
    };
  }
  return null;
}

async function concludi(
  documentId: string,
  organizationId: string,
  stato: "smistato" | "letto" | "illeggibile" | "da_classificare" | "in_coda",
  nota: string | null,
  timbra = false,
  /** Le note scritte dal cliente sul documento: colonna loro. */
  noteLibere: string[] | null = null,
) {
  const admin = createAdminClient();
  await admin
    .from("documents")
    .update({
      stato,
      lettura_nota: nota,
      ...(noteLibere ? { note_libere: noteLibere } : {}),
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
    livello: esito.livello ?? null,
    escalato_da: esito.escalation?.da ?? null,
    escalato_perche: esito.escalation?.motivo ?? null,
    avvisi: esito.esito === "ok" ? [...esito.avvisi, ...esito.avvertenze] : null,
    errore:
      esito.esito === "ok" ? null : "messaggio" in esito ? esito.messaggio : null,
    grezzo: esito.esito === "non_valido" ? (esito.grezzo as object) : null,
  });
}
