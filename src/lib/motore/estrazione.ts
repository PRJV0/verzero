import type { VoceMotore } from "./famiglie";
import {
  normalizzaCampi,
  verificaBollettaElettrica,
  type CampoEstratto,
} from "./plausibilita";
import { QUALITA, type CampoGrezzo, type Qualita } from "./schemi";

/**
 * L'ESTRAZIONE — la parte che si può provare senza rete.
 *
 * Il file è diviso in due metà per una ragione precisa: la logica di cui
 * ci fidiamo — validazione, plausibilità, confidenza — non deve dipendere
 * da una chiamata di rete per essere verificata. Qui sta quella metà, ed è
 * pura: riceve un oggetto grezzo e restituisce un esito. Le prove le
 * danno da mangiare risposte simulate, comprese quelle storte
 * (`scripts/test-motore.mjs`).
 *
 * La metà che parla con l'API sta in `chiamata.ts`.
 */

export type Uso = {
  modello: string;
  tokenIngresso: number;
  tokenUscita: number;
  costoMicro: number;
  durataMs: number;
};

export type EsitoEstrazione =
  | {
      esito: "ok";
      campi: CampoEstratto[];
      qualita: Qualita;
      /** I NOSTRI controlli: quello che non torna (§4, plausibilità). */
      avvisi: string[];
      /**
       * Quello che dichiara il DOCUMENTO e che il modello ha riportato:
       * conguagli, letture stimate, note di credito. Non è un difetto
       * della lettura ed è utile al cliente — per questo sta separato:
       * confonderlo coi nostri avvisi farebbe sembrare un problema una
       * riga che invece è informazione della bolletta.
       */
      avvertenze: string[];
      fuoriPeriodo: boolean;
    }
  /** Il documento è di un altro tipo: non lo si legge col prompt sbagliato. */
  | { esito: "altro_tipo"; tipoRilevato: string; messaggio: string }
  /** Non si legge: si dice cosa fare, non si estrae quel che capita. */
  | { esito: "illeggibile"; messaggio: string }
  /** La risposta non rispetta lo schema: è un difetto nostro, va visto. */
  | { esito: "non_valido"; messaggio: string; grezzo: unknown }
  | { esito: "errore"; messaggio: string };

export type ContestoLettura = {
  annoRendicontazione: number;
  /** Dal rilevamento locale: cambia l'attesa, non il modo di mandare. */
  nativo: boolean;
};

/* ------------------------------------------------------------------ */
/* Le istruzioni                                                       */
/* ------------------------------------------------------------------ */

/**
 * Le regole del §4 dette al modello. Non sostituiscono i controlli lato
 * server — un'istruzione è una richiesta, non una garanzia — ma un modello
 * a cui si chiede di lasciare vuoto ciò che non vede lascia vuoto molto
 * più spesso di uno a cui non lo si chiede.
 */
export function istruzioniBollettaElettrica(ctx: ContestoLettura): string {
  return [
    "Sei un estrattore di dati da bollette di energia elettrica italiane.",
    "Leggi il documento allegato e compila lo schema richiesto.",
    "",
    "In `campi` metti un elemento per ciascuno dei campi elencati sotto, usando esattamente quei nomi.",
    "",
    "REGOLE, nell'ordine di importanza:",
    "1. NON INVENTARE MAI. Se un valore non è leggibile con certezza, lascia `valore` come stringa VUOTA e scrivi in `nota` perché. Un campo vuoto è un esito corretto; un valore plausibile inventato è il danno peggiore che tu possa fare, perché finisce in un documento che l'impresa porta in banca.",
    "2. PROVENIENZA SEMPRE. Per ogni campo indica la `pagina` (0 se non la sai) e in `estrattoDa` la stringa ESATTA come compare nel documento, senza riformattarla.",
    "3. CONFIDENZA PER CAMPO, da 0 a 1, sincera: 1 solo se il valore è scritto in chiaro e senza ambiguità. Se hai dedotto, calcolato o interpretato, scendi.",
    "4. `fonteLettura`: «testo» se il valore è testo del documento, «immagine» se l'hai letto da una pagina scansionata o fotografata, «manoscritto» se è scritto a mano — comprese le correzioni a penna sopra il prestampato.",
    "5. FORMA DEI VALORI: i numeri col punto decimale e senza separatore di migliaia (12500 o 3187.45, mai 12.500 né 3.187,45); le date come AAAA-MM-GG. In `estrattoDa` invece resta la forma originale del documento.",
    "",
    "I CAMPI, coi loro nomi esatti:",
    "- `pod`: il codice POD del punto di prelievo (forma IT + 3 cifre + E + 8 caratteri). Non confonderlo col PDR, che è del gas.",
    "- `consumoTotaleKwh`: il consumo FATTURATO del periodo in kWh. NON la potenza impegnata, NON la potenza disponibile, NON il consumo annuo di riferimento.",
    "- `consumoF1Kwh`, `consumoF2Kwh`, `consumoF3Kwh`: i consumi per fascia oraria, se il documento li espone. Se espone solo il totale, lascia le fasce vuote: non ripartirle tu.",
    "- `importoEuro`: il totale da pagare della bolletta, IVA compresa.",
    "- `energiaRinnovabile`: esattamente uno fra «si», «no», «non-dichiarato». «si» SOLO se il documento dichiara esplicitamente energia 100% rinnovabile o Garanzia d'Origine; «no» solo se dichiara esplicitamente il contrario. In assenza di dichiarazione: «non-dichiarato».",
    "- `piuPod`: true se il documento contiene più punti di prelievo, perché in quel caso i totali non sono di un contatore solo.",
    "- `avvertenze`: conguagli, letture stimate anziché effettive, note di credito, periodi doppi. Frasi brevi, in italiano.",
    "",
    "PRIMA DI TUTTO:",
    "- `tipoRilevato`: che documento è DAVVERO. Se non è una bolletta elettrica dillo qui e lascia tutti i valori vuoti — non estrarre quello che capita da un documento di altro tipo.",
    "- `qualita`: «leggibile», «faticosa» se la scansione costringe a indovinare, «illeggibile» se non si legge. Su «illeggibile» lascia tutti i valori vuoti.",
    "",
    ctx.nativo
      ? "Questo PDF ha uno strato di testo: i valori dovrebbero essere leggibili in chiaro."
      : "Questo documento è una scansione o una fotografia: non ha testo selezionabile. Sii più prudente con la confidenza e segnala la qualità se ti costringe a interpretare.",
    "",
    `L'anno di rendicontazione dell'impresa è ${ctx.annoRendicontazione}: non scartare un documento di un altro anno, estrailo comunque — al periodo pensiamo noi.`,
  ].join("\n");
}

