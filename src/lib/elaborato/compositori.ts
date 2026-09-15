import { tipoDocumento } from "@/lib/documenti";
import { dataValida } from "@/lib/motore/plausibilita";
import { cellaCalcolata, cellaScrittaDalCliente, formattaValore } from "@/lib/motore/portale";
import { dodiciMesiDi, periodoEsteso } from "@/lib/periodo";

import type { Blocco, Cella, Valore } from "./contenuto";
import { DATA_LUNGA, type RegistroFonti } from "./fonti";
import type {
  CampoDocumentoIngresso,
  CampoImpresaIngresso,
  DocumentoIngresso,
  IngressoComposizione,
} from "./ingresso";
import type { Mancanza } from "./mancanze";

/**
 * I COMPOSITORI — il pezzo di codice che sa leggere un dato.
 *
 * ═══ LA STESSA SEPARAZIONE DEI BINDING ═══
 * Il modello (`src/lib/elaborati.ts`) dice che la sezione «Anagrafica» si
 * compone col blocco `anagrafica`; qui c'è che cosa significa. Il modello
 * è dato e non sa leggere una bolletta; il compositore è codice e non sa
 * in quale elaborato finirà né in che ordine. Il costruttore del documento
 * (`componi.ts`) non conosce nessuno dei due domini: prende la chiave dal
 * modello e chiama la funzione registrata.
 *
 * ═══ UN COMPOSITORE NON INVENTA E NON TACE ═══
 * Usa SOLO valori confermati. Quando un valore c'è ma aspetta la conferma,
 * non lo usa e lo DICE come mancanza, con il posto dove confermarlo: la
 * sezione che resta vuota in silenzio è il modo in cui un cliente scopre
 * in audit che il documento era incompleto.
 */

export type LetturaDocumento = {
  documento: DocumentoIngresso;
  /** Riga 0: i campi della scheda, confermati, per chiave. */
  scheda: Map<string, CampoDocumentoIngresso>;
  /** Le righe di tabella in cui OGNI cella piena è confermata. */
  righe: { riga: number; celle: Map<string, CampoDocumentoIngresso> }[];
  /** Valori (scheda) e righe (tabella) che aspettano ancora il cliente. */
  daConfermare: number;
};

export type ContestoComposizione = {
  ingresso: IngressoComposizione;
  esercizio: number;
  fonti: RegistroFonti;
  /** La sezione in composizione: le mancanze la citano. */
  sezione: string;
  /** Scioglie i segnaposto del modello. */
  testo: (t: string) => string;
  /** Risultati condivisi fra compositori della stessa composizione (un calcolo si fa una volta). */
  memoria: Map<string, unknown>;
};

export type EsitoCompositore = {
  blocchi: Blocco[];
  mancanze: Mancanza[];
  /** Il compositore ha trovato ciò che serve alla sezione. */
  piena: boolean;
};

export type Compositore = {
  /** I tipi di documento che legge: entrano nell'impronta del documento. */
  tipi: string[] | ((parametri: Record<string, unknown>) => string[]);
  componi: (
    ctx: ContestoComposizione,
    parametri: Record<string, unknown>,
  ) => EsitoCompositore;
};

export function tipiLetti(c: Compositore, parametri: Record<string, unknown> = {}): string[] {
  return typeof c.tipi === "function" ? c.tipi(parametri) : c.tipi;
}

/* ================================================================== */
/* Leggere la scheda impresa                                           */
/* ================================================================== */

const HREF_IMPRESA = "/dashboard/impresa";
const HREF_DOCUMENTI = "/dashboard/documenti";

/** Come si presenta una banca dati nel registro delle fonti. */
function bancaDati(fonte: string): { titolo: string; url?: string } {
  const f = fonte.trim();
  if (/^vies$/i.test(f)) {
    return {
      titolo: "VIES — sistema della Commissione europea per la verifica delle partite IVA",
      url: "https://ec.europa.eu/taxation_customs/vies/",
    };
  }
  if (/^istat/i.test(f)) {
    return { titolo: `ISTAT — classificazione delle attività economiche (${f.replace(/^ISTAT\s*·?\s*/i, "")})` };
  }
  if (/registro imprese|infocamere|camerale/i.test(f)) {
    return { titolo: "Registro Imprese — visura camerale" };
  }
  if (/ini-?pec/i.test(f)) return { titolo: "INI-PEC — indice nazionale degli indirizzi PEC" };
  if (/accredia/i.test(f)) return { titolo: "ACCREDIA — banca dati delle certificazioni accreditate" };
  if (/agenzia/i.test(f)) return { titolo: "Agenzia delle Entrate — anagrafe tributaria" };
  return { titolo: f };
}

