import "server-only";

import { createHash, randomUUID } from "node:crypto";

import type { SupabaseClient } from "@supabase/supabase-js";

import { modelloElaborato, type ModelloElaborato } from "@/lib/elaborati";
import { decidiRigenerazione, improntaTesto, type Impronta } from "@/lib/motore/riuso";
import { statoVersioneDocumento } from "@/lib/norme";
import type { Database } from "@/types/database";

import { codiceDocumento, componiElaborato, riferimentiDi, type EsitoComposizione } from "./componi";
import { verificaConsegna, type EsitoConsegna } from "./consegna";
import type { Elaborato, VoceRevisione } from "./contenuto";
import { docxElaborato } from "./docx";
import { improntaElaborato } from "./impronta";
import type {
  CampoDocumentoIngresso,
  CampoImpresaIngresso,
  DocumentoIngresso,
  IngressoComposizione,
  OrganizzazioneIngresso,
} from "./ingresso";
import type { Mancanza } from "./mancanze";
import { pdfAnteprima, pdfElaborato } from "./pdf";
import { componiVeste, improntaVeste, type ImpostazioniMarchio } from "./veste";

/**
 * L'ARCHIVIO DEGLI ELABORATI — dove la composizione incontra la banca dati.
 *
 * Qui, e solo qui, si legge e si scrive: le funzioni di composizione,
 * controllo e impaginazione restano pure. Le letture passano dal client di
 * SESSIONE (la RLS decide che cosa si vede); le scritture — il file nel
 * bucket e la riga della versione — dal service role, dopo che la sessione
 * ha dimostrato di poter leggere quei dati. Una versione è un documento
 * consegnato: nessun browser deve poterne fabbricare una.
 *
 * ═══ SENZA MIGRAZIONE ═══
 * `20260915120000_elaborati_e_marchio.sql` non è ancora applicata al
 * remoto. Ogni lettura delle tabelle nuove riconosce l'errore di tabella
 * assente e restituisce `disponibile: false`: il portale mostra lo stesso
 * il controllo di consegna — che non ha bisogno di tabelle — e dice che la
 * generazione non è ancora attiva su questo ambiente. Mai un errore
 * generico al posto di una frase vera.
 */

type Db = SupabaseClient<Database>;

export const MESSAGGIO_NON_DISPONIBILE =
  "La generazione del documento finale non è ancora attiva su questo ambiente: il controllo qui sotto è già quello vero, e la bozza resta aggiornata.";

/**
 * La TABELLA non esiste: la migrazione non è applicata qui. Solo quel
 * caso — una colonna mancante o un altro errore «does not exist» sono
 * difetti veri, e scambiarli per «non ancora attivo» li nasconderebbe.
 */
export function tabellaAssente(errore: { code?: string; message?: string } | null | undefined): boolean {
  if (!errore) return false;
  return (
    errore.code === "42P01" ||
    errore.code === "PGRST205" ||
    /relation "[^"]+" does not exist|Could not find the table/i.test(errore.message ?? "")
  );
}

/** Una lettura fallita: il documento non si compone su dati a metà. */
export class LetturaIncompleta extends Error {}

/* ================================================================== */
/* Letture                                                             */
/* ================================================================== */

export type IngressiOrganizzazione = {
  campi: CampoImpresaIngresso[];
  documenti: DocumentoIngresso[];
  campiDocumento: CampoDocumentoIngresso[];
};

const PAGINA = 1000;

/**
 * TUTTE le righe di una lettura, a pagine, contate.
 *
 * Supabase restituisce al massimo un numero fisso di righe per richiesta
 * — mille, o meno se il progetto è configurato così — e non dà errore
 * quando tronca. Un registro carburanti settimanale di cinque mezzi supera
 * da solo le mille celle: senza paginare, i rifornimenti oltre la soglia
 * sparivano dal calcolo e il documento passava il controllo lo stesso.
 * Qui si chiede il conteggio esatto e si legge finché non torna; un errore
 * o un conteggio che non torna FERMA la composizione, invece di comporre
 * su dati a metà.
 */
