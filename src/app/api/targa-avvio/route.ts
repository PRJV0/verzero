import { NextResponse, type NextRequest } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { publicEnv } from "@/lib/env";
import { targaAvvioSvg } from "@/lib/targa-avvio";

/**
 * LA TARGA DI AVVIO da scaricare (SPEC §12.F).
 *
 * SVG autonomo con sigillo in stato di avvio (anello punteggiato, mai
 * segmenti pieni), millesimo «Percorso avviato 2026» e QR verso la
 * pagina pubblica /verifica/[codice]. Autenticata e coperta dalla RLS:
 * l'impresa scarica la propria, il consulente quella dei clienti con
 * mandato attivo (?cliente=). Senza un percorso attivo la targa non
 * esiste: non si dichiara un avvio che non c'è.
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Non autenticato." }, { status: 401 });
  }

  const { data: profilo } = await supabase
    .from("profiles")
    .select("ruolo, organization_id")
    .eq("id", user.id)
    .maybeSingle();

  // L'organizzazione della targa: la propria, oppure — per il consulente —
  // il cliente scelto. In entrambi i casi la RLS resta il confine reale.
  const cliente = request.nextUrl.searchParams.get("cliente");
  const orgId =
    profilo?.ruolo === "consulente" ? cliente : profilo?.organization_id;
  if (!orgId) {
    return NextResponse.json(
      { error: "Nessuna organizzazione selezionata." },
      { status: 400 },
    );
  }

  const { data: org } = await supabase
    .from("organizations")
    .select("ragione_sociale, partita_iva, codice_verifica")
    .eq("id", orgId)
    .maybeSingle();
  if (!org) {
    return NextResponse.json(
      { error: "Organizzazione non trovata." },
      { status: 404 },
    );
  }

  const { count } = await supabase
    .from("module_activations")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", orgId)
    .eq("stato", "attivo");
  if (!count) {
    return NextResponse.json(
      { error: "La targa di avvio esiste solo con un percorso attivo." },
      { status: 409 },
    );
  }

  const svg = targaAvvioSvg({
    ragioneSociale: org.ragione_sociale,
    partitaIva: org.partita_iva,
    urlVerifica: `${publicEnv.siteUrl}/verifica/${org.codice_verifica}`,
  });

  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Content-Disposition":
        'attachment; filename="targa-avvio-ver0-2026.svg"',
      "Cache-Control": "private, no-store",
    },
  });
}
