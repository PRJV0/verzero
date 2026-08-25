/**
 * DA N FOTOGRAFIE A UN DOCUMENTO SOLO.
 *
 * ═══ PERCHÉ UN PDF E NON N IMMAGINI ═══
 * Un registro sta su più fogli, e chi lo fotografa sta fotografando UN
 * documento. Caricarlo come cinque immagini separate significherebbe
 * cinque righe in archivio, cinque letture, cinque conferme e cinque
 * volte la domanda «che documento è?» — per una cosa sola. Le pagine si
 * cuciono qui, nel browser, e al Motore arriva quello che è davvero: un
 * documento di cinque pagine.
 *
 * ═══ IL JPEG NON SI RICOMPRIME ═══
 * Un PDF può contenere un JPEG così com'è, con `/DCTDecode`: i byte
 * dello scatto finiscono dentro il file senza passare da una seconda
 * compressione. È la ragione per cui questo non richiede nessuna
 * libreria e, soprattutto, per cui la qualità che abbiamo misurato prima
 * dell'invio è la stessa che il Motore riceverà — una ricompressione
 * avrebbe reso bugiarda la misura.
 *
 * Niente browser, niente canvas: byte in, byte out. Si prova in Node.
 */

export type PaginaScatto = {
  /** I byte del JPEG, così come escono dalla fotocamera o dal canvas. */
  jpeg: Uint8Array;
  larghezza: number;
  altezza: number;
};

/** Un punto tipografico: 72 per pollice, l'unità in cui misura il PDF. */
const PUNTI_PER_POLLICE = 72;
/**
 * A quanti punti per pollice si impagina lo scatto.
 *
 * Non cambia un pixel dell'immagine — cambia solo quanto grande viene
 * disegnata sulla pagina. 150 è la densità a cui un A4 fotografato a
 * 1.240 pixel occupa esattamente la sua pagina: sotto, le pagine
 * risulterebbero più grandi del vero senza aggiungere un dettaglio.
 */
const DENSITA = 150;

/** I byte di una stringa, come li scrive un PDF (un byte per carattere). */
function byte(testo: string): Uint8Array {
  const out = new Uint8Array(testo.length);
  for (let i = 0; i < testo.length; i++) out[i] = testo.charCodeAt(i) & 0xff;
  return out;
}

/**
 * Cuce le pagine in un PDF.
 *
 * La struttura è la più semplice che un lettore accetti: catalogo, albero
 * delle pagine, e per ogni pagina un oggetto pagina, un flusso di
 * contenuto di due righe e l'immagine come XObject. La tabella xref è
 * scritta con gli scostamenti veri — un PDF con xref sbagliata si apre
 * lo stesso in molti lettori, ma non in tutti, e «molti» non basta per
 * un documento che il cliente porterà a un audit.
 */
export function pdfDaScatti(pagine: PaginaScatto[]): Uint8Array {
  if (pagine.length === 0) throw new Error("Nessuna pagina da unire.");

  const pezzi: Uint8Array[] = [];
  let lunghezza = 0;
  const scrivi = (dati: Uint8Array | string) => {
    const b = typeof dati === "string" ? byte(dati) : dati;
    pezzi.push(b);
    lunghezza += b.length;
  };

  // Numerazione: 1 catalogo, 2 albero pagine, poi tre oggetti per pagina.
  const primoDiPagina = (i: number) => 3 + i * 3;
  const totaleOggetti = 2 + pagine.length * 3;
  const scostamenti = new Array<number>(totaleOggetti + 1).fill(0);

  const oggetto = (numero: number, corpo: string, flusso?: Uint8Array) => {
    scostamenti[numero] = lunghezza;
    scrivi(`${numero} 0 obj\n${corpo}\n`);
    if (flusso) {
      scrivi("stream\n");
      scrivi(flusso);
      scrivi("\nendstream\n");
    }
    scrivi("endobj\n");
  };

  scrivi("%PDF-1.4\n");
  // Un commento con byte alti: dichiara che il file è binario, e alcuni
  // strumenti lo usano per non trattarlo come testo.
  scrivi(new Uint8Array([0x25, 0xe2, 0xe3, 0xcf, 0xd3, 0x0a]));

  oggetto(1, "<< /Type /Catalog /Pages 2 0 R >>");

  const figli = pagine.map((_, i) => `${primoDiPagina(i)} 0 R`).join(" ");
  oggetto(2, `<< /Type /Pages /Kids [${figli}] /Count ${pagine.length} >>`);

  pagine.forEach((p, i) => {
    const nPagina = primoDiPagina(i);
    const nContenuto = nPagina + 1;
    const nImmagine = nPagina + 2;

    const larghezzaPt = (p.larghezza / DENSITA) * PUNTI_PER_POLLICE;
    const altezzaPt = (p.altezza / DENSITA) * PUNTI_PER_POLLICE;

    oggetto(
      nPagina,
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${larghezzaPt.toFixed(2)} ${altezzaPt.toFixed(2)}] ` +
        `/Resources << /XObject << /Im0 ${nImmagine} 0 R >> >> /Contents ${nContenuto} 0 R >>`,
    );

    // L'immagine occupa la pagina intera: la matrice dice quanto è
    // grande e dove comincia, e non c'è altro da disegnare.
    const contenuto = byte(
      `q\n${larghezzaPt.toFixed(2)} 0 0 ${altezzaPt.toFixed(2)} 0 0 cm\n/Im0 Do\nQ`,
    );
    oggetto(nContenuto, `<< /Length ${contenuto.length} >>`, contenuto);

    oggetto(
      nImmagine,
      `<< /Type /XObject /Subtype /Image /Width ${p.larghezza} /Height ${p.altezza} ` +
        `/ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${p.jpeg.length} >>`,
      p.jpeg,
    );
  });

  const inizioXref = lunghezza;
  let xref = `xref\n0 ${totaleOggetti + 1}\n0000000000 65535 f \n`;
  for (let n = 1; n <= totaleOggetti; n++) {
    xref += `${String(scostamenti[n]).padStart(10, "0")} 00000 n \n`;
  }
  scrivi(xref);
  scrivi(
    `trailer\n<< /Size ${totaleOggetti + 1} /Root 1 0 R >>\nstartxref\n${inizioXref}\n%%EOF\n`,
  );

  const out = new Uint8Array(lunghezza);
  let posizione = 0;
  for (const p of pezzi) {
    out.set(p, posizione);
    posizione += p.length;
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* Il nome del file                                                    */
/* ------------------------------------------------------------------ */

/**
 * Come si chiamerà il documento in archivio.
 *
 * Il nome non è un dettaglio: è ciò che il riconoscimento automatico
 * legge per capire che documento sia (`src/lib/documenti.ts`). Una foto
 * si chiama `IMG_4821.HEIC` e non dice niente a nessuno, quindi il nome
 * lo componiamo noi dal tipo che il cliente ha scelto — e se non l'ha
 * scelto, resta generico e il portale glielo chiederà, che è meglio di
 * indovinare.
 */
export function nomeDelloScatto(tipo: string | null, pagine: number): string {
  const quando = new Date().toISOString().slice(0, 10);
  const base = tipo ? tipo.replace(/[^a-z0-9-]/gi, "-") : "documento-fotografato";
  const quante = pagine > 1 ? `-${pagine}pagine` : "";
  return `${base}-${quando}${quante}.pdf`;
}
