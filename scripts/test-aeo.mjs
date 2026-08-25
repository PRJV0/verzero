/**
 * TEST DELLA VISIBILITÀ NELLE RISPOSTE GENERATE (AEO/GEO).
 *
 * Verifica le tre cose che, se sbagliate, non danno errore da nessuna
 * parte e si scoprono mesi dopo:
 *
 *  1. ROBOTS — che ogni agente dichiarato sia davvero nel file, che le
 *     aree private siano escluse per TUTTI e non solo per la regola
 *     generica, e che la riga della sitemap resti in fondo.
 *  2. RICONOSCIMENTO — che uno user agent e un referrer finiscano nella
 *     famiglia giusta. Qui gli errori sono silenziosi per definizione: un
 *     canale mal riconosciuto risulta semplicemente vuoto, e un canale
 *     vuoto si scambia per un canale che non porta traffico.
 *  3. RISPOSTE AUTOCONCLUSIVE — che ogni risposta regga fuori dalla sua
 *     pagina, e che nessuna si porti dietro le mappature operative che
 *     abbiamo deciso di non pubblicare.
 *  4. UNA SOLA ENTITÀ — che nome, descrizione e PAYOFF siano identici
 *     in pagina, nei dati strutturati e in llms.txt. Un payoff riscritto
 *     in tre varianti non è un payoff: sono tre frasi che si somigliano,
 *     e un modello che le legge non ne impara nessuna.
 *
 *   node --import ./scripts/risolutore-ts.mjs scripts/test-aeo.mjs
 */

import {
  AREE_ESCLUSE,
  CRAWLER_ADDESTRAMENTO,
  CRAWLER_RICERCA,
  agenteAiDa,
  canaleAiDa,
} from "../src/lib/ai-canali.ts";
import robots from "../src/app/robots.ts";
import { SERVIZI, titoloServizio } from "../src/lib/catalog.ts";
import { faqServizio } from "../src/lib/faq-servizio.ts";
import { PAGINE_PUBBLICHE } from "../src/lib/pagine-pubbliche.ts";
import { GET as llms } from "../src/app/llms.txt/route.ts";
import { SITO, jsonLdOrganization } from "../src/lib/seo.ts";

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

let passate = 0;
const fallite = [];

/** Ogni sorgente del progetto, come coppie [percorso, contenuto]. */
function leggiSorgenti(radice) {
  const out = [];
  for (const voce of readdirSync(radice)) {
    const percorso = join(radice, voce);
    if (statSync(percorso).isDirectory()) out.push(...leggiSorgenti(percorso));
    else if (/\.(ts|tsx|css)$/.test(voce))
      out.push([percorso, readFileSync(percorso, "utf8")]);
  }
  return out;
}
function prova(nome, condizione, dettaglio = "") {
  if (condizione) passate++;
  else fallite.push(`${nome}${dettaglio ? " — " + dettaglio : ""}`);
}

/* ------------------------------------------------------------------ */
/* 1. robots.txt                                                       */
/* ------------------------------------------------------------------ */

const r = robots();
const regole = Array.isArray(r.rules) ? r.rules : [r.rules];
const agentiDichiarati = regole.flatMap((g) =>
  Array.isArray(g.userAgent) ? g.userAgent : [g.userAgent],
);

for (const a of [...CRAWLER_RICERCA, ...CRAWLER_ADDESTRAMENTO]) {
  prova(`robots dichiara ${a}`, agentiDichiarati.includes(a));
}
prova("robots ha la regola generica", agentiDichiarati.includes("*"));

for (const g of regole) {
  const chi = Array.isArray(g.userAgent) ? g.userAgent[0] : g.userAgent;
  prova(`«${chi}» ha Allow: /`, g.allow === "/");
  for (const area of AREE_ESCLUSE) {
    prova(
      `«${chi}» esclude ${area}`,
      Array.isArray(g.disallow) && g.disallow.includes(area),
    );
  }
}
prova("robots dichiara la sitemap", typeof r.sitemap === "string");
prova(
  "robots non dichiara host (sposterebbe Sitemap a metà file)",
  r.host === undefined,
);

/* Nessuna area pubblica finisce per sbaglio fra le escluse. */
for (const p of PAGINE_PUBBLICHE) {
  prova(
    `la pagina ${p.path} non è esclusa da robots`,
    !AREE_ESCLUSE.some((a) => p.path === a || p.path.startsWith(a)),
  );
}

