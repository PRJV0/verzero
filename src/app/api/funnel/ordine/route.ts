import { NextResponse, type NextRequest } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { getServizio } from "@/lib/catalog";
import { validaPartitaIva } from "@/lib/piva";
import {
  DIMENSIONI,
  FORMULE,
  isUnaTantum,
  prezzoDettaglio,
  prezzoUnaTantum,
  type Dimensione,
  type Formula,
} from "@/lib/pricing";

import { DOC_VERSION, risolviUtente } from "../_lib";

/** Taglio memorizzato sull'ordine, derivato dallo slug (mai dal client). */
const TAGLIO: Record<string, string> = {
  "carbon-light": "light",
  "carbon-completa": "completa",
  "bilancio-vsme-base": "base",
  "bilancio-vsme-avanzato": "avanzato",
  "manuale-iso-9001": "9001",
  "manuale-iso-14001": "14001",
  "manuale-iso-45001": "45001",
};

/**
 * Conferma d'ordine del funnel (SPEC §12.T step 4-5): scrive orders,
 * consents (coi timestamp raccolti nello step 3) e module_activations.
 * Prezzi ricalcolati SEMPRE lato server dalla matrice (§12.X): il client
 * non manda mai importi. Se il profilo non esiste ancora (account nato
 * prima del database), lo ricostruiamo dai metadati utente della signUp.
 */
