import {
  Scrolly,
  ScrollyProgress,
  ScrollyStage,
  ScrollyStep,
  ScrollySteps,
} from "./scrolly";

/**
 * Sezione narrativa del Sigillo (/sigillo): scorrendo, l'anello punteggiato
 * si riempie di un segmento per percorso verificato, con la spiegazione che
 * appare in sincrono.
 *
 * I segmenti usano la variante "keep": una volta accesi restano accesi, così
 * l'anello si compone davvero invece di lampeggiare. Nessun JavaScript.
 */

/** I cinque percorsi qualificanti (SPEC §11): un segmento ciascuno. */
const PERCORSI_SEGMENTI = [
  {
    titolo: "Carbon footprint",
    desc: "Categorie obbligatorie confermate e report GHG validato dal team tecnico: il primo segmento si accende.",
    /** Arco sull'anello: inizio e fine in gradi. */
    from: -90,
    to: -22,
  },
  {
    titolo: "Bilancio VSME",
    desc: "Il bilancio di sostenibilità completo e validato aggiunge il suo ambito alla pagina pubblica di verifica.",
    from: -14,
    to: 54,
  },
  {
    titolo: "Sistema di gestione ISO",
    desc: "Un sistema della famiglia certificabile, completato e pronto per l'audit dell'ente accreditato.",
    from: 62,
    to: 130,
  },
  {
    titolo: "UNI/PdR 125",
    desc: "Il fascicolo della parità di genere pronto per l'audit: un altro ambito verificato, sullo stesso Sigillo.",
    from: 138,
    to: 206,
  },
  {
    titolo: "Check-up energetico",
    desc: "Con il monitoraggio attivo l'anello si completa: più percorsi verificati, un solo Sigillo.",
    from: 214,
    to: 262,
  },
];

/** Punto sulla circonferenza (raggio 82 su viewBox 200, centro 100,100). */
function punto(gradi: number) {
  const rad = (gradi * Math.PI) / 180;
  return [100 + 82 * Math.cos(rad), 100 + 82 * Math.sin(rad)];
}

function arco(from: number, to: number) {
  const [x1, y1] = punto(from);
  const [x2, y2] = punto(to);
  const largo = to - from > 180 ? 1 : 0;
  return `M ${x1.toFixed(2)} ${y1.toFixed(2)} A 82 82 0 ${largo} 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`;
}

export function SigilloScrolly() {
  return (
    <section className="bg-white px-5 py-16">
      <div className="mx-auto max-w-4xl">
        <div className="text-center">
          <h2 className="font-display text-4xl text-ink md:text-5xl">
            Un anello che si riempie
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-gray-warm">
            Il Sigillo è uno solo, ma racconta quanto hai fatto. L&apos;anello
            punteggiato è la cornice; ogni percorso verificato ne{" "}
            <strong className="font-semibold text-pine">
              riempie un segmento
            </strong>
            . Più percorsi porti a termine, più l&apos;anello si completa —
            sempre sullo stesso, unico Sigillo.
          </p>
        </div>

        <Scrolly steps={5} className="mt-8">
          <ScrollyStage>
            <div className="grid grid-cols-1 items-center gap-8 md:grid-cols-2 md:gap-12">
              {/* Palco: il Sigillo che si compone */}
              <div className="mx-auto w-56 md:w-72">
                <svg
                  viewBox="0 0 200 200"
                  role="img"
                  aria-label="Sigillo Ver0: l'anello si riempie di un segmento per ogni percorso verificato"
                  className="h-auto w-full"
                >
                  <circle cx="100" cy="100" r="98" fill="#FFFFFF" />
                  {/* Cornice punteggiata */}
                  <circle
                    cx="100"
                    cy="100"
                    r="82"
                    fill="none"
                    stroke="#0E5238"
                    strokeWidth="2.2"
                    strokeDasharray="0.1 11.4"
                    strokeLinecap="round"
                  />
                  {/* Segmenti: si accendono uno per fase e restano accesi */}
                  {PERCORSI_SEGMENTI.map((p, i) => (
                    <path
                      key={p.titolo}
                      d={arco(p.from, p.to)}
                      fill="none"
                      stroke={i % 2 === 0 ? "#0E5238" : "#1D9E75"}
                      strokeWidth="4.6"
                      strokeLinecap="round"
                      data-fase={i + 1}
                      data-modo="keep"
                      className={`vz-fase-keep vz-fase-keep-${i + 1}`}
                    />
                  ))}
                  {/* Zero canonico E1 e millesimo */}
                  <ellipse
                    cx="100"
                    cy="92"
                    rx="25"
                    ry="38"
                    fill="none"
                    stroke="#0E5238"
                    strokeWidth="4.2"
                  />
                  <text
                    x="100"
                    y="152"
                    textAnchor="middle"
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: "15px",
                      letterSpacing: "5px",
                    }}
                    fill="#0A3D2A"
                  >
                    2026
                  </text>
                </svg>
              </div>

              {/* Spiegazione in sincrono */}
              <div>
                <ScrollySteps className="min-h-[11rem]">
                  {PERCORSI_SEGMENTI.map((p, i) => (
                    <ScrollyStep key={p.titolo} index={i + 1}>
                      <p className="text-xs font-semibold tracking-widest text-mint">
                        PERCORSO {i + 1} DI {PERCORSI_SEGMENTI.length}
                      </p>
                      <h3 className="mt-2 font-display text-2xl text-ink md:text-3xl">
                        {p.titolo}
                      </h3>
                      <p className="mt-3 max-w-md text-sm leading-relaxed text-gray-warm">
                        {p.desc}
                      </p>
                    </ScrollyStep>
                  ))}
                </ScrollySteps>

                <div className="mt-8">
                  <ScrollyProgress />
                </div>
              </div>
            </div>
          </ScrollyStage>
        </Scrolly>

        <p className="mt-8 text-center text-xs text-gray-light">
          Ogni percorso verificato aggiunge un ambito alla stessa pagina
          pubblica di verifica. Un solo Sigillo, mai Sigilli multipli.
        </p>
      </div>
    </section>
  );
}
