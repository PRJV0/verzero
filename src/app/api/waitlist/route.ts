import { createHash } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { confermaWaitlist, notificaWaitlist } from "@/lib/notifiche";

/**
 * LISTA D'ATTESA.
 *
 * Stesse difese del modulo contatti, perché il problema è lo stesso: un
 * modulo pubblico che scrive a database è un bersaglio. Campo trappola,
 * tempo minimo di compilazione e limite per impronta dell'IP.
 *
 * Una cosa in più: chi si iscrive due volte NON riceve un errore. È
 * l'iscrizione a una lista, non un acquisto — dire «esisti già» sarebbe
 * pedante e, peggio, rivelerebbe a un estraneo che quell'indirizzo è in
 * elenco. Rispondiamo sempre come se fosse andata bene, aggiornando i
 * dati se sono cambiati.
 */

const FINESTRA_MINUTI = 60;
const MAX_PER_FINESTRA = 3;
const SECONDI_MINIMI_COMPILAZIONE = 2;

function hashIp(request: NextRequest): string {
  const inoltrato = request.headers.get("x-forwarded-for");
  const ip = inoltrato
    ? inoltrato.split(",")[0]!.trim()
    : (request.headers.get("x-real-ip") ?? "sconosciuto");
  const pepper = process.env.CONTACT_IP_PEPPER ?? "ver0-waitlist";
  return createHash("sha256").update(`${pepper}:${ip}`).digest("hex");
}

const EMAIL_VALIDA = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export async function POST(request: NextRequest) {
  let body: {
    email?: string;
    azienda?: string;
    interesse?: string;
    trappola?: string;
    apertoIl?: number;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Richiesta non valida." }, { status: 400 });
  }

  // Campo trappola: al bot non diciamo che l'abbiamo riconosciuto.
  if (typeof body.trappola === "string" && body.trappola.trim() !== "") {
    return NextResponse.json({ ok: true });
  }
  if (
    typeof body.apertoIl === "number" &&
    Date.now() - body.apertoIl < SECONDI_MINIMI_COMPILAZIONE * 1000
  ) {
    return NextResponse.json(
      { error: "Un attimo: riprova fra un istante." },
      { status: 429 },
    );
  }

  const email = (body.email ?? "").trim().toLowerCase();
  if (email.length < 5 || email.length > 200 || !EMAIL_VALIDA.test(email)) {
    return NextResponse.json(
      { error: "Controlla l'indirizzo email: manca qualcosa." },
      { status: 400 },
    );
  }
  const azienda = (body.azienda ?? "").trim().slice(0, 200);
  const interesse = (body.interesse ?? "").trim().slice(0, 200);

  const admin = createAdminClient();
  const ipHash = hashIp(request);
  const da = new Date(Date.now() - FINESTRA_MINUTI * 60_000).toISOString();

  const { count } = await admin
    .from("waitlist")
    .select("id", { count: "exact", head: true })
    .eq("ip_hash", ipHash)
    .gte("created_at", da);
  if ((count ?? 0) >= MAX_PER_FINESTRA) {
    return NextResponse.json(
      { error: "Hai già lasciato il tuo contatto: ti scriviamo noi." },
      { status: 429 },
    );
  }

  // Un secondo invio dello stesso indirizzo aggiorna, non protesta.
  const { error } = await admin.from("waitlist").upsert(
    {
      email,
      azienda: azienda === "" ? null : azienda,
      interesse: interesse === "" ? null : interesse,
      ip_hash: ipHash,
    },
    { onConflict: "email" },
  );

  if (error) {
    return NextResponse.json(
      { error: "Non siamo riusciti a registrarti: riprova tra poco." },
      { status: 500 },
    );
  }

  // Le due campane: una al fondatore, una a chi si è iscritto. Nessuna
  // delle due può far fallire l'iscrizione, che è già salvata.
  await notificaWaitlist({
    email,
    nome: null,
    azienda: azienda === "" ? null : azienda,
    interesse: interesse === "" ? null : interesse,
  });
  await confermaWaitlist({ a: email, azienda: azienda === "" ? null : azienda });

  return NextResponse.json({ ok: true });
}
