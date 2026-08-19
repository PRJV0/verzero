/**
 * ROBOTS.TXT — il permesso di leggere, chiesto sul serio (SPEC §12.D).
 *
 * Il sito è del cliente e il mandato ce l'ha dato al checkout, ma un
 * mandato non ci autorizza a ignorare le regole che quel sito pubblica
 * per i programmi automatici: molti siti sono su piattaforme di terzi,
 * e il robots.txt è la volontà dichiarata di chi lo gestisce. Lo
 * leggiamo e lo rispettiamo alla lettera.
 *
 * Implementazione del Robots Exclusion Protocol nelle parti che ci
 * riguardano: gruppi per User-agent, Allow/Disallow con jolly `*` e
 * ancora `$`, precedenza alla regola più specifica, Crawl-delay.
 *
 * Scelte prudenti dove lo standard lascia scegliere:
 *  - robots.txt assente (404) → tutto consentito, è l'interpretazione
 *    condivisa;
 *  - robots.txt irraggiungibile o errore del server (5xx) → NON leggiamo
 *    nulla. In dubbio si sta fermi: è la differenza tra chiedere il
 *    permesso e presumerlo.
 */

/** Come ci presentiamo: un nome vero e un indirizzo dove verificarci. */
export const USER_AGENT =
  "Ver0Bot/1.0 (+https://verzero.it/bot; arricchimento su mandato del titolare)";

/** Il token con cui cerchiamo le regole a noi dedicate nel robots.txt. */
const TOKEN_AGENTE = "ver0bot";

type Regola = { percorso: string; consenti: boolean };

export type Robots = {
  /** L'esito della lettura del file. */
  stato: "letto" | "assente" | "irraggiungibile";
  regole: Regola[];
  /** Secondi di attesa fra una pagina e l'altra, se il sito li chiede. */
  crawlDelay: number | null;
};

/**
 * Sceglie il gruppo di regole che ci riguarda: quello dedicato a noi se
 * esiste, altrimenti quello generico `*`. I gruppi che parlano ad altri
 * robot non ci riguardano e vanno ignorati — applicarli sarebbe sbagliato
 * quanto ignorare i nostri.
 */
export function analizzaRobots(testo: string): Robots {
  const righe = testo.split(/\r?\n/);

  // Un gruppo è una sequenza di User-agent seguita dalle sue direttive.
  const gruppi: { agenti: string[]; regole: Regola[]; delay: number | null }[] =
    [];
  let corrente: (typeof gruppi)[number] | null = null;
  let ultimaEraAgente = false;

  for (const rigaGrezza of righe) {
    const riga = rigaGrezza.split("#")[0].trim();
    if (!riga) continue;
    const taglio = riga.indexOf(":");
    if (taglio < 0) continue;
    const campo = riga.slice(0, taglio).trim().toLowerCase();
    const valore = riga.slice(taglio + 1).trim();

    if (campo === "user-agent") {
      // Più User-agent di fila condividono lo stesso gruppo di regole.
      if (!corrente || !ultimaEraAgente) {
        corrente = { agenti: [], regole: [], delay: null };
        gruppi.push(corrente);
      }
      corrente.agenti.push(valore.toLowerCase());
      ultimaEraAgente = true;
      continue;
    }

    ultimaEraAgente = false;
    if (!corrente) continue;

    if (campo === "disallow") {
      // «Disallow:» vuoto significa: nessun divieto. Non è una regola.
      if (valore !== "") corrente.regole.push({ percorso: valore, consenti: false });
    } else if (campo === "allow") {
      if (valore !== "") corrente.regole.push({ percorso: valore, consenti: true });
    } else if (campo === "crawl-delay") {
      const n = Number.parseFloat(valore.replace(",", "."));
      if (Number.isFinite(n) && n >= 0) corrente.delay = n;
    }
  }

  const nostro =
    gruppi.find((g) => g.agenti.includes(TOKEN_AGENTE)) ??
    gruppi.find((g) => g.agenti.includes("*"));

  return {
    stato: "letto",
    regole: nostro?.regole ?? [],
    crawlDelay: nostro?.delay ?? null,
  };
}

/** Il modello di percorso di una regola, con `*` e `$`, come espressione. */
function combacia(percorso: string, modello: string): boolean {
  const ancorato = modello.endsWith("$");
  const corpo = ancorato ? modello.slice(0, -1) : modello;
  const espressione = corpo
    .split("*")
    .map((pezzo) => pezzo.replace(/[.+?^${}()|[\]\\]/g, "\\$&"))
    .join(".*");
  const regola = new RegExp(`^${espressione}${ancorato ? "$" : ""}`);
  return regola.test(percorso);
}

/**
 * Il percorso è consentito? Vince la regola col modello più lungo — cioè
 * la più specifica — e a parità vince Allow, come prescrive il protocollo.
 */
export function consentito(robots: Robots, percorso: string): boolean {
  if (robots.stato === "irraggiungibile") return false;
  if (robots.stato === "assente") return true;

  let migliore: Regola | null = null;
  for (const regola of robots.regole) {
    if (!combacia(percorso, regola.percorso)) continue;
    if (
      !migliore ||
      regola.percorso.length > migliore.percorso.length ||
      (regola.percorso.length === migliore.percorso.length && regola.consenti)
    ) {
      migliore = regola;
    }
  }
  return migliore ? migliore.consenti : true;
}

/** Scarica e analizza il robots.txt di un'origine. Non lancia mai. */
export async function leggiRobots(
  origine: string,
  scarica: (url: string) => Promise<Response>,
): Promise<Robots> {
  try {
    const risposta = await scarica(`${origine}/robots.txt`);
    // Nessun robots.txt: il sito non pone condizioni ai programmi.
    if (risposta.status === 404 || risposta.status === 410) {
      return { stato: "assente", regole: [], crawlDelay: null };
    }
    if (!risposta.ok) {
      // Il server c'è ma non risponde bene: non possiamo sapere cosa
      // vuole, quindi non leggiamo niente.
      return { stato: "irraggiungibile", regole: [], crawlDelay: null };
    }
    const testo = await risposta.text();
    return analizzaRobots(testo);
  } catch {
    return { stato: "irraggiungibile", regole: [], crawlDelay: null };
  }
}
