import "server-only";

import {
  AlignmentType,
  Bookmark,
  BorderStyle,
  Document,
  ExternalHyperlink,
  Footer,
  Header,
  HeadingLevel,
  ImageRun,
  InternalHyperlink,
  Packer,
  PageNumber,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableOfContents,
  TableLayoutType,
  TableRow,
  TabStopType,
  TextRun,
  WidthType,
  type ParagraphChild,
} from "docx";

import type { ElaboratoConsegnabile } from "./consegna";
import {
  eValore,
  segmenti,
  type Blocco,
  type Cella,
  type Colonna,
  type Elaborato,
} from "./contenuto";
import { DATA_LUNGA } from "./fonti";
import { posaLogo, SCATOLE_LOGO, LARGHEZZA_MINIMA_COPERTINA, type Veste } from "./veste";

/**
 * IL DOCUMENTO IN DOCX — lo stesso contenuto, in un formato che si modifica.
 *
 * Esce solo per i modelli che lo dichiarano (`formati` in
 * `src/lib/elaborati.ts`): manuali e procedure, che vivono in azienda e
 * cambiano con l'organigramma. Legge lo stesso albero del PDF e non
 * aggiunge testo: se una frase è nel PDF è qui, e viceversa.
 *
 * ═══ CHE COSA CAMBIA RISPETTO AL PDF, E PERCHÉ ═══
 * - Il carattere è Arial: un DOCX si apre su computer dove Inter non c'è,
 *   e un carattere sostituito a caso sposta ogni riga del documento.
 * - L'indice è un campo di Word, aggiornato all'apertura: i numeri di
 *   pagina li conosce solo il programma che impagina.
 * - I grafici a barre diventano una tabella: un'immagine in un documento
 *   modificabile è la sola parte che il cliente non potrebbe correggere.
 * - Le sigle delle fonti restano, piccole, con il collegamento alla voce
 *   del registro: la tracciabilità non dipende dal formato.
 */

const CARATTERE = "Arial";
/** Mezzi punti: la misura di docx per i corpi. */
const CORPO = 19;
const PICCOLO = 16;
const NOTA = 14;
const SIGLA = 11;

const twip = (pt: number) => Math.round(pt * 20);
/**
 * La larghezza utile della pagina, in twip: A4 meno i margini. Le tabelle
 * la dichiarano in misure assolute e con impaginazione fissa — con le sole
 * percentuali Word si arrangia, ma altri programmi stringono le colonne
 * fino a scrivere una lettera per riga.
 */
const LARGHEZZA_UTILE = 11906 - twip(62) * 2;

const NESSUN_BORDO = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
/** I bordi li disegnano le celle: quelli predefiniti della tabella sono una griglia. */
const SENZA_BORDI = {
  top: NESSUN_BORDO,
  bottom: NESSUN_BORDO,
  left: NESSUN_BORDO,
  right: NESSUN_BORDO,
  insideHorizontal: NESSUN_BORDO,
  insideVertical: NESSUN_BORDO,
};
const esa = (hex: string) => hex.replace("#", "").toUpperCase();

function corsa(testo: string, opz: { forte?: boolean; dimensione?: number; colore?: string } = {}) {
  return new TextRun({
    text: testo,
    bold: opz.forte,
    size: opz.dimensione ?? CORPO,
    color: opz.colore ? esa(opz.colore) : undefined,
    font: CARATTERE,
  });
}

class Compositore {
  private readonly e: Elaborato;
  private readonly veste: Veste;
  private readonly c: Veste["colori"];

  constructor(e: Elaborato, veste: Veste) {
    this.e = e;
    this.veste = veste;
    this.c = veste.colori;
  }

  /** La sigla dopo un valore: piccola, grigia, collegata al registro. */
  private sigla(id: string): ParagraphChild[] {
    return [
      new TextRun({ text: " ", size: SIGLA, font: CARATTERE }),
      new InternalHyperlink({
        anchor: `fonte-${id}`,
        children: [
          new TextRun({
            text: id,
            size: SIGLA,
            color: esa(this.c.secondario),
            font: CARATTERE,
            shading: { type: ShadingType.CLEAR, color: "auto", fill: esa(this.c.tinta) },
          }),
        ],
      }),
    ];
  }

