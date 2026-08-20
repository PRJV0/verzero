import { createHash } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { eventoValido } from "@/lib/eventi";

/**
 * RACCOLTA EVENTI (analitica di prima parte, senza cookie).
 *
 * Scrive con la service_role: la tabella `events` non è aperta in
 * scrittura a nessuno: una tabella con insert pubblico si riempie di
 * spazzatura nel giro di settimane. Qui il nome dell'evento è validato
 * contro un elenco chiuso, e tutto ciò che non lo rispetta viene
 * scartato in silenzio — a un bot non si spiega perché è stato respinto.
 *
 * Del visitatore non conserviamo l'IP ma un'impronta con pepper: basta a
 * distinguere le sessioni e a frenare gli abusi, non a identificare
 * nessuno. Nessun cookie, quindi nessun consenso da chiedere.
 */

/** Quanti eventi accettiamo da una stessa impronta in un'ora. */
const MAX_PER_ORA = 300;

function impronta(request: NextRequest): string {
  const inoltrato = request.headers.get("x-forwarded-for");
  const ip = inoltrato
    ? inoltrato.split(",")[0]!.trim()
    : (request.headers.get("x-real-ip") ?? "sconosciuto");
  const pepper = process.env.CONTACT_IP_PEPPER ?? "ver0-eventi";
  // Ora nell'impronta: cambia a ogni ora, così non è un identificatore
  // stabile nel tempo e resta comunque utile a limitare gli abusi.
  const ora = new Date().toISOString().slice(0, 13);
  return createHash("sha256").update(`${pepper}:${ip}:${ora}`).digest("hex");
}

/** Solo l'host di provenienza: mai l'URL completo, che può contenere di tutto. */
function sorgenteDi(request: NextRequest): string | null {
  const referrer = request.headers.get("referer");
  if (!referrer) return null;
  try {
    const url = new URL(referrer);
    // Le visite interne non sono una sorgente: falserebbero il conteggio.
    if (url.hostname === request.nextUrl.hostname) return null;
    return url.hostname.slice(0, 120);
  } catch {
    return null;
  }
}

/** Dettagli ammessi: solo valori brevi e non personali. */
function ripuliscDettagli(grezzi: unknown): Record<string, string> {
  if (!grezzi || typeof grezzi !== "object") return {};
  const out: Record<string, string> = {};
  for (const [chiave, valore] of Object.entries(grezzi)) {
    if (Object.keys(out).length >= 6) break;
    if (!/^[a-z_]{2,24}$/.test(chiave)) continue;
    if (typeof valore !== "string" && typeof valore !== "number") continue;
    const testo = String(valore).slice(0, 60);
    // Se somiglia a un indirizzo email, non entra: è un dato personale
    // e in un registro di eventi non ha nulla da fare.
    if (testo.includes("@")) continue;
    out[chiave] = testo;
  }
  return out;
}

export async function POST(request: NextRequest) {
  let corpo: { nome?: string; percorso?: string; dettagli?: unknown };
  try {
    corpo = await request.json();
  } catch {
    return NextResponse.json({ ok: true });
  }

  if (typeof corpo.nome !== "string" || !eventoValido(corpo.nome)) {
    return NextResponse.json({ ok: true });
  }

  const visitatore = impronta(request);
  const admin = createAdminClient();

  const daUnOra = new Date(Date.now() - 60 * 60_000).toISOString();
  const { count } = await admin
    .from("events")
    .select("id", { count: "exact", head: true })
    .eq("visitatore", visitatore)
    .gte("created_at", daUnOra);
  if ((count ?? 0) >= MAX_PER_ORA) {
    return NextResponse.json({ ok: true });
  }

  // Il percorso senza query: negli URL non devono finire dati personali,
  // e se ce ne fossero non li vogliamo comunque nel registro.
  const percorso =
    typeof corpo.percorso === "string" && corpo.percorso.startsWith("/")
      ? corpo.percorso.split("?")[0].slice(0, 300)
      : null;

  await admin.from("events").insert({
    nome: corpo.nome,
    percorso,
    sorgente: sorgenteDi(request),
    dettagli: ripuliscDettagli(corpo.dettagli),
    visitatore,
  });

  // Sempre 200: al client non serve sapere nulla, e un errore di
  // misurazione non deve mai diventare un errore visibile.
  return NextResponse.json({ ok: true });
}