const ETICHETTA_CAMPO: Record<string, string> = {
  ragione_sociale: "Denominazione",
  partita_iva: "Partita IVA",
  forma_giuridica: "Forma giuridica",
  ateco: "Attività (ATECO)",
  sede_legale: "Sede legale",
  unita_locali: "Unità locali",
  pec: "PEC",
  sito_web: "Sito ufficiale",
  dipendenti: "Addetti",
  capitale_sociale: "Capitale sociale",
  descrizione_attivita: "Attività",
  prodotti_servizi: "Prodotti e servizi",
  sedi_operative: "Sedi e stabilimenti",
  mercati: "Mercati",
  certificazioni_esposte: "Certificazioni dichiarate",
  policy_pubblicate: "Politiche pubblicate",
};

export type EsitoCampo =
  | { stato: "confermato"; valore: string; fonte: string }
  | { stato: "da_confermare" | "assente" };

/**
 * Il valore CONFERMATO di un campo della scheda impresa, con la sigla
 * della sua fonte già registrata.
 *
 * I dati della registrazione (`organizations`) valgono come inseriti
 * dall'impresa e fanno da base finché la scheda non li sostituisce — la
 * stessa regola di `componiScheda` in `src/lib/impresa.ts`. Un campo
 * RIFIUTATO dal cliente non torna a galla dalla base: se ha rifiutato la
 * denominazione proposta dal VIES, vale quella che ha scritto lui.
 */
export function campoScheda(ctx: ContestoComposizione, chiave: string): EsitoCampo {
  const { ingresso, fonti } = ctx;
  const riga: CampoImpresaIngresso | undefined = ingresso.campi.find(
    (c) => c.campo === chiave && c.valore !== null && c.valore.trim() !== "",
  );
  const etichetta = ETICHETTA_CAMPO[chiave] ?? chiave;

  if (riga && riga.stato === "da_confermare") return { stato: "da_confermare" };

  if (riga && riga.stato === "confermato" && riga.valore) {
    if (riga.provenienza === "utente") {
      const id = fonti.registra("inserito:scheda", () => ({
        tipo: "inserito",
        titolo: "Scheda impresa compilata dall'organizzazione nel portale",
        dettaglio: [],
        confermata: true,
      }));
      aggiungiCampo(fonti, id, etichetta);
      fonti.conferma(id, riga.confirmed_at ?? riga.updated_at ?? null);
      return { stato: "confermato", valore: riga.valore, fonte: id };
    }
    // Dal Motore: una banca dati, oppure il sito ufficiale dell'impresa —
    // che è un documento DELL'IMPRESA, pubblicato da lei, e come tale si
    // cita, con l'indirizzo della pagina.
    const sito = /sito ufficiale/i.test(riga.fonte ?? "");
    if (sito) {
      const url = riga.fonte_url ?? undefined;
      const id = fonti.registra(`sito:${url ?? "senza-indirizzo"}`, () => ({
        tipo: "documento",
        titolo: "Sito ufficiale dell'organizzazione",
        dettaglio: [],
        ...(url ? { url } : {}),
        confermata: true,
      }));
      aggiungiCampo(fonti, id, etichetta);
      fonti.conferma(id, riga.confirmed_at);
      return { stato: "confermato", valore: riga.valore, fonte: id };
    }
    const banca = bancaDati(riga.fonte ?? "banca dati");
    const id = fonti.registra(`banca:${banca.titolo}`, () => ({
      tipo: "banca-dati",
      titolo: banca.titolo,
      dettaglio: [],
      ...(banca.url ? { url: banca.url } : {}),
      confermata: true,
    }));
    aggiungiCampo(fonti, id, etichetta);
    fonti.conferma(id, riga.confirmed_at);
    return { stato: "confermato", valore: riga.valore, fonte: id };
  }

  const rifiutato = ingresso.campi.some((c) => c.campo === chiave && c.stato === "rifiutato");
  const base = valoreDiRegistrazione(ctx, chiave);
  if (base && !(rifiutato && chiave !== "ragione_sociale" && chiave !== "partita_iva")) {
    return base;
  }
  return { stato: "assente" };
}

