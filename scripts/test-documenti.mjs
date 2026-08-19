/**
 * TEST DELL'HUB DOCUMENTI (SPEC §12.E) — riconoscimento e smistamento.
 *
 * Il riconoscimento oggi guarda solo il nome del file, e questo lo rende
 * fragile in modi che si scoprono solo provandolo su nomi veri. La gran
 * parte di questi controlli riguarda proprio quello: che non riconosca
 * male, che non riconosca a caso quando è incerto, e che non smisti un
 * documento verso un percorso che il cliente non ha.
 *
 *   node --import ./scripts/risolutore-ts.mjs scripts/test-documenti.mjs
 */

import {
  MAX_BYTE,
  nomeSicuro,
  pesoLeggibile,
  riconosciDaNome,
  smistamento,
  statoIniziale,
  tipiRichiesti,
  tipoDocumento,
  validaFile,
} from "../src/lib/documenti.ts";
import { DOC_CARBON, DOC_PARITA, DOC_VSME, documentiAttivi } from "../src/lib/bozza.ts";

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

const chiave = (nome) => riconosciDaNome(nome).tipo?.chiave ?? null;

console.log("\n— riconoscimento dal nome del file —\n");

// I separatori: il difetto trovato al primo caricamento vero. `_` e `.`
// sono caratteri di parola, quindi senza normalizzazione nessun indizio
// combaciava — e i nomi file veri sono quasi tutti con underscore.
verifica(
  "underscore: bolletta_enel_gennaio_2026.pdf",
  chiave("bolletta_enel_gennaio_2026.pdf") === "bolletta-elettrica",
  String(chiave("bolletta_enel_gennaio_2026.pdf")),
);
verifica(
  "underscore: organico_aggregato_2026.pdf",
  chiave("organico_aggregato_2026.pdf") === "organico",
  String(chiave("organico_aggregato_2026.pdf")),
);
verifica(
  "punti come separatori: bolletta.gas.dicembre.pdf",
  chiave("bolletta.gas.dicembre.pdf") === "bolletta-gas",
  String(chiave("bolletta.gas.dicembre.pdf")),
);
verifica(
  "trattini: visura-camerale-2026.pdf",
  chiave("visura-camerale-2026.pdf") === "visura",
  String(chiave("visura-camerale-2026.pdf")),
);
verifica(
  "spazi: Bilancio 2025 depositato.pdf",
  chiave("Bilancio 2025 depositato.pdf") === "bilancio",
  String(chiave("Bilancio 2025 depositato.pdf")),
);
verifica("maiuscole: MUD_2025.PDF", chiave("MUD_2025.PDF") === "rifiuti");
verifica("sigle: DVR_2026.pdf", chiave("DVR_2026.pdf") === "dvr");
verifica(
  "certificati: certificato_iso9001.pdf",
  chiave("certificato_iso9001.pdf") === "certificato",
);
verifica(
  "politiche: codice_etico.pdf",
  chiave("codice_etico.pdf") === "politiche",
);
verifica(
  "carburanti: carburante_flotta_2026.xlsx",
  chiave("carburante_flotta_2026.xlsx") === "carburanti",
);

console.log("\n— quando NON deve riconoscere —\n");

verifica(
  "nome opaco → non riconosciuto",
  chiave("scansione_003.pdf") === null,
  String(chiave("scansione_003.pdf")),
);
verifica(
  "nome generico → non riconosciuto",
  chiave("documento.pdf") === null,
  String(chiave("documento.pdf")),
);
verifica("nome vuoto → non riconosciuto", chiave(".pdf") === null);
{
  // Un file ambiguo NON si assegna a caso: si chiede. Meglio una domanda
  // che una bolletta del gas dentro lo Scope 2.
  const ambiguo = riconosciDaNome("bolletta_luce_e_gas.pdf");
  verifica(
    "nome ambiguo (luce E gas) → nessuna scelta arbitraria",
    ambiguo.tipo === null,
    String(ambiguo.tipo?.chiave),
  );
  verifica(
    "e si sa che qualche indizio c'era",
    ambiguo.indiziTrovati > 0,
    String(ambiguo.indiziTrovati),
  );
}

console.log("\n— smistamento sui percorsi attivi —\n");

const attiviCarbon = documentiAttivi(["carbon-footprint-scope-1-2"]);
const attiviBundle = documentiAttivi(["percorso-ver0"]);
const attiviParita = documentiAttivi(["parita-di-genere-pdr-125"]);

