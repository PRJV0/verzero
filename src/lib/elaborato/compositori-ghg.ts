import {
  carburanti as calcolaCarburanti,
  combustionePeriodica,
  copertura,
  esercizioComePeriodo,
  giorniInclusivi,
  quotaNellEsercizio,
  scope2 as calcolaScope2,
  sovrapposizione,
  TOLLERANZA_GIORNI,
  type EsitoCarburanti,
  type EsitoCombustione,
  type EsitoScope2,
  type FattoreApplicato,
  type LetturaPeriodica,
  type Periodo,
  type Rifornimento,
} from "@/lib/calc/ghg";
import {
  FATTORI_VERIFICATI_IL,
  fattorePer,
  vettoreCarburante,
  type FattoreEmissione,
  type Vettore,
} from "@/lib/calc/fattori";
import { tipoDocumento } from "@/lib/documenti";

import {
  campoScheda,
  dataCanonica,
  fonteDocumento,
  letture,
  numeroCanonico,
  registraCompositori,
  valoreLetto,
  type Compositore,
  type ContestoComposizione,
  type LetturaDocumento,
} from "./compositori";
import type { Blocco, Cella, Valore } from "./contenuto";
import {
  chiaveAssenza,
  chiaveAttivita,
  domandaAttivita,
  leggiAttivita,
  testoAssenza,
  testoAttivita,
  valoreAttivita,
  type AssenzaDichiarabile,
  type AttivitaContatore,
  type Dichiarazione,
} from "./dichiarazioni";
import { DATA_LUNGA } from "./fonti";
import type { CampoImpresaIngresso } from "./ingresso";
import type { Mancanza } from "./mancanze";

/**
 * I COMPOSITORI DELL'INVENTARIO GHG — Scope 1 e 2 dai documenti confermati.
 *
 * È codice di dominio, e sta in un file suo proprio per questo: il
 * costruttore del documento non lo importa per nome, lo trova nel registro
 * dei compositori. Un inventario si calcola UNA volta per composizione
 * (`inventario`, in memoria del contesto) e cinque compositori lo mostrano
 * da cinque lati: le fonti di emissione nel perimetro, i fattori nella
 * metodologia, le due sezioni di Scope, i risultati.
 *
 * ═══ LE SIGLE DEI CALCOLI ═══
 * Ogni numero che non è scritto su un documento porta una sigla C, e la
 * voce C nel registro dice il procedimento e da quali fonti parte — anche
 * un conteggio, anche i giorni di una bolletta che cadono nell'esercizio.
 * Una C per procedimento, non per numero: «consumo attribuito
 * all'esercizio» è un procedimento solo, applicato a dodici bollette.
 *
 * ═══ NIENTE DI INDOVINATO ═══
 * Un numero o una data che non sono nella forma canonica non si leggono
 * «al meglio»: si chiede di correggerli. «11.840» scritto a mano può
 * essere undicimila o undici, e un inventario che sceglie da solo esce con
 * le emissioni divise per mille. Un documento non ancora letto non vale
 * come assente: si aspetta la lettura, o si chiede di avviarla.
 *
 * ═══ GLI ALTRI ESERCIZI SONO UN INDIZIO ═══
 * L'archivio di un cliente al secondo anno contiene le bollette del primo.
 * Un documento di un altro esercizio non conta come presente e da solo non
 * blocca niente; ma un contatore o una fonte che c'erano nell'esercizio
 * precedente e in questo mancano vanno spiegati — con i documenti
 * dell'anno, o con una dichiarazione dell'organizzazione
 * (`dichiarazioni.ts`). È così che al secondo anno il portale chiede le
 * bollette nuove invece di dichiarare vuote tre sezioni.
 */

const HREF_DOCUMENTI = "/dashboard/documenti";

/* ------------------------------------------------------------------ */
/* Formattazione: arrotonda solo chi presenta                           */
/* ------------------------------------------------------------------ */

// Il separatore delle migliaia SEMPRE: l'italiano di norma non lo mette
// sulle cifre da quattro, e in una colonna «2140» sotto «12.310» si legge
// come un altro ordine di grandezza.
const it = (n: number, decimali: number) =>
  n.toLocaleString("it-IT", {
    minimumFractionDigits: decimali,
    maximumFractionDigits: decimali,
    useGrouping: "always",
  });

export const FORMATO = {
  kwh: (n: number) => `${it(n, 0)} kWh`,
  smc: (n: number) => `${it(n, 0)} Smc`,
  litri: (n: number) => `${it(n, 1)} l`,
  /** Da kg a tonnellate, due decimali. */
  t: (kg: number) => `${it(kg / 1000, 2)} t CO₂e`,
  percento: (q: number) => `${it(q * 100, 1)}%`,
  fattore: (f: FattoreEmissione) =>
    `${f.valore.toLocaleString("it-IT", { maximumFractionDigits: 5 })} kg ${f.gas === "CO2" ? "CO₂" : "CO₂e"}/${f.unita === "l" ? "litro" : f.unita}`,
  /** «16 gen – 15 feb 2025»; l'anno si ripete solo quando cambia. */
  periodo: (p: Periodo) => {
    const d = (iso: string, conAnno: boolean) =>
      new Date(`${iso}T00:00:00Z`).toLocaleDateString("it-IT", {
        day: "numeric",
        month: "short",
        ...(conAnno ? { year: "numeric" } : {}),
        timeZone: "UTC",
      });
    const stessoAnno = p.dal.slice(0, 4) === p.al.slice(0, 4);
    return `${d(p.dal, !stessoAnno)} – ${d(p.al, true)}`;
  },
};

const NOME_VETTORE: Record<Vettore, string> = {
  "energia-elettrica-rete": "Energia elettrica — rete nazionale (location-based)",
  "energia-elettrica-residuale": "Energia elettrica — mix residuale (market-based)",
  "gas-naturale": "Gas naturale",
  gasolio: "Gasolio",
  benzina: "Benzina",
  gpl: "GPL",
};

const MAIUSCOLA = (s: string) => `${s.charAt(0).toUpperCase()}${s.slice(1)}`;

const conta = (n: number, uno: string, molti: string) => `${n} ${n === 1 ? uno : molti}`;

/* ------------------------------------------------------------------ */
/* Le dichiarazioni, lette dalla scheda impresa                         */
/* ------------------------------------------------------------------ */

type AssenzaResa = { fonte: AssenzaDichiarabile; campo: CampoImpresaIngresso };
type AttivitaResa = { punto: string; attivita: AttivitaContatore; campo: CampoImpresaIngresso };

function campoDichiarato(ctx: ContestoComposizione, chiave: string | null) {
  if (!chiave) return undefined;
  return ctx.ingresso.campi.find((c) => c.campo === chiave && c.stato === "confermato" && c.valore);
}

function assenzaDichiarata(ctx: ContestoComposizione, fonte: AssenzaDichiarabile): AssenzaResa | null {
  const campo = campoDichiarato(ctx, chiaveAssenza(fonte, ctx.esercizio));
  return campo?.valore === "si" ? { fonte, campo } : null;
}

function attivitaDichiarata(ctx: ContestoComposizione, punto: string): AttivitaResa | null {
  const campo = campoDichiarato(ctx, chiaveAttivita(punto, ctx.esercizio));
  const attivita = campo ? leggiAttivita(campo.valore, ctx.esercizio) : null;
  return campo && attivita ? { punto, attivita, campo } : null;
}

const TITOLO_ASSENZA: Record<AssenzaDichiarabile, string> = {
  combustibili: "nessun consumo diretto di combustibili",
  gas: "nessun consumo di gas naturale",
  carburanti: "nessun rifornimento di carburante",
};

const NEGAZIONE_ASSENZA: Record<AssenzaDichiarabile, string> = {
  combustibili: "non ha avuto consumi diretti di combustibili",
  gas: "non ha avuto consumi di gas naturale",
  carburanti: "non ha fatto rifornimenti di carburante",
};

/**
 * La sigla I di una dichiarazione. Si registra quando il documento la
 * cita, non quando la si legge: una dichiarazione che non serve a niente
 * non entra nel registro delle fonti.
 */
function siglaDichiarazione(ctx: ContestoComposizione, chiave: string, titolo: string, testo: string, campo: CampoImpresaIngresso): string {
  const id = ctx.fonti.registra(`dichiarazione:${chiave}`, () => ({
    tipo: "inserito",
    titolo: `Dichiarazione dell'organizzazione: ${titolo}`,
    dettaglio: [`«${testo}»`, "Resa dall'organizzazione nel portale, al posto di documenti che per questo esercizio non esistono"],
    confermata: true,
  }));
  ctx.fonti.conferma(id, campo.confirmed_at ?? campo.updated_at ?? null);
  return id;
}

function siglaAssenza(ctx: ContestoComposizione, a: AssenzaResa): string {
  return siglaDichiarazione(
    ctx,
    chiaveAssenza(a.fonte, ctx.esercizio),
    `${TITOLO_ASSENZA[a.fonte]} nell'esercizio ${ctx.esercizio}`,
    testoAssenza(a.fonte, ctx.esercizio),
    a.campo,
  );
}

function siglaAttivita(ctx: ContestoComposizione, a: AttivitaResa): string {
  return siglaDichiarazione(
    ctx,
    chiaveAttivita(a.punto, ctx.esercizio)!,
    `attività del contatore ${a.punto} nell'esercizio ${ctx.esercizio}`,
    testoAttivita(a.punto, ctx.esercizio, a.attivita),
    a.campo,
  );
}

function offriAssenza(ctx: ContestoComposizione, fonte: AssenzaDichiarabile, resa: boolean): Dichiarazione {
  return { tipo: "assenza", fonte, esercizio: ctx.esercizio, resa, testo: testoAssenza(fonte, ctx.esercizio) };
}

function offriAttivita(ctx: ContestoComposizione, punto: string, resa: AttivitaResa | null): Dichiarazione | undefined {
  if (!chiaveAttivita(punto, ctx.esercizio)) return undefined;
  return {
    tipo: "periodo-contatore",
    punto,
    esercizio: ctx.esercizio,
    resa: resa !== null,
    testo: resa ? testoAttivita(punto, ctx.esercizio, resa.attivita) : domandaAttivita(punto, ctx.esercizio),
    ...(resa ? { valore: valoreAttivita(resa.attivita) } : {}),
  };
}

/* ------------------------------------------------------------------ */
/* L'inventario, calcolato una volta                                    */
/* ------------------------------------------------------------------ */