function valoreDiRegistrazione(ctx: ContestoComposizione, chiave: string): EsitoCampo | null {
  const org = ctx.ingresso.organizzazione;
  const valore =
    chiave === "ragione_sociale"
      ? org.ragione_sociale
      : chiave === "partita_iva"
        ? org.partita_iva
        : chiave === "sito_web"
          ? (org.sito_web ?? null)
          : null;
  if (!valore) return null;
  const id = ctx.fonti.registra("inserito:registrazione", () => ({
    tipo: "inserito",
    titolo: "Dati inseriti dall'organizzazione alla registrazione",
    dettaglio: [],
    confermata: true,
  }));
  aggiungiCampo(ctx.fonti, id, ETICHETTA_CAMPO[chiave] ?? chiave);
  ctx.fonti.conferma(id, org.created_at ?? "1970-01-01");
  return { stato: "confermato", valore, fonte: id };
}

/** Il registro elenca quali campi vengono da quella fonte: «Campi: Denominazione, Sede legale». */
function aggiungiCampo(fonti: RegistroFonti, id: string, etichetta: string) {
  const f = fonti.trova(id);
  if (!f) return;
  const prefisso = "Campi usati: ";
  const i = f.dettaglio.findIndex((d) => d.startsWith(prefisso));
  if (i === -1) {
    f.dettaglio.push(`${prefisso}${etichetta}`);
    return;
  }
  const presenti = f.dettaglio[i].slice(prefisso.length).split(", ");
  if (!presenti.includes(etichetta)) {
    f.dettaglio[i] = `${prefisso}${[...presenti, etichetta].join(", ")}`;
  }
}

/* ================================================================== */
/* Leggere i documenti                                                 */
/* ================================================================== */

/**
 * I documenti letti di un tipo, con i soli valori confermati.
 *
 * Una riga di TABELLA entra solo se tutte le sue celle piene sono
 * confermate: mezza riga confermata è una riga di cui il cliente non ha
 * ancora finito di rispondere, e un rifornimento con la data confermata e
 * i litri no non è un rifornimento che si può sommare.
 */
export function letture(ctx: ContestoComposizione, tipo: string): LetturaDocumento[] {
  const chiave = `letture:${tipo}`;
  const memo = ctx.memoria.get(chiave) as LetturaDocumento[] | undefined;
  if (memo) return memo;

  const { documenti, campiDocumento } = ctx.ingresso;
  const out = documenti
    .filter((d) => d.tipo === tipo && d.stato !== "non_pertinente" && d.stato !== "dati_particolari")
    .sort((a, b) => a.created_at.localeCompare(b.created_at) || a.id.localeCompare(b.id))
    .map((documento): LetturaDocumento => {
      const campi = campiDocumento.filter(
        (c) => c.document_id === documento.id && c.stato !== "rifiutato",
      );
      const scheda = new Map<string, CampoDocumentoIngresso>();
      let daConfermare = 0;
      for (const c of campi.filter((c) => c.riga === 0)) {
        if (c.valore === null || c.valore === "") continue;
        if (c.stato === "confermato") scheda.set(c.campo, c);
        else daConfermare++;
      }
      const perRiga = new Map<number, CampoDocumentoIngresso[]>();
      for (const c of campi.filter((c) => c.riga > 0)) {
        perRiga.set(c.riga, [...(perRiga.get(c.riga) ?? []), c]);
      }
      const righe: LetturaDocumento["righe"] = [];
      for (const [riga, celle] of [...perRiga].sort((a, b) => a[0] - b[0])) {
        const piene = celle.filter((c) => c.valore !== null && c.valore !== "");
        if (piene.length === 0) continue;
        if (piene.every((c) => c.stato === "confermato")) {
          righe.push({ riga, celle: new Map(piene.map((c) => [c.campo, c])) });
        } else {
          daConfermare++;
        }
      }
      return { documento, scheda, righe, daConfermare };
    });
  ctx.memoria.set(chiave, out);
  return out;
}

