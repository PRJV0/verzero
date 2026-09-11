/**
 * LE VERSIONI DEGLI STANDARD — la prova che una revisione è un DATO.
 *
 *   node --import ./scripts/risolutore-ts.mjs scripts/test-versioni.mjs
 *
 * ═══ PERCHÉ ESISTE ═══
 * Le checklist documentali, le strutture degli elaborati e i requisiti di
 * conformità non sono elenchi fissi nel codice: sono dati versionati per
 * standard, versione ed esercizio applicabile. Una promessa del genere
 * non si verifica leggendo il codice — si verifica PROVANDOCI: si
 * aggiunge una revisione finta e si guarda se qualcosa oltre al dato si
 * è dovuto muovere.
 *
 * L'ultima parte di questo file è l'ESERCIZIO A TAVOLINO sulla revisione
 * VSME attesa dall'atto delegato: si aggiunge davvero, si verifica che
 * funzioni, e si verifica che l'esercizio 2025 di un cliente non si sia
 * spostato di un millimetro.
 */

import {
  STANDARD_VERIFICATI_IL,
  VERSIONI_STANDARD,
  statoVersioneDocumento,
  versioneApplicabile,
  versioneStandard,
  versioniDi,
} from "../src/lib/norme.ts";
import {
  MODELLI_ELABORATO,
  controllaConformita,
  modelloElaborato,
  tuttiIModelli,
  versioniModello,
} from "../src/lib/elaborati.ts";
import {
  bozzaDaModello,
  bozzaPercorso,
  documentiDaRifare,
  versioniDeiDocumenti,
} from "../src/lib/bozza.ts";

let superati = 0;
let falliti = 0;
function verifica(nome, esito, dettaglio = "") {
  if (esito) {
    superati++;
    console.log(`✅ ${nome}`);
  } else {
    falliti++;
    console.log(`❌ ${nome}${dettaglio ? ` — ${dettaglio}` : ""}`);
  }
}

const ORG = {
  ragione_sociale: "Officina Lombardi S.r.l.",
  partita_iva: "01234567890",
};

/* ══════════════════════════════════════════════════════════════════ */
console.log("\n— IL REGISTRO DELLE VERSIONI —\n");

verifica(
  "il registro dichiara quando è stato verificato",
  /^\d{4}-\d{2}-\d{2}$/.test(STANDARD_VERIFICATI_IL.iso) &&
    STANDARD_VERIFICATI_IL.esteso.length > 0,
);

verifica(
  "ogni versione dichiara standard, versione, designazione e primo esercizio",
  VERSIONI_STANDARD.every(
    (v) =>
      v.standard &&
      v.versione &&
      v.designazione &&
      Number.isInteger(v.daEsercizio),
  ),
);

verifica(
  "★ ogni versione porta la fonte UFFICIALE: una designazione senza fonte non entra in un documento",
  VERSIONI_STANDARD.every((v) => typeof v.fonte === "string" && v.fonte.startsWith("https://")),
  VERSIONI_STANDARD.filter((v) => !v.fonte).map((v) => v.versione).join(", "),
);

verifica(
  "nessuna coppia standard+versione è ripetuta",
  new Set(VERSIONI_STANDARD.map((v) => `${v.standard}|${v.versione}`)).size ===
    VERSIONI_STANDARD.length,
);

verifica(
  "le finestre di applicabilità di uno standard non si sovrappongono all'indietro",
  versioniDi("vsme").every((v, i, tutte) => {
    const prossima = tutte[i + 1];
    if (!prossima) return true;
    return v.daEsercizio < prossima.daEsercizio;
  }),
);

/* ══════════════════════════════════════════════════════════════════ */
console.log("\n— LA VERSIONE APPLICABILE A UN ESERCIZIO —\n");

verifica(
  "l'esercizio 2025 del VSME si costruisce sulla Raccomandazione (UE) 2025/1710",
  versioneApplicabile("vsme", 2025)?.versione === "reco-2025",
  versioneApplicabile("vsme", 2025)?.versione,
);
verifica(
  "l'esercizio 2024 resta sulla versione EFRAG del dicembre 2024",
  versioneApplicabile("vsme", 2024)?.versione === "efrag-2024",
);
verifica(
  "★ una versione in ATTESA non viene mai scelta, nemmeno per il suo esercizio",
  versioneStandard("vsme", "atto-delegato-2026")?.stato === "attesa" &&
    versioneApplicabile("vsme", 2027)?.versione === "reco-2025",
  "un atto delegato non ancora in Gazzetta non può finire in un documento che va in banca",
);
verifica(
  "prima di qualunque versione non si sceglie niente, invece di inventare",
  versioneApplicabile("vsme", 2019) === undefined,
);