type Bolletta = {
  lettura: LetturaDocumento;
  punto: string;
  periodo: Periodo;
  quantita: number;
  rinnovabile: "si" | "no" | "non-dichiarato" | null;
};

/** Una bolletta confermata di un altro esercizio: non entra nel calcolo, ma dice che il contatore c'era. */
type BollettaAltroEsercizio = { lettura: LetturaDocumento; punto: string | null; periodo: Periodo };

type AreaPeriodica<E> = {
  bollette: Bolletta[];
  esito?: E;
  mancanze: Mancanza[];
  altriEsercizi: BollettaAltroEsercizio[];
  /** Bollette che riguardano l'esercizio — o che potrebbero, finché non sono sistemate. */
  nellEsercizio: number;
  /** I periodi di attività dichiarati e usati, per contatore. */
  attivita: Map<string, AttivitaResa>;
  /** Contatori dell'esercizio precedente dichiarati non attivi in questo. */
  spenti: AttivitaResa[];
  /** Contatori dell'esercizio precedente senza bollette in questo, e non dichiarati spenti. */
  scomparsi: string[];
};

export type Inventario = {
  esercizio: number;
  elettrico: AreaPeriodica<EsitoScope2<string>> & {
    location?: FattoreEmissione;
    mercato?: FattoreEmissione;
  };
  gas: AreaPeriodica<EsitoCombustione<string>> & { fattore?: FattoreEmissione };
  carburanti: {
    esito?: EsitoCarburanti<string>;
    fattori: Map<string, FattoreEmissione>;
    mancanze: Mancanza[];
    /** Registri con rifornimenti dell'esercizio, o da sistemare. */
    nellEsercizio: number;
    /** Registri confermati di soli altri esercizi. */
    altriEsercizi: number;
    /** Di quelli, i registri con rifornimenti dell'esercizio precedente. */
    precedenti: number;
  };
  scope1: {
    /** Fonti sparite, dichiarazioni contraddette, nessun documento: ciò che nessuna delle due aree dice da sola. */
    mancanze: Mancanza[];
    /** Le dichiarazioni d'assenza che reggono, e che il documento riporta. */
    assenze: AssenzaResa[];
    /** Scope 1 pari a zero per dichiarazione dell'organizzazione. */
    perDichiarazione: boolean;
  };
};

/** La sigla B di un fattore: la voce di registro dice pubblicazione, tabella, data di verifica. */
function siglaFattore(ctx: ContestoComposizione, f: FattoreEmissione): string {
  return ctx.fonti.registra(`fattore:${f.id}`, () => ({
    tipo: "banca-dati",
    titolo: `${f.fonte.ente} — ${f.fonte.pubblicazione}`,
    dettaglio: [
      `${f.fonte.dove}: ${f.comeNellaFonte}`,
      `Pubblicata ${/^\d/.test(f.fonte.pubblicataIl) ? "il " : "a "}${f.fonte.pubblicataIl}; valore verificato sul documento originale il ${FATTORI_VERIFICATI_IL.esteso}`,
      ...(f.nota ? [f.nota] : []),
    ],
    url: f.fonte.url,
    confermata: true,
  }));
}

function mancanzaFattore(ctx: ContestoComposizione, vettore: Vettore): Mancanza {
  return {
    tipo: "fattore-mancante",
    chi: "verzero",
    sezione: ctx.sezione,
    messaggio: `Per l'esercizio ${ctx.esercizio} non abbiamo ancora un fattore di emissione verificato per «${NOME_VETTORE[vettore]}».`,
    rimedio:
      "Non serve niente da te: il fattore va preso dalla pubblicazione ufficiale e verificato prima di entrare in un documento, e lo facciamo noi.",
  };
}

/**
 * Un documento dei tipi dell'inventario che non è (ancora) stato letto.
 * Non si considera assente: potrebbe essere proprio la bolletta che manca.
 */
function nonLetto(ctx: ContestoComposizione, l: LetturaDocumento): Mancanza | null {
  const d = l.documento;
  if (d.stato === "letto") return null;
  const nome = tipoDocumento(d.tipo)?.nome ?? "Documento";
  const azione = { etichetta: "Apri il documento", href: `${HREF_DOCUMENTI}/${d.id}` };
  if (d.stato === "in_lettura" || d.stato === "in_coda") {
    return {
      tipo: "dato-mancante",
      chi: "verzero",
      sezione: ctx.sezione,
      messaggio: `${nome} «${d.nome_file}» è ${d.stato === "in_coda" ? "in coda per la lettura" : "in lettura"}: finché non è letto non si sa che cosa porta all'inventario.`,
      rimedio: "Non serve niente da te adesso: quando la lettura finisce ti chiediamo di confermare i valori.",
    };
  }
  if (d.stato === "illeggibile") {
    return {
      tipo: "documento-mancante",
      chi: "impresa",
      sezione: ctx.sezione,
      messaggio: `${nome} «${d.nome_file}» non si è potuto leggere, e potrebbe contenere consumi dell'esercizio ${ctx.esercizio}.`,
      rimedio: "Carica una copia più leggibile; se il documento non serve all'inventario, eliminalo dall'archivio.",
      azione,
    };
  }
  return {
    tipo: "dato-mancante",
    chi: "impresa",
    sezione: ctx.sezione,
    messaggio: `${nome} «${d.nome_file}» non è ancora stato letto, e potrebbe contenere consumi dell'esercizio ${ctx.esercizio}.`,
    rimedio: "Avvia la lettura dalla pagina del documento: poi ti chiediamo di confermare i valori.",
    azione,
  };
}

/**
 * Le bollette di un tipo, divise fra quelle utilizzabili — periodo,
 * quantità e punto CONFERMATI e in forma canonica — quelle di altri
 * esercizi e quelle da sistemare, che diventano mancanze. Una bolletta a
 * cui manca uno di questi non è una bolletta a metà: è una bolletta che non
 * si può ancora usare, e lo si dice.
 */
