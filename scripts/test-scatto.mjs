/**
 * TEST DELL'ACQUISIZIONE DA FOTOCAMERA.
 *
 * Le due parti che decidono qualcosa — la misura della qualità e la
 * cucitura delle pagine — sono aritmetica su vettori di pixel e su byte,
 * senza browser. È una scelta di progetto: le soglie che stabiliscono se
 * una foto è leggibile devono potersi provare su immagini costruite
 * apposta, e una funzione che ha bisogno di un canvas per girare è una
 * funzione che nessuno prova.
 *
 *   node --import ./scripts/risolutore-ts.mjs scripts/test-scatto.mjs
 */

import {
  ANGOLO_MASSIMO,
  SOGLIE,
  angoloDiInclinazione,
  esitoQualita,
  grigi,
  luminosita,
  nitidezza,
  riquadroDocumento,
  soglia,
} from "../src/lib/scatto/qualita.ts";
import { nomeDelloScatto, pdfDaScatti } from "../src/lib/scatto/pdf.ts";
import { naturaPdf } from "../src/lib/motore/pdf.ts";
import { livelloIniziale } from "../src/lib/motore/livelli.ts";
import {
  LATO_MASSIMO,
  MAX_BYTE_PAGINA,
  MAX_PAGINE,
} from "../src/lib/scatto/immagine.ts";

let superati = 0;
let falliti = 0;
function verifica(descrizione, condizione, dettaglio = "") {
  if (condizione) {
    console.log(`✅ ${descrizione}`);
    superati++;
  } else {
    console.log(`❌ ${descrizione}${dettaglio ? ` — ${dettaglio}` : ""}`);
    falliti++;
  }
}

/* ------------------------------------------------------------------ */
/* Immagini finte, costruite per avere le proprietà che servono         */
/* ------------------------------------------------------------------ */

/** Una tela RGBA piena di un grigio solo. */
function tela(larghezza, altezza, valore = 255) {
  const dati = new Uint8ClampedArray(larghezza * altezza * 4);
  for (let i = 0; i < dati.length; i += 4) {
    dati[i] = dati[i + 1] = dati[i + 2] = valore;
    dati[i + 3] = 255;
  }
  return { dati, larghezza, altezza };
}

function punto(img, x, y, valore) {
  if (x < 0 || y < 0 || x >= img.larghezza || y >= img.altezza) return;
  const i = (y * img.larghezza + x) * 4;
  img.dati[i] = img.dati[i + 1] = img.dati[i + 2] = valore;
}

/**
 * Un finto documento: pagina chiara con righe di «testo» scure, dentro
 * uno sfondo scuro (il tavolo). `inclinazione` in gradi.
 */
function documento({
  larghezza = 1600,
  altezza = 2000,
  margine = 200,
  inclinazione = 0,
  sfondo = 40,
  carta = 240,
  inchiostro = 30,
  passoRighe = 40,
} = {}) {
  const img = tela(larghezza, altezza, sfondo);
  const x0 = margine;
  const x1 = larghezza - margine;
  const y0 = margine;
  const y1 = altezza - margine;

  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) punto(img, x, y, carta);
  }

  // Le righe di testo: barre spesse, inclinate di quanto chiesto.
  const tang = Math.tan((inclinazione * Math.PI) / 180);
  for (let y = y0 + 30; y < y1 - 30; y += passoRighe) {
    for (let spessore = 0; spessore < 8; spessore++) {
      for (let x = x0 + 30; x < x1 - 30; x++) {
        const yy = Math.round(y + spessore + (x - larghezza / 2) * tang);
        if (yy > y0 && yy < y1) punto(img, x, yy, inchiostro);
      }
    }
  }
  return img;
}

/** La stessa immagine, ma sfocata: media dei vicini, più volte. */
function sfoca(img, giri = 3) {
  let corrente = img;
  for (let g = 0; g < giri; g++) {
    const out = tela(corrente.larghezza, corrente.altezza);
    for (let y = 1; y < corrente.altezza - 1; y++) {
      for (let x = 1; x < corrente.larghezza - 1; x++) {
        let somma = 0;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            somma += corrente.dati[((y + dy) * corrente.larghezza + (x + dx)) * 4];
          }
        }
        punto(out, x, y, somma / 9);
      }
    }
    corrente = out;
  }
  return corrente;
}

/* ================================================================== */
console.log("\n— le misure di base —\n");

const chiara = tela(100, 100, 200);
verifica("la luminosità media si legge", Math.round(luminosita(grigi(chiara))) === 200);

const mezzaEMezza = tela(100, 100, 60);
for (let y = 0; y < 50; y++) for (let x = 0; x < 100; x++) punto(mezzaEMezza, x, y, 200);
const t = soglia(grigi(mezzaEMezza));
verifica(
  "la soglia di Otsu separa i due gruppi: sopra è carta, sotto è tavolo",
  t >= 60 && t < 200,
  String(t),
);

