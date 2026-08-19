/**
 * LETTURA DELLE PAGINE — estrazione VERBATIM (SPEC §12.D).
 *
 * Regola che governa tutto questo file: non riassumiamo, non
 * interpretiamo, non deduciamo. Riportiamo alla lettera ciò che
 * l'impresa ha scritto sul proprio sito, con l'indirizzo della pagina.
 * Un riassunto generato sarebbe una nostra affermazione sull'azienda;
 * una citazione è un fatto verificabile in un clic — e nei documenti di
 * sostenibilità la differenza fra le due cose è tutto.
 */

const VUOTO = /\s+/g;

/** Toglie script, stili e marcatura, lasciando il testo leggibile. */
export function testoDi(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&egrave;/gi, "è")
    .replace(/&agrave;/gi, "à")
    .replace(/&ograve;/gi, "ò")
    .replace(/&ugrave;/gi, "ù")
    .replace(/&igrave;/gi, "ì")
    .replace(VUOTO, " ")
    .trim();
}

function contenutoMeta(html: string, chiave: string, attributo: string): string | null {
  // L'ordine degli attributi nel tag varia: cerchiamo il tag e poi dentro.
  const tag = new RegExp(
    `<meta[^>]*${attributo}\\s*=\\s*["']${chiave}["'][^>]*>`,
    "i",
  ).exec(html);
  if (!tag) return null;
  const contenuto = /content\s*=\s*["']([^"']*)["']/i.exec(tag[0]);
  const valore = contenuto?.[1]?.replace(VUOTO, " ").trim();
  return valore ? testoDi(valore) : null;
}

/** La descrizione che l'azienda dà di sé nei metadati della pagina. */
export function descrizioneMeta(html: string): string | null {
  return (
    contenutoMeta(html, "og:description", "property") ??
    contenutoMeta(html, "description", "name") ??
    contenutoMeta(html, "og:description", "name")
  );
}

export function titoloPagina(html: string): string | null {
  const t = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html);
  const valore = t ? testoDi(t[1]) : null;
  return valore && valore.length > 0 ? valore : null;
}

export type Collegamento = { href: string; testo: string };

/** Tutti i collegamenti della pagina, risolti in indirizzi assoluti. */
export function collegamenti(html: string, base: string): Collegamento[] {
  const trovati: Collegamento[] = [];
  const espressione = /<a\b[^>]*href\s*=\s*["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let m: RegExpExecArray | null;
  while ((m = espressione.exec(html)) !== null) {
    const grezzo = m[1].trim();
    if (
      !grezzo ||
      grezzo.startsWith("#") ||
      /^(mailto:|tel:|javascript:|data:)/i.test(grezzo)
    ) {
      continue;
    }
    try {
      trovati.push({
        href: new URL(grezzo, base).toString(),
        testo: testoDi(m[2]).slice(0, 120),
      });
    } catch {
      // href malformato: si scarta e si prosegue.
    }
  }
  return trovati;
}

/**
 * Le norme e gli schemi che l'azienda dichiara di avere. Cerchiamo nomi
 * PRECISI: «ISO 9001» sì, la parola «certificato» no — quella comparirebbe
 * su mezzo web e ci farebbe scrivere cose non vere.
 */
const NORME: { etichetta: string; espressione: RegExp }[] = [
  { etichetta: "ISO 9001", espressione: /\bISO\s*9001\b/i },
  { etichetta: "ISO 14001", espressione: /\bISO\s*14001\b/i },
  { etichetta: "ISO 45001", espressione: /\bISO\s*45001\b/i },
  { etichetta: "ISO 50001", espressione: /\bISO\s*50001\b/i },
  { etichetta: "ISO 27001", espressione: /\bISO\s*27001\b/i },
  { etichetta: "ISO 13485", espressione: /\bISO\s*13485\b/i },
  { etichetta: "IATF 16949", espressione: /\bIATF\s*16949\b/i },
  { etichetta: "SA8000", espressione: /\bSA\s?8000\b/i },
  { etichetta: "UNI/PdR 125", espressione: /\bPdR\s*125\b|\bPrassi\s+di\s+Riferimento\s+125\b/i },
  { etichetta: "ISO 45003", espressione: /\bISO\s*45003\b/i },
  { etichetta: "ISO 30415", espressione: /\bISO\s*30415\b/i },
  { etichetta: "ISO 14064", espressione: /\bISO\s*14064\b/i },
  { etichetta: "ISO 14067", espressione: /\bISO\s*14067\b/i },
  { etichetta: "EMAS", espressione: /\bEMAS\b/ },
  { etichetta: "FSC", espressione: /\bFSC(?:®)?\b/ },
  { etichetta: "PEFC", espressione: /\bPEFC\b/ },
  { etichetta: "BRC", espressione: /\bBRC(?:GS)?\b/ },
  { etichetta: "IFS", espressione: /\bIFS\s+Food\b/i },
  { etichetta: "EcoVadis", espressione: /\bEcoVadis\b/i },
];

export function normeCitate(testo: string): string[] {
  return NORME.filter((n) => n.espressione.test(testo)).map((n) => n.etichetta);
}

/**
 * Indirizzi italiani riconoscibili con certezza: via/piazza/… seguita da
 * un CAP di cinque cifre e dal comune. Il CAP è l'àncora che evita di
 * scambiare una frase qualunque per una sede.
 */
/** Parole che nei siti seguono subito l'indirizzo: non sono il comune. */
const DOPO_INDIRIZZO =
  /^(tel|telefono|fax|cell|mobile|email|e-?mail|pec|p\.?\s?iva|piva|c\.?f|partita|codice|orari|lun|mon|italia|italy)$/i;

export function indirizziCitati(testo: string): string[] {
  // Via/piazza… + indirizzo + CAP di cinque cifre + comune. Il CAP è
  // l'àncora: senza, qualunque frase con «la nostra strada» diventerebbe
  // una sede, e noi non possiamo permetterci sedi immaginarie.
  //
  // Due presidi imparati sul campo, provando l'adapter su siti veri:
  //  - il tipo di via si àncora a inizio parola, altrimenti «PerCORSO»
  //    diventa «corso» e la frase «Percorso di Aderenza UNI ISO 45003
  //    Rischi psicosociali» si trasforma in una sede a «45003 Rischi»;
  //  - il numero di una NORMA non è un CAP: «ISO 45001», «ISO 14064»,
  //    «UNI 11352» hanno tutti cinque cifre, e sui siti industriali
  //    compaiono ovunque. Se davanti alle cinque cifre c'è una sigla di
  //    norma, quello non è un indirizzo.
  const espressione =
    /(?<![A-Za-zÀ-ÿ])(?:via|viale|v\.le|piazza|p\.zza|corso|c\.so|strada|localit[àa]|contrada|largo|vicolo)\s+[^,;|]{2,60}?[,\s]+(?<!\b(?:iso|uni|en|cei|pdr|pr|sa|ts|bs|ohsas|iec)\s)\d{5}\s+[A-ZÀ-Ü][A-Za-zÀ-ÿ'’.-]*(?:\s+[A-ZÀ-Ü][A-Za-zÀ-ÿ'’.-]*){0,3}/gi;

  const trovati = new Set<string>();
  let m: RegExpExecArray | null;
  while ((m = espressione.exec(testo)) !== null) {
    // Il comune può essersi portato dietro «Tel», «Email»…: si potano.
    const parole = m[0].replace(VUOTO, " ").trim().split(" ");
    while (parole.length > 0 && DOPO_INDIRIZZO.test(parole[parole.length - 1])) {
      parole.pop();
    }
    const pulito = parole.join(" ").replace(/[,\s]+$/, "");
    // Deve restare almeno il comune dopo il CAP, altrimenti non è una sede.
    if (!/\d{5}\s+\S/.test(pulito)) continue;
    if (pulito.length >= 15 && pulito.length <= 120) trovati.add(pulito);
  }
  return [...trovati];
}

