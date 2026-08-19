import { NextResponse, type NextRequest } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { validaPartitaIva } from "@/lib/piva";
import { normalizzaSito } from "@/lib/arricchimento/presenza-web";

import { risolviUtente } from "../_lib";

/**
 * Step 2 del funnel (SPEC §12.T): alla registrazione crea organization +
 * profile per l'utente appena nato. Scrive con la service_role (la RLS non
 * prevede insert di onboarding per gli utenti), ma SEMPRE con id risolti
 * lato server: l'organizzazione nasce legata all'utente verificato, mai a
 * dati arbitrari del client.
 */
export async function POST(request: NextRequest) {
  let body: {
    userId?: string;
    ragioneSociale?: string;
    piva?: string;
    sitoWeb?: string;
    dimensione?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Richiesta non valida." }, { status: 400 });
  }

  const utente = await risolviUtente(body.userId);
  if (!utente) {
    return NextResponse.json(
      { error: "Utente non riconosciuto: ripeti la registrazione." },
      { status: 401 },
    );
  }

  const ragioneSociale = (body.ragioneSociale ?? "").trim();
  const piva = (body.piva ?? "").replace(/\s/g, "");
  if (ragioneSociale.length < 2 || !validaPartitaIva(piva)) {
    return NextResponse.json(
      { error: "Dati impresa non validi: controlla ragione sociale e P.IVA." },
      { status: 400 },
    );
  }
  const dimensione = (
    ["micro", "piccola", "media", "grande"] as const
  ).find((d) => d === body.dimensione) ?? "micro";

  // Il sito è facoltativo e non deve mai bloccare la registrazione: se è
  // scritto male lo scartiamo in silenzio, il cliente lo aggiungerà dalla
  // scheda. Normalizzarlo qui evita di conservare stringhe inutilizzabili.
  const sitoWeb = normalizzaSito(String(body.sitoWeb ?? ""))?.toString() ?? null;

  const admin = createAdminClient();

  // Già registrato? Idempotente: restituiamo l'organizzazione esistente.
  const { data: esistente } = await admin
    .from("profiles")
    .select("organization_id")
    .eq("id", utente.id)
    .maybeSingle();
  if (esistente) {
    return NextResponse.json({ organizationId: esistente.organization_id });
  }

  const { data: org, error: orgErr } = await admin
    .from("organizations")
    .insert({
      ragione_sociale: ragioneSociale,
      partita_iva: piva,
      dimensione,
      billing_email: utente.email,
      sito_web: sitoWeb,
    })
    .select("id")
    .single();

  if (orgErr) {
    if (orgErr.code === "23505") {
      return NextResponse.json(
        {
          error:
            "Questa Partita IVA risulta già registrata. Se è la tua azienda, accedi con l'account che l'ha creata o scrivici a info@verzero.it.",
        },
        { status: 409 },
      );
    }
    return NextResponse.json(
      { error: "Registrazione non riuscita, riprova tra poco." },
      { status: 500 },
    );
  }

  const { error: profErr } = await admin.from("profiles").insert({
    id: utente.id,
    organization_id: org.id,
    role: "owner",
  });
  if (profErr) {
    // Niente profili orfani: se il profilo fallisce, togliamo l'org appena creata.
    await admin.from("organizations").delete().eq("id", org.id);
    return NextResponse.json(
      { error: "Registrazione non riuscita, riprova tra poco." },
      { status: 500 },
    );
  }

  return NextResponse.json({ organizationId: org.id });
}
