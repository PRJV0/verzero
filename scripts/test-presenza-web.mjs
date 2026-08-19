/**
 * TEST DELL'ADAPTER «PRESENZA WEB» (SPEC §12.D).
 *
 * Come per gli altri adapter, la gran parte delle prove riguarda ciò che
 * NON deve succedere: uscire dal dominio del cliente, leggere dove il
 * robots.txt lo vieta, scrivere una frase senza il link alla pagina,
 * inventare un dato quando la pagina non lo contiene.
 *
 *   node --import ./scripts/risolutore-ts.mjs scripts/test-presenza-web.mjs
 *   … --rete   per provare anche su siti reali
 */

import {
  adapterPresenzaWeb,
  normalizzaSito,
} from "../src/lib/arricchimento/presenza-web.ts";
import {
  analizzaRobots,
  consentito,
} from "../src/lib/arricchimento/robots.ts";
import {
  classifica,
  collegamenti,
  descrizioneMeta,
  frasiSuiMercati,
  indirizziCitati,
  normeCitate,
  testoDi,
} from "../src/lib/arricchimento/html.ts";

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

async function conFetch(finto, prova) {
  const originale = globalThis.fetch;
  globalThis.fetch = finto;
  try {
    return await prova();
  } finally {
    globalThis.fetch = originale;
  }
}

/** Un sito finto: mappa url → { corpo, stato, tipo }. */
function sitoFinto(pagine) {
  const visitati = [];
  const fetch = async (url) => {
    visitati.push(String(url));
    const pagina = pagine[String(url)];
    if (!pagina) {
      return {
        ok: false,
        status: 404,
        headers: { get: () => "text/html" },
        text: async () => "",
      };
    }
    return {
      ok: pagina.stato ? pagina.stato < 400 : true,
      status: pagina.stato ?? 200,
      headers: { get: (k) => (k.toLowerCase() === "content-type" ? (pagina.tipo ?? "text/html; charset=utf-8") : null) },
      text: async () => pagina.corpo ?? "",
    };
  };
  return { fetch, visitati };
}

const contesto = (sito) => ({
  organizationId: "org-prova",
  ragioneSociale: "Officine Prova Srl",
  partitaIva: "09123456783",
  sitoWeb: sito,
  campiEsistenti: {},
});

console.log("\n— robots.txt —\n");

{
  const r = analizzaRobots(`
User-agent: *
Disallow: /riservato/
Allow: /riservato/pubblico
Crawl-delay: 2

User-agent: BadBot
Disallow: /
`);
  verifica("legge il gruppo generico", consentito(r, "/chi-siamo") === true);
  verifica("applica il divieto", consentito(r, "/riservato/pagina") === false);
  verifica(
    "la regola più specifica vince (Allow dentro Disallow)",
    consentito(r, "/riservato/pubblico/x") === true,
  );
  verifica("legge il crawl-delay", r.crawlDelay === 2, String(r.crawlDelay));
  verifica(
    "NON applica le regole scritte per altri robot",
    consentito(r, "/") === true,
  );
}
{
  const r = analizzaRobots(`
User-agent: *
Disallow: /

User-agent: Ver0Bot
Disallow: /privato/
`);
  verifica(
    "se c'è un gruppo per noi, vale quello e non il generico",
    consentito(r, "/chi-siamo") === true,
  );
  verifica("e il nostro divieto si rispetta", consentito(r, "/privato/a") === false);
}
{
  const r = analizzaRobots("User-agent: *\nDisallow: /*.pdf$\nDisallow: /tmp");
  verifica("jolly e ancora: /doc/a.pdf vietato", consentito(r, "/doc/a.pdf") === false);
  verifica("ancora `$`: /a.pdf.html consentito", consentito(r, "/a.pdf.html") === true);
  verifica("prefisso: /tmp/x vietato", consentito(r, "/tmp/x") === false);
}
{
  const r = analizzaRobots("User-agent: *\nDisallow:");
  verifica("«Disallow:» vuoto non vieta nulla", consentito(r, "/qualsiasi") === true);
}
verifica(
  "robots irraggiungibile → tutto vietato (in dubbio si sta fermi)",
  consentito({ stato: "irraggiungibile", regole: [], crawlDelay: null }, "/") === false,
);
verifica(
  "robots assente → tutto consentito",
  consentito({ stato: "assente", regole: [], crawlDelay: null }, "/") === true,
);

console.log("\n— indirizzo del sito —\n");

