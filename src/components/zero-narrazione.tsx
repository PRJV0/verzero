import { Leaf } from "lucide-react";

import {
  Scrolly,
  ScrollyProgress,
  ScrollyStage,
  ScrollyStep,
  ScrollySteps,
} from "@/components/scrolly";
import { ZERI } from "@/lib/zeri";

/**
 * LO ZERO SU SCHERMO LARGO — la narrazione allo scorrimento.
 *
 * È la presentazione desktop delle stesse declinazioni che su telefono
 * scorrono nel nastro (`NastroZero`): stessa fonte, `src/lib/zeri.ts`,
 * resa diversa. Sul largo c'è spazio per una parola alla volta grande
 * quanto un titolo, e la corsa di scorrimento è abbastanza lunga perché
 * l'avvicendamento si legga; su uno schermo stretto nessuna delle due
 * cose è vera, ed è per questo che lì la forma cambia.
 *
 * Il ripiego per schermo stretto è spento (`revealSuStretto={false}`):
 * sotto i 768px questo blocco è nascosto e al suo posto c'è il nastro,
 * quindi accendere anche i reveal qui vorrebbe dire animare nodi che
 * nessuno vede. Sul largo il ripiego resta, ed è importante: dove le
 * scroll-timeline non esistono — Safari — senza di esso le sei
 * declinazioni comparirebbero tutte insieme, che è il difetto da cui
 * questa storia è cominciata.
 *
 * La nota diventa una frase compiuta — maiuscola iniziale e punto — che
 * è presentazione, non contenuto: nel nastro la stessa nota segue il
 * titolo sulla stessa riga e lì la maiuscola sarebbe sbagliata. Il testo
 * resta uno solo.
 */

function frase(nota: string): string {
  return `${nota.charAt(0).toUpperCase()}${nota.slice(1)}.`;
}

export function NarrazioneZero() {
  return (
    <Scrolly steps={6} className="mt-8" revealSuStretto={false}>
      <ScrollyStage>
        <div className="relative mx-auto max-w-2xl py-6 text-center">
          <span
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-1/2 -z-10 -translate-x-1/2 -translate-y-1/2 select-none font-display text-[18rem] leading-none text-pine/[0.07] md:text-[26rem]"
          >
            0
          </span>

          <ScrollySteps className="min-h-[12rem] place-items-center">
            {ZERI.map((z, i) => (
              <ScrollyStep key={z.coda} index={i + 1}>
                <h3 className="font-display text-4xl text-ink md:text-6xl">
                  <em className="font-display font-semibold text-mint">
                    {z.accento}
                  </em>{" "}
                  {z.coda}
                  {z.foglia && (
                    <Leaf
                      size={24}
                      aria-hidden
                      className="ml-2 inline text-mint"
                    />
                  )}
                </h3>
                <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-gray-warm md:text-base">
                  {frase(z.nota)}
                </p>
              </ScrollyStep>
            ))}
          </ScrollySteps>

          <div className="mx-auto mt-8 max-w-xs">
            <ScrollyProgress />
          </div>
        </div>
      </ScrollyStage>
    </Scrolly>
  );
}
