import type { Adapter, CampoArricchito, RisultatoFonte } from "./tipi";

/**
 * ATECO / ISTAT — classificazione delle attività economiche.
 *
 * VIA DI ACCESSO VERIFICATA: la classificazione ATECO è pubblicata da
 * ISTAT come tavola ufficiale ed è dato pubblico, liberamente
 * consultabile e riutilizzabile con citazione della fonte. Non esiste —
 * e non serve — un'API: è una tabella che cambia di rado. La teniamo qui,
 * in casa, così la decodifica non dipende da nessuno ed è istantanea.
 *
 * ATTENZIONE ALLA VERSIONE: dal 1° gennaio 2025 vige ATECO 2025, adottata
 * operativamente dal 1° aprile 2025 e usata dal Registro Imprese da quella
 * data; sostituisce ATECO 2007 – aggiornamento 2022. Le divisioni qui
 * sotto seguono ATECO 2025.
 *
 * COSA FA QUESTO ADAPTER: non scopre il codice ATECO dell'impresa — quello
 * arriva dal Registro Imprese, cioè dal provider camerale a pagamento
 * (vedi camerale.ts) o dall'inserimento dell'utente. Questo adapter prende
 * un codice già presente e lo rende leggibile a chi non è del mestiere:
 * «25.62 — Lavorazione e finitura di metalli» invece di «25.62».
 * Se il codice non c'è, lo dice e passa la mano: nessun dato inventato.
 */

/**
 * Divisioni ATECO (primi due numeri): il livello che serve davvero per
 * dire a un imprenditore in che settore lo colloca la classificazione.
 * Fonte: ISTAT, classificazione ATECO 2025.
 */
const DIVISIONI: Record<string, string> = {
  "01": "Coltivazioni agricole e produzione animale, caccia e servizi connessi",
  "02": "Silvicoltura e utilizzo di aree forestali",
  "03": "Pesca e acquacoltura",
  "05": "Estrazione di carbone",
  "06": "Estrazione di petrolio greggio e di gas naturale",
  "07": "Estrazione di minerali metalliferi",
  "08": "Altre attività di estrazione di minerali da cave e miniere",
  "09": "Attività dei servizi di supporto all'estrazione",
  "10": "Industrie alimentari",
  "11": "Industria delle bevande",
  "12": "Industria del tabacco",
  "13": "Industrie tessili",
  "14": "Confezione di articoli di abbigliamento",
  "15": "Fabbricazione di articoli in pelle e simili",
  "16": "Industria del legno e dei prodotti in legno e sughero",
  "17": "Fabbricazione di carta e di prodotti di carta",
  "18": "Stampa e riproduzione di supporti registrati",
  "19": "Fabbricazione di coke e prodotti derivanti dalla raffinazione del petrolio",
  "20": "Fabbricazione di prodotti chimici",
  "21": "Fabbricazione di prodotti farmaceutici di base e preparati farmaceutici",
  "22": "Fabbricazione di articoli in gomma e materie plastiche",
  "23": "Fabbricazione di altri prodotti della lavorazione di minerali non metalliferi",
  "24": "Metallurgia",
  "25": "Fabbricazione di prodotti in metallo, esclusi macchinari e attrezzature",
  "26": "Fabbricazione di computer e prodotti di elettronica e ottica",
  "27": "Fabbricazione di apparecchiature elettriche",
  "28": "Fabbricazione di macchinari e apparecchiature n.c.a.",
  "29": "Fabbricazione di autoveicoli, rimorchi e semirimorchi",
  "30": "Fabbricazione di altri mezzi di trasporto",
  "31": "Fabbricazione di mobili",
  "32": "Altre industrie manifatturiere",
  "33": "Riparazione e installazione di macchinari e apparecchiature",
  "35": "Fornitura di energia elettrica, gas, vapore e aria condizionata",
  "36": "Raccolta, trattamento e fornitura di acqua",
  "37": "Gestione delle reti fognarie",
  "38": "Attività di raccolta, trattamento e smaltimento dei rifiuti; recupero dei materiali",
  "39": "Attività di risanamento e altri servizi di gestione dei rifiuti",
  "41": "Costruzione di edifici",
  "42": "Ingegneria civile",
  "43": "Lavori di costruzione specializzati",
  "45": "Commercio all'ingrosso e al dettaglio e riparazione di autoveicoli e motocicli",
  "46": "Commercio all'ingrosso, escluso quello di autoveicoli e motocicli",
  "47": "Commercio al dettaglio, escluso quello di autoveicoli e motocicli",
  "49": "Trasporto terrestre e trasporto mediante condotte",
  "50": "Trasporto marittimo e per vie d'acqua",
  "51": "Trasporto aereo",
  "52": "Magazzinaggio e attività di supporto ai trasporti",
  "53": "Servizi postali e attività di corriere",
  "55": "Alloggio",
  "56": "Attività dei servizi di ristorazione",
  "58": "Attività editoriali",
  "59": "Attività di produzione cinematografica, video e programmi televisivi, registrazioni musicali",
  "60": "Attività di programmazione e trasmissione",
  "61": "Telecomunicazioni",
  "62": "Produzione di software, consulenza informatica e attività connesse",
  "63": "Attività dei servizi d'informazione e altri servizi informatici",
  "64": "Attività di servizi finanziari, escluse le assicurazioni e i fondi pensione",
  "65": "Assicurazioni, riassicurazioni e fondi pensione",
  "66": "Attività ausiliarie dei servizi finanziari e delle attività assicurative",
  "68": "Attività immobiliari",
  "69": "Attività legali e contabilità",
  "70": "Attività di direzione aziendale e di consulenza gestionale",
  "71": "Attività degli studi di architettura e d'ingegneria; collaudi e analisi tecniche",
  "72": "Ricerca scientifica e sviluppo",
  "73": "Pubblicità e ricerche di mercato",
  "74": "Altre attività professionali, scientifiche e tecniche",
  "75": "Servizi veterinari",
  "77": "Attività di noleggio e leasing operativo",
  "78": "Attività di ricerca, selezione e fornitura di personale",
  "79": "Attività dei servizi delle agenzie di viaggio e dei tour operator",
  "80": "Servizi di vigilanza e investigazione",
  "81": "Attività di servizi per edifici e paesaggio",
  "82": "Attività di supporto per le funzioni d'ufficio e altri servizi alle imprese",
  "84": "Amministrazione pubblica e difesa; assicurazione sociale obbligatoria",
  "85": "Istruzione",
  "86": "Assistenza sanitaria",
  "87": "Servizi di assistenza sociale residenziale",
  "88": "Assistenza sociale non residenziale",
  "90": "Attività creative, artistiche e di intrattenimento",
  "91": "Attività di biblioteche, archivi, musei e altre attività culturali",
  "92": "Attività riguardanti le lotterie, le scommesse, le case da gioco",
  "93": "Attività sportive, di intrattenimento e di divertimento",
  "94": "Attività di organizzazioni associative",
  "95": "Riparazione di computer e di beni per uso personale e per la casa",
  "96": "Altre attività di servizi per la persona",
  "97": "Attività di famiglie e convivenze come datori di lavoro per personale domestico",
  "99": "Organizzazioni ed organismi extraterritoriali",
};

