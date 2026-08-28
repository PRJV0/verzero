import {
  angoloDiInclinazione,
  esitoQualita,
  grigi,
  riquadroDocumento,
  type EsitoQualita,
  type Riquadro,
} from "./qualita";

/**
 * DALLO SCATTO ALLA PAGINA — la parte che ha bisogno del browser.
 *
 * Qui c'è solo ciò che senza un canvas non si può fare: decodificare un
 * file, ruotare, ritagliare, esportare un JPEG. Le decisioni — dove sta
 * il documento, quanto è storto, se si legge — stanno in `qualita.ts` e
 * si provano senza browser.
 *
 * ═══ HEIC ═══
 * L'utente iPhone non deve sapere che cosa sia. Safari sa decodificare
 * l'HEIC, quindi disegnarlo su un canvas ed esportarlo in JPEG lo
 * converte senza librerie e senza che nessuno se ne accorga. Dove il
 * browser non lo sa fare — Chrome e Firefox su desktop — non si finge:
 * si dice che cosa fare, in italiano.
 */

/**
 * Il lato lungo a cui si porta lo scatto.
 *
 * Serve a due cose opposte e va tenuto in mezzo: sotto i 1.240 pixel di
 * larghezza del DOCUMENTO il testo non si legge più (`SOGLIE`), sopra i
 * dodici megapixel di una fotocamera moderna il file pesa quanto un
 * video. A 2.400 pixel un A4 sta a circa 290 punti per pollice — quasi
 * il doppio del minimo — e una pagina pesa uno o due megabyte.
 */
export const LATO_MASSIMO = 2400;

/** La qualità JPEG di partenza. Si abbassa solo se la pagina pesa troppo. */
const QUALITA_INIZIALE = 0.85;
const QUALITA_MINIMA = 0.55;

/** Quanto può pesare una pagina prima di ricomprimerla più stretta. */
export const MAX_BYTE_PAGINA = 2_500_000;

/**
 * Quante pagine si possono cucire in un documento solo.
 *
 * Non è un limite tecnico ma di buon senso: oltre, il file supera i venti
 * megabyte dell'archivio e soprattutto nessuno riesce più a controllare
 * le righe una per una. Un registro più lungo si divide in due, e il
 * portale lo dice.
 */
export const MAX_PAGINE = 12;

export class ErroreScatto extends Error {}

/* ------------------------------------------------------------------ */
/* Decodifica                                                          */
/* ------------------------------------------------------------------ */

async function decodifica(file: File): Promise<ImageBitmap> {
  try {
    return await createImageBitmap(file);
  } catch {
    const heic = /heic|heif/i.test(file.type) || /\.hei[cf]$/i.test(file.name);
    throw new ErroreScatto(
      heic
        ? "Questo browser non sa aprire le foto in formato HEIC. Dal telefono funziona; da computer, riesporta la foto in JPEG."
        : "Non siamo riusciti ad aprire questa immagine. Riprova, oppure scattala di nuovo.",
    );
  }
}

/* ------------------------------------------------------------------ */
/* Il lavoro sul canvas                                                */
/* ------------------------------------------------------------------ */

function tela(larghezza: number, altezza: number) {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(larghezza));
  canvas.height = Math.max(1, Math.round(altezza));
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new ErroreScatto("Il browser non mette a disposizione un canvas.");
  return { canvas, ctx };
}

/**
 * Allunga i livelli: il più scuro diventa nero, il più chiaro bianco.
 *
 * Deliberatamente MITE — si tagliano solo i due per cento agli estremi.
 * Un contrasto spinto su una scansione già pulita mangia i tratti
 * sottili, ed è il modo più facile di peggiorare credendo di migliorare
 * (docs/motore.md §3).
 */
