import "server-only";

import sharp from "sharp";

import {
  analizzaPixel,
  FORMATI_LOGO,
  giudicaLogo,
  MAX_BYTE_LOGO,
  MAX_BYTE_PNG_LOGO,
  MAX_PIXEL_LOGO,
  type EsitoLogo,
} from "./veste";

/**
 * IL LOGO CARICATO, PREPARATO PER LA STAMPA.
 *
 * Il giudizio vive in `veste.ts`, puro e provato; qui c'è il lavoro sui
 * byte, che richiede `sharp` e resta sul server:
 *
 *   1. formato, peso e PIXEL, prima di decodificare: un PNG da mezzo mega
 *      può essere un'immagine da 12.000 × 12.000 che ne occupa uno e mezzo
 *      in memoria, e il tetto si controlla sull'intestazione del file;
 *   2. un SVG si rasterizza alla risoluzione che serve — nei documenti
 *      entra sempre un PNG, così PDF e DOCX mostrano la stessa immagine — e
 *      si rifiuta se porta script, risorse esterne o dichiarazioni XML: un
 *      logo non ne ha bisogno, e un file che le porta non lo apriamo;
 *   3. i margini vuoti o bianchi si tolgono: un logo con un bordo largo
 *      in copertina sembra piccolo e fuori asse;
 *   4. il PNG che resta ha un peso massimo, e se non ci sta si riduce;
 *   5. i pixel si guardano ridotti, e il giudizio dice se si usa, si usa
 *      con un avviso, o non si usa.
 */

export type LogoPreparato = {
  png: Uint8Array;
  larghezza: number;
  altezza: number;
  vettoriale: boolean;
  esito: EsitoLogo;
};

/** Oltre questa larghezza non serve: 2.400 pixel sono otto pollici a 300 dpi. */
const LARGHEZZA_MASSIMA = 2400;

const MB = (byte: number) => `${Math.round(byte / (1024 * 1024))} MB`;

/**
 * Ciò che un logo vettoriale non ha motivo di contenere: codice, entità XML,
 * immagini incorporate, riferimenti che escono dal disegno. Le immagini
 * incorporate soprattutto: un SVG da un mega può portarsi dentro un PNG da
 * sedicimila pixel per lato, che il rasterizzatore decodifica senza passare
 * dal tetto dei pixel — tre gigabyte di memoria per un «logo». Un `href` o un
 * `url()` è ammesso solo verso un elemento dello stesso disegno (`#id`).
 */