function bollette(ctx: ContestoComposizione, tipo: "bolletta-elettrica" | "bolletta-gas") {
  const anno = ctx.esercizio;
  const sezione = ctx.sezione;
  const elettrica = tipo === "bolletta-elettrica";
  const chiavePunto = elettrica ? "pod" : "pdr";
  const chiaveQuantita = elettrica ? "consumoTotaleKwh" : "consumoSmc";
  const nomePunto = elettrica ? "POD" : "PDR";
  const nome = tipoDocumento(tipo)?.nome ?? "Bolletta";
  const essenziali = ["periodoInizio", "periodoFine", chiaveQuantita];
  const richiesti = [...essenziali, chiavePunto, ...(elettrica ? ["energiaRinnovabile"] : [])];

  const usabili: Bolletta[] = [];
  const altriEsercizi: BollettaAltroEsercizio[] = [];
  const mancanze: Mancanza[] = [];
  let nellEsercizio = 0;

  for (const l of letture(ctx, tipo)) {
    const id = l.documento.id;
    const azione = (etichetta: string) => ({ etichetta, href: `${HREF_DOCUMENTI}/${id}` });
    const campi = ctx.ingresso.campiDocumento.filter((c) => c.document_id === id && c.riga === 0);

    // Scartata dal cliente: periodo e consumo rifiutati, e niente al loro
    // posto. È il rimedio che si propone per una bolletta doppia, e deve
    // funzionare davvero.
    const vivi = campi.filter((c) => essenziali.includes(c.campo) && c.stato !== "rifiutato" && c.valore);
    if (vivi.length === 0 && campi.some((c) => essenziali.includes(c.campo) && c.stato === "rifiutato")) continue;

    const lettura = nonLetto(ctx, l);
    if (lettura) {
      nellEsercizio++;
      mancanze.push(lettura);
      continue;
    }

    const dalGrezzo = l.scheda.get("periodoInizio")?.valore ?? null;
    const alGrezzo = l.scheda.get("periodoFine")?.valore ?? null;
    const dal = dataCanonica(dalGrezzo);
    const al = dataCanonica(alGrezzo);
    const punto = l.scheda.get(chiavePunto)?.valore?.trim() || null;

    // Un periodo confermato che non tocca l'esercizio basta a dire che la
    // bolletta è di un altro anno, qualunque altro valore aspetti ancora.
    if (dal && al && dal <= al && quotaNellEsercizio({ dal, al }, anno).giorniNellEsercizio === 0) {
      altriEsercizi.push({ lettura: l, punto, periodo: { dal, al } });
      continue;
    }

    nellEsercizio++;
    const inAttesa = campi.filter((c) => richiesti.includes(c.campo) && c.stato === "da_confermare" && c.valore);
    if (inAttesa.length > 0) {
      mancanze.push({
        tipo: "dato-da-confermare",
        chi: "impresa",
        sezione,
        messaggio: `${nome} «${l.documento.nome_file}»: ${inAttesa.map((c) => c.etichetta.toLowerCase()).join(", ")} ${inAttesa.length === 1 ? "aspetta" : "aspettano"} la tua conferma.`,
        rimedio: "Conferma i valori letti: senza, questa bolletta non entra nel calcolo.",
        azione: azione("Conferma i valori"),
      });
      continue;
    }

    const quantitaGrezza = l.scheda.get(chiaveQuantita)?.valore ?? null;
    const quantita = numeroCanonico(quantitaGrezza);
    const rinnovabileGrezzo = elettrica ? (l.scheda.get("energiaRinnovabile")?.valore ?? null) : null;
    const rinnovabile =
      rinnovabileGrezzo === "si" || rinnovabileGrezzo === "no" || rinnovabileGrezzo === "non-dichiarato" ? rinnovabileGrezzo : null;
    const illeggibili = [
      dalGrezzo && !dal ? `la data d'inizio «${dalGrezzo}»` : null,
      alGrezzo && !al ? `la data di fine «${alGrezzo}»` : null,
      quantitaGrezza && quantita === null ? `il consumo «${quantitaGrezza}»` : null,
      rinnovabileGrezzo && !rinnovabile ? `la fornitura rinnovabile «${rinnovabileGrezzo}»` : null,
    ].filter((x): x is string => x !== null);
    if (illeggibili.length > 0) {
      mancanze.push({
        tipo: "valore-non-calcolabile",
        chi: "impresa",
        sezione,
        messaggio: `${nome} «${l.documento.nome_file}»: ${illeggibili.join(" e ")} non ${illeggibili.length === 1 ? "è scritto" : "sono scritti"} in una forma che si possa usare senza indovinare.`,
        rimedio:
          "Riscrivi il valore nella pagina del documento, come lo leggi in bolletta: i numeri con le loro cifre, le date come giorno, mese e anno, la fornitura rinnovabile come sì, no o non dichiarata.",
        azione: azione("Correggi il valore"),
      });
      continue;
    }

    const assenti = [
      !dal || !al ? "il periodo" : null,
      quantita === null ? "il consumo" : null,
      !punto ? `il codice ${nomePunto}` : null,
    ].filter((x): x is string => x !== null);
    if (assenti.length > 0) {
      mancanze.push({
        tipo: "dato-mancante",
        chi: "impresa",
        sezione,
        messaggio: `${nome} «${l.documento.nome_file}»: non risulta ${assenti.join(" né ")}, e senza non si può attribuire all'esercizio né al contatore.`,
        rimedio: "Apri la bolletta e completa i valori mancanti guardando il documento.",
        azione: azione("Apri la bolletta"),
      });
      continue;
    }

    if (dal! > al!) {
      mancanze.push({
        tipo: "valore-non-calcolabile",
        chi: "impresa",
        sezione,
        messaggio: `${nome} «${l.documento.nome_file}»: il periodo finisce prima di cominciare (${DATA_LUNGA(dal!)} – ${DATA_LUNGA(al!)}).`,
        rimedio: "Controlla le due date sul documento e correggile.",
        azione: azione("Correggi il periodo"),
      });
      continue;
    }

    usabili.push({ lettura: l, punto: punto!, periodo: { dal: dal!, al: al! }, quantita: quantita!, rinnovabile });
  }

  /* La copertura dell'esercizio, contatore per contatore. */
  const attivita = new Map<string, AttivitaResa>();
  const perPunto = new Map<string, Bolletta[]>();
  for (const b of usabili) perPunto.set(b.punto, [...(perPunto.get(b.punto) ?? []), b]);

  for (const [punto, bb] of perPunto) {
    const resa = attivitaDichiarata(ctx, punto);
    if (resa?.attivita.inattivo) {
      mancanze.push({
        tipo: "dichiarazione-contraddetta",
        chi: "impresa",
        sezione,
        messaggio: `${nomePunto} ${punto}: l'organizzazione ha dichiarato che nel ${anno} il contatore non è stato attivo, ma ${bb.length === 1 ? "c'è una bolletta" : `ci sono ${bb.length} bollette`} di quell'esercizio.`,
        rimedio: "Correggi la dichiarazione, oppure elimina dall'archivio le bollette che non riguardano l'organizzazione: le due cose insieme non possono stare.",
        azione: { etichetta: "Vai ai documenti", href: HREF_DOCUMENTI },
        dichiarazione: offriAttivita(ctx, punto, resa),
      });
      continue;
    }

    const finestra = resa && !resa.attivita.inattivo ? resa.attivita.periodo : undefined;
    if (resa && finestra) {
      attivita.set(punto, resa);
      const intero = esercizioComePeriodo(anno);
      const fuori = bb.filter((b) => {
        const dentroAnno = sovrapposizione(b.periodo, intero);
        if (!dentroAnno) return false;
        const dentroFinestra = sovrapposizione(dentroAnno, finestra);
        return giorniInclusivi(dentroAnno) - (dentroFinestra ? giorniInclusivi(dentroFinestra) : 0) > TOLLERANZA_GIORNI;
      });
      if (fuori.length > 0) {
        mancanze.push({
          tipo: "dichiarazione-contraddetta",
          chi: "impresa",
          sezione,
          messaggio: `${nomePunto} ${punto}: l'organizzazione ha dichiarato il contatore attivo dal ${DATA_LUNGA(finestra.dal)} al ${DATA_LUNGA(finestra.al)}, ma ${fuori.length === 1 ? `la bolletta «${fuori[0].lettura.documento.nome_file}» fattura` : `${fuori.length} bollette fatturano`} consumi fuori da quel periodo.`,
          rimedio: "Correggi il periodo dichiarato, oppure controlla le date di quelle bollette: un contatore non consuma quando non è attivo.",
          azione: { etichetta: "Vai ai documenti", href: HREF_DOCUMENTI },
          dichiarazione: offriAttivita(ctx, punto, resa),
        });
      }
    }

    const { scoperti, sovrapposti } = copertura(bb.map((b) => b.periodo), anno, finestra);
    for (const p of scoperti) {
      mancanze.push({
        tipo: "periodo-scoperto",
        chi: "impresa",
        sezione,
        messaggio: `${nomePunto} ${punto}: nessuna bolletta copre il periodo dal ${DATA_LUNGA(p.dal)} al ${DATA_LUNGA(p.al)}.`,
        rimedio: finestra
          ? "Carica le bollette di quel periodo, oppure correggi il periodo di attività dichiarato."
          : "Carica le bollette di quel periodo. Se il contatore è stato attivato o chiuso durante l'anno, dichiara qui il periodo in cui è stato attivo.",
        azione: { etichetta: "Carica le bollette", href: HREF_DOCUMENTI },
        dichiarazione: offriAttivita(ctx, punto, resa),
      });
    }
    for (const p of sovrapposti) {
      mancanze.push({
        tipo: "periodo-sovrapposto",
        chi: "impresa",
        sezione,
        messaggio: `${nomePunto} ${punto}: il periodo dal ${DATA_LUNGA(p.dal)} al ${DATA_LUNGA(p.al)} è coperto da più bollette, e il consumo conterebbe due volte.`,
        rimedio:
          "Controlla se hai caricato due volte la stessa bolletta, o una bolletta e il suo conguaglio: tieni quella giusta ed elimina l'altra dall'archivio, oppure rifiutane periodo e consumo.",
        azione: { etichetta: "Vai ai documenti", href: HREF_DOCUMENTI },
      });
    }
  }

  /* I contatori dell'esercizio precedente che in questo non hanno bollette. */
  const precedenti = new Set(
    altriEsercizi
      .filter((x) => x.punto && !perPunto.has(x.punto) && quotaNellEsercizio(x.periodo, anno - 1).giorniNellEsercizio > 0)
      .map((x) => x.punto!),
  );
  const spenti: AttivitaResa[] = [];
  const scomparsi: string[] = [];
  const inSospeso = nellEsercizio > usabili.length;
  for (const punto of [...precedenti].sort()) {
    const resa = attivitaDichiarata(ctx, punto);
    if (resa?.attivita.inattivo) {
      spenti.push(resa);
      continue;
    }
    scomparsi.push(punto);
    // Se nell'esercizio non c'è nessuna bolletta del tipo, lo dice la
    // sezione intera; se ce ne sono da sistemare, prima quelle — potrebbe
    // essere proprio una bolletta di questo contatore.
    if (usabili.length === 0 || inSospeso) continue;
    if (resa && !resa.attivita.inattivo) {
      for (const p of copertura([], anno, resa.attivita.periodo).scoperti) {
        mancanze.push({
          tipo: "periodo-scoperto",
          chi: "impresa",
          sezione,
          messaggio: `${nomePunto} ${punto}: nessuna bolletta copre il periodo dal ${DATA_LUNGA(p.dal)} al ${DATA_LUNGA(p.al)}, in cui il contatore è stato attivo.`,
          rimedio: "Carica le bollette di quel periodo, oppure correggi il periodo di attività dichiarato.",
          azione: { etichetta: "Carica le bollette", href: HREF_DOCUMENTI },
          dichiarazione: offriAttivita(ctx, punto, resa),
        });
      }
      continue;
    }
    mancanze.push({
      tipo: "documento-mancante",
      chi: "impresa",
      sezione,
      messaggio: `${nomePunto} ${punto}: ci sono bollette del ${anno - 1}, nessuna del ${anno}.`,
      rimedio: `Carica le bollette del ${anno} di questo contatore. Se nel ${anno} è stato chiuso, o è stato attivo solo per una parte dell'anno, dichiaralo qui.`,
      azione: { etichetta: "Carica le bollette", href: HREF_DOCUMENTI },
      dichiarazione: offriAttivita(ctx, punto, null),
    });
  }

  // Le bollette in ordine di contatore e di periodo: è l'ordine in cui le
  // tabelle le mostrano, e quindi quello in cui nascono le loro sigle.
  usabili.sort((a, b) => a.punto.localeCompare(b.punto) || a.periodo.dal.localeCompare(b.periodo.dal));
  return { usabili, mancanze, altriEsercizi, nellEsercizio, attivita, spenti, scomparsi };
}

function applicato(f: FattoreEmissione): FattoreApplicato {
  return { id: f.id, valore: f.valore, unita: f.unita };
}