export async function tutte<T>(
  pagina: (da: number, a: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null; count: number | null }>,
): Promise<T[]> {
  const righe: T[] = [];
  for (;;) {
    const { data, error, count } = await pagina(righe.length, righe.length + PAGINA - 1);
    if (error) throw new LetturaIncompleta(error.message);
    const blocco = data ?? [];
    righe.push(...blocco);
    if (count === null) throw new LetturaIncompleta("conteggio delle righe non disponibile");
    if (righe.length >= count) return righe;
    if (blocco.length === 0) throw new LetturaIncompleta(`lette ${righe.length} righe su ${count}`);
  }
}

/** Tutto ciò che la composizione può leggere di un'organizzazione, senza troncamenti. */
export async function leggiIngressi(db: Db, organizationId: string): Promise<IngressiOrganizzazione> {
  const [campi, documenti, campiDocumento] = await Promise.all([
    tutte((da, a) =>
      db
        .from("company_fields")
        .select("campo, valore, provenienza, fonte, fonte_url, stato, confirmed_at, updated_at", { count: "exact" })
        .eq("organization_id", organizationId)
        .order("campo")
        .range(da, a),
    ),
    tutte((da, a) =>
      db
        .from("documents")
        .select("id, nome_file, tipo, stato, letto_at, created_at, da_fotocamera", { count: "exact" })
        .eq("organization_id", organizationId)
        .order("id")
        .range(da, a),
    ),
    tutte((da, a) =>
      db
        .from("document_fields")
        .select(
          "document_id, riga, campo, etichetta, valore, unita, pagina, fonte_lettura, avvisi, stato, confirmed_at",
          { count: "exact" },
        )
        .eq("organization_id", organizationId)
        .order("document_id")
        .order("riga")
        .order("campo")
        // L'identificativo chiude l'ordinamento: a pagine, un ordine con
        // pari merito può restituire la stessa riga due volte e saltarne un'altra.
        .order("id")
        .range(da, a),
    ),
  ]);
  return {
    campi: campi as CampoImpresaIngresso[],
    documenti: documenti as DocumentoIngresso[],
    campiDocumento: campiDocumento.map((c) => ({ ...c, avvisi: c.avvisi ?? [] })) as CampoDocumentoIngresso[],
  };
}

export async function leggiMarchio(
  db: Db,
  organizationId: string,
): Promise<{ impostazioni: ImpostazioniMarchio | null; esitoLogo: { tono: string; testo: string }[] | null; disponibile: boolean }> {
  const { data, error } = await db
    .from("brand_settings")
    .select("*")
    .eq("organization_id", organizationId)
    .maybeSingle();
  if (tabellaAssente(error)) return { impostazioni: null, esitoLogo: null, disponibile: false };
  if (!data) return { impostazioni: null, esitoLogo: null, disponibile: true };
  return {
    impostazioni: {
      logo_percorso: data.logo_percorso,
      logo_larghezza: data.logo_larghezza,
      logo_altezza: data.logo_altezza,
      logo_vettoriale: data.logo_vettoriale,
      colore_accento: data.colore_accento,
      nome_intestazione: data.nome_intestazione,
      indirizzo: data.indirizzo,
      sito: data.sito,
      contatto: data.contatto,
      updated_at: data.updated_at,
    },
    esitoLogo: data.logo_esito,
    disponibile: true,
  };
}

/** Il PNG del logo, dal bucket privato. Null se non c'è o non si scarica. */
export async function leggiLogo(db: Db, percorso: string | null | undefined): Promise<Uint8Array | null> {
  if (!percorso) return null;
  const { data } = await db.storage.from("marchi").download(percorso);
  if (!data) return null;
  return new Uint8Array(await data.arrayBuffer());
}

export type VersioneArchivio = Database["public"]["Tables"]["elaborati_versioni"]["Row"];