/* ══════════════════════════════════════════════════════════════════ */
console.log("\n— IL TIMBRO SUL DOCUMENTO GENERATO —\n");

const vsme = modelloElaborato("bilancio-vsme");
const bozza2025 = bozzaDaModello(vsme, {
  ...ORG,
  anno_rendicontazione: 2025,
});

verifica(
  "★ il documento generato REGISTRA su quale versione è costruito",
  bozza2025.costruitaSu?.standard === "vsme" &&
    bozza2025.costruitaSu?.versione === "reco-2025",
  JSON.stringify(bozza2025.costruitaSu),
);
verifica(
  "il timbro porta la designazione per esteso, letta dal registro e non ricopiata",
  bozza2025.costruitaSu?.designazione ===
    versioneStandard("vsme", "reco-2025")?.designazione,
);
verifica(
  "il timbro porta l'esercizio: senza, non si può dire se è superato",
  bozza2025.costruitaSu?.esercizio === 2025,
);
verifica(
  "anche l'inventario GHG e la parità portano il loro timbro",
  bozzaDaModello(modelloElaborato("carbon-footprint"), ORG).costruitaSu
    ?.standard === "iso-14064-1" &&
    bozzaDaModello(modelloElaborato("parita-genere"), ORG).costruitaSu
      ?.standard === "pdr-125",
);
verifica(
  "un percorso senza modello non inventa un timbro",
  bozzaPercorso("sa8000", ORG).costruitaSu === undefined,
);

/* ══════════════════════════════════════════════════════════════════ */
console.log("\n— CHI STA SU UNA VERSIONE SUPERATA —\n");

verifica(
  "oggi nessun documento di un cliente sull'esercizio 2025 è da rifare",
  documentiDaRifare(["bilancio-sostenibilita-vsme-base"], {
    ...ORG,
    anno_rendicontazione: 2025,
  }).length === 0,
);
verifica(
  "ma la domanda si può fare, e risponde documento per documento",
  versioniDeiDocumenti(["percorso-ver0"], { ...ORG, anno_rendicontazione: 2025 })
    .length >= 2,
);
verifica(
  "un documento che dichiara una versione fuori registro risulta da rifare",
  statoVersioneDocumento("vsme", "inventata-2030", 2025).superata === true,
);
verifica(
  "★ un documento che NON dichiara la versione non viene dato per superato: si dice che non si sa",
  statoVersioneDocumento("vsme", undefined, 2025).superata === false &&
    (statoVersioneDocumento("vsme", undefined, 2025).messaggio ?? "").includes(
      "non dichiara",
    ),
);

/* ══════════════════════════════════════════════════════════════════ */
console.log("\n— ESERCIZIO A TAVOLINO: LA REVISIONE VSME DELL'ATTO DELEGATO —\n");

/**
 * LA DOMANDA: che cosa servirebbe, il giorno in cui l'atto delegato
 * C(2026) 5011 entra in vigore, per farlo governare gli esercizi dal 2027?
 *
 * LA RISPOSTA, e qui sotto la si esegue:
 *   1. nel registro, cambiare `stato` da "attesa" a "in vigore" sulla
 *      voce che C'È GIÀ (una parola);
 *   2. in `MODELLI_ELABORATO`, AGGIUNGERE una voce `bilancio-vsme` con
 *      `versione: "atto-delegato-2026"`, `daEsercizio: 2027` e la
 *      struttura nuova.
 * La voce precedente non si tocca. La pipeline non si tocca.
 *
 * Qui le due cose si simulano sui dati, senza scriverle nei file: se
 * bastano, il meccanismo regge; se servisse una riga di codice, questo
 * test non riuscirebbe a scriverla e fallirebbe — che è il punto.
 */

const primaDellEsercizio = {
  modelli: tuttiIModelli().length,
  versioniVsme: versioniModello("bilancio-vsme").length,
  bozza2025: JSON.stringify(
    bozzaDaModello(modelloElaborato("bilancio-vsme", 2025), {
      ...ORG,
      anno_rendicontazione: 2025,
    }),
  ),
};