/* ------------------------------------------------------------------ */
/* 2. Riconoscimento di agenti e canali                                */
/* ------------------------------------------------------------------ */

const UA = {
  "OAI-SearchBot":
    "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; OAI-SearchBot/1.0; +https://openai.com/searchbot",
  "ChatGPT-User":
    "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; ChatGPT-User/1.0; +https://openai.com/bot",
  GPTBot: "Mozilla/5.0 AppleWebKit/537.36 (compatible; GPTBot/1.2; +https://openai.com/gptbot)",
  "Claude-SearchBot": "Mozilla/5.0 (compatible; Claude-SearchBot/1.0)",
  "Claude-User": "Mozilla/5.0 (compatible; Claude-User/1.0)",
  ClaudeBot: "Mozilla/5.0 (compatible; ClaudeBot/1.0; +claudebot@anthropic.com)",
  PerplexityBot: "Mozilla/5.0 (compatible; PerplexityBot/1.0)",
  "Perplexity-User": "Mozilla/5.0 (compatible; Perplexity-User/1.0)",
};
for (const [nome, ua] of Object.entries(UA)) {
  const trovato = agenteAiDa(ua);
  prova(`riconosce ${nome}`, trovato?.nome === nome, `letto: ${trovato?.nome}`);
}

const FAMIGLIA_ATTESA = {
  "OAI-SearchBot": "ricerca",
  GPTBot: "addestramento",
  ClaudeBot: "addestramento",
  "Claude-User": "ricerca",
};
for (const [nome, famiglia] of Object.entries(FAMIGLIA_ATTESA)) {
  prova(
    `${nome} è di famiglia ${famiglia}`,
    agenteAiDa(UA[nome])?.famiglia === famiglia,
  );
}

prova(
  "un browser vero non è un agente AI",
  agenteAiDa(
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36",
  ) === null,
);
prova("user agent assente non esplode", agenteAiDa(null) === null);

const CANALI_ATTESI = [
  ["https://chatgpt.com/c/abc", "chatgpt"],
  ["https://chat.openai.com/", "chatgpt"],
  ["https://www.perplexity.ai/search?q=x", "perplexity"],
  ["https://claude.ai/chat/123", "claude"],
  ["https://gemini.google.com/app", "gemini"],
  ["https://vertexaisearch.cloud.google.com/grounding-api-redirect/x", "gemini"],
  ["https://copilot.microsoft.com/", "copilot"],
];
for (const [ref, canale] of CANALI_ATTESI) {
  prova(`${ref} → ${canale}`, canaleAiDa(ref) === canale, `letto: ${canaleAiDa(ref)}`);
}
prova("google.com non è un canale AI", canaleAiDa("https://www.google.com/") === null);
prova(
  "un dominio che finisce come uno vero non passa",
  canaleAiDa("https://nonopenai.com/") === null,
);
prova("referrer assente non esplode", canaleAiDa(null) === null);
prova("referrer malformato non esplode", canaleAiDa("non-un-url") === null);

/* ------------------------------------------------------------------ */
/* 3. Risposte autoconclusive                                          */
/* ------------------------------------------------------------------ */

/* Frasi che tradiscono una risposta che dipende dalla pagina attorno. */
const RIMANDI = [
  "questo servizio",
  "questo percorso ",
  "come visto",
  "qui sopra",
  "come detto",
  "il prezzo indicato",
  "vedi sopra",
];
/* Formule vietate dalle regole di prodotto. */
const VIETATE = ["certificato da noi", "rilasciamo la certificazione", "un'ora del tuo tempo"];

