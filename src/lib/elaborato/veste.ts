import {
  contrasto,
  luminanzaRgb,
  normalizzaHex,
  rapportoLeggibile,
  rgbDi,
  SOGLIE,
} from "@/lib/contrasto";

/**
 * LA VESTE DEL DOCUMENTO — il marchio del cliente, verificato prima di usarlo.
 *
 * ═══ SEPARATA DAL CONTENUTO ═══
 * La veste dice di che colore è un filetto e dove sta il logo; non sa
 * che cosa dice il documento. Cambiarla non tocca un numero, e
 * rigenerare con la veste nuova produce lo stesso contenuto con un altro
 * aspetto (docs/motore.md §6).
 *
 * ═══ UN COLORE CHE NON PASSA NON SI RIFIUTA IN BLOCCO ═══
 * Si usa dove non porta testo, e lo si dice. Un documento che va
 * all'audit non può avere un titolo illeggibile perché il verde aziendale
 * è bello a schermo — e nemmeno perdere il colore del cliente perché non
 * regge il corpo del testo. Tre ruoli, tre soglie:
 *
 *   TESTO      titoli e numeri di sezione          ≥ 4,5:1 sulla carta
 *   SEGNO      filetti sottili, contorni           ≥ 3:1 sulla carta
 *   CAMPITURA  fasce, barre, fondi                 ≥ 1,3:1 sulla carta
 *
 * ═══ «SULLA CARTA», NON SUL BIANCO DELLO SCHERMO ═══
 * Il contrasto si misura contro un bianco di carta da ufficio, non contro
 * #FFFFFF: la carta non è bianca come uno schermo, e un colore che passa
 * a pelo sul bianco puro scende sotto soglia appena stampato. È un
 * margine voluto, dalla parte prudente.
 *
 * ═══ IL NOSTRO MARCHIO NON SI TOCCA ═══
 * Qui dentro c'è solo il marchio del cliente. Il logotipo Verzero ha i
 * suoi colori e la sua area, nel colophon, e nessuna funzione di questo
 * file lo ricolora: un marchio che prende il verde di un cliente e il
 * rosso di un altro non è più un marchio.
 */

/** Il bianco di una carta da ufficio: il fondo su cui si misura la stampa. */
export const CARTA = "#F2F1EC";

/** Le soglie dei tre ruoli, misurate contro la carta. */
export const SOGLIE_VESTE = {
  testo: SOGLIE.testo,
  segno: SOGLIE.grande,
  campitura: 1.3,
} as const;

/**
 * LA VESTE NEUTRA — per chi non carica nulla, che è la maggioranza.
 *
 * Grafite e ardesia, non i verdi del nostro sito: un documento neutro che
 * avesse i colori di Verzero sarebbe un documento col marchio di
 * Verzero, cioè esattamente la mescolanza che la veste deve evitare.
 */
export const COLORI_NEUTRI = {
  inchiostro: "#1B2127",
  secondario: "#56606B",
  filetto: "#D3D8DE",
  tinta: "#F3F4F6",
  accento: "#2C3A48",
} as const;

export type ColoriVeste = {
  inchiostro: string;
  secondario: string;
  filetto: string;
  tinta: string;
  /** Titoli, numeri di sezione, cifre in evidenza. */
  accentoTesto: string;
  /** Filetti d'accento, marcatori, contorni. */
  accentoSegno: string;
  /** Fasce e barre: superfici, mai testo sottile. */
  campitura: string;
  /** La seconda campitura dei grafici: la stessa tinta, schiarita. */
  campituraTenue: string;
  /** Il testo su una campitura; null = sulla campitura non si scrive. */
  suCampitura: string | null;
  /** Il fondo delle intestazioni di tabella: tinta leggera dell'accento. */
  tintaAccento: string;
};