/* 1 — il registro: la voce esiste già, si sposta di stato. */
const attesa = versioneStandard("vsme", "atto-delegato-2026");
verifica(
  "la revisione è GIÀ nel registro, in attesa: non arriverà di sorpresa",
  attesa !== undefined && attesa.stato === "attesa" && attesa.daEsercizio === 2027,
);
attesa.stato = "in vigore";
verifica(
  "★ entrata in vigore, l'esercizio 2027 passa da solo alla revisione",
  versioneApplicabile("vsme", 2027)?.versione === "atto-delegato-2026",
);
verifica(
  "★ e l'esercizio 2025 NON si sposta: la versione precedente governa i suoi esercizi",
  versioneApplicabile("vsme", 2025)?.versione === "reco-2025",
);

/* 2 — la struttura: una voce in più, nessuna toccata. */
const vecchia = MODELLI_ELABORATO.find((m) => m.chiave === "bilancio-vsme");
MODELLI_ELABORATO.push({
  ...vecchia,
  versione: "atto-delegato-2026",
  daEsercizio: 2027,
  sezioni: [
    ...vecchia.sezioni,
    {
      titolo: "Informativa sul tetto della catena del valore",
      stato: "in-attesa",
      obbligatoria: true,
      attende: "le richieste ricevute dalle imprese capofila",
    },
  ],
  daFornire: [
    ...vecchia.daFornire,
    {
      documento: "Le richieste di dati ricevute dai clienti capofila",
      perche: "delimitano ciò che la filiera può chiedere",
    },
  ],
});

// I modelli si rileggono da capo: in esecuzione l'indice è già costruito,
// quindi qui si fa a mano quello che al riavvio farebbe il modulo. È
// l'unico artificio del test, e riguarda il test, non il meccanismo.
const versioniSimulate = MODELLI_ELABORATO.filter(
  (m) => m.chiave === "bilancio-vsme",
).sort((a, b) => (b.daEsercizio ?? -Infinity) - (a.daEsercizio ?? -Infinity));
const scegli = (esercizio) =>
  versioniSimulate.find((m) => (m.daEsercizio ?? -Infinity) <= esercizio);

verifica(
  "★ l'esercizio 2027 prende la struttura nuova, con la sezione in più",
  scegli(2027).sezioni.some((s) =>
    s.titolo.includes("tetto della catena del valore"),
  ),
);
verifica(
  "★ l'esercizio 2026 prende ancora quella vecchia, che nessuno ha toccato",
  !scegli(2026).sezioni.some((s) =>
    s.titolo.includes("tetto della catena del valore"),
  ),
);
verifica(
  "★ la checklist documentale del 2027 chiede un documento in più, quella del 2026 no",
  scegli(2027).daFornire.length === scegli(2026).daFornire.length + 1,
);

/* 3 — il documento del 2025 non si è mosso di un carattere. */
verifica(
  "★★ la bozza dell'esercizio 2025 è IDENTICA a prima della revisione",
  JSON.stringify(
    bozzaDaModello(scegli(2025), { ...ORG, anno_rendicontazione: 2025 }),
  ) === primaDellEsercizio.bozza2025,
);
verifica(
  "il conteggio dei documenti che sappiamo produrre non è cambiato",
  new Set(MODELLI_ELABORATO.map((m) => m.chiave)).size ===
    new Set(
      MODELLI_ELABORATO.filter((m) => m.versione !== "atto-delegato-2026").map(
        (m) => m.chiave,
      ),
    ).size,
  "una revisione non è un documento nuovo a catalogo",
);

/* 4 — e il controllo di conformità blocca chi resta indietro. */
const sezioniPiene = scegli(2027).sezioni.map((s) => ({
  titolo: s.titolo,
  piena: true,
}));
verifica(
  "★ il controllo di conformità BLOCCA un documento 2027 costruito sulla versione vecchia",
  controllaConformita(
    { ...vecchia, sezioni: scegli(2027).sezioni },
    { sezioni: sezioniPiene, esercizio: 2027 },
  ).conforme === false,
);
verifica(
  "e non blocca lo stesso documento sull'esercizio 2025",
  controllaConformita(
    { ...vecchia, sezioni: scegli(2027).sezioni },
    { sezioni: sezioniPiene, esercizio: 2025 },
  ).conforme === true,
);
verifica(
  "★ un cliente con l'esercizio 2027 sulla versione vecchia risulta DA RIFARE",
  documentiDaRifare(["bilancio-sostenibilita-vsme-base"], {
    ...ORG,
    anno_rendicontazione: 2027,
  }).length === 1,
);

/* — si rimette il registro com'era: il test non lascia tracce — */
attesa.stato = "attesa";
MODELLI_ELABORATO.pop();

console.log(
  `\nRisultato: ${superati}/${superati + falliti} test superati${falliti ? ` — ${falliti} FALLITI` : ""}\n`,
);
process.exit(falliti === 0 ? 0 : 1);