/** Il periodo di una bolletta, quando è confermato: dà il nome alla fonte. */
function periodoDi(l: LetturaDocumento): { dal: string; al: string } | undefined {
  const dal = l.scheda.get("periodoInizio")?.valore;
  const al = l.scheda.get("periodoFine")?.valore;
  return dal && al ? { dal, al } : undefined;
}

const MESE_ANNO = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString("it-IT", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });

/**
 * La sigla di un documento, registrata la prima volta che un suo valore
 * entra nel documento. Il titolo dice che cosa è e a quale periodo si
 * riferisce: «Bolletta di energia elettrica · gennaio 2025» si ritrova in
 * un archivio, «scan_0012.pdf» no — il nome del file resta nel dettaglio.
 */
export function fonteDocumento(ctx: ContestoComposizione, l: LetturaDocumento): string {
  const d = l.documento;
  return ctx.fonti.registra(`doc:${d.id}`, () => {
    const periodo = periodoDi(l);
    const nome = tipoDocumento(d.tipo)?.nome ?? "Documento dell'organizzazione";
    const quando = periodo
      ? MESE_ANNO(periodo.dal) === MESE_ANNO(periodo.al)
        ? MESE_ANNO(periodo.dal)
        : `${DATA_LUNGA(periodo.dal)} – ${DATA_LUNGA(periodo.al)}`
      : null;
    return {
      tipo: "documento",
      titolo: quando ? `${nome} · ${quando}` : nome,
      dettaglio: [
        `File «${d.nome_file}», caricato il ${DATA_LUNGA(d.created_at)}${d.da_fotocamera ? ", acquisito con la fotocamera" : ""}`,
      ],
      confermata: true,
      ...(periodo ? { periodo } : {}),
    };
  });
}

/* ── La forma canonica: l'unica che la composizione accetta ─────────── */

/**
 * Un numero nella forma in cui lo scrive la banca dati — quella di
 * `String(n)`: punto decimale, niente separatori, niente zeri in coda.
 *
 * NIENTE INTERPRETAZIONI. «11.840» scritto dal cliente può essere undici
 * virgola ottantaquattro o undicimila ottocentoquaranta: `Number()` lo
 * legge nel primo modo, un inventario lo voleva nel secondo, e il documento
 * usciva con le emissioni divise per mille. Qui un valore che non è già
 * canonico non è un numero, e chi compone lo tratta come un dato da
 * correggere — non come un dato da indovinare.
 */
export function numeroCanonico(valore: string | null | undefined): number | null {
  if (valore === null || valore === undefined) return null;
  if (!/^-?\d+(\.\d+)?$/.test(valore)) return null;
  const n = Number(valore);
  return Number.isFinite(n) && String(n) === valore ? n : null;
}

/** Una data nella forma canonica AAAA-MM-GG, e che esiste davvero. */
export function dataCanonica(valore: string | null | undefined): string | null {
  return valore && dataValida(valore) ? valore : null;
}

/**
 * Un valore letto da un documento, pronto per la tabella: formattato
 * come lo scriverebbe una persona, con la sigla accanto e la pagina
 * annotata nel registro.
 *
 * ═══ LA SIGLA DICE LA VERITÀ SU CHI HA SCRITTO IL NUMERO ═══
 * Un valore corretto a mano dal cliente non è più «letto dal documento»:
 * chi apre la pagina indicata ci troverebbe un altro numero. Diventa I,
 * scritto dall'organizzazione. Un valore che il Motore ha ricavato da
 * altre celle — le ore fra ingresso e uscita, i partecipanti contati —
 * non è scritto sul foglio: diventa C, con il documento come ingresso.
 */
