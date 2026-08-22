import { Leaf } from "lucide-react";

import { ZERI } from "@/lib/zeri";

/**
 * IL NASTRO DELLO ZERO — banner a scorrimento continuo, da destra a
 * sinistra, in CSS puro.
 *
 * PERCHÉ HA SOSTITUITO LA NARRAZIONE ALLO SCROLL. La sezione dei Zeri era
 * legata alla posizione della pagina: una fase per scatto di scorrimento.
 * Su telefono quel legame non ha mai retto — chi scorre veloce salta le
 * fasi, chi scorre piano le vede a strappi — e ogni correzione aggiungeva
 * un'altra rete di sicurezza sopra la precedente. Qui il movimento non
 * dipende più da nulla: nessun JavaScript, nessun observer, nessuna
 * timeline. Il nastro parte quando la pagina si carica e non si ferma.
 *
 * UNA SOLA IMPLEMENTAZIONE, mobile e desktop. Tenere il palco sticky sul
 * grande e il nastro sul piccolo avrebbe voluto dire due tarature da
 * mantenere allineate a mano — ed è esattamente da lì che era nato il
 * difetto.
 *
 * IL CICLO SENZA SALTI. La pista contiene DUE gruppi identici e trasla di
 * -50%: a fine corsa il secondo gruppo si trova esattamente dove stava il
 * primo, e il ritorno a zero è invisibile. Il secondo gruppo è
 * `aria-hidden`: è una ripetizione grafica, non contenuto nuovo.
 * Ogni voce porta il proprio separatore in coda, così i due gruppi hanno
 * la stessa larghezza al pixel e il -50% resta esatto.
 *
 * RIDUCI MOVIMENTO. Il nastro non si limita a fermarsi: fermo e in
 * `overflow: hidden` metà delle voci sarebbe irraggiungibile, cioè
 * contenuto perso. Con «riduci movimento» la pista va a capo e si legge
 * come un elenco centrato — è il comportamento di base, l'animazione è
 * l'eccezione (regola di sistema in `globals.css`).
 */

/** Il segno del marchio: lo zero canonico E1, in miniatura. */
function SegnoZero({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 14 18" className={className} fill="none" aria-hidden>
      <ellipse
        cx="7"
        cy="9"
        rx="4.6"
        ry="6.8"
        stroke="currentColor"
        strokeWidth="2.2"
      />
    </svg>
  );
}

function Gruppo({
  ripetizione = false,
  scuro,
}: {
  ripetizione?: boolean;
  scuro: boolean;
}) {
  return (
    <ul
      className="vz-nastro-gruppo"
      aria-hidden={ripetizione || undefined}
      /* La copia non deve entrare due volte nell'ordine di lettura né
         nell'albero di accessibilità: aria-hidden basta, ma solo se
         nessun elemento dentro è focalizzabile — e qui non ce n'è. */
    >
      {ZERI.map((z) => (
        <li key={z.coda} className="flex items-center">
          {/* Su schermo stretto titolo e definizione vanno su due righe:
              in una sola, una voce sarebbe più larga del telefono e si
              leggerebbe sempre a metà — con il rischio che «Zero effort»
              passi da solo, senza la definizione che gli deve stare
              attaccata. Da md in su la riga singola ci sta, ed è più
              elegante. */}
          <span className="flex flex-col px-5 md:flex-row md:items-baseline md:gap-3 md:px-9">
            <span
              className={
                "font-display text-lg leading-tight md:text-4xl md:leading-none " +
                (scuro ? "text-white" : "text-ink")
              }
            >
              <em
                className={
                  "font-semibold " + (scuro ? "text-mint-bright" : "text-mint")
                }
              >
                {z.accento}
              </em>{" "}
              {z.coda}
              {z.foglia && (
                <Leaf
                  size={16}
                  aria-hidden
                  className={
                    "ml-1.5 inline align-baseline " +
                    (scuro ? "text-mint-bright" : "text-mint")
                  }
                />
              )}
            </span>
            <span
              className={
                "text-xs md:text-base " +
                (scuro ? "text-moss/70" : "text-gray-warm")
              }
            >
              {z.nota}
            </span>
          </span>
          <SegnoZero
            className={
              "h-5 w-4 shrink-0 md:h-6 md:w-5 " +
              (scuro ? "text-mint-bright/50" : "text-mint/45")
            }
          />
        </li>
      ))}
    </ul>
  );
}

export function NastroZero({ tono = "chiaro" }: { tono?: "chiaro" | "scuro" }) {
  const scuro = tono === "scuro";
  return (
    <div className="vz-nastro">
      <div className="vz-nastro-pista">
        <Gruppo scuro={scuro} />
        <Gruppo scuro={scuro} ripetizione />
      </div>
    </div>
  );
}
