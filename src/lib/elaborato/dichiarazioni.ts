import type { Periodo } from "@/lib/calc/ghg";
import { dataValida } from "@/lib/motore/plausibilita";

import { DATA_LUNGA } from "./fonti";

/**
 * LE DICHIARAZIONI DELL'ORGANIZZAZIONE — dove nessun documento può rispondere.
 *
 * Un ufficio senza caldaia non ha bollette del gas da caricare, e un
 * contatore aperto a giugno non ha la bolletta di gennaio. Nessun documento
 * dimostra un'assenza: la può dichiarare solo chi la conosce. Prima di
 * questo modulo il rimedio proposto era «scrivici», cioè nessun rimedio: il
 * documento restava fermo per sempre.
 *
 * ═══ UNA DICHIARAZIONE È UN DATO INSERITO ═══
 * Si scrive nella scheda impresa (`company_fields`, provenienza `utente`)
 * con una chiave che porta l'esercizio — non avere consumato gas nel 2025
 * non dice niente del 2026. Nel documento ha la sigla I come ogni dato
 * scritto dall'organizzazione, e dove sostituisce una misura il testo lo
 * dice: zero «per dichiarazione, non per misura».
 *
 * ═══ UNA DICHIARAZIONE SI PUÒ CONTRADDIRE ═══
 * Se in archivio ci sono documenti che la smentiscono, il documento non
 * esce finché una delle due cose non viene tolta. Quale delle due, non lo
 * scegliamo noi.
 *
 * Il testo di ogni dichiarazione nasce QUI e una volta sola: il cliente
 * dichiara esattamente la frase che poi il documento riporta.
 */

/** I fatti che l'organizzazione può dichiarare per un esercizio. */
export type FattoDichiarabile =
  /** Nessun consumo diretto di combustibili: lo Scope 1 è zero per dichiarazione. */
  | "senza-combustibili"
  | "senza-gas"
  | "senza-carburanti"
  /** Il registro contiene tutti i rifornimenti: i periodi senza righe sono pause vere. */
  | "rifornimenti-completi"
  /** Le ricariche dei veicoli elettrici avvengono in sede: sono già nelle bollette. */
  | "ricariche-in-sede"
  /** L'energia elettrica è compresa nell'affitto: nessuna bolletta intestata. */
  | "elettricita-in-affitto";

export const FATTI_DICHIARABILI: readonly FattoDichiarabile[] = [
  "senza-combustibili",
  "senza-gas",
  "senza-carburanti",
  "rifornimenti-completi",
  "ricariche-in-sede",
  "elettricita-in-affitto",
];

export type Dichiarazione = {
  esercizio: number;
  /** La frase che l'organizzazione dichiara, o la domanda a cui risponde. */
  testo: string;
  /** Una dichiarazione è già resa: il rimedio è correggerla o ritirarla. */
  resa: boolean;
} & (
  | { tipo: "fatto"; fatto: FattoDichiarabile }
  | {
      tipo: "periodo-contatore";
      punto: string;
      /** Il valore già dichiarato, quando c'è. */
      valore?: string;
    }
);

/** Le chiavi della scheda impresa, con l'esercizio dentro. Stanno nei 60 caratteri del campo. */
export function chiaveFatto(fatto: FattoDichiarabile, esercizio: number): string {
  return `ghg_${fatto.replace(/-/g, "_")}_${esercizio}`;
}

/**
 * Il codice di un contatore nella sua forma canonica: lettere e cifre,
 * maiuscole. «IT001E 0000X0L7» e «it001e0000x0l7» sono lo stesso POD, e
 * devono esserlo ovunque — nel raggruppamento delle bollette, nelle
 * tabelle, nella chiave della dichiarazione.
 */
