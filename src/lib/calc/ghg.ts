/**
 * IL CALCOLO DELLE EMISSIONI — Scope 1 e 2, ricostruibile riga per riga.
 *
 * ═══ FUNZIONI PURE, E NESSUN ARROTONDAMENTO ═══
 * Ricevono consumi confermati e fattori già scelti, restituiscono numeri
 * pieni. Arrotonda solo chi presenta (SPEC §7): un totale fatto di valori
 * arrotondati non torna con la somma delle righe che il documento
 * espone, e un revisore se ne accorge alla prima colonna che somma.
 *
 * ═══ OGNI PASSAGGIO SI RIFÀ A MANO ═══
 * emissioni = quantità attribuita all'esercizio × fattore. La quantità
 * attribuita è la quantità fatturata per la quota di giorni del periodo
 * che cade nell'esercizio — una bolletta dal 15 dicembre al 14 gennaio
 * pesa sul nuovo anno per 14 giorni su 31. Il documento pubblica
 * quantità, quota, fattore e fonte del fattore: chiunque con una
 * calcolatrice arriva allo stesso numero.
 *
 * ═══ IL RIFERIMENTO VIAGGIA, IL CALCOLO NON LO GUARDA ═══
 * Ogni lettura porta un `rif` opaco — per il documento è la sigla della
 * fonte — che il calcolo restituisce accanto al risultato senza sapere
 * che cosa sia. Il calcolo non conosce il registro delle fonti, il
 * registro delle fonti non conosce il calcolo.
 */

export type Periodo = { dal: string; al: string };

const GIORNO = 86_400_000;

function giornoDi(iso: string): number {
  return Math.round(new Date(`${iso}T00:00:00Z`).getTime() / GIORNO);
}

function isoDi(giorno: number): string {
  return new Date(giorno * GIORNO).toISOString().slice(0, 10);
}

/** Giorni di un periodo, estremi compresi: una bolletta dal 1° al 31 gennaio copre 31 giorni. */
export function giorniInclusivi(p: Periodo): number {
  return giornoDi(p.al) - giornoDi(p.dal) + 1;
}

export function esercizioComePeriodo(esercizio: number): Periodo {
  return { dal: `${esercizio}-01-01`, al: `${esercizio}-12-31` };
}

export function sovrapposizione(a: Periodo, b: Periodo): Periodo | null {
  const dal = Math.max(giornoDi(a.dal), giornoDi(b.dal));
  const al = Math.min(giornoDi(a.al), giornoDi(b.al));
  return al >= dal ? { dal: isoDi(dal), al: isoDi(al) } : null;
}

export type Quota = {
  giorniPeriodo: number;
  giorniNellEsercizio: number;
  /** Da 0 a 1. */
  quota: number;
};

export function quotaNellEsercizio(p: Periodo, esercizio: number): Quota {
  const giorniPeriodo = giorniInclusivi(p);
  const dentro = sovrapposizione(p, esercizioComePeriodo(esercizio));
  const giorniNellEsercizio = dentro ? giorniInclusivi(dentro) : 0;
  return {
    giorniPeriodo,
    giorniNellEsercizio,
    quota: giorniPeriodo > 0 ? giorniNellEsercizio / giorniPeriodo : 0,
  };
}

/**
 * Scarti fino a tre giorni fra una bolletta e la successiva non sono
 * buchi né doppioni: sono le convenzioni di fatturazione — c'è chi chiude
 * il 31 e riparte il 1°, chi chiude e riparte lo stesso giorno. Oltre i
 * tre giorni lo scarto è un fatto, e si dice.
 */
export const TOLLERANZA_GIORNI = 3;

export type EsitoCopertura = {
  /** I tratti dell'esercizio che nessun documento copre. */
  scoperti: Periodo[];
  /** I tratti coperti da più documenti: il consumo lì conterebbe due volte. */
  sovrapposti: Periodo[];
};

