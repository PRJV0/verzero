import {
  AMBITI,
  BISOGNI,
  FAMIGLIE,
  MOMENTI,
  getServizio,
  type Ambito,
  type Bisogno,
  type Momento,
  type VoceCatalogo,
} from "@/lib/catalog";
import { GUIDE } from "@/lib/guide";
import { FAMIGLIE_NORMA, NORME, type ChiaveNorma } from "@/lib/norme";
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
  /**
   * Il momento del ciclo a cui risponde. Assente su guide e pagine, che
   * non stanno in nessun punto di un ciclo.
   */
  momento?: Momento;
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

/* ------------------------------------------------------------------ */
/* I punti della CORRELAZIONE                                          */
/* ------------------------------------------------------------------ */

/**
 * Tre bonus, e tutti e tre bastano DA SOLI a superare la soglia.
 *
 * ═══ È UN CAMBIO DI REGOLA, non una taratura ═══
 * Prima la situazione valeva 2 punti e solo su chi ne aveva già altri:
 * l'idea era che «partecipo a un bando» non nomina niente, e proporre
 * tutto ciò che è premiante nei bandi sarebbe un elenco, non un
 * orientamento. L'idea era giusta a metà. La metà sbagliata è che chi
 * scriveva esattamente quella frase non riceveva un elenco: riceveva
 * «su questo non abbiamo un percorso», che è falso — i percorsi per i
 * bandi ci sono, e il selettore per situazione li mostra da sempre.
 *
 * Dire il falso è peggio che dire troppo. Ora una norma, un ambito o una
 * situazione riconosciuti APRONO i percorsi che li dichiarano, anche se
 * quei percorsi non contengono nessuna delle parole scritte. Che non
 * diventi un elenco lo garantiscono altre due cose: il tetto di quattro
 * risultati e il giro per momento, che al posto di quattro varianti
 * dello stesso servizio mostra quattro risposte a domande diverse.
 */
const PUNTI_NORMA = 5;
const PUNTI_AMBITO = 5;
const PUNTI_SITUAZIONE = 5;

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
  /** Dichiarati dalla voce di catalogo, mai dedotti qui. */
  norme: string[];
  ambiti: string[];
  momento?: Momento;
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
        norme: voce.norme ?? [],
        ambiti: voce.ambiti,
        momento: voce.momento,
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
    // Una guida non sta in un punto del ciclo e non «tocca» una norma
    // nel senso in cui la tocca un percorso: la racconta. Dichiararla
    // qui la farebbe comparire fra i correlati di ogni ricerca per
    // norma, spingendo fuori il percorso che quella norma la produce.
    norme: [],
    ambiti: [],
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
      // NIENTE `norme`, ed è una scelta. Il controllo risponde davvero
      // su tutte e cinque, ma è l'àncora dentro la pagina
      // dell'aggiornamento: dichiararle qui farebbe comparire, per ogni
      // ricerca «9001», due voci che portano allo stesso posto. Chi
      // nomina il manuale lo trova comunque — «ho un manuale ISO 9001
      // del 2019» lo mette in cima, e sono le sue parole a farlo.
      norme: [],
      ambiti: [],
      momento: "aggiornamento",
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
      norme: [],
      ambiti: [],
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
      norme: [],
      ambiti: [],
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
      norme: [],
      ambiti: [],
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

/**
 * Le norme nominate nella frase.
 *
 * A PAROLE INTERE, con le stesse regole del resto: «9001» dentro «ISO
 * 9001» sì, «9001» dentro «19001» no. Le chiavi ambigue non stanno nel
 * registro (v. `Norma.chiavi`), quindi qui non serve nessuna eccezione.
 */
export function normeRiconosciute(query: string): ChiaveNorma[] {
  return NORME.filter((n) => n.chiavi.some((c) => contieneFrase(query, c))).map(
    (n) => n.chiave,
  );
}

/**
 * Gli ambiti nominati nella frase.
 *
 * Si guardano SOLO se non è stata nominata nessuna norma: chi scrive
 * «45001» ha detto una cosa precisa, e allargare all'ambito gli
 * porterebbe la 45003 che non ha chiesto. Chi scrive «sicurezza sul
 * lavoro» non ha una norma in mente, e lì allargare è la risposta.
 */