function allungaLivelli(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const img = ctx.getImageData(0, 0, w, h);
  const g = grigi({ dati: img.data, larghezza: w, altezza: h });

  const isto = new Array(256).fill(0);
  for (const v of g) isto[v]++;
  const totale = g.length;
  const taglio = totale * 0.02;

  let basso = 0;
  let accumulato = 0;
  while (basso < 255 && accumulato + isto[basso] < taglio) accumulato += isto[basso++];

  let alto = 255;
  accumulato = 0;
  while (alto > 0 && accumulato + isto[alto] < taglio) accumulato += isto[alto--];

  // Un intervallo troppo stretto significa un'immagine quasi piatta:
  // allungarla amplificherebbe solo il rumore.
  if (alto - basso < 40) return;

  const scala = 255 / (alto - basso);
  for (let i = 0; i < img.data.length; i += 4) {
    for (let c = 0; c < 3; c++) {
      img.data[i + c] = (img.data[i + c] - basso) * scala;
    }
  }
  ctx.putImageData(img, 0, 0);
}

/** Il JPEG di un canvas, ricompresso più stretto se pesa troppo. */
async function jpegDaTela(canvas: HTMLCanvasElement): Promise<Uint8Array> {
  let qualita = QUALITA_INIZIALE;
  for (;;) {
    const blob = await new Promise<Blob | null>((r) =>
      canvas.toBlob(r, "image/jpeg", qualita),
    );
    if (!blob) throw new ErroreScatto("Non siamo riusciti a preparare l'immagine.");
    if (blob.size <= MAX_BYTE_PAGINA || qualita <= QUALITA_MINIMA) {
      return new Uint8Array(await blob.arrayBuffer());
    }
    qualita -= 0.1;
  }
}

/* ------------------------------------------------------------------ */
/* Conversione e basta                                                 */
/* ------------------------------------------------------------------ */

/** Il file è un HEIC/HEIF, dal tipo dichiarato o dal nome? */
export function eHeic(file: { type?: string; name: string }): boolean {
  return /heic|heif/i.test(file.type ?? "") || /\.hei[cf]$/i.test(file.name);
}

/**
 * SOLO LA CONVERSIONE, per il caricamento normale.
 *
 * Non è `preparaPagina`: quella ritaglia, raddrizza e alza il contrasto,
 * ed è giusto per uno scatto appena fatto. Un file che qualcuno trascina
 * dentro non l'ha chiesto — trasformarglielo di nascosto sarebbe fare
 * qualcosa che non ci ha chiesto su un documento che poi porta la nostra
 * validazione. Qui si cambia solo il formato: si decodifica e si
 * riesporta in JPEG, ridimensionando se il lato è enorme.
 *
 * Serve perché la catena di lettura non sa aprire l'HEIC, e finora il
 * file veniva caricato lo stesso e falliva DOPO — con l'archivio già
 * sporcato da un documento illeggibile.
 */
export async function convertiInJpeg(file: File): Promise<File> {
  const bitmap = await decodifica(file);
  const fattore = Math.min(
    1,
    LATO_MASSIMO / Math.max(bitmap.width, bitmap.height),
  );
  const w = Math.round(bitmap.width * fattore);
  const h = Math.round(bitmap.height * fattore);
  const t = tela(w, h);
  t.ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close?.();

  const jpeg = await jpegDaTela(t.canvas);
  const nome = file.name.replace(/\.hei[cf]$/i, "") + ".jpg";
  return new File([new Uint8Array(jpeg)], nome, { type: "image/jpeg" });
}

/* ------------------------------------------------------------------ */
/* La pagina pronta                                                    */
/* ------------------------------------------------------------------ */

export type Pagina = {
  /** Identificativo stabile: serve al riordino e alla cancellazione. */
  id: string;
  jpeg: Uint8Array;
  larghezza: number;
  altezza: number;
  /** L'anteprima da mostrare (object URL del JPEG finale). */
  anteprima: string;
  qualita: EsitoQualita;
  /** Che cosa abbiamo fatto noi: si dice, non si fa di nascosto. */
  ritagliata: boolean;
  raddrizzataDi: number;
  /** L'originale, per rifare il lavoro con altre scelte. */
  originale: File;
};