/** I registri dei carburanti: rifornimenti utilizzabili, registri di altri anni, righe da sistemare. */
function registri(ctx: ContestoComposizione) {
  const anno = ctx.esercizio;
  const sezione = ctx.sezione;
  const mancanze: Mancanza[] = [];
  const rifornimenti: Rifornimento<string>[] = [];
  let nellEsercizio = 0;
  let altriEsercizi = 0;
  let precedenti = 0;

  for (const l of letture(ctx, "carburanti")) {
    const id = l.documento.id;
    const href = `${HREF_DOCUMENTI}/${id}`;
    const celle = ctx.ingresso.campiDocumento.filter((c) => c.document_id === id && c.riga > 0);
    // Tutte le righe scartate dal cliente: non contiene rifornimenti suoi.
    if (celle.length > 0 && celle.every((c) => c.stato === "rifiutato" || !c.valore)) continue;

    const lettura = nonLetto(ctx, l);
    if (lettura) {
      nellEsercizio++;
      mancanze.push(lettura);
      continue;
    }

    const valide: Rifornimento<string>[] = [];
    const incomplete: number[] = [];
    const illeggibili: string[] = [];
    for (const r of l.righe) {
      const dataGrezza = r.celle.get("data")?.valore ?? null;
      const litriGrezzi = r.celle.get("litri")?.valore ?? null;
      const carburante = r.celle.get("tipoCarburante")?.valore ?? null;
      const data = dataCanonica(dataGrezza);
      const litri = numeroCanonico(litriGrezzi);
      const storti = [dataGrezza && !data ? dataGrezza : null, litriGrezzi && litri === null ? litriGrezzi : null].filter(
        (x): x is string => x !== null,
      );
      if (storti.length > 0) {
        illeggibili.push(`riga ${r.riga} («${storti.join("», «")}»)`);
        continue;
      }
      if (!data || !carburante || litri === null) {
        incomplete.push(r.riga);
        continue;
      }
      valide.push({ data, carburante, mezzo: r.celle.get("mezzo")?.valore ?? null, litri, rif: `${id}#${r.riga}` });
    }

    const daSistemare = l.daConfermare > 0 || incomplete.length > 0 || illeggibili.length > 0;
    const nellAnno = valide.some((r) => r.data.startsWith(`${anno}-`));

    if (!daSistemare && valide.length === 0) {
      // Letto, e non ne è uscito niente: né un rifornimento né una riga da
      // confermare. Contarlo come «zero» toglierebbe i mezzi dall'inventario
      // senza che nessuno lo veda.
      nellEsercizio++;
      mancanze.push({
        tipo: "documento-mancante",
        chi: "impresa",
        sezione,
        messaggio: `Il registro carburanti «${l.documento.nome_file}» è stato letto, ma non ne è uscito nessun rifornimento.`,
        rimedio: "Aprilo e controlla: se contiene rifornimenti, rileggilo; se non serve all'inventario, eliminalo dall'archivio.",
        azione: { etichetta: "Apri il registro", href },
      });
      continue;
    }
    if (!daSistemare && !nellAnno) {
      altriEsercizi++;
      if (valide.some((r) => r.data.startsWith(`${anno - 1}-`))) precedenti++;
      continue;
    }

    nellEsercizio++;
    rifornimenti.push(...valide);
    if (l.daConfermare > 0) {
      mancanze.push({
        tipo: "dato-da-confermare",
        chi: "impresa",
        sezione,
        messaggio: `Registro carburanti «${l.documento.nome_file}»: ${l.daConfermare} ${l.daConfermare === 1 ? "riga aspetta" : "righe aspettano"} la tua conferma.`,
        rimedio: "Conferma o scarta le righe: un rifornimento a metà non si può sommare.",
        azione: { etichetta: "Conferma le righe", href },
      });
    }
    if (illeggibili.length > 0) {
      mancanze.push({
        tipo: "valore-non-calcolabile",
        chi: "impresa",
        sezione,
        messaggio: `Registro carburanti «${l.documento.nome_file}»: date o litri che non si possono usare senza indovinare — ${illeggibili.slice(0, 5).join("; ")}${illeggibili.length > 5 ? `, e altre ${illeggibili.length - 5} righe` : ""}.`,
        rimedio: "Riscrivi quei valori nella pagina del registro, come li leggi sul documento: i litri con le loro cifre, le date come giorno, mese e anno.",
        azione: { etichetta: "Correggi le righe", href },
      });
    }
    if (incomplete.length > 0) {
      mancanze.push({
        tipo: "dato-mancante",
        chi: "impresa",
        sezione,
        messaggio: `Registro carburanti «${l.documento.nome_file}»: ${incomplete.length === 1 ? `alla riga ${incomplete[0]} mancano` : `alle righe ${incomplete.slice(0, 8).join(", ")}${incomplete.length > 8 ? "…" : ""} mancano`} data, tipo di carburante o litri.`,
        rimedio: "Completa le righe guardando il documento, oppure scartale se non sono rifornimenti.",
        azione: { etichetta: "Apri il registro", href },
      });
    }
  }
  return { rifornimenti, mancanze, nellEsercizio, altriEsercizi, precedenti };
}

export function inventario(ctx: ContestoComposizione): Inventario {
  const memo = ctx.memoria.get("ghg:inventario") as Inventario | undefined;
  if (memo) return memo;
  const anno = ctx.esercizio;
  const sezione = ctx.sezione;

  /* Energia elettrica */
  const el = bollette(ctx, "bolletta-elettrica");
  const location = fattorePer("energia-elettrica-rete", anno)?.fattore;
  const mercato = fattorePer("energia-elettrica-residuale", anno)?.fattore;
  const mancanzeEl = [...el.mancanze];
  if (el.usabili.length > 0 && !location) mancanzeEl.push(mancanzaFattore(ctx, "energia-elettrica-rete"));
  if (el.usabili.length > 0 && !mercato) mancanzeEl.push(mancanzaFattore(ctx, "energia-elettrica-residuale"));
  const esitoEl =
    el.usabili.length > 0 && location && mercato
      ? calcolaScope2(
          el.usabili.map((b): LetturaPeriodica<string> => ({
            punto: b.punto,
            periodo: b.periodo,
            quantita: b.quantita,
            rinnovabile: b.rinnovabile,
            rif: b.lettura.documento.id,
          })),
          anno,
          { location: applicato(location), mercato: applicato(mercato) },
        )
      : undefined;

  /* Gas naturale */
  const gas = bollette(ctx, "bolletta-gas");
  const fattoreGas = fattorePer("gas-naturale", anno)?.fattore;
  const mancanzeGas = [...gas.mancanze];
  if (gas.usabili.length > 0 && !fattoreGas) mancanzeGas.push(mancanzaFattore(ctx, "gas-naturale"));
  const esitoGas =
    gas.usabili.length > 0 && fattoreGas
      ? combustionePeriodica(
          gas.usabili.map((b) => ({ punto: b.punto, periodo: b.periodo, quantita: b.quantita, rif: b.lettura.documento.id })),
          anno,
          applicato(fattoreGas),
        )
      : undefined;

  /* Carburanti */
  const carb = registri(ctx);
  const mancanzeCarb = [...carb.mancanze];
  const fattoriCarb = new Map<string, FattoreEmissione>();
  const esitoCarb =
    carb.rifornimenti.length > 0
      ? calcolaCarburanti(carb.rifornimenti, anno, (carburante) => {
          const vettore = vettoreCarburante(carburante);
          const scelto = vettore ? fattorePer(vettore, anno)?.fattore : undefined;
          if (scelto) fattoriCarb.set(carburante, scelto);
          return scelto ? applicato(scelto) : undefined;
        })
      : undefined;
  for (const s of esitoCarb?.senzaFattore ?? []) {
    const vettore = vettoreCarburante(s.carburante);
    if (vettore) mancanzeCarb.push(mancanzaFattore(ctx, vettore));
    else {
      mancanzeCarb.push({
        tipo: "valore-non-calcolabile",
        chi: "impresa",
        sezione,
        messaggio: `Nel registro carburanti ci sono ${FORMATO.litri(s.litri)} di «${s.carburante}»: per questo tipo non si calcolano emissioni a litro.`,
        rimedio:
          s.carburante === "elettrico"
            ? "Le ricariche elettriche non sono combustione: scarta quelle righe, il consumo elettrico è già nelle bollette."
            : "Correggi il tipo di carburante sulle righe, o scrivici se è un combustibile che il documento deve includere.",
        azione: { etichetta: "Vai ai documenti", href: HREF_DOCUMENTI },
      });
    }
  }

  /* Lo Scope 1 nel suo insieme: che cosa c'è, che cosa è sparito, che cosa è dichiarato. */
  const gasPresente = gas.nellEsercizio > 0;
  const carbPresente = carb.nellEsercizio > 0;
  const mancanzeScope1: Mancanza[] = [];
  const assenze: AssenzaResa[] = [];
  const combustibili = assenzaDichiarata(ctx, "combustibili");

  const contraddetta = (fonte: AssenzaDichiarabile, documenti: string): Mancanza => ({
    tipo: "dichiarazione-contraddetta",
    chi: "impresa",
    sezione,
    messaggio: `L'organizzazione ha dichiarato che nel ${anno} ${NEGAZIONE_ASSENZA[fonte]}, ma in archivio ci sono ${documenti} di quell'esercizio.`,
    rimedio: "Ritira la dichiarazione, oppure elimina dall'archivio i documenti che non riguardano l'organizzazione: le due cose insieme non possono stare.",
    azione: { etichetta: "Vai ai documenti", href: HREF_DOCUMENTI },
    dichiarazione: offriAssenza(ctx, fonte, true),
  });

  if (combustibili) {
    if (gasPresente || carbPresente) {
      mancanzeScope1.push(
        contraddetta("combustibili", [gasPresente ? "bollette del gas" : null, carbPresente ? "registri dei carburanti" : null].filter(Boolean).join(" e ")),
      );
    } else {
      assenze.push(combustibili);
    }
  } else if (!gasPresente && !carbPresente) {
    const altri = gas.altriEsercizi.length + carb.altriEsercizi > 0;
    mancanzeScope1.push({
      tipo: "documento-mancante",
      chi: "impresa",
      sezione,
      messaggio: `${altri ? `Le bollette del gas e i registri dei carburanti in archivio riguardano altri esercizi: per il ${anno} non ce n'è nessuno` : `Non risultano bollette del gas né registri dei carburanti del ${anno}`}, e lo Scope 1 non si può dichiarare senza sapere se l'organizzazione ha consumato combustibili.`,
      rimedio: `Carica le bollette del gas e i registri o le fatture dei carburanti del ${anno}. Se l'organizzazione non ha consumi diretti di combustibili, dichiaralo qui.`,
      azione: { etichetta: "Carica i documenti", href: HREF_DOCUMENTI },
      dichiarazione: offriAssenza(ctx, "combustibili", false),
    });
  } else {
    // Una parte dello Scope 1 c'è. L'altra, se l'anno prima c'era, va spiegata.
    const fonti: { fonte: AssenzaDichiarabile; presente: boolean; prima: boolean; documenti: string; messaggio: string; rimedio: string }[] = [
      {
        fonte: "gas",
        presente: gasPresente,
        prima: gas.scomparsi.length > 0,
        documenti: "bollette del gas",
        messaggio: `Ci sono bollette del gas del ${anno - 1}, nessuna del ${anno}.`,
        rimedio: `Carica le bollette del gas del ${anno}. Se nel ${anno} l'organizzazione non ha avuto consumi di gas naturale, dichiaralo qui.`,
      },
      {
        fonte: "carburanti",
        presente: carbPresente,
        prima: carb.precedenti > 0,
        documenti: "registri dei carburanti",
        messaggio: `C'è un registro dei carburanti con rifornimenti del ${anno - 1}, nessun rifornimento del ${anno}.`,
        rimedio: `Carica il registro o le fatture dei carburanti del ${anno}. Se nel ${anno} l'organizzazione non ha fatto rifornimenti, dichiaralo qui.`,
      },
    ];
    for (const f of fonti) {
      const resa = assenzaDichiarata(ctx, f.fonte);
      if (resa && f.presente) mancanzeScope1.push(contraddetta(f.fonte, f.documenti));
      else if (resa) assenze.push(resa);
      else if (!f.presente && f.prima) {
        mancanzeScope1.push({
          tipo: "documento-mancante",
          chi: "impresa",
          sezione,
          messaggio: f.messaggio,
          rimedio: f.rimedio,
          azione: { etichetta: "Carica i documenti", href: HREF_DOCUMENTI },
          dichiarazione: offriAssenza(ctx, f.fonte, false),
        });
      }
    }
  }

  const inv: Inventario = {
    esercizio: anno,
    elettrico: {
      bollette: el.usabili,
      esito: esitoEl,
      mancanze: mancanzeEl,
      altriEsercizi: el.altriEsercizi,
      nellEsercizio: el.nellEsercizio,
      attivita: el.attivita,
      spenti: el.spenti,
      scomparsi: el.scomparsi,
      ...(location ? { location } : {}),
      ...(mercato ? { mercato } : {}),
    },
    gas: {
      bollette: gas.usabili,
      esito: esitoGas,
      mancanze: mancanzeGas,
      altriEsercizi: gas.altriEsercizi,
      nellEsercizio: gas.nellEsercizio,
      attivita: gas.attivita,
      spenti: gas.spenti,
      scomparsi: gas.scomparsi,
      ...(fattoreGas ? { fattore: fattoreGas } : {}),
    },
    carburanti: {
      esito: esitoCarb,
      fattori: fattoriCarb,
      mancanze: mancanzeCarb,
      nellEsercizio: carb.nellEsercizio,
      altriEsercizi: carb.altriEsercizi,
      precedenti: carb.precedenti,
    },
    scope1: {
      mancanze: mancanzeScope1,
      assenze,
      perDichiarazione: combustibili !== null && !gasPresente && !carbPresente,
    },
  };
  ctx.memoria.set("ghg:inventario", inv);
  return inv;
}

