import type {
  CampoGrezzo,
  EtichettaCampo,
  FonteLettura,
  Qualita,
  RigaGrezza,
  TipoValore,
} from "./schemi";

/**
 * DOPO LA FORMA, IL SENSO (docs/motore.md §4).
 *
 * Lo schema dice che `consumoTotaleKwh` è un numero. Non dice nulla su
 * quattro miliardi di kWh, su un periodo che finisce prima di cominciare,
 * su un POD che non ha la forma di un POD, o sulle tre fasce che sommate
 * danno il doppio del totale. Quei controlli sono NOSTRI, girano lato
 * server e non dipendono da quello che il modello promette.
 *
 * Due regole di condotta, entrambe importanti quanto i controlli:
 *
 * 1. UNO SCARTO NON BLOCCA. Abbassa la confidenza e si SEGNALA in chiaro,
 *    perché la bolletta potrebbe avere ragione e la nostra regola torto —
 *    i fornitori impaginano in modi che non abbiamo previsto, e scartare
 *    un dato vero perché non rispetta una nostra aspettativa è un modo
 *    silenzioso di sbagliare.
 * 2. NIENTE SI SCARTA IN SILENZIO. Ogni correzione che facciamo al dato
 *    del modello lascia una traccia che il cliente vede.
 */

export type CampoEstratto = {
  chiave: string;
  etichetta: string;
  /** Il valore canonico, sempre come testo: la formattazione è resa. */
  valore: string | null;
  unita: string | null;
  confidenza: number;
  pagina: number | null;
  estrattoDa: string | null;
  fonteLettura: FonteLettura;
  nota: string | null;
  /** Quello che non torna, detto al cliente in italiano. */
  avvisi: string[];
};

/** Il tetto di confidenza per ciò che è stato letto da una scrittura a
 *  mano. Lo impone il nostro codice, non il prompt: una regola affidata
 *  alle istruzioni è una regola che il modello può disattendere. */
export const TETTO_MANOSCRITTO = 0.6;

/** Quanto si abbassa tutto quando la scansione è faticosa da leggere. */
export const PENALITA_QUALITA_FATICOSA = 0.2;

/* ------------------------------------------------------------------ */
/* Il completamento: un valore non può sapere più del documento        */
/* ------------------------------------------------------------------ */

/**
 * ═══ REGOLA INVIOLABILE — IL VALORE NON AGGIUNGE ═══
 *
 * Misurato su un registro presenze compilato a mano, letto tre volte di
 * fila con lo stesso modello e lo stesso prompt. Sul foglio la data è
 * «28/08» e basta: due letture su tre hanno lasciato il campo vuoto
 * spiegando che l'anno non c'è, la terza ha scritto **2025-08-28** —
 * completando con l'anno di rendicontazione che siamo NOI a passare nel
 * contesto. E la confidenza era 0,42 in tutte e tre: non distingueva la
 * lettura giusta da quella inventata.
 *
 * È il difetto peggiore che possa avere un motore che produce documenti
 * firmati da un professionista, perché non si vede: un dato inventato
 * con la stessa confidenza di uno letto passa la revisione come gli
 * altri.
 *
 * ═══ PERCHÉ STA QUI E NON NELLE ISTRUZIONI ═══
 * Nelle istruzioni c'era già («mai un valore inventato», e lo dice pure
 * lo schema). Una regola affidata al prompt è una regola che il modello
 * disattende una volta su tre — l'abbiamo appena contato. Qui è
 * aritmetica: si confronta il valore con ciò che il modello DICHIARA di
 * aver letto, e se il valore porta cifre che in quella stringa non
 * compaiono, il valore non vale.
 *
 * ═══ COME, ESATTAMENTE ═══
 * Si confrontano i gruppi di cifre. Il flusso di cifre della fonte si
 * concatena — «3.187,45» e «28/08» diventano «318745» e «2808» — e ogni
 * gruppo del valore dev'esserci dentro. Concatenare è VOLUTAMENTE
 * permissivo: separatori di migliaia, punti e barre non devono far
 * scattare l'allarme, e questo controllo deve accendersi solo quando è
 * certo. Bloccare un valore giusto costa la fiducia in tutti gli altri.
 *
 * Senza `estrattoDa` non si giudica: non avere la citazione non è la
 * prova che il dato sia inventato, è l'assenza di prove.
 */
const CIFRE = /\d+/g;