/** Una passata sui periodi dentro una finestra: i buchi e i tratti coperti due volte. */
function scansione(periodi: Periodo[], finestra: Periodo): EsitoCopertura {
  const inizio = giornoDi(finestra.dal);
  const fine = giornoDi(finestra.al);
  const tratti = periodi
    .map((p) => sovrapposizione(p, finestra))
    .filter((p): p is Periodo => p !== null)
    .map((p) => ({ dal: giornoDi(p.dal), al: giornoDi(p.al) }))
    .sort((a, b) => a.dal - b.dal || a.al - b.al);

  const scoperti: Periodo[] = [];
  const sovrapposti: Periodo[] = [];
  let coperto = inizio - 1;

  for (const t of tratti) {
    if (t.dal > coperto + 1) {
      const buco = { dal: coperto + 1, al: t.dal - 1 };
      if (buco.al - buco.dal + 1 > TOLLERANZA_GIORNI) {
        scoperti.push({ dal: isoDi(buco.dal), al: isoDi(buco.al) });
      }
    } else if (t.dal <= coperto) {
      const doppio = { dal: t.dal, al: Math.min(t.al, coperto) };
      // La tolleranza vale per il bordo fra una bolletta e la successiva,
      // non per una bolletta CONTENUTA in un'altra: tre giorni fatturati
      // dentro un mese già fatturato sono consumo contato due volte, per
      // quanto brevi.
      const contenuto = t.al <= coperto;
      if (contenuto || doppio.al - doppio.dal + 1 > TOLLERANZA_GIORNI) {
        sovrapposti.push({ dal: isoDi(doppio.dal), al: isoDi(doppio.al) });
      }
    }
    coperto = Math.max(coperto, t.al);
  }
  if (fine - coperto > TOLLERANZA_GIORNI) {
    scoperti.push({ dal: isoDi(coperto + 1), al: isoDi(fine) });
  }
  return { scoperti, sovrapposti };
}

/**
 * Quali tratti dell'esercizio restano scoperti, e quali sono coperti due
 * volte, per UN punto di prelievo.
 *
 * `attivita` sono i periodi in cui il contatore è stato attivo, quando
 * l'organizzazione li ha dichiarati (un contatore aperto a giugno, un
 * capannone chiuso d'estate): i buchi si cercano solo dentro quei periodi,
 * e fuori non c'è niente da coprire. I doppioni invece si cercano su tutto
 * l'esercizio — due bollette dello stesso giorno contano due volte anche
 * quando il contatore era spento.
 */
export function copertura(periodi: Periodo[], esercizio: number, attivita?: Periodo | Periodo[]): EsitoCopertura {
  const intero = esercizioComePeriodo(esercizio);
  const finestre = (attivita === undefined ? [intero] : Array.isArray(attivita) ? attivita : [attivita])
    .map((f) => sovrapposizione(f, intero))
    .filter((f): f is Periodo => f !== null);
  const { sovrapposti } = scansione(periodi, intero);
  const scoperti = finestre.flatMap((f) => scansione(periodi, f).scoperti);
  return { scoperti, sovrapposti };
}

/* ================================================================== */
/* I fattori, come li vede il calcolo                                  */
/* ================================================================== */

export type FattoreApplicato = {
  id: string;
  /** kg per unità di quantità. */
  valore: number;
  unita: string;
};

/* ================================================================== */
/* Consumi a periodo: energia elettrica e gas                          */
/* ================================================================== */

export type LetturaPeriodica<R> = {
  /** POD, PDR: il punto a cui il consumo appartiene. */
  punto: string;
  periodo: Periodo;
  quantita: number;
  /** Per l'elettricità: la fornitura dichiarata da fonti rinnovabili in bolletta. */
  rinnovabile?: "si" | "no" | "non-dichiarato" | null;
  rif: R;
};

export type RigaAttribuita<R> = LetturaPeriodica<R> &
  Quota & {
    /** La quantità che pesa sull'esercizio. */
    attribuita: number;
  };

