/**
 * CONTROLLO DI INDICIZZABILITÀ — le pagine pubbliche sono davvero
 * indicizzabili, e le altre davvero no?
 *
 * Si interroga il sito COME LO VEDE UN CRAWLER: stesso user agent, e si
 * guarda quello che conta per l'indice — stato HTTP, header
 * `X-Robots-Tag`, meta robots, canonical. Il canonical si confronta con
 * l'URL richiesto: un canonical che punta altrove è un'istruzione a NON
 * indicizzare questa pagina, e non lascia tracce visibili in pagina.
 *
 * Perché non la Search Console: l'API di Controllo URL richiede le
 * credenziali OAuth del proprietario della proprietà, che non stanno qui
 * — e risponde solo per un dominio già verificato. Una fetch con lo user
 * agent del crawler misura la stessa cosa alla fonte, senza aspettare
 * che Google ripassi.
 */

/**
 * Uso:  node scripts/controllo-indicizzabilita.mjs [base]
 *   default: https://verzero.it — cioè la produzione, che è l'unico
 *   posto dove header, proxy e impostazioni di dominio sono quelli veri.
 *   In locale (http://localhost:3100) i canonical portano l'origine
 *   locale: serve a controllare la COERENZA fra sitemap e canonical,
 *   non l'origine.
 */
const BASE = process.argv[2] ?? "https://verzero.it";
const ATTESO = new URL(BASE).origin;

const AGENTI = {
  Googlebot:
    "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
  Bingbot: "Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)",
  "OAI-SearchBot": "Mozilla/5.0 (compatible; OAI-SearchBot/1.0; +https://openai.com/searchbot)",
  "Claude-SearchBot": "Mozilla/5.0 (compatible; Claude-SearchBot/1.0; +claudebot@anthropic.com)",
  PerplexityBot: "Mozilla/5.0 (compatible; PerplexityBot/1.0; +https://perplexity.ai/perplexitybot)",
  GPTBot: "Mozilla/5.0 (compatible; GPTBot/1.2; +https://openai.com/gptbot)",
  browser:
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36",
};

let problemi = 0;
const ko = (m) => {
  problemi++;
  console.log("   ⚠ " + m);
};

