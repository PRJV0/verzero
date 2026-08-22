/**
 * I CANALI AI — chi ci legge, e chi ci manda persone.
 *
 * Serve a due cose che vanno tenute insieme, perché descrivono lo stesso
 * fenomeno da due lati:
 *
 *  1. `robots.txt` — a chi diciamo di sì. Le famiglie sono tre e vanno
 *     distinte, perché fanno mestieri diversi (v. sotto).
 *  2. La misurazione — sapere se il canale porta qualcosa. Un crawler
 *     lascia una traccia nello user agent; una persona che arriva da una
 *     risposta di ChatGPT lascia un referrer. Sono due segnali distinti e
 *     si registrano come due eventi distinti: confonderli vorrebbe dire
 *     scambiare le scansioni per visite.
 *
 * ═══ LE TRE FAMIGLIE ═══
 *
 * RICERCA E CITAZIONE — leggono una pagina per rispondere a una domanda
 * fatta ORA da una persona, e di norma citano la fonte con un link. Sono
 * il canale: bloccarli significa non esistere nelle risposte.
 *
 * ADDESTRAMENTO — leggono per costruire o aggiornare la conoscenza del
 * modello. Non portano traffico domani; portano il fatto che fra un anno
 * il modello sappia cos'è Verzero. Per un marchio nuovo quella presenza
 * vale più del controllo sul contenuto, che è comunque pubblico. È una
 * scelta di posizionamento, non una svista: sta scritta qui perché chi la
 * rivedrà sappia che era voluta.
 *
 * TUTTI GLI ALTRI — regola generica: stesso permesso, stesse esclusioni.
 *
 * Nota su Google-Extended e Applebot-Extended: non sono crawler e non
 * scansionano nulla. Sono INTERRUTTORI d'uso — dicono a Google e ad Apple
 * se il contenuto già raccolto può alimentare l'addestramento. Vanno
 * dichiarati in robots.txt lo stesso, ed è l'unico posto dove si possono
 * dichiarare.
 */

/** Le aree che restano chiuse a chiunque: transazionali e private. */
export const AREE_ESCLUSE = [
  "/acquista/",
  "/login",
  "/dashboard",
  "/api/",
  "/auth/",
];

export const CRAWLER_RICERCA = [
  // OpenAI: il primo scansiona per la ricerca, il secondo è la visita che
  // parte quando una persona chiede a ChatGPT di aprire un link.
  "OAI-SearchBot",
  "ChatGPT-User",
  // Anthropic: stessa coppia, stesso significato.
  "Claude-SearchBot",
  "Claude-User",
  // Perplexity: l'indice e la visita su richiesta.
  "PerplexityBot",
  "Perplexity-User",
  // I due motori classici, che sono anche la fonte di diverse risposte
  // generate: Bing alimenta Copilot, Google alimenta AI Overviews.
  "Bingbot",
  "Googlebot",
];

export const CRAWLER_ADDESTRAMENTO = [
  "GPTBot",
  "ClaudeBot",
  "Google-Extended",
  "Applebot-Extended",
];

/**
 * Gli agenti che vogliamo riconoscere negli accessi, con la famiglia di
 * appartenenza. Il confronto è su una porzione dello user agent, in
 * minuscolo: gli agenti veri si dichiarano per nome.
 *
 * L'ordine conta: «ChatGPT-User» contiene «chatgpt», e «GPTBot» contiene
 * «gptbot» — voci diverse, e la più specifica va cercata per prima.
 */
const AGENTI: { nome: string; ago: string; famiglia: "ricerca" | "addestramento" }[] = [
  { nome: "OAI-SearchBot", ago: "oai-searchbot", famiglia: "ricerca" },
  { nome: "ChatGPT-User", ago: "chatgpt-user", famiglia: "ricerca" },
  { nome: "GPTBot", ago: "gptbot", famiglia: "addestramento" },
  { nome: "Claude-SearchBot", ago: "claude-searchbot", famiglia: "ricerca" },
  { nome: "Claude-User", ago: "claude-user", famiglia: "ricerca" },
  { nome: "ClaudeBot", ago: "claudebot", famiglia: "addestramento" },
  { nome: "PerplexityBot", ago: "perplexitybot", famiglia: "ricerca" },
  { nome: "Perplexity-User", ago: "perplexity-user", famiglia: "ricerca" },
  { nome: "Google-Extended", ago: "google-extended", famiglia: "addestramento" },
  { nome: "Applebot-Extended", ago: "applebot-extended", famiglia: "addestramento" },
  { nome: "Applebot", ago: "applebot", famiglia: "ricerca" },
  { nome: "Bytespider", ago: "bytespider", famiglia: "addestramento" },
  { nome: "Amazonbot", ago: "amazonbot", famiglia: "addestramento" },
  { nome: "meta-externalagent", ago: "meta-externalagent", famiglia: "addestramento" },
  { nome: "CCBot", ago: "ccbot", famiglia: "addestramento" },
];

export type AgenteAi = { nome: string; famiglia: "ricerca" | "addestramento" };

/** Riconosce un agente AI dallo user agent. `null` se non è dei nostri. */
export function agenteAiDa(userAgent: string | null | undefined): AgenteAi | null {
  if (!userAgent) return null;
  const ua = userAgent.toLowerCase();
  const trovato = AGENTI.find((a) => ua.includes(a.ago));
  return trovato ? { nome: trovato.nome, famiglia: trovato.famiglia } : null;
}

/**
 * Gli assistenti che possono MANDARCI una persona. La chiave è il nome
 * del canale — quello che finirà nei conteggi — e i valori sono gli host
 * che compaiono nel referrer.
 *
 * Gemini è un caso a parte: nelle risposte i link passano da
 * `vertexaisearch.cloud.google.com`, che non somiglia affatto a Google.
 * Senza quella voce il canale risulterebbe vuoto anche se funziona.
 */
const CANALI: { canale: string; host: string[] }[] = [
  { canale: "chatgpt", host: ["chatgpt.com", "chat.openai.com", "openai.com"] },
  { canale: "perplexity", host: ["perplexity.ai"] },
  { canale: "claude", host: ["claude.ai", "claude.com"] },
  {
    canale: "gemini",
    host: [
      "gemini.google.com",
      "bard.google.com",
      "vertexaisearch.cloud.google.com",
    ],
  },
  { canale: "copilot", host: ["copilot.microsoft.com"] },
  { canale: "mistral", host: ["chat.mistral.ai"] },
  { canale: "grok", host: ["grok.com", "x.ai"] },
];

/** Il canale AI da cui arriva una visita, oppure `null`. */
export function canaleAiDa(referrer: string | null | undefined): string | null {
  if (!referrer) return null;
  let host: string;
  try {
    host = new URL(referrer).hostname.toLowerCase();
  } catch {
    return null;
  }
  // Confronto sul solo host: `endsWith` con il punto davanti evita che
  // «nonopenai.com» passi per «openai.com».
  const trovato = CANALI.find((c) =>
    c.host.some((h) => host === h || host.endsWith(`.${h}`)),
  );
  return trovato?.canale ?? null;
}
