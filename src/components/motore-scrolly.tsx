import { MOTORE_FASI } from "@/lib/motore";

import {
  Scrolly,
  ScrollyProgress,
  ScrollyStage,
  ScrollyStep,
  ScrollySteps,
} from "./scrolly";

/**
 * Sezione narrativa del Motore Ver0 (home e chi-siamo): il visual resta
 * fermo e le fasi si avvicendano allo scorrimento — documenti richiesti →
 * lettura → incrocio banche dati → generazione → verifica umana.
 *
 * Registro scuro istituzionale. Avvicendamento: v. scrolly.tsx.
 *
 * Attenzione: la sezione NON deve avere overflow nascosto. Un antenato che
 * ritaglia diventa il contenitore di scorrimento del palco sticky e della
 * ViewTimeline, e li disattiva entrambi. I bagliori si ritagliano da sé,
 * dentro il proprio strato.
 */
export function MotoreScrolly() {
  return (
    <section className="relative bg-pine-deep px-5 py-16">
      {/* Bagliori menta — ritagliati qui dentro, non sulla sezione */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <span className="absolute -left-24 top-10 h-80 w-80 rounded-full bg-mint-bright/10 blur-3xl" />
        <span className="absolute -right-28 bottom-0 h-96 w-96 rounded-full bg-mint-bright/10 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-5xl">
        <div className="text-center">
          <p className="mb-3 text-xs font-semibold tracking-widest text-mint-bright">
            IL NOSTRO MOTORE
          </p>
          <h2 className="font-display text-4xl text-white md:text-5xl">
            Raccolta documentale guidata
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-moss">
            Il Motore Ver0 ti chiede esattamente ciò che serve, lo legge, lo
            incrocia con le fonti ufficiali e lo trasforma in documenti
            conformi. Poi una persona verifica.
          </p>
        </div>

        <Scrolly steps={5} className="mt-10">
          <ScrollyStage>
            <div className="grid grid-cols-1 items-center gap-8 md:grid-cols-2 md:gap-12">
              {/* Palco: il Motore, sempre al centro della scena */}
              <div className="relative mx-auto flex h-56 w-56 items-center justify-center md:h-72 md:w-72">
                {/* Anello punteggiato di contesto */}
                <span
                  aria-hidden
                  className="absolute inset-0 rounded-full border-2 border-dotted border-mint-bright/25"
                />
                {/* Alone che respira */}
                <span className="vz-motore-glow absolute inset-8 rounded-full border border-mint-bright/40 bg-pine/60" />
                {/* Zero canonico E1 */}
                <svg
                  viewBox="0 0 30 40"
                  className="relative h-24 w-auto md:h-32"
                  fill="none"
                  aria-hidden="true"
                >
                  <ellipse
                    cx="15"
                    cy="20"
                    rx="11"
                    ry="15"
                    stroke="#2FCF9A"
                    strokeWidth="3.5"
                  />
                </svg>

                {/* Icona della fase corrente, in orbita sul Motore */}
                <div className="absolute -bottom-2 grid">
                  {MOTORE_FASI.map((f, i) => {
                    const Icon = f.icon;
                    return (
                      <ScrollyStep
                        key={f.titolo}
                        index={i + 1}
                        className="col-start-1 row-start-1"
                      >
                        <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-mint-bright/40 bg-pine-deep text-mint-bright shadow-lift">
                          <Icon size={24} />
                        </span>
                      </ScrollyStep>
                    );
                  })}
                </div>
              </div>

              {/* Fasi: si avvicendano accanto al palco */}
              <div>
                <ScrollySteps className="min-h-[15rem] md:min-h-[16rem]">
                  {MOTORE_FASI.map((f, i) => (
                    <ScrollyStep key={f.titolo} index={i + 1}>
                      <p className="text-xs font-semibold tracking-widest text-mint-bright">
                        FASE {i + 1} DI {MOTORE_FASI.length}
                      </p>
                      <h3 className="mt-2 font-display text-2xl leading-tight text-white md:text-3xl">
                        {f.titolo}
                      </h3>
                      <p className="mt-3 max-w-md text-sm leading-relaxed text-moss">
                        {f.desc}
                      </p>
                      <p className="mt-4 inline-block rounded-full border border-mint-bright/25 bg-white/5 px-3.5 py-1.5 text-xs text-moss">
                        {f.esempio}
                      </p>
                    </ScrollyStep>
                  ))}
                </ScrollySteps>

                <div className="mt-8">
                  <ScrollyProgress tone="dark" />
                </div>
              </div>
            </div>
          </ScrollyStage>
        </Scrolly>

        <p className="mt-10 text-center text-xs text-moss/80">
          Le elaborazioni del Motore Ver0 sono sempre dichiarate; le verifiche
          umane portano il nome di chi le ha fatte. Nessun dato entra nei report
          senza la tua conferma.
        </p>
      </div>
    </section>
  );
}