verifica("aggiunge https a un dominio nudo", normalizzaSito("azienda.it")?.origin === "https://azienda.it");
verifica("accetta un indirizzo completo", normalizzaSito("https://www.azienda.it/x")?.hostname === "www.azienda.it");
verifica("rifiuta localhost", normalizzaSito("localhost:3000") === null);
verifica("rifiuta un indirizzo IP", normalizzaSito("192.168.1.1") === null);
verifica("rifiuta un host senza punto", normalizzaSito("intranet") === null);
verifica("rifiuta protocolli non web", normalizzaSito("file:///etc/passwd") === null);
verifica("rifiuta la stringa vuota", normalizzaSito("   ") === null);

console.log("\n— lettura delle pagine —\n");

{
  const html = `<html><head>
    <meta name="description" content="Produciamo valvole industriali in acciaio inox dal 1968, per l'industria alimentare e farmaceutica.">
    <title>Officine Prova</title></head><body>
    <a href="/sostenibilita">Sostenibilità</a>
    <a href="/prodotti/valvole">Valvole</a>
    <a href="/prodotti/raccordi">Raccordi</a>
    <a href="/codice-etico.pdf">Codice etico</a>
    <a href="/privacy">Privacy policy</a>
    <a href="https://altrosito.it/x">Partner</a>
    <script>var a = "ISO 9001 finto dentro uno script";</script>
    </body></html>`;
  verifica(
    "prende la descrizione dai metadati",
    descrizioneMeta(html)?.startsWith("Produciamo valvole"),
    String(descrizioneMeta(html)),
  );
  const link = collegamenti(html, "https://azienda.it/");
  verifica("risolve i collegamenti in indirizzi assoluti", link.some((l) => l.href === "https://azienda.it/sostenibilita"));
  verifica("riconosce la pagina sostenibilità", link.some((l) => classifica(l, "sostenibilita")));
  verifica("riconosce le pagine prodotto", link.filter((l) => classifica(l, "prodotti")).length >= 2);
  verifica("riconosce il codice etico come policy", link.some((l) => classifica(l, "policy")));
  verifica(
    "NON considera policy la privacy o i cookie",
    !link.some((l) => /privacy/.test(l.href) && classifica(l, "policy")),
  );
  verifica(
    "gli script non finiscono nel testo",
    !testoDi(html).includes("ISO 9001 finto"),
  );
}
{
  const testo = "Siamo certificati ISO 9001 e ISO 14001, e aderiamo a SA8000. Prodotti garantiti.";
  verifica("riconosce le norme citate", normeCitate(testo).join(",") === "ISO 9001,ISO 14001,SA8000", normeCitate(testo).join(","));
  verifica(
    "non inventa norme da parole generiche",
    normeCitate("Azienda certificata e garantita, qualità totale.").length === 0,
  );
}
{
  const testo = "Sede: Via Emilia Est 1163, 41122 Modena Tel 059 000000";
  verifica("riconosce un indirizzo col CAP", indirizziCitati(testo).length === 1, JSON.stringify(indirizziCitati(testo)));
  verifica(
    "non scambia una frase qualunque per un indirizzo",
    indirizziCitati("La nostra strada è la qualità da sempre.").length === 0,
  );
  // Difetti trovati provando l'adapter su siti veri: vanno tenuti chiusi.
  verifica(
    "«PerCORSO» non diventa un «corso» (via)",
    indirizziCitati("Percorso di Aderenza UNI ISO 45003 Rischi psicosociali").length === 0,
    JSON.stringify(indirizziCitati("Percorso di Aderenza UNI ISO 45003 Rischi psicosociali")),
  );
  verifica(
    "il numero di una norma non è un CAP",
    indirizziCitati("Via della Qualità, certificata ISO 45001 Sicurezza sul lavoro").length === 0,
    JSON.stringify(indirizziCitati("Via della Qualità, certificata ISO 45001 Sicurezza sul lavoro")),
  );
  verifica(
    "ma un vero corso con CAP resta riconosciuto",
    indirizziCitati("Corso Vittorio Emanuele 12, 10121 Torino").length === 1,
    JSON.stringify(indirizziCitati("Corso Vittorio Emanuele 12, 10121 Torino")),
  );
}
{
  const conNumeri = "Esportiamo in 45 paesi nel mondo. Il nostro impegno continua.";
  verifica("coglie una frase sui mercati con i numeri", frasiSuiMercati(conNumeri).length === 1, JSON.stringify(frasiSuiMercati(conNumeri)));
  verifica(
    "scarta le frasi sui mercati senza sostanza",
    frasiSuiMercati("Siamo attenti al mercato e ai clienti.").length === 0,
  );
}

console.log("\n— l'adapter, su un sito simulato —\n");