export function completatoOltreLaFonte(
  valore: string | null,
  fonte: string | null | undefined,
): boolean {
  if (!valore || !fonte) return false;
  const nelValore = valore.match(CIFRE);
  if (!nelValore || nelValore.length === 0) return false;
  const flusso = (fonte.match(CIFRE) ?? []).join("");
  if (flusso === "") return false;
  return nelValore.some((gruppo) => !flusso.includes(gruppo));
}

/**
 * Il campo è di quelli che si possono COMPLETARE?
 *
 * Le date sempre: una data si legge, non si deduce, e l'anno mancante è
 * il caso da manuale. I numeri solo se dichiarato, perché alcuni si
 * ricavano davvero dal documento senza esserci scritti — le ore di un
 * corso stanno fra l'ingresso e l'uscita, i partecipanti si contano
 * dalle firme — e bloccarli sarebbe rifiutare una deduzione legittima.
 * Importi e consumi invece si leggono: lì `soloSeScritto` va dichiarato.
 */
export function soggettoACompletamento(campo: EtichettaCampo): boolean {
  return campo.tipo === "data" || campo.soloSeScritto === true;
}

/** Come si dice al cliente, senza dargli del bugiardo e senza gergo. */
export function notaCompletamento(etichetta: string): string {
  return `${etichetta}: sul documento non c'è per intero, e non lo completiamo noi. Scrivilo tu.`;
}

/* ------------------------------------------------------------------ */
/* Limiti e forme                                                      */
/* ------------------------------------------------------------------ */


/** Prezzo per kWh oltre il quale il rapporto importo/consumo non regge. */
const EURO_PER_KWH_MAX = 3;
const EURO_PER_KWH_MIN = 0.03;
/** Un periodo di fatturazione più lungo di così non è un periodo. */
const GIORNI_MASSIMI = 400;
/** Tolleranza sulla somma delle fasce: 2%, con un minimo assoluto. */
const TOLLERANZA_FASCE = 0.02;
const TOLLERANZA_FASCE_MINIMA = 5;

/* ------------------------------------------------------------------ */
/* Utilità                                                             */
/* ------------------------------------------------------------------ */

const iso = /^\d{4}-\d{2}-\d{2}$/;

