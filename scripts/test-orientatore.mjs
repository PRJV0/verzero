/**
 * TEST DELL'ORIENTATORE — e la verifica di SINERGIA.
 *
 * La parte che conta è in fondo: cinque richieste realistiche percorse
 * per tre strade diverse — l'orientatore, il selettore per situazione, il
 * catalogo sfogliato — con l'obbligo che portino allo stesso posto. Se
 * divergessero, vorrebbe dire che l'orientatore ha una fonte dati propria
 * — ed è esattamente ciò che non deve avere.
 *
 *   node --import ./scripts/risolutore-ts.mjs scripts/test-orientatore.mjs
 */

import {
  MAX_RISULTATI,
  SCELTE_RAPIDE,
  SOGLIA,
  ambitiRiconosciuti,
  candidati,
  elencoChiuso,
  normalizza,
  normeRiconosciute,
  orienta,
  parole,
  raggruppaPerMomento,
  risultatoDaId,
  situazioniRiconosciute,
} from "../src/lib/orientatore.ts";
import {
  BISOGNI,
  FAMIGLIE,
  MOMENTI,
  getServizio,
} from "../src/lib/catalog.ts";
import { FAMIGLIE_NORMA, NORME } from "../src/lib/norme.ts";
import { GUIDE } from "../src/lib/guide.ts";
import { prezzoDa } from "../src/lib/pricing.ts";

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

const ids = (q) => orienta(q).risultati.map((r) => r.id);
const primo = (q) => orienta(q).risultati[0];

/* ================================================================== */
console.log("\n— normalizzazione e termini —\n");

verifica("gli accenti spariscono", normalizza("Parità") === "parita");
verifica("la punteggiatura pure", normalizza("che cos'è?") === "che cos e");
verifica(
  "le parole vuote non entrano fra i termini",
  !parole("mi serve la parità di genere").includes("serve"),
  parole("mi serve la parità di genere").join(","),
);
verifica(
  "una frase di sole parole vuote non produce termini",
  parole("mi serve una cosa per la mia azienda").length === 0,
  parole("mi serve una cosa per la mia azienda").join(","),
);

/* ================================================================== */
console.log("\n— nessun risultato inventato —\n");

verifica(
  "«ricetta della carbonara» non propone il Carbon Footprint",
  orienta("ricetta della carbonara").risultati.length === 0,
  ids("ricetta della carbonara").join(", "),
);
verifica(
  "«orario dei treni per Milano» non propone niente",
  orienta("orario dei treni per Milano").risultati.length === 0,
  ids("orario dei treni per Milano").join(", "),
);
verifica(
  "una frase vuota non propone niente",
  orienta("   ").risultati.length === 0,
);
verifica(
  "mai più di quattro risultati: è un orientamento, non un elenco",
  candidati().every(() => true) &&
    orienta("certificazione").risultati.length <= MAX_RISULTATI,
);
verifica(
  "sotto la soglia non si propone",
  orienta("certificazione").risultati.every((r) => r.punteggio >= SOGLIA),
);

/* ================================================================== */
console.log("\n— le scelte rapide in home DEVONO funzionare —\n");

for (const { testo: e } of SCELTE_RAPIDE) {
  const r = orienta(e);
  verifica(
    `«${e}» dà almeno un risultato`,
    r.risultati.length > 0,
    `via ${r.via}`,
  );
}

/* ================================================================== */
console.log("\n— i testi vengono dalle fonti, mai riscritti —\n");

const tuttiIRisultati = SCELTE_RAPIDE.flatMap((s) => orienta(s.testo).risultati);