export async function leggiVersioni(
  db: Db,
  organizationId: string,
): Promise<{ versioni: VersioneArchivio[]; disponibile: boolean }> {
  const prova = await db.from("elaborati_versioni").select("id").eq("organization_id", organizationId).limit(1);
  if (tabellaAssente(prova.error)) return { versioni: [], disponibile: false };
  const versioni = await tutte((da, a) =>
    db
      .from("elaborati_versioni")
      .select(
        "id, organization_id, percorso, modello, documento, esercizio, revisione, codice, motivo, cambiato, standard, versione_standard, designazione_standard, impronta, impronta_testo, stato_validazione, validata_da, validata_qualifica, validata_il, rilievi, valida_revisione, pdf_percorso, pdf_byte, pdf_pagine, pdf_sha256, docx_percorso, docx_byte, docx_sha256, generata_da, created_at",
        { count: "exact" },
      )
      .eq("organization_id", organizationId)
      .order("revisione", { ascending: false })
      .order("id")
      .range(da, a),
  );
  return { versioni: versioni as VersioneArchivio[], disponibile: true };
}

/* ================================================================== */
/* Lo stato di un documento: composizione, controllo, riuso            */
/* ================================================================== */

export type StatoDocumento = {
  modello: ModelloElaborato;
  ingresso: IngressoComposizione;
  composizione: EsitoComposizione;
  consegna: EsitoConsegna;
  impronta: Impronta;
  /** Le versioni di QUESTO documento per QUESTO esercizio, dalla più recente. */
  versioni: VersioneArchivio[];
  /** Che cosa è cambiato dall'ultima versione. Vuoto: nulla, oppure nessuna versione. */
  cambiato: string[];
  /** L'ultima versione è costruita su una versione dello standard superata per il suo esercizio. */
  superata: string | null;
};

const revisioneDi = (v: VersioneArchivio): VoceRevisione => ({
  numero: v.revisione,
  data: v.created_at,
  motivo: v.motivo,
  ...(v.designazione_standard ? { versioneStandard: v.designazione_standard } : {}),
  validazione: v.stato_validazione,
});

/**
 * Compone il documento di un percorso con i dati di adesso e dice a che
 * punto è: consegnabile o no, con che cosa manca, e che cosa è cambiato
 * rispetto all'ultima versione. È pura rispetto alla banca dati: riceve
 * righe già lette.
 */
export function statoDocumento(dati: {
  chiaveModello: string;
  opzioni: string[];
  percorso: string;
  organizzazione: OrganizzazioneIngresso;
  ingressi: IngressiOrganizzazione;
  impostazioni: ImpostazioniMarchio | null;
  versioni: VersioneArchivio[];
  adesso?: Date;
}): StatoDocumento | null {
  const esercizio = dati.organizzazione.anno_rendicontazione;
  const modello = modelloElaborato(dati.chiaveModello, esercizio);
  if (!modello) return null;
  const versioni = dati.versioni
    .filter((v) => v.modello === modello.chiave && v.esercizio === esercizio)
    .sort((a, b) => b.revisione - a.revisione);
  const ultima = versioni[0];
  const numero = ultima ? ultima.revisione + 1 : 0;

  const ingresso: IngressoComposizione = {
    modello,
    opzioni: dati.opzioni,
    percorso: dati.percorso,
    organizzazione: dati.organizzazione,
    campi: dati.ingressi.campi,
    documenti: dati.ingressi.documenti,
    campiDocumento: dati.ingressi.campiDocumento,
    revisione: {
      numero,
      data: (dati.adesso ?? new Date()).toISOString(),
      motivo: ultima ? "Nuova revisione" : "Prima emissione",
    },
    validazione: { stato: "in_attesa" },
    revisioniPrecedenti: [...versioni].reverse().map(revisioneDi),
  };
  const composizione = componiElaborato(ingresso);
  const consegna = verificaConsegna(composizione.elaborato, {
    modello,
    opzioni: dati.opzioni,
    mancanzeComposizione: composizione.mancanze,
    esercizio,
  });
  const impronta = improntaElaborato(ingresso, composizione, improntaVeste(dati.impostazioni));

  const decisione = ultima
    ? decidiRigenerazione({
        adesso: impronta,
        ultima: ultima.impronta as Impronta,
        ultimaIl: new Date(ultima.created_at),
        versioniNellUltimaOra: 0,
        ora: dati.adesso ?? new Date(),
      })
    : null;

  let superata: string | null = null;
  if (ultima?.standard) {
    const esito = statoVersioneDocumento(ultima.standard, ultima.versione_standard ?? undefined, ultima.esercizio);
    if (esito.superata) superata = esito.messaggio ?? "La versione dello standard non è più quella applicabile.";
  }

  return {
    modello,
    ingresso,
    composizione,
    consegna,
    impronta,
    versioni,
    cambiato: decisione?.azione === "rigenera" ? decisione.cambiato : [],
    superata,
  };
}