const doc = documento();
const docSfocato = sfoca(doc);
verifica(
  "una foto nitida ha nitidezza molto più alta di una mossa",
  nitidezza(grigi(doc), doc.larghezza, doc.altezza) >
    nitidezza(grigi(docSfocato), doc.larghezza, doc.altezza) * 5,
  `${Math.round(nitidezza(grigi(doc), doc.larghezza, doc.altezza))} contro ${Math.round(nitidezza(grigi(docSfocato), doc.larghezza, doc.altezza))}`,
);

/* ================================================================== */
console.log("\n— dove sta il documento nella foto —\n");

const riquadro = riquadroDocumento(grigi(doc), doc.larghezza, doc.altezza);
verifica("il foglio si trova", riquadro !== null);
if (riquadro) {
  verifica(
    "e il riquadro combacia col foglio, entro qualche pixel",
    Math.abs(riquadro.x - 200) < 40 &&
      Math.abs(riquadro.y - 200) < 40 &&
      Math.abs(riquadro.larghezza - 1200) < 80,
    JSON.stringify(riquadro),
  );
}

const tuttoFoglio = documento({ margine: 2 });
verifica(
  "se il foglio riempie il fotogramma non si ritaglia: non c'è niente da togliere",
  riquadroDocumento(grigi(tuttoFoglio), tuttoFoglio.larghezza, tuttoFoglio.altezza) ===
    null,
);

const soloSfondo = tela(800, 600, 40);
verifica(
  "su una foto senza documento non si inventa un ritaglio",
  riquadroDocumento(grigi(soloSfondo), 800, 600) === null,
);

/* ================================================================== */
console.log("\n— quanto è storta —\n");

for (const atteso of [0, 3, -4, 6]) {
  const storto = documento({ inclinazione: atteso, larghezza: 1200, altezza: 1500 });
  const misurato = angoloDiInclinazione(grigi(storto), storto.larghezza, storto.altezza);
  verifica(
    `un foglio inclinato di ${atteso}° si misura entro un grado`,
    Math.abs(misurato - atteso) <= 1,
    `misurato ${misurato}°`,
  );
}
verifica(
  "non si cercano inclinazioni assurde: oltre otto gradi non è una foto storta",
  ANGOLO_MASSIMO === 8,
);

/* ================================================================== */
console.log("\n— il verdetto sullo scatto —\n");

const buono = documento({ larghezza: 1600, altezza: 2000 });
const esitoBuono = esitoQualita(buono);
verifica(
  "uno scatto nitido, luminoso e dritto passa senza avvisi",
  esitoBuono.buona,
  esitoBuono.avvisi.map((a) => a.testo).join(" | "),
);

const piccolo = documento({ larghezza: 800, altezza: 1000 });
const esitoPiccolo = esitoQualita(piccolo);
verifica(
  "uno scatto sotto i 1.240 pixel viene fermato: il testo non reggerebbe",
  esitoPiccolo.avvisi.some((a) => a.grave && a.testo.includes("piccola")),
  esitoPiccolo.avvisi.map((a) => a.testo).join(" | "),
);
verifica(
  "e la soglia è quella dei 150 punti per pollice su un A4",
  SOGLIE.larghezzaMinima === 1240,
);

const mosso = sfoca(documento({ larghezza: 1600, altezza: 2000 }), 2);
verifica(
  "uno scatto mosso viene fermato",
  esitoQualita(mosso).avvisi.some((a) => a.grave && a.testo.includes("mossa")),
  esitoQualita(mosso).avvisi.map((a) => a.testo).join(" | "),
);

const buio = documento({ larghezza: 1600, altezza: 2000, carta: 60, inchiostro: 10, sfondo: 5 });
verifica(
  "uno scatto al buio viene fermato",
  esitoQualita(buio).avvisi.some((a) => a.grave && a.testo.includes("luce")),
  esitoQualita(buio).avvisi.map((a) => a.testo).join(" | "),
);

verifica(
  "ogni avviso dice COSA FARE, non solo cosa non va",
  esitoQualita(mosso)
    .avvisi.concat(esitoQualita(buio).avvisi, esitoPiccolo.avvisi)
    .every((a) => /rifall|riscatta|avvicina|accendi|spostati|rifai/i.test(a.testo)),
);
verifica(
  "nessun avviso impedisce l'invio: chi ha l'unica copia di un registro deve poterla mandare",
  typeof esitoQualita(mosso).buona === "boolean" &&
    !("blocca" in esitoQualita(mosso)),
);

/* ================================================================== */
console.log("\n— le pagine diventano un documento solo —\n");

