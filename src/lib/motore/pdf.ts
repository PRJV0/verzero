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

    // ═══ IL DIZIONARIO PRIMA DEL FLUSSO DICE CHE COS'È ═══
    // Un'immagine non contiene testo, e leggerla come se ne contenesse è
    // il modo in cui una scansione si travestiva da PDF nativo: i byte
    // di un JPEG contengono per caso le sequenze «BT» e «Tj», e il
    // conteggio ci trovava centomila caratteri inesistenti. Un documento
    // fotografato veniva così mandato al livello leggero, con l'attesa
    // di confidenza sbagliata. Trovato collaudando l'acquisizione da
    // fotocamera, ma valeva per OGNI scansione.
    const dizionario = grezzo.slice(Math.max(0, m.index - 400), m.index);
    if (/\/Subtype\s*\/Image|DCTDecode|JPXDecode|CCITTFaxDecode|JBIG2Decode/.test(dizionario)) {
      continue;
    }

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
  // Alcuni PDF non comprimono affatto i flussi di contenuto. Ma un
  // flusso che non si decomprime è quasi sempre binario, e il binario
  // non è testo: si accetta solo se è fatto in prevalenza di caratteri
  // stampabili, altrimenti bastava un «BT» capitato per caso dentro
  // un'immagine per farlo passare per contenuto.
  const testo = pezzo.toString("latin1");
  if (!/\b(BT|Tj|TJ)\b/.test(testo)) return null;
  return prevalentementeStampabile(testo) ? testo : null;
}

/** Almeno nove caratteri su dieci leggibili: sotto, sono byte. */
function prevalentementeStampabile(testo: string): boolean {
  const quanti = Math.min(testo.length, 4000);
  if (quanti === 0) return false;
  let stampabili = 0;
  for (let i = 0; i < quanti; i++) {
    const c = testo.charCodeAt(i);
    if (c === 9 || c === 10 || c === 13 || (c >= 32 && c <= 126)) stampabili++;
  }
  return stampabili / quanti >= 0.9;
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

/* ------------------------------------------------------------------ */
/* Il testo, quando serve misurare se conviene mandarlo                */
/* ------------------------------------------------------------------ */

/**
 * Il testo di un PDF nativo, estratto in locale.
 *
 * ═══ PERCHÉ ESISTE, E PERCHÉ NON È LA STRADA PRINCIPALE ═══
 * Mandare il testo invece del documento costa molto meno: niente pagine
 * da rendere. Ma un estrattore fatto in casa perde la STRUTTURA — le
 * colonne di una tabella diventano una sequenza di numeri senza
 * etichette — ed è esattamente il difetto dell'OCR, ottenuto in proprio
 * (docs/motore.md §3).
 *
 * Questa funzione esiste per MISURARE quella perdita invece di
 * supporla: `scripts/confronto-livelli.mjs --testo` legge lo stesso
 * documento nei due modi e confronta accuratezza e costo. Se un giorno i
 * numeri dicessero che sui documenti a campi fissi il testo basta,
 * diventerebbe una corsia in più — decisa sui numeri, non sull'intuito.
 *
 * Non ricostruisce le colonne e non ci prova: gli operatori di
 * posizionamento (`Td`, `TD`, `Tm`, `T*`) diventano ritorni a capo, il
 * resto è concatenato. È volutamente grezzo, perché il suo scopo è
 * mostrare quanto si perde.
 */
export function testoDelPdf(dati: Uint8Array): string {
  const grezzo = Buffer.from(dati).toString("latin1");
  const pezzi: string[] = [];
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
    if (!contenuto || !/\b(BT|Tj|TJ)\b/.test(contenuto)) continue;

    // Un passaggio solo sul flusso, in ordine: le stringhe mostrate
    // diventano testo, gli spostamenti di riga diventano capo.
    for (const t of contenuto.matchAll(
      /\(((?:\\.|[^\\()])*)\)\s*Tj|\[([\s\S]*?)\]\s*TJ|\b(T\*|Td|TD|Tm)\b/g,
    )) {
      if (t[1] !== undefined) {
        pezzi.push(sciogli(t[1]));
      } else if (t[2] !== undefined) {
        for (const s of t[2].matchAll(/\(((?:\\.|[^\\()])*)\)/g)) {
          pezzi.push(sciogli(s[1]));
        }
      } else {
        pezzi.push("\n");
      }
    }
  }

  return pezzi
    .join("")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Le sequenze di escape del PDF, sciolte. */
function sciogli(s: string): string {
  return s
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\n")
    .replace(/\\t/g, "\t")
    .replace(/\\([()\\])/g, "$1")
    .replace(/\\(\d{1,3})/g, (_, o) => String.fromCharCode(parseInt(o, 8)));
}