async function ispeziona(url, agente = "Googlebot") {
  const res = await fetch(url, {
    headers: { "user-agent": AGENTI[agente], accept: "text/html" },
    redirect: "manual",
  });
  const testa = {
    stato: res.status,
    destinazione: res.headers.get("location"),
    xRobots: res.headers.get("x-robots-tag"),
  };
  if (res.status >= 300 && res.status < 400) return { ...testa, html: "" };
  const html = await res.text();
  const meta = html.match(
    /<meta[^>]+name=["']robots["'][^>]*content=["']([^"']+)["']/i,
  )?.[1];
  const metaGoogle = html.match(
    /<meta[^>]+name=["']googlebot["'][^>]*content=["']([^"']+)["']/i,
  )?.[1];
  const canonical = html.match(
    /<link[^>]+rel=["']canonical["'][^>]*href=["']([^"']+)["']/i,
  )?.[1];
  const titolo = html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1];
  return { ...testa, meta, metaGoogle, canonical, titolo, lunghezza: html.length };
}

/* ── 1. L'elenco delle pagine pubbliche, dalla sitemap ──────────────── */
const sitemapRes = await fetch(`${BASE}/sitemap.xml`, {
  headers: { "user-agent": AGENTI.Googlebot },
});
const sitemap = await sitemapRes.text();
const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
console.log(`\n═══ ${BASE} ═══`);
console.log(`sitemap.xml: HTTP ${sitemapRes.status}, ${urls.length} URL dichiarati`);
if (sitemapRes.status !== 200) ko("la sitemap non risponde");
if (urls.length === 0) ko("sitemap vuota");

/*
 * In produzione la sitemap DEVE dichiarare la stessa origine che stiamo
 * interrogando: una sitemap che punta altrove manda i crawler su un
 * altro sito. In locale invece l'origine viene da NEXT_PUBLIC_SITE_URL e
 * non coincide con la porta di prova: lì il controllo si sposta sui
 * PERCORSI, che è quello che si può davvero verificare senza deploy.
 */
const locale = /^https?:\/\/(localhost|127\.0\.0\.1)/.test(BASE);
const fuoriOrigine = urls.filter((u) => !u.startsWith(ATTESO));
if (fuoriOrigine.length && !locale) {
  ko(`URL in sitemap su un'altra origine: ${fuoriOrigine.slice(0, 3).join(", ")}`);
} else if (fuoriOrigine.length) {
  console.log(
    `  nota: in locale la sitemap dichiara ${new URL(fuoriOrigine[0]).origin} (NEXT_PUBLIC_SITE_URL) — si confrontano i percorsi`,
  );
}

/** L'URL da interrogare, e quello che il canonical dovrebbe dichiarare. */
const daInterrogare = (u) => (locale ? BASE + new URL(u).pathname : u);
const confrontabile = (canonical, atteso) =>
  locale
    ? canonical && new URL(canonical).pathname === new URL(atteso).pathname
    : canonical === atteso;

/* ── 2. Ogni pagina pubblica, con lo user agent di Googlebot ────────── */
console.log("\n── Pagine dichiarate in sitemap (user agent: Googlebot)");
for (const u of urls) {
  const bersaglio = daInterrogare(u);
  const r = await ispeziona(bersaglio);
  const percorso = new URL(u).pathname;
  const guai = [];
  if (r.stato !== 200) guai.push(`HTTP ${r.stato}${r.destinazione ? " → " + r.destinazione : ""}`);
  if (r.xRobots && /noindex|none/i.test(r.xRobots))
    guai.push(`X-Robots-Tag: ${r.xRobots}`);
  if (r.meta && /noindex|none/i.test(r.meta)) guai.push(`meta robots: ${r.meta}`);
  if (r.metaGoogle && /noindex|none/i.test(r.metaGoogle))
    guai.push(`meta googlebot: ${r.metaGoogle}`);
  if (!r.canonical) guai.push("canonical assente");
  else if (!confrontabile(r.canonical, u))
    guai.push(`canonical ≠ URL: dichiara ${r.canonical}`);
  if (!r.titolo) guai.push("title assente");
  problemi += guai.length;
  console.log(
    `  ${guai.length ? "✗" : "✓"} ${percorso.padEnd(52)} ${r.stato} · canonical ${r.canonical === u ? "coincide" : (r.canonical ?? "—")}` +
      (guai.length ? "\n      " + guai.join("\n      ") : ""),
  );
}

/* ── 3. Le stesse pagine viste dagli altri crawler ──────────────────── */
console.log("\n── Le stesse pagine, altri crawler (campione: home, servizi, una scheda, una guida)");
/*
 * Il campione si PESCA dalla sitemap, non si scrive a mano: scritto a
 * mano conteneva `${BASE}/` con la barra finale, mentre la sitemap
 * dichiara la home senza — e il confronto col canonical falliva per
 * colpa del controllo, non del sito.
 */
const scegli = (frammento) => urls.find((u) => new URL(u).pathname.startsWith(frammento));
const campione = [
  urls.find((u) => new URL(u).pathname === "/") ?? urls[0],
  scegli("/servizi"),
  scegli("/servizi/"),
  scegli("/guide/"),
].filter(Boolean);
for (const agente of Object.keys(AGENTI)) {
  const righe = [];
  for (const u of campione) {
    const r = await ispeziona(u, agente);
    const ok =
      r.stato === 200 &&
      !/noindex|none/i.test(r.xRobots ?? "") &&
      !/noindex|none/i.test(r.meta ?? "") &&
      confrontabile(r.canonical, u);
    if (!ok) {
      problemi++;
      righe.push(
        `      ✗ ${new URL(u).pathname} → ${r.stato}${r.destinazione ? " " + r.destinazione : ""} · meta ${r.meta ?? "—"} · canonical ${r.canonical ?? "—"}`,
      );
    }
  }
  console.log(
    `  ${righe.length ? "✗" : "✓"} ${agente.padEnd(18)} ${righe.length ? "" : "tutte 200, indicizzabili, canonical coincidente"}`,
  );
  for (const r of righe) console.log(r);
}

/* ── 4. Le pagine che NON devono essere indicizzate ─────────────────── */
console.log("\n── Aree transazionali e private (devono essere fuori indice)");
for (const percorso of [
  "/login",
  "/dashboard",
  "/acquista/carbon-footprint-scope-1-2",
]) {
  const r = await ispeziona(BASE + percorso);
  const fuori =
    (r.stato >= 300 && r.stato < 400) ||
    /noindex|none/i.test(r.meta ?? "") ||
    /noindex|none/i.test(r.xRobots ?? "");
  if (!fuori) {
    problemi++;
    console.log(`  ✗ ${percorso}: ${r.stato}, meta ${r.meta ?? "—"} — è indicizzabile e non dovrebbe`);
  } else {
    console.log(
      `  ✓ ${percorso.padEnd(46)} ${r.stato}${r.destinazione ? " → " + r.destinazione : ""}${r.meta ? " · meta " + r.meta : ""}`,
    );
  }
}

/* ── 5. robots.txt: le stesse pagine sono ammesse? ──────────────────── */
const robotsRes = await fetch(`${BASE}/robots.txt`, {
  headers: { "user-agent": AGENTI.Googlebot },
});
const robots = await robotsRes.text();
console.log(`\n── robots.txt: HTTP ${robotsRes.status}`);
const vietati = ["/acquista/", "/login", "/dashboard", "/api/", "/auth/"];
const disallow = [...robots.matchAll(/^Disallow:\s*(\S+)/gim)].map((m) => m[1]);
const mancanti = vietati.filter((v) => !disallow.includes(v));
const dichiaraSitemap = /^Sitemap:\s*(\S+)/im.exec(robots)?.[1];
console.log(`  Disallow dichiarati: ${[...new Set(disallow)].join(", ")}`);
console.log(`  Sitemap dichiarata: ${dichiaraSitemap ?? "—"}`);
if (robotsRes.status !== 200) ko("robots.txt non risponde");
if (mancanti.length) ko("aree private non escluse: " + mancanti.join(", "));
if (dichiaraSitemap !== `${ATTESO}/sitemap.xml`) {
  if (locale)
    console.log("  nota: in locale l'origine viene da NEXT_PUBLIC_SITE_URL");
  else ko(`la sitemap dichiarata non è ${ATTESO}/sitemap.xml`);
}
// Nessuna pagina pubblica deve cadere sotto un Disallow.
for (const u of urls) {
  const percorso = new URL(u).pathname;
  const bloccata = [...new Set(disallow)].find(
    (d) => d !== "/" && percorso.startsWith(d),
  );
  if (bloccata) ko(`${percorso} è in sitemap ma bloccata da Disallow: ${bloccata}`);
}

/* ── 6. La variante host: www e apex non devono convivere ───────────── */
if (locale) {
  console.log("\n── Variante host: non applicabile in locale");
} else try {
  const host = new URL(BASE).host;
  const altro = host.startsWith("www.") ? host.slice(4) : `www.${host}`;
  const res = await fetch(`https://${altro}/`, {
    headers: { "user-agent": AGENTI.Googlebot },
    redirect: "manual",
  });
  console.log(`\n── Variante host: https://${altro}/ → HTTP ${res.status} ${res.headers.get("location") ?? ""}`);
  if (res.status === 200) ko(`${altro} risponde 200: due varianti indicizzabili dello stesso sito`);
  else if (res.status === 307 || res.status === 302)
    console.log("   nota: reindirizzamento TEMPORANEO — 308 sarebbe il segnale corretto di consolidamento");
} catch (e) {
  console.log(`\n── Variante host: non raggiungibile (${e.message.slice(0, 40)})`);
}

console.log(
  problemi === 0
    ? "\nOK — pagine pubbliche indicizzabili, canonical coerenti, aree private fuori indice"
    : `\nKO — ${problemi} problemi`,
);
process.exit(problemi === 0 ? 0 : 1);
