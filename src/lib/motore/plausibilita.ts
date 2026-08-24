import type {
  CampoGrezzo,
  EtichettaCampo,
  FonteLettura,
  Qualita,
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
/* Limiti e forme                                                      */
/* ------------------------------------------------------------------ */

/** `IT` + tre cifre del distributore + `E` + otto caratteri. */
const FORMA_POD = /^IT\d{3}E[0-9A-Z]{8}$/;

const KWH_ASSURDO = 50_000_000;
const EURO_ASSURDO = 5_000_000;
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

    // ═══ REGOLA INVIOLABILE (docs/motore.md §3) ═══
    // Nessun dato letto da una scrittura a mano supera 0,6, qualunque
    // cosa dichiari il modello. Una cifra scritta a mano letta male
    // produce un documento sbagliato che porta la nostra validazione.
    if (g?.fonteLettura === "manoscritto" && valore !== null) {
      if (confidenza > TETTO_MANOSCRITTO) confidenza = TETTO_MANOSCRITTO;
      avvisi.push(
        "Letto da una scrittura a mano: controllalo sul documento prima di confermare.",
      );
    }

    return {
      chiave: e.chiave,
      etichetta: e.etichetta,
      valore,
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
/* I controlli della bolletta elettrica                                */
/* ------------------------------------------------------------------ */

export type EsitoPlausibilita = {
  campi: CampoEstratto[];
  /** Gli avvisi che riguardano il documento intero, non un campo solo. */
  avvisiDocumento: string[];
  /** Il periodo cade fuori dall'anno di rendicontazione dichiarato. */
  fuoriPeriodo: boolean;
};

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
export function verificaBollettaElettrica(
  campi: CampoEstratto[],
  contesto: { annoRendicontazione: number; piuPod: boolean },
): EsitoPlausibilita {
  const avvisiDocumento: string[] = [];

  /* — POD — */
  const pod = campi.find((c) => c.chiave === "pod")?.valore;
  if (pod && !FORMA_POD.test(pod.replace(/\s+/g, "").toUpperCase())) {
    segna(
      campi,
      "pod",
      `«${pod}» non ha la forma di un codice POD (IT, tre cifre, E, otto caratteri): controllalo.`,
    );
  }

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

  for (const chiave of [
    "consumoTotaleKwh",
    "consumoF1Kwh",
    "consumoF2Kwh",
    "consumoF3Kwh",
  ]) {
    const n = numeroDi(campi, chiave);
    if (n === null) continue;
    if (n < 0) {
      segna(campi, chiave, "Un consumo negativo non è un consumo: controllalo.", 0.5);
    } else if (n > KWH_ASSURDO) {
      segna(
        campi,
        chiave,
        `${numeroLeggibile(n)} kWh è fuori scala per un'impresa: probabilmente è stato letto male.`,
        0.5,
      );
    }
  }

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
    } else if (importo > EURO_ASSURDO) {
      segna(campi, "importoEuro", "Importo fuori scala: controllalo.", 0.5);
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

  return { campi, avvisiDocumento, fuoriPeriodo };
}
