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

export type AssenzaDichiarabile = "combustibili" | "gas" | "carburanti";

export const ASSENZE_DICHIARABILI: readonly AssenzaDichiarabile[] = ["combustibili", "gas", "carburanti"];

export type Dichiarazione = {
  esercizio: number;
  /** La frase che l'organizzazione dichiara, o la domanda a cui risponde. */
  testo: string;
  /** Una dichiarazione è già resa: il rimedio è correggerla o ritirarla. */
  resa: boolean;
} & (
  | { tipo: "assenza"; fonte: AssenzaDichiarabile }
  | {
      tipo: "periodo-contatore";
      punto: string;
      /** Il valore già dichiarato, quando c'è. */
      valore?: string;
    }
);

/** Le chiavi della scheda impresa, con l'esercizio dentro. */
export function chiaveAssenza(fonte: AssenzaDichiarabile, esercizio: number): string {
  return `ghg_assenza_${fonte}_${esercizio}`;
}

/**
 * Il codice di un contatore dentro una chiave: lettere e cifre, maiuscole.
 * `null` quando non ne resta un codice plausibile — allora la
 * dichiarazione non si offre, perché non si saprebbe a che cosa legarla.
 */
export function puntoPerChiave(punto: string): string | null {
  const pulito = punto.toUpperCase().replace(/[^A-Z0-9]/g, "");
  return pulito.length >= 6 && pulito.length <= 40 ? pulito : null;
}

export function chiaveAttivita(punto: string, esercizio: number): string | null {
  const p = puntoPerChiave(punto);
  return p ? `ghg_attivita_${p}_${esercizio}` : null;
}

export function testoAssenza(fonte: AssenzaDichiarabile, esercizio: number): string {
  switch (fonte) {
    case "combustibili":
      return `Nel ${esercizio} l'organizzazione non ha avuto consumi diretti di combustibili: nessun impianto alimentato a gas, gasolio o GPL — caldaie, forni, generatori — e nessun rifornimento di carburante per veicoli o macchine in uso, di proprietà, a noleggio o in leasing.`;
    case "gas":
      return `Nel ${esercizio} l'organizzazione non ha avuto consumi di gas naturale.`;
    case "carburanti":
      return `Nel ${esercizio} l'organizzazione non ha fatto rifornimenti di carburante per veicoli o macchine in uso, di proprietà, a noleggio o in leasing.`;
  }
}

/* ── Il periodo di attività di un contatore ─────────────────────────── */

export const CONTATORE_INATTIVO = "inattivo";

export type AttivitaContatore = { inattivo: true } | { inattivo: false; periodo: Periodo };

/**
 * Il valore dichiarato: «AAAA-MM-GG/AAAA-MM-GG» dentro l'esercizio, oppure
 * «inattivo». Qualunque altra cosa non è una dichiarazione — né per il
 * portale che la scrive né per il documento che la legge.
 */
export function leggiAttivita(valore: string | null | undefined, esercizio: number): AttivitaContatore | null {
  if (valore === CONTATORE_INATTIVO) return { inattivo: true };
  const parti = (valore ?? "").split("/");
  if (parti.length !== 2) return null;
  const [dal, al] = parti;
  if (!dataValida(dal) || !dataValida(al) || dal > al) return null;
  if (!dal.startsWith(`${esercizio}-`) || !al.startsWith(`${esercizio}-`)) return null;
  return { inattivo: false, periodo: { dal, al } };
}

export function valoreAttivita(a: AttivitaContatore): string {
  return a.inattivo ? CONTATORE_INATTIVO : `${a.periodo.dal}/${a.periodo.al}`;
}

export function testoAttivita(punto: string, esercizio: number, a: AttivitaContatore): string {
  return a.inattivo
    ? `Nel ${esercizio} il contatore ${punto} non è stato attivo.`
    : `Nel ${esercizio} il contatore ${punto} è stato attivo solo dal ${DATA_LUNGA(a.periodo.dal)} al ${DATA_LUNGA(a.periodo.al)}.`;
}

/** La domanda, quando la dichiarazione non c'è ancora. */
export function domandaAttivita(punto: string, esercizio: number): string {
  return `Se nel ${esercizio} il contatore ${punto} è stato attivato, chiuso o sospeso, indica il periodo in cui è stato attivo — oppure che non lo è stato affatto.`;
}
