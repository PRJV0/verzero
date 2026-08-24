import { inflateSync, inflateRawSync } from "node:zlib";

/**
 * NATIVO O SCANSIONE? (docs/motore.md §3)
 *
 * Un PDF può essere due cose molto diverse: un documento con strato di
 * testo, generato da un gestionale, o un'immagine dentro un contenitore
 * PDF — una scansione, o una foto salvata in PDF.
 *
 * ═══ COSA DECIDE, E COSA NON DECIDE ═══
 * NON decide come si manda il file: il PDF si invia all'API così com'è in
 * entrambi i casi, perché il lato server il testo lo estrae già e un
 * estrattore fatto in casa restituirebbe la tabella delle fasce come una
 * colonna di numeri senza etichette — lo stesso difetto dell'OCR,
 * ottenuto in proprio.
 *
 * Decide come si TRATTA il risultato: la provenienza predefinita dei
 * campi (`testo` o `immagine`), l'attesa di confidenza, l'avviso di
 * qualità, il costo previsto e cosa si dice al cliente mentre aspetta.
 *
 * Il rilevamento è locale e non costa niente: si decomprimono i flussi di
 * contenuto e si guarda quanto testo contengono. `zlib` è nel runtime,
 * nessuna dipendenza.
 */

/** Sotto questa media di caratteri per pagina, è una scansione. */
export const SOGLIA_CARATTERI_PAGINA = 180;

export type NaturaPdf = {
  pagine: number;
  caratteriTesto: number;
  /** Ha uno strato di testo utile. Nel dubbio, `false`. */
  nativo: boolean;
};

/**
 * Nel dubbio si dice SCANSIONE. Non è simmetrico: trattare un nativo come
 * scansione costa qualche centesimo in più e un avviso di troppo;
 * trattare una scansione come nativo significa aspettarsi un testo che
 * non c'è e credere che il documento sia illeggibile.
 */
export function naturaPdf(dati: Uint8Array): NaturaPdf {
  const grezzo = Buffer.from(dati).toString("latin1");
  const pagine = contaPagine(grezzo);
  const caratteri = contaCaratteriDiTesto(dati, grezzo);
  return {
    pagine,
    caratteriTesto: caratteri,
    nativo: caratteri / Math.max(1, pagine) >= SOGLIA_CARATTERI_PAGINA,
  };
}

/**
 * Le pagine, dall'albero delle pagine. Si preferisce il `/Count` del nodo
 * radice quando c'è; altrimenti si contano gli oggetti pagina. Il
 * risultato non è mai zero: un PDF senza pagine non esiste, e uno zero
 * qui farebbe passare qualunque documento per «pieno di testo».
 */
function contaPagine(grezzo: string): number {
  const conteggi = [...grezzo.matchAll(/\/Type\s*\/Pages\b[\s\S]{0,600}?\/Count\s+(\d+)/g)]
    .map((m) => Number(m[1]))
    .filter((n) => Number.isFinite(n) && n > 0);
  if (conteggi.length > 0) return Math.max(...conteggi);

  const oggetti = grezzo.match(/\/Type\s*\/Page(?![s\w])/g);
  return oggetti && oggetti.length > 0 ? oggetti.length : 1;
}

/**
 * Quanto testo contengono i flussi di contenuto. Si guardano le stringhe
 * mostrate dagli operatori di testo (`Tj`, `TJ`, `'`, `"`): il resto del
 * flusso sono coordinate e comandi grafici, che ci sono anche in una
 * scansione (l'immagine va pur posizionata).
 */
function contaCaratteriDiTesto(dati: Uint8Array, grezzo: string): number {
  let totale = 0;
  const marcatore = /stream\r?\n?/g;
  let m: RegExpExecArray | null;

  while ((m = marcatore.exec(grezzo)) !== null) {
    const inizio = m.index + m[0].length;
    const fine = grezzo.indexOf("endstream", inizio);
    if (fine < 0) break;
    marcatore.lastIndex = fine;

    const pezzo = Buffer.from(dati.slice(inizio, fine));
    if (pezzo.length === 0 || pezzo.length > 8 * 1024 * 1024) continue;

    const contenuto = decomprimi(pezzo);
    if (!contenuto) continue;
    // Un flusso di contenuto ha operatori di testo; un flusso immagine no.
    if (!/\b(BT|Tj|TJ)\b/.test(contenuto)) continue;
    totale += lunghezzaTestoMostrato(contenuto);
    if (totale > 2_000_000) break; // basta: è certamente nativo
  }
  return totale;
}

/** Flate, raw, o già in chiaro. Se non si apre, non è testo per noi. */
function decomprimi(pezzo: Buffer): string | null {
  for (const prova of [inflateSync, inflateRawSync]) {
    try {
      return prova(pezzo).toString("latin1");
    } catch {
      /* si passa al tentativo successivo */
    }
  }
  // Alcuni PDF non comprimono affatto i flussi di contenuto.
  const testo = pezzo.toString("latin1");
  return /\b(BT|Tj|TJ)\b/.test(testo) ? testo : null;
}

/** I caratteri davvero mostrati: stringhe letterali `(…)` ed esadecimali. */
function lunghezzaTestoMostrato(contenuto: string): number {
  let n = 0;
  for (const s of contenuto.matchAll(/\(((?:\\.|[^\\()])*)\)/g)) {
    n += s[1].replace(/\\./g, "x").length;
  }
  for (const s of contenuto.matchAll(/<([0-9A-Fa-f\s]{2,})>/g)) {
    n += Math.floor(s[1].replace(/\s/g, "").length / 2);
  }
  return n;
}
