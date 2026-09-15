import { NextResponse, type NextRequest } from "next/server";

import { MODELLO_PER_PERCORSO } from "@/lib/elaborati";
import { anteprimaDocumento } from "@/lib/elaborato/archivio";
import { createClient } from "@/lib/supabase/server";

/**
 * L'ANTEPRIMA DELLA VESTE — copertina e prima sezione, in PDF, mai archiviata.
 *
 * Si genera dagli stessi dati e con lo stesso impaginatore del documento
 * vero: un'anteprima disegnata a parte finirebbe per mostrare una veste che
 * il documento non ha. Porta su ogni pagina la dicitura che non è il
 * documento consegnato, e non passa dal controllo di consegna — serve
 * proprio a vedere la veste prima.
 *
 * Il consulente con mandato la può aprire: legge, come per il resto.
 * `?cliente=` sceglie l'organizzazione, e la RLS decide se può.
 */
export async function GET(richiesta: NextRequest) {
  const url = richiesta.nextUrl;
  const percorso = url.searchParams.get("percorso") ?? "";
  const chiaveModello = url.searchParams.get("modello") ?? "";
  const cliente = url.searchParams.get("cliente");

  const voce = (MODELLO_PER_PERCORSO[percorso] ?? []).find((v) => v.modello === chiaveModello);
  if (!voce) return new NextResponse("Documento non trovato.", { status: 404 });

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/login", url));

  const { data: profilo } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", user.id)
    .maybeSingle();
  const organizzazioneId = cliente ?? profilo?.organization_id;
  if (!organizzazioneId) return new NextResponse("Nessuna impresa collegata.", { status: 404 });

  const { data: org } = await supabase
    .from("organizations")
    .select("id, ragione_sociale, partita_iva, anno_rendicontazione, sito_web, created_at")
    .eq("id", organizzazioneId)
    .maybeSingle();
  if (!org) return new NextResponse("Documento non trovato.", { status: 404 });

  const pdf = await anteprimaDocumento({
    sessione: supabase,
    organizzazione: org,
    percorso,
    chiaveModello,
    opzioni: voce.opzioni ?? [],
  });
  if (!pdf) return new NextResponse("Documento non trovato.", { status: 404 });

  return new NextResponse(Buffer.from(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="anteprima-${chiaveModello}.pdf"`,
      "Cache-Control": "private, no-store",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}