verifica(
  "il «perché» di ogni percorso è il beneficio del catalogo, parola per parola",
  tuttiIRisultati
    .filter((r) => r.tipo === "percorso")
    .every((r) =>
      FAMIGLIE.some((f) => f.voci.some((v) => v.benefit === r.perche)),
    ),
);
verifica(
  "il prezzo è quello della matrice prezzi, nella stessa forma",
  tuttiIRisultati
    .filter((r) => r.tipo === "percorso" && r.prezzo)
    .every((r) => r.prezzo === prezzoDa(r.id)),
);
verifica(
  "il nome di un percorso è quello del catalogo, col suo taglio",
  tuttiIRisultati
    .filter((r) => r.tipo === "percorso" && !r.inArrivo)
    .every((r) => {
      const s = getServizio(r.id);
      return s && r.nome.startsWith(s.name);
    }),
);
verifica(
  "il «perché» di una guida è la sua descrizione, scritta per un risultato di ricerca",
  orienta("perché la banca chiede dati")
    .risultati.filter((r) => r.tipo === "guida")
    .every((r) => GUIDE.find((x) => x.slug === r.id)?.descrizione === r.perche),
);
verifica(
  "e non è mai una frase tagliata a metà",
  candidati()
    .filter((c) => c.tipo === "guida")
    .every((c) => /[.!?]$/.test(c.perche.trim())),
  candidati().filter((c) => c.tipo === "guida" && !/[.!?]$/.test(c.perche.trim())).map((c) => c.perche).join(" | "),
);

/* ================================================================== */
console.log("\n— i percorsi in arrivo si dichiarano sempre —\n");

const inArrivo = candidati().filter((c) => c.inArrivo);
verifica(
  "esistono voci in arrivo nel catalogo (altrimenti il controllo non prova nulla)",
  inArrivo.length > 0,
);
verifica(
  "nessuna voce in arrivo mostra un prezzo: non c'è ancora",
  inArrivo.every((c) => !c.prezzo),
);
verifica(
  "e ogni risultato in arrivo porta il suo segno",
  candidati()
    .filter((c) => c.inArrivo)
    .every((c) => c.inArrivo === true),
);

/* ================================================================== */
console.log("\n— le situazioni parlano la lingua del selettore —\n");

verifica(
  "«me lo chiede la banca» riconosce la situazione «banca»",
  situazioniRiconosciute("me lo chiede la banca").includes("banca"),
);
verifica(
  "«partecipo a un bando» riconosce «bando»",
  situazioniRiconosciute("partecipo a un bando").includes("bando"),
);
verifica(
  "«ho già un manuale» riconosce «aggiornare»",
  situazioniRiconosciute("ho già un manuale da rivedere").includes("aggiornare"),
);
verifica(
  "ogni situazione riconosciuta è una chiave vera del selettore",
  SCELTE_RAPIDE.every((sc) =>
    orienta(sc.testo).situazioni.every((s) => BISOGNI.some((b) => b.key === s)),
  ),
);
verifica(
  "le chiavi delle situazioni vivono nel catalogo, non qui",
  BISOGNI.every((b) => Array.isArray(b.chiavi) && b.chiavi.length > 0),
);

/* ================================================================== */
console.log("\n— l'elenco chiuso per il modello —\n");

verifica(
  "l'elenco chiuso contiene tutti i candidati e nient'altro",
  elencoChiuso().length === candidati().length,
);
verifica(
  "ogni identificativo dell'elenco si risolve in un risultato vero",
  elencoChiuso().every((e) => risultatoDaId(e.id) !== null),
);
verifica(
  "un identificativo inventato NON si risolve: è la garanzia, non la buona fede",
  risultatoDaId("percorso-che-non-esiste") === null,
);
verifica(
  "l'elenco non contiene testo generato: solo nomi e benefici del sito",
  elencoChiuso().every((e) => {
    const c = candidati().find((x) => x.id === e.id);
    return c && c.nome === e.nome && c.perche === e.descrizione;
  }),
);

/* ================================================================== */
console.log("\n— i due registri delle norme non divergono —\n");