/** Un JPEG minimo ma valido nella struttura: basta a provare la cucitura. */
const jpegFinto = (n) =>
  new Uint8Array([0xff, 0xd8, 0xff, 0xe0, ...new Array(n).fill(0x41), 0xff, 0xd9]);

const pdf = pdfDaScatti([
  { jpeg: jpegFinto(100), larghezza: 1600, altezza: 2000 },
  { jpeg: jpegFinto(120), larghezza: 1600, altezza: 2000 },
  { jpeg: jpegFinto(90), larghezza: 2000, altezza: 1600 },
]);
const testo = Buffer.from(pdf).toString("latin1");

verifica("è un PDF", testo.startsWith("%PDF-1.4"));
verifica("e finisce come deve", testo.trimEnd().endsWith("%%EOF"));
verifica(
  "tre scatti fanno tre pagine, non tre documenti",
  /\/Count 3/.test(testo) && (testo.match(/\/Type \/Page[^s]/g) ?? []).length === 3,
);
verifica(
  "i JPEG stanno dentro senza essere ricompressi",
  (testo.match(/\/DCTDecode/g) ?? []).length === 3 &&
    testo.includes("A".repeat(100)),
);
verifica(
  "una pagina orizzontale resta orizzontale",
  /MediaBox \[0 0 960\.00 768\.00\]/.test(testo),
  (testo.match(/MediaBox[^\]]*\]/g) ?? []).join(" · "),
);
verifica(
  "un A4 fotografato a 1.240 pixel occupa una pagina A4 (595×842 punti circa)",
  (() => {
    const solo = Buffer.from(
      pdfDaScatti([{ jpeg: jpegFinto(10), larghezza: 1240, altezza: 1754 }]),
    ).toString("latin1");
    return /MediaBox \[0 0 595\.20 841\.92\]/.test(solo);
  })(),
);

/* — La xref, che è la parte che si rompe senza che nessuno se ne accorga — */
const scostamenti = [...testo.matchAll(/^(\d{10}) 00000 n $/gm)].map((m) =>
  Number(m[1]),
);
verifica(
  "la tabella xref ha una riga per oggetto",
  scostamenti.length === 2 + 3 * 3,
  String(scostamenti.length),
);
verifica(
  "e ogni scostamento punta davvero all'inizio del suo oggetto",
  scostamenti.every((s, i) => testo.slice(s).startsWith(`${i + 1} 0 obj`)),
);
verifica(
  "startxref punta all'inizio della tabella",
  (() => {
    const m = testo.match(/startxref\n(\d+)/);
    return m && testo.slice(Number(m[1])).startsWith("xref");
  })(),
);

verifica(
  "senza pagine non si costruisce un documento vuoto: si dice che manca qualcosa",
  (() => {
    try {
      pdfDaScatti([]);
      return false;
    } catch {
      return true;
    }
  })(),
);

/* ================================================================== */
console.log("\n— il nome del file —\n");

verifica(
  "il nome porta il tipo scelto, così il riconoscimento lo legge",
  nomeDelloScatto("registro-manutenzione", 3).startsWith("registro-manutenzione-"),
  nomeDelloScatto("registro-manutenzione", 3),
);
verifica(
  "e dice quante pagine sono, quando è più di una",
  nomeDelloScatto("formazione", 4).includes("4pagine") &&
    !nomeDelloScatto("formazione", 1).includes("pagine"),
);
verifica(
  "senza tipo resta generico invece di indovinare",
  nomeDelloScatto(null, 1).startsWith("documento-fotografato-"),
);
verifica("è sempre un PDF", nomeDelloScatto(null, 2).endsWith(".pdf"));


/* ================================================================== */
console.log("\n— i casi storti —\n");

/* — Troppe pagine: il limite si dichiara, e dice cosa fare — */
verifica(
  "il limite di pagine è dichiarato e ragionevole",
  MAX_PAGINE >= 8 && MAX_PAGINE <= 20,
  String(MAX_PAGINE),
);

/* — Un documento troppo pesante — */
const pesante = pdfDaScatti(
  Array.from({ length: MAX_PAGINE }, () => ({
    jpeg: jpegFinto(MAX_BYTE_PAGINA),
    larghezza: 2400,
    altezza: 3200,
  })),
);
verifica(
  `${MAX_PAGINE} pagine al peso massimo superano i 20 MB dell'archivio: il caso esiste`,
  pesante.byteLength > 20 * 1024 * 1024,
  `${Math.round(pesante.byteLength / 1024 / 1024)} MB`,
);
verifica(
  "e una pagina sola sta larga sotto il limite",
  pdfDaScatti([{ jpeg: jpegFinto(2_000_000), larghezza: 2400, altezza: 3200 }])
    .byteLength <
    20 * 1024 * 1024,
);
verifica(
  "il tetto per pagina lascia spazio a un documento di più fogli",
  MAX_BYTE_PAGINA * MAX_PAGINE > 20 * 1024 * 1024,
  "il controllo sul totale serve: il tetto per pagina da solo non basta",
);