export type EsitoColore = {
  /** Il colore così come l'ha scelto il cliente, normalizzato. */
  scelto: string | null;
  colori: ColoriVeste;
  /** I contrasti misurati, per mostrarli in anteprima. */
  misure: { testo: number; carta: number } | null;
  /** Che cosa ne abbiamo fatto, in chiaro. Vuoto = usato ovunque. */
  avvisi: string[];
  /** Dove il colore scelto è effettivamente usato. */
  usatoPer: ("testo" | "segno" | "campitura")[];
};

/** Mescola un colore col bianco: 0 = colore, 1 = bianco. */
export function schiarisci(hex: string, quanto: number): string {
  const [r, g, b] = rgbDi(hex);
  const m = (c: number) => Math.round(c + (255 - c) * quanto);
  return `#${[m(r), m(g), m(b)].map((c) => c.toString(16).padStart(2, "0")).join("").toUpperCase()}`;
}

/** Saturazione e luminosità HSL, per l'avviso sulla resa in stampa. */
function hsl(hex: string): { s: number; l: number } {
  const [r, g, b] = rgbDi(hex).map((c) => c / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  return { s, l };
}

function coloriNeutri(): ColoriVeste {
  return {
    inchiostro: COLORI_NEUTRI.inchiostro,
    secondario: COLORI_NEUTRI.secondario,
    filetto: COLORI_NEUTRI.filetto,
    tinta: COLORI_NEUTRI.tinta,
    accentoTesto: COLORI_NEUTRI.accento,
    accentoSegno: COLORI_NEUTRI.accento,
    campitura: COLORI_NEUTRI.accento,
    campituraTenue: schiarisci(COLORI_NEUTRI.accento, 0.55),
    suCampitura: "#FFFFFF",
    tintaAccento: "#EEF1F4",
  };
}

/**
 * Il colore d'accento del cliente, verificato ruolo per ruolo.
 *
 * Non restituisce mai un documento peggiore di quello neutro: dove il
 * colore non regge si torna al neutro per QUEL ruolo, e l'avviso dice
 * quale e perché, con il numero misurato accanto.
 */
export function verificaColore(valore: string | null | undefined): EsitoColore {
  const neutri = coloriNeutri();
  if (!valore) {
    return { scelto: null, colori: neutri, misure: null, avvisi: [], usatoPer: [] };
  }
  const scelto = normalizzaHex(valore);
  if (!scelto) {
    return {
      scelto: null,
      colori: neutri,
      misure: null,
      avvisi: [
        "Il colore indicato non è un codice esadecimale a sei cifre (per esempio #1F6F5C): il documento resta nella veste neutra.",
      ],
      usatoPer: [],
    };
  }

  const carta = contrasto(scelto, CARTA);
  const avvisi: string[] = [];
  const usatoPer: EsitoColore["usatoPer"] = [];

  if (carta < SOGLIE_VESTE.campitura) {
    return {
      scelto,
      colori: neutri,
      misure: { testo: carta, carta },
      avvisi: [
        `Il colore ${scelto} è troppo chiaro per vedersi su carta (${rapportoLeggibile(carta)}): il documento resta nella veste neutra. Un tono più scuro dello stesso colore funzionerebbe.`,
      ],
      usatoPer: [],
    };
  }

  const colori: ColoriVeste = { ...neutri };

  // CAMPITURA: sempre, se si vede.
  colori.campitura = scelto;
  colori.campituraTenue = schiarisci(scelto, 0.55);
  colori.tintaAccento = schiarisci(scelto, 0.9);
  usatoPer.push("campitura");

  // Sulla fascia si scrive in bianco-carta o in inchiostro, quello che
  // regge; se non regge nessuno dei due, sulla fascia non si scrive.
  if (contrasto(CARTA, scelto) >= SOGLIE_VESTE.testo) colori.suCampitura = "#FFFFFF";
  else if (contrasto(neutri.inchiostro, scelto) >= SOGLIE_VESTE.testo)
    colori.suCampitura = neutri.inchiostro;
  else colori.suCampitura = null;

  // SEGNO: filetti e marcatori sottili.
  if (carta >= SOGLIE_VESTE.segno) {
    colori.accentoSegno = scelto;
    usatoPer.push("segno");
  }

  // TESTO: titoli e numeri di sezione.
  if (carta >= SOGLIE_VESTE.testo) {
    colori.accentoTesto = scelto;
    usatoPer.push("testo");
  } else {
    colori.accentoTesto = neutri.inchiostro;
    avvisi.push(
      carta >= SOGLIE_VESTE.segno
        ? `Il colore ${scelto} non ha abbastanza contrasto per i titoli stampati (${rapportoLeggibile(carta)}, ne servono 4,5): lo usiamo per filetti, grafici e fasce, e i titoli restano scuri.`
        : `Il colore ${scelto} è chiaro (${rapportoLeggibile(carta)} sulla carta): lo usiamo solo per fasce e grafici, dove l'area lo rende visibile. Titoli e filetti restano scuri.`,
    );
  }

  // La tinta delle intestazioni di tabella deve reggere il testo scuro.
  if (contrasto(neutri.inchiostro, colori.tintaAccento) < SOGLIE_VESTE.testo) {
    colori.tintaAccento = neutri.tinta;
  }

  // In stampa i colori molto saturi e luminosi escono più spenti: non si
  // misura (servirebbe il profilo della stampante), si avvisa soltanto.
  const { s, l } = hsl(scelto);
  if (s > 0.85 && l > 0.35 && l < 0.7) {
    avvisi.push(
      `Il colore ${scelto} è molto saturo: in stampa può uscire più spento di come appare a schermo.`,
    );
  }

  return { scelto, colori, misure: { testo: carta, carta }, avvisi, usatoPer };
}

/* ================================================================== */
/* Il logo                                                             */
/* ================================================================== */

export const FORMATI_LOGO = ["image/png", "image/jpeg", "image/svg+xml"] as const;
/**
 * Il file caricato. Quattro mega e non cinque: la piattaforma che ospita
 * il portale tronca le richieste a 4,5 MB, e un limite promesso in pagina
 * che il server non può mantenere è un errore generico al momento
 * sbagliato.
 */
export const MAX_BYTE_LOGO = 4 * 1024 * 1024;
/** Il PNG preparato che finisce nell'archivio e dentro ogni documento. */
export const MAX_BYTE_PNG_LOGO = 4 * 1024 * 1024;
/**
 * I pixel oltre i quali un'immagine non si apre nemmeno: decodificarla
 * costerebbe gigabyte di memoria, e un logo da 5.000 × 5.000 pixel è già
 * dieci volte quello che la copertina può mostrare.
 */
export const MAX_PIXEL_LOGO = 25_000_000;

/** Le scatole in cui il logo si posa, in punti tipografici (1/72 di pollice). */
export const SCATOLE_LOGO = {
  copertina: { larghezza: 170, altezza: 64 },
  intestazione: { larghezza: 96, altezza: 20 },
} as const;

/** Sotto questa risoluzione in stampa si vede sgranato: si rimpicciolisce. */
export const DPI_BUONI = 200;
/** Sotto questa, nemmeno rimpicciolito regge: il logo non si usa. */
export const DPI_MINIMI = 150;
/** La copertina non mostra il logo più piccolo di così (25 mm). */
export const LARGHEZZA_MINIMA_COPERTINA = 72;

export type TonoMessaggio = "ok" | "avviso" | "blocco";

export type SfondoLogo = "trasparente" | "bianco" | "colorato" | "irregolare";

export type AnalisiPixel = {
  sfondo: SfondoLogo;
  /** Il colore del fondo, quando è pieno e uniforme. */
  coloreSfondo?: string;
  /** Sul trasparente, l'inchiostro è quasi tutto chiaro: su carta bianca sparisce. */
  inchiostroChiaro: boolean;
  /** Quota di pixel pieni: un logo vuoto non è un logo. */
  pieni: number;
};

/**
 * Guarda i pixel di un logo, già ridotti (bastano 256 px di lato).
 *
 * Il FONDO si legge dalla cornice: se quasi tutti i pixel del bordo sono
 * trasparenti il logo è su trasparente; se sono pieni e uniformi, è su un
 * fondo di quel colore. Un bordo pieno e disuniforme è un'immagine che
 * tocca i margini — una foto, un logo ritagliato stretto — e lo si dice
 * senza indovinare.
 *
 * L'INCHIOSTRO CHIARO è il caso che fa più danno e non si vede a
 * schermo: il logo bianco pensato per il sito su fondo scuro, caricato
 * su trasparente. Nel portale, su fondo chiaro, sembra solo «tenue»; in
 * copertina, su carta, non c'è.
 */
export function analizzaPixel(
  rgba: Uint8Array,
  larghezza: number,
  altezza: number,
): AnalisiPixel {
  const px = (x: number, y: number) => {
    const i = (y * larghezza + x) * 4;
    return [rgba[i], rgba[i + 1], rgba[i + 2], rgba[i + 3]] as const;
  };

  let pieni = 0;
  let chiari = 0;
  let trasparenti = 0;
  for (let y = 0; y < altezza; y++) {
    for (let x = 0; x < larghezza; x++) {
      const [r, g, b, a] = px(x, y);
      if (a < 16) trasparenti++;
      if (a < 128) continue;
      pieni++;
      if (luminanzaRgb(r, g, b) > 0.8) chiari++;
    }
  }
  const totale = larghezza * altezza;
  const quotaPieni = pieni / totale;

  // Il fondo è trasparente se lo è una parte apprezzabile dell'immagine.
  // Guardare solo la cornice sbagliava sui loghi rifilati stretti, dove il
  // segno tocca il bordo e la cornice è per metà piena: si scambiava un
  // logo su trasparente per un'immagine con un fondo irregolare.
  if (trasparenti / totale >= 0.1) {
    return {
      sfondo: "trasparente",
      inchiostroChiaro: pieni > 0 && chiari / pieni > 0.85,
      pieni: quotaPieni,
    };
  }

  // Opaca: il fondo si legge dalla cornice.
  const cornice = Math.max(1, Math.round(Math.min(larghezza, altezza) * 0.03));
  const bordo: (readonly [number, number, number, number])[] = [];
  for (let y = 0; y < altezza; y++) {
    for (let x = 0; x < larghezza; x++) {
      const dentro =
        x >= cornice && x < larghezza - cornice && y >= cornice && y < altezza - cornice;
      if (!dentro) bordo.push(px(x, y));
    }
  }
  const media = [0, 1, 2].map((c) => bordo.reduce((t, p) => t + p[c], 0) / bordo.length);
  const scarto = Math.sqrt(
    bordo.reduce((t, p) => t + [0, 1, 2].reduce((u, c) => u + (p[c] - media[c]) ** 2, 0), 0) /
      (bordo.length * 3),
  );
  if (scarto > 18) {
    return { sfondo: "irregolare", inchiostroChiaro: false, pieni: quotaPieni };
  }
  const hex = `#${media.map((c) => Math.round(c).toString(16).padStart(2, "0")).join("").toUpperCase()}`;
  const bianco = luminanzaRgb(media[0], media[1], media[2]) > 0.9;
  return {
    sfondo: bianco ? "bianco" : "colorato",
    ...(bianco ? {} : { coloreSfondo: hex }),
    inchiostroChiaro: false,
    pieni: quotaPieni,
  };
}

export type Posa = {
  /** Punti tipografici. */
  larghezza: number;
  altezza: number;
  /** La risoluzione effettiva in stampa; null per i vettoriali. */
  dpi: number | null;
  /** Rimpicciolito rispetto alla scatola per non sgranarsi. */
  ridotto: boolean;
};

/**
 * Quanto grande si posa il logo in una scatola.
 *
 * Adattare, non degradare: un logo a bassa risoluzione non si rifiuta se
 * può stare più piccolo e restare nitido. Si cerca la dimensione più
 * grande che stia nella scatola E dia almeno 200 dpi; il logo si
 * rifiuta solo se nemmeno alla dimensione minima arriva a 150.
 */
export function posaLogo(
  pxLarghezza: number,
  pxAltezza: number,
  vettoriale: boolean,
  scatola: { larghezza: number; altezza: number },
  /** La larghezza sotto cui non si scende, anche a costo di qualche dpi. */
  minima = 0,
): Posa {
  const rapporto = pxLarghezza / pxAltezza;
  const piena = Math.min(scatola.larghezza, scatola.altezza * rapporto);
  if (vettoriale) {
    return { larghezza: piena, altezza: piena / rapporto, dpi: null, ridotto: false };
  }
  const dpi = (w: number) => pxLarghezza / (w / 72);
  let larghezza = piena;
  let ridotto = false;
  if (dpi(piena) < DPI_BUONI) {
    larghezza = Math.max((pxLarghezza / DPI_BUONI) * 72, Math.min(minima, piena));
    ridotto = larghezza < piena;
  }
  return { larghezza, altezza: larghezza / rapporto, dpi: dpi(larghezza), ridotto };
}

export type EsitoLogo = {
  utilizzabile: boolean;
  messaggi: { tono: TonoMessaggio; testo: string }[];
  analisi: AnalisiPixel;
  copertina: Posa;
};

/**
 * Il giudizio sul logo, in messaggi che il cliente capisce.
 *
 * Tre esiti: si usa così com'è; si usa, e c'è qualcosa da sapere; non si
 * usa, e si dice cosa caricare invece. Mai un logo usato lo stesso quando
 * sappiamo che in stampa non si vedrebbe.
 */
export function giudicaLogo(dati: {
  pxLarghezza: number;
  pxAltezza: number;
  vettoriale: boolean;
  analisi: AnalisiPixel;
}): EsitoLogo {
  const { analisi } = dati;
  const messaggi: EsitoLogo["messaggi"] = [];
  const copertina = posaLogo(
    dati.pxLarghezza,
    dati.pxAltezza,
    dati.vettoriale,
    SCATOLE_LOGO.copertina,
    LARGHEZZA_MINIMA_COPERTINA,
  );

  if (analisi.pieni < 0.002) {
    return {
      utilizzabile: false,
      messaggi: [
        {
          tono: "blocco",
          testo: "L'immagine è vuota o quasi: non c'è un logo da mostrare. Controlla il file e caricalo di nuovo.",
        },
      ],
      analisi,
      copertina,
    };
  }

  if (analisi.sfondo === "trasparente" && analisi.inchiostroChiaro) {
    messaggi.push({
      tono: "blocco",
      testo:
        "Il logo è chiaro su fondo trasparente: su carta bianca non si vedrebbe. Carica la versione scura (quella che usi su fondo bianco).",
    });
  }

  if (!dati.vettoriale) {
    if ((copertina.dpi ?? Infinity) < DPI_MINIMI) {
      messaggi.push({
        tono: "blocco",
        testo: `L'immagine è troppo piccola per la stampa (${dati.pxLarghezza}×${dati.pxAltezza} pixel): anche ridotta al minimo resterebbe sgranata. Serve un file di almeno 600 pixel di larghezza, oppure il logo in formato SVG.`,
      });
    } else if (copertina.ridotto) {
      messaggi.push({
        tono: "avviso",
        testo: `La risoluzione è bassa per la stampa (${dati.pxLarghezza}×${dati.pxAltezza} pixel): in copertina mostriamo il logo più piccolo, così resta nitido. Con un file più grande, o in SVG, lo mostriamo alla dimensione piena.`,
      });
    }
  }

  if (analisi.sfondo === "colorato") {
    messaggi.push({
      tono: "avviso",
      testo: `Il logo ha un fondo colorato (${analisi.coloreSfondo}): sulla carta bianca si vedrà come un riquadro. Se hai la versione su fondo trasparente o bianco, il risultato è più pulito.`,
    });
  } else if (analisi.sfondo === "irregolare") {
    messaggi.push({
      tono: "avviso",
      testo:
        "L'immagine arriva fino ai bordi con un fondo non uniforme: controlla nell'anteprima che si veda come ti aspetti.",
    });
  }

  const bloccato = messaggi.some((m) => m.tono === "blocco");
  if (!bloccato && messaggi.length === 0) {
    messaggi.push({
      tono: "ok",
      testo: dati.vettoriale
        ? "Logo vettoriale: resta nitido a qualunque dimensione."
        : "Formato, risoluzione e fondo vanno bene per la stampa.",
    });
  }

  return { utilizzabile: !bloccato, messaggi, analisi, copertina };
}

/* ================================================================== */
/* La veste risolta                                                    */
/* ================================================================== */

/** Le impostazioni di marchio come stanno in banca dati (`brand_settings`). */
export type ImpostazioniMarchio = {
  logo_percorso: string | null;
  logo_larghezza: number | null;
  logo_altezza: number | null;
  logo_vettoriale: boolean | null;
  colore_accento: string | null;
  nome_intestazione: string | null;
  indirizzo: string | null;
  sito: string | null;
  contatto: string | null;
  updated_at: string | null;
};

export type Veste = {
  neutra: boolean;
  colori: ColoriVeste;
  /** Il logo, già normalizzato in PNG, con la sua posa. */
  logo: { png: Uint8Array; pxLarghezza: number; pxAltezza: number; vettoriale: boolean } | null;
  /** Il nome nell'intestazione delle pagine interne. */
  nomeIntestazione: string;
  /** Le righe identificative del piè di pagina e della copertina. */
  contatti: string[];
  avvisi: string[];
};

/**
 * Compone la veste dalle impostazioni. Senza impostazioni è la veste
 * neutra, e la veste neutra è un documento finito: nessun rettangolo
 * vuoto, nessun «il tuo logo qui».
 */
export function componiVeste(dati: {
  ragioneSociale: string;
  impostazioni: ImpostazioniMarchio | null;
  logoPng?: Uint8Array | null;
}): Veste {
  const imp = dati.impostazioni;
  const colore = verificaColore(imp?.colore_accento);
  const logo =
    dati.logoPng && imp?.logo_larghezza && imp.logo_altezza
      ? {
          png: dati.logoPng,
          pxLarghezza: imp.logo_larghezza,
          pxAltezza: imp.logo_altezza,
          vettoriale: imp.logo_vettoriale === true,
        }
      : null;
  const contatti = [imp?.indirizzo, imp?.sito, imp?.contatto]
    .map((v) => v?.trim())
    .filter((v): v is string => Boolean(v));

  return {
    neutra: !logo && colore.usatoPer.length === 0,
    colori: colore.colori,
    logo,
    nomeIntestazione: imp?.nome_intestazione?.trim() || dati.ragioneSociale,
    contatti,
    avvisi: colore.avvisi,
  };
}

/**
 * L'impronta della veste: entra in quella dell'elaborato, così un logo
 * nuovo rigenera il documento invece di sentirsi dire che non è cambiato
 * nulla. Non contiene i byte del logo — basta sapere che il file è un
 * altro — e non contiene gli avvisi, che sono testo derivato.
 */
export function improntaVeste(imp: ImpostazioniMarchio | null): string {
  if (!imp) return "neutra";
  return [
    imp.logo_percorso ?? "",
    imp.colore_accento ?? "",
    imp.nome_intestazione ?? "",
    imp.indirizzo ?? "",
    imp.sito ?? "",
    imp.contatto ?? "",
  ].join("|");
}
