import {
  classifica,
  collegamenti,
  descrizioneMeta,
  frasiSuiMercati,
  indirizziCitati,
  normeCitate,
  testoDi,
  titoloPagina,
  type Collegamento,
} from "./html";
import { USER_AGENT, consentito, leggiRobots, type Robots } from "./robots";
import {
  fetchConScadenza,
  type Adapter,
  type CampoArricchito,
  type RisultatoFonte,
} from "./tipi";

/**
 * PRESENZA WEB DELL'IMPRESA (SPEC §12.D).
 *
 * Il sito del cliente contiene ciò che nessuna banca dati ha: come
 * l'azienda descrive sé stessa, cosa produce, dove sta, quali norme
 * espone, quali politiche ha pubblicato. Sono esattamente le sezioni
 * QUALITATIVE che nel VSME, nei manuali ISO e nella PdR 125 restano
 * altrimenti vuote.
 *
 * QUATTRO REGOLE, NON NEGOZIABILI.
 *
 * 1. SOLO IL SITO DEL CLIENTE. Leggiamo unicamente il dominio che
 *    l'impresa ha dichiarato come proprio, e i suoi sottodomini. Mai un
 *    aggregatore commerciale che ripubblica dati camerali: i loro
 *    termini quasi sempre lo vietano, e la visura ufficiale costa pochi
 *    euro dando pieno diritto d'uso (§12.D).
 * 2. ROBOTS.TXT PRIMA DI TUTTO. Si legge, si rispetta, e in dubbio si
 *    sta fermi. Il mandato del cliente non ci autorizza a ignorare le
 *    regole che il suo sito pubblica per i programmi automatici.
 * 3. SOLO CITAZIONI. Mai un riassunto: riportiamo alla lettera ciò che
 *    l'impresa ha scritto. Un riassunto sarebbe una nostra affermazione
 *    sull'azienda, una citazione è un fatto che si controlla in un clic.
 * 4. OGNI DATO PORTA IL SUO URL. Senza indirizzo il dato non è
 *    verificabile, e quindi non si scrive.
 */

/** Quante pagine leggiamo al massimo, oltre alla home: siamo ospiti. */
const MAX_PAGINE = 4;
/** Pausa fra una pagina e l'altra quando il sito non ne chiede una sua. */
const PAUSA_MINIMA_MS = 400;
/** Oltre questa attesa richiesta dal sito, rinunciamo invece di insistere. */
const CRAWL_DELAY_MASSIMO_S = 10;
/** Le pagine grandi si tagliano: non ci serve tutto, ci serve l'inizio. */
const MAX_BYTE_PAGINA = 600_000;

const attendi = (ms: number) =>
  new Promise((risolvi) => setTimeout(risolvi, ms));

/**
 * Normalizza il sito dichiarato e rifiuta ciò che non è un sito pubblico.
 * Gli indirizzi privati e locali sono esclusi di proposito: un servizio
 * che scarica URL arbitrari lato server è un varco verso la rete interna,
 * e questo non deve poterlo diventare.
 */
export function normalizzaSito(grezzo: string): URL | null {
  const pulito = grezzo.trim();
  if (!pulito) return null;
  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(pulito) ? pulito : `https://${pulito}`);
  } catch {
    return null;
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return null;

  const host = url.hostname.toLowerCase();
  if (
    host === "localhost" ||
    host.endsWith(".local") ||
    host.endsWith(".internal") ||
    /^\d{1,3}(\.\d{1,3}){3}$/.test(host) ||
    host.includes(":")
  ) {
    return null;
  }
  if (!host.includes(".")) return null;
  return url;
}

/** Il dominio registrabile, in modo che i sottodomini restino ammessi. */
function dominioBase(host: string): string {
  const pezzi = host.toLowerCase().split(".");
  return pezzi.slice(-2).join(".");
}

function stessoSito(url: URL, sito: URL): boolean {
  return dominioBase(url.hostname) === dominioBase(sito.hostname);
}

