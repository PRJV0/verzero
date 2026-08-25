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
import {
  CAPACITA_DI_LIVELLO,
  MODELLO_DI_LIVELLO,
  livelloIniziale,
  manoscrittoAtteso,
  serveEscalation,
  type Livello,
} from "./livelli";
import type { VoceLeggibile } from "./famiglie";
import {
  interpretaRisposta,
  istruzioni,
  type ContestoLettura,
  type EsitoEstrazione,
  type Uso,
} from "./estrazione";
import { naturaPdf, testoDelPdf, type NaturaPdf } from "./pdf";

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

export type EsitoConUso = EsitoEstrazione & {
  uso?: Uso;
  natura?: NaturaPdf;
  /** Con quale livello si è letto, e se si è dovuto salire. */
  livello?: Livello;
  escalation?: { da: Livello; a: Livello; motivo: string };
};

export async function leggiDocumento(opzioni: {
  dati: Uint8Array;
  mime: string;
  voce: VoceLeggibile;
  annoRendicontazione: number;
  /** Solo per il confronto fra livelli: impone il livello e spegne
   *  l'escalation, così i numeri misurano un modello solo. */
  livelloForzato?: Livello;
  /** Solo per il confronto: manda il TESTO estratto in locale invece del
   *  documento, per misurare quanto si perde (pdf.ts). */
  soloTesto?: boolean;
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

  // ═══ QUALE MODELLO ═══ (livelli.ts). La variabile d'ambiente, se
  // valorizzata, vince su tutto: serve a bloccare un modello per un
  // confronto o per un incidente, e in quel caso l'escalation si spegne
  // — sarebbe una scelta che scavalca una scelta.
  const forzato =
    (opzioni.livelloForzato ? MODELLO_DI_LIVELLO[opzioni.livelloForzato] : null) ??
    extractionConfig().modelloForzato;
  const partenza: Livello =
    opzioni.livelloForzato ??
    livelloIniziale(voce, {
    nativo: natura.nativo,
      manoscrittoAtteso: manoscrittoAtteso(voce),
    });

  const contenuto = pdf && opzioni.soloTesto
    ? ([
        {
          type: "document" as const,
          source: {
            type: "text" as const,
            media_type: "text/plain" as const,
            data: testoDelPdf(dati),
          },
        },
        { type: "text" as const, text: istruzioni(voce, ctx) },
      ])
    : pdf
    ? ([
        {
          type: "document" as const,
          source: {
            type: "base64" as const,
            media_type: "application/pdf" as const,
            data: base64,
          },
        },
        { type: "text" as const, text: istruzioni(voce, ctx) },
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
        { type: "text" as const, text: istruzioni(voce, ctx) },
      ]);

  const cliente = new Anthropic({ apiKey: serverEnv().anthropicApiKey });

  /**
   * Una lettura con un livello. Il costo si somma su tutti i tentativi:
   * se si è saliti, la pratica ha pagato anche quello leggero, e il log
   * deve dirlo — altrimenti l'escalation sembrerebbe gratis.
   */
  const leggiCon = async (livello: Livello) => {
    const modello = forzato ?? MODELLO_DI_LIVELLO[livello];
    const inizio = Date.now();
    const puo = CAPACITA_DI_LIVELLO[livello];
    const risposta = await cliente.messages.parse({
      model: modello,
      max_tokens: config.maxTokens,
      // Dove il modello lo regge, il ragionamento resta attivo: su una
      // bolletta con conguagli, letture stimate e più POD nello stesso
      // documento la risposta giusta richiede di ragionare, non di
      // trascrivere. Al livello leggero chiediamo l'opposto — trascrivere
      // ciò che è scritto — e quel modello non accetta né ragionamento
      // adattivo né effort (livelli.ts).
      ...(puo.ragionamentoAdattivo ? { thinking: { type: "adaptive" as const } } : {}),
      output_config: {
        ...(puo.effort ? { effort: voce.effort ?? "medium" } : {}),
        format: zodOutputFormat(voce.schema),
      },
      messages: [{ role: "user", content: contenuto }],
    });

    const uso: Uso = {
      modello,
      tokenIngresso: risposta.usage.input_tokens,
      tokenUscita: risposta.usage.output_tokens,
      costoMicro: costoMicroDollari(
        modello,
        risposta.usage.input_tokens,
        risposta.usage.output_tokens,
      ),
      durataMs: Date.now() - inizio,
    };

    // Si valida COMUNQUE il risultato con lo schema, anche se è stato
    // generato con vincolo di formato: il vincolo riduce gli errori di
    // forma, non li elimina, e non dice niente sulla plausibilità.
    return { esito: interpretaRisposta(risposta.parsed_output, voce, ctx), uso };
  };

  try {
    let livello = partenza;
    let { esito, uso } = await leggiCon(livello);

    /* — L'escalation: costo pieno solo quando serve — */
    if (!forzato) {
      const salita = serveEscalation(livello, misura(esito, voce), esito.esito === "ok");
      if (salita.serve) {
        const secondo = await leggiCon(salita.verso);
        const sommato: Uso = {
          modello: secondo.uso.modello,
          tokenIngresso: uso.tokenIngresso + secondo.uso.tokenIngresso,
          tokenUscita: uso.tokenUscita + secondo.uso.tokenUscita,
          // Il tentativo buttato via si paga: il log lo dice, altrimenti
          // l'escalation sembrerebbe gratis e nessuno la taratura.
          costoMicro: uso.costoMicro + secondo.uso.costoMicro,
          durataMs: uso.durataMs + secondo.uso.durataMs,
        };
        return {
          ...secondo.esito,
          uso: sommato,
          natura,
          livello: salita.verso,
          escalation: { da: livello, a: salita.verso, motivo: salita.motivo },
        };
      }
    }

    return { ...esito, uso, natura, livello };
  } catch (errore) {
    return { ...traduciErrore(errore), natura, livello: partenza };
  }
}

/** Quanto è tornato da una lettura: è su questo che si decide se salire. */
function misura(esito: EsitoEstrazione, voce: VoceLeggibile) {
  if (esito.esito !== "ok") {
    return { letti: 0, attesi: 0, essenzialiMancanti: 0, confidenzaMedia: 0, conAvvisi: 0 };
  }
  const unita =
    esito.forma === "scheda"
      ? esito.campi.filter((c) => c.valore !== null)
      : esito.righe;
  const essenziali = voce.campi.filter((c) => c.essenziale);
  const essenzialiMancanti =
    esito.forma === "scheda"
      ? essenziali.filter(
          (e) => esito.campi.find((c) => c.chiave === e.chiave)?.valore == null,
        ).length
      : // In una tabella «essenziale» vale per riga: una riga senza le sue
        // colonne essenziali è una riga che non serve.
        esito.righe.filter((r) =>
          essenziali.some(
            (e) => r.celle.find((c) => c.chiave === e.chiave)?.valore == null,
          ),
        ).length;

  return {
    letti: unita.length,
    attesi: esito.forma === "scheda" ? voce.campi.length : esito.righe.length,
    essenzialiMancanti,
    confidenzaMedia:
      unita.length === 0
        ? 0
        : unita.reduce((t, u) => t + u.confidenza, 0) / unita.length,
    conAvvisi: unita.filter((u) => u.avvisi.length > 0).length,
  };
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
