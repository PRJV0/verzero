/**
 * TEST DEGLI ADAPTER DI ARRICCHIMENTO (SPEC §12.H, tappa 2.1).
 *
 * Gli adapter si provano con risposte SIMULATE: sostituiamo `fetch` e
 * verifichiamo che ogni forma di risposta — buona, vuota, malformata,
 * lenta, rotta — produca l'esito giusto. Il punto non è che funzionino
 * quando tutto va bene: è che NON INVENTINO NULLA quando va male.
 *
 *   node scripts/test-arricchimento.mjs
 *
 * Nessuna rete richiesta (tranne l'ultima prova, facoltativa, con
 * --rete che interroga il VIES vero).
 */

import { adapterVies } from "../src/lib/arricchimento/vies.ts";
import {
  adapterAteco,
  descrizioneAteco,
} from "../src/lib/arricchimento/ateco.ts";
import {
  adapterAccredia,
  adapterAgenziaEntrate,
  adapterCamerale,
  adapterIniPec,
} from "../src/lib/arricchimento/fonti-vincolate.ts";

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

/** Sostituisce fetch per la durata di una prova. */
async function conFetch(finto, prova) {
  const originale = globalThis.fetch;
  globalThis.fetch = finto;
  try {
    return await prova();
  } finally {
    globalThis.fetch = originale;
  }
}

const rispostaJson = (corpo, ok = true, status = 200) => async () => ({
  ok,
  status,
  json: async () => corpo,
});

const contestoBase = {
  organizationId: "org-di-prova",
  ragioneSociale: "Officine Prova Srl",
  partitaIva: "09123456783",
  campiEsistenti: {},
};

console.log("\n— VIES —\n");

// 1. Risposta piena: sede legale recuperata.
await conFetch(
  rispostaJson({
    valid: true,
    name: "OFFICINE PROVA SRL",
    address: "VIA ROMA 1 \n20100 MILANO MI\n",
  }),
  async () => {
    const r = await adapterVies.esegui(contestoBase);
    verifica("risposta valida → esito ok", r.esito === "ok", r.esito);
    const sede = r.campi.find((c) => c.campo === "sede_legale");
    verifica("recupera la sede legale", !!sede, JSON.stringify(r.campi));
    verifica(
      "normalizza gli a capo dell'indirizzo",
      sede?.valore === "VIA ROMA 1 20100 MILANO MI",
      sede?.valore,
    );
    verifica("dichiara la fonte", sede?.fonte === "VIES", sede?.fonte);
    verifica(
      "NON ripropone la denominazione se coincide con quella registrata",
      !r.campi.some((c) => c.campo === "ragione_sociale"),
    );
  },
);

// 2. Denominazione diversa: va proposta per la conferma.
await conFetch(
  rispostaJson({
    valid: true,
    name: "OFFICINE PROVA SOCIETA A RESPONSABILITA LIMITATA",
    address: "VIA ROMA 1 20100 MILANO MI",
  }),
  async () => {
    const r = await adapterVies.esegui({
      ...contestoBase,
      ragioneSociale: "Metalmeccanica Diversa Spa",
    });
    verifica(
      "propone la denominazione quando è davvero diversa",
      r.campi.some((c) => c.campo === "ragione_sociale"),
    );
  },
);

// 3. Forma giuridica scritta diversamente: NON è una differenza.
await conFetch(
  rispostaJson({
    valid: true,
    name: "OFFICINE PROVA S.R.L.",
    address: "VIA ROMA 1",
  }),
  async () => {
    const r = await adapterVies.esegui(contestoBase);
    verifica(
      "«S.R.L.» e «Srl» non contano come denominazione diversa",
      !r.campi.some((c) => c.campo === "ragione_sociale"),
      JSON.stringify(r.campi.map((c) => c.campo)),
    );
  },
);

// 4. P.IVA non nel VIES: nessun dato, nessun giudizio, nessuna scrittura.
await conFetch(rispostaJson({ valid: false, userError: "INVALID" }), async () => {
  const r = await adapterVies.esegui(contestoBase);
  verifica("P.IVA non nel VIES → nessun_dato", r.esito === "nessun_dato", r.esito);
  verifica("e nessun campo scritto", r.campi.length === 0);
  verifica(
    "il motivo è spiegato senza accusare l'impresa",
    (r.dettaglio ?? "").includes("normale"),
    r.dettaglio,
  );
});

// 5. Servizio dello Stato membro giù: è un ERRORE nostro, non un dato.
await conFetch(
  rispostaJson({ valid: false, userError: "MS_UNAVAILABLE" }),
  async () => {
    const r = await adapterVies.esegui(contestoBase);
    verifica(
      "servizio non disponibile → errore, mai «non valida»",
      r.esito === "errore",
      r.esito,
    );
    verifica("e nessun campo scritto", r.campi.length === 0);
  },
);