for (const s of SERVIZI) {
  const voci = faqServizio(s);
  prova(`${s.slug}: ha domande frequenti`, voci.length >= 4, `${voci.length}`);

  for (const v of voci) {
    const testo = v.risposta.toLowerCase();
    prova(
      `${s.slug}: «${v.domanda.slice(0, 40)}…» nomina l'entità`,
      testo.includes("verzero") || testo.includes(titoloServizio(s).toLowerCase()),
    );
    prova(
      `${s.slug}: la risposta è una frase compiuta`,
      v.risposta.trim().endsWith(".") && v.risposta.length > 60,
    );
    for (const rimando of RIMANDI) {
      prova(`${s.slug}: nessun rimando «${rimando}»`, !testo.includes(rimando));
    }
    for (const vietata of VIETATE) {
      prova(`${s.slug}: nessuna formula «${vietata}»`, !testo.includes(vietata));
    }
    // La mappatura documento → percorso non deve uscire dal portale.
    for (const documento of s.documenti) {
      prova(
        `${s.slug}: la checklist resta nel portale`,
        !v.risposta.includes(documento),
        documento,
      );
    }
  }

  const domande = voci.map((v) => v.domanda);
  prova(
    `${s.slug}: nessuna domanda ripetuta`,
    new Set(domande).size === domande.length,
  );
  prova(
    `${s.slug}: le domande nominano il percorso per esteso`,
    domande.every((d) => d.includes(titoloServizio(s))),
  );
}

/* ------------------------------------------------------------------ */
/* 4. llms.txt                                                         */
/* ------------------------------------------------------------------ */

const testo = await llms().text();
prova("llms.txt si apre con il nome dell'entità", testo.startsWith("# Verzero"));
for (const p of PAGINE_PUBBLICHE) {
  prova(`llms.txt elenca ${p.path}`, testo.includes(`(${"http"}`) && testo.includes(p.titolo));
}
for (const s of SERVIZI) {
  prova(`llms.txt elenca ${s.slug}`, testo.includes(`/servizi/${s.slug}`));
}
for (const area of AREE_ESCLUSE) {
  prova(
    `llms.txt non pubblicizza ${area}`,
    !testo.includes(`(http://localhost:3000${area}`),
  );
}
for (const s of SERVIZI) {
  for (const documento of s.documenti) {
    prova(`llms.txt non contiene la checklist di ${s.slug}`, !testo.includes(documento));
  }
}

/* ------------------------------------------------------------------ */
/* 5. Il payoff: una forma sola, ovunque                               */
/* ------------------------------------------------------------------ */

const PAYOFF = "Azienda a norma in tempo Zero";

prova(
  "il payoff è quello deciso, carattere per carattere",
  SITO.payoff === PAYOFF,
  SITO.payoff,
);
prova(
  "«Zero» porta la maiuscola: è la parola del sistema, non un numero",
  SITO.payoff.includes("Zero") && !SITO.payoff.includes("zero"),
);
prova(
  "i dati strutturati lo dichiarano come slogan",
  jsonLdOrganization().slogan === SITO.payoff,
  String(jsonLdOrganization().slogan),
);
prova("llms.txt lo porta sotto il nome", testo.includes(SITO.payoff));
prova(
  "il titolo del sito è marchio più payoff",
  `${SITO.nome} — ${SITO.payoff}` === "Verzero — Azienda a norma in tempo Zero",
);
prova(
  "e sta dentro i 60 caratteri che un motore mostra",
  `${SITO.nome} — ${SITO.payoff}`.length <= 60,
  `${`${SITO.nome} — ${SITO.payoff}`.length} caratteri`,
);

/**
 * NESSUNA VARIANTE SCRITTA A MANO.
 *
 * Il modo in cui un payoff muore è che qualcuno lo riscriva «a norma in
 * tempo zero» in minuscolo, o «impresa a norma in tempo Zero», in una
 * pagina sola. Qui si cercano nel codice le forme vicine e si accetta
 * solo quella esatta o il riferimento alla fonte.
 */
const sorgenti = leggiSorgenti("src");
const VARIANTI_VIETATE = [
  "azienda a norma in tempo zero",
  "impresa a norma in tempo zero",
  "aziende a norma in tempo zero",
  "a norma in tempo 0",
];
for (const variante of VARIANTI_VIETATE) {
  const colpiti = sorgenti.filter(([, contenuto]) =>
    contenuto.toLowerCase().includes(variante),
  );
  prova(
    `nessuna variante «${variante}» scritta a mano`,
    // La forma esatta esiste in un posto solo: la costante in seo.ts.
    colpiti.every(([file]) => file.endsWith("src/lib/seo.ts")),
    colpiti.map(([f]) => f).join(", "),
  );
}

/* ------------------------------------------------------------------ */

console.log(`${passate} prove superate, ${fallite.length} fallite`);
for (const f of fallite) console.log("  ✗ " + f);
process.exit(fallite.length === 0 ? 0 : 1);
