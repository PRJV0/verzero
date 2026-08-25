import { createHash } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";

import { createAdminClient } from "@/lib/supabase/admin";
import { serverEnv } from "@/lib/env";
import {
  MAX_RISULTATI,
  elencoChiuso,
  orienta,
  parole,
  risultatoDaId,
  situazioniRiconosciute,
  type EsitoOrientatore,
} from "@/lib/orientatore";

/**
 * L'ORIENTATORE — l'unico punto in cui una frase libera incontra il sito.
 *
 * ═══ DUE LIVELLI, E IL PRIMO BASTA QUASI SEMPRE ═══
 * 1. La corrispondenza DETERMINISTICA (`src/lib/orientatore.ts`):
 *    istantanea, a costo zero, ripetibile. Risponde alla grande
 *    maggioranza delle frasi.
 * 2. Il MODELLO, solo come ripiego e solo quando la prima non trova
 *    nulla. Non genera testo: sceglie fino a tre IDENTIFICATIVI da un
 *    elenco chiuso. Quello che non è nell'elenco non può comparire in
 *    una risposta, e non è una raccomandazione al modello — è la forma
 *    dello schema, più il controllo che segue.
 *
 * ═══ QUELLO CHE NON PUÒ SUCCEDERE ═══
 * Nessuna risposta libera, nessun parere normativo, nessuna promessa di
 * tempi o di esiti. Il testo che il visitatore legge viene SEMPRE dalle
 * fonti del sito — benefici del catalogo, risposte delle guide — e mai
 * dal modello, che dice soltanto quali cose mostrare.
 *
 * ═══ PROTEZIONI ═══
 * Lunghezza massima, limite di frequenza per impronta dell'IP (con
 * pepper e con l'ora dentro, così non è un identificatore stabile), e
 * nessun dato personale conservato: nel registro finiscono le parole
 * normalizzate, mai la frase originale.
 */

export const runtime = "nodejs";

/** Oltre questa lunghezza non è una ricerca: è un incolla. */
const MAX_CARATTERI = 200;
/** Ricerche accettate da una stessa impronta in un'ora. */
const MAX_PER_ORA = 60;
/** Quante parole della ricerca finiscono nel registro. */
const MAX_TERMINI_REGISTRATI = 6;

function impronta(request: NextRequest): string {
  const inoltrato = request.headers.get("x-forwarded-for");
  const ip = inoltrato
    ? inoltrato.split(",")[0]!.trim()
    : (request.headers.get("x-real-ip") ?? "sconosciuto");
  const pepper = process.env.CONTACT_IP_PEPPER ?? "ver0-eventi";
  // L'ora dentro l'impronta: cambia ogni ora, quindi non è un
  // identificatore stabile e resta utile a limitare gli abusi.
  const ora = new Date().toISOString().slice(0, 13);
  return createHash("sha256").update(`${pepper}:${ip}:${ora}`).digest("hex");
}

/** Lo schema della scelta del modello: identificativi, non testo. */
const SchemaScelta = z.object({
  /** Fino a tre identificativi dell'elenco chiuso, dal più pertinente. */
  scelti: z.array(z.string()),
  /** Vero quando nessuno degli elementi risponde davvero alla domanda. */
  nessunoPertinente: z.boolean(),
});

