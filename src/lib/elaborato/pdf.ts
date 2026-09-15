import "server-only";

import { readFileSync } from "node:fs";
import { join } from "node:path";

import PDFDocument from "pdfkit";

import { geometriaLogotipo } from "@/lib/marchio-svg";

import type { ElaboratoConsegnabile } from "./consegna";
import {
  eValore,
  segmenti,
  type Blocco,
  type Cella,
  type Elaborato,
  type Fonte,
  type Valore,
} from "./contenuto";
import { DATA_LUNGA } from "./fonti";
import {
  LARGHEZZA_MINIMA_COPERTINA,
  posaLogo,
  SCATOLE_LOGO,
  type Veste,
} from "./veste";

/**
 * IL DOCUMENTO IN PDF — l'impaginazione, e nient'altro.
 *
 * ═══ CHE COSA FA E CHE COSA NON FA ═══
 * Legge un elaborato già composto e già passato dal controllo di
 * consegna, e lo mette sulla carta: copertina, indice con i numeri di
 * pagina, sezioni, appendici, intestazioni e piè di pagina con la veste
 * del cliente. Non aggiunge una parola che il cliente legga — tutto il
 * testo nasce in `componi.ts` — e non decide niente sul contenuto.
 *
 * ═══ PERCHÉ PDFKIT, E NON UN HTML STAMPATO ═══
 * Serve controllare la pagina: una riga di tabella che non si spezza a
 * metà, l'intestazione di colonna ripetuta sulla pagina dopo, un titolo
 * che non resta orfano in fondo al foglio, l'indice che conosce i numeri
 * di pagina. E serve che il carattere sia incorporato, perché il documento
 * si apre su computer che Inter non ce l'hanno.
 *
 * ═══ LA SIGLA ACCANTO AL DATO ═══
 * Piccola, in una pastiglia grigia, dopo il valore: si legge senza
 * interrompere la riga e porta con un clic alla voce del registro delle
 * fonti. È cliccabile solo nel PDF; stampata resta leggibile.
 */

/* ------------------------------------------------------------------ */
/* Le misure della pagina                                              */
/* ------------------------------------------------------------------ */

const A4 = { larghezza: 595.28, altezza: 841.89 };
const MARGINE = { sinistra: 62, destra: 62, alto: 78, basso: 70 };
const LARGHEZZA_UTILE = A4.larghezza - MARGINE.sinistra - MARGINE.destra;
const LIMITE_BASSO = A4.altezza - MARGINE.basso;

const CORPO = { dimensione: 9.4, interlinea: 3.6 };
const NOTA = { dimensione: 7.2, interlinea: 2 };
const TABELLA = { dimensione: 8.1, testata: 6.6, pad: 4.2, padV: 3.6 };
const SIGLA = { dimensione: 5.6, altezza: 7.6, pad: 1.8 };

const CARATTERI = {
  testo: "Inter-Regular.ttf",
  corsivo: "Inter-Italic.ttf",
  medio: "Inter-Medium.ttf",
  semi: "Inter-SemiBold.ttf",
  grassetto: "Inter-Bold.ttf",
  titolo: "InterDisplay-SemiBold.ttf",
} as const;
type Carattere = keyof typeof CARATTERI;

let cacheCaratteri: Record<Carattere, Buffer> | null = null;

/**
 * I caratteri si leggono dal disco una volta per processo. Stanno in
 * `src/lib/elaborato/caratteri/` e non in `public/`: non sono una risorsa
 * del sito, sono una parte del generatore — e `next.config.ts` li porta
 * nel pacchetto delle funzioni che generano.
 */
function caratteri(): Record<Carattere, Buffer> {
  if (cacheCaratteri) return cacheCaratteri;
  const cartella = join(process.cwd(), "src", "lib", "elaborato", "caratteri");
  cacheCaratteri = Object.fromEntries(
    Object.entries(CARATTERI).map(([k, f]) => [k, readFileSync(join(cartella, f))]),
  ) as Record<Carattere, Buffer>;
  return cacheCaratteri;
}

const MAIUSCOLO = (s: string) => s.toLocaleUpperCase("it-IT");

type Doc = InstanceType<typeof PDFDocument>;

type VoceIndice = { chiave: string; numero?: number; titolo: string; pagina: number };

/* ------------------------------------------------------------------ */
/* L'impaginatore                                                       */
/* ------------------------------------------------------------------ */

class Impaginatore {
  readonly doc: Doc;
  readonly c: Veste["colori"];
  private indice: VoceIndice[] = [];
  private paginaIndice = -1;
  private paginaCopertina = 0;
  private readonly e: Elaborato;
  private readonly veste: Veste;
  private readonly anteprima: boolean;
  /** Il logo aperto una volta: incorporato una volta, richiamato su ogni pagina. */
  private logoAperto: PDFKit.Mixins.ImageSrc | null = null;

  // Niente proprietà nei parametri del costruttore: le prove girano su
  // Node, che toglie i tipi ma non riscrive la sintassi.
  constructor(e: Elaborato, veste: Veste, anteprima: boolean) {
    this.e = e;
    this.veste = veste;
    this.anteprima = anteprima;
    this.c = veste.colori;
    this.doc = new PDFDocument({
      size: "A4",
      autoFirstPage: false,
      bufferPages: true,
      pdfVersion: "1.7",
      lang: "it-IT",
      displayTitle: true,
      margins: { top: MARGINE.alto, bottom: MARGINE.basso, left: MARGINE.sinistra, right: MARGINE.destra },
      info: {
        Title: `${e.frontespizio.titolo} — ${e.frontespizio.organizzazione}`,
        Author: e.frontespizio.organizzazione,
        Subject: e.frontespizio.occhiello,
        Keywords: [e.frontespizio.codice, e.frontespizio.costruitoSu ?? ""].filter(Boolean).join(", "),
        Creator: "Verzero",
        // La data del documento è quella della revisione, non quella del
        // file: rigenerare lo stesso contenuto dà lo stesso documento.
        CreationDate: new Date(e.revisione.data),
      },
    });
    const f = caratteri();
    for (const k of Object.keys(CARATTERI) as Carattere[]) this.doc.registerFont(k, f[k]);
    // `openImage` c'è in PDFKit e manca nelle sue definizioni di tipo.
    if (veste.logo) {
      this.logoAperto = (this.doc as unknown as { openImage(src: Buffer): PDFKit.Mixins.ImageSrc }).openImage(
        Buffer.from(veste.logo.png),
      );
    }
  }

  /* ── utilità di testo ─────────────────────────────────────────── */

  private font(k: Carattere, dimensione: number, colore = this.c.inchiostro) {
    this.doc.font(k).fontSize(dimensione).fillColor(colore);
    return this.doc;
  }

  /**
   * Le misure si prendono con le STESSE opzioni con cui si scrive: le
   * cifre tabellari sono più larghe di quelle proporzionali, e una sigla
   * posata con la misura sbagliata finisce sopra l'ultima cifra.
   */
  private altezza(
    testo: string,
    k: Carattere,
    dimensione: number,
    larghezza: number,
    interlinea: number,
    extra: { characterSpacing?: number; tabellari?: boolean } = {},
  ) {
    this.doc.font(k).fontSize(dimensione);
    return this.doc.heightOfString(testo || " ", {
      width: larghezza,
      lineGap: interlinea,
      ...(extra.characterSpacing ? { characterSpacing: extra.characterSpacing } : {}),
      ...(extra.tabellari ? { features: ["tnum"] } : {}),
    });
  }