export function valoreLetto(
  ctx: ContestoComposizione,
  l: LetturaDocumento,
  campo: CampoDocumentoIngresso,
  testo?: string,
): Valore {
  const doc = fonteDocumento(ctx, l);
  const titolo = ctx.fonti.trova(doc)?.titolo ?? l.documento.nome_file;
  const confermato = campo.stato === "confermato";
  let id = doc;
  if (cellaScrittaDalCliente(campo)) {
    id = ctx.fonti.registra(`scritto:${l.documento.id}`, () => ({
      tipo: "inserito",
      titolo: `Valori scritti dall'organizzazione al posto di quelli letti su «${titolo}»`,
      dettaglio: [`Il documento resta la fonte degli altri valori (${doc}); questi li ha corretti l'organizzazione confermando la lettura`],
      confermata: true,
    }));
    ctx.fonti.conferma(id, campo.confirmed_at, confermato);
  } else if (
    cellaCalcolata({ calcolato: campo.calcolato ?? null, fonteLettura: campo.fonte_lettura, avvisi: campo.avvisi })
  ) {
    id = ctx.fonti.registra(`ricavato:${l.documento.id}`, () => ({
      tipo: "calcolato",
      titolo: `Valori ricavati da altre celle di «${titolo}»`,
      dettaglio: [
        "Non sono scritti sul documento: li ha dedotti la lettura dagli altri valori della stessa riga, e l'organizzazione li ha confermati",
      ],
      ingressi: [doc],
      confermata: true,
    }));
    ctx.fonti.pagina(doc, campo.pagina);
    ctx.fonti.conferma(id, campo.confirmed_at, confermato);
  } else {
    ctx.fonti.pagina(doc, campo.pagina);
    ctx.fonti.conferma(doc, campo.confirmed_at, confermato);
  }
  const n = numeroCanonico(campo.valore);
  return {
    testo: testo ?? formattaValore(campo.valore ?? "", campo.unita),
    fonte: id,
    ...(n !== null ? { numero: n } : {}),
  };
}

/** La mancanza per i valori letti che aspettano la conferma. */
export function mancanzaDaConfermare(
  ctx: ContestoComposizione,
  l: LetturaDocumento,
): Mancanza | null {
  if (l.daConfermare === 0) return null;
  const nome = tipoDocumento(l.documento.tipo)?.nome ?? "documento";
  return {
    tipo: "dato-da-confermare",
    chi: "impresa",
    sezione: ctx.sezione,
    messaggio: `${nome} «${l.documento.nome_file}»: ${l.daConfermare} ${
      l.daConfermare === 1 ? "valore letto aspetta" : "valori letti aspettano"
    } la tua conferma, e finché non la dai restano fuori dal documento.`,
    rimedio: "Controlla i valori accanto al documento e confermali.",
    azione: { etichetta: "Conferma i valori", href: `${HREF_DOCUMENTI}/${l.documento.id}` },
  };
}

/** La mancanza per un campo della scheda impresa. */
export function mancanzaCampo(
  ctx: ContestoComposizione,
  chiave: string,
  stato: "da_confermare" | "assente",
  perche: string,
): Mancanza {
  const etichetta = ETICHETTA_CAMPO[chiave] ?? chiave;
  return stato === "da_confermare"
    ? {
        tipo: "dato-da-confermare",
        chi: "impresa",
        sezione: ctx.sezione,
        messaggio: `Il dato «${etichetta}» della scheda impresa è stato recuperato ma aspetta la tua conferma: ${perche}.`,
        rimedio: "Aprilo nella scheda impresa e confermalo, oppure correggilo.",
        azione: { etichetta: "Apri la scheda impresa", href: HREF_IMPRESA },
      }
    : {
        tipo: "dato-mancante",
        chi: "impresa",
        sezione: ctx.sezione,
        messaggio: `Manca il dato «${etichetta}» della scheda impresa: ${perche}.`,
        rimedio: "Aggiungilo nella scheda impresa, oppure carica la visura camerale: lo leggiamo da lì.",
        azione: { etichetta: "Apri la scheda impresa", href: HREF_IMPRESA },
      };
}

/* ================================================================== */
/* I compositori generici                                              */
/* ================================================================== */

/**
 * Un campo, dalla scheda o — se non c'è — dalla visura letta e confermata.
 *
 * Quando manca, dice anche PERCHÉ: se la visura quel valore l'ha letto e
 * aspetta solo la conferma, il rimedio è confermarlo lì, non andarlo a
 * scrivere a mano nella scheda.
 */
