import { NextResponse, type NextRequest } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { arricchisci } from "@/lib/arricchimento/orchestratore";

/**
 * ARRICCHIMENTO SU RICHIESTA — il pulsante «Aggiorna i dati» della scheda.
 *
 * Risponde in NDJSON, una riga per fonte appena finisce: la scheda mostra
 * così una progressione VERA, non una barra che si muove da sola mentre
 * il server pensa.
 *
 * Chi può chiedere l'arricchimento: solo l'impresa titolare per sé, o il
 * consulente per un cliente con mandato attivo. Il controllo lo fa la
 * RLS: leggiamo l'organizzazione con la sessione dell'utente e, se non ne
 * ha diritto, semplicemente non la trova. Da lì in poi l'orchestratore
 * usa la service_role, perché la provenienza «motore» è per costruzione
 * riservata al back-office.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Non autenticato." }, { status: 401 });
  }

  let body: { organizationId?: string };
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const { data: profilo } = await supabase
    .from("profiles")
    .select("ruolo, organization_id")
    .eq("id", user.id)
    .maybeSingle();

  const richiesta =
    profilo?.ruolo === "consulente"
      ? body.organizationId
      : profilo?.organization_id;
  if (!richiesta) {
    return NextResponse.json(
      { error: "Nessuna impresa selezionata." },
      { status: 400 },
    );
  }

  // Il varco: se la RLS non la mostra a questo utente, non esiste per lui.
  const { data: org } = await supabase
    .from("organizations")
    .select("id")
    .eq("id", richiesta)
    .maybeSingle();
  if (!org) {
    return NextResponse.json(
      { error: "Impresa non accessibile." },
      { status: 403 },
    );
  }

  const encoder = new TextEncoder();
  const flusso = new ReadableStream({
    async start(controller) {
      try {
        for await (const esito of arricchisci(org.id, "manuale")) {
          controller.enqueue(encoder.encode(`${JSON.stringify(esito)}\n`));
        }
      } catch (e) {
        controller.enqueue(
          encoder.encode(
            `${JSON.stringify({
              chiave: "orchestratore",
              nome: "Arricchimento",
              esito: "errore",
              campiScritti: 0,
              campi: [],
              durataMs: 0,
              dettaglio: e instanceof Error ? e.message : String(e),
            })}\n`,
          ),
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(flusso, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store",
      // Nessun buffering intermedio: la progressione deve arrivare viva.
      "X-Accel-Buffering": "no",
    },
  });
}