export function ambitiRiconosciuti(query: string): Ambito[] {
  return AMBITI.filter((a) => a.chiavi.some((c) => contieneFrase(query, c))).map(
    (a) => a.key,
  );
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
 * UN RISULTATO PER MOMENTO, prima di un secondo qualunque.
 *
 * ═══ PERCHÉ NON BASTA ORDINARE PER PUNTEGGIO ═══
 * Su «9001» il punteggio, da solo, metterebbe in cima il manuale e poi
 * le sue varianti. Ma le tre risposte utili non sono tre varianti: sono
 * il manuale se parti da zero, l'aggiornamento se ce l'hai già, il
 * supporto se hai preso dei rilievi. Un tetto di quattro riempito per
 * punteggio le seppellirebbe tutte tranne la prima.
 *
 * Il giro serve a questo: finché c'è posto, ogni momento ne piazza uno
 * prima che un momento qualsiasi ne piazzi due. Il prezzo è che un
 * secondo risultato forte può cedere il posto al primo di un momento
 * più debole — accettabile, perché sotto la soglia non passa comunque
 * niente, e perché rispondere a tre domande diverse vale più che
 * rispondere due volte alla stessa.
 */
function unoPerMomento<T extends { momento?: Momento }>(
  ordinati: T[],
  massimo: number,
): T[] {
  // I gruppi in ordine di punteggio del loro migliore, non nell'ordine
  // fisso dei momenti: il primo posto resta di chi ha corrisposto meglio.
  const gruppi = new Map<string, T[]>();
  for (const x of ordinati) {
    const chiave = x.momento ?? "";
    const lista = gruppi.get(chiave);
    if (lista) lista.push(x);
    else gruppi.set(chiave, [x]);
  }

  const out: T[] = [];
  for (let giro = 0; out.length < massimo; giro++) {
    let aggiunto = false;
    for (const lista of gruppi.values()) {
      const voce = lista[giro];
      if (!voce) continue;
      out.push(voce);
      aggiunto = true;
      if (out.length >= massimo) break;
    }
    if (!aggiunto) break;
  }
  return out;
}

/**
 * LO STESSO SERVIZIO UNA VOLTA SOLA.
 *
 * Non basta che gli identificativi siano diversi: il controllo gratuito
 * dell'edizione è un'àncora dentro la pagina dell'aggiornamento, quindi
 * mostrarli entrambi è mandare due volte allo stesso posto con due nomi
 * — e a chi legge sembrano due offerte. Il confronto è sulla pagina,
 * senza l'àncora; sopravvive il punteggio migliore, che è quello che ha
 * corrisposto meglio alle parole scritte.
 */
function unaPaginaUnaVolta<T extends { c: { href: string } }>(
  ordinati: T[],
): T[] {
  const viste = new Set<string>();
  const out: T[] = [];
  for (const x of ordinati) {
    const pagina = x.c.href.split("#")[0]!;
    if (viste.has(pagina)) continue;
    viste.add(pagina);
    out.push(x);
  }
  return out;
}

/**
 * I risultati raggruppati per momento del ciclo, nell'ordine del ciclo.
 *
 * Le intestazioni compaiono solo quando DISTINGUONO: servono a dire che
 * questi tre percorsi rispondono a tre momenti diversi. Se il momento è
 * uno solo — due tagli dello stesso Carbon Footprint più una guida —
 * scrivere «se parti da zero» sopra l'unico gruppo non separa niente e
 * mette un'etichetta di ciclo su una cosa che non è un ciclo.
 *
 * Le guide e le pagine, che un momento non ce l'hanno, chiudono sempre
 * la fila e non contano per questa decisione.
 */
export type GruppoRisultati = {
  momento: Momento | null;
  etichetta: string | null;
  risultati: Risultato[];
};

export function raggruppaPerMomento(risultati: Risultato[]): GruppoRisultati[] {
  const conMomento = MOMENTI.map((m) => ({
    momento: m.key as Momento | null,
    etichetta: m.label as string | null,
    risultati: risultati.filter((r) => r.momento === m.key),
  })).filter((g) => g.risultati.length > 0);

  const senza = risultati.filter((r) => !r.momento);
  // Un momento solo: l'intestazione non distingue niente, si toglie.
  const intestati =
    conMomento.length > 1
      ? conMomento
      : conMomento.map((g) => ({ ...g, etichetta: null }));

  return [
    ...intestati,
    ...(senza.length > 0
      ? [{ momento: null, etichetta: null, risultati: senza }]
      : []),
  ];
}

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
  const norme = normeRiconosciute(query);
  // L'ambito allarga solo dove non c'è una norma: v. `ambitiRiconosciuti`.
  const ambiti = norme.length > 0 ? [] : ambitiRiconosciuti(query);

  const punteggiati = candidati()
    .map((c) => {
      let punti = punteggia(query, c);
      // I tre bonus della correlazione. Bastano da soli: è così che
      // «9001» apre anche l'aggiornamento e il supporto all'audit, che
      // di quella cifra non hanno traccia nel nome.
      if (norme.some((n) => c.norme.includes(n))) punti += PUNTI_NORMA;
      if (ambiti.some((a) => c.ambiti.includes(a))) punti += PUNTI_AMBITO;
      if (situazioni.some((s) => c.bisogni.includes(s))) punti += PUNTI_SITUAZIONE;
      return { c, punti };
    })
    .filter((x) => x.punti >= SOGLIA)
    .sort((a, b) => {
      if (b.punti !== a.punti) return b.punti - a.punti;
      // A parità, prima quello che si può attivare davvero.
      return Number(a.c.inArrivo ?? false) - Number(b.c.inArrivo ?? false);
    });

  const risultati = unoPerMomento(
    unaPaginaUnaVolta(punteggiati).map(({ c, punti }) => ({
      c,
      punti,
      momento: c.momento,
    })),
    MAX_RISULTATI,
  )
    // Il giro per momento sceglie QUALI passano; l'ordine resta quello
    // della pertinenza. Il raggruppamento in pagina li rimette poi in
    // ordine di ciclo, ma chi legge la lista piatta — il catalogo senza
    // JavaScript, il registro — vede prima la corrispondenza migliore.
    .sort((a, b) => b.punti - a.punti)
    .map(
      ({ c, punti }): Risultato => ({
        tipo: c.tipo,
        id: c.id,
        nome: c.nome,
        perche: c.perche,
        href: c.href,
        ...(c.prezzo ? { prezzo: c.prezzo } : {}),
        ...(c.inArrivo ? { inArrivo: true } : {}),
        ...(c.momento ? { momento: c.momento } : {}),
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
    ...(c.momento ? { momento: c.momento } : {}),
    punteggio: 0,
  };
}

/* ------------------------------------------------------------------ */
/* Le scelte rapide in home                                            */
/* ------------------------------------------------------------------ */

/** Vivono in un file senza import, per non pesare sulla home: v. lì. */
export { SCELTE_RAPIDE } from "@/lib/scelte-rapide";

/** L'etichetta di una situazione, con le parole del selettore.
 *  Sta qui perché il componente in home non importi il catalogo. */
export function etichettaBisogno(chiave: Bisogno | undefined): string | null {
  return BISOGNI.find((b) => b.key === chiave)?.label ?? null;
}