function daSchedaOVisura(
  ctx: ContestoComposizione,
  chiaveScheda: string,
  chiaveVisura: string | null,
):
  | { valore: Valore }
  | { mancanza: "da_confermare" | "assente"; inAttesa?: LetturaDocumento } {
  const s = campoScheda(ctx, chiaveScheda);
  if (s.stato === "confermato") return { valore: { testo: s.valore, fonte: s.fonte } };
  if (chiaveVisura) {
    for (const l of letture(ctx, "visura")) {
      const c = l.scheda.get(chiaveVisura);
      if (c?.valore) return { valore: valoreLetto(ctx, l, c) };
    }
    const inAttesa = letture(ctx, "visura").find((l) =>
      ctx.ingresso.campiDocumento.some(
        (c) =>
          c.document_id === l.documento.id &&
          c.campo === chiaveVisura &&
          c.stato === "da_confermare" &&
          c.valore,
      ),
    );
    if (inAttesa) return { mancanza: "da_confermare", inAttesa };
  }
  return { mancanza: s.stato };
}

/** La mancanza giusta per un campo che non c'è: da confermare sulla visura, o sulla scheda. */
function mancanzaPer(
  ctx: ContestoComposizione,
  chiave: string,
  esito: { mancanza: "da_confermare" | "assente"; inAttesa?: LetturaDocumento },
  perche: string,
): Mancanza {
  if (esito.inAttesa) {
    const m = mancanzaDaConfermare(ctx, esito.inAttesa);
    if (m) return { ...m, messaggio: `${m.messaggio} Serve per il dato «${ETICHETTA_CAMPO[chiave] ?? chiave}»: ${perche}.` };
  }
  return mancanzaCampo(ctx, chiave, esito.mancanza, perche);
}

const anagrafica: Compositore = {
  tipi: ["visura"],
  componi(ctx) {
    const righe: { etichetta: string; valore: Cella }[] = [];
    const mancanze: Mancanza[] = [];
    let piena = true;

    const voci: {
      etichetta: string;
      scheda: string;
      visura: string | null;
      /** Senza questo dato l'organizzazione non è identificata. */
      richiesto?: string;
    }[] = [
      { etichetta: "Denominazione", scheda: "ragione_sociale", visura: "ragioneSociale", richiesto: "è il nome che il documento dichiara in ogni pagina" },
      { etichetta: "Forma giuridica", scheda: "forma_giuridica", visura: "formaGiuridica" },
      { etichetta: "Partita IVA", scheda: "partita_iva", visura: "partitaIva", richiesto: "identifica l'organizzazione" },
      { etichetta: "Codice fiscale", scheda: "codice_fiscale", visura: "codiceFiscale" },
      { etichetta: "Sede legale", scheda: "sede_legale", visura: "sedeLegale", richiesto: "il documento deve dire dove ha sede l'organizzazione" },
      { etichetta: "Attività (ATECO)", scheda: "ateco", visura: "ateco", richiesto: "descrive l'attività a cui il documento si riferisce" },
      { etichetta: "Attività prevalente", scheda: "descrizione_ateco", visura: "atecoDescrizione" },
      { etichetta: "Addetti", scheda: "dipendenti", visura: "addetti" },
      { etichetta: "Numero REA", scheda: "rea", visura: "reaNumero" },
      { etichetta: "PEC", scheda: "pec", visura: "pec" },
      { etichetta: "Sito ufficiale", scheda: "sito_web", visura: null },
    ];

    for (const v of voci) {
      const esito = daSchedaOVisura(ctx, v.scheda, v.visura);
      if ("valore" in esito) {
        righe.push({ etichetta: v.etichetta, valore: esito.valore });
      } else if (v.richiesto) {
        piena = false;
        mancanze.push(mancanzaPer(ctx, v.scheda, esito, v.richiesto));
      }
      // Un dato FACOLTATIVO che manca o aspetta la conferma non blocca:
      // resta fuori dal documento, e il documento non finge che ci sia.
      // Bloccare per un numero REA non confermato vorrebbe dire trattare
      // come mancanza un dato che il documento non usa.
    }

    return {
      blocchi: righe.length > 0 ? [{ tipo: "coppie", righe }] : [],
      mancanze,
      piena: piena && righe.length > 0,
    };
  },
};

