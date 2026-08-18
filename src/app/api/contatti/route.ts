import { createHash } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { validaContatto, type DatiContatto } from "@/lib/contatti";
import { NOTIFICHE_INTERNE, inviaEmail } from "@/lib/email";

/**
 * Modulo di contatto pubblico (/contatti).
 *
 * La tabella contact_messages è chiusa in RLS: questa route è l'unica via
 * di scrittura, e per questo si prende tutti i controlli.
 *
 * Anti-spam a tre livelli, dal più economico al più costoso:
 *   1. campo trappola invisibile ai browser reali (honeypot);
 *   2. tempo di compilazione minimo: i bot inviano in un istante;
 *   3. rate limiting per hash dell'IP, contato a database — l'unico che
 *      regge su serverless, dove la memoria di processo non è condivisa
 *      tra istanze e si azzera a ogni cold start.
 *
 * Il messaggio viene SEMPRE salvato a database; la notifica via Resend è
 * un di più che non può far fallire l'invio (SPEC §12.E).
 */

/** Finestra e soglia del rate limiting. */
const FINESTRA_MINUTI = 60;
const MAX_PER_FINESTRA = 5;
/** Sotto questa soglia è quasi certamente un bot. */
const SECONDI_MINIMI_COMPILAZIONE = 3;

/** Hash con pepper: l'IP non finisce mai in chiaro a database. */
function hashIp(ip: string): string {
  const pepper = process.env.CONTACT_IP_PEPPER ?? "ver0-contatti";
  return createHash("sha256").update(`${pepper}:${ip}`).digest("hex");
}

function ipRichiedente(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return request.headers.get("x-real-ip") ?? "sconosciuto";
}

export async function POST(request: NextRequest) {
  let body: Partial<DatiContatto> & { trappola?: string; apertoIl?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Richiesta non valida." },
      { status: 400 },
    );
  }

  // 1. Honeypot: un campo che nessun umano vede e nessun umano compila.
  //    Rispondiamo 200 senza salvare: al bot non diciamo che l'abbiamo
  //    riconosciuto, così non prova un'altra strada.
  if (typeof body.trappola === "string" && body.trappola.trim() !== "") {
    return NextResponse.json({ ok: true });
  }

  // 2. Tempo di compilazione.
  if (
    typeof body.apertoIl === "number" &&
    Date.now() - body.apertoIl < SECONDI_MINIMI_COMPILAZIONE * 1000
  ) {
    return NextResponse.json(
      { error: "Invio troppo rapido: riprova tra un istante." },
      { status: 429 },
    );
  }

  const errori = validaContatto(body);
  if (Object.keys(errori).length > 0) {
    return NextResponse.json(
      { error: "Controlla i campi segnalati.", errori },
      { status: 400 },
    );
  }

  const admin = createAdminClient();
  const ipHash = hashIp(ipRichiedente(request));
  const da = new Date(Date.now() - FINESTRA_MINUTI * 60_000).toISOString();

  // 3. Rate limiting contato a database.
  const { count, error: erroreConteggio } = await admin
    .from("contact_messages")
    .select("id", { count: "exact", head: true })
    .eq("ip_hash", ipHash)
    .gte("created_at", da);

  if (erroreConteggio) {
    return NextResponse.json(
      { error: "Invio non riuscito, riprova tra poco." },
      { status: 500 },
    );
  }
  if ((count ?? 0) >= MAX_PER_FINESTRA) {
    return NextResponse.json(
      {
        error: `Hai già inviato ${MAX_PER_FINESTRA} messaggi nell'ultima ora: ti risponderemo a quelli. Se è urgente, riprova più tardi.`,
      },
      { status: 429 },
    );
  }

  const azienda = (body.azienda ?? "").trim();
  const nome = body.nome!.trim();
  const emailMittente = body.email!.trim().toLowerCase();
  const messaggio = body.messaggio!.trim();
  const { error } = await admin.from("contact_messages").insert({
    nome,
    azienda: azienda === "" ? null : azienda,
    email: emailMittente,
    oggetto: body.oggetto as "informazioni" | "servizi" | "partnership",
    messaggio,
    ip_hash: ipHash,
    user_agent: request.headers.get("user-agent")?.slice(0, 500) ?? null,
  });

  if (error) {
    return NextResponse.json(
      { error: "Invio non riuscito, riprova tra poco." },
      { status: 500 },
    );
  }

  // Notifica interna: il messaggio è già salvo, questa è comodità. Se
  // Resend non è configurato o risponde male, non cambia nulla per chi
  // ha scritto — per questo l'esito non viene nemmeno controllato.
  await inviaEmail({
    a: NOTIFICHE_INTERNE,
    oggetto: `Nuovo contatto dal sito — ${body.oggetto}`,
    rispondiA: emailMittente,
    testo: [
      `Da: ${nome}${azienda ? ` (${azienda})` : ""}`,
      `Email: ${emailMittente}`,
      `Oggetto: ${body.oggetto}`,
      "",
      messaggio,
    ].join("\n"),
  });

  return NextResponse.json({ ok: true });
}