verifica(
  "ogni famiglia di cui sorvegliamo l'edizione esiste anche fra le NORME",
  FAMIGLIE_NORMA.every((f) => NORME.some((n) => n.chiave === f.id)),
  FAMIGLIE_NORMA.filter((f) => !NORME.some((n) => n.chiave === f.id))
    .map((f) => f.id)
    .join(", "),
);
verifica(
  "e con la stessa etichetta: due nomi per la stessa norma sono due norme",
  FAMIGLIE_NORMA.every(
    (f) => NORME.find((n) => n.chiave === f.id)?.etichetta === f.etichetta,
  ),
);
verifica(
  "ogni norma dichiarata da una voce di catalogo esiste nel registro",
  FAMIGLIE.flatMap((f) => f.voci).every((v) =>
    (v.norme ?? []).every((k) => NORME.some((n) => n.chiave === k)),
  ),
);
verifica(
  "ogni voce dichiara il momento del ciclo a cui risponde",
  FAMIGLIE.flatMap((f) => f.voci).every((v) =>
    MOMENTI.some((m) => m.key === v.momento),
  ),
  FAMIGLIE.flatMap((f) => f.voci)
    .filter((v) => !MOMENTI.some((m) => m.key === v.momento))
    .map((v) => v.slug ?? v.nome)
    .join(", "),
);
verifica(
  "e almeno un ambito: senza, non si collega a niente",
  FAMIGLIE.flatMap((f) => f.voci).every(
    (v) => Array.isArray(v.ambiti) && v.ambiti.length > 0,
  ),
);
verifica(
  "«125» da solo NON è una norma riconosciuta: sta anche in «ho 125 dipendenti»",
  normeRiconosciute("ho 125 dipendenti").length === 0,
  normeRiconosciute("ho 125 dipendenti").join(", "),
);
verifica(
  "«pdr 125» invece sì",
  normeRiconosciute("mi serve la pdr 125").includes("pdr-125"),
);
verifica(
  "una norma nominata spegne l'allargamento per ambito",
  ambitiRiconosciuti("sicurezza sul lavoro").includes("sicurezza") &&
    orienta("45001").risultati.every((r) => r.id !== "iso-45003"),
);

/* ================================================================== */
console.log("\n═══ RISULTATI CORRELATI PER NORMA ═══\n");
console.log("Una norma, tutti i momenti del ciclo a cui rispondiamo.\n");

/**
 * Il caso vincolante: chi scrive «9001» non cerca un documento, cerca la
 * risposta al punto in cui si trova. `attesi` deve esserci tutto;
 * `ammessi` è il perimetro oltre il quale un risultato è estraneo — ed è
 * scritto a mano apposta, perché «nessuno estraneo» si verifica solo
 * dicendo prima chi ha diritto di esserci.
 */
const PER_NORMA = [
  {
    query: "9001",
    attesi: [
      "manuale-sistema-gestione-iso-9001",
      "aggiornamento-sistema-gestione",
      "supporto-audit",
    ],
    ammessi: ["controllo-edizione"],
  },
  {
    query: "14001",
    attesi: [
      "manuale-sistema-gestione-iso-14001",
      "aggiornamento-sistema-gestione",
      "supporto-audit",
    ],
    ammessi: ["controllo-edizione"],
  },
  {
    query: "45001",
    attesi: [
      "manuale-sistema-gestione-iso-45001",
      "aggiornamento-sistema-gestione",
      "supporto-audit",
    ],
    ammessi: ["controllo-edizione"],
  },
  {
    query: "pdr 125",
    attesi: [
      "parita-di-genere-pdr-125",
      "aggiornamento-sistema-gestione",
      "supporto-audit",
    ],
    // La 30415 dichiara «spesso richiesta insieme alla PdR 125»: è nel
    // catalogo, non è un'invenzione dell'orientatore.
    ammessi: ["controllo-edizione", "iso-30415"],
  },
  {
    query: "sa8000",
    attesi: ["sa8000", "aggiornamento-sistema-gestione", "supporto-audit"],
    ammessi: [],
  },
];