  private testo(testo: string, opz: { dimensione?: number; colore?: string } = {}): ParagraphChild[] {
    return segmenti(testo).map((s) => corsa(s.testo, { forte: s.forte, ...opz }));
  }

  private cella(c: Cella, opz: { dimensione?: number; forte?: boolean; colore?: string } = {}): ParagraphChild[] {
    if (!eValore(c)) return [corsa(c, { dimensione: opz.dimensione ?? PICCOLO, forte: opz.forte, colore: opz.colore })];
    return [
      corsa(c.testo, { dimensione: opz.dimensione ?? PICCOLO, forte: opz.forte || c.forte, colore: opz.colore }),
      ...(c.fonte ? this.sigla(c.fonte) : []),
    ];
  }

  private paragrafo(testo: string, opz: { dimensione?: number; colore?: string; dopo?: number } = {}) {
    return new Paragraph({
      children: this.testo(testo, opz),
      spacing: { after: twip(opz.dopo ?? 6), line: 300 },
    });
  }

  private tabella(colonne: Colonna[], righe: Cella[][], totale?: Cella[]): Table {
    const pesi = colonne.map((col, i) => col.peso ?? (i === 0 ? 1.5 : 1));
    const somma = pesi.reduce((t, p) => t + p, 0);
    const bordoSotto = { style: BorderStyle.SINGLE, size: 4, color: esa(this.c.filetto) };
    const nessuno = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
    const larghezze = pesi.map((p) => Math.round((p / somma) * LARGHEZZA_UTILE));
    const cella = (contenuto: ParagraphChild[], i: number, opz: { testata?: boolean; totale?: boolean } = {}) =>
      new TableCell({
        width: { size: larghezze[i], type: WidthType.DXA },
        shading: opz.testata ? { type: ShadingType.CLEAR, color: "auto", fill: esa(this.c.tintaAccento) } : undefined,
        borders: {
          top: opz.totale ? { style: BorderStyle.SINGLE, size: 8, color: esa(this.c.inchiostro) } : nessuno,
          bottom: opz.testata ? { style: BorderStyle.SINGLE, size: 8, color: esa(this.c.accentoSegno) } : opz.totale ? nessuno : bordoSotto,
          left: nessuno,
          right: nessuno,
        },
        margins: { top: twip(3), bottom: twip(3), left: twip(4), right: twip(4) },
        children: [
          new Paragraph({
            alignment: colonne[i]?.allinea === "destra" ? AlignmentType.RIGHT : AlignmentType.LEFT,
            children: contenuto,
          }),
        ],
      });
    return new Table({
      width: { size: LARGHEZZA_UTILE, type: WidthType.DXA },
      columnWidths: larghezze,
      layout: TableLayoutType.FIXED,
      borders: SENZA_BORDI,
      rows: [
        new TableRow({
          tableHeader: true,
          children: colonne.map((col, i) =>
            cella([corsa(col.titolo.toLocaleUpperCase("it-IT"), { dimensione: NOTA, forte: true, colore: this.c.secondario })], i, { testata: true }),
          ),
        }),
        ...righe.map(
          (r) => new TableRow({ cantSplit: true, children: r.map((c, i) => cella(this.cella(c), i)) }),
        ),
        ...(totale
          ? [new TableRow({ cantSplit: true, children: totale.map((c, i) => cella(this.cella(c, { forte: true }), i, { totale: true })) })]
          : []),
      ],
    });
  }