export async function POST(request: NextRequest) {
  let q = "";
  try {
    const corpo = await request.json();
    q = String(corpo?.q ?? "").slice(0, MAX_CARATTERI);
  } catch {
    return NextResponse.json({ risultati: [], situazioni: [], via: "nessuna" });
  }

  if (parole(q).length === 0) {
    return NextResponse.json({ risultati: [], situazioni: [], via: "nessuna" });
  }

  const admin = createAdminClient();
  const visitatore = impronta(request);

  /* — Limite di frequenza: si conta sul registro, che c'è già — */
  const unOraFa = new Date(Date.now() - 3_600_000).toISOString();
  const { count } = await admin
    .from("events")
    .select("id", { count: "exact", head: true })
    .eq("nome", "orientatore_ricerca")
    .eq("visitatore", visitatore)
    .gte("created_at", unOraFa);

  if ((count ?? 0) >= MAX_PER_ORA) {
    // Si risponde comunque con la corrispondenza deterministica, che non
    // costa nulla: limitare non deve voler dire rompere.
    return NextResponse.json({ ...orienta(q), limitato: true });
  }

  /* — 1. Deterministica — */
  let esito: EsitoOrientatore = orienta(q);

  /* — 2. Il modello, solo se la prima non ha trovato niente — */
  if (esito.risultati.length === 0) {
    esito = await chiediAlModello(q);
  }

  /* — Il registro: parole normalizzate, mai la frase — */
  await admin.from("events").insert({
    nome: "orientatore_ricerca",
    percorso: "/",
    visitatore,
    dettagli: {
      termini: parole(q).slice(0, MAX_TERMINI_REGISTRATI).join(" "),
      risultati: String(esito.risultati.length),
      via: esito.via,
    },
  });

  return NextResponse.json(esito);
}

/**
 * Il ripiego. Sceglie da un elenco chiuso e non scrive una parola di
 * quelle che il visitatore leggerà: i testi restano quelli del sito.
 *
 * Se qualcosa va storto — rete, quota, risposta inattesa — si risponde
 * «non ho trovato», che è vero e utile, invece di un errore.
 */
async function chiediAlModello(q: string): Promise<EsitoOrientatore> {
  const elenco = elencoChiuso();
  try {
    const cliente = new Anthropic({ apiKey: serverEnv().anthropicApiKey });
    const risposta = await cliente.messages.parse({
      // Il livello leggero: il compito è scegliere da un elenco, non
      // ragionare. Ed è l'unico che possiamo permetterci su una pagina
      // pubblica, dove i visitatori non li decidiamo noi.
      model: "claude-haiku-4-5",
      max_tokens: 500,
      output_config: { format: zodOutputFormat(SchemaScelta) },
      messages: [
        {
          role: "user",
          content: [
            "Sei un indirizzatore per il sito di Verzero. Il visitatore ha scritto una frase; tu scegli quali elementi del sito gli sono utili.",
            "",
            "REGOLE, tassative:",
            "1. Scegli SOLO fra gli identificativi dell'elenco qui sotto. Un identificativo che non è nell'elenco non esiste.",
            "2. Al massimo TRE, dal più pertinente. Meglio uno solo che tre di cui due a caso.",
            "3. Se nessuno risponde DAVVERO alla frase, metti `nessunoPertinente` a true e lascia `scelti` vuoto. È la risposta giusta molto più spesso di quanto sembri: proporre qualcosa di plausibile che non c'entra è peggio che non proporre nulla.",
            "4. Non scrivere testo, non dare pareri, non spiegare norme, non promettere tempi o esiti. Il tuo unico compito è scegliere.",
            "",
            "L'ELENCO:",
            ...elenco.map((e) => `- ${e.id}: ${e.nome} — ${e.descrizione}`),
            "",
            `LA FRASE DEL VISITATORE: «${q}»`,
          ].join("\n"),
        },
      ],
    });

    const scelta = risposta.parsed_output;
    if (!scelta || scelta.nessunoPertinente) {
      return { risultati: [], situazioni: situazioniRiconosciute(q), via: "nessuna" };
    }

    const risultati = scelta.scelti
      .slice(0, MAX_RISULTATI)
      .map(risultatoDaId)
      // Un identificativo inventato non passa di qui: la garanzia non è
      // la buona volontà del modello, è che qui non trova corrispondenza.
      .filter((r): r is NonNullable<typeof r> => r !== null);

    return {
      risultati,
      situazioni: situazioniRiconosciute(q),
      via: risultati.length > 0 ? "modello" : "nessuna",
    };
  } catch {
    return { risultati: [], situazioni: situazioniRiconosciute(q), via: "nessuna" };
  }
}
