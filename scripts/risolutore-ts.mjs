/**
 * Risolutore per i test: permette a Node di importare i moduli
 * dell'applicazione così come sono scritti.
 *
 * Node sa già spogliare i tipi dal TypeScript, ma pretende l'estensione
 * esplicita negli import (`./tipi.ts`), mentre nel codice dell'app
 * scriviamo `./tipi` — la forma normale con il bundler di Next. Invece di
 * piegare il codice di produzione alle esigenze del banco di prova,
 * insegniamo al banco di prova a leggere il codice di produzione.
 *
 * Uso: node --import ./scripts/risolutore-ts.mjs scripts/test-*.mjs
 */
import { existsSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, resolve as risolviPercorso } from "node:path";
import { register } from "node:module";

/** La radice del progetto, per sciogliere l'alias `@/` di tsconfig. */
const RADICE = risolviPercorso(dirname(fileURLToPath(import.meta.url)), "..");

export async function resolve(specificatore, contesto, successivo) {
  // `server-only` fa fallire di proposito chi lo importa fuori da un
  // componente di server. In uno script non c'è un pacchetto client da
  // proteggere: la guardia bloccherebbe soltanto le prove.
  if (specificatore === "server-only") {
    return {
      url: pathToFileURL(
        risolviPercorso(RADICE, "scripts/_server-only-vuoto.mjs"),
      ).href,
      shortCircuit: true,
    };
  }

  // `@/lib/...` è l'alias di tsconfig verso `src/`: qui lo sciogliamo a mano.
  const alias = specificatore.startsWith("@/");
  const relativo = specificatore.startsWith(".");
  const senzaEstensione = !/\.[cm]?[jt]sx?$/.test(specificatore);

  if ((relativo || alias) && senzaEstensione) {
    const base = alias
      ? risolviPercorso(RADICE, "src")
      : contesto.parentURL
        ? dirname(fileURLToPath(contesto.parentURL))
        : null;
    if (base) {
      const nudo = alias ? specificatore.slice(2) : specificatore;
      for (const candidato of [
        `${nudo}.ts`,
        `${nudo}.tsx`,
        `${nudo}/index.ts`,
      ]) {
        const percorso = risolviPercorso(base, candidato);
        if (existsSync(percorso)) {
          return { url: pathToFileURL(percorso).href, shortCircuit: true };
        }
      }
    }
  }
  return successivo(specificatore, contesto);
}

register(import.meta.url);
