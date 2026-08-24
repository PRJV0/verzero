import "server-only";

import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";

import { serverEnv } from "@/lib/env";

import {
  MAX_BYTE_VERSO_API,
  MAX_PAGINE,
  costoMicroDollari,
  extractionConfig,
} from "./costi";
import type { VoceMotore } from "./famiglie";
import {
  interpretaRisposta,
  istruzioniBollettaElettrica,
  type ContestoLettura,
  type EsitoEstrazione,
  type Uso,
} from "./estrazione";
import { naturaPdf, type NaturaPdf } from "./pdf";

/**
 * LA CHIAMATA — l'unica parte che tocca la rete.
 *
 * Tutto ciò di cui ci fidiamo (validazione, plausibilità, confidenza) sta
 * in `estrazione.ts` ed è provabile senza rete. Qui c'è il resto: mettere
 * insieme i blocchi, chiamare, misurare, e tradurre un errore dell'API in
 * una frase che una persona può leggere.
 *
 * Il file si manda COSÌ COM'È (docs/motore.md §3): niente OCR nostro,
 * niente rasterizzazione nostra. Il rilevamento nativo/scansione serve a
 * trattare il risultato, non a decidere il modo di mandare.
 */

/** I formati immagine che l'API accetta. HEIC non è fra questi. */
const IMMAGINI_AMMESSE = ["image/jpeg", "image/png", "image/gif", "image/webp"] as const;

export type EsitoConUso = EsitoEstrazione & { uso?: Uso; natura?: NaturaPdf };

export async function leggiDocumento(opzioni: {
  dati: Uint8Array;
  mime: string;
  voce: VoceMotore;
  annoRendicontazione: number;
}): Promise<EsitoConUso> {
  const { dati, mime, voce, annoRendicontazione } = opzioni;
  const config = extractionConfig();

  /* — I limiti si controllano PRIMA di spendere — */
  if (dati.byteLength > MAX_BYTE_VERSO_API) {
    return {
      esito: "errore",
      messaggio:
        "Il file è troppo grande per essere letto. Se è una scansione, rifalla a risoluzione più bassa: per leggere una bolletta bastano 150 punti per pollice.",
    };
  }

  const pdf = mime === "application/pdf";
  if (!pdf && !IMMAGINI_AMMESSE.includes(mime as (typeof IMMAGINI_AMMESSE)[number])) {
    return {
      esito: "errore",
      messaggio:
        mime === "image/heic" || mime === "image/heif"
          ? "Le foto in formato HEIC (quello predefinito dell'iPhone) non le sappiamo ancora leggere. Riesporta la foto in JPEG, o carica il PDF del fornitore."
          : "Questo formato non lo sappiamo leggere. Accettiamo PDF, JPEG, PNG e WebP.",
    };
  }

  const natura: NaturaPdf = pdf
    ? naturaPdf(dati)
    : { pagine: 1, caratteriTesto: 0, nativo: false };

  if (natura.pagine > MAX_PAGINE) {
    return {
      esito: "errore",
      messaggio: `Questo documento ha ${natura.pagine} pagine: oltre ${MAX_PAGINE} non lo leggiamo in un colpo solo. Carica solo le pagine della bolletta.`,
      natura,
    };
  }

  const ctx: ContestoLettura = { annoRendicontazione, nativo: natura.nativo };
  const base64 = Buffer.from(dati).toString("base64");

  const contenuto = pdf
    ? ([
        {
          type: "document" as const,
          source: {
            type: "base64" as const,
            media_type: "application/pdf" as const,
            data: base64,
          },
        },
        { type: "text" as const, text: istruzioniBollettaElettrica(ctx) },
      ])
    : ([
        {
          type: "image" as const,
          source: {
            type: "base64" as const,
            media_type: mime as "image/jpeg" | "image/png" | "image/gif" | "image/webp",
            data: base64,
          },
        },
        { type: "text" as const, text: istruzioniBollettaElettrica(ctx) },
      ]);

  const cliente = new Anthropic({ apiKey: serverEnv().anthropicApiKey });
  const inizio = Date.now();

  try {
    const risposta = await cliente.messages.parse({
      model: config.model,
      max_tokens: config.maxTokens,
      // Il ragionamento resta attivo: su una bolletta con conguagli,
      // letture stimate e più POD nello stesso documento la risposta
      // giusta richiede di ragionare, non di trascrivere. L'intensità la
      // governa l'effort (docs/motore.md §9).
      thinking: { type: "adaptive" },
      output_config: {
        effort: voce.effort,
        format: zodOutputFormat(voce.schema),
      },
      messages: [{ role: "user", content: contenuto }],
    });

    const uso: Uso = {
      modello: config.model,
      tokenIngresso: risposta.usage.input_tokens,
      tokenUscita: risposta.usage.output_tokens,
      costoMicro: costoMicroDollari(
        config.model,
        risposta.usage.input_tokens,
        risposta.usage.output_tokens,
      ),
      durataMs: Date.now() - inizio,
    };

    // Si valida COMUNQUE il risultato con lo schema, anche se è stato
    // generato con vincolo di formato: il vincolo riduce gli errori di
    // forma, non li elimina, e non dice niente sulla plausibilità.
    const esito = interpretaRisposta(risposta.parsed_output, voce, ctx);
    return { ...esito, uso, natura };
  } catch (errore) {
    return { ...traduciErrore(errore), natura };
  }
}

/**
 * Un errore dell'API in una frase leggibile. Il dettaglio tecnico va nel
 * log, non addosso al cliente — ma nemmeno un «qualcosa è andato storto»
 * che non dice se riprovare abbia senso.
 */
function traduciErrore(errore: unknown): EsitoEstrazione {
  const stato =
    errore instanceof Anthropic.APIError ? errore.status : undefined;

  if (stato === 429) {
    return {
      esito: "errore",
      messaggio:
        "In questo momento stiamo leggendo troppi documenti insieme. Riprova fra qualche minuto: il file resta in archivio.",
    };
  }
  if (stato !== undefined && stato >= 500) {
    return {
      esito: "errore",
      messaggio:
        "La lettura non è riuscita per un problema temporaneo. Riprova fra poco; il documento è al sicuro in archivio.",
    };
  }
  if (stato === 400) {
    return {
      esito: "errore",
      messaggio:
        "Questo documento non è stato accettato per la lettura. Se è una scansione molto grande, riprova con una risoluzione più bassa.",
    };
  }
  return {
    esito: "errore",
    messaggio:
      "Non siamo riusciti a leggere il documento. Riprova: se succede ancora, scrivici e ce ne occupiamo noi.",
  };
}