export function puntoCanonico(punto: string): string {
  return punto.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

/**
 * Il codice dentro una chiave. `null` quando non ne resta un codice
 * plausibile — allora la dichiarazione non si offre, perché non si
 * saprebbe a che cosa legarla.
 */
export function puntoPerChiave(punto: string): string | null {
  const pulito = puntoCanonico(punto);
  return pulito.length >= 6 && pulito.length <= 40 ? pulito : null;
}

export function chiaveAttivita(punto: string, esercizio: number): string | null {
  const p = puntoPerChiave(punto);
  return p ? `ghg_attivita_${p}_${esercizio}` : null;
}

export function testoFatto(fatto: FattoDichiarabile, esercizio: number): string {
  switch (fatto) {
    case "senza-combustibili":
      return `Nel ${esercizio} l'organizzazione non ha avuto consumi diretti di combustibili: nessun impianto alimentato a gas, gasolio o GPL — caldaie, forni, generatori — e nessun rifornimento di carburante per veicoli o macchine in uso, di proprietà, a noleggio o in leasing.`;
    case "senza-gas":
      return `Nel ${esercizio} l'organizzazione non ha avuto consumi di gas naturale.`;
    case "senza-carburanti":
      return `Nel ${esercizio} l'organizzazione non ha fatto rifornimenti di carburante per veicoli o macchine in uso, di proprietà, a noleggio o in leasing.`;
    case "rifornimenti-completi":
      return `I registri dei carburanti del ${esercizio} contengono tutti i rifornimenti dell'esercizio: nei periodi senza righe i veicoli e le macchine dell'organizzazione non hanno fatto rifornimento.`;
    case "ricariche-in-sede":
      return `Nel ${esercizio} i veicoli elettrici dell'organizzazione sono stati ricaricati solo nelle sue sedi: l'energia delle ricariche è compresa nelle bollette di energia elettrica.`;
    case "elettricita-in-affitto":
      return `Nel ${esercizio} l'energia elettrica usata dall'organizzazione era compresa nel canone di locazione o nelle spese condominiali: l'organizzazione non ha bollette di energia elettrica intestate.`;
  }
}

/* ── Il periodo di attività di un contatore ─────────────────────────── */

export const CONTATORE_INATTIVO = "inattivo";

export type AttivitaContatore = { inattivo: true } | { inattivo: false; periodi: Periodo[] };

/** Quanti periodi di attività si possono dichiarare per un contatore nello stesso esercizio. */
export const MAX_PERIODI_ATTIVITA = 4;

/**
 * Il valore dichiarato: uno o più periodi «AAAA-MM-GG/AAAA-MM-GG» separati da
 * «;», dentro l'esercizio e senza sovrapporsi — un contatore sospeso d'estate
 * è attivo in due periodi — oppure «inattivo». Qualunque altra cosa non è
 * una dichiarazione, né per il portale che la scrive né per il documento che
 * la legge.
 */
export function leggiAttivita(valore: string | null | undefined, esercizio: number): AttivitaContatore | null {
  if (valore === CONTATORE_INATTIVO) return { inattivo: true };
  const pezzi = (valore ?? "").split(";");
  if (pezzi.length === 0 || pezzi.length > MAX_PERIODI_ATTIVITA) return null;
  const periodi: Periodo[] = [];
  for (const pezzo of pezzi) {
    const parti = pezzo.split("/");
    if (parti.length !== 2) return null;
    const [dal, al] = parti;
    if (!dataValida(dal) || !dataValida(al) || dal > al) return null;
    if (!dal.startsWith(`${esercizio}-`) || !al.startsWith(`${esercizio}-`)) return null;
    periodi.push({ dal, al });
  }
  periodi.sort((a, b) => a.dal.localeCompare(b.dal));
  for (let i = 1; i < periodi.length; i++) {
    if (periodi[i].dal <= periodi[i - 1].al) return null;
  }
  return { inattivo: false, periodi };
}

export function valoreAttivita(a: AttivitaContatore): string {
  return a.inattivo ? CONTATORE_INATTIVO : a.periodi.map((p) => `${p.dal}/${p.al}`).join(";");
}

export function testoAttivita(punto: string, esercizio: number, a: AttivitaContatore): string {
  if (a.inattivo) return `Nel ${esercizio} il contatore ${punto} non è stato attivo.`;
  const periodi = a.periodi.map((p) => `dal ${DATA_LUNGA(p.dal)} al ${DATA_LUNGA(p.al)}`);
  const elenco = periodi.length === 1 ? periodi[0] : `${periodi.slice(0, -1).join(", ")} e ${periodi.at(-1)}`;
  return `Nel ${esercizio} il contatore ${punto} è stato attivo solo ${elenco}.`;
}

/** La domanda, quando la dichiarazione non c'è ancora. */
export function domandaAttivita(punto: string, esercizio: number): string {
  return `Se nel ${esercizio} il contatore ${punto} è stato attivato, chiuso o sospeso, indica i periodi in cui è stato attivo — oppure che non lo è stato affatto.`;
}