{
  const bolletta = tipoDocumento("bolletta-elettrica");
  const dove = smistamento(bolletta, attiviCarbon);
  verifica(
    "la bolletta elettrica finisce nel Carbon Footprint",
    dove.some((d) => d.doc === DOC_CARBON && /Scope 2/.test(d.sezione)),
    JSON.stringify(dove),
  );
  verifica(
    "col solo Carbon attivo NON si annuncia il VSME",
    !dove.some((d) => d.doc === DOC_VSME),
    JSON.stringify(dove),
  );
  const doveBundle = smistamento(bolletta, attiviBundle);
  verifica(
    "col Percorso Ver0 la stessa bolletta alimenta due documenti",
    doveBundle.length === 2,
    JSON.stringify(doveBundle.map((d) => d.doc)),
  );
}
{
  const organico = tipoDocumento("organico");
  verifica(
    "i dati di organico alimentano la parità di genere",
    smistamento(organico, attiviParita).some((d) => d.doc === DOC_PARITA),
  );
  verifica(
    "ma NON se quel percorso non è attivo",
    smistamento(organico, attiviCarbon).length === 0,
  );
}
{
  // Un documento fuori perimetro non va sbandierato come utile.
  const dvr = tipoDocumento("dvr");
  verifica(
    "il DVR con soli percorsi carbon → non pertinente",
    statoIniziale(dvr, attiviCarbon) === "non_pertinente",
    statoIniziale(dvr, attiviCarbon),
  );
  verifica(
    "un file non riconosciuto → da classificare",
    statoIniziale(null, attiviBundle) === "da_classificare",
  );
  verifica(
    "un file riconosciuto e pertinente → smistato",
    statoIniziale(tipoDocumento("bolletta-elettrica"), attiviCarbon) ===
      "smistato",
  );
}
{
  const richiesti = tipiRichiesti(attiviCarbon);
  verifica(
    "l'elenco «cosa serve» contiene la bolletta elettrica",
    richiesti.some((r) => r.tipo.chiave === "bolletta-elettrica"),
  );
  verifica(
    "e NON contiene il DVR, che a quel percorso non serve",
    !richiesti.some((r) => r.tipo.chiave === "dvr"),
    richiesti.map((r) => r.tipo.chiave).join(","),
  );
  verifica(
    "senza percorsi attivi non si chiede nulla",
    tipiRichiesti(documentiAttivi([])).length === 0,
  );
}

console.log("\n— validazione dei file —\n");

const file = (name, size, type) => ({ name, size, type });
verifica(
  "un PDF nei limiti passa",
  validaFile(file("bolletta.pdf", 1_000_000, "application/pdf")) === null,
);
verifica(
  "una foto passa (le bollette si fotografano)",
  validaFile(file("foto.jpg", 2_000_000, "image/jpeg")) === null,
);
{
  const errore = validaFile(file("enorme.pdf", MAX_BYTE + 1, "application/pdf"));
  verifica("oltre 20 MB viene respinto", !!errore);
  verifica(
    "e l'errore dice quanto pesa e cosa fare",
    !!errore && errore.includes("MB") && errore.includes("limite"),
    errore ?? "",
  );
}
verifica(
  "un file vuoto viene respinto",
  !!validaFile(file("vuoto.pdf", 0, "application/pdf")),
);
verifica(
  "un formato non leggibile viene respinto",
  !!validaFile(file("foglio.xlsx", 1000, "application/vnd.ms-excel")),
);
verifica(
  "senza tipo dichiarato si guarda l'estensione",
  validaFile(file("bolletta.pdf", 1000, "")) === null,
);
verifica(
  "…ma un'estensione sconosciuta resta respinta",
  !!validaFile(file("archivio.zip", 1000, "")),
);

console.log("\n— nome del file in archivio —\n");

verifica(
  "gli spazi diventano trattini",
  nomeSicuro("bolletta enel 2026.pdf") === "bolletta-enel-2026.pdf",
  nomeSicuro("bolletta enel 2026.pdf"),
);
verifica(
  "gli accenti e i segni strani spariscono",
  !/[àè'/]/.test(nomeSicuro("città/società èlettrica.pdf")),
  nomeSicuro("città/società èlettrica.pdf"),
);
verifica(
  "niente barre: nessuna fuga dalla cartella dell'organizzazione",
  !nomeSicuro("../../altro/segreto.pdf").includes("/"),
  nomeSicuro("../../altro/segreto.pdf"),
);
verifica(
  "un nome lunghissimo viene accorciato",
  nomeSicuro(`${"a".repeat(400)}.pdf`).length <= 120,
);

console.log("\n— peso leggibile —\n");
verifica("byte", pesoLeggibile(512) === "512 byte", pesoLeggibile(512));
verifica("kilobyte", pesoLeggibile(2048) === "2 kB", pesoLeggibile(2048));
verifica(
  "megabyte con la virgola, all'italiana",
  pesoLeggibile(3_500_000) === "3,3 MB",
  pesoLeggibile(3_500_000),
);

console.log(
  `\nRisultato: ${superati}/${superati + falliti} test superati${falliti ? ` — ${falliti} FALLITI` : ""}\n`,
);
process.exit(falliti === 0 ? 0 : 1);