/* — Una foto illeggibile: si avvisa, non si blocca — */
const illeggibile = sfoca(
  documento({ larghezza: 1000, altezza: 1300, carta: 70, inchiostro: 40 }),
  3,
);
const esitoIlleggibile = esitoQualita(illeggibile);
verifica(
  "una foto piccola, scura e mossa raccoglie tutti e tre gli avvisi",
  esitoIlleggibile.avvisi.filter((a) => a.grave).length >= 3,
  esitoIlleggibile.avvisi.map((a) => a.testo.slice(0, 40)).join(" | "),
);
verifica(
  "ma resta inviabile: la decisione è del cliente, non nostra",
  esitoIlleggibile.buona === false && Array.isArray(esitoIlleggibile.avvisi),
);

/* — Il lato di lavoro sta sopra il minimo di leggibilità — */
verifica(
  "il lato a cui portiamo lo scatto sta sopra la soglia di leggibilità",
  LATO_MASSIMO > SOGLIE.larghezzaMinima,
  `${LATO_MASSIMO} contro ${SOGLIE.larghezzaMinima}`,
);
verifica(
  "e non tanto sopra da produrre file enormi: un A4 a 2.400 px sta a ~290 dpi",
  Math.round((LATO_MASSIMO / (297 / 25.4)) ) < 400,
  `${Math.round(LATO_MASSIMO / (297 / 25.4))} dpi sul lato lungo`,
);

/* — Le pagine restano nell'ordine deciso — */
const ordinato = Buffer.from(
  pdfDaScatti([
    { jpeg: jpegFinto(11), larghezza: 100, altezza: 200 },
    { jpeg: jpegFinto(22), larghezza: 300, altezza: 400 },
  ]),
).toString("latin1");
verifica(
  "la prima pagina resta la prima: l'ordine del riordino è quello del PDF",
  ordinato.indexOf("A".repeat(11)) < ordinato.indexOf("A".repeat(22)),
);


/* ================================================================== */
console.log("\n— e il Motore deve vederlo per quello che è —\n");

/**
 * IL DIFETTO CHE QUESTO CONTROLLO TIENE CHIUSO.
 *
 * Un PDF di sole fotografie veniva riconosciuto come NATIVO: i byte di
 * un JPEG contengono per caso le sequenze «BT» e «Tj», e il rilevatore
 * ci trovava centomila caratteri di testo inesistenti. Conseguenza: un
 * documento fotografato finiva al livello leggero, con l'attesa di
 * confidenza di un documento nato digitale e senza gli avvisi di
 * qualità. Trovato collaudando la fotocamera, ma valeva per OGNI
 * scansione — ed è il tipo di errore che non dà segno di sé.
 */
const jpegConTrappola = () => {
  const testa = [0xff, 0xd8, 0xff, 0xe0];
  const trappola = [...Buffer.from(" BT (x) Tj TJ ET ", "latin1")];
  const rumore = Array.from({ length: 4000 }, (_, i) => (i * 37) % 256);
  return new Uint8Array([...testa, ...trappola, ...rumore, ...trappola, 0xff, 0xd9]);
};

const pdfFotografato = pdfDaScatti([
  { jpeg: jpegConTrappola(), larghezza: 1800, altezza: 2400 },
  { jpeg: jpegConTrappola(), larghezza: 1800, altezza: 2400 },
]);
const natura = naturaPdf(pdfFotografato);

verifica(
  "un PDF di sole foto NON è nativo, nemmeno se i byte contengono «BT» e «Tj»",
  natura.nativo === false,
  `${natura.caratteriTesto} caratteri contati`,
);
verifica(
  "e non ci si trova dentro un solo carattere di testo",
  natura.caratteriTesto === 0,
  String(natura.caratteriTesto),
);
verifica(
  "le pagine però si contano giuste",
  natura.pagine === 2,
  String(natura.pagine),
);
verifica(
  "quindi il Motore lo manda al livello che tratta le scansioni, non a quello leggero",
  livelloIniziale(
    { famiglia: "fonte", forma: "tabella", campi: new Array(8), attesa: {} },
    { nativo: natura.nativo, manoscrittoAtteso: false },
  ) !== "leggero",
);

console.log(
  `\nRisultato: ${superati}/${superati + falliti} test superati${falliti ? ` — ${falliti} FALLITI` : ""}\n`,
);
process.exit(falliti === 0 ? 0 : 1);