/* ================================================================== */
/* La generazione                                                      */
/* ================================================================== */

export type VersioneBreve = {
  id: string;
  revisione: number;
  codice: string;
  data: string;
  pagine: number;
  docx: boolean;
};

export type EsitoGenerazione =
  | { esito: "non-disponibile"; messaggio: string }
  | { esito: "mancanze"; mancanze: Mancanza[] }
  | { esito: "riuso"; messaggio: string; versione: VersioneBreve }
  | { esito: "generata"; versione: VersioneBreve; cambiato: string[]; avviso?: string }
  | { esito: "errore"; messaggio: string };

const sha256 = (b: Uint8Array) => createHash("sha256").update(b).digest("hex");

const breve = (v: Pick<VersioneArchivio, "id" | "revisione" | "codice" | "created_at" | "pdf_pagine" | "docx_percorso">): VersioneBreve => ({
  id: v.id,
  revisione: v.revisione,
  codice: v.codice,
  data: v.created_at,
  pagine: v.pdf_pagine,
  docx: Boolean(v.docx_percorso),
});

/**
 * Genera una versione — o riapre quella che c'è, se nulla è cambiato.
 *
 * L'ordine dei passi è quello di `docs/motore.md` §5 e §7bis:
 *   1. si compone con i dati di adesso;
 *   2. il controllo di consegna decide — se manca qualcosa ci si ferma qui,
 *      e il cliente riceve l'elenco;
 *   3. l'impronta decide se c'è lavoro da fare: identica all'ultima versione
 *      → si riapre quella, con la frase del riuso e il modo di generare
 *      comunque accanto;
 *   4. si impagina (PDF sempre, DOCX se il modello lo dichiara), si salvano
 *      i file, si registra la versione.
 */