export function attribuisci<R>(
  letture: LetturaPeriodica<R>[],
  esercizio: number,
): RigaAttribuita<R>[] {
  return letture
    .map((l) => {
      const q = quotaNellEsercizio(l.periodo, esercizio);
      return { ...l, ...q, attribuita: l.quantita * q.quota };
    })
    .filter((r) => r.giorniNellEsercizio > 0)
    .sort(
      (a, b) =>
        a.punto.localeCompare(b.punto) ||
        a.periodo.dal.localeCompare(b.periodo.dal) ||
        a.periodo.al.localeCompare(b.periodo.al),
    );
}

/** Le letture che non toccano l'esercizio: si escludono, e il documento lo dice. */
export function fuoriEsercizio<R>(letture: LetturaPeriodica<R>[], esercizio: number) {
  return letture.filter((l) => quotaNellEsercizio(l.periodo, esercizio).giorniNellEsercizio === 0);
}

export type EsitoScope2<R> = {
  righe: RigaAttribuita<R>[];
  perPunto: {
    punto: string;
    attribuita: number;
    location: number;
    mercato: number;
    rinnovabile: number;
  }[];
  kwh: number;
  /** kg CO₂e, metodo location-based. */
  location: number;
  /** kg CO₂e, metodo market-based. */
  mercato: number;
  /** kWh coperti da fornitura dichiarata rinnovabile. */
  kwhRinnovabili: number;
};

/**
 * Scope 2 nelle due letture che il GHG Protocol chiede insieme.
 *
 * LOCATION-BASED: tutto il consumo per il fattore medio della rete. Dice
 * quanto emette l'energia dove l'impresa la preleva, qualunque contratto
 * abbia firmato col fornitore.
 *
 * MARKET-BASED: il consumo di una fornitura dichiarata rinnovabile in
 * bolletta pesa zero; il resto si moltiplica per il mix residuale, cioè
 * per la rete a cui sono state tolte le garanzie d'origine già vendute.
 * «Non dichiarato» vale come «no»: una rinnovabilità che il documento non
 * dice non la diciamo noi.
 */
export function scope2<R>(
  letture: LetturaPeriodica<R>[],
  esercizio: number,
  fattori: { location: FattoreApplicato; mercato: FattoreApplicato },
): EsitoScope2<R> {
  const righe = attribuisci(letture, esercizio);
  const perPunto = new Map<string, EsitoScope2<R>["perPunto"][number]>();
  let kwh = 0;
  let location = 0;
  let mercato = 0;
  let kwhRinnovabili = 0;
  for (const r of righe) {
    const rinnovabile = r.rinnovabile === "si";
    const lb = r.attribuita * fattori.location.valore;
    const mb = rinnovabile ? 0 : r.attribuita * fattori.mercato.valore;
    kwh += r.attribuita;
    location += lb;
    mercato += mb;
    if (rinnovabile) kwhRinnovabili += r.attribuita;
    const p = perPunto.get(r.punto) ?? { punto: r.punto, attribuita: 0, location: 0, mercato: 0, rinnovabile: 0 };
    p.attribuita += r.attribuita;
    p.location += lb;
    p.mercato += mb;
    if (rinnovabile) p.rinnovabile += r.attribuita;
    perPunto.set(r.punto, p);
  }
  return {
    righe,
    perPunto: [...perPunto.values()].sort((a, b) => a.punto.localeCompare(b.punto)),
    kwh,
    location,
    mercato,
    kwhRinnovabili,
  };
}

export type EsitoCombustione<R> = {
  righe: RigaAttribuita<R>[];
  perPunto: { punto: string; attribuita: number; emissioni: number }[];
  quantita: number;
  /** kg CO₂e. */
  emissioni: number;
};

/** Combustione stazionaria a periodo (gas naturale): stessa attribuzione, un solo fattore. */
export function combustionePeriodica<R>(
  letture: LetturaPeriodica<R>[],
  esercizio: number,
  fattore: FattoreApplicato,
): EsitoCombustione<R> {
  const righe = attribuisci(letture, esercizio);
  const perPunto = new Map<string, { punto: string; attribuita: number; emissioni: number }>();
  let quantita = 0;
  for (const r of righe) {
    quantita += r.attribuita;
    const p = perPunto.get(r.punto) ?? { punto: r.punto, attribuita: 0, emissioni: 0 };
    p.attribuita += r.attribuita;
    p.emissioni += r.attribuita * fattore.valore;
    perPunto.set(r.punto, p);
  }
  return {
    righe,
    perPunto: [...perPunto.values()].sort((a, b) => a.punto.localeCompare(b.punto)),
    quantita,
    emissioni: quantita * fattore.valore,
  };
}

