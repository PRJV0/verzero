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
  ESEMPI,
  MAX_RISULTATI,
  SOGLIA,
  candidati,
  elencoChiuso,
  normalizza,
  orienta,
  parole,
  risultatoDaId,
  situazioniRiconosciute,
} from "../src/lib/orientatore.ts";
import { BISOGNI, FAMIGLIE, getServizio } from "../src/lib/catalog.ts";
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
console.log("\n— gli esempi in home DEVONO funzionare —\n");

for (const e of ESEMPI) {
  const r = orienta(e);
  verifica(
    `«${e}» dà almeno un risultato`,
    r.risultati.length > 0,
    `via ${r.via}`,
  );
}

/* ================================================================== */
console.log("\n— i testi vengono dalle fonti, mai riscritti —\n");

const tuttiIRisultati = ESEMPI.flatMap((e) => orienta(e).risultati);

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
  ESEMPI.every((e) =>
    orienta(e).situazioni.every((s) => BISOGNI.some((b) => b.key === s)),
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