  blocco(b: Blocco): (Paragraph | Table)[] {
    switch (b.tipo) {
      case "paragrafo":
        return [this.paragrafo(b.testo)];
      case "sottotitolo":
        return [
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: [corsa(b.testo, { forte: true, dimensione: 22, colore: this.c.inchiostro })],
            spacing: { before: twip(10), after: twip(4) },
            keepNext: true,
          }),
        ];
      case "elenco":
        return b.voci.map(
          (v) =>
            new Paragraph({
              bullet: { level: 0 },
              children: this.testo(v),
              spacing: { after: twip(3) },
            }),
        );
      case "coppie":
        return [
          this.tabella(
            [{ titolo: "Voce", peso: 1 }, { titolo: "Valore", peso: 2 }],
            b.righe.map((r) => [r.etichetta, r.valore]),
          ),
          new Paragraph({ children: [], spacing: { after: twip(6) } }),
        ];
      case "tabella":
        return [
          ...(b.didascalia
            ? [new Paragraph({ keepNext: true, children: [corsa(b.didascalia, { forte: true, dimensione: PICCOLO + 1 })], spacing: { before: twip(6), after: twip(4) } })]
            : []),
          this.tabella(b.colonne, b.righe, b.totale),
          ...(b.note ?? []).map((n) => this.paragrafo(n, { dimensione: NOTA, colore: this.c.secondario, dopo: 2 })),
          new Paragraph({ children: [], spacing: { after: twip(6) } }),
        ];
      case "cifre":
        return [
          this.tabella(
            b.voci.map((v) => ({ titolo: v.etichetta, allinea: "sinistra" as const })),
            [b.voci.map((v) => ({ ...v.valore, forte: true }))],
          ),
          ...b.voci.filter((v) => v.nota).map((v) => this.paragrafo(`${v.etichetta}: ${v.nota}`, { dimensione: NOTA, colore: this.c.secondario, dopo: 2 })),
          new Paragraph({ children: [], spacing: { after: twip(6) } }),
        ];
      case "barre":
        return [
          new Paragraph({ keepNext: true, children: [corsa(b.titolo, { forte: true, dimensione: PICCOLO + 1 })], spacing: { before: twip(6), after: twip(4) } }),
          this.tabella(
            [{ titolo: "Serie", peso: 1.2 }, ...b.parti.map((p) => ({ titolo: `${p} (${b.unita})`, allinea: "destra" as const })), { titolo: "Totale", allinea: "destra" }],
            b.serie.map((s) => [
              s.etichetta,
              ...s.valori.map((v) => v.toLocaleString("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2, useGrouping: "always" })),
              s.totale,
            ]),
          ),
          new Paragraph({ children: [], spacing: { after: twip(6) } }),
        ];
      case "riquadro":
        return [
          new Table({
            width: { size: LARGHEZZA_UTILE, type: WidthType.DXA },
            columnWidths: [LARGHEZZA_UTILE],
            layout: TableLayoutType.FIXED,
            borders: SENZA_BORDI,
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    width: { size: LARGHEZZA_UTILE, type: WidthType.DXA },
                    shading: { type: ShadingType.CLEAR, color: "auto", fill: b.tono === "attenzione" ? "FBF3E4" : esa(this.c.tinta) },
                    borders: {
                      left: { style: BorderStyle.SINGLE, size: 18, color: b.tono === "attenzione" ? "9A6A12" : esa(this.c.accentoSegno) },
                      top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                      bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                      right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                    },
                    margins: { top: twip(8), bottom: twip(8), left: twip(10), right: twip(10) },
                    children: [
                      ...(b.titolo ? [new Paragraph({ children: [corsa(b.titolo, { forte: true, dimensione: PICCOLO + 1 })], spacing: { after: twip(3) } })] : []),
                      new Paragraph({ children: this.testo(b.testo, { dimensione: PICCOLO + 1 }) }),
                    ],
                  }),
                ],
              }),
            ],
          }),
          new Paragraph({ children: [], spacing: { after: twip(8) } }),
        ];
    }
  }

  private titoloParte(chiave: string, testo: string, occhiello: string): Paragraph[] {
    return [
      new Paragraph({
        pageBreakBefore: true,
        children: [corsa(occhiello.toLocaleUpperCase("it-IT"), { forte: true, dimensione: 14, colore: this.c.accentoTesto })],
        spacing: { after: twip(2) },
        keepNext: true,
      }),
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new Bookmark({ id: `parte-${chiave}`, children: [corsa(testo, { forte: true, dimensione: 36, colore: this.c.inchiostro })] })],
        spacing: { after: twip(10) },
        keepNext: true,
      }),
    ];
  }

  private copertina(): (Paragraph | Table)[] {
    const f = this.e.frontespizio;
    const out: (Paragraph | Table)[] = [];
    if (this.veste.logo) {
      const posa = posaLogo(this.veste.logo.pxLarghezza, this.veste.logo.pxAltezza, this.veste.logo.vettoriale, SCATOLE_LOGO.copertina, LARGHEZZA_MINIMA_COPERTINA);
      out.push(
        new Paragraph({
          children: [
            new ImageRun({
              type: "png",
              data: this.veste.logo.png,
              transformation: { width: Math.round((posa.larghezza * 96) / 72), height: Math.round((posa.altezza * 96) / 72) },
              altText: { title: "Logo", description: `Logo di ${f.organizzazione}`, name: "logo" },
            }),
          ],
          spacing: { after: twip(120) },
        }),
      );
    } else {
      out.push(new Paragraph({ children: [corsa(this.veste.nomeIntestazione, { forte: true, dimensione: 26 })], spacing: { after: twip(120) } }));
    }
    if (this.e.esempio) out.push(this.paragrafo("DOCUMENTO DI ESEMPIO — IMPRESA E DATI INVENTATI", { dimensione: NOTA, colore: this.c.secondario }));
    out.push(
      new Paragraph({ children: [corsa(f.occhiello.toLocaleUpperCase("it-IT"), { forte: true, dimensione: 16, colore: this.c.accentoTesto })], spacing: { after: twip(6) } }),
      new Paragraph({ children: [corsa(f.titolo, { forte: true, dimensione: 64, colore: this.c.inchiostro })], spacing: { after: twip(10) } }),
      new Paragraph({ children: [corsa(f.organizzazione, { dimensione: 30 })], spacing: { after: twip(2) } }),
      this.paragrafo(`Esercizio di rendicontazione ${f.esercizio} · ${f.periodo}`, { colore: this.c.secondario, dopo: 60 }),
      this.tabella(
        [{ titolo: "Voce" }, { titolo: "Valore", peso: 2 }],
        [
          ...f.identificativi.map((i) => [i.etichetta, i.valore]),
          ...(f.costruitoSu ? [["Costruito su", f.costruitoSu]] : []),
          ["Revisione", `${this.e.revisione.numero} del ${DATA_LUNGA(this.e.revisione.data)}`],
          ["Validazione", this.e.validazione.stato === "validata" ? `Validato il ${DATA_LUNGA(this.e.validazione.il ?? this.e.revisione.data)}` : "In attesa di validazione professionale"],
          ["Codice del documento", f.codice],
        ],
      ),
      this.paragrafo("Composto con la piattaforma Verzero", { dimensione: NOTA, colore: this.c.secondario }),
    );
    return out;
  }

  corpo(): (Paragraph | Table | TableOfContents)[] {
    const e = this.e;
    const out: (Paragraph | Table | TableOfContents)[] = [];

    // Indice e legenda.
    out.push(
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [corsa("Indice", { forte: true, dimensione: 36 })], spacing: { after: twip(10) } }),
      new TableOfContents("Indice", {
        hyperlink: true,
        headingStyleRange: "1-1",
        cachedEntries: [
          ...e.sezioni.map((s) => ({ title: `${s.numero}. ${s.titolo}`, level: 1 })),
          { title: "Riferimenti normativi", level: 1 },
          { title: "Registro delle fonti", level: 1 },
          { title: "Validazione professionale", level: 1 },
          { title: "Registro delle revisioni", level: 1 },
        ],
      }),
      new Paragraph({ children: [corsa("Come leggere questo documento", { forte: true, dimensione: 22 })], spacing: { before: twip(18), after: twip(4) } }),
      this.paragrafo(e.testi.composizione, { dimensione: PICCOLO + 1 }),
      ...e.legenda.map((l) => new Paragraph({ children: [corsa(`${l.sigla}  `, { forte: true, dimensione: PICCOLO }), ...this.testo(l.testo, { dimensione: PICCOLO })], spacing: { after: twip(2) } })),
    );

    for (const s of e.sezioni) {
      out.push(...this.titoloParte(`sezione-${s.numero}`, `${s.numero}. ${s.titolo}`, `Sezione ${s.numero}`));
      if (s.riferimento) out.push(this.paragrafo(`Riferimento: ${s.riferimento}`, { dimensione: NOTA, colore: this.c.secondario }));
      for (const b of s.blocchi) out.push(...this.blocco(b));
    }

    // Riferimenti normativi.
    out.push(...this.titoloParte("riferimenti", "Riferimenti normativi", "Appendice"));
    out.push(this.paragrafo(e.testi.riferimentiIntro, { dimensione: PICCOLO + 1, colore: this.c.secondario }));
    out.push(
      this.tabella(
        [{ titolo: "Designazione", peso: 1.5 }, { titolo: "Ruolo nel documento", peso: 1.3 }, { titolo: "Stato nel registro", peso: 0.9 }],
        e.riferimenti.map((r) => [
          r.titolo ? `${r.designazione} — ${r.titolo}` : r.designazione,
          r.ruolo,
          r.stato === "in vigore" ? (r.dal ? `In vigore ${/^(8|11)\b/.test(r.dal) ? "dall'" : "dal "}${r.dal}` : "In vigore") : r.stato,
        ]),
      ),
    );

    // Registro delle fonti.
    out.push(...this.titoloParte("fonti", "Registro delle fonti", "Appendice"));
    out.push(this.paragrafo(e.testi.fontiIntro, { dimensione: PICCOLO + 1, colore: this.c.secondario }));
    for (const f of e.fonti) {
      out.push(
        new Paragraph({
          keepNext: true,
          spacing: { before: twip(6), after: twip(1) },
          children: [
            new Bookmark({ id: `fonte-${f.id}`, children: [corsa(`${f.id}  `, { forte: true, dimensione: PICCOLO + 1, colore: this.c.accentoTesto })] }),
            corsa(f.titolo, { forte: true, dimensione: PICCOLO + 1 }),
          ],
        }),
        ...[
          ...f.dettaglio,
          ...(f.tipo === "calcolato" && f.ingressi?.length ? [`Parte da: ${f.ingressi.join(", ")}`] : []),
          ...(f.confermataIl ? [`${f.tipo === "inserito" ? "Inserito o aggiornato" : "Confermato"} dall'organizzazione il ${f.confermataIl}`] : []),
        ].map((r) => this.paragrafo(r, { dimensione: NOTA, colore: this.c.secondario, dopo: 1 })),
        ...(f.url
          ? [new Paragraph({ children: [new ExternalHyperlink({ link: f.url, children: [corsa(f.url, { dimensione: NOTA, colore: this.c.secondario })] })] })]
          : []),
      );
    }

    // Validazione.
    out.push(...this.titoloParte("validazione", "Validazione professionale", "Appendice"));
    if (e.validazione.stato !== "validata") {
      out.push(...this.blocco({ tipo: "riquadro", titolo: "Validazione non ancora registrata", testo: e.testi.validazioneInAttesa, tono: "attenzione" }));
    } else {
      out.push(
        ...this.blocco({
          tipo: "coppie",
          righe: [
            { etichetta: "Professionista", valore: e.validazione.professionista ?? "" },
            { etichetta: "Qualifica", valore: e.validazione.qualifica ?? "" },
            { etichetta: "Data della validazione", valore: e.validazione.il ? DATA_LUNGA(e.validazione.il) : "" },
          ],
        }),
        ...this.blocco({ tipo: "sottotitolo", testo: "Rilievi" }),
        ...((e.validazione.rilievi ?? []).length > 0 ? this.blocco({ tipo: "elenco", voci: e.validazione.rilievi! }) : [this.paragrafo("Nessun rilievo.")]),
      );
    }
    out.push(this.paragrafo(e.testi.validazioneSpiega, { dimensione: PICCOLO + 1, colore: this.c.secondario }));

    // Revisioni.
    out.push(...this.titoloParte("revisioni", "Registro delle revisioni", "Appendice"));
    out.push(
      this.tabella(
        [{ titolo: "Rev.", peso: 0.35 }, { titolo: "Data", peso: 0.8 }, { titolo: "Motivo", peso: 1.6 }, { titolo: "Versione dello standard", peso: 1.2 }, { titolo: "Validazione", peso: 0.8 }],
        e.revisioni.map((r) => [String(r.numero), DATA_LUNGA(r.data), r.motivo, r.versioneStandard ?? "—", r.validazione === "validata" ? "Validata" : "In attesa"]),
      ),
    );
    out.push(this.paragrafo(e.testi.composizione, { dimensione: NOTA, colore: this.c.secondario }));
    return out;
  }

  intestazione(): Header {
    const f = this.e.frontespizio;
    const sinistra: ParagraphChild[] = this.veste.logo
      ? (() => {
          const posa = posaLogo(this.veste.logo!.pxLarghezza, this.veste.logo!.pxAltezza, this.veste.logo!.vettoriale, SCATOLE_LOGO.intestazione);
          return [
            new ImageRun({
              type: "png",
              data: this.veste.logo!.png,
              transformation: { width: Math.round((posa.larghezza * 96) / 72), height: Math.round((posa.altezza * 96) / 72) },
              altText: { title: "Logo", description: `Logo di ${f.organizzazione}`, name: "logo-intestazione" },
            }),
          ];
        })()
      : [corsa(this.veste.nomeIntestazione, { forte: true, dimensione: NOTA })];
    return new Header({
      children: [
        new Paragraph({
          tabStops: [{ type: TabStopType.RIGHT, position: LARGHEZZA_UTILE }],
          border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: esa(this.c.filetto), space: 4 } },
          children: [...sinistra, corsa(`\t${f.titolo} · ${f.codice}`, { dimensione: NOTA, colore: this.c.secondario })],
        }),
      ],
    });
  }

  pieDiPagina(): Footer {
    const e = this.e;
    const piva = e.frontespizio.identificativi.find((i) => i.etichetta === "Partita IVA");
    return new Footer({
      children: [
        new Paragraph({
          tabStops: [{ type: TabStopType.RIGHT, position: LARGHEZZA_UTILE }],
          border: { top: { style: BorderStyle.SINGLE, size: 4, color: esa(this.c.filetto), space: 4 } },
          children: [
            corsa(`${e.frontespizio.organizzazione}${piva ? ` · P.IVA ${piva.valore}` : ""}`, { dimensione: NOTA, colore: this.c.secondario }),
            corsa(`\tRev. ${e.revisione.numero} · ${e.validazione.stato === "validata" ? "Validato" : "In attesa di validazione"} · Pagina `, { dimensione: NOTA, colore: this.c.secondario }),
            new TextRun({ children: [PageNumber.CURRENT], size: NOTA, color: esa(this.c.secondario), font: CARATTERE }),
            corsa(" di ", { dimensione: NOTA, colore: this.c.secondario }),
            new TextRun({ children: [PageNumber.TOTAL_PAGES], size: NOTA, color: esa(this.c.secondario), font: CARATTERE }),
          ],
        }),
        ...(e.esempio
          ? [new Paragraph({ children: [corsa("DOCUMENTO DI ESEMPIO — IMPRESA E DATI INVENTATI", { dimensione: 12, colore: this.c.secondario })] })]
          : []),
      ],
    });
  }

  documento(): Document {
    const margini = { top: twip(78), bottom: twip(70), left: twip(62), right: twip(62), header: twip(30), footer: twip(30) };
    return new Document({
      creator: "Verzero",
      title: `${this.e.frontespizio.titolo} — ${this.e.frontespizio.organizzazione}`,
      subject: this.e.frontespizio.occhiello,
      keywords: this.e.frontespizio.codice,
      features: { updateFields: true },
      styles: {
        default: { document: { run: { font: CARATTERE, size: CORPO, color: esa(this.c.inchiostro) } } },
        // Gli stili di titolo di Word sono blu e in un altro carattere: si
        // ridefiniscono, altrimenti il documento cambia aspetto al primo
        // titolo che il cliente aggiunge.
        paragraphStyles: [
          {
            id: "Heading1",
            name: "Heading 1",
            basedOn: "Normal",
            next: "Normal",
            quickFormat: true,
            run: { font: CARATTERE, size: 36, bold: true, color: esa(this.c.inchiostro) },
            paragraph: { spacing: { after: twip(10) }, keepNext: true },
          },
          {
            id: "Heading2",
            name: "Heading 2",
            basedOn: "Normal",
            next: "Normal",
            quickFormat: true,
            run: { font: CARATTERE, size: 22, bold: true, color: esa(this.c.inchiostro) },
            paragraph: { spacing: { before: twip(10), after: twip(4) }, keepNext: true },
          },
          { id: "TOC1", name: "toc 1", basedOn: "Normal", next: "Normal", run: { font: CARATTERE, size: CORPO } },
        ],
      },
      sections: [
        { properties: { page: { margin: margini } }, children: this.copertina() },
        {
          properties: { page: { margin: margini } },
          headers: { default: this.intestazione() },
          footers: { default: this.pieDiPagina() },
          children: this.corpo(),
        },
      ],
    });
  }
}

export type DocxGenerato = { byte: Uint8Array };

/** Il DOCX. Come il PDF, accetta solo un elaborato consegnabile. */
export async function docxElaborato(e: ElaboratoConsegnabile, veste: Veste): Promise<DocxGenerato> {
  const doc = new Compositore(e, veste).documento();
  const buffer = await Packer.toBuffer(doc);
  return { byte: new Uint8Array(buffer) };
}