export type OpzioniScatto = {
  /** Il cliente ha detto di non ritagliare: la sua parola vince. */
  senzaRitaglio?: boolean;
  /** Rotazione aggiuntiva in gradi, decisa a mano. */
  rotazione?: number;
  /** Il cliente ha spento il miglioramento del contrasto. */
  senzaContrasto?: boolean;
};

/**
 * Prepara una pagina: decodifica, cerca il documento, raddrizza, ritaglia,
 * migliora il contrasto, misura la qualità ed esporta il JPEG.
 *
 * Tutto quello che facciamo all'immagine è REVERSIBILE: l'originale resta
 * in `originale`, e cambiando le opzioni si rifà da capo. È la
 * condizione perché le correzioni automatiche siano modificabili a mano
 * senza costringere a riscattare.
 */
export async function preparaPagina(
  file: File,
  opzioni: OpzioniScatto = {},
): Promise<Pagina> {
  const bitmap = await decodifica(file);

  /* — 1. Alla misura di lavoro — */
  const fattore = Math.min(1, LATO_MASSIMO / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * fattore);
  const h = Math.round(bitmap.height * fattore);
  const base = tela(w, h);
  base.ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close?.();

  /* — 2. Dove sta il documento, e quanto è storto — */
  const dati = base.ctx.getImageData(0, 0, w, h);
  const g = grigi({ dati: dati.data, larghezza: w, altezza: h });
  const riquadro = opzioni.senzaRitaglio ? null : riquadroDocumento(g, w, h);
  const inclinazione = angoloDiInclinazione(g, w, h);
  const rotazione = (opzioni.rotazione ?? 0) - inclinazione;

  /* — 3. Raddrizzo e ritaglio, in un disegno solo — */
  const zona: Riquadro = riquadro ?? { x: 0, y: 0, larghezza: w, altezza: h };
  const rad = (rotazione * Math.PI) / 180;
  // Ruotando, il riquadro utile si allarga: si tiene la misura piena così
  // la rotazione non taglia gli angoli del foglio.
  const larghezzaFinale = Math.round(
    Math.abs(zona.larghezza * Math.cos(rad)) + Math.abs(zona.altezza * Math.sin(rad)),
  );
  const altezzaFinale = Math.round(
    Math.abs(zona.larghezza * Math.sin(rad)) + Math.abs(zona.altezza * Math.cos(rad)),
  );

  const finale = tela(larghezzaFinale, altezzaFinale);
  finale.ctx.fillStyle = "#ffffff";
  finale.ctx.fillRect(0, 0, larghezzaFinale, altezzaFinale);
  finale.ctx.translate(larghezzaFinale / 2, altezzaFinale / 2);
  finale.ctx.rotate(rad);
  finale.ctx.drawImage(
    base.canvas,
    zona.x,
    zona.y,
    zona.larghezza,
    zona.altezza,
    -zona.larghezza / 2,
    -zona.altezza / 2,
    zona.larghezza,
    zona.altezza,
  );
  finale.ctx.setTransform(1, 0, 0, 1, 0, 0);

  if (!opzioni.senzaContrasto) {
    allungaLivelli(finale.ctx, larghezzaFinale, altezzaFinale);
  }

  /* — 4. Il verdetto, sull'immagine come sarà inviata — */
  const finali = finale.ctx.getImageData(0, 0, larghezzaFinale, altezzaFinale);
  const qualita = esitoQualita({
    dati: finali.data,
    larghezza: larghezzaFinale,
    altezza: altezzaFinale,
  });

  const jpeg = await jpegDaTela(finale.canvas);

  return {
    id: `${Date.now()}-${Math.round(performance.now() * 1000)}`,
    jpeg,
    larghezza: larghezzaFinale,
    altezza: altezzaFinale,
    anteprima: URL.createObjectURL(new Blob([jpeg as BlobPart], { type: "image/jpeg" })),
    qualita,
    ritagliata: riquadro !== null,
    raddrizzataDi: Math.round(inclinazione * 10) / 10,
    originale: file,
  };
}