/**
 * Il periodo di rendicontazione è una scelta dell'organizzazione (SPEC
 * §12.C): la fa nel portale, ed è per questo che porta la sigla di un
 * dato inserito e non di un nostro testo.
 */
export function valoreEsercizio(ctx: ContestoComposizione): Valore {
  const id = ctx.fonti.registra("inserito:esercizio", () => ({
    tipo: "inserito",
    titolo: "Anno di rendicontazione scelto dall'organizzazione nel portale",
    dettaglio: [`Esercizio ${ctx.esercizio}: ${periodoEsteso(ctx.esercizio)}`],
    confermata: true,
  }));
  ctx.fonti.conferma(id, ctx.ingresso.organizzazione.created_at ?? "1970-01-01");
  return { testo: periodoEsteso(ctx.esercizio), fonte: id };
}

const perimetro: Compositore = {
  tipi: ["visura"],
  componi(ctx) {
    const mancanze: Mancanza[] = [];
    const righe: { etichetta: string; valore: Cella }[] = [];

    const org = daSchedaOVisura(ctx, "ragione_sociale", "ragioneSociale");
    if ("valore" in org) righe.push({ etichetta: "Organizzazione", valore: org.valore });

    const sede = daSchedaOVisura(ctx, "sede_legale", "sedeLegale");
    if ("valore" in sede) {
      righe.push({ etichetta: "Sede legale", valore: sede.valore });
    } else {
      mancanze.push(
        mancanzaPer(ctx, "sede_legale", sede, "il perimetro dichiara dove si trovano le attività incluse"),
      );
    }
    const unita = campoScheda(ctx, "unita_locali");
    if (unita.stato === "confermato") {
      righe.push({ etichetta: "Unità locali", valore: { testo: unita.valore, fonte: unita.fonte } });
    }
    righe.push({ etichetta: "Periodo di rendicontazione", valore: valoreEsercizio(ctx) });

    return {
      blocchi: [{ tipo: "coppie", righe }],
      mancanze,
      piena: "valore" in sede,
    };
  },
};

/** Le sezioni qualitative: citazioni dal sito dell'impresa, mai nostre sintesi (SPEC §12.D). */
function citazioni(chiavi: { chiave: string; etichetta: string }[], richieste: string): Compositore {
  return {
    tipi: [],
    componi(ctx) {
      const righe: { etichetta: string; valore: Cella }[] = [];
      const mancanze: Mancanza[] = [];
      for (const c of chiavi) {
        const esito = campoScheda(ctx, c.chiave);
        if (esito.stato === "confermato") {
          righe.push({ etichetta: c.etichetta, valore: { testo: esito.valore, fonte: esito.fonte } });
        } else if (esito.stato === "da_confermare") {
          mancanze.push(mancanzaCampo(ctx, c.chiave, "da_confermare", richieste));
        }
      }
      if (righe.length === 0 && mancanze.length === 0) {
        mancanze.push({
          tipo: "dato-mancante",
          chi: "impresa",
          sezione: ctx.sezione,
          messaggio: `La sezione «${ctx.sezione}» non ha ancora contenuti: ${richieste}.`,
          rimedio:
            "Indica il sito ufficiale nella scheda impresa: ne leggiamo le pagine istituzionali e ti proponiamo i testi da confermare.",
          azione: { etichetta: "Apri la scheda impresa", href: HREF_IMPRESA },
        });
      }
      return {
        blocchi: righe.length > 0 ? [{ tipo: "coppie", righe }] : [],
        mancanze,
        piena: righe.length > 0,
      };
    },
  };
}

/**
 * LA TABELLA DI UN DOCUMENTO, DICHIARATA NEL MODELLO.
 *
 * Il compositore che rende vera la promessa di `docs/motore.md` §12: un
 * ambito nuovo mette le righe confermate di un suo tipo di documento in
 * una sezione del documento finale scrivendo SOLO il modello —
 *
 *   { blocco: "tabella-documenti",
 *     parametri: { tipo: "mappatura-rischi-231",
 *                  colonne: [{ campo: "area", titolo: "Area" }, …] } }
 *
 * — con la provenienza cella per cella, come ogni altra tabella.
 */
