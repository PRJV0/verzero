import "server-only";

import { after } from "next/server";

import { agenteAiDa } from "@/lib/ai-canali";
import { EVENTI } from "@/lib/eventi";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * REGISTRA IL PASSAGGIO DI UN AGENTE AI.
 *
 * Un crawler non esegue JavaScript: l'analitica del browser non lo vede,
 * e senza questa riga non sapremmo mai se qualcuno ci sta leggendo. Il
 * segnale è nello user agent, e lo user agent arriva al server.
 *
 * DOVE STA. Nel layout delle pagine pubbliche, che è già reso a ogni
 * richiesta (legge i cookie del consenso): leggere anche un'intestazione
 * non cambia il costo di rendering di una virgola. In `proxy.ts` sarebbe
 * costato a ogni richiesta di chiunque, comprese quelle degli asset.
 *
 * COME. `after()` esegue DOPO che la risposta è partita: la pagina non
 * aspetta la scrittura, e se la scrittura fallisce nessuno se ne accorge
 * — che è il comportamento giusto per una misurazione. Un errore di
 * analitica non deve mai diventare un errore di pagina.
 *
 * COSA NON REGISTRIAMO: nessun IP, nemmeno in forma di impronta. Un
 * crawler non è una persona e non c'è niente da distinguere; il campo
 * `visitatore` resta vuoto proprio per dire che qui non c'è nessuno.
 */
export function registraAccessoAi(
  userAgent: string | null,
  percorso: string,
): void {
  const agente = agenteAiDa(userAgent);
  if (!agente) return;

  after(async () => {
    try {
      await createAdminClient()
        .from("events")
        .insert({
          nome: EVENTI.CRAWLER_AI,
          percorso: percorso.slice(0, 300),
          sorgente: null,
          dettagli: { agente: agente.nome, famiglia: agente.famiglia },
          visitatore: null,
        });
    } catch {
      // Silenzio voluto: v. sopra.
    }
  });
}