/** La divisione (prime due cifre) di un codice ATECO scritto in qualunque modo. */
export function divisioneDi(codice: string): string | null {
  const cifre = codice.replace(/\D/g, "");
  if (cifre.length < 2) return null;
  return cifre.slice(0, 2);
}

/** Descrizione ufficiale della divisione, se il codice è riconoscibile. */
export function descrizioneAteco(codice: string): string | null {
  const divisione = divisioneDi(codice);
  return divisione ? (DIVISIONI[divisione] ?? null) : null;
}

/** Il codice normalizzato nella forma «25.62», più leggibile del grezzo. */
function normalizzaCodice(codice: string): string {
  const cifre = codice.replace(/\D/g, "");
  if (cifre.length <= 2) return cifre;
  const resto = cifre.slice(2).match(/.{1,2}/g) ?? [];
  return [cifre.slice(0, 2), ...resto].join(".");
}

export const adapterAteco: Adapter = {
  chiave: "ateco",
  nome: "ATECO — classificazione ISTAT delle attività",
  cosaRecupera: "Traduce il codice ATECO nel settore a cui appartieni",
  stato: "attiva",

  async esegui(contesto): Promise<RisultatoFonte> {
    const grezzo = contesto.campiEsistenti.ateco?.trim();
    if (!grezzo) {
      return {
        esito: "nessun_dato",
        campi: [],
        dettaglio:
          "Nessun codice ATECO ancora disponibile: arriva dal Registro Imprese o da te.",
      };
    }

    const descrizione = descrizioneAteco(grezzo);
    if (!descrizione) {
      return {
        esito: "nessun_dato",
        campi: [],
        dettaglio: `Codice «${grezzo}» non riconosciuto nella classificazione ATECO 2025.`,
      };
    }

    const leggibile = `${normalizzaCodice(grezzo)} — ${descrizione}`;
    // Già decodificato in un giro precedente: non riscriviamo per nulla.
    if (grezzo === leggibile) {
      return {
        esito: "nessun_dato",
        campi: [],
        dettaglio: "Codice ATECO già esteso con la sua descrizione.",
      };
    }

    const campi: CampoArricchito[] = [
      { campo: "ateco", valore: leggibile, fonte: "ISTAT · ATECO 2025" },
    ];
    return { esito: "ok", campi };
  },
};