type Pagina = { url: string; html: string; testo: string };

/** Una fonte, per il badge: «Sito ufficiale» resta breve e chiaro. */
const FONTE = "Sito ufficiale";

export const adapterPresenzaWeb: Adapter = {
  chiave: "presenza-web",
  nome: "Il tuo sito ufficiale",
  cosaRecupera:
    "Come descrivi la tua attività, le sedi, i mercati, le certificazioni e le policy che hai pubblicato",
  stato: "attiva",

  async esegui(contesto): Promise<RisultatoFonte> {
    if (!contesto.sitoWeb) {
      return {
        esito: "nessun_dato",
        campi: [],
        dettaglio:
          "Nessun sito indicato: si può aggiungere dalla scheda impresa.",
      };
    }

    const sito = normalizzaSito(contesto.sitoWeb);
    if (!sito) {
      return {
        esito: "errore",
        campi: [],
        dettaglio: `Indirizzo del sito non utilizzabile: «${contesto.sitoWeb}».`,
      };
    }

    const scarica = (url: string) =>
      fetchConScadenza(url, {
        headers: {
          "User-Agent": USER_AGENT,
          Accept: "text/html,application/xhtml+xml",
          "Accept-Language": "it-IT,it;q=0.9",
        },
        redirect: "follow",
      });

    // 1. Il permesso, prima di ogni altra cosa.
    let robots: Robots;
    try {
      robots = await leggiRobots(sito.origin, scarica);
    } catch {
      robots = { stato: "irraggiungibile", regole: [], crawlDelay: null };
    }
    if (robots.stato === "irraggiungibile") {
      return {
        esito: "errore",
        campi: [],
        dettaglio:
          "robots.txt non raggiungibile: senza sapere cosa consente il sito non leggiamo nulla.",
      };
    }
    if (robots.crawlDelay !== null && robots.crawlDelay > CRAWL_DELAY_MASSIMO_S) {
      return {
        esito: "nessun_dato",
        campi: [],
        dettaglio: `Il sito chiede ${robots.crawlDelay}s di attesa fra le pagine: troppo per una lettura ordinata, ci fermiamo.`,
      };
    }
    const pausa = Math.max(
      PAUSA_MINIMA_MS,
      (robots.crawlDelay ?? 0) * 1000,
    );

    /** Scarica una pagina se il sito lo consente. Non lancia mai. */
    const leggiPagina = async (indirizzo: string): Promise<Pagina | null> => {
      let url: URL;
      try {
        url = new URL(indirizzo);
      } catch {
        return null;
      }
      if (!stessoSito(url, sito)) return null;
      if (!consentito(robots, `${url.pathname}${url.search}`)) return null;
      try {
        const risposta = await scarica(url.toString());
        if (!risposta.ok) return null;
        const tipo = risposta.headers.get("content-type") ?? "";
        if (!/text\/html|application\/xhtml/i.test(tipo)) return null;
        const html = (await risposta.text()).slice(0, MAX_BYTE_PAGINA);
        return { url: url.toString(), html, testo: testoDi(html) };
      } catch {
        return null;
      }
    };

    const home = await leggiPagina(sito.toString());
    if (!home) {
      return {
        esito: consentito(robots, sito.pathname) ? "errore" : "nessun_dato",
        campi: [],
        dettaglio: consentito(robots, sito.pathname)
          ? "Il sito non ha risposto o non è una pagina leggibile."
          : "Il robots.txt del sito non consente la lettura: ci fermiamo qui.",
      };
    }

    // 2. Scegliamo poche pagine, quelle che contano per i documenti.
    const link = collegamenti(home.html, home.url).filter((l) => {
      try {
        return stessoSito(new URL(l.href), sito);
      } catch {
        return false;
      }
    });
    const primoDi = (tipo: Parameters<typeof classifica>[1]) =>
      link.find((l) => classifica(l, tipo));

    const candidate = [
      primoDi("sostenibilita"),
      primoDi("chiSiamo"),
      primoDi("certificazioni"),
      primoDi("contatti"),
    ].filter((l): l is Collegamento => !!l);

    const viste = new Set([home.url]);
    const pagine: Pagina[] = [home];
    for (const candidata of candidate) {
      if (pagine.length > MAX_PAGINE) break;
      if (viste.has(candidata.href)) continue;
      viste.add(candidata.href);
      await attendi(pausa);
      const pagina = await leggiPagina(candidata.href);
      if (pagina) pagine.push(pagina);
    }

    // 3. Estrazione: solo citazioni, ognuna con la sua pagina.
    const campi: CampoArricchito[] = [];
    const aggiungi = (campo: string, valore: string, url: string) => {
      const pulito = valore.trim();
      if (pulito.length < 3 || pulito.length > 1500) return;
      campi.push({ campo, valore: pulito, fonte: FONTE, fonteUrl: url });
    };

    // Descrizione dell'attività: le parole con cui l'azienda si presenta.
    const descrizione = descrizioneMeta(home.html);
    if (descrizione && descrizione.length >= 40) {
      aggiungi("descrizione_attivita", descrizione, home.url);
    } else {
      const titolo = titoloPagina(home.html);
      if (titolo && titolo.length >= 20) {
        aggiungi("descrizione_attivita", titolo, home.url);
      }
    }

    // Prodotti e servizi: le voci di menu che l'azienda usa per elencarli.
    const vociProdotti = [
      ...new Set(
        link
          .filter((l) => classifica(l, "prodotti"))
          .map((l) => l.testo)
          .filter((t) => t.length >= 3 && t.length <= 60),
      ),
    ].slice(0, 8);
    if (vociProdotti.length >= 2) {
      aggiungi("prodotti_servizi", vociProdotti.join(" · "), home.url);
    }

    // Certificazioni esposte: nomi di norma precisi, con la pagina.
    for (const pagina of pagine) {
      const norme = normeCitate(pagina.testo);
      if (norme.length > 0) {
        aggiungi("certificazioni_esposte", norme.join(", "), pagina.url);
        break; // la prima pagina che le espone è quella da citare
      }
    }

    // Sedi: indirizzi con CAP, l'unica forma su cui non si sbaglia.
    for (const pagina of pagine) {
      const indirizzi = indirizziCitati(pagina.testo);
      if (indirizzi.length > 0) {
        aggiungi("sedi_operative", indirizzi.slice(0, 4).join(" · "), pagina.url);
        break;
      }
    }

    // Mercati: solo frasi autoportanti scritte dall'azienda.
    for (const pagina of pagine) {
      const frasi = frasiSuiMercati(pagina.testo);
      if (frasi.length > 0) {
        aggiungi("mercati", frasi.join(" "), pagina.url);
        break;
      }
    }

    // Pagine sostenibilità e policy: indirizzi, non interpretazioni.
    const sostenibilita = [
      ...new Set(
        link.filter((l) => classifica(l, "sostenibilita")).map((l) => l.href),
      ),
    ].slice(0, 3);
    if (sostenibilita.length > 0) {
      aggiungi("pagine_sostenibilita", sostenibilita.join(" · "), sostenibilita[0]);
    }

    const policy = [
      ...new Set(link.filter((l) => classifica(l, "policy")).map((l) => l.href)),
    ].slice(0, 5);
    if (policy.length > 0) {
      aggiungi("policy_pubblicate", policy.join(" · "), policy[0]);
    }

    if (campi.length === 0) {
      return {
        esito: "nessun_dato",
        campi: [],
        dettaglio: `Lette ${pagine.length} pagine di ${sito.hostname}: nessuna informazione citabile con certezza.`,
      };
    }
    return {
      esito: "ok",
      campi,
      dettaglio: `Lette ${pagine.length} pagine di ${sito.hostname}${robots.stato === "assente" ? " (nessun robots.txt)" : ""}.`,
    };
  },
};