export async function generaVersione(dati: {
  sessione: Db;
  servizio: Db;
  utenteId: string;
  organizzazione: OrganizzazioneIngresso;
  percorso: string;
  chiaveModello: string;
  opzioni: string[];
  forza: boolean;
  adesso?: Date;
}): Promise<EsitoGenerazione> {
  const { sessione, servizio, organizzazione } = dati;
  let letture: [Awaited<ReturnType<typeof leggiVersioni>>, Awaited<ReturnType<typeof leggiMarchio>>, IngressiOrganizzazione];
  try {
    letture = await Promise.all([
      leggiVersioni(sessione, organizzazione.id),
      leggiMarchio(sessione, organizzazione.id),
      leggiIngressi(sessione, organizzazione.id),
    ]);
  } catch {
    return { esito: "errore", messaggio: "Non siamo riusciti a leggere tutti i dati del documento: nessuna versione è stata generata. Riprova tra poco." };
  }
  const [{ versioni, disponibile }, marchio, ingressi] = letture;
  if (!disponibile || !marchio.disponibile) {
    return { esito: "non-disponibile", messaggio: MESSAGGIO_NON_DISPONIBILE };
  }

  const stato = statoDocumento({
    chiaveModello: dati.chiaveModello,
    opzioni: dati.opzioni,
    percorso: dati.percorso,
    organizzazione,
    ingressi,
    impostazioni: marchio.impostazioni,
    versioni,
    adesso: dati.adesso,
  });
  if (!stato) return { esito: "errore", messaggio: "Questo percorso non ha un modello di documento." };
  if (!stato.consegna.consegnabile) return { esito: "mancanze", mancanze: stato.consegna.mancanze };

  const ultima = stato.versioni[0];
  const ora = dati.adesso ?? new Date();
  const decisione: ReturnType<typeof decidiRigenerazione> = ultima
    ? decidiRigenerazione({
        adesso: stato.impronta,
        ultima: ultima.impronta as Impronta,
        ultimaIl: new Date(ultima.created_at),
        versioniNellUltimaOra: stato.versioni.filter((v) => ora.getTime() - new Date(v.created_at).getTime() < 3_600_000).length,
        ora,
      })
    : { azione: "rigenera", cambiato: [] };

  if (decisione.azione === "riusa" && !dati.forza && ultima) {
    return { esito: "riuso", messaggio: decisione.messaggio, versione: breve(ultima) };
  }

  const cambiato = decisione.azione === "rigenera" ? decisione.cambiato : [];
  const motivo = !ultima
    ? "Prima emissione"
    : cambiato.length > 0
      ? `Nuova revisione: ${cambiato.join("; ")}`
      : "Nuova revisione richiesta dall'organizzazione, senza variazioni negli ingressi";

  // Il motivo vero entra nel registro delle revisioni del documento stesso.
  const composto = stato.consegna.elaborato;
  const elaborato: Elaborato = {
    ...composto,
    revisione: { ...composto.revisione, motivo },
    revisioni: composto.revisioni.map((r) =>
      r.numero === composto.revisione.numero ? { ...r, motivo } : r,
    ),
  };
  const ricontrollo = verificaConsegna(elaborato, {
    modello: stato.modello,
    opzioni: dati.opzioni,
    mancanzeComposizione: stato.composizione.mancanze,
    esercizio: organizzazione.anno_rendicontazione,
  });
  if (!ricontrollo.consegnabile) return { esito: "mancanze", mancanze: ricontrollo.mancanze };

  return archiviaVersione({
    servizio,
    sessione,
    utenteId: dati.utenteId,
    organizzazione,
    percorso: dati.percorso,
    modello: stato.modello,
    elaborato: ricontrollo.elaborato,
    impostazioni: marchio.impostazioni,
    impronta: stato.impronta,
    motivo,
    cambiato,
    avviso: decisione.azione === "rigenera" && "avviso" in decisione ? (decisione.avviso as string) : undefined,
    validaRevisione: null,
    validazione: null,
  });
}