const HOME = `<html><head>
  <meta property="og:description" content="Officine Prova produce valvole industriali in acciaio inox dal 1968 per il settore alimentare e farmaceutico.">
  </head><body>
  <a href="/sostenibilita">Sostenibilità</a>
  <a href="/chi-siamo">Chi siamo</a>
  <a href="/prodotti/valvole">Valvole</a>
  <a href="/prodotti/raccordi">Raccordi sanitari</a>
  <a href="/codice-etico">Codice etico</a>
  <a href="/contatti">Contatti</a>
  <a href="https://aggregatore-terzo.it/officine-prova">La nostra scheda su un portale</a>
  </body></html>`;

{
  const { fetch, visitati } = sitoFinto({
    "https://azienda.it/robots.txt": { corpo: "User-agent: *\nDisallow: /riservato/" },
    "https://azienda.it/": { corpo: HOME },
    "https://azienda.it/sostenibilita": {
      corpo: `<html><body><p>Siamo certificati ISO 14001 e ISO 45001. Esportiamo in 32 paesi in Europa e Nord America.</p></body></html>`,
    },
    "https://azienda.it/chi-siamo": { corpo: "<html><body><p>Storia dell'impresa dal 1968.</p></body></html>" },
    "https://azienda.it/contatti": {
      corpo: "<html><body><p>Via Emilia Est 1163, 41122 Modena Tel 059 000000</p></body></html>",
    },
  });
  await conFetch(fetch, async () => {
    const r = await adapterPresenzaWeb.esegui(contesto("azienda.it"));
    verifica("sito leggibile → esito ok", r.esito === "ok", `${r.esito} ${r.dettaglio ?? ""}`);

    const per = (c) => r.campi.find((x) => x.campo === c);
    verifica("estrae la descrizione dell'attività", per("descrizione_attivita")?.valore.includes("valvole industriali"));
    verifica("elenca prodotti e servizi", (per("prodotti_servizi")?.valore ?? "").includes("Valvole"));
    verifica("coglie le certificazioni esposte", per("certificazioni_esposte")?.valore === "ISO 14001, ISO 45001", per("certificazioni_esposte")?.valore);
    verifica("coglie la sede dall'indirizzo con CAP", (per("sedi_operative")?.valore ?? "").includes("41122 Modena"));
    verifica("coglie i mercati dichiarati", (per("mercati")?.valore ?? "").includes("32 paesi"));
    verifica("raccoglie la pagina sostenibilità", (per("pagine_sostenibilita")?.valore ?? "").includes("/sostenibilita"));
    verifica("raccoglie le policy pubblicate", (per("policy_pubblicate")?.valore ?? "").includes("/codice-etico"));

    verifica(
      "OGNI campo porta il link alla pagina — nessuna eccezione",
      r.campi.length > 0 && r.campi.every((c) => typeof c.fonteUrl === "string" && c.fonteUrl.startsWith("https://azienda.it")),
      JSON.stringify(r.campi.map((c) => [c.campo, c.fonteUrl])),
    );
    verifica("ogni campo dichiara la fonte", r.campi.every((c) => c.fonte === "Sito ufficiale"));
    verifica(
      "NON esce dal dominio del cliente (nessun aggregatore terzo)",
      !visitati.some((u) => u.includes("aggregatore-terzo.it")),
      visitati.join(" "),
    );
    verifica(
      "legge il robots.txt prima di ogni altra cosa",
      visitati[0] === "https://azienda.it/robots.txt",
      visitati[0],
    );
    verifica("resta su poche pagine", visitati.length <= 6, String(visitati.length));
  });
}

{
  // Il robots vieta tutto: non si legge NULLA, nemmeno la home.
  const { fetch, visitati } = sitoFinto({
    "https://azienda.it/robots.txt": { corpo: "User-agent: *\nDisallow: /" },
    "https://azienda.it/": { corpo: HOME },
  });
  await conFetch(fetch, async () => {
    const r = await adapterPresenzaWeb.esegui(contesto("azienda.it"));
    verifica("robots che vieta tutto → nessun dato", r.esito === "nessun_dato" && r.campi.length === 0, r.esito);
    verifica(
      "e la home non viene nemmeno scaricata",
      !visitati.includes("https://azienda.it/"),
      visitati.join(" "),
    );
  });
}

{
  // Divieto mirato: la home si legge, la pagina vietata no.
  const { fetch, visitati } = sitoFinto({
    "https://azienda.it/robots.txt": { corpo: "User-agent: *\nDisallow: /contatti" },
    "https://azienda.it/": { corpo: HOME },
    "https://azienda.it/sostenibilita": { corpo: "<html><body><p>ISO 14001</p></body></html>" },
    "https://azienda.it/chi-siamo": { corpo: "<html><body><p>Storia.</p></body></html>" },
    "https://azienda.it/contatti": { corpo: "<html><body><p>Via Emilia Est 1163, 41122 Modena Tel</p></body></html>" },
  });
  await conFetch(fetch, async () => {
    const r = await adapterPresenzaWeb.esegui(contesto("azienda.it"));
    verifica("il divieto mirato è rispettato", !visitati.includes("https://azienda.it/contatti"), visitati.join(" "));
    verifica(
      "e infatti la sede NON viene estratta da lì",
      !r.campi.some((c) => c.campo === "sedi_operative"),
      JSON.stringify(r.campi.map((c) => c.campo)),
    );
  });
}