/* ------------------------------------------------------------------ */
/* Dal grezzo all'esito — la parte che si prova                        */
/* ------------------------------------------------------------------ */

/**
 * Valida la risposta con lo schema, applica le correzioni globali
 * (manoscritto, qualità) e i controlli di plausibilità, e restituisce
 * l'esito. È indipendente dal fatto che la risposta sia stata generata con
 * vincolo di formato: il vincolo riduce gli errori di forma, non li
 * elimina, e non dice NULLA sulla plausibilità (docs/motore.md §4.6).
 */
export function interpretaRisposta(
  grezzo: unknown,
  voce: VoceMotore,
  ctx: ContestoLettura,
): EsitoEstrazione {
  const letto = voce.schema.safeParse(grezzo);
  if (!letto.success) {
    return {
      esito: "non_valido",
      messaggio:
        "La lettura non ha restituito i dati nella forma attesa. Il documento resta in archivio: riprova, e se succede ancora scrivici.",
      grezzo,
    };
  }

  const dati = letto.data as Record<string, unknown>;

  const qualita = QUALITA.includes(dati.qualita as Qualita)
    ? (dati.qualita as Qualita)
    : "faticosa";
  const tipoRilevato = String(dati.tipoRilevato ?? "altro");

  // ═══ Documento di un altro tipo (§4.5) ═══
  // Si dice, non si estrae quello che riesce: un'estrazione parziale da un
  // documento sbagliato è la forma più costosa di errore, perché sembra un
  // successo.
  if (tipoRilevato !== voce.tipo) {
    return {
      esito: "altro_tipo",
      tipoRilevato,
      messaggio:
        tipoRilevato === "bolletta-gas"
          ? "Questa è una bolletta del gas, non dell'energia elettrica. Correggi il tipo del documento e la leggiamo con lo schema giusto."
          : `Questo non sembra essere una ${voce.nome}. Correggi il tipo del documento: quello che è, lo sai tu meglio di noi.`,
    };
  }

  if (qualita === "illeggibile") {
    return {
      esito: "illeggibile",
      messaggio:
        "Non siamo riusciti a leggere questo documento. Se è una fotografia, rifalla con più luce e col documento disteso; se hai il PDF originale del fornitore, quello si legge meglio di qualunque scansione.",
    };
  }

  const campi = normalizzaCampi(
    (Array.isArray(dati.campi) ? dati.campi : []) as CampoGrezzo[],
    voce.campi,
    qualita,
  );
  const { avvisiDocumento, fuoriPeriodo } = verificaBollettaElettrica(campi, {
    annoRendicontazione: ctx.annoRendicontazione,
    piuPod: dati.piuPod === true,
  });

  const avvertenze = (
    Array.isArray(dati.avvertenze) ? (dati.avvertenze as unknown[]) : []
  )
    .map((a) => String(a).trim())
    .filter((a) => a.length > 0);

  // Nessun campo essenziale letto: la lettura non è servita a niente, e
  // dirlo è più utile che mostrare una tabella di caselle vuote.
  const essenziali = voce.campi.filter((c) => c.essenziale).map((c) => c.chiave);
  const nessunEssenziale = essenziali.every(
    (k) => campi.find((c) => c.chiave === k)?.valore == null,
  );
  if (nessunEssenziale) {
    return {
      esito: "illeggibile",
      messaggio:
        "Abbiamo letto il documento ma non ci abbiamo trovato nessuno dei dati che servono — né il POD, né il periodo, né il consumo. Controlla che sia la bolletta giusta, o inseriscili a mano.",
    };
  }

  return {
    esito: "ok",
    campi,
    qualita,
    avvisi: avvisiDocumento,
    avvertenze,
    fuoriPeriodo,
  };
}

/* ------------------------------------------------------------------ */
/* Riepilogo per il portale                                            */
/* ------------------------------------------------------------------ */

/** Quanti campi sono stati letti, e con quanta sicurezza media. */
export function riepilogo(campi: CampoEstratto[]) {
  const pieni = campi.filter((c) => c.valore !== null);
  const media =
    pieni.length === 0
      ? 0
      : pieni.reduce((t, c) => t + c.confidenza, 0) / pieni.length;
  return {
    letti: pieni.length,
    totali: campi.length,
    confidenzaMedia: Math.round(media * 100) / 100,
    daControllare: pieni.filter((c) => c.confidenza < 0.7 || c.avvisi.length > 0).length,
  };
}