async function archiviaVersione(dati: {
  servizio: Db;
  sessione: Db;
  utenteId: string | null;
  organizzazione: OrganizzazioneIngresso;
  percorso: string;
  modello: ModelloElaborato;
  elaborato: import("./consegna").ElaboratoConsegnabile;
  impostazioni: ImpostazioniMarchio | null;
  impronta: Impronta;
  motivo: string;
  cambiato: string[];
  avviso?: string;
  validaRevisione: string | null;
  validazione: { da: string; qualifica: string; il: string; rilievi: string[] } | null;
}): Promise<EsitoGenerazione> {
  const { servizio, organizzazione, modello, elaborato } = dati;
  const logo = await leggiLogo(dati.sessione, dati.impostazioni?.logo_percorso);
  // Un logo impostato che non si scarica non si sostituisce in silenzio
  // con la veste neutra: il documento uscirebbe diverso da quello che
  // l'impronta dichiara, e alla prossima richiesta verrebbe riaperto come
  // «nulla è cambiato».
  if (dati.impostazioni?.logo_percorso && !logo) {
    return {
      esito: "errore",
      messaggio: "Non riusciamo a leggere il logo impostato nella veste dei documenti: riprova tra poco, oppure toglilo dalle impostazioni.",
    };
  }
  const veste = componiVeste({
    ragioneSociale: elaborato.frontespizio.organizzazione,
    impostazioni: dati.impostazioni,
    logoPng: logo,
  });

  const pdf = await pdfElaborato(elaborato, veste);
  const docx = elaborato.formati.includes("docx") ? await docxElaborato(elaborato, veste) : null;

  // L'identificativo della versione nasce qui ed entra nel nome dei file:
  // se una generazione si interrompe fra il caricamento e la registrazione,
  // il file rimasto non blocca per sempre il numero di revisione — a
  // decidere le corse è il vincolo di unicità della tabella, non il bucket.
  const id = randomUUID();
  const base = `${organizzazione.id}/${modello.chiave}/${elaborato.frontespizio.esercizio}/${elaborato.frontespizio.codice}-${id}`;
  const caricaPdf = await servizio.storage
    .from("elaborati")
    .upload(`${base}.pdf`, pdf.byte, { contentType: "application/pdf", upsert: false });
  if (caricaPdf.error) {
    return {
      esito: "errore",
      messaggio: /exists|duplicate/i.test(caricaPdf.error.message)
        ? "Un'altra generazione di questo documento è appena partita: ricarica la pagina e riprova."
        : "Non siamo riusciti a salvare il documento generato: riprova tra poco.",
    };
  }
  if (docx) {
    const caricaDocx = await servizio.storage.from("elaborati").upload(`${base}.docx`, docx.byte, {
      contentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      upsert: false,
    });
    if (caricaDocx.error) {
      await servizio.storage.from("elaborati").remove([`${base}.pdf`]);
      return { esito: "errore", messaggio: "Non siamo riusciti a salvare il documento generato: riprova tra poco." };
    }
  }

  const { data, error } = await servizio
    .from("elaborati_versioni")
    .insert({
      id,
      organization_id: organizzazione.id,
      percorso: dati.percorso,
      modello: modello.chiave,
      documento: modello.documento,
      esercizio: elaborato.frontespizio.esercizio,
      revisione: elaborato.revisione.numero,
      codice: elaborato.frontespizio.codice,
      motivo: dati.motivo,
      cambiato: dati.cambiato,
      standard: modello.standard ?? null,
      versione_standard: modello.versione ?? null,
      designazione_standard: elaborato.frontespizio.costruitoSu ?? null,
      riferimenti: elaborato.riferimenti,
      fonti: elaborato.fonti,
      contenuto: elaborato,
      impronta: dati.impronta,
      impronta_testo: improntaTesto(dati.impronta),
      veste: { impostazioni: dati.impostazioni, colori: veste.colori, avvisi: veste.avvisi },
      stato_validazione: dati.validazione ? "validata" : "in_attesa",
      validata_da: dati.validazione?.da ?? null,
      validata_qualifica: dati.validazione?.qualifica ?? null,
      validata_il: dati.validazione?.il ?? null,
      rilievi: dati.validazione?.rilievi ?? null,
      valida_revisione: dati.validaRevisione,
      pdf_percorso: `${base}.pdf`,
      pdf_byte: pdf.byte.byteLength,
      pdf_pagine: pdf.pagine,
      pdf_sha256: sha256(pdf.byte),
      docx_percorso: docx ? `${base}.docx` : null,
      docx_byte: docx ? docx.byte.byteLength : null,
      docx_sha256: docx ? sha256(docx.byte) : null,
      generata_da: dati.utenteId,
    })
    .select("id, revisione, codice, created_at, pdf_pagine, docx_percorso")
    .single();

  if (error || !data) {
    // La risposta può perdersi DOPO che la riga è stata scritta: prima di
    // togliere i file si guarda se la versione esiste. Cancellarli sotto una
    // versione registrata lascerebbe un documento consegnato senza file.
    const { data: registrata } = await servizio
      .from("elaborati_versioni")
      .select("id, revisione, codice, created_at, pdf_pagine, docx_percorso")
      .eq("id", id)
      .maybeSingle();
    if (registrata) {
      return {
        esito: "generata",
        versione: breve(registrata),
        cambiato: dati.cambiato,
        ...(dati.avviso ? { avviso: dati.avviso } : {}),
      };
    }
    await servizio.storage.from("elaborati").remove([`${base}.pdf`, ...(docx ? [`${base}.docx`] : [])]);
    return {
      esito: "errore",
      messaggio:
        error?.code === "23505"
          ? "Un'altra generazione di questo documento è appena partita: ricarica la pagina e riprova."
          : "Non siamo riusciti a registrare la versione: riprova tra poco.",
    };
  }

  return {
    esito: "generata",
    versione: breve(data),
    cambiato: dati.cambiato,
    ...(dati.avviso ? { avviso: dati.avviso } : {}),
  };
}