export async function POST(request: NextRequest) {
  let body: {
    userId?: string;
    slug?: string;
    dimensione?: string;
    formula?: string;
    tosAcceptedAt?: string;
    mandatoAcceptedAt?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Richiesta non valida." }, { status: 400 });
  }

  const utente = await risolviUtente(body.userId);
  if (!utente) {
    return NextResponse.json(
      { error: "Utente non riconosciuto: accedi e riprova." },
      { status: 401 },
    );
  }

  const servizio = body.slug ? getServizio(body.slug) : undefined;
  const dimensione = DIMENSIONI.includes(body.dimensione as Dimensione)
    ? (body.dimensione as Dimensione)
    : null;
  const tosAt = Date.parse(body.tosAcceptedAt ?? "");
  const mandatoAt = Date.parse(body.mandatoAcceptedAt ?? "");

  if (!servizio || !dimensione || dimensione === "grande") {
    return NextResponse.json({ error: "Ordine non valido." }, { status: 400 });
  }

  // La forma di pagamento discende dal servizio, non da ciò che manda il
  // client: i one-shot non hanno canone e i servizi a canone non hanno
  // una tantum. La formula ricevuta conta solo per i secondi.
  const oneShot = isUnaTantum(servizio.slug);
  const formula = FORMULE.includes(body.formula as Formula)
    ? (body.formula as Formula)
    : null;
  if (!oneShot && !formula) {
    return NextResponse.json({ error: "Ordine non valido." }, { status: 400 });
  }

  if (Number.isNaN(tosAt) || Number.isNaN(mandatoAt)) {
    return NextResponse.json(
      { error: "Consensi mancanti: torna allo step precedente." },
      { status: 400 },
    );
  }

  const unaTantum = oneShot ? prezzoUnaTantum(servizio.slug, dimensione) : null;
  const prezzo = oneShot ? null : prezzoDettaglio(servizio.slug, dimensione);
  if (oneShot ? unaTantum === null : !prezzo) {
    return NextResponse.json({ error: "Prezzo non disponibile." }, { status: 400 });
  }

  const admin = createAdminClient();

  // Organizzazione dell'utente; se manca il profilo, recupero dai metadati.
  let organizationId: string;
  const { data: profilo } = await admin
    .from("profiles")
    .select("organization_id")
    .eq("id", utente.id)
    .maybeSingle();

  if (profilo?.organization_id) {
    organizationId = profilo.organization_id;
  } else if (profilo) {
    // Profilo senza organizzazione: è un consulente partner (SPEC §12.K).
    // Gli acquisti per conto del cliente arrivano con le fasi successive.
    return NextResponse.json(
      {
        error:
          "Questo account è un profilo consulente: gli acquisti per conto dei clienti non sono ancora attivi.",
      },
      { status: 403 },
    );
  } else {
    const ragioneSociale = String(utente.metadata.ragione_sociale ?? "").trim();
    const piva = String(utente.metadata.partita_iva ?? "").replace(/\s/g, "");
    if (ragioneSociale.length < 2 || !validaPartitaIva(piva)) {
      return NextResponse.json(
        {
          error:
            "Registrazione impresa incompleta: torna allo step Registrazione.",
        },
        { status: 409 },
      );
    }
    const { data: org, error: orgErr } = await admin
      .from("organizations")
      .insert({
        ragione_sociale: ragioneSociale,
        partita_iva: piva,
        dimensione,
        billing_email: utente.email,
      })
      .select("id")
      .single();
    if (orgErr || !org) {
      return NextResponse.json(
        { error: "Registrazione impresa non riuscita, riprova." },
        { status: orgErr?.code === "23505" ? 409 : 500 },
      );
    }
    const { error: profErr } = await admin.from("profiles").insert({
      id: utente.id,
      organization_id: org.id,
      role: "owner",
    });
    if (profErr) {
      await admin.from("organizations").delete().eq("id", org.id);
      return NextResponse.json(
        { error: "Registrazione impresa non riuscita, riprova." },
        { status: 500 },
      );
    }
    organizationId = org.id;
  }

  // Idempotenza morbida: stesso servizio già in attivazione → nessun doppione.
  const { data: giaPresente } = await admin
    .from("orders")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("servizio_slug", servizio.slug)
    .eq("stato", "in_attivazione")
    .maybeSingle();
  if (giaPresente) {
    return NextResponse.json({ orderId: giaPresente.id, giaPresente: true });
  }

  const { data: ordine, error: ordErr } = await admin
    .from("orders")
    .insert({
      organization_id: organizationId,
      created_by: utente.id,
      servizio_slug: servizio.slug,
      taglio: TAGLIO[servizio.slug] ?? null,
      dimensione,
      // `formula` è già validata sopra: non nulla quando non è un one-shot.
      formula: oneShot ? ("una_tantum" as const) : formula!,
      // Formato unico §12.Q: per i servizi a canone niente quote una tantum,
      // tutto nel canone. Per i one-shot vale l'opposto: solo l'una tantum.
      prezzo_canone: oneShot
        ? null
        : formula === "mensile"
          ? prezzo!.mensile
          : prezzo!.annuale,
      prezzo_una_tantum: unaTantum,
      stato: "in_attivazione",
    })
    .select("id")
    .single();
  if (ordErr || !ordine) {
    return NextResponse.json(
      { error: "Salvataggio ordine non riuscito, riprova." },
      { status: 500 },
    );
  }

  const { error: consErr } = await admin.from("consents").insert([
    {
      organization_id: organizationId,
      user_id: utente.id,
      doc_type: "condizioni_servizio",
      doc_version: DOC_VERSION,
      accepted_at: new Date(tosAt).toISOString(),
    },
    {
      organization_id: organizationId,
      user_id: utente.id,
      doc_type: "mandato_banche_dati",
      doc_version: DOC_VERSION,
      accepted_at: new Date(mandatoAt).toISOString(),
    },
  ]);

  const { error: actErr } = await admin.from("module_activations").insert({
    organization_id: organizationId,
    module: servizio.slug,
    order_id: ordine.id,
    stato: "in_attivazione",
  });

  if (consErr || actErr) {
    // Ordine scritto ma corredo incompleto: meglio dirlo che tacere.
    return NextResponse.json(
      {
        orderId: ordine.id,
        warning:
          "Ordine registrato ma con un problema su consensi/attivazione: ti ricontattiamo noi.",
      },
      { status: 207 },
    );
  }

  return NextResponse.json({ orderId: ordine.id });
}