  private larghezzaTesto(testo: string, k: Carattere, dimensione: number, spaziatura = 0, tabellari = false) {
    this.doc.font(k).fontSize(dimensione);
    return this.doc.widthOfString(testo, {
      characterSpacing: spaziatura,
      ...(tabellari ? { features: ["tnum"] } : {}),
    });
  }

  /**
   * Un testo che DEVE stare su una riga — il nome nell'intestazione, i dati
   * del piè di pagina. PDFKit ignora `lineBreak: false` quando riceve una
   * larghezza e va a capo lo stesso, sopra il filetto: qui il corpo si
   * riduce fino a un minimo, poi il testo si accorcia con i puntini. Chi
   * scrive poi lo posa SENZA larghezza.
   */
  private suUnaRiga(testo: string, k: Carattere, dimensione: number, larghezza: number, tabellari = false) {
    const minimo = dimensione * 0.85;
    let d = dimensione;
    while (d > minimo && this.larghezzaTesto(testo, k, d, 0, tabellari) > larghezza) d -= 0.1;
    let t = testo;
    while (t.length > 1 && this.larghezzaTesto(t, k, d, 0, tabellari) > larghezza) t = `${t.slice(0, -2).trimEnd()}…`;
    return { testo: t, dimensione: d, larghezza: this.larghezzaTesto(t, k, d, 0, tabellari) };
  }

  private spazio() {
    return LIMITE_BASSO - this.doc.y;
  }

  private pagina() {
    this.doc.addPage({
      size: "A4",
      margins: { top: MARGINE.alto, bottom: MARGINE.basso, left: MARGINE.sinistra, right: MARGINE.destra },
    });
    this.doc.x = MARGINE.sinistra;
    this.doc.y = MARGINE.alto;
  }

  private assicura(altezza: number) {
    if (this.spazio() < altezza) this.pagina();
  }

  private indicePagina() {
    return this.doc.bufferedPageRange().start + this.doc.bufferedPageRange().count - 1;
  }