/* ================================================================== */
/* L'anteprima e la validazione                                        */
/* ================================================================== */

/** L'anteprima della veste di un documento: copertina e prima sezione, mai archiviata. */
export async function anteprimaDocumento(dati: {
  sessione: Db;
  organizzazione: OrganizzazioneIngresso;
  percorso: string;
  chiaveModello: string;
  opzioni: string[];
  /** Impostazioni da provare prima di salvarle; assenti = quelle salvate. */
  impostazioni?: ImpostazioniMarchio | null;
}): Promise<Uint8Array | null> {
  let letture: [IngressiOrganizzazione, Awaited<ReturnType<typeof leggiMarchio>>, Awaited<ReturnType<typeof leggiVersioni>>];
  try {
    letture = await Promise.all([
      leggiIngressi(dati.sessione, dati.organizzazione.id),
      leggiMarchio(dati.sessione, dati.organizzazione.id),
      leggiVersioni(dati.sessione, dati.organizzazione.id),
    ]);
  } catch {
    return null;
  }
  const [ingressi, marchio, { versioni }] = letture;
  const impostazioni = dati.impostazioni === undefined ? marchio.impostazioni : dati.impostazioni;
  const stato = statoDocumento({
    chiaveModello: dati.chiaveModello,
    opzioni: dati.opzioni,
    percorso: dati.percorso,
    organizzazione: dati.organizzazione,
    ingressi,
    impostazioni,
    versioni,
  });
  if (!stato) return null;
  const logo = await leggiLogo(dati.sessione, impostazioni?.logo_percorso);
  // Un'anteprima senza il logo impostato mostrerebbe una veste che il
  // documento non avrà: meglio nessuna anteprima e un messaggio.
  if (impostazioni?.logo_percorso && !logo) return null;
  const veste = componiVeste({
    ragioneSociale: stato.composizione.elaborato.frontespizio.organizzazione,
    impostazioni,
    logoPng: logo,
  });
  const { byte } = await pdfAnteprima(stato.composizione.elaborato, veste);
  return byte;
}

/**
 * LA VALIDAZIONE PROFESSIONALE — una revisione nuova, non una modifica.
 *
 * Chi valida (un amministratore, verificato da chi chiama) registra nome,
 * qualifica e rilievi; si emette la revisione successiva con lo STESSO
 * contenuto della revisione validata — quello salvato, non ricomposto dai
 * dati di oggi — e la pagina di validazione compilata. Il controllo di
 * consegna gira di nuovo: una norma ritirata nel frattempo non diventa
 * accettabile perché un professionista ha validato il documento prima.
 */
