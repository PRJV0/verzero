import {
  BISOGNI,
  FAMIGLIE,
  getServizio,
  type Bisogno,
  type VoceCatalogo,
} from "@/lib/catalog";
import { GUIDE } from "@/lib/guide";
import { FAMIGLIE_NORMA } from "@/lib/norme";
import { prezzoDa } from "@/lib/pricing";

/**
 * L'ORIENTATORE — «che cosa ti serve?».
 *
 * ═══ CHE COSA È, E SOPRATTUTTO CHE COSA NON È ═══
 * Non è un assistente e non è una chat. È un **indirizzatore vincolato**:
 * prende una frase in lingua corrente e la mappa su elementi che
 * ESISTONO GIÀ — percorsi del catalogo, guide, il controllo gratuito
 * dell'edizione, le pagine informative. Non genera risposte, non dà
 * pareri normativi, non promette tempi né esiti. Se non trova nulla di
 * pertinente lo dice e manda ai contatti: è meglio di un risultato
 * plausibile che non risponde alla domanda.
 *
 * ═══ NESSUNA LOGICA PROPRIA (vincolo di coerenza) ═══
 * Questo file non contiene un solo dato sul catalogo. Legge le fonti che
 * esistono: `catalog.ts` per i percorsi e le situazioni del selettore,
 * `pricing.ts` per il prezzo, `guide.ts` per l'indice delle guide,
 * `norme.ts` per il controllo dell'edizione. Se serve una parola chiave
 * nuova, si aggiunge ALLA fonte (`VoceCatalogo.chiavi`) — così ne
 * beneficiano anche il catalogo e il selettore, e non nasce una seconda
 * verità che diverge alla prima modifica.
 *
 * Il primo livello è deterministico: istantaneo, a costo zero, e
 * ripetibile. Il modello interviene solo come ripiego, con un elenco
 * chiuso fra cui scegliere (`src/app/api/orientatore/route.ts`).
 */

export type TipoRisultato = "percorso" | "guida" | "strumento" | "pagina";

export type Risultato = {
  tipo: TipoRisultato;
  /** La chiave stabile: serve alla misurazione e alla deduplicazione. */
  id: string;
  nome: string;
  /** Perché è pertinente: una riga, presa dalla fonte, mai inventata. */
  perche: string;
  href: string;
  /** «a partire da N €/mese», nella stessa forma del catalogo. */
  prezzo?: string;
  /** I percorsi non ancora attivi si dichiarano sempre come tali. */
  inArrivo?: boolean;
  /** Quanto forte è la corrispondenza: serve all'ordinamento e alla soglia. */
  punteggio: number;
};

/* ------------------------------------------------------------------ */
/* Normalizzazione                                                     */
/* ------------------------------------------------------------------ */

/** Le parole che non discriminano: toglierle evita corrispondenze a caso. */
const VUOTE = new Set([
  "mi", "serve", "vorrei", "voglio", "devo", "ho", "bisogno", "di", "del",
  "della", "dello", "dei", "delle", "degli", "il", "lo", "la", "i", "gli",
  "le", "un", "uno", "una", "per", "con", "che", "cosa", "come", "quando",
  "dove", "perche", "perché", "e", "ed", "o", "a", "al", "alla", "allo",
  "ai", "agli", "alle", "da", "dal", "in", "nel", "sul", "su", "non", "piu",
  "più", "mio", "mia", "miei", "nostra", "nostro", "azienda", "impresa",
  "ditta", "societa", "società", "fare", "avere", "essere", "sono", "siamo",
]);