/* ------------------------------------------------------------------ */
/* Le sigle                                                              */
/* ------------------------------------------------------------------ */

const CAMPI_ELETTRICO = ["pod", "periodoInizio", "periodoFine", "consumoTotaleKwh", "energiaRinnovabile"];
const CAMPI_GAS = ["pdr", "periodoInizio", "periodoFine", "consumoSmc"];

/**
 * Le sigle dei valori di una bolletta usati da un calcolo. Non una D sola:
 * un consumo corretto a mano dal cliente è I, e il calcolo che parte da lì
 * deve dichiararlo fra i suoi ingressi.
 */
function sigleDocumento(ctx: ContestoComposizione, l: LetturaDocumento, campi: string[]): string[] {
  const sigle = new Set<string>();
  for (const k of campi) {
    const c = l.scheda.get(k);
    if (c) sigle.add(valoreLetto(ctx, l, c).fonte!);
  }
  if (sigle.size === 0) sigle.add(fonteDocumento(ctx, l));
  return [...sigle];
}

/** La sigla di un dato fatto di più valori (le due date di un periodo): vince la più lontana dal foglio. */
function siglaDi(ctx: ContestoComposizione, l: LetturaDocumento, campi: string[]): string {
  const sigle = sigleDocumento(ctx, l, campi);
  return sigle.find((s) => s.startsWith("I")) ?? sigle.find((s) => s.startsWith("C")) ?? sigle[0];
}

/** Le sigle delle celle dei rifornimenti usati di un registro. */
function sigleRegistro(ctx: ContestoComposizione, documentoId: string, usati: Set<string>): string[] {
  const l = letture(ctx, "carburanti").find((x) => x.documento.id === documentoId)!;
  const sigle = new Set<string>();
  for (const r of l.righe) {
    if (!usati.has(`${documentoId}#${r.riga}`)) continue;
    for (const k of ["data", "tipoCarburante", "litri"]) {
      const c = r.celle.get(k);
      if (c) sigle.add(valoreLetto(ctx, l, c).fonte!);
    }
  }
  if (sigle.size === 0) sigle.add(fonteDocumento(ctx, l));
  return [...sigle];
}

/** I registri e le righe che contribuiscono all'esercizio. */
function rifornimentiUsati(inv: Inventario) {
  const rif = (inv.carburanti.esito?.perCarburante ?? []).flatMap((c) => c.rif);
  return { usati: new Set(rif), registri: [...new Set(rif.map((r) => r.split("#")[0]))] };
}

function registraCalcolo(
  ctx: ContestoComposizione,
  chiave: string,
  titolo: string,
  procedimento: string,
  ingressi: string[],
): string {
  return ctx.fonti.registra(`calcolo:${chiave}`, () => ({
    tipo: "calcolato",
    titolo,
    dettaglio: [procedimento],
    ingressi: [...new Set(ingressi)],
    confermata: true,
  }));
}

type ChiaveCalcolo =
  | "conteggio"
  | "elettrico-attribuito"
  | "scope2-location"
  | "scope2-market"
  | "gas-attribuito"
  | "gas-emissioni"
  | "carburanti-litri"
  | "carburanti-emissioni"
  | "scope1-totale"
  | "totali";

/**
 * La sigla C di un procedimento. Ognuno dichiara titolo, procedimento e
 * ingressi in UN posto: chi cita un totale in una sezione e chi lo cita
 * nei risultati ottengono la stessa voce, con la stessa descrizione, e le
 * dipendenze si registrano prima di chi le usa.
 */
function calcolo(ctx: ContestoComposizione, inv: Inventario, chiave: ChiaveCalcolo): string {
  switch (chiave) {
    case "conteggio": {
      const { usati, registri } = rifornimentiUsati(inv);
      return registraCalcolo(
        ctx,
        chiave,
        "Documenti e rifornimenti per fonte di emissione",
        "Conteggio delle bollette dell'esercizio per contatore e dei registri e rifornimenti dell'esercizio per tipo di carburante.",
        [
          ...inv.gas.bollette.flatMap((b) => sigleDocumento(ctx, b.lettura, ["pdr"])),
          ...registri.flatMap((d) => sigleRegistro(ctx, d, usati)),
          ...inv.elettrico.bollette.flatMap((b) => sigleDocumento(ctx, b.lettura, ["pod"])),
        ],
      );
    }
    case "elettrico-attribuito":
      return registraCalcolo(
        ctx,
        chiave,
        "Consumo di energia elettrica attribuito all'esercizio",
        "Giorni del periodo compresi nell'esercizio; consumo fatturato × quei giorni ÷ giorni del periodo, bolletta per bolletta; somma.",
        inv.elettrico.bollette.flatMap((b) => sigleDocumento(ctx, b.lettura, CAMPI_ELETTRICO)),
      );
    case "scope2-location": {
      const a = calcolo(ctx, inv, "elettrico-attribuito");
      const f = siglaFattore(ctx, inv.elettrico.location!);
      return registraCalcolo(ctx, chiave, "Emissioni Scope 2, metodo location-based", `Consumo attribuito (${a}) × fattore di emissione della rete nazionale (${f}).`, [a, f]);
    }
    case "scope2-market": {
      const a = calcolo(ctx, inv, "elettrico-attribuito");
      const f = siglaFattore(ctx, inv.elettrico.mercato!);
      return registraCalcolo(
        ctx,
        chiave,
        "Emissioni Scope 2, metodo market-based",
        `Consumo attribuito (${a}) delle forniture non dichiarate rinnovabili in bolletta × mix residuale (${f}); le forniture dichiarate rinnovabili pesano zero.`,
        [a, f, ...inv.elettrico.bollette.flatMap((b) => sigleDocumento(ctx, b.lettura, ["energiaRinnovabile"]))],
      );
    }
    case "gas-attribuito":
      return registraCalcolo(
        ctx,
        chiave,
        "Consumo di gas naturale attribuito all'esercizio",
        "Giorni del periodo compresi nell'esercizio; consumo fatturato × quei giorni ÷ giorni del periodo, bolletta per bolletta; somma.",
        inv.gas.bollette.flatMap((b) => sigleDocumento(ctx, b.lettura, CAMPI_GAS)),
      );
    case "gas-emissioni": {
      const a = calcolo(ctx, inv, "gas-attribuito");
      const f = siglaFattore(ctx, inv.gas.fattore!);
      return registraCalcolo(ctx, chiave, "Emissioni da combustione stazionaria di gas naturale", `Consumo attribuito (${a}) × fattore di emissione del gas naturale (${f}).`, [a, f]);
    }
    case "carburanti-litri": {
      const { usati, registri } = rifornimentiUsati(inv);
      return registraCalcolo(
        ctx,
        chiave,
        "Rifornimenti dell'esercizio per tipo di carburante",
        "Rifornimenti con data nell'esercizio, raggruppati per tipo di carburante: numero e somma dei litri.",
        registri.flatMap((d) => sigleRegistro(ctx, d, usati)),
      );
    }
    case "carburanti-emissioni": {
      const l = calcolo(ctx, inv, "carburanti-litri");
      const f = [...inv.carburanti.fattori.values()].map((x) => siglaFattore(ctx, x));
      return registraCalcolo(ctx, chiave, "Emissioni da combustione mobile", `Litri per tipo di carburante (${l}) × fattore di emissione del carburante (${f.join(", ")}).`, [l, ...f]);
    }
    case "scope1-totale": {
      if (inv.scope1.perDichiarazione) {
        const d = siglaAssenza(ctx, inv.scope1.assenze.find((a) => a.fonte === "combustibili")!);
        return registraCalcolo(
          ctx,
          chiave,
          "Totale Scope 1",
          `Nessuna fonte di emissione diretta: l'organizzazione ha dichiarato di non avere avuto consumi diretti di combustibili nell'esercizio (${d}). Il totale è zero per dichiarazione, non per misura.`,
          [d],
        );
      }
      const parti = [
        ...(inv.gas.esito ? [calcolo(ctx, inv, "gas-emissioni")] : []),
        ...(inv.carburanti.esito?.perCarburante.length ? [calcolo(ctx, inv, "carburanti-emissioni")] : []),
      ];
      return registraCalcolo(ctx, chiave, "Totale Scope 1", `Somma delle emissioni dirette: ${parti.join(" + ")}.`, parti);
    }
    case "totali": {
      const s1 = calcolo(ctx, inv, "scope1-totale");
      const lb = calcolo(ctx, inv, "scope2-location");
      const mb = calcolo(ctx, inv, "scope2-market");
      return registraCalcolo(
        ctx,
        chiave,
        "Totali dell'inventario",
        `Scope 1 (${s1}) + Scope 2 location-based (${lb}); Scope 1 (${s1}) + Scope 2 market-based (${mb}). Le due letture dello Scope 2 sono alternative: non si sommano fra loro.`,
        [s1, lb, mb],
      );
    }
  }
}