for (const caso of PER_NORMA) {
  const esito = orienta(caso.query);
  const trovati = esito.risultati.map((r) => r.id);
  const gruppi = raggruppaPerMomento(esito.risultati);

  console.log(`\n« ${caso.query} »`);
  for (const g of gruppi) {
    if (g.etichetta) console.log(`   ▸ ${g.etichetta}`);
    for (const r of g.risultati) console.log(`      ${r.id}`);
  }

  for (const atteso of caso.attesi) {
    verifica(`  c'è ${atteso}`, trovati.includes(atteso), trovati.join(", "));
  }
  const perimetro = [...caso.attesi, ...caso.ammessi];
  verifica(
    "  e nessuno estraneo",
    trovati.every((id) => perimetro.includes(id)),
    trovati.filter((id) => !perimetro.includes(id)).join(", "),
  );
  verifica(
    "  i momenti sono più d'uno, e ognuno ha la sua riga",
    gruppi.filter((g) => g.momento !== null).length > 1 &&
      gruppi.every((g) => g.etichetta !== null || g.momento === null),
    `${gruppi.length} gruppi`,
  );
}

/* ================================================================== */
console.log("\n— per situazione, non per numero di norma —\n");

{
  const esito = orienta("ho un audit tra due mesi");
  const trovati = esito.risultati.map((r) => r.id);
  const gruppi = raggruppaPerMomento(esito.risultati);
  console.log(`  trovati: ${trovati.join(", ")}`);

  verifica(
    "«ho un audit tra due mesi» porta al supporto all'audit",
    trovati.includes("supporto-audit"),
    trovati.join(", "),
  );
  verifica(
    "e anche all'aggiornamento: se l'audit è fra due mesi, un manuale disallineato serve saperlo adesso",
    trovati.includes("aggiornamento-sistema-gestione"),
    trovati.join(", "),
  );
  verifica(
    "raggruppati per momento, come le ricerche per norma",
    gruppi.length === 2 && gruppi.every((g) => g.etichetta !== null),
    gruppi.map((g) => g.etichetta).join(" | "),
  );
  verifica(
    "e nessun manuale nuovo di zecca: chi ha un audit un sistema ce l'ha già",
    !trovati.some((id) => id.startsWith("manuale-sistema-gestione")),
    trovati.join(", "),
  );
}

{
  const trovati = orienta("sicurezza sul lavoro").risultati.map((r) => r.id);
  console.log(`  «sicurezza sul lavoro»: ${trovati.join(", ")}`);
  verifica(
    "un AMBITO senza norma allarga a tutto l'ambito",
    ["manuale-sistema-gestione-iso-45001", "supporto-audit"].every((id) =>
      trovati.includes(id),
    ),
    trovati.join(", "),
  );
  verifica(
    "e non sconfina: niente qualità, niente ambiente",
    !trovati.some((id) => id.includes("9001") || id.includes("14001")),
    trovati.join(", "),
  );
}

/* ================================================================== */
console.log("\n— lo stesso servizio mai due volte —\n");

const DA_PROVARE = [
  ...PER_NORMA.map((c) => c.query),
  ...SCELTE_RAPIDE.map((s) => s.testo),
  "ho un manuale ISO 9001 del 2019",
  "sicurezza sul lavoro",
];

verifica(
  "nessun identificativo ripetuto in una stessa risposta",
  DA_PROVARE.every((q) => {
    const ids = orienta(q).risultati.map((r) => r.id);
    return new Set(ids).size === ids.length;
  }),
);
verifica(
  "e nessuna PAGINA raggiunta due volte con due nomi diversi",
  DA_PROVARE.every((q) => {
    const pagine = orienta(q).risultati.map((r) => r.href.split("#")[0]);
    return new Set(pagine).size === pagine.length;
  }),
  DA_PROVARE.find((q) => {
    const pagine = orienta(q).risultati.map((r) => r.href.split("#")[0]);
    return new Set(pagine).size !== pagine.length;
  }),
);
verifica(
  "il raggruppamento non perde né duplica nessun risultato",
  DA_PROVARE.every((q) => {
    const r = orienta(q).risultati;
    const dentro = raggruppaPerMomento(r).flatMap((g) => g.risultati);
    return dentro.length === r.length;
  }),
);
verifica(
  "un momento solo non porta intestazione: non distinguerebbe niente",
  raggruppaPerMomento(orienta("Carbon footprint").risultati).every(
    (g) => g.etichetta === null,
  ),
);

