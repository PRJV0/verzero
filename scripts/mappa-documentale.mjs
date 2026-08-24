/**
 * LA MAPPA DOCUMENTALE, GENERATA DAL CODICE.
 *
 * `docs/tassonomia-documentale.md` non si scrive a mano: lo scrive questo
 * script leggendo il registro (`src/lib/motore/famiglie.ts`) e lo
 * smistamento (`src/lib/documenti.ts`). È l'unico modo perché la mappa
 * dica la verità fra sei mesi: un documento scritto a mano diverge al
 * primo tipo aggiunto, e una mappa che mente è peggio di nessuna mappa.
 *
 *   node --import ./scripts/risolutore-ts.mjs scripts/mappa-documentale.mjs
 *   ... --controlla    verifica che il file su disco sia aggiornato
 */

import { readFileSync, writeFileSync } from "node:fs";

import { REGISTRO_MOTORE } from "../src/lib/motore/famiglie.ts";
import { TIPI_DOCUMENTO, tipoDocumento } from "../src/lib/documenti.ts";
import { moduliCheProducono } from "../src/lib/bozza.ts";
import { getServizio } from "../src/lib/catalog.ts";

const USCITA = "docs/tassonomia-documentale.md";

/** I percorsi del catalogo serviti da un tipo, via i documenti prodotti. */
function percorsiServiti(chiave) {
  const tipo = tipoDocumento(chiave);
  if (!tipo) return [];
  const nomi = new Set();
  for (const d of tipo.destinazioni) {
    for (const slug of moduliCheProducono(d.doc)) {
      nomi.add(getServizio(slug)?.name ?? slug);
    }
    // Le etichette che non corrispondono a un modulo del catalogo (i
    // manuali ISO, che sono già nomi di documento) valgono da sole.
    if (moduliCheProducono(d.doc).length === 0) nomi.add(d.doc);
  }
  return [...nomi];
}

const FREQ = {
  prevalente: "●●●",
  frequente: "●●○",
  raro: "●○○",
  mai: "○○○",
};

function riga(v) {
  const stato = v.schema ? `**si legge** (${v.versione})` : "dichiarato";
  const percorsi = percorsiServiti(v.tipo);
  return [
    `### ${v.nome}`,
    "",
    `| | |`,
    `|---|---|`,
    `| chiave | \`${v.tipo}\` |`,
    `| famiglia | **${v.famiglia.toUpperCase()}** |`,
    `| forma | ${v.forma === "scheda" ? "scheda (campi fissi)" : "tabella (righe ripetute)"} |`,
    `| stato | ${stato} |`,
    `| nativo · scansione · manoscritto | ${FREQ[v.attesa.nativo]} · ${FREQ[v.attesa.scansione]} · ${FREQ[v.attesa.manoscritto]} |`,
    "",
    `**Si estrae:** ${v.estrae.map((e) => `${e}`).join("; ")}.`,
    "",
    `**Attesa di qualità:** ${v.attesa.nota}`,
    "",
    percorsi.length > 0
      ? `**Percorsi serviti:** ${percorsi.join(" · ")}.`
      : "**Percorsi serviti:** nessuno con i moduli oggi a catalogo.",
    "",
  ].join("\n");
}

const leggibili = REGISTRO_MOTORE.filter((v) => v.schema);
const dichiarati = REGISTRO_MOTORE.filter((v) => !v.schema);

const senzaVoce = TIPI_DOCUMENTO.filter(
  (t) => !REGISTRO_MOTORE.some((v) => v.tipo === t.chiave),
);

const documento = `# Tassonomia documentale del Motore

**Generato da \`scripts/mappa-documentale.mjs\`: non si modifica a mano.**
La fonte è il registro in \`src/lib/motore/famiglie.ts\` e lo smistamento in
\`src/lib/documenti.ts\`. Per aggiungere un tipo si tocca il codice, e questa
pagina si rigenera — una mappa scritta a mano diverge al primo tipo nuovo,
e una mappa che mente è peggio di nessuna mappa.

Le famiglie e le forme sono spiegate in \`docs/motore.md\` §2.

- **FONTE** — se ne estraggono dati puntuali (bollette, visure, registri).
- **OPERA** — se ne estrae la struttura (manuali, procedure, verbali).
- **scheda** — campi fissi, una volta sola.
- **tabella** — N righe della stessa forma.

Le tre pallottole indicano quanto spesso quel tipo arriva **nativo**,
**scansionato** e **manoscritto**: ●●● prevalente, ●●○ frequente,
●○○ raro, ○○○ mai.

**${leggibili.length} tipi su ${REGISTRO_MOTORE.length} si sanno leggere oggi.** Gli altri sono
dichiarati: vengono archiviati, riconosciuti e smistati come sempre — i
chip «alimenta …» funzionano — ma il loro contenuto non viene ancora
letto. Dichiarato non è implementato, e il portale non lascia credere il
contrario.

---

## Si leggono oggi

${leggibili.map(riga).join("\n---\n\n")}

---

## Dichiarati, non ancora letti

${dichiarati.map(riga).join("\n---\n\n")}
${
  senzaVoce.length > 0
    ? `\n---\n\n## Tipi smistati ma fuori dal registro del Motore\n\n${senzaVoce
        .map((t) => `- ${t.nome} (\`${t.chiave}\`)`)
        .join("\n")}\n`
    : ""
}
---

## Ordine di implementazione

Il criterio è il valore commerciale, non la comodità tecnica:

1. **Bollette** — aprono il Carbon Footprint, che è il percorso più venduto.
2. **Visura, organigramma, organico, formazione** — sono il cuneo: aprono
   insieme la parità di genere (UNI/PdR 125), gli indicatori sociali del
   VSME e la parte anagrafica di ogni manuale.
3. **Gas, teleriscaldamento, carburanti** — completano lo Scope 1 e 2.
4. **Manuale di sistema e procedure** — sono la famiglia OPERA e aprono
   l'Aggiornamento del Sistema di Gestione.
5. Il resto, quando serve.
`;

if (process.argv.includes("--controlla")) {
  let attuale = "";
  try {
    attuale = readFileSync(USCITA, "utf8");
  } catch {
    /* non esiste ancora */
  }
  if (attuale.trim() !== documento.trim()) {
    console.error(
      `❌ ${USCITA} non è aggiornato. Rigeneralo:\n   node --import ./scripts/risolutore-ts.mjs scripts/mappa-documentale.mjs`,
    );
    process.exit(1);
  }
  console.log(`✅ ${USCITA} è allineato al registro.`);
  process.exit(0);
}

writeFileSync(USCITA, documento);
console.log(
  `${USCITA} rigenerato: ${leggibili.length} tipi leggibili, ${dichiarati.length} dichiarati.`,
);