/** Una data ISO valida davvero: `2026-02-31` supera la forma e non esiste. */
export function dataValida(v: string | null): Date | null {
  if (!v || !iso.test(v)) return null;
  const d = new Date(`${v}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10) === v ? d : null;
}

function giorniFra(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / 86_400_000);
}

/** Numeri all'italiana, senza notazione scientifica per i grandi valori. */
export function numeroLeggibile(n: number): string {
  return n.toLocaleString("it-IT", { maximumFractionDigits: 2 });
}

/* ------------------------------------------------------------------ */
/* Il grezzo → i campi                                                 */
/* ------------------------------------------------------------------ */

/**
 * Riporta un valore alla FORMA CANONICA: numeri col punto decimale e
 * senza separatori di migliaia, date in `AAAA-MM-GG`. Il modello lo sa e
 * glielo si chiede, ma un estrattore che si fida di come gli scrivono un
 * numero è un estrattore che prima o poi legge «12.500» come dodici e
 * mezzo. In banca dati va la forma canonica: la formattazione
 * all'italiana è resa, e si fa dopo.
 */
export function canonicalizza(valore: string, tipo: TipoValore): string {
  const v = valore.trim();
  if (v === "") return "";

  if (tipo === "numero") {
    // Si toglie l'unità e si guarda l'ULTIMO separatore: in «12.500,75» è
    // la virgola, in «12,500.75» è il punto. Con un solo separatore e tre
    // cifre dopo si tratta da migliaia — «1.250» sono milleduecentocinquanta.
    const pulito = v.replace(/[^\d.,+-]/g, "");
    if (pulito === "") return "";
    const ultimaVirgola = pulito.lastIndexOf(",");
    const ultimoPunto = pulito.lastIndexOf(".");
    let normale = pulito;
    if (ultimaVirgola > ultimoPunto) {
      normale = pulito.replace(/\./g, "").replace(",", ".");
    } else if (ultimoPunto > ultimaVirgola) {
      const decimali = pulito.length - ultimoPunto - 1;
      normale =
        decimali === 3 && ultimaVirgola === -1 && /^\d{1,3}(\.\d{3})+$/.test(pulito)
          ? pulito.replace(/\./g, "")
          : pulito.replace(/,/g, "");
    }
    const n = Number(normale);
    return Number.isFinite(n) ? String(n) : v;
  }

  if (tipo === "data") {
    if (iso.test(v)) return v;
    const gg = v.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/);
    if (gg) {
      return `${gg[3]}-${gg[2].padStart(2, "0")}-${gg[1].padStart(2, "0")}`;
    }
    return v;
  }

  return v;
}

/**
 * Trasforma i campi dello schema in campi mostrabili: li rimette
 * nell'ordine dichiarato dal tipo, li riporta alla forma canonica e
 * applica le due correzioni che valgono su TUTTI i documenti — il tetto
 * del manoscritto e la penalità di qualità. Entrambe abbassano, mai
 * alzano.
 */
export function normalizzaCampi(
  letti: CampoGrezzo[],
  etichette: EtichettaCampo[],
  qualita: Qualita,
): CampoEstratto[] {
  const perNome = new Map<string, CampoGrezzo>();
  for (const c of letti ?? []) {
    // A parità di nome vince il primo: un modello che ripete un campo ha
    // già sbagliato, e sovrascrivere col secondo sarebbe scegliere a caso.
    if (c && typeof c.nome === "string" && !perNome.has(c.nome)) {
      perNome.set(c.nome, c);
    }
  }

  return etichette.map((e) => {
    const g = perNome.get(e.chiave);
    const grezzo = g?.valore?.trim() ?? "";
    const valore = grezzo === "" ? null : canonicalizza(grezzo, e.tipo);

    let confidenza = g?.confidenza ?? 0;
    const avvisi: string[] = [];

    // Un valore assente non ha confidenza: dire «vuoto, ma ne sono certo»
    // non significa niente e in pagina sembrerebbe un dato buono.
    if (valore === null) confidenza = 0;

    if (qualita === "faticosa" && valore !== null) {
      confidenza = Math.max(0, confidenza - PENALITA_QUALITA_FATICOSA);
    }

    // ═══ REGOLA INVIOLABILE — IL VALORE NON AGGIUNGE ═══
    // Prima di ogni altra cosa: se il valore porta cifre che nella
    // citazione non ci sono, non è un valore letto male — è un valore
    // completato, e va tolto.
    let finale = valore;
    if (
      soggettoACompletamento(e) &&
      completatoOltreLaFonte(valore, g?.estrattoDa)
    ) {
      finale = null;
      confidenza = 0;
      avvisi.push(notaCompletamento(e.etichetta));
    }

    // ═══ REGOLA INVIOLABILE (docs/motore.md §3) ═══
    // Nessun dato letto da una scrittura a mano supera 0,6, qualunque
    // cosa dichiari il modello. Una cifra scritta a mano letta male
    // produce un documento sbagliato che porta la nostra validazione.
    if (g?.fonteLettura === "manoscritto" && finale !== null) {
      if (confidenza > TETTO_MANOSCRITTO) confidenza = TETTO_MANOSCRITTO;
      avvisi.push(
        "Letto da una scrittura a mano: controllalo sul documento prima di confermare.",
      );
    }

    return {
      chiave: e.chiave,
      etichetta: e.etichetta,
      valore: finale,
      unita: e.unita ?? null,
      confidenza: Math.round(Math.min(1, Math.max(0, confidenza)) * 100) / 100,
      // Pagina zero significa «non lo so»: non esiste una pagina zero, e
      // mostrarla sarebbe una provenienza falsa.
      pagina: g?.pagina && g.pagina > 0 ? g.pagina : null,
      estrattoDa: g?.estrattoDa?.trim() || null,
      fonteLettura: g?.fonteLettura ?? "testo",
      nota: g?.nota?.trim() || null,
      avvisi,
    };
  });
}


/* ------------------------------------------------------------------ */
/* Il grezzo → le righe (forma TABELLA)                                */
/* ------------------------------------------------------------------ */

export type CellaEstratta = {
  chiave: string;
  etichetta: string;
  valore: string | null;
  unita: string | null;
};

export type RigaEstratta = {
  /** 1..N: è l'ordine in cui la riga sta sul foglio. */
  indice: number;
  celle: CellaEstratta[];
  /** Della riga intera: v. la nota in testa a schemi.ts. */
  confidenza: number;
  pagina: number | null;
  estrattoDa: string | null;
  fonteLettura: FonteLettura;
  nota: string | null;
  avvisi: string[];
};

/**
 * Le righe di una tabella, normalizzate. Stessa disciplina delle schede —
 * forma canonica, tetto del manoscritto, penalità di qualità — applicata
 * all'unità che conta qui, che è la riga.
 *
 * Una riga senza NESSUNA cella piena viene scartata: è quasi sempre una
 * riga di intestazione o un separatore che il modello ha letto come dato,
 * e mostrarla al cliente da confermare sarebbe chiedergli di confermare
 * il nulla.
 */
export function normalizzaRighe(
  lette: RigaGrezza[],
  colonne: EtichettaCampo[],
  qualita: Qualita,
): RigaEstratta[] {
  const out: RigaEstratta[] = [];

  for (const r of lette ?? []) {
    if (!r || !Array.isArray(r.celle)) continue;

    const perColonna = new Map<string, string>();
    for (const c of r.celle) {
      if (c && typeof c.colonna === "string" && !perColonna.has(c.colonna)) {
        perColonna.set(c.colonna, String(c.valore ?? ""));
      }
    }

    // ═══ REGOLA INVIOLABILE — IL VALORE NON AGGIUNGE ═══
    // Qui la citazione è della RIGA e non della singola cella (finché la
    // confidenza non scende dentro la cella), e va bene così: il
    // confronto è sulle cifre, e le cifre della riga ci sono tutte.
    const completate: string[] = [];
    const celle: CellaEstratta[] = colonne.map((col) => {
      const grezzo = (perColonna.get(col.chiave) ?? "").trim();
      const valore = grezzo === "" ? null : canonicalizza(grezzo, col.tipo);
      if (
        soggettoACompletamento(col) &&
        completatoOltreLaFonte(valore, r.estrattoDa)
      ) {
        completate.push(col.etichetta);
        return {
          chiave: col.chiave,
          etichetta: col.etichetta,
          valore: null,
          unita: col.unita ?? null,
        };
      }
      return {
        chiave: col.chiave,
        etichetta: col.etichetta,
        valore,
        unita: col.unita ?? null,
      };
    });

    if (celle.every((c) => c.valore === null)) continue;

    let confidenza = r.confidenza ?? 0;
    const avvisi: string[] = [];

    for (const etichetta of completate) avvisi.push(notaCompletamento(etichetta));

    if (qualita === "faticosa") {
      confidenza = Math.max(0, confidenza - PENALITA_QUALITA_FATICOSA);
    }
    // ═══ REGOLA INVIOLABILE ═══ vale per riga esattamente come per campo.
    if (r.fonteLettura === "manoscritto") {
      if (confidenza > TETTO_MANOSCRITTO) confidenza = TETTO_MANOSCRITTO;
      avvisi.push("Riga scritta a mano: confrontala col foglio prima di confermare.");
    }

    out.push({
      indice: out.length + 1,
      celle,
      confidenza: Math.round(Math.min(1, Math.max(0, confidenza)) * 100) / 100,
      pagina: r.pagina && r.pagina > 0 ? r.pagina : null,
      estrattoDa: r.estrattoDa?.trim() || null,
      fonteLettura: r.fonteLettura ?? "testo",
      nota: r.nota?.trim() || null,
      avvisi,
    });
  }

  return out;
}

/** Il valore numerico di una cella, o null. */
function num(riga: RigaEstratta, chiave: string): number | null {
  const v = riga.celle.find((c) => c.chiave === chiave)?.valore;
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/** Il testo di una cella, o null. */
function testo(riga: RigaEstratta, chiave: string): string | null {
  return riga.celle.find((c) => c.chiave === chiave)?.valore ?? null;
}

function segnalaRiga(riga: RigaEstratta, avviso: string, taglio = 0.3) {
  riga.avvisi.push(avviso);
  riga.confidenza = Math.round(Math.max(0, riga.confidenza - taglio) * 100) / 100;
}

/* ------------------------------------------------------------------ */
/* I controlli della bolletta elettrica                                */
/* ------------------------------------------------------------------ */

export type EsitoPlausibilita = {
  /** Gli avvisi che riguardano il documento intero, non un campo solo. */
  avvisiDocumento: string[];
  /** Il periodo cade fuori dall'anno di rendicontazione dichiarato. */
  fuoriPeriodo: boolean;
};

export type ContestoVerifica = {
  annoRendicontazione: number;
  /** Il resto della risposta, per i controlli che ne hanno bisogno. */
  grezzo: Record<string, unknown>;
  /** I campi dichiarati dal tipo, coi loro vincoli. */
  campi?: EtichettaCampo[];
};

/**
 * Un verificatore riceve SEMPRE entrambe le forme e usa quella che gli
 * compete: le schede guardano `campi`, le tabelle `righe`. La firma
 * unica evita un ramo condizionale nel motore, che non deve sapere che
 * forma abbia il documento che sta leggendo.
 *
 * Modifica gli avvisi e la confidenza SUL POSTO — mai toglie un valore:
 * un valore tolto è un valore che il cliente non può nemmeno correggere.
 */
export type Verificatore = (
  campi: CampoEstratto[],
  righe: RigaEstratta[],
  ctx: ContestoVerifica,
) => EsitoPlausibilita;

function segna(campi: CampoEstratto[], chiave: string, avviso: string, taglio = 0.3) {
  const c = campi.find((x) => x.chiave === chiave);
  if (!c) return;
  c.avvisi.push(avviso);
  c.confidenza = Math.round(Math.max(0, c.confidenza - taglio) * 100) / 100;
}

function numeroDi(campi: CampoEstratto[], chiave: string): number | null {
  const v = campi.find((c) => c.chiave === chiave)?.valore;
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/**
 * I controlli di senso su una bolletta elettrica, applicati ai campi già
 * normalizzati. Restituisce gli stessi campi con avvisi e confidenza
 * corretti: non toglie mai un valore, perché un valore tolto è un valore
 * che il cliente non può nemmeno correggere.
 */
export const verificaBollettaElettrica: Verificatore = (campi, _righe, ctx) => {
  const contesto = {
    annoRendicontazione: ctx.annoRendicontazione,
    piuPod: ctx.grezzo.piuPod === true,
  };
  const avvisiDocumento: string[] = [];

  /* — POD — */
  /* — Periodo — */
  const inizio = dataValida(campi.find((c) => c.chiave === "periodoInizio")?.valore ?? null);
  const fine = dataValida(campi.find((c) => c.chiave === "periodoFine")?.valore ?? null);
  const grezzoInizio = campi.find((c) => c.chiave === "periodoInizio")?.valore;
  const grezzoFine = campi.find((c) => c.chiave === "periodoFine")?.valore;

  if (grezzoInizio && !inizio) {
    segna(campi, "periodoInizio", `«${grezzoInizio}» non è una data valida.`, 0.5);
  }
  if (grezzoFine && !fine) {
    segna(campi, "periodoFine", `«${grezzoFine}» non è una data valida.`, 0.5);
  }

  let fuoriPeriodo = false;
  if (inizio && fine) {
    const giorni = giorniFra(inizio, fine);
    if (giorni < 0) {
      segna(campi, "periodoFine", "Il periodo finisce prima di cominciare.", 0.5);
      segna(campi, "periodoInizio", "Il periodo finisce prima di cominciare.", 0.5);
    } else if (giorni > GIORNI_MASSIMI) {
      segna(
        campi,
        "periodoFine",
        `Il periodo copre ${giorni} giorni: più di un anno di fatturazione è insolito.`,
      );
    }

    // Fuori dall'anno di rendicontazione: il dato è vero, ma non è di
    // quest'anno. Si estrae lo stesso e si dice (docs/motore.md §4.5).
    const anno = contesto.annoRendicontazione;
    const dentro =
      inizio.getUTCFullYear() === anno || fine.getUTCFullYear() === anno;
    if (!dentro) {
      fuoriPeriodo = true;
      avvisiDocumento.push(
        `Il periodo di questa bolletta (${grezzoInizio} — ${grezzoFine}) è fuori dall'anno di rendicontazione ${anno}: il dato resta in archivio ma non entra nei documenti di quell'anno.`,
      );
    }
  }

  /* — Consumi — */
  const totale = numeroDi(campi, "consumoTotaleKwh");
  const f1 = numeroDi(campi, "consumoF1Kwh");
  const f2 = numeroDi(campi, "consumoF2Kwh");
  const f3 = numeroDi(campi, "consumoF3Kwh");

  // La somma delle fasce deve dare il totale. Se non torna, il numero
  // sbagliato può essere qualunque dei quattro: si segnalano tutti,
  // perché indicare il colpevole sbagliato è peggio che non indicarlo.
  const fasce = [f1, f2, f3];
  if (totale !== null && totale > 0 && fasce.every((f) => f !== null)) {
    const somma = (f1 as number) + (f2 as number) + (f3 as number);
    const scarto = Math.abs(somma - totale);
    const tolleranza = Math.max(totale * TOLLERANZA_FASCE, TOLLERANZA_FASCE_MINIMA);
    if (scarto > tolleranza) {
      const avviso = `Le fasce sommano ${numeroLeggibile(somma)} kWh contro un totale di ${numeroLeggibile(totale)}: una delle due letture non torna.`;
      for (const c of ["consumoTotaleKwh", "consumoF1Kwh", "consumoF2Kwh", "consumoF3Kwh"]) {
        segna(campi, c, avviso, 0.2);
      }
      avvisiDocumento.push(avviso);
    }
  }

  /* — Importo — */
  const importo = numeroDi(campi, "importoEuro");
  if (importo !== null) {
    if (importo < 0) {
      segna(
        campi,
        "importoEuro",
        "Importo negativo: se è una nota di credito, il consumo va verificato a parte.",
        0.3,
      );
    } else if (totale !== null && totale > 0) {
      const perKwh = importo / totale;
      if (perKwh > EURO_PER_KWH_MAX || perKwh < EURO_PER_KWH_MIN) {
        segna(
          campi,
          "importoEuro",
          `Importo e consumo non stanno insieme (${numeroLeggibile(perKwh)} €/kWh): uno dei due è stato letto male.`,
        );
      }
    }
  }

  /* — Più POD nello stesso documento — */
  if (contesto.piuPod) {
    avvisiDocumento.push(
      "Questo documento contiene più punti di prelievo: i totali potrebbero riguardare più contatori insieme. Controlla prima di confermare.",
    );
    for (const c of campi) c.confidenza = Math.round(Math.max(0, c.confidenza - 0.2) * 100) / 100;
  }

  return { avvisiDocumento, fuoriPeriodo };
};

/* ------------------------------------------------------------------ */
/* Visura camerale                                                     */
/* ------------------------------------------------------------------ */

const FORMA_PIVA = /^\d{11}$/;

/** La partita IVA italiana ha una cifra di controllo: si verifica. */
function partitaIvaValida(piva: string): boolean {
  if (!FORMA_PIVA.test(piva)) return false;
  let somma = 0;
  for (let i = 0; i < 11; i++) {
    const c = Number(piva[i]);
    if (i % 2 === 0) somma += c;
    else {
      const d = c * 2;
      somma += d > 9 ? d - 9 : d;
    }
  }
  return somma % 10 === 0;
}

export const verificaVisura: Verificatore = (campi, _righe, ctx) => {
  const avvisiDocumento: string[] = [];

  const piva = campi.find((c) => c.chiave === "partitaIva")?.valore;
  if (piva) {
    const pulita = piva.replace(/\D/g, "");
    if (!FORMA_PIVA.test(pulita)) {
      segna(campi, "partitaIva", `«${piva}» non ha undici cifre: controllala.`, 0.4);
    } else if (!partitaIvaValida(pulita)) {
      // La cifra di controllo non torna: quasi sempre è una cifra letta
      // male. Non si scarta — la visura ha ragione più spesso di noi —
      // ma è esattamente il caso in cui vale la pena guardare.
      segna(
        campi,
        "partitaIva",
        "La cifra di controllo della partita IVA non torna: probabilmente una cifra è stata letta male.",
        0.4,
      );
    }
  }

  const costituzione = dataValida(
    campi.find((c) => c.chiave === "dataCostituzione")?.valore ?? null,
  );
  if (costituzione) {
    const anno = costituzione.getUTCFullYear();
    if (anno < 1850 || anno > ctx.annoRendicontazione + 1) {
      segna(campi, "dataCostituzione", "La data di costituzione non è plausibile.");
    }
  }

  return { avvisiDocumento, fuoriPeriodo: false };
};

/* ------------------------------------------------------------------ */
/* Organigramma                                                        */
/* ------------------------------------------------------------------ */

/** Ciò che somiglia a un nome di persona e non deve stare in un ruolo. */
const SEMBRA_UNA_PERSONA =
  /\b(sig\.?(ra)?|sig\.?na|dott\.?(ssa)?|ing\.?|geom\.?|rag\.?|avv\.?|arch\.?|per\.? ?ind\.?)\s/i;

export const verificaOrganigramma: Verificatore = (_campi, righe) => {
  const avvisiDocumento: string[] = [];
  const visti = new Map<string, number>();

  for (const r of righe) {
    const ruolo = testo(r, "ruolo");
    if (!ruolo) {
      segnalaRiga(r, "Riga senza ruolo: senza il ruolo la riga non serve a nulla.", 0.4);
      continue;
    }

    // ═══ NESSUN NOME DI PERSONA ═══ Il prompt lo chiede, il controllo lo
    // verifica: un'istruzione è una richiesta, non una garanzia, e un
    // nome finito in un manuale è un dato personale pubblicato senza
    // motivo. Si segnala invece di cancellare, perché la cancellazione
    // automatica mangerebbe anche i ruoli scritti in modo strano.
    if (SEMBRA_UNA_PERSONA.test(ruolo)) {
      segnalaRiga(
        r,
        "Questa riga sembra contenere il nome di una persona: nel sistema di gestione va il ruolo, non il nome. Correggila prima di confermare.",
        0.3,
      );
    }

    const chiave = ruolo.toLowerCase().replace(/\s+/g, " ").trim();
    visti.set(chiave, (visti.get(chiave) ?? 0) + 1);
  }

  const doppi = [...visti.entries()].filter(([, n]) => n > 1).map(([r]) => r);
  if (doppi.length > 0) {
    avvisiDocumento.push(
      `Alcuni ruoli compaiono più di una volta (${doppi.slice(0, 3).join(", ")}): controlla che non siano righe duplicate.`,
    );
  }
  if (righe.length > 0 && !righe.some((r) => testo(r, "riportaA"))) {
    avvisiDocumento.push(
      "Nessuna riga dichiara a chi riporta: la gerarchia non è ricostruibile da questo documento.",
    );
  }

  return { avvisiDocumento, fuoriPeriodo: false };
};

/* ------------------------------------------------------------------ */
/* Dati di organico                                                    */
/* ------------------------------------------------------------------ */

const RETRIBUZIONE_MINIMA = 5_000;
const RETRIBUZIONE_MASSIMA = 1_000_000;

export const verificaOrganico: Verificatore = (_campi, righe) => {
  const avvisiDocumento: string[] = [];
  let totale = 0;
  let gruppiDiUno = 0;

  for (const r of righe) {
    const n = num(r, "numero");
    if (n === null) {
      segnalaRiga(r, "Manca il numero di addetti: senza, la riga non conta.", 0.4);
      continue;
    }
    if (!Number.isInteger(n)) {
      segnalaRiga(r, "Il numero di addetti non è un intero.", 0.4);
    }
    totale += Math.max(0, n);

    // ═══ RISERVATEZZA ═══ Un gruppo di una persona sola non è un dato
    // aggregato: chiunque in azienda sa chi è l'unica donna dirigente, e
    // la sua retribuzione smette di essere un numero statistico.
    if (n === 1) gruppiDiUno++;

    const retribuzione = num(r, "retribuzioneMediaLorda");
    if (
      retribuzione !== null &&
      (retribuzione < RETRIBUZIONE_MINIMA || retribuzione > RETRIBUZIONE_MASSIMA)
    ) {
      segnalaRiga(
        r,
        `Una retribuzione media annua di ${numeroLeggibile(retribuzione)} € non è plausibile: controlla se il documento riporta un importo mensile.`,
      );
    }
  }

  if (gruppiDiUno > 0) {
    avvisiDocumento.push(
      `${gruppiDiUno === 1 ? "Un gruppo è" : `${gruppiDiUno} gruppi sono`} composto da una persona sola: un dato riferito a una persona sola non è un dato aggregato, e nell'elaborato finale verrà accorpato o omesso.`,
    );
  }
  if (righe.length > 0 && totale === 0) {
    avvisiDocumento.push("Il totale degli addetti risulta zero: controlla il documento.");
  }

  const generi = new Set(righe.map((r) => testo(r, "genere")).filter(Boolean));
  if (righe.length > 0 && generi.size < 2) {
    avvisiDocumento.push(
      "I dati non sono distinti per genere: senza questa distinzione gli indicatori di parità non si possono calcolare.",
    );
  }

  return { avvisiDocumento, fuoriPeriodo: false };
};

