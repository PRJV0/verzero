import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Targa di verifica del Sigillo Ver0.
 *
 * Legge e inline-a il file ufficiale public/brand/targa-verifica-ver0.svg a
 * build time (è il fondatore a iterarne il disegno: così la pagina resta
 * sempre allineata al file, senza trascrizioni che restano indietro).
 * Sostituisce i font di sistema del file con quelli della pagina (Fraunces /
 * Inter via variabili) così "Ver0" mantiene lo zero corretto invece di
 * degradare a un font serif di sistema.
 *
 * Anteprima: QR e codice sono un esempio; quelli reali sono univoci per
 * ciascuna impresa e generati dalla piattaforma. Il file è un asset fidato del
 * nostro repo, quindi l'inserimento come HTML è sicuro.
 */
function loadTarga(): string {
  const raw = readFileSync(
    join(process.cwd(), "public/brand/targa-verifica-ver0.svg"),
    "utf8",
  );
  return raw
    .replace(/<svg /, '<svg style="display:block;width:100%;height:auto" ')
    .replaceAll("'Fraunces', Georgia, serif", "var(--font-display)")
    .replaceAll("'Inter', sans-serif", "var(--font-sans)");
}

export function TargaVerifica({ className = "" }: { className?: string }) {
  return (
    <div className={className} dangerouslySetInnerHTML={{ __html: loadTarga() }} />
  );
}