/** Minuscole, senza accenti, senza punteggiatura. */
export function normalizza(testo: string): string {
  return testo
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function parole(testo: string): string[] {
  return normalizza(testo)
    .split(" ")
    .filter((p) => p.length > 2 && !VUOTE.has(p));
}

/* ------------------------------------------------------------------ */
/* Il punteggio                                                        */
/* ------------------------------------------------------------------ */

/**
 * Le parole di un testo, normalizzate. Tutte, anche quelle vuote: qui
 * serve la sequenza esatta, non i termini che discriminano.
 */
function sequenza(testo: string): string[] {
  return normalizza(testo).split(" ").filter(Boolean);
}

/**
 * La frase compare nel testo come SEQUENZA DI PAROLE INTERE?
 *
 * ═══ PERCHÉ NON BASTA `includes` ═══
 * «ricetta della carbonara» contiene la stringa «carbon», e con un
 * semplice `includes` proponeva il Carbon Footprint a chi cercava una
 * ricetta. Un risultato del genere non è solo inutile: è la cosa che fa
 * smettere di fidarsi di uno strumento come questo, perché mostra che
 * non ha capito e risponde lo stesso.
 */
function contieneFrase(testo: string, frase: string): boolean {
  const p = sequenza(testo);
  const f = sequenza(frase);
  if (f.length === 0 || f.length > p.length) return false;
  for (let i = 0; i + f.length <= p.length; i++) {
    if (f.every((w, j) => p[i + j] === w)) return true;
  }
  return false;
}

/**
 * Una parola compare fra queste, anche in forma diversa?
 *
 * Il confronto tollera il plurale e i suffissi solo su parole lunghe
 * («emission» ↔ «emissioni»), mai su parole corte, dove tollerare
 * significherebbe far combaciare tutto con tutto.
 */
function contieneParola(parole: string[], t: string): boolean {
  return parole.some(
    (w) =>
      w === t ||
      (t.length >= 5 && w.startsWith(t)) ||
      (w.length >= 5 && t.startsWith(w)),
  );
}

/**
 * Quanto una frase corrisponde a un candidato.
 *
 * I pesi non sono arbitrari: una parola nel NOME vale più di una nel
 * beneficio, perché chi scrive «parità di genere» sta nominando la cosa,
 * mentre chi scrive «bando» sta descrivendo la situazione. E una
 * corrispondenza di FRASE INTERA vale più di due parole sparse — «carbon
 * footprint» non è «carbon» più «footprint».
 */
function punteggia(
  query: string,
  candidato: { nome: string; chiavi?: string[]; testo?: string },
): number {
  const termini = parole(query);
  if (termini.length === 0) return 0;

  const chiavi = (candidato.chiavi ?? []).map(normalizza);
  const paroleNome = sequenza(candidato.nome);
  const paroleTesto = sequenza(candidato.testo ?? "");
  const paroleChiavi = chiavi.flatMap(sequenza);

  let punti = 0;

  // La frase intera dentro il nome: la persona sta nominando la cosa.
  if (termini.length >= 2 && contieneFrase(candidato.nome, query)) punti += 10;

  // Una chiave INTERA dentro la frase: «gender gap» dentro «mi serve il
  // gender gap per un bando». A parole intere, sempre.
  for (const c of chiavi) {
    if (sequenza(c).length >= 2 && contieneFrase(query, c)) punti += 6;
  }

  for (const t of termini) {
    // Una chiave uguale al termine è il caso più forte dopo la frase:
    // chi scrive «co2» o «45001» ha nominato la cosa con la parola con
    // cui la conosce, e sono parole troppo corte per le regole di frase.
    if (chiavi.includes(t)) punti += 4;
    else if (contieneParola(paroleNome, t)) punti += 3;
    else if (contieneParola(paroleChiavi, t)) punti += 2;
    else if (contieneParola(paroleTesto, t)) punti += 1;
  }

  return punti;
}

/** Quanto vale, in punti, riconoscere la SITUAZIONE invece della cosa. */
const PUNTI_SITUAZIONE = 2;

/**
 * Sotto questo punteggio non si propone.
 *
 * Quattro è UNA corrispondenza forte (una chiave esatta, una parola nel
 * nome più qualcos'altro), non una debole. Con la soglia a tre, «ricetta
 * della carbonara» proponeva il Carbon Footprint: una sola parola che
 * somiglia a un'altra non è una risposta, ed è meglio dire «non ho
 * trovato» che mostrare qualcosa di plausibile e sbagliato.
 */
export const SOGLIA = 4;

/* ------------------------------------------------------------------ */
/* I candidati, presi dalle fonti esistenti                            */
/* ------------------------------------------------------------------ */

type Candidato = {
  tipo: TipoRisultato;
  id: string;
  nome: string;
  perche: string;
  href: string;
  prezzo?: string;
  inArrivo?: boolean;
  chiavi: string[];
  testo: string;
  bisogni: string[];
};

/** Tutti i percorsi del catalogo, attivi e in arrivo. */
function candidatiPercorsi(): Candidato[] {
  const out: Candidato[] = [];
  for (const famiglia of FAMIGLIE) {
    for (const voce of famiglia.voci as VoceCatalogo[]) {
      const servizio = voce.slug ? getServizio(voce.slug) : undefined;
      const nome = servizio?.name ?? voce.nome ?? "";
      if (!nome) continue;

      out.push({
        tipo: "percorso",
        id: voce.slug ?? `arrivo:${nome}`,
        nome: servizio?.taglio ? `${nome} — ${servizio.taglio}` : nome,
        // Il beneficio è quello del catalogo, parola per parola: due
        // formulazioni della stessa cosa sono due promesse diverse.
        perche: voce.benefit,
        href: voce.slug ? `/servizi/${voce.slug}` : "/servizi",
        prezzo: voce.slug ? (prezzoDa(voce.slug) ?? undefined) : undefined,
        inArrivo: !voce.slug,
        chiavi: [
          ...(voce.chiavi ?? []),
          ...(servizio?.riferimenti ?? []),
          ...(servizio?.taglio ? [servizio.taglio] : []),
        ],
        testo: [voce.benefit, servizio?.short ?? "", famiglia.titolo].join(" "),
        bisogni: voce.bisogni,
      });
    }
  }
  return out;
}

function candidatiGuide(): Candidato[] {
  return GUIDE.map((g) => ({
    tipo: "guida" as const,
    id: g.slug,
    nome: g.domanda,
    // La DESCRIZIONE, non la risposta d'apertura: è il campo scritto
    // apposta per chi legge un risultato di ricerca, e sta nella misura
    // giusta. La risposta d'apertura tagliata alla prima frase si
    // spezzava su «D.Lgs.» — un punto che non finisce una frase.
    perche: g.descrizione,
    href: `/guide/${g.slug}`,
    // I percorsi collegati stanno nel TESTO e non fra le chiavi: una
    // guida collegata al percorso ISO 45001 non è una risposta a chi
    // cerca «45001», è una guida che lo cita. Metterla fra le chiavi la
    // faceva salire in cima con dieci punti di corrispondenza di frase.
    chiavi: g.chiavi ?? [],
    testo: [g.domanda, g.descrizione, g.chi, g.comporta, ...g.percorsi].join(" "),
    bisogni: [],
  }));
}

/**
 * Gli strumenti e le pagine: pochi, e con le loro parole. Il controllo
 * dell'edizione risponde a una domanda precisa — «il manuale che ho è
 * ancora buono?» — che nessun percorso del catalogo risponde.
 */
function candidatiStrumenti(): Candidato[] {
  return [
    {
      tipo: "strumento",
      id: "controllo-edizione",
      nome: "Controllo gratuito dell'edizione",
      perche:
        "Dice in due secondi se il manuale che hai in azienda cita un'edizione ritirata. Non serve registrarsi.",
      href: "/servizi/aggiornamento-sistema-gestione#controllo-edizione",
      chiavi: [
        "manuale vecchio",
        "manuale aggiornato",
        "edizione ritirata",
        "norma cambiata",
        "revisione manuale",
        ...FAMIGLIE_NORMA.map((f) => f.etichetta),
      ],
      testo: "controllo gratuito edizione manuale norma in vigore ritirata",
      bisogni: ["aggiornare"],
    },
    {
      tipo: "pagina",
      id: "come-funziona",
      nome: "Come funziona",
      perche:
        "Il metodo dall'inizio alla fine: che cosa porti tu, che cosa facciamo noi, che cosa ricevi.",
      href: "/come-funziona",
      chiavi: ["metodo", "come lavorate", "processo", "tempi", "che cosa devo fare"],
      testo: "come funziona metodo processo passi",
      bisogni: [],
    },
    {
      tipo: "pagina",
      id: "sigillo",
      nome: "Il Sigillo Ver0",
      perche:
        "La targa verificabile da mettere sul sito e nei documenti, con la pagina pubblica che chiunque può controllare.",
      href: "/sigillo",
      chiavi: ["targa", "badge", "logo", "attestato", "vetrina", "sigillo"],
      testo: "sigillo targa verificabile pagina pubblica",
      bisogni: [],
    },
    {
      tipo: "pagina",
      id: "sicurezza",
      nome: "Sicurezza e riservatezza",
      perche:
        "Dove vivono i tuoi dati, chi vi accede e con quale titolo, e che cosa puoi revocare.",
      href: "/sicurezza",
      chiavi: ["privacy", "gdpr", "dati", "riservatezza", "sicuro"],
      testo: "sicurezza riservatezza dati gdpr protezione",
      bisogni: [],
    },
  ];
}

/** Tutti i candidati. Ricalcolati a ogni richiesta: sono poche decine. */
export function candidati(): Candidato[] {
  return [...candidatiPercorsi(), ...candidatiGuide(), ...candidatiStrumenti()];
}

/* ------------------------------------------------------------------ */
/* La corrispondenza                                                   */
/* ------------------------------------------------------------------ */

/** Le situazioni riconosciute nella frase, dalle chiavi dei BISOGNI. */
export function situazioniRiconosciute(query: string): Bisogno[] {
  const q = normalizza(query);
  return BISOGNI.filter((b) =>
    (b.chiavi ?? []).some((c) => q.includes(normalizza(c))),
  ).map((b) => b.key);
}

export type EsitoOrientatore = {
  risultati: Risultato[];
  /** Le situazioni riconosciute: la stessa lingua del selettore. */
  situazioni: Bisogno[];
  /** Da dove viene la risposta: serve alla misurazione e alla fiducia. */
  via: "deterministica" | "modello" | "nessuna";
};

export const MAX_RISULTATI = 4;

/**
 * La corrispondenza deterministica. Istantanea, a costo zero, ripetibile
 * — e per questo è il primo livello: il modello costa e non è
 * riproducibile, quindi interviene solo dove questa non arriva.
 */
export function orienta(query: string): EsitoOrientatore {
  const termini = parole(query);
  if (termini.length === 0) {
    return { risultati: [], situazioni: [], via: "nessuna" };
  }

  const situazioni = situazioniRiconosciute(query);

  const punteggiati = candidati()
    .map((c) => {
      let punti = punteggia(query, c);
      // La situazione riconosciuta aiuta, ma non basta da sola: chi
      // scrive «partecipo a un bando» non ha detto di che cosa ha
      // bisogno, e proporgli tutto ciò che è premiante nei bandi
      // sarebbe un elenco, non un orientamento.
      if (punti > 0 && situazioni.some((s) => c.bisogni.includes(s))) {
        punti += PUNTI_SITUAZIONE;
      }
      return { c, punti };
    })
    .filter((x) => x.punti >= SOGLIA)
    .sort((a, b) => {
      if (b.punti !== a.punti) return b.punti - a.punti;
      // A parità, prima quello che si può attivare davvero.
      return Number(a.c.inArrivo ?? false) - Number(b.c.inArrivo ?? false);
    });

  // Se la frase dice SOLO la situazione («me lo chiede la banca»), non
  // c'è una cosa da nominare: si rimanda al selettore, che è fatto
  // apposta, invece di indovinare.
  const risultati = punteggiati.slice(0, MAX_RISULTATI).map(
    ({ c, punti }): Risultato => ({
      tipo: c.tipo,
      id: c.id,
      nome: c.nome,
      perche: c.perche,
      href: c.href,
      ...(c.prezzo ? { prezzo: c.prezzo } : {}),
      ...(c.inArrivo ? { inArrivo: true } : {}),
      punteggio: punti,
    }),
  );

  return {
    risultati,
    situazioni,
    via: risultati.length > 0 ? "deterministica" : "nessuna",
  };
}

/**
 * L'elenco chiuso fra cui il modello può scegliere, quando la
 * corrispondenza deterministica non trova nulla. È chiuso davvero: il
 * modello restituisce identificativi, non testo, e ciò che non è in
 * questo elenco non può comparire in una risposta.
 */
export function elencoChiuso(): { id: string; nome: string; descrizione: string }[] {
  return candidati().map((c) => ({
    id: c.id,
    nome: c.nome,
    descrizione: c.perche,
  }));
}

/** Da un identificativo scelto dal modello al risultato completo. */
export function risultatoDaId(id: string): Risultato | null {
  const c = candidati().find((x) => x.id === id);
  if (!c) return null;
  return {
    tipo: c.tipo,
    id: c.id,
    nome: c.nome,
    perche: c.perche,
    href: c.href,
    ...(c.prezzo ? { prezzo: c.prezzo } : {}),
    ...(c.inArrivo ? { inArrivo: true } : {}),
    punteggio: 0,
  };
}

/* ------------------------------------------------------------------ */
/* Gli esempi in home                                                  */
/* ------------------------------------------------------------------ */

/**
 * Gli esempi cliccabili sotto il campo. Sono frasi vere di clienti veri,
 * e ognuna deve dare un risultato: un esempio che non trova nulla è la
 * prima cosa che fa perdere fiducia in uno strumento come questo.
 * `scripts/test-orientatore.mjs` lo verifica.
 */
export const ESEMPI = [
  "mi serve la parità di genere per un bando",
  "la banca mi chiede il bilancio di sostenibilità",
  "ho un manuale ISO 9001 del 2019",
  "quanto emette la mia azienda",
];