/* ================================================================== */
console.log("\n═══ VERIFICA DI SINERGIA ═══\n");
console.log("Cinque richieste, tre strade: orientatore, selettore, catalogo.\n");

/**
 * Per ogni richiesta: che cosa deve trovare l'orientatore, quale
 * situazione deve riconoscere, e quale percorso deve comparire sfogliando
 * il catalogo con quel filtro. Se le tre strade divergono, la fonte dati
 * è duplicata da qualche parte.
 */
const RICHIESTE = [
  {
    frase: "mi serve la parità di genere per un bando",
    attesoSlug: "parita-di-genere-pdr-125",
    situazione: "bando",
  },
  {
    frase: "la banca mi chiede il bilancio di sostenibilità",
    attesoSlug: "bilancio-sostenibilita-vsme-base",
    situazione: "banca",
  },
  {
    frase: "ho un manuale ISO 9001 del 2019",
    attesoSlug: "manuale-sistema-gestione-iso-9001",
    situazione: null,
  },
  {
    frase: "quanto emette la mia azienda",
    attesoSlug: "carbon-footprint-scope-1-2",
    situazione: null,
  },
  {
    frase: "un committente mi chiede la ISO 14001",
    attesoSlug: "manuale-sistema-gestione-iso-14001",
    situazione: "committente",
  },
];

/** Il catalogo sfogliato con un filtro: la stessa funzione del selettore. */
function catalogoConFiltro(bisogno) {
  return FAMIGLIE.flatMap((f) =>
    f.voci
      .filter((v) => (bisogno ? v.bisogni.includes(bisogno) : true))
      .map((v) => v.slug)
      .filter(Boolean),
  );
}

for (const r of RICHIESTE) {
  const esito = orienta(r.frase);
  const trovati = esito.risultati.map((x) => x.id);

  console.log(`\n« ${r.frase} »`);
  console.log(`  orientatore : ${trovati.join(", ") || "(niente)"}`);
  console.log(`  situazione  : ${esito.situazioni.join(", ") || "(nessuna)"}`);

  verifica(
    `  il percorso atteso è fra i risultati (${r.attesoSlug})`,
    trovati.includes(r.attesoSlug),
    trovati.join(", "),
  );

  if (r.situazione) {
    verifica(
      `  riconosce la situazione «${r.situazione}»`,
      esito.situazioni.includes(r.situazione),
      esito.situazioni.join(", "),
    );
    const sfogliato = catalogoConFiltro(r.situazione);
    verifica(
      "  e il catalogo filtrato su quella situazione contiene lo stesso percorso",
      sfogliato.includes(r.attesoSlug),
      `filtro «${r.situazione}»: ${sfogliato.length} percorsi`,
    );
  } else {
    const sfogliato = catalogoConFiltro(null);
    verifica(
      "  e il percorso esiste nel catalogo sfogliato",
      sfogliato.includes(r.attesoSlug),
    );
  }

  // La coerenza che conta davvero: quello che l'orientatore mostra è la
  // stessa cosa che il catalogo mostra, non una sua parafrasi.
  const risultato = esito.risultati.find((x) => x.id === r.attesoSlug);
  if (risultato) {
    const voce = FAMIGLIE.flatMap((f) => f.voci).find(
      (v) => v.slug === r.attesoSlug,
    );
    verifica(
      "  stesso beneficio e stesso prezzo del catalogo",
      voce &&
        risultato.perche === voce.benefit &&
        risultato.prezzo === prezzoDa(r.attesoSlug),
      `${risultato.prezzo} vs ${prezzoDa(r.attesoSlug)}`,
    );
  }
}

console.log(
  `\nRisultato: ${superati}/${superati + falliti} test superati${falliti ? ` — ${falliti} FALLITI` : ""}\n`,
);
process.exit(falliti === 0 ? 0 : 1);