  /** Un paragrafo con i grassetti marcati: segmenti continui, stessa riga. */
  private paragrafo(
    testo: string,
    opz: { dimensione?: number; interlinea?: number; colore?: string; larghezza?: number; x?: number; dopo?: number } = {},
  ) {
    const dimensione = opz.dimensione ?? CORPO.dimensione;
    const interlinea = opz.interlinea ?? CORPO.interlinea;
    const larghezza = opz.larghezza ?? LARGHEZZA_UTILE;
    const x = opz.x ?? MARGINE.sinistra;
    // La punteggiatura che segue un grassetto resta attaccata alla sua
    // parola: fra due segmenti il testo può andare a capo, e una virgola a
    // inizio riga è un errore di stampa.
    const parti = segmenti(testo).map((p) => ({ ...p }));
    for (let i = 1; i < parti.length; i++) {
      const m = /^[,.;:!?)»]+/.exec(parti[i].testo);
      if (m) {
        parti[i - 1].testo += m[0];
        parti[i].testo = parti[i].testo.slice(m[0].length);
      }
    }
    const conGrassetto = parti.some((p) => p.forte);
    const h = this.altezza(testo.replaceAll("**", ""), conGrassetto ? "semi" : "testo", dimensione, larghezza, interlinea);
    const riga = dimensione * 1.21 + interlinea;
    // Tre righe in fondo alla pagina sì, una riga orfana no.
    if (h > this.spazio() && this.spazio() < riga * 3) this.pagina();
    this.doc.x = x;
    const piene = parti.filter((p) => p.testo.length > 0);
    piene.forEach((p, i) => {
      this.font(p.forte ? "semi" : "testo", dimensione, opz.colore ?? this.c.inchiostro);
      const continua = i < piene.length - 1;
      // Dal secondo segmento in poi si passa SOLO `continued`: ripassare la
      // larghezza fa ripartire l'impaginatore del testo, e ogni grassetto
      // finirebbe su una riga sua.
      if (i === 0) {
        this.doc.text(p.testo, x, this.doc.y, { width: larghezza, lineGap: interlinea, continued: continua });
      } else {
        this.doc.text(p.testo, { continued: continua });
      }
    });
    this.doc.x = MARGINE.sinistra;
    this.doc.y += opz.dopo ?? 6;
  }

  /* ── la sigla ─────────────────────────────────────────────────── */

  private larghezzaSigla(id: string) {
    return this.larghezzaTesto(id, "semi", SIGLA.dimensione, 0.2) + SIGLA.pad * 2;
  }

  /** Disegna la pastiglia accanto a un testo che parte da `yCima`. */
  private sigla(id: string, x: number, yCima: number, dimensioneTesto: number, collegata = true) {
    const w = this.larghezzaSigla(id);
    const h = SIGLA.altezza;
    // La pastiglia sta centrata sull'altezza della x del testo che accompagna.
    const y = yCima + dimensioneTesto * 0.62 - h / 2 + 0.6;
    this.doc.save();
    this.doc.roundedRect(x, y, w, h, 1.8).fill(this.c.tinta);
    this.doc.restore();
    this.font("semi", SIGLA.dimensione, this.c.secondario);
    this.doc.text(id, x + SIGLA.pad, y + 1.3, { lineBreak: false, characterSpacing: 0.2 });
    // L'anteprima non ha il registro delle fonti: un collegamento lì
    // porterebbe a una destinazione che nel file non esiste.
    if (collegata && !this.anteprima) this.doc.goTo(x, y, w, h, `fonte-${id}`);
    return w;
  }

  /* ── copertina ────────────────────────────────────────────────── */

  copertina() {
    const { doc, c, e } = { doc: this.doc, c: this.c, e: this.e };
    const f = e.frontespizio;
    this.pagina();
    this.paginaCopertina = this.indicePagina();

    // Filetto d'accento in testa: la veste si riconosce dal primo sguardo.
    doc.rect(MARGINE.sinistra, 44, LARGHEZZA_UTILE, 3.2).fill(c.campitura);

    // Il logo, o il nome: mai un riquadro vuoto.
    const cimaLogo = 78;
    if (this.veste.logo) {
      const posa = posaLogo(
        this.veste.logo.pxLarghezza,
        this.veste.logo.pxAltezza,
        this.veste.logo.vettoriale,
        SCATOLE_LOGO.copertina,
        LARGHEZZA_MINIMA_COPERTINA,
      );
      doc.image(this.logoAperto!, MARGINE.sinistra, cimaLogo, {
        width: posa.larghezza,
        height: posa.altezza,
      });
    } else {
      this.font("semi", 13, c.inchiostro);
      doc.text(this.veste.nomeIntestazione, MARGINE.sinistra, cimaLogo, { width: 300, lineGap: 1 });
    }

    // Il codice del documento in alto a destra, e l'esempio se lo è.
    this.font("medio", 7.2, c.secondario);
    doc.text(f.codice, MARGINE.sinistra, cimaLogo, { width: LARGHEZZA_UTILE, align: "right", characterSpacing: 0.3 });
    if (e.esempio) {
      const testo = "DOCUMENTO DI ESEMPIO";
      const w = this.larghezzaTesto(testo, "semi", 7, 0.8) + 12;
      const x = MARGINE.sinistra + LARGHEZZA_UTILE - w;
      doc.roundedRect(x, cimaLogo + 14, w, 14, 3).lineWidth(0.8).stroke(c.secondario);
      this.font("semi", 7, c.secondario);
      doc.text(testo, x + 6, cimaLogo + 18.2, { lineBreak: false, characterSpacing: 0.8 });
    }

    // Il titolo, a un terzo della pagina.
    let y = 292;
    this.font("semi", 8.2, c.accentoTesto);
    doc.text(MAIUSCOLO(f.occhiello), MARGINE.sinistra, y, { width: LARGHEZZA_UTILE * 0.82, characterSpacing: 1.1, lineGap: 2 });
    y = doc.y + 10;
    this.font("titolo", 34, c.inchiostro);
    doc.text(f.titolo, MARGINE.sinistra, y, { width: LARGHEZZA_UTILE, lineGap: -2 });
    y = doc.y + 14;
    doc.rect(MARGINE.sinistra, y, 54, 3).fill(c.campitura);
    y += 20;
    this.font("medio", 15, c.inchiostro);
    doc.text(f.organizzazione, MARGINE.sinistra, y, { width: LARGHEZZA_UTILE });
    y = doc.y + 4;
    this.font("testo", 9.5, c.secondario);
    doc.text(`Esercizio di rendicontazione ${f.esercizio} · ${f.periodo}`, MARGINE.sinistra, y, { width: LARGHEZZA_UTILE });

    // La griglia dei dati del documento.
    const validazione =
      e.validazione.stato === "validata"
        ? `Validato il ${DATA_LUNGA(e.validazione.il ?? e.revisione.data)}`
        : "In attesa di validazione professionale";
    const voci: [string, string][] = [
      ...f.identificativi.map((i): [string, string] => [i.etichetta, i.valore]),
      ...(f.costruitoSu ? [["Costruito su", f.costruitoSu] as [string, string]] : []),
      ["Revisione", `${e.revisione.numero} del ${DATA_LUNGA(e.revisione.data)}`],
      ["Validazione", validazione],
    ];
    const colonna = (LARGHEZZA_UTILE - 24) / 2;
    let cima = Math.max(doc.y + 64, 520);
    for (let i = 0; i < voci.length; i += 2) {
      let altezzaRiga = 0;
      for (let j = 0; j < 2 && i + j < voci.length; j++) {
        const [et, val] = voci[i + j];
        const x = MARGINE.sinistra + j * (colonna + 24);
        doc.moveTo(x, cima).lineTo(x + colonna, cima).lineWidth(0.5).stroke(c.filetto);
        this.font("semi", 6.4, c.secondario);
        doc.text(MAIUSCOLO(et), x, cima + 6, { width: colonna, characterSpacing: 0.7 });
        this.font("testo", 9, c.inchiostro);
        doc.text(val, x, cima + 16, { width: colonna, lineGap: 1.5 });
        altezzaRiga = Math.max(altezzaRiga, doc.y - cima);
      }
      cima += altezzaRiga + 10;
    }

    // In fondo: chi l'ha composto, detto una volta e senza marchio in copertina.
    // Si scrive sotto il margine: il margine vale per il testo che scorre,
    // e senza toglierlo PDFKit aprirebbe una pagina nuova per una riga.
    const margineBasso = doc.page.margins.bottom;
    doc.page.margins.bottom = 0;
    const fondo = A4.altezza - 76;
    doc.moveTo(MARGINE.sinistra, fondo).lineTo(MARGINE.sinistra + LARGHEZZA_UTILE, fondo).lineWidth(0.5).stroke(c.filetto);
    this.font("testo", 7, c.secondario);
    doc.text(
      [f.organizzazione, ...this.veste.contatti].join(" · "),
      MARGINE.sinistra,
      fondo + 8,
      { width: LARGHEZZA_UTILE * 0.62, lineGap: 1.5, height: 30 },
    );
    doc.text("Composto con la piattaforma Verzero", MARGINE.sinistra, fondo + 8, {
      width: LARGHEZZA_UTILE,
      align: "right",
      lineBreak: false,
    });
    doc.page.margins.bottom = margineBasso;
  }

  /* ── indice e legenda ─────────────────────────────────────────── */

  paginaIndiceVuota() {
    this.pagina();
    this.paginaIndice = this.indicePagina();
  }

  private scriviIndice() {
    const { doc, c } = this;
    doc.switchToPage(this.paginaIndice);
    doc.y = MARGINE.alto;
    this.titoloPagina("Indice");
    let y = doc.y + 6;
    for (const v of this.indice) {
      const h = 17;
      const testoX = MARGINE.sinistra + 26;
      if (v.numero !== undefined) {
        this.font("semi", 9.4, c.accentoTesto);
        doc.text(String(v.numero), MARGINE.sinistra, y, { lineBreak: false, features: ["tnum"] });
      }
      this.font(v.numero !== undefined ? "medio" : "testo", 9.4, c.inchiostro);
      const larghezzaTitolo = this.larghezzaTesto(v.titolo, v.numero !== undefined ? "medio" : "testo", 9.4);
      doc.text(v.titolo, testoX, y, { lineBreak: false });
      const numero = String(v.pagina);
      this.font("medio", 9.4, c.inchiostro);
      const wNum = this.larghezzaTesto(numero, "medio", 9.4);
      const xNum = MARGINE.sinistra + LARGHEZZA_UTILE - wNum;
      doc.text(numero, xNum, y, { lineBreak: false, features: ["tnum"] });
      // Il puntinato guida l'occhio dal titolo al numero.
      const da = testoX + larghezzaTitolo + 6;
      const a = xNum - 6;
      if (a > da) {
        doc.save();
        doc.moveTo(da, y + 8.4).lineTo(a, y + 8.4).lineWidth(0.6).dash(0.6, { space: 2.6 }).stroke(c.filetto);
        doc.undash();
        doc.restore();
      }
      doc.goTo(MARGINE.sinistra, y - 2, LARGHEZZA_UTILE, h, `parte-${v.chiave}`);
      y += h + (v.chiave === "sezione-ultima" ? 8 : 0);
    }

    // Come leggere: la legenda delle sigle, prima di incontrarne una.
    doc.y = Math.max(y + 22, doc.y + 22);
    this.sottotitolo("Come leggere questo documento");
    this.paragrafo(this.e.testi.composizione, { dimensione: 8.6, interlinea: 3 });
    for (const l of this.e.legenda) {
      const cima = doc.y;
      const w = this.sigla(l.sigla, MARGINE.sinistra, cima, 8.6, false);
      this.font("testo", 8.6, c.inchiostro);
      doc.text(l.testo, MARGINE.sinistra + Math.max(w, 16) + 8, cima, { width: LARGHEZZA_UTILE - 24, lineGap: 2.4 });
      doc.y += 4;
    }
  }

  /* ── titoli ───────────────────────────────────────────────────── */

  private titoloPagina(testo: string, occhiello?: string) {
    const { doc, c } = this;
    if (occhiello) {
      this.font("semi", 7, c.accentoTesto);
      doc.text(MAIUSCOLO(occhiello), MARGINE.sinistra, doc.y, { characterSpacing: 1.2 });
      doc.y += 4;
    }
    this.font("titolo", 19, c.inchiostro);
    doc.text(testo, MARGINE.sinistra, doc.y, { width: LARGHEZZA_UTILE, lineGap: 1 });
    doc.y += 12;
  }

  private sottotitolo(testo: string) {
    this.assicura(64);
    this.doc.y += 6;
    this.font("semi", 10.4, this.c.inchiostro);
    this.doc.text(testo, MARGINE.sinistra, this.doc.y, { width: LARGHEZZA_UTILE });
    this.doc.y += 5;
  }

  apriParte(chiave: string, titolo: string, numero?: number, riferimento?: string) {
    this.pagina();
    this.doc.addNamedDestination(`parte-${chiave}`);
    this.doc.outline.addItem(numero !== undefined ? `${numero}. ${titolo}` : titolo);
    this.indice.push({ chiave, numero, titolo, pagina: this.indicePagina() + 1 });
    this.titoloPagina(titolo, numero !== undefined ? `Sezione ${numero}` : "Appendice");
    if (riferimento) {
      this.font("testo", 7.6, this.c.secondario);
      this.doc.text(`Riferimento: ${riferimento}`, MARGINE.sinistra, this.doc.y - 6, { width: LARGHEZZA_UTILE });
      this.doc.y += 8;
    }
  }

  /* ── i blocchi ────────────────────────────────────────────────── */

  blocco(b: Blocco) {
    switch (b.tipo) {
      case "paragrafo":
        return this.paragrafo(b.testo);
      case "sottotitolo":
        return this.sottotitolo(b.testo);
      case "elenco":
        return this.elenco(b.voci);
      case "coppie":
        return this.coppie(b.righe);
      case "tabella":
        return this.tabella(b);
      case "cifre":
        return this.cifre(b.voci);
      case "barre":
        return this.barre(b);
      case "riquadro":
        return this.riquadro(b.testo, b.titolo, b.tono);
    }
  }

  private elenco(voci: string[]) {
    const { doc, c } = this;
    for (const v of voci) {
      const h = this.altezza(v.replaceAll("**", ""), "testo", CORPO.dimensione, LARGHEZZA_UTILE - 14, CORPO.interlinea);
      this.assicura(Math.min(h, 40));
      const cima = doc.y;
      doc.circle(MARGINE.sinistra + 3, cima + CORPO.dimensione * 0.62, 1.4).fill(c.accentoSegno);
      this.paragrafo(v, { x: MARGINE.sinistra + 14, larghezza: LARGHEZZA_UTILE - 14, dopo: 3 });
    }
    doc.y += 3;
  }

  /** Il testo di una cella con la sua sigla, dentro una larghezza. */
  private altezzaCella(cella: Cella, larghezza: number, k: Carattere, dimensione: number, interlinea: number) {
    const testo = eValore(cella) ? cella.testo : cella;
    const riservato = eValore(cella) && cella.fonte ? this.larghezzaSigla(cella.fonte) + 3 : 0;
    return this.altezza(testo, k, dimensione, Math.max(20, larghezza - riservato), interlinea, { tabellari: true });
  }

  private scriviCella(
    cella: Cella,
    x: number,
    y: number,
    larghezza: number,
    opz: { k: Carattere; dimensione: number; interlinea: number; allinea: "sinistra" | "destra"; colore?: string },
  ) {
    const { doc } = this;
    const valore = eValore(cella) ? cella : null;
    const testo = valore ? valore.testo : (cella as string);
    const k: Carattere = valore?.forte ? "semi" : opz.k;
    const wSigla = valore?.fonte ? this.larghezzaSigla(valore.fonte) : 0;
    const riservato = wSigla ? wSigla + 3 : 0;
    const utile = Math.max(20, larghezza - riservato);
    this.font(k, opz.dimensione, opz.colore ?? this.c.inchiostro);
    if (opz.allinea === "destra") {
      doc.text(testo, x, y, { width: utile, align: "right", lineGap: opz.interlinea, features: ["tnum"] });
      if (valore?.fonte) this.sigla(valore.fonte, x + utile + 3, y, opz.dimensione);
    } else {
      doc.text(testo, x, y, { width: utile, lineGap: opz.interlinea, features: ["tnum"] });
      if (valore?.fonte) {
        // La sigla segue l'ultima riga del testo, non la prima.
        const righe = testo.length === 0 ? 1 : Math.max(1, Math.round((doc.y - y) / (opz.dimensione * 1.21 + opz.interlinea)));
        const ultima = righe > 1 ? testo.split(/\s+/).slice(-3).join(" ") : testo;
        const wUltima = Math.min(utile, this.larghezzaTesto(righe > 1 ? ultima : testo, k, opz.dimensione, 0, true));
        const yUltima = y + (righe - 1) * (opz.dimensione * 1.21 + opz.interlinea);
        this.sigla(valore.fonte, x + (righe > 1 ? Math.min(utile, wUltima) : wUltima) + 3, yUltima, opz.dimensione);
      }
    }
  }

  private coppie(righe: { etichetta: string; valore: Cella }[]) {
    const { doc, c } = this;
    const wEt = LARGHEZZA_UTILE * 0.32;
    const wVal = LARGHEZZA_UTILE - wEt - 12;
    doc.moveTo(MARGINE.sinistra, doc.y).lineTo(MARGINE.sinistra + LARGHEZZA_UTILE, doc.y).lineWidth(0.5).stroke(c.filetto);
    for (const r of righe) {
      const hEt = this.altezza(r.etichetta, "testo", 8.4, wEt, 2.2);
      const hVal = this.altezzaCella(r.valore, wVal, "testo", 9, 2.2);
      const h = Math.max(hEt, hVal) + 11;
      if (h > LIMITE_BASSO - MARGINE.alto - 24) {
        this.rigaLunga(r.etichetta, r.valore);
        continue;
      }
      this.assicura(h);
      const cima = doc.y;
      this.font("testo", 8.4, c.secondario);
      doc.text(r.etichetta, MARGINE.sinistra, cima + 5.8, { width: wEt, lineGap: 2.2 });
      this.scriviCella(r.valore, MARGINE.sinistra + wEt + 12, cima + 5.2, wVal, {
        k: "testo",
        dimensione: 9,
        interlinea: 2.2,
        allinea: "sinistra",
      });
      doc.y = cima + h;
      doc.moveTo(MARGINE.sinistra, doc.y).lineTo(MARGINE.sinistra + LARGHEZZA_UTILE, doc.y).lineWidth(0.5).stroke(c.filetto);
    }
    doc.y += 12;
  }

  /**
   * Una riga più alta di una pagina — settanta unità locali in una cella —
   * non si impagina come riga: PDFKit spezzerebbe il testo a metà cella, e
   * sigla e filetto finirebbero sulla pagina sbagliata o fuori dal foglio.
   * Si scrive per esteso, etichetta sopra e valore che scorre da una pagina
   * all'altra; la sigla segue l'ultima riga, dovunque cada.
   */
  private rigaLunga(etichetta: string, cella: Cella) {
    const { doc, c } = this;
    const valore = eValore(cella) ? cella : null;
    const testo = valore ? valore.testo : (cella as string);
    const riservato = valore?.fonte ? this.larghezzaSigla(valore.fonte) + 3 : 0;
    this.assicura(60);
    this.font("testo", 8.4, c.secondario);
    doc.text(etichetta, MARGINE.sinistra, doc.y + 5.8, { width: LARGHEZZA_UTILE, lineGap: 2.2 });
    this.font(valore?.forte ? "semi" : "testo", 9, c.inchiostro);
    doc.text(testo, MARGINE.sinistra, doc.y + 3, { width: LARGHEZZA_UTILE - riservato, lineGap: 2.2, features: ["tnum"] });
    if (valore?.fonte) {
      this.sigla(valore.fonte, MARGINE.sinistra + LARGHEZZA_UTILE - riservato + 3, doc.y - (9 * 1.21 + 2.2), 9);
    }
    doc.y += 6;
    doc.moveTo(MARGINE.sinistra, doc.y).lineTo(MARGINE.sinistra + LARGHEZZA_UTILE, doc.y).lineWidth(0.5).stroke(c.filetto);
  }

  private tabella(b: Extract<Blocco, { tipo: "tabella" }>) {
    const { doc, c } = this;
    const pesi = b.colonne.map((col, i) => col.peso ?? (i === 0 ? 1.5 : 1));
    const somma = pesi.reduce((t, p) => t + p, 0);
    const larghezze = pesi.map((p) => (LARGHEZZA_UTILE * p) / somma);
    const xs = larghezze.map((_, i) => MARGINE.sinistra + larghezze.slice(0, i).reduce((t, w) => t + w, 0));
    const pad = TABELLA.pad;

    const altezzaTestata = () =>
      Math.max(
        ...b.colonne.map((col, i) =>
          this.altezza(MAIUSCOLO(col.titolo), "semi", TABELLA.testata, larghezze[i] - pad * 2, 1.2, { characterSpacing: 0.35 }),
        ),
      ) + TABELLA.padV * 2 + 1;

    const testata = (segue: boolean) => {
      const h = altezzaTestata();
      const cima = doc.y;
      doc.rect(MARGINE.sinistra, cima, LARGHEZZA_UTILE, h).fill(c.tintaAccento);
      b.colonne.forEach((col, i) => {
        this.font("semi", TABELLA.testata, c.secondario);
        doc.text(MAIUSCOLO(col.titolo), xs[i] + pad, cima + TABELLA.padV + 0.6, {
          width: larghezze[i] - pad * 2,
          align: col.allinea === "destra" ? "right" : "left",
          characterSpacing: 0.35,
          lineGap: 1.2,
        });
      });
      doc.moveTo(MARGINE.sinistra, cima + h).lineTo(MARGINE.sinistra + LARGHEZZA_UTILE, cima + h).lineWidth(0.9).stroke(c.accentoSegno);
      doc.y = cima + h;
      if (segue && b.didascalia) {
        // niente: la didascalia ripetuta in testa alla pagina la dice la riga sopra
      }
    };

    const altezzaRiga = (celle: Cella[], k: Carattere) =>
      Math.max(
        ...celle.map((cella, i) =>
          this.altezzaCella(cella, larghezze[i] - pad * 2, k, TABELLA.dimensione, 1.6),
        ),
      ) + TABELLA.padV * 2;

    // Didascalia, testata e prima riga stanno insieme: una testata sola in
    // fondo alla pagina è una tabella senza righe.
    const hDidascalia = b.didascalia ? this.altezza(b.didascalia, "semi", 8.6, LARGHEZZA_UTILE, 2) + 5 : 0;
    const primaRiga = b.righe[0] ? Math.min(altezzaRiga(b.righe[0], "testo"), 60) : 0;
    this.assicura(hDidascalia + altezzaTestata() + primaRiga + 4);
    if (b.didascalia) {
      this.font("semi", 8.6, c.inchiostro);
      doc.text(b.didascalia, MARGINE.sinistra, doc.y, { width: LARGHEZZA_UTILE, lineGap: 2 });
      doc.y += 5;
    }
    testata(false);

    const riga = (celle: Cella[], totale: boolean, seguono: boolean) => {
      const k: Carattere = totale ? "semi" : "testo";
      const h = altezzaRiga(celle, k) + (totale ? 1 : 0);
      if (h > LIMITE_BASSO - MARGINE.alto - altezzaTestata() - 30) {
        // Più alta di una pagina: fuori dalla griglia, colonna per colonna,
        // e la tabella riprende sotto con la sua testata.
        celle.forEach((cella, i) => this.rigaLunga(b.colonne[i]?.titolo ?? "", cella));
        doc.y += 6;
        if (seguono) {
          this.assicura(altezzaTestata() + 40);
          testata(true);
        }
        return;
      }
      if (doc.y + h > LIMITE_BASSO) {
        this.pagina();
        if (b.didascalia) {
          this.font("testo", 7.4, c.secondario);
          doc.text(`${b.didascalia} (segue)`, MARGINE.sinistra, doc.y, { width: LARGHEZZA_UTILE });
          doc.y += 4;
        }
        testata(true);
      }
      const cima = doc.y;
      if (totale) {
        doc.moveTo(MARGINE.sinistra, cima).lineTo(MARGINE.sinistra + LARGHEZZA_UTILE, cima).lineWidth(0.9).stroke(c.inchiostro);
      }
      celle.forEach((cella, i) => {
        this.scriviCella(cella, xs[i] + pad, cima + TABELLA.padV + (totale ? 1 : 0), larghezze[i] - pad * 2, {
          k,
          dimensione: TABELLA.dimensione,
          interlinea: 1.6,
          allinea: b.colonne[i]?.allinea === "destra" ? "destra" : "sinistra",
        });
      });
      doc.y = cima + h;
      if (!totale) {
        doc.moveTo(MARGINE.sinistra, doc.y).lineTo(MARGINE.sinistra + LARGHEZZA_UTILE, doc.y).lineWidth(0.4).stroke(c.filetto);
      }
    };

    b.righe.forEach((r, i) => riga(r, false, i < b.righe.length - 1 || b.totale !== undefined));
    if (b.totale) riga(b.totale, true, false);

    doc.y += 6;
    for (const n of b.note ?? []) {
      this.paragrafo(n, { dimensione: NOTA.dimensione, interlinea: NOTA.interlinea, colore: c.secondario, dopo: 2 });
    }
    doc.y += 8;
  }

  /**
   * La misura di una cifra grande. PDFKit ignora `lineBreak: false` quando
   * riceve una larghezza, e «1.020,13 t CO₂e» andava a capo sopra la sua
   * etichetta: il corpo si riduce finché valore e sigla stanno su una riga,
   * e solo sotto gli 8 punti il valore va a capo — con lo spazio che serve.
   */
  private misuraCifra(v: Valore, larghezza: number) {
    const spazioSigla = v.fonte ? this.larghezzaSigla(v.fonte) + 4 : 0;
    for (let d = 17; d >= 8; d -= 0.5) {
      if (this.larghezzaTesto(v.testo, "titolo", d, 0, true) + spazioSigla <= larghezza) {
        return { dimensione: d, altezza: 23, aCapo: false, spazioSigla };
      }
    }
    const h = this.altezza(v.testo, "titolo", 8, larghezza - spazioSigla, 1, { tabellari: true });
    return { dimensione: 8, altezza: Math.max(23, h + 6), aCapo: true, spazioSigla };
  }

  private cifre(voci: Extract<Blocco, { tipo: "cifre" }>["voci"]) {
    const { doc, c } = this;
    const perRiga = Math.min(3, voci.length);
    const gap = 14;
    const w = (LARGHEZZA_UTILE - gap * (perRiga - 1)) / perRiga;
    for (let i = 0; i < voci.length; i += perRiga) {
      const gruppo = voci.slice(i, i + perRiga);
      const misure = gruppo.map((v) => this.misuraCifra(v.valore, w - 4));
      // Le etichette di un gruppo partono alla stessa altezza anche quando
      // una cifra ha dovuto andare a capo.
      const hValore = Math.max(...misure.map((m) => m.altezza));
      const altezze = gruppo.map(
        (v) => 9 + hValore + this.altezza(v.etichetta, "testo", 7.6, w - 4, 1.6) + (v.nota ? this.altezza(v.nota, "testo", 6.8, w - 4, 1.4) + 3 : 0),
      );
      const h = Math.max(...altezze) + 14;
      this.assicura(h);
      const cima = doc.y;
      gruppo.forEach((v, j) => {
        const m = misure[j];
        const x = MARGINE.sinistra + j * (w + gap);
        doc.rect(x, cima, w, 2).fill(c.campitura);
        this.font("titolo", m.dimensione, c.inchiostro);
        if (m.aCapo) {
          doc.text(v.valore.testo, x, cima + 9, { width: w - 4 - m.spazioSigla, lineGap: 1, features: ["tnum"] });
          if (v.valore.fonte) this.sigla(v.valore.fonte, x + w - m.spazioSigla, cima + 9, 8);
        } else {
          // Corpo ridotto, stessa linea di base: le cifre di un gruppo si
          // leggono in fila. Il testo si posa SENZA larghezza, così non va a capo.
          const yTesto = cima + 9 + (17 - m.dimensione) * 0.97;
          doc.text(v.valore.testo, x, yTesto, { lineBreak: false, features: ["tnum"] });
          const wTesto = this.larghezzaTesto(v.valore.testo, "titolo", m.dimensione, 0, true);
          if (v.valore.fonte) this.sigla(v.valore.fonte, x + wTesto + 4, yTesto + 0.59 * m.dimensione - 8.04, 12);
        }
        this.font("testo", 7.6, c.secondario);
        doc.text(v.etichetta, x, cima + 9 + hValore, { width: w - 4, lineGap: 1.6 });
        if (v.nota) {
          this.font("testo", 6.8, c.secondario);
          doc.text(v.nota, x, doc.y + 2, { width: w - 4, lineGap: 1.4 });
        }
      });
      doc.y = cima + h;
    }
    doc.y += 6;
  }

  private barre(b: Extract<Blocco, { tipo: "barre" }>) {
    const { doc, c } = this;
    const wEt = 128;
    const wEtichettaValore = 92;
    const area = LARGHEZZA_UTILE - wEt - wEtichettaValore;
    const massimo = Math.max(...b.serie.map((s) => s.valori.reduce((t, v) => t + v, 0)), 0.000001);
    const hBarra = 15;
    const colori = [c.campitura, c.campituraTenue, c.filetto, c.secondario];
    const h = 22 + b.serie.length * (hBarra + 10) + 24;
    this.assicura(h);
    this.font("semi", 8.6, c.inchiostro);
    doc.text(b.titolo, MARGINE.sinistra, doc.y, { width: LARGHEZZA_UTILE });
    doc.y += 8;
    for (const s of b.serie) {
      const cima = doc.y;
      this.font("testo", 8.2, c.inchiostro);
      doc.text(s.etichetta, MARGINE.sinistra, cima + 3, { width: wEt - 8, lineBreak: false });
      let x = MARGINE.sinistra + wEt;
      s.valori.forEach((v, i) => {
        const w = (v / massimo) * area;
        if (w > 0.2) doc.rect(x, cima, w, hBarra).fill(colori[i % colori.length]);
        x += w;
      });
      this.font("semi", 8.2, c.inchiostro);
      doc.text(s.totale.testo, x + 6, cima + 3, { lineBreak: false, features: ["tnum"] });
      if (s.totale.fonte) {
        const wt = this.larghezzaTesto(s.totale.testo, "semi", 8.2, 0, true);
        this.sigla(s.totale.fonte, x + 6 + wt + 3, cima + 3, 8.2);
      }
      doc.y = cima + hBarra + 10;
    }
    // Legenda.
    let x = MARGINE.sinistra + wEt;
    const cima = doc.y;
    b.parti.forEach((p, i) => {
      doc.rect(x, cima + 1.5, 8, 8).fill(colori[i % colori.length]);
      this.font("testo", 7.4, c.secondario);
      doc.text(p, x + 12, cima + 2, { lineBreak: false });
      x += 12 + this.larghezzaTesto(p, "testo", 7.4) + 18;
    });
    doc.y = cima + 24;
  }

  private riquadro(testo: string, titolo?: string, tono: "neutro" | "attenzione" = "neutro") {
    const { doc, c } = this;
    const w = LARGHEZZA_UTILE - 22;
    const hTitolo = titolo ? this.altezza(titolo, "semi", 8.8, w, 2) + 4 : 0;
    const hTesto = this.altezza(testo.replaceAll("**", ""), "testo", 8.6, w, 2.8);
    const h = hTitolo + hTesto + 20;
    this.assicura(Math.min(h, LIMITE_BASSO - MARGINE.alto));
    const cima = doc.y;
    doc.rect(MARGINE.sinistra, cima, LARGHEZZA_UTILE, h).fill(tono === "attenzione" ? "#FBF3E4" : c.tinta);
    doc.rect(MARGINE.sinistra, cima, 2.4, h).fill(tono === "attenzione" ? "#9A6A12" : c.accentoSegno);
    doc.y = cima + 10;
    if (titolo) {
      this.font("semi", 8.8, c.inchiostro);
      doc.text(titolo, MARGINE.sinistra + 14, doc.y, { width: w, lineGap: 2 });
      doc.y += 4;
    }
    this.paragrafo(testo, { x: MARGINE.sinistra + 14, larghezza: w, dimensione: 8.6, interlinea: 2.8, dopo: 0 });
    doc.y = cima + h + 12;
  }

  /* ── le parti ─────────────────────────────────────────────────── */

  /** Solo alcune sezioni: l'anteprima della veste ne mostra una. */
  sezioniSolo(sezioni: Elaborato["sezioni"]) {
    for (const s of sezioni) {
      this.apriParte(`sezione-${s.numero}`, s.titolo, s.numero, s.riferimento);
      for (const b of s.blocchi) this.blocco(b);
    }
  }

  sezioni() {
    const ultime = this.e.sezioni.length;
    this.e.sezioni.forEach((s, i) => {
      this.apriParte(i === ultime - 1 ? "sezione-ultima" : `sezione-${s.numero}`, s.titolo, s.numero, s.riferimento);
      for (const b of s.blocchi) this.blocco(b);
    });
  }

  riferimenti() {
    const { doc, c } = this;
    this.apriParte("riferimenti", "Riferimenti normativi");
    this.paragrafo(this.e.testi.riferimentiIntro, { dimensione: 8.6, interlinea: 3, colore: c.secondario, dopo: 12 });
    // Tre colonne come una tabella, ma la designazione porta sotto il suo
    // titolo ufficiale in corpo minore: è il modo in cui si citano le norme.
    const wDes = LARGHEZZA_UTILE * 0.46;
    const wRuolo = LARGHEZZA_UTILE * 0.32;
    const wStato = LARGHEZZA_UTILE - wDes - wRuolo;
    const xRuolo = MARGINE.sinistra + wDes;
    const xStato = xRuolo + wRuolo;
    doc.moveTo(MARGINE.sinistra, doc.y).lineTo(MARGINE.sinistra + LARGHEZZA_UTILE, doc.y).lineWidth(0.9).stroke(c.accentoSegno);
    for (const r of this.e.riferimenti) {
      const stato =
        r.stato === "in vigore"
          ? r.dal
            ? `In vigore ${/^(8|11)\b/.test(r.dal) ? "dall'" : "dal "}${r.dal}`
            : "In vigore"
          : r.stato;
      const hDes =
        this.altezza(r.designazione, "semi", 8.6, wDes - 12, 2) +
        (r.titolo ? this.altezza(r.titolo, "testo", 7.4, wDes - 12, 1.8) + 3 : 0);
      const h = Math.max(hDes, this.altezza(r.ruolo, "testo", 8.2, wRuolo - 10, 2), this.altezza(stato, "testo", 8.2, wStato, 2)) + 16;
      this.assicura(h);
      const cima = doc.y;
      this.font("semi", 8.6, c.inchiostro);
      doc.text(r.designazione, MARGINE.sinistra, cima + 8, { width: wDes - 12, lineGap: 2 });
      if (r.titolo) {
        this.font("testo", 7.4, c.secondario);
        doc.text(r.titolo, MARGINE.sinistra, doc.y + 3, { width: wDes - 12, lineGap: 1.8 });
      }
      this.font("testo", 8.2, c.inchiostro);
      doc.text(r.ruolo, xRuolo, cima + 8.4, { width: wRuolo - 10, lineGap: 2 });
      this.font("medio", 8.2, c.inchiostro);
      doc.text(stato, xStato, cima + 8.4, { width: wStato, lineGap: 2 });
      doc.y = cima + h;
      doc.moveTo(MARGINE.sinistra, doc.y).lineTo(MARGINE.sinistra + LARGHEZZA_UTILE, doc.y).lineWidth(0.4).stroke(c.filetto);
    }
    doc.y += 10;
  }

  fonti() {
    const { doc, c } = this;
    this.apriParte("fonti", "Registro delle fonti");
    this.paragrafo(this.e.testi.fontiIntro, { dimensione: 8.6, interlinea: 3, colore: c.secondario, dopo: 12 });
    const wSigla = 34;
    const w = LARGHEZZA_UTILE - wSigla;
    doc.moveTo(MARGINE.sinistra, doc.y).lineTo(MARGINE.sinistra + LARGHEZZA_UTILE, doc.y).lineWidth(0.9).stroke(c.accentoSegno);
    for (const f of this.e.fonti) {
      const righe = this.righeFonte(f);
      const h =
        this.altezza(f.titolo, "semi", 8.6, w, 2) +
        righe.reduce((t, r) => t + this.altezza(r, "testo", 7.6, w, 1.8) + 1.5, 0) +
        16;
      this.assicura(h);
      const cima = doc.y;
      doc.addNamedDestination(`fonte-${f.id}`, "XYZ", 0, Math.max(0, cima - 6), null);
      this.font("semi", 8.8, c.accentoTesto);
      doc.text(f.id, MARGINE.sinistra, cima + 7, { width: wSigla, lineBreak: false });
      this.font("semi", 8.6, c.inchiostro);
      doc.text(f.titolo, MARGINE.sinistra + wSigla, cima + 7, { width: w, lineGap: 2 });
      for (const r of righe) {
        this.font("testo", 7.6, c.secondario);
        doc.text(r, MARGINE.sinistra + wSigla, doc.y + 1.5, {
          width: w,
          lineGap: 1.8,
          ...(r === f.url ? { link: f.url } : {}),
        });
      }
      doc.y = Math.max(doc.y, cima + h - 2) + 2;
      doc.moveTo(MARGINE.sinistra, doc.y).lineTo(MARGINE.sinistra + LARGHEZZA_UTILE, doc.y).lineWidth(0.4).stroke(c.filetto);
    }
    doc.y += 10;
  }

  /**
   * Le righe di dettaglio di una voce. Per i documenti stanno su una riga
   * sola — file, pagine, conferma — perché sono tante e si leggono in
   * colonna; per banche dati e calcoli restano distinte, perché ciascuna
   * riga dice una cosa diversa che chi verifica va a cercare.
   */
  private righeFonte(f: Fonte): string[] {
    const conferma = f.confermataIl
      ? f.tipo === "inserito"
        ? `Inserito o aggiornato dall'organizzazione il ${f.confermataIl}`
        : `Confermato dall'organizzazione il ${f.confermataIl}`
      : null;
    if (f.tipo === "documento") {
      return [[...f.dettaglio, conferma].filter(Boolean).join(" · "), ...(f.url ? [f.url] : [])];
    }
    return [
      ...f.dettaglio,
      ...(f.tipo === "calcolato" && f.ingressi?.length ? [`Parte da: ${f.ingressi.join(", ")}`] : []),
      ...(conferma ? [conferma] : []),
      ...(f.url ? [f.url] : []),
    ];
  }

  validazione() {
    const e = this.e;
    this.apriParte("validazione", "Validazione professionale");
    if (e.validazione.stato !== "validata") {
      this.riquadro(e.testi.validazioneInAttesa, "Validazione non ancora registrata", "attenzione");
      this.paragrafo(e.testi.validazioneSpiega, { dimensione: 8.8, interlinea: 3.2, colore: this.c.secondario });
      return;
    }
    this.coppie([
      { etichetta: "Professionista", valore: e.validazione.professionista ?? "" },
      { etichetta: "Qualifica", valore: e.validazione.qualifica ?? "" },
      { etichetta: "Data della validazione", valore: e.validazione.il ? DATA_LUNGA(e.validazione.il) : "" },
      { etichetta: "Revisione validata", valore: `${e.revisione.numero} · ${e.frontespizio.codice}` },
    ]);
    this.sottotitolo("Rilievi");
    const rilievi = e.validazione.rilievi ?? [];
    if (rilievi.length === 0) this.paragrafo("Nessun rilievo.");
    else this.elenco(rilievi);
    this.paragrafo(e.testi.validazioneSpiega, { dimensione: 8.4, interlinea: 3, colore: this.c.secondario });
  }

  revisioni() {
    const { doc, c } = this;
    this.apriParte("revisioni", "Registro delle revisioni");
    this.tabella({
      tipo: "tabella",
      colonne: [
        { titolo: "Rev.", peso: 0.35 },
        { titolo: "Data", peso: 0.8 },
        { titolo: "Motivo", peso: 1.6 },
        { titolo: "Versione dello standard", peso: 1.2 },
        { titolo: "Validazione", peso: 0.8 },
      ],
      righe: this.e.revisioni.map((r) => [
        String(r.numero),
        DATA_LUNGA(r.data),
        r.motivo,
        r.versioneStandard ?? "—",
        r.validazione === "validata" ? "Validata" : "In attesa",
      ]),
    });

    // Il colophon: il nostro marchio, nella sua area e nei suoi colori.
    const altezzaColophon = 70;
    const fondo = LIMITE_BASSO - altezzaColophon;
    if (doc.y > fondo - 10) this.pagina();
    const y = LIMITE_BASSO - altezzaColophon;
    doc.moveTo(MARGINE.sinistra, y).lineTo(MARGINE.sinistra + LARGHEZZA_UTILE, y).lineWidth(0.5).stroke(c.filetto);
    this.logotipo(MARGINE.sinistra, y + 18, 15);
    this.font("testo", 7.4, c.secondario);
    doc.text(this.e.testi.composizione, MARGINE.sinistra + 110, y + 14, { width: LARGHEZZA_UTILE - 110, lineGap: 2 });
  }

  /** Il logotipo Verzero, tracciato: stesso disegno del sito, mai ricolorato col cliente. */
  private logotipo(x: number, yCima: number, altezzaMaiuscole: number) {
    const { doc } = this;
    const g = geometriaLogotipo();
    const scala = altezzaMaiuscole / g.altezza;
    const pino = "#21544F";
    doc.save();
    doc.translate(x, yCima);
    doc.scale(scala);
    doc.save();
    doc.translate(0, g.base);
    doc.path(g.tracciato).fill(pino);
    doc.restore();
    doc.ellipse(g.zero.cx, g.zero.cy, g.zero.rx, g.zero.ry).lineWidth(g.zero.tratto).stroke(pino);
    doc.restore();
  }

  /* ── intestazioni e piè di pagina, a documento finito ─────────── */

  cornici() {
    const { doc, c, e } = this;
    const { start, count } = doc.bufferedPageRange();
    const validazione =
      e.validazione.stato === "validata" ? "Validato" : "In attesa di validazione";
    for (let i = start; i < start + count; i++) {
      doc.switchToPage(i);
      const margineBasso = doc.page.margins.bottom;
      doc.page.margins.bottom = 0;
      if (i !== this.paginaCopertina) {
        // Intestazione.
        if (this.veste.logo) {
          const posa = posaLogo(this.veste.logo.pxLarghezza, this.veste.logo.pxAltezza, this.veste.logo.vettoriale, SCATOLE_LOGO.intestazione);
          doc.image(this.logoAperto!, MARGINE.sinistra, 46 - posa.altezza + 6, {
            width: posa.larghezza,
            height: posa.altezza,
          });
        } else {
          const nome = this.suUnaRiga(this.veste.nomeIntestazione, "semi", 7.4, LARGHEZZA_UTILE * 0.5);
          this.font("semi", nome.dimensione, c.inchiostro);
          doc.text(nome.testo, MARGINE.sinistra, 38, { lineBreak: false });
        }
        const titolo = this.suUnaRiga(`${e.frontespizio.titolo} · ${e.frontespizio.codice}`, "testo", 7, LARGHEZZA_UTILE * 0.46);
        this.font("testo", titolo.dimensione, c.secondario);
        doc.text(titolo.testo, MARGINE.sinistra + LARGHEZZA_UTILE - titolo.larghezza, 39, { lineBreak: false });
        doc.moveTo(MARGINE.sinistra, 56).lineTo(MARGINE.sinistra + LARGHEZZA_UTILE, 56).lineWidth(0.5).stroke(c.filetto);

        // Piè di pagina.
        const y = A4.altezza - 46;
        doc.moveTo(MARGINE.sinistra, y - 8).lineTo(MARGINE.sinistra + LARGHEZZA_UTILE, y - 8).lineWidth(0.5).stroke(c.filetto);
        const sinistra = this.suUnaRiga(
          [
            e.frontespizio.organizzazione,
            ...e.frontespizio.identificativi.filter((x) => x.etichetta === "Partita IVA").map((x) => `P.IVA ${x.valore}`),
          ].join(" · "),
          "testo",
          6.8,
          LARGHEZZA_UTILE * 0.52,
        );
        this.font("testo", sinistra.dimensione, c.secondario);
        doc.text(sinistra.testo, MARGINE.sinistra, y, { lineBreak: false });
        const destra = this.suUnaRiga(
          `Rev. ${e.revisione.numero} · ${validazione} · Pagina ${i - start + 1} di ${count}`,
          "medio",
          6.8,
          LARGHEZZA_UTILE * 0.46,
          true,
        );
        this.font("medio", destra.dimensione, c.secondario);
        doc.text(destra.testo, MARGINE.sinistra + LARGHEZZA_UTILE - destra.larghezza, y, { lineBreak: false, features: ["tnum"] });
        if (e.esempio || this.anteprima) {
          this.font("semi", 6.4, c.secondario);
          doc.text(
            this.anteprima
              ? "ANTEPRIMA DELLA VESTE — NON È IL DOCUMENTO CONSEGNATO"
              : "DOCUMENTO DI ESEMPIO — IMPRESA E DATI INVENTATI",
            MARGINE.sinistra,
            y + 10,
            { width: LARGHEZZA_UTILE, lineBreak: false, characterSpacing: 0.6 },
          );
        }
      } else if (this.anteprima) {
        this.font("semi", 6.4, c.secondario);
        doc.text("ANTEPRIMA DELLA VESTE — NON È IL DOCUMENTO CONSEGNATO", MARGINE.sinistra, A4.altezza - 36, {
          width: LARGHEZZA_UTILE,
          lineBreak: false,
          characterSpacing: 0.6,
        });
      }
      doc.page.margins.bottom = margineBasso;
    }
  }

  completaIndice() {
    if (this.paginaIndice >= 0) this.scriviIndice();
  }

  async fine(): Promise<Uint8Array> {
    const pezzi: Buffer[] = [];
    const finito = new Promise<Uint8Array>((ok, ko) => {
      this.doc.on("data", (p: Buffer) => pezzi.push(p));
      this.doc.on("end", () => ok(new Uint8Array(Buffer.concat(pezzi))));
      this.doc.on("error", ko);
    });
    this.doc.end();
    return finito;
  }

  get pagine() {
    return this.doc.bufferedPageRange().count;
  }
}