/**
 * Le frasi in cui l'azienda parla dei propri mercati. Ne prendiamo solo
 * di autoportanti: devono nominare l'estero o i mercati E contenere un
 * numero o un'area geografica, altrimenti sarebbe una nostra deduzione.
 */
export function frasiSuiMercati(testo: string): string[] {
  const frasi = testo.split(/(?<=[.!?])\s+/);
  const tema = /\b(esport|export|mercat|estero|internazional)/i;
  const sostanza =
    /\b(\d{1,3}\s*(paesi|nazioni|mercati)|Europa|Italia|Nord\s?America|Sud\s?America|Asia|Africa|Oceania|Medio\s?Oriente|Stati\s?Uniti|Germania|Francia|Spagna|Regno\s?Unito|Cina|Giappone)\b/i;
  return frasi
    .map((f) => f.replace(VUOTO, " ").trim())
    .filter(
      (f) => f.length >= 25 && f.length <= 300 && tema.test(f) && sostanza.test(f),
    )
    .slice(0, 2);
}

/** Classificazione dei collegamenti per tipo di pagina che ci interessa. */
export const TIPI_PAGINA = {
  sostenibilita:
    /sostenibilit|sustainab|bilancio-?(di-)?sostenibilit|bilancio-sociale|\bcsr\b|\besg\b|responsabilit[aà]-sociale/i,
  certificazioni: /certificaz|certification|qualit[aà]|accredit/i,
  chiSiamo: /chi-?siamo|about|azienda|company|storia|la-nostra-storia|profilo/i,
  prodotti: /prodott|product|servizi|services|soluzioni|catalogo/i,
  contatti: /contatt|contact|dove-siamo|sedi|stabiliment/i,
  policy:
    /codice-?etico|code-of-(ethics|conduct)|politica|policy|whistleblow|segnalazion|modello-?231|carta-dei-valori/i,
} as const;

/** Le policy che non dicono nulla dell'impresa: fuori dal perimetro. */
const POLICY_DA_IGNORARE = /privacy|cookie|termini|terms|note-?legali|disclaimer/i;

export function classifica(
  link: Collegamento,
  tipo: keyof typeof TIPI_PAGINA,
): boolean {
  const spia = `${link.href} ${link.testo}`;
  if (!TIPI_PAGINA[tipo].test(spia)) return false;
  if (tipo === "policy" && POLICY_DA_IGNORARE.test(spia)) return false;
  return true;
}