const tabellaDocumenti: Compositore = {
  tipi: (p) => (typeof p.tipo === "string" ? [p.tipo] : []),
  componi(ctx, p) {
    const tipo = typeof p.tipo === "string" ? p.tipo : "";
    const colonne = Array.isArray(p.colonne)
      ? (p.colonne as { campo: string; titolo: string; allinea?: "sinistra" | "destra" }[])
      : [];
    const minimo = typeof p.minimoRighe === "number" ? p.minimoRighe : 1;
    const lette = letture(ctx, tipo);
    const mancanze = lette
      .map((l) => mancanzaDaConfermare(ctx, l))
      .filter((m): m is Mancanza => m !== null);

    const righe: Cella[][] = lette.flatMap((l) =>
      l.righe.map((r) =>
        colonne.map((c): Cella => {
          const cella = r.celle.get(c.campo);
          return cella?.valore ? valoreLetto(ctx, l, cella) : "—";
        }),
      ),
    );

    if (righe.length < minimo) {
      const nome = tipoDocumento(tipo)?.nome ?? tipo;
      if (mancanze.length === 0) {
        mancanze.push({
          tipo: "documento-mancante",
          chi: "impresa",
          sezione: ctx.sezione,
          messaggio: `Per la sezione «${ctx.sezione}» serve il documento «${nome}», letto e confermato.`,
          rimedio: "Caricalo nella sezione Documenti: lo leggiamo e ti chiediamo di confermare i valori.",
          azione: { etichetta: "Carica il documento", href: HREF_DOCUMENTI },
        });
      }
      return { blocchi: [], mancanze, piena: false };
    }

    return {
      blocchi: [
        {
          tipo: "tabella",
          ...(typeof p.didascalia === "string" ? { didascalia: p.didascalia } : {}),
          colonne: colonne.map((c) => ({ titolo: c.titolo, allinea: c.allinea ?? "sinistra" })),
          righe,
        },
      ],
      mancanze,
      piena: true,
    };
  },
};

/* ================================================================== */
/* Il registro                                                         */
/* ================================================================== */

export const COMPOSITORI: Record<string, Compositore> = {
  anagrafica,
  perimetro,
  "tabella-documenti": tabellaDocumenti,
  profilo: citazioni(
    [
      { chiave: "descrizione_attivita", etichetta: "Attività" },
      { chiave: "prodotti_servizi", etichetta: "Prodotti e servizi" },
      { chiave: "mercati", etichetta: "Mercati" },
      { chiave: "certificazioni_esposte", etichetta: "Certificazioni dichiarate" },
    ],
    "servono la descrizione dell'attività e dei prodotti, con le parole dell'impresa",
  ),
  contesto: citazioni(
    [
      { chiave: "descrizione_attivita", etichetta: "Attività" },
      { chiave: "sedi_operative", etichetta: "Sedi e stabilimenti" },
      { chiave: "mercati", etichetta: "Mercati" },
    ],
    "servono attività, sedi e mercati dell'organizzazione",
  ),
  politicaParita: citazioni(
    [{ chiave: "policy_pubblicate", etichetta: "Politiche già pubblicate" }],
    "servono le politiche HR già adottate dall'impresa",
  ),
};

/** Registra i compositori di un dominio. Chiamato una volta, dal modulo del dominio. */
export function registraCompositori(nuovi: Record<string, Compositore>) {
  for (const [chiave, c] of Object.entries(nuovi)) {
    if (COMPOSITORI[chiave] && COMPOSITORI[chiave] !== c) {
      throw new Error(`Compositore «${chiave}» registrato due volte.`);
    }
    COMPOSITORI[chiave] = c;
  }
}

/** I segnaposto del modello, sciolti per un esercizio e un'organizzazione. */
export function sciogliSegnaposto(
  testo: string,
  valori: { anno: number; organizzazione: string; norma?: string },
): string {
  return testo
    .replace(/\{anno\}/g, String(valori.anno))
    .replace(/\{dodiciMesi\}/g, dodiciMesiDi(valori.anno))
    .replace(/\{periodo\}/g, periodoEsteso(valori.anno))
    .replace(/\{organizzazione\}/g, valori.organizzazione)
    .replace(/\{norma\}/g, valori.norma ?? "{norma}");
}