// 6. HTTP 500.
await conFetch(rispostaJson({}, false, 500), async () => {
  const r = await adapterVies.esegui(contestoBase);
  verifica("HTTP 500 → errore", r.esito === "errore", r.esito);
  verifica("nessun campo scritto su errore", r.campi.length === 0);
});

// 7. Risposta illeggibile: non deve far cadere l'adapter.
await conFetch(
  async () => ({
    ok: true,
    status: 200,
    json: async () => {
      throw new Error("JSON malformato");
    },
  }),
  async () => {
    const r = await adapterVies.esegui(contestoBase);
    verifica("JSON malformato → errore gestito", r.esito === "errore", r.esito);
  },
);

// 8. Rete che esplode.
await conFetch(
  async () => {
    throw new Error("ECONNREFUSED");
  },
  async () => {
    const r = await adapterVies.esegui(contestoBase);
    verifica("rete irraggiungibile → errore gestito", r.esito === "errore");
    verifica("nessuna eccezione propagata", true);
  },
);

// 9. Campi «---»: VIES li usa per «non disponibile».
await conFetch(
  rispostaJson({ valid: true, name: "---", address: "---" }),
  async () => {
    const r = await adapterVies.esegui(contestoBase);
    verifica(
      "i segnaposto «---» non diventano dati",
      r.esito === "nessun_dato" && r.campi.length === 0,
      JSON.stringify(r),
    );
  },
);

console.log("\n— ATECO / ISTAT —\n");

verifica(
  "decodifica una divisione nota",
  descrizioneAteco("25.62.00")?.startsWith("Fabbricazione di prodotti in metallo"),
  descrizioneAteco("25.62.00") ?? "null",
);
verifica(
  "accetta il codice senza punti",
  descrizioneAteco("6201") === descrizioneAteco("62.01"),
);
verifica("divisione inesistente → null", descrizioneAteco("04.11") === null);
verifica("codice spazzatura → null", descrizioneAteco("boh") === null);

{
  const r = await adapterAteco.esegui({
    ...contestoBase,
    campiEsistenti: { ateco: "2562" },
  });
  verifica("estende il codice con la descrizione", r.esito === "ok", r.esito);
  verifica(
    "e lo formatta in modo leggibile",
    r.campi[0]?.valore?.startsWith("25.62 — Fabbricazione"),
    r.campi[0]?.valore,
  );
  verifica(
    "citando ISTAT come fonte",
    r.campi[0]?.fonte?.includes("ISTAT"),
    r.campi[0]?.fonte,
  );
}
{
  const r = await adapterAteco.esegui(contestoBase);
  verifica(
    "senza codice ATECO non inventa nulla",
    r.esito === "nessun_dato" && r.campi.length === 0,
  );
}
{
  const gia = "25.62 — Fabbricazione di prodotti in metallo, esclusi macchinari e attrezzature";
  const r = await adapterAteco.esegui({
    ...contestoBase,
    campiEsistenti: { ateco: gia },
  });
  verifica(
    "non riscrive un codice già esteso",
    r.esito === "nessun_dato",
    `${r.esito} ${JSON.stringify(r.campi)}`,
  );
}

console.log("\n— FONTI VINCOLATE (devono restare spente) —\n");

for (const adapter of [
  adapterAgenziaEntrate,
  adapterIniPec,
  adapterAccredia,
  adapterCamerale,
]) {
  const r = await adapter.esegui(contestoBase);
  verifica(
    `${adapter.chiave}: spenta e senza dati`,
    adapter.stato === "spenta" &&
      r.esito === "non_disponibile" &&
      r.campi.length === 0,
    `${adapter.stato}/${r.esito}`,
  );
  verifica(
    `${adapter.chiave}: dichiara il vincolo`,
    typeof adapter.vincolo === "string" && adapter.vincolo.length > 40,
  );
}

// La prova che conta di più: nessun adapter spento deve mai scrivere.
const scritturaDaSpente = (
  await Promise.all(
    [adapterAgenziaEntrate, adapterIniPec, adapterAccredia, adapterCamerale].map(
      (a) => a.esegui(contestoBase),
    ),
  )
).flatMap((r) => r.campi);
verifica(
  "nessuna fonte spenta produce campi, in nessun caso",
  scritturaDaSpente.length === 0,
);

// Prova facoltativa contro il servizio vero.
if (process.argv.includes("--rete")) {
  console.log("\n— VIES REALE (P.IVA pubblica) —\n");
  const r = await adapterVies.esegui({
    ...contestoBase,
    ragioneSociale: "Sconosciuta Spa",
    partitaIva: "00159560366",
  });
  verifica(
    "il servizio vero risponde con dati",
    r.esito === "ok" && r.campi.length > 0,
    `${r.esito} ${r.dettaglio ?? ""}`,
  );
  console.log("   →", JSON.stringify(r.campi));
}

console.log(
  `\nRisultato: ${superati}/${superati + falliti} test superati${falliti ? ` — ${falliti} FALLITI` : ""}\n`,
);
process.exit(falliti === 0 ? 0 : 1);