/* ================================================================== */
/* Consumi a evento: i rifornimenti                                    */
/* ================================================================== */

export type Rifornimento<R> = {
  data: string;
  carburante: string;
  mezzo: string | null;
  litri: number;
  rif: R;
};

/**
 * Oltre questa pausa fra due rifornimenti — o fra l'inizio dell'esercizio e
 * il primo, o fra l'ultimo e la fine — un registro somiglia a un registro
 * incompleto più che a una flotta ferma. Due mesi: una flotta che rifornisce
 * ogni mese non ci arriva mai, una sola auto usata poco sì, e lo dichiara.
 */
export const PAUSA_MASSIMA_RIFORNIMENTI = 62;

/** I tratti dell'esercizio senza rifornimenti più lunghi della pausa massima. */
export function pauseRifornimenti(date: string[], esercizio: number): Periodo[] {
  const intero = esercizioComePeriodo(esercizio);
  const giorni = [...new Set(date.filter((d) => d >= intero.dal && d <= intero.al).map(giornoDi))].sort((a, b) => a - b);
  if (giorni.length === 0) return [intero];
  const pause: Periodo[] = [];
  const limiti = [giornoDi(intero.dal) - 1, ...giorni, giornoDi(intero.al) + 1];
  for (let i = 1; i < limiti.length; i++) {
    const dal = limiti[i - 1] + 1;
    const al = limiti[i] - 1;
    if (al - dal + 1 > PAUSA_MASSIMA_RIFORNIMENTI) pause.push({ dal: isoDi(dal), al: isoDi(al) });
  }
  return pause;
}

export type EsitoCarburanti<R> = {
  /** Per carburante, nell'ordine in cui compaiono. */
  perCarburante: {
    carburante: string;
    litri: number;
    rifornimenti: number;
    fattore: FattoreApplicato;
    emissioni: number;
    rif: R[];
  }[];
  /** I rifornimenti con data fuori dall'esercizio: esclusi. */
  fuori: Rifornimento<R>[];
  /** I carburanti per cui non c'è un fattore: il calcolo si ferma lì. */
  senzaFattore: { carburante: string; litri: number; rif: R[] }[];
  emissioni: number;
};

export function carburanti<R>(
  rifornimenti: Rifornimento<R>[],
  esercizio: number,
  fattorePer: (carburante: string) => FattoreApplicato | undefined,
): EsitoCarburanti<R> {
  const dentro = rifornimenti.filter((r) => r.data.startsWith(`${esercizio}-`));
  const fuori = rifornimenti.filter((r) => !r.data.startsWith(`${esercizio}-`));
  const gruppi = new Map<string, { litri: number; rifornimenti: number; rif: R[] }>();
  for (const r of dentro) {
    const g = gruppi.get(r.carburante) ?? { litri: 0, rifornimenti: 0, rif: [] };
    g.litri += r.litri;
    g.rifornimenti += 1;
    g.rif.push(r.rif);
    gruppi.set(r.carburante, g);
  }
  const perCarburante: EsitoCarburanti<R>["perCarburante"] = [];
  const senzaFattore: EsitoCarburanti<R>["senzaFattore"] = [];
  let emissioni = 0;
  for (const [carburante, g] of gruppi) {
    const fattore = fattorePer(carburante);
    if (!fattore) {
      senzaFattore.push({ carburante, litri: g.litri, rif: g.rif });
      continue;
    }
    const e = g.litri * fattore.valore;
    emissioni += e;
    perCarburante.push({ carburante, litri: g.litri, rifornimenti: g.rifornimenti, fattore, emissioni: e, rif: g.rif });
  }
  return { perCarburante, fuori, senzaFattore, emissioni };
}