const PERICOLI_SVG =
  /<script|<foreignObject|<!DOCTYPE|<!ENTITY|<image[\s>/]|<feImage[\s>/]|@import|(?:xlink:)?href\s*=\s*["']\s*(?!#)|url\(\s*["']?\s*(?!#)/i;

/** Le varianti di codifica, dalla più fedele alla più leggera: si prende la prima che sta nel peso. */
const CODIFICHE: { lato: number; tavolozza: boolean }[] = [
  { lato: LARGHEZZA_MASSIMA, tavolozza: false },
  { lato: LARGHEZZA_MASSIMA, tavolozza: true },
  { lato: 1600, tavolozza: true },
];

export async function preparaLogo(
  byte: Uint8Array,
  mime: string,
): Promise<LogoPreparato | { errore: string }> {
  if (!(FORMATI_LOGO as readonly string[]).includes(mime)) {
    return { errore: "Formato non ammesso: carica il logo in PNG, JPEG o SVG." };
  }
  if (byte.byteLength === 0) return { errore: "Il file è vuoto." };
  if (byte.byteLength > MAX_BYTE_LOGO) {
    return { errore: `Il file supera i ${MB(MAX_BYTE_LOGO)}: per un logo basta molto meno, prova a esportarlo di nuovo.` };
  }

  const vettoriale = mime === "image/svg+xml";
  const opzioni = { limitInputPixels: MAX_PIXEL_LOGO };
  // Un testo XML si guarda PRIMA di darlo a qualunque lettore d'immagini,
  // qualunque formato dichiari: le entità di un DOCTYPE si espandono già
  // mentre si leggono le dimensioni, e un SVG spacciato per PNG salterebbe
  // un controllo fatto solo sugli SVG dichiarati.
  const testo = Buffer.from(byte).toString("utf8");
  const sembraXml = /^\s*(?:﻿)?\s*</.test(testo.slice(0, 1024)) || /<svg[\s>]/i.test(testo);
  if (sembraXml && PERICOLI_SVG.test(testo)) {
    return {
      errore:
        "Il file SVG contiene script, dichiarazioni o richiami a risorse esterne: esportalo di nuovo come immagine semplice, oppure carica un PNG.",
    };
  }
  try {
    // Il formato dichiarato dal browser è un'etichetta: si confronta con
    // quello che il file è davvero. `metadata` legge l'intestazione, non
    // decodifica l'immagine — per questo qui il tetto dei pixel non si
    // passa: lo si controlla sotto, con un messaggio che dice le misure,
    // invece di un errore generico.
    const meta = await sharp(Buffer.from(byte), { limitInputPixels: false }).metadata();
    const atteso = { "image/png": "png", "image/jpeg": "jpeg", "image/svg+xml": "svg" }[mime];
    if (meta.format !== atteso) {
      return { errore: "Il contenuto del file non corrisponde al suo formato: esportalo di nuovo in PNG, JPEG o SVG." };
    }

    let immagine: ReturnType<typeof sharp>;
    if (vettoriale) {
      if (!/<svg[\s>]/i.test(testo)) return { errore: "Il file non contiene un'immagine SVG." };
      // La densità si sceglie perché il disegno esca largo quanto serve, non
      // di più: un SVG dichiarato largo diecimila punti, a 600 dpi, sarebbe
      // un'immagine da ottantamila pixel.
      const densita = Math.min(2400, Math.max(1, (72 * LARGHEZZA_MASSIMA) / Math.max(1, meta.width ?? LARGHEZZA_MASSIMA)));
      immagine = sharp(Buffer.from(byte), { ...opzioni, density: densita });
    } else {
      if ((meta.width ?? 0) * (meta.height ?? 0) > MAX_PIXEL_LOGO) {
        return {
          errore: `L'immagine è di ${meta.width} × ${meta.height} pixel: per un logo ne bastano ${LARGHEZZA_MASSIMA} di larghezza. Esportala più piccola e riprova.`,
        };
      }
      immagine = sharp(Buffer.from(byte), opzioni).rotate();
    }

    // Prima si riduce a una misura che il rifilo non può rimpiangere, POI si
    // codifica: un'immagine a piena risoluzione codificata e ridecodificata
    // due volte è il modo più caro di arrivare allo stesso logo.
    const pieno = await immagine
      .resize(LARGHEZZA_MASSIMA * 2, LARGHEZZA_MASSIMA * 2, { fit: "inside", withoutEnlargement: true })
      .ensureAlpha()
      .png({ compressionLevel: 1 })
      .toBuffer();
    let rifilato = pieno;
    try {
      rifilato = await sharp(pieno, opzioni).trim({ threshold: 12 }).png({ compressionLevel: 1 }).toBuffer();
    } catch {
      // Un'immagine uniforme non si rifila: resta com'è, e il giudizio dirà
      // che è vuota.
    }

    let png: Buffer | null = null;
    for (const c of CODIFICHE) {
      const candidato = await sharp(rifilato, opzioni)
        .resize(c.lato, c.lato, { fit: "inside", withoutEnlargement: true })
        .png(c.tavolozza ? { palette: true, colours: 256, dither: 0.6, compressionLevel: 9 } : { compressionLevel: 9, adaptiveFiltering: true })
        .toBuffer();
      if (candidato.byteLength <= MAX_BYTE_PNG_LOGO) {
        png = candidato;
        break;
      }
    }
    if (!png) {
      return { errore: "L'immagine è troppo ricca di dettagli per un logo: esportala su fondo trasparente o bianco, senza fotografie, e riprova." };
    }
    const finale = await sharp(png, opzioni).metadata();
    const larghezza = finale.width ?? 0;
    const altezza = finale.height ?? 0;
    if (larghezza === 0 || altezza === 0) return { errore: "Non riusciamo a leggere le dimensioni dell'immagine." };

    // I pixel si guardano PRIMA del rifilo: il fondo di un logo si capisce
    // dai margini che il file aveva, non da quelli che gli abbiamo tolto.
    const ridotto = await sharp(pieno, opzioni)
      .resize(256, 256, { fit: "inside", withoutEnlargement: true })
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    const analisi = analizzaPixel(new Uint8Array(ridotto.data), ridotto.info.width, ridotto.info.height);
    const esito = giudicaLogo({ pxLarghezza: larghezza, pxAltezza: altezza, vettoriale, analisi });

    return { png: new Uint8Array(png), larghezza, altezza, vettoriale, esito };
  } catch {
    return { errore: "Il file non si apre come immagine: controlla che non sia danneggiato, o troppo grande, e riprova." };
  }
}