/* ------------------------------------------------------------------ */
/* Completezza                                                          */
/* ------------------------------------------------------------------ */

/**
 * Scope 1 completo? Serve ai risultati: un totale con un pezzo mancante non
 * è un totale. Completo vuol dire che ogni fonte presente nell'esercizio è
 * calcolata senza mancanze, che almeno una contribuisce — oppure che
 * l'organizzazione ha dichiarato di non averne, senza smentite.
 */
function scope1Completo(inv: Inventario): boolean {
  if (inv.scope1.mancanze.length > 0) return false;
  if (inv.scope1.perDichiarazione) return true;
  const gasOk = inv.gas.nellEsercizio === 0 || (inv.gas.esito !== undefined && inv.gas.mancanze.length === 0);
  const carbOk =
    inv.carburanti.nellEsercizio === 0 ||
    (inv.carburanti.esito !== undefined && inv.carburanti.esito.perCarburante.length > 0 && inv.carburanti.mancanze.length === 0);
  const contributi = (inv.gas.esito?.righe.length ?? 0) > 0 || (inv.carburanti.esito?.perCarburante.length ?? 0) > 0;
  return gasOk && carbOk && contributi;
}

function scope2Completo(inv: Inventario): boolean {
  return inv.elettrico.esito !== undefined && inv.elettrico.mancanze.length === 0;
}

function kgScope1(inv: Inventario): number {
  return (inv.gas.esito?.emissioni ?? 0) + (inv.carburanti.esito?.emissioni ?? 0);
}

/** Le dichiarazioni che il documento riporta, ciascuna con la sua sigla. */
function noteDichiarazioni(ctx: ContestoComposizione, inv: Inventario): string[] {
  return [
    ...inv.scope1.assenze
      .filter((a) => a.fonte !== "combustibili")
      .map((a) => `Dichiarazione dell'organizzazione (${siglaAssenza(ctx, a)}): «${testoAssenza(a.fonte, ctx.esercizio)}»`),
    ...[...inv.gas.spenti, ...inv.elettrico.spenti].map(
      (s) => `Dichiarazione dell'organizzazione (${siglaAttivita(ctx, s)}): «${testoAttivita(s.punto, ctx.esercizio, s.attivita)}»`,
    ),
  ];
}

/* ------------------------------------------------------------------ */
/* I compositori                                                        */
/* ------------------------------------------------------------------ */

const TIPI_GHG = ["bolletta-elettrica", "bolletta-gas", "carburanti"];

/** Il perimetro operativo: quali fonti di emissione l'inventario include, e da quali documenti. */
const sorgenti: Compositore = {
  tipi: TIPI_GHG,
  componi(ctx) {
    const inv = inventario(ctx);
    const righe: Cella[][] = [];
    const conteggio = () => calcolo(ctx, inv, "conteggio");

    const perPunto = (bollette: Bolletta[], campo: string, categoria: string, fonte: string) => {
      const punti = new Map<string, Bolletta[]>();
      for (const b of bollette) punti.set(b.punto, [...(punti.get(b.punto) ?? []), b]);
      for (const [punto, bb] of punti) {
        righe.push([
          categoria,
          fonte,
          { testo: punto, fonte: siglaDi(ctx, bb[0].lettura, [campo]) },
          { testo: conta(bb.length, "bolletta", "bollette"), fonte: conteggio(), numero: bb.length },
        ]);
      }
    };
    perPunto(inv.gas.bollette, "pdr", "Categoria 1 — emissioni dirette (Scope 1)", "Combustione stazionaria — gas naturale");
    for (const c of inv.carburanti.esito?.perCarburante ?? []) {
      const registri = new Set(c.rif.map((r) => r.split("#")[0])).size;
      righe.push([
        "Categoria 1 — emissioni dirette (Scope 1)",
        `Combustione mobile — ${c.carburante}`,
        { testo: conta(registri, "registro", "registri"), fonte: conteggio(), numero: registri },
        { testo: conta(c.rifornimenti, "rifornimento", "rifornimenti"), fonte: conteggio(), numero: c.rifornimenti },
      ]);
    }
    if (inv.scope1.perDichiarazione) {
      righe.push([
        "Categoria 1 — emissioni dirette (Scope 1)",
        "Nessuna combustione diretta",
        { testo: "per dichiarazione dell'organizzazione", fonte: siglaAssenza(ctx, inv.scope1.assenze.find((a) => a.fonte === "combustibili")!) },
        "—",
      ]);
    }
    perPunto(inv.elettrico.bollette, "pod", "Categoria 2 — emissioni indirette da energia importata (Scope 2)", "Energia elettrica prelevata dalla rete");

    const mancanze: Mancanza[] = [];
    const nellEsercizio = inv.elettrico.nellEsercizio + inv.gas.nellEsercizio + inv.carburanti.nellEsercizio;
    if (nellEsercizio === 0 && !inv.scope1.perDichiarazione) {
      const altri = inv.elettrico.altriEsercizi.length + inv.gas.altriEsercizi.length + inv.carburanti.altriEsercizi;
      mancanze.push({
        tipo: "documento-mancante",
        chi: "impresa",
        sezione: ctx.sezione,
        messaggio:
          altri > 0
            ? `I documenti di consumo in archivio riguardano altri esercizi: per il ${ctx.esercizio} non ce n'è ancora nessuno.`
            : "Non risulta ancora nessun documento di consumo letto: senza, l'inventario non ha fonti di emissione da dichiarare.",
        rimedio: `Carica le bollette di energia elettrica e gas e i registri dei carburanti del ${ctx.esercizio}.`,
        azione: { etichetta: "Carica i documenti", href: HREF_DOCUMENTI },
      });
    }

    const note = righe.length > 0 ? noteDichiarazioni(ctx, inv) : [];
    return {
      blocchi:
        righe.length > 0
          ? [
              {
                tipo: "tabella",
                didascalia: "Fonti di emissione incluse nell'inventario",
                colonne: [
                  { titolo: "Categoria", peso: 1.45 },
                  { titolo: "Fonte di emissione", peso: 1.3 },
                  { titolo: "Punto o registro", peso: 1.25 },
                  { titolo: "Documenti", peso: 0.8 },
                ],
                righe,
                ...(note.length > 0 ? { note } : {}),
              },
            ]
          : [],
      mancanze,
      piena: righe.length > 0,
    };
  },
};

/** I fattori usati, con la loro fonte per esteso. */
const fattori: Compositore = {
  tipi: TIPI_GHG,
  componi(ctx) {
    const inv = inventario(ctx);
    const usati: FattoreEmissione[] = [
      ...(inv.elettrico.esito && inv.elettrico.location ? [inv.elettrico.location] : []),
      ...(inv.elettrico.esito && inv.elettrico.mercato ? [inv.elettrico.mercato] : []),
      ...(inv.gas.esito && inv.gas.fattore ? [inv.gas.fattore] : []),
      ...inv.carburanti.fattori.values(),
    ];
    const unici = [...new Map(usati.map((f) => [f.id, f])).values()];
    const righe: Cella[][] = unici.map((f) => [
      NOME_VETTORE[f.vettore],
      { testo: FORMATO.fattore(f), fonte: siglaFattore(ctx, f), numero: f.valore },
      f.gas === "CO2" ? "Sola CO₂" : `CO₂ equivalente, ${f.gwp ?? "GWP non indicato"}`,
      `${f.esercizio}${f.preliminare ? " (preliminare)" : ""}`,
    ]);
    // Che cosa comprendono i fattori lo dicono i fattori: un paragrafo fisso
    // nel modello resterebbe vero solo finché nessuno cambia il registro.
    const soloCo2 = unici.filter((f) => f.gas === "CO2").map((f) => NOME_VETTORE[f.vettore].toLowerCase());
    const gwp = [...new Set(unici.filter((f) => f.gas === "CO2e" && f.gwp).map((f) => f.gwp!))];
    const note = [
      ...(soloCo2.length > 0
        ? [`I fattori per ${soloCo2.join(" e ")} comprendono la sola CO₂: CH₄ e N₂O di quelle fonti non sono quantificati.`]
        : []),
      ...(gwp.length > 0 ? [`Gli altri fattori sono espressi in CO₂ equivalente con i potenziali di riscaldamento globale ${gwp.join("; ")}.`] : []),
      ...(inv.carburanti.fattori.size > 0
        ? [
            "I fattori dei carburanti sono quelli dei prodotti interamente fossili: l'eventuale quota di biocarburante dei carburanti commerciali è conteggiata come fossile, e non c'è CO₂ biogenica da rendicontare separatamente.",
          ]
        : []),
      ...unici
        .filter((f) => f.esercizio !== ctx.esercizio)
        .map(
          (f) =>
            `Per «${NOME_VETTORE[f.vettore]}» il dato dell'esercizio ${ctx.esercizio} non è ancora pubblicato: si usa l'ultimo disponibile, dell'esercizio ${f.esercizio}.`,
        ),
      ...unici.filter((f) => f.preliminare && f.nota).map((f) => f.nota!),
    ];

    const mancanze = [...inv.elettrico.mancanze, ...inv.gas.mancanze, ...inv.carburanti.mancanze].filter(
      (m) => m.tipo === "fattore-mancante",
    );
    if (righe.length === 0 && mancanze.length === 0) {
      // Nessun fattore da mostrare perché non c'è ancora niente da
      // calcolare: la tabella nasce dai consumi, e il rimedio è lì.
      mancanze.push({
        tipo: "dato-mancante",
        chi: "impresa",
        sezione: ctx.sezione,
        messaggio:
          "La tabella dei fattori di emissione si compone dai consumi confermati: finché non ce ne sono, la metodologia non ha fattori da dichiarare.",
        rimedio: "Completa prima le sezioni sullo Scope 1 e sullo Scope 2.",
      });
    }
    return {
      blocchi:
        righe.length > 0
          ? [
              {
                tipo: "tabella",
                didascalia: "Fattori di emissione applicati",
                colonne: [
                  { titolo: "Vettore", peso: 1.55 },
                  { titolo: "Fattore", allinea: "destra", peso: 1.15 },
                  { titolo: "Gas inclusi", peso: 1.35 },
                  { titolo: "Anno del dato", peso: 0.75 },
                ],
                righe,
                ...(note.length > 0 ? { note } : {}),
              },
            ]
          : [],
      mancanze: mancanze.map((m) => ({ ...m, sezione: ctx.sezione })),
      piena: righe.length > 0 && mancanze.length === 0,
    };
  },
};