/* ------------------------------------------------------------------ */
/* Le due uscite                                                        */
/* ------------------------------------------------------------------ */

export type PdfGenerato = { byte: Uint8Array; pagine: number };

/**
 * Il documento completo. Accetta SOLO un elaborato consegnabile: il tipo
 * esiste unicamente come uscita di `verificaConsegna` senza mancanze.
 */
export async function pdfElaborato(e: ElaboratoConsegnabile, veste: Veste): Promise<PdfGenerato> {
  const imp = new Impaginatore(e, veste, false);
  imp.copertina();
  imp.paginaIndiceVuota();
  imp.sezioni();
  imp.riferimenti();
  imp.fonti();
  imp.validazione();
  imp.revisioni();
  imp.completaIndice();
  imp.cornici();
  const pagine = imp.pagine;
  return { byte: await imp.fine(), pagine };
}

/**
 * L'anteprima della veste: la copertina e la prima sezione, col marchio
 * applicato. Non richiede che il documento sia consegnabile — serve
 * proprio a vedere la veste prima — e dichiara su ogni pagina che non è
 * il documento.
 */
export async function pdfAnteprima(e: Elaborato, veste: Veste): Promise<PdfGenerato> {
  const imp = new Impaginatore(e, veste, true);
  imp.copertina();
  const prima = e.sezioni.find((s) => s.blocchi.length > 0) ?? e.sezioni[0];
  if (prima) {
    imp.sezioniSolo([prima]);
  }
  imp.cornici();
  const pagine = imp.pagine;
  return { byte: await imp.fine(), pagine };
}