{
  // robots.txt in errore server: non si legge niente.
  const { fetch, visitati } = sitoFinto({
    "https://azienda.it/robots.txt": { corpo: "", stato: 500 },
    "https://azienda.it/": { corpo: HOME },
  });
  await conFetch(fetch, async () => {
    const r = await adapterPresenzaWeb.esegui(contesto("azienda.it"));
    verifica("robots in errore → ci fermiamo", r.esito === "errore" && r.campi.length === 0, r.esito);
    verifica("nessuna pagina scaricata", visitati.length === 1, visitati.join(" "));
  });
}

{
  // Nessun robots.txt: si può leggere.
  const { fetch } = sitoFinto({
    "https://azienda.it/": { corpo: HOME },
  });
  await conFetch(fetch, async () => {
    const r = await adapterPresenzaWeb.esegui(contesto("azienda.it"));
    verifica("robots assente (404) → si legge", r.esito === "ok", `${r.esito} ${r.dettaglio ?? ""}`);
    verifica("e lo si dichiara nel dettaglio", (r.dettaglio ?? "").includes("nessun robots.txt"), r.dettaglio);
  });
}

{
  // Pagina che non è HTML: si scarta senza estrarre.
  const { fetch } = sitoFinto({
    "https://azienda.it/robots.txt": { corpo: "" },
    "https://azienda.it/": { corpo: "%PDF-1.4 …", tipo: "application/pdf" },
  });
  await conFetch(fetch, async () => {
    const r = await adapterPresenzaWeb.esegui(contesto("azienda.it"));
    verifica("una risposta non-HTML non produce dati", r.campi.length === 0, JSON.stringify(r.campi));
  });
}

{
  // Sito che non risponde per niente.
  await conFetch(
    async () => {
      throw new Error("ENOTFOUND");
    },
    async () => {
      const r = await adapterPresenzaWeb.esegui(contesto("azienda.it"));
      verifica("sito irraggiungibile → errore gestito, nessun dato", r.esito === "errore" && r.campi.length === 0, r.esito);
    },
  );
}

{
  const r = await adapterPresenzaWeb.esegui(contesto(null));
  verifica("senza sito dichiarato non inventa nulla", r.esito === "nessun_dato" && r.campi.length === 0);
  const r2 = await adapterPresenzaWeb.esegui(contesto("non un indirizzo!!"));
  verifica("indirizzo non valido → errore, nessun dato", r2.esito === "errore" && r2.campi.length === 0);
}

{
  // Pagina vuota di contenuti citabili: meglio niente che una deduzione.
  const { fetch } = sitoFinto({
    "https://azienda.it/robots.txt": { corpo: "" },
    "https://azienda.it/": { corpo: "<html><head><title>Home</title></head><body><p>Benvenuti.</p></body></html>" },
  });
  await conFetch(fetch, async () => {
    const r = await adapterPresenzaWeb.esegui(contesto("azienda.it"));
    verifica(
      "pagina senza sostanza → nessun dato inventato",
      r.esito === "nessun_dato" && r.campi.length === 0,
      JSON.stringify(r.campi),
    );
  });
}

if (process.argv.includes("--rete")) {
  console.log("\n— siti reali —\n");
  for (const sito of ["verzero.it", "www.marchesini.com"]) {
    const r = await adapterPresenzaWeb.esegui(contesto(sito));
    verifica(
      `${sito}: risposta coerente`,
      ["ok", "nessun_dato"].includes(r.esito),
      `${r.esito} — ${r.dettaglio ?? ""}`,
    );
    verifica(
      `${sito}: nessun campo senza link alla pagina`,
      r.campi.every((c) => typeof c.fonteUrl === "string" && c.fonteUrl.length > 0),
    );
    console.log(`   ${r.dettaglio ?? ""}`);
    for (const c of r.campi) {
      console.log(`   · ${c.campo}: ${c.valore.slice(0, 96)}${c.valore.length > 96 ? "…" : ""}`);
      console.log(`     ↳ ${c.fonteUrl}`);
    }
  }
}

console.log(
  `\nRisultato: ${superati}/${superati + falliti} test superati${falliti ? ` — ${falliti} FALLITI` : ""}\n`,
);
process.exit(falliti === 0 ? 0 : 1);