/** La tabella delle bollette di un contatore, con la quota attribuita all'esercizio. */
function tabellaBollette(
  ctx: ContestoComposizione,
  area: Inventario["elettrico"] | Inventario["gas"],
  righeAttribuite: EsitoScope2<string>["righe"] | EsitoCombustione<string>["righe"],
  punto: string,
  unita: "kWh" | "Smc",
  siglaAttribuito: string,
): Blocco {
  const elettrica = unita === "kWh";
  const fmt = elettrica ? FORMATO.kwh : FORMATO.smc;
  const chiaveQuantita = elettrica ? "consumoTotaleKwh" : "consumoSmc";
  const righe = righeAttribuite.filter((r) => r.punto === punto);
  const bolletta = (rif: string) => area.bollette.find((x) => x.lettura.documento.id === rif)!;
  const celle: Cella[][] = righe.map((r) => {
    const b = bolletta(r.rif);
    const riga: Cella[] = [
      { testo: FORMATO.periodo(r.periodo), fonte: siglaDi(ctx, b.lettura, ["periodoInizio", "periodoFine"]) },
      valoreLetto(ctx, b.lettura, b.lettura.scheda.get(chiaveQuantita)!, fmt(r.quantita)),
      { testo: `${r.giorniNellEsercizio} di ${r.giorniPeriodo}`, fonte: siglaAttribuito, numero: r.giorniNellEsercizio },
      { testo: fmt(r.attribuita), fonte: siglaAttribuito, numero: r.attribuita },
    ];
    if (elettrica) {
      const c = b.lettura.scheda.get("energiaRinnovabile");
      riga.push(
        c
          ? valoreLetto(ctx, b.lettura, c, c.valore === "si" ? "rinnovabile" : c.valore === "no" ? "non rinnovabile" : "non dichiarata")
          : "non dichiarata",
      );
    }
    return riga;
  });
  const totaleFatturato = righe.reduce((t, r) => t + r.quantita, 0);
  const totaleAttribuito = righe.reduce((t, r) => t + r.attribuita, 0);
  const cavalca = righe.filter((r) => r.giorniNellEsercizio < r.giorniPeriodo);
  const somma = registraCalcolo(
    ctx,
    `somma-fatturato-${punto}`,
    `Consumo fatturato del punto ${punto}`,
    "Somma dei consumi delle bollette del punto che toccano l'esercizio.",
    righe.flatMap((r) => sigleDocumento(ctx, bolletta(r.rif).lettura, [chiaveQuantita])),
  );
  const attivita = area.attivita.get(punto);
  const note = [
    ...(cavalca.length > 0
      ? [
          `${cavalca.length === 1 ? "Una bolletta cade" : `${cavalca.length} bollette cadono`} a cavallo dell'esercizio: ${cavalca.length === 1 ? "pesa" : "pesano"} sul ${ctx.esercizio} solo per i giorni che vi cadono.`,
        ]
      : []),
    ...(attivita
      ? [`Dichiarazione dell'organizzazione (${siglaAttivita(ctx, attivita)}): «${testoAttivita(punto, ctx.esercizio, attivita.attivita)}» Le bollette coprono quel periodo.`]
      : []),
  ];
  return {
    tipo: "tabella",
    didascalia: `${elettrica ? "Bollette di energia elettrica — POD" : "Bollette del gas naturale — PDR"} ${punto}`,
    colonne: [
      { titolo: "Periodo", peso: 1.55 },
      { titolo: "Fatturato", allinea: "destra", peso: 0.95 },
      { titolo: `Giorni nel ${ctx.esercizio}`, allinea: "destra", peso: 0.8 },
      { titolo: `Attribuito al ${ctx.esercizio}`, allinea: "destra", peso: 1 },
      ...(elettrica ? [{ titolo: "Fornitura", peso: 1.1 }] : []),
    ],
    righe: celle,
    totale: [
      "Totale",
      { testo: fmt(totaleFatturato), fonte: somma, numero: totaleFatturato, forte: true },
      "",
      { testo: fmt(totaleAttribuito), fonte: siglaAttribuito, numero: totaleAttribuito, forte: true },
      ...(elettrica ? [""] : []),
    ],
    ...(note.length > 0 ? { note } : {}),
  };
}

const scope1: Compositore = {
  tipi: ["bolletta-gas", "carburanti"],
  componi(ctx) {
    const inv = inventario(ctx);
    const blocchi: Blocco[] = [];
    const mancanze: Mancanza[] = [...inv.gas.mancanze, ...inv.carburanti.mancanze, ...inv.scope1.mancanze]
      .filter((m) => m.tipo !== "fattore-mancante")
      .map((m) => ({ ...m, sezione: ctx.sezione }));

    /* Nessuna combustione diretta, per dichiarazione */
    if (inv.scope1.perDichiarazione) {
      const sigla = siglaAssenza(ctx, inv.scope1.assenze.find((a) => a.fonte === "combustibili")!);
      const totale = calcolo(ctx, inv, "scope1-totale");
      blocchi.push(
        {
          tipo: "riquadro",
          titolo: "Dichiarazione dell'organizzazione",
          testo: `«${testoAssenza("combustibili", ctx.esercizio)}» (${sigla}). Le emissioni dirette di questo inventario sono pari a zero **per dichiarazione, non per misura**.`,
        },
        {
          tipo: "cifre",
          voci: [
            {
              etichetta: "Scope 1 — emissioni dirette dell'esercizio",
              valore: { testo: FORMATO.t(0), fonte: totale, numero: 0 },
              nota: `per dichiarazione dell'organizzazione (${sigla})`,
            },
          ],
        },
      );
      return { blocchi, mancanze, piena: true };
    }

    /* Gas */
    if (inv.gas.esito && inv.gas.fattore) {
      const attribuito = calcolo(ctx, inv, "gas-attribuito");
      const emissioni = calcolo(ctx, inv, "gas-emissioni");
      blocchi.push({ tipo: "sottotitolo", testo: "Combustione stazionaria — gas naturale" });
      for (const p of inv.gas.esito.perPunto) {
        blocchi.push(tabellaBollette(ctx, inv.gas, inv.gas.esito.righe, p.punto, "Smc", attribuito));
      }
      blocchi.push({
        tipo: "coppie",
        righe: [
          {
            etichetta: "Gas naturale attribuito all'esercizio",
            valore: { testo: FORMATO.smc(inv.gas.esito.quantita), fonte: attribuito, numero: inv.gas.esito.quantita },
          },
          {
            etichetta: "Fattore di emissione",
            valore: { testo: FORMATO.fattore(inv.gas.fattore), fonte: siglaFattore(ctx, inv.gas.fattore), numero: inv.gas.fattore.valore },
          },
          {
            etichetta: "Emissioni da combustione stazionaria",
            valore: { testo: FORMATO.t(inv.gas.esito.emissioni), fonte: emissioni, numero: inv.gas.esito.emissioni, forte: true },
          },
        ],
      });
    }

    /* Carburanti */
    const esito = inv.carburanti.esito;
    if (esito && esito.perCarburante.length > 0 && esito.senzaFattore.length === 0) {
      const litri = calcolo(ctx, inv, "carburanti-litri");
      const emissioni = calcolo(ctx, inv, "carburanti-emissioni");
      const righe: Cella[][] = esito.perCarburante.map((c) => {
        const f = inv.carburanti.fattori.get(c.carburante)!;
        return [
          MAIUSCOLA(c.carburante),
          { testo: String(c.rifornimenti), fonte: litri, numero: c.rifornimenti },
          { testo: FORMATO.litri(c.litri), fonte: litri, numero: c.litri },
          { testo: FORMATO.fattore(f), fonte: siglaFattore(ctx, f), numero: f.valore },
          { testo: FORMATO.t(c.emissioni), fonte: emissioni, numero: c.emissioni },
        ];
      });
      const totaleRifornimenti = esito.perCarburante.reduce((t, c) => t + c.rifornimenti, 0);
      blocchi.push({ tipo: "sottotitolo", testo: "Combustione mobile — carburanti" });
      blocchi.push({
        tipo: "tabella",
        didascalia: "Rifornimenti dell'esercizio per tipo di carburante",
        colonne: [
          { titolo: "Carburante", peso: 0.9 },
          { titolo: "Rifornimenti", allinea: "destra", peso: 0.8 },
          { titolo: "Quantità", allinea: "destra", peso: 1 },
          { titolo: "Fattore", allinea: "destra", peso: 1.25 },
          { titolo: "Emissioni", allinea: "destra", peso: 1.05 },
        ],
        righe,
        totale: [
          "Totale",
          { testo: String(totaleRifornimenti), fonte: litri, numero: totaleRifornimenti, forte: true },
          "",
          "",
          { testo: FORMATO.t(esito.emissioni), fonte: emissioni, numero: esito.emissioni, forte: true },
        ],
        ...(esito.fuori.length > 0
          ? {
              note: [
                `${esito.fuori.length} ${esito.fuori.length === 1 ? "rifornimento ha" : "rifornimenti hanno"} una data fuori dall'esercizio ${ctx.esercizio}: ${esito.fuori.length === 1 ? "non è conteggiato" : "non sono conteggiati"}.`,
              ],
            }
          : {}),
      });
    }

    const completo = scope1Completo(inv);
    if (completo) {
      const totale = calcolo(ctx, inv, "scope1-totale");
      blocchi.push({
        tipo: "cifre",
        voci: [
          {
            etichetta: "Scope 1 — emissioni dirette dell'esercizio",
            valore: { testo: FORMATO.t(kgScope1(inv)), fonte: totale, numero: kgScope1(inv) },
          },
        ],
      });
    }

    return { blocchi, mancanze, piena: completo };
  },
};