export async function registraValidazione(dati: {
  servizio: Db;
  amministratoreId: string;
  versioneId: string;
  professionista: string;
  qualifica: string;
  rilievi: string[];
  adesso?: Date;
}): Promise<EsitoGenerazione> {
  const { servizio } = dati;
  const { data: versione, error } = await servizio
    .from("elaborati_versioni")
    .select("*")
    .eq("id", dati.versioneId)
    .maybeSingle();
  if (tabellaAssente(error)) return { esito: "non-disponibile", messaggio: MESSAGGIO_NON_DISPONIBILE };
  if (!versione) return { esito: "errore", messaggio: "Versione non trovata." };
  if (versione.stato_validazione === "validata") {
    return { esito: "errore", messaggio: "Questa revisione è già una revisione validata." };
  }

  const { data: successive } = await servizio
    .from("elaborati_versioni")
    .select("revisione, created_at, motivo, designazione_standard, stato_validazione")
    .eq("organization_id", versione.organization_id)
    .eq("modello", versione.modello)
    .eq("esercizio", versione.esercizio)
    .order("revisione", { ascending: true });
  const tutte = successive ?? [];
  if (tutte.some((v) => v.revisione > versione.revisione)) {
    return {
      esito: "errore",
      messaggio: "Esiste una revisione più recente di questo documento: si valida l'ultima emessa.",
    };
  }

  const { data: org } = await servizio
    .from("organizations")
    .select("id, ragione_sociale, partita_iva, anno_rendicontazione, sito_web, created_at")
    .eq("id", versione.organization_id)
    .single();
  if (!org) return { esito: "errore", messaggio: "Organizzazione non trovata." };

  const modello = modelloElaborato(versione.modello, versione.esercizio);
  if (!modello) return { esito: "errore", messaggio: "Il modello di questo documento non esiste più." };

  const ora = (dati.adesso ?? new Date()).toISOString();
  const numero = versione.revisione + 1;
  const motivo = `Validazione professionale della revisione ${versione.revisione}`;
  const originale = versione.contenuto as Elaborato;
  const voce: VoceRevisione = {
    numero,
    data: ora,
    motivo,
    ...(versione.designazione_standard ? { versioneStandard: versione.designazione_standard } : {}),
    validazione: "validata",
  };
  const elaborato: Elaborato = {
    ...originale,
    frontespizio: {
      ...originale.frontespizio,
      codice: codiceDocumento(modello, org.id, versione.esercizio, numero),
    },
    // I riferimenti si rileggono dal registro di OGGI: la revisione validata
    // si emette adesso, e uno standard superato dopo la generazione non
    // deve passare perché lo stato copiato allora diceva «in vigore».
    riferimenti: riferimentiDi(modello, versione.esercizio),
    revisione: voce,
    validazione: {
      stato: "validata",
      professionista: dati.professionista,
      qualifica: dati.qualifica,
      il: ora,
      rilievi: dati.rilievi,
    },
    revisioni: [
      ...tutte.map((v) => ({
        numero: v.revisione,
        data: v.created_at,
        motivo: v.motivo,
        ...(v.designazione_standard ? { versioneStandard: v.designazione_standard } : {}),
        validazione: v.stato_validazione,
      })),
      voce,
    ],
  };

  const controllo = verificaConsegna(elaborato, {
    modello,
    opzioni: [],
    mancanzeComposizione: [],
    esercizio: versione.esercizio,
  });
  if (!controllo.consegnabile) return { esito: "mancanze", mancanze: controllo.mancanze };

  const vesteSalvata = (versione.veste ?? {}) as { impostazioni?: ImpostazioniMarchio | null };
  return archiviaVersione({
    servizio,
    sessione: servizio,
    utenteId: dati.amministratoreId,
    organizzazione: org as OrganizzazioneIngresso,
    percorso: versione.percorso,
    modello,
    elaborato: controllo.elaborato,
    impostazioni: vesteSalvata.impostazioni ?? null,
    impronta: versione.impronta as Impronta,
    motivo,
    cambiato: [],
    validaRevisione: versione.id,
    validazione: { da: dati.professionista, qualifica: dati.qualifica, il: ora, rilievi: dati.rilievi },
  });
}
