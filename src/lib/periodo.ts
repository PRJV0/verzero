/**
 * PERIODO DI RENDICONTAZIONE vs DATA DI ELABORAZIONE (SPEC §12.C).
 *
 * Sono due cose diverse e vanno tenute separate ovunque, perché
 * confonderle produce documenti che nessun ente accetta: un inventario
 * delle emissioni si riferisce sempre a un ANNO SOLARE CHIUSO, mentre la
 * data di elaborazione è quando lo scriviamo. A metà 2026 si rendiconta
 * il 2025 — e il documento deve dirlo, in copertina.
 *
 * Da qui passa ogni titolo, ogni fascicolo e ogni richiesta al cliente:
 * «le bollette dei 12 mesi del 2025», non «le bollette dell'anno».
 */

/** L'ultimo anno solare chiuso: il default sensato per chiunque. */
export function annoRendicontazioneDefault(oggi = new Date()): number {
  return oggi.getFullYear() - 1;
}

/** L'anno in cui il documento viene prodotto. */
export function annoElaborazione(oggi = new Date()): number {
  return oggi.getFullYear();
}

/**
 * Gli anni proponibili nella scheda: l'ultimo chiuso e i due precedenti.
 * Più indietro non ha senso proporre — chi rendiconta il 2019 nel 2026
 * ha un problema diverso da un menu a tendina — e l'anno in corso non si
 * può scegliere, perché non è ancora finito.
 */
export function anniSelezionabili(oggi = new Date()): number[] {
  const ultimo = annoRendicontazioneDefault(oggi);
  return [ultimo, ultimo - 1, ultimo - 2];
}

/**
 * Il titolo completo di un documento: cosa è, a che anno si riferisce e
 * quando è stato elaborato. La forma è fissa perché diventi
 * riconoscibile — «Inventario GHG 2025 · elaborato nel 2026».
 */
export function intestazioneDocumento(
  nome: string,
  annoRendicontazione: number,
  elaborazione = annoElaborazione(),
): string {
  return `${nome} ${annoRendicontazione} · elaborato nel ${elaborazione}`;
}

/** Il periodo per esteso, per le righe dentro i documenti. */
export function periodoEsteso(anno: number): string {
  return `1 gennaio – 31 dicembre ${anno}`;
}

/** «i 12 mesi del 2025»: la formula con cui si chiedono i documenti. */
export function dodiciMesiDi(anno: number): string {
  return `i 12 mesi del ${anno}`;
}