const scope2: Compositore = {
  tipi: ["bolletta-elettrica"],
  componi(ctx) {
    const inv = inventario(ctx);
    const mancanze = inv.elettrico.mancanze
      .filter((m) => m.tipo !== "fattore-mancante")
      .map((m) => ({ ...m, sezione: ctx.sezione }));
    const blocchi: Blocco[] = [];
    const esito = inv.elettrico.esito;

    if (inv.elettrico.nellEsercizio === 0) {
      const altri = inv.elettrico.altriEsercizi.length > 0;
      mancanze.push({
        tipo: "documento-mancante",
        chi: "impresa",
        sezione: ctx.sezione,
        messaggio: `${altri ? "Le bollette di energia elettrica in archivio riguardano altri esercizi: non" : "Non"} risultano bollette del ${ctx.esercizio}, e lo Scope 2 si calcola da quelle.`,
        rimedio: `Carica le bollette elettriche dei 12 mesi del ${ctx.esercizio}, una serie per ogni contatore. Se l'energia è compresa nell'affitto e non hai bollette, scrivici: è un caso da valutare prima di dichiarare lo Scope 2.`,
        azione: { etichetta: "Carica le bollette", href: HREF_DOCUMENTI },
      });
    }

    if (esito && inv.elettrico.location && inv.elettrico.mercato) {
      const attribuito = calcolo(ctx, inv, "elettrico-attribuito");
      const lb = calcolo(ctx, inv, "scope2-location");
      const mb = calcolo(ctx, inv, "scope2-market");
      const fLoc = siglaFattore(ctx, inv.elettrico.location);
      const fMer = siglaFattore(ctx, inv.elettrico.mercato);

      for (const p of esito.perPunto) {
        blocchi.push(tabellaBollette(ctx, inv.elettrico, esito.righe, p.punto, "kWh", attribuito));
      }
      if (esito.perPunto.length > 1) {
        blocchi.push({
          tipo: "tabella",
          didascalia: "Riepilogo per contatore",
          colonne: [
            { titolo: "POD", peso: 1.3 },
            { titolo: "Consumo attribuito", allinea: "destra" },
            { titolo: "Location-based", allinea: "destra" },
            { titolo: "Market-based", allinea: "destra" },
          ],
          righe: esito.perPunto.map((p) => [
            p.punto,
            { testo: FORMATO.kwh(p.attribuita), fonte: attribuito, numero: p.attribuita },
            { testo: FORMATO.t(p.location), fonte: lb, numero: p.location },
            { testo: FORMATO.t(p.mercato), fonte: mb, numero: p.mercato },
          ]),
        });
      }
      blocchi.push({
        tipo: "cifre",
        voci: [
          {
            etichetta: "Scope 2 — metodo location-based",
            valore: { testo: FORMATO.t(esito.location), fonte: lb, numero: esito.location },
            nota: `${FORMATO.kwh(esito.kwh)} (${attribuito}) × ${FORMATO.fattore(inv.elettrico.location)} (${fLoc})`,
          },
          {
            etichetta: "Scope 2 — metodo market-based",
            valore: { testo: FORMATO.t(esito.mercato), fonte: mb, numero: esito.mercato },
            nota: `mix residuale ${FORMATO.fattore(inv.elettrico.mercato)} (${fMer})`,
          },
          {
            etichetta: "Quota da forniture dichiarate rinnovabili",
            valore: {
              testo: FORMATO.percento(esito.kwh > 0 ? esito.kwhRinnovabili / esito.kwh : 0),
              fonte: attribuito,
              numero: esito.kwhRinnovabili,
            },
            nota: `${FORMATO.kwh(esito.kwhRinnovabili)} su ${FORMATO.kwh(esito.kwh)} (${attribuito})`,
          },
        ],
      });
    }

    return { blocchi, mancanze, piena: scope2Completo(inv) };
  },
};

const risultati: Compositore = {
  tipi: [...TIPI_GHG, "visura"],
  componi(ctx) {
    const inv = inventario(ctx);
    if (!scope1Completo(inv) || !scope2Completo(inv)) {
      return {
        blocchi: [],
        mancanze: [
          {
            tipo: "dato-mancante",
            chi: "impresa",
            sezione: ctx.sezione,
            messaggio: "I totali dell'inventario si calcolano solo quando lo Scope 1 e lo Scope 2 sono completi.",
            rimedio: "Completa prima quelle due sezioni: i risultati si compongono da soli.",
          },
        ],
        piena: false,
      };
    }
    const s1 = kgScope1(inv);
    const s2l = inv.elettrico.esito!.location;
    const s2m = inv.elettrico.esito!.mercato;
    const siglaS1 = calcolo(ctx, inv, "scope1-totale");
    const siglaLb = calcolo(ctx, inv, "scope2-location");
    const siglaMb = calcolo(ctx, inv, "scope2-market");
    const totali = calcolo(ctx, inv, "totali");

    const cifre: Extract<Blocco, { tipo: "cifre" }>["voci"] = [
      { etichetta: "Totale Scope 1 e 2 — location-based", valore: { testo: FORMATO.t(s1 + s2l), fonte: totali, numero: s1 + s2l } },
      { etichetta: "Totale Scope 1 e 2 — market-based", valore: { testo: FORMATO.t(s1 + s2m), fonte: totali, numero: s1 + s2m } },
    ];

    // L'intensità per addetto, solo se il numero di addetti è confermato e
    // scritto come un numero: un rapporto su un denominatore incerto è un
    // dato incerto.
    let addetti: { n: number; fonte: string } | null = null;
    const scheda = campoScheda(ctx, "dipendenti");
    const nScheda = scheda.stato === "confermato" ? numeroCanonico(scheda.valore) : null;
    if (scheda.stato === "confermato" && nScheda !== null && nScheda > 0) {
      addetti = { n: nScheda, fonte: scheda.fonte };
    } else {
      for (const l of letture(ctx, "visura")) {
        const c = l.scheda.get("addetti");
        const n = numeroCanonico(c?.valore);
        if (c && n !== null && n > 0) {
          addetti = { n, fonte: valoreLetto(ctx, l, c).fonte! };
          break;
        }
      }
    }
    if (addetti) {
      const intensita = registraCalcolo(
        ctx,
        "intensita",
        "Intensità emissiva per addetto",
        `Totale location-based (${totali}) ÷ numero di addetti (${addetti.fonte}).`,
        [totali, addetti.fonte],
      );
      cifre.push({
        etichetta: "Intensità per addetto — location-based",
        valore: { testo: FORMATO.t((s1 + s2l) / addetti.n), fonte: intensita, numero: (s1 + s2l) / addetti.n },
        nota: `${addetti.n} addetti (${addetti.fonte})`,
      });
    }

    const righe: Cella[][] = [];
    if (inv.gas.esito) {
      const sigla = calcolo(ctx, inv, "gas-emissioni");
      const v: Valore = { testo: FORMATO.t(inv.gas.esito.emissioni), fonte: sigla, numero: inv.gas.esito.emissioni };
      righe.push(["Categoria 1 — Scope 1", "Combustione stazionaria — gas naturale", v, v]);
    }
    if (inv.carburanti.esito?.perCarburante.length) {
      const sigla = calcolo(ctx, inv, "carburanti-emissioni");
      const v: Valore = { testo: FORMATO.t(inv.carburanti.esito.emissioni), fonte: sigla, numero: inv.carburanti.esito.emissioni };
      righe.push(["Categoria 1 — Scope 1", "Combustione mobile — carburanti", v, v]);
    }
    if (inv.scope1.perDichiarazione) {
      const v: Valore = { testo: FORMATO.t(0), fonte: siglaS1, numero: 0 };
      righe.push(["Categoria 1 — Scope 1", "Nessuna combustione diretta, per dichiarazione", v, v]);
    }
    righe.push([
      "Categoria 2 — Scope 2",
      "Energia elettrica acquistata",
      { testo: FORMATO.t(s2l), fonte: siglaLb, numero: s2l },
      { testo: FORMATO.t(s2m), fonte: siglaMb, numero: s2m },
    ]);

    const rifornimenti = (inv.carburanti.esito?.perCarburante ?? []).reduce((t, c) => t + c.rifornimenti, 0);
    const documenti = [
      inv.elettrico.bollette.length ? conta(inv.elettrico.bollette.length, "bolletta di energia elettrica", "bollette di energia elettrica") : "",
      inv.gas.bollette.length ? conta(inv.gas.bollette.length, "bolletta del gas", "bollette del gas") : "",
      rifornimenti ? conta(rifornimenti, "rifornimento registrato", "rifornimenti registrati") : "",
    ].filter(Boolean);
    const dichiarazioni =
      inv.scope1.assenze.length + inv.gas.spenti.length + inv.elettrico.spenti.length + inv.gas.attivita.size + inv.elettrico.attivita.size;

    return {
      blocchi: [
        { tipo: "cifre", voci: cifre },
        {
          tipo: "barre",
          titolo: "Emissioni dell'esercizio nelle due letture dello Scope 2",
          unita: "t CO₂e",
          parti: ["Scope 1", "Scope 2"],
          serie: [
            { etichetta: "Location-based", valori: [s1 / 1000, s2l / 1000], totale: { testo: FORMATO.t(s1 + s2l), fonte: totali, numero: s1 + s2l } },
            { etichetta: "Market-based", valori: [s1 / 1000, s2m / 1000], totale: { testo: FORMATO.t(s1 + s2m), fonte: totali, numero: s1 + s2m } },
          ],
        },
        {
          tipo: "tabella",
          didascalia: "Emissioni per categoria",
          colonne: [
            { titolo: "Categoria", peso: 1 },
            { titolo: "Fonte di emissione", peso: 1.5 },
            { titolo: "Location-based", allinea: "destra" },
            { titolo: "Market-based", allinea: "destra" },
          ],
          righe,
          totale: [
            "Totale",
            "",
            { testo: FORMATO.t(s1 + s2l), fonte: totali, numero: s1 + s2l, forte: true },
            { testo: FORMATO.t(s1 + s2m), fonte: totali, numero: s1 + s2m, forte: true },
          ],
        },
        {
          tipo: "riquadro",
          titolo: "Qualità del dato",
          testo: `Le quantità di attività di questo inventario vengono da documenti dell'organizzazione confermati prima del calcolo — ${documenti.join(", ")}${dichiarazioni > 0 ? " — e dalle sue dichiarazioni, riportate con la loro sigla" : ""}. **Nessun consumo è stimato.** Le sole elaborazioni sono l'attribuzione all'esercizio delle bollette a cavallo d'anno, le somme e i prodotti per i fattori di emissione, ciascuna con la sua sigla.`,
        },
      ],
      mancanze: [],
      piena: true,
    };
  },
};

registraCompositori({
  "ghg:sorgenti": sorgenti,
  "ghg:fattori": fattori,
  "ghg:scope1": scope1,
  "ghg:scope2": scope2,
  "ghg:risultati": risultati,
});