/* ------------------------------------------------------------------ */
/* Il verificatore GENERICO — quello che non conosce i domini          */
/* ------------------------------------------------------------------ */

/**
 * I VINCOLI DICHIARATI, applicati da solo.
 *
 * ═══ PERCHÉ ESISTE ═══
 * Finché ogni tipo di documento doveva portarsi il proprio verificatore
 * scritto a mano, aggiungere un ambito significava scrivere codice — e
 * l'architettura prometteva il contrario. Questo verificatore legge i
 * vincoli DICHIARATI nei campi (`min`, `max`, `formato`, `nonSupera`,
 * `dentroLAnno`) e li fa rispettare senza sapere se sta guardando una
 * bolletta, un registro di formazione o la mappatura dei reati
 * presupposto di un Modello 231.
 *
 * È il verificatore PREDEFINITO: un tipo ne dichiara uno proprio solo
 * quando ha controlli che i vincoli non esprimono — la cifra di
 * controllo di una partita IVA, la somma delle fasce che deve dare il
 * totale, un nome di persona finito dentro un ruolo. Quelli restano
 * codice perché sono ragionamenti, non limiti.
 */
export const verificaGenerica: Verificatore = (campi, righe, ctx) => {
  const avvisiDocumento: string[] = [];
  let fuori = 0;
  let conData = 0;

  /* — Le schede: un vincolo per campo — */
  for (const c of campi) {
    if (c.valore === null) continue;
    const esito = controllaVincoli(c.chiave, c.valore, campi, ctx);
    // Un vincolo violato è un segnale forte — un valore fuori scala è
    // quasi sempre una lettura sbagliata — e taglia più di un'incoerenza.
    for (const a of esito.avvisi) segna(campi, c.chiave, a, 0.45);
    if (esito.fuoriAnno !== null) {
      conData++;
      if (esito.fuoriAnno) fuori++;
    }
  }

  /* — Le tabelle: gli stessi vincoli, riga per riga — */
  for (const r of righe) {
    for (const cella of r.celle) {
      if (cella.valore === null) continue;
      const esito = controllaVincoli(cella.chiave, cella.valore, r.celle, ctx);
      for (const a of esito.avvisi) segnalaRiga(r, a, 0.45);
      if (esito.fuoriAnno !== null) {
        conData++;
        if (esito.fuoriAnno) fuori++;
      }
    }
  }

  if (fuori > 0 && conData > 0) {
    avvisiDocumento.push(
      `${fuori === 1 ? "Un valore si riferisce" : `${fuori} valori si riferiscono`} a un anno diverso da ${ctx.annoRendicontazione}: restano in archivio ma non entrano nei documenti di quell'anno.`,
    );
  }

  return { avvisiDocumento, fuoriPeriodo: conData > 0 && fuori === conData };
};

/** I vincoli dichiarati sul singolo valore. Nessuna conoscenza di dominio. */
function controllaVincoli(
  chiave: string,
  valore: string,
  vicini: { chiave: string; valore: string | null; etichetta: string }[],
  ctx: ContestoVerifica,
): { avvisi: string[]; fuoriAnno: boolean | null } {
  const regola = ctx.campi?.find((c) => c.chiave === chiave);
  if (!regola) return { avvisi: [], fuoriAnno: null };

  const avvisi: string[] = [];
  let fuoriAnno: boolean | null = null;

  if (regola.formato && !new RegExp(regola.formato).test(valore.trim())) {
    avvisi.push(
      regola.formatoNota ??
        `«${valore}» non ha la forma attesa per ${regola.etichetta.toLowerCase()}.`,
    );
  }

  if (regola.tipo === "numero") {
    const n = Number(valore);
    if (Number.isFinite(n)) {
      if (regola.min !== undefined && n < regola.min) {
        avvisi.push(
          `${regola.etichetta}: ${numeroLeggibile(n)} è sotto il minimo plausibile (${numeroLeggibile(regola.min)}).`,
        );
      }
      if (regola.max !== undefined && n > regola.max) {
        avvisi.push(
          `${regola.etichetta}: ${numeroLeggibile(n)} è sopra il massimo plausibile (${numeroLeggibile(regola.max)}).`,
        );
      }
      if (regola.nonSupera) {
        const altro = vicini.find((v) => v.chiave === regola.nonSupera);
        const m = altro?.valore === null || altro?.valore === undefined ? null : Number(altro.valore);
        if (m !== null && Number.isFinite(m) && n > m) {
          avvisi.push(
            `${regola.etichetta} (${numeroLeggibile(n)}) supera ${altro?.etichetta.toLowerCase()} (${numeroLeggibile(m)}).`,
          );
        }
      }
    }
  }

  if (regola.tipo === "data" && regola.dentroLAnno) {
    const d = dataValida(valore);
    if (d) fuoriAnno = d.getUTCFullYear() !== ctx.annoRendicontazione;
  }

  return { avvisi, fuoriAnno };
}
