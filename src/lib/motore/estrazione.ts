import type { Forma, VoceLeggibile } from "./famiglie";
import {
  normalizzaCampi,
  normalizzaRighe,
  verificaGenerica,
  type CampoEstratto,
  type RigaEstratta,
} from "./plausibilita";
import {
  QUALITA,
  type CampoGrezzo,
  type EtichettaCampo,
  type Qualita,
  type RigaGrezza,
} from "./schemi";

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
      forma: Forma;
      /** Pieni nelle SCHEDE, vuoti nelle tabelle. */
      campi: CampoEstratto[];
      /** Piene nelle TABELLE, vuote nelle schede. */
      righe: RigaEstratta[];
      qualita: Qualita;
      /** I NOSTRI controlli: quello che non torna (§4, plausibilità). */
      avvisi: string[];
      /**
       * Quello che dichiara il DOCUMENTO e che il modello ha riportato:
       * conguagli, letture stimate, note di credito. Non è un difetto
       * della lettura ed è utile al cliente — per questo sta separato:
       * confonderlo coi nostri avvisi farebbe sembrare un problema una
       * riga che invece è informazione del documento.
       */
      avvertenze: string[];
      /**
       * Le note scritte a mano dal cliente sul documento: contenuto suo,
       * non nostro. Stanno separate dalle avvertenze perché in pagina si
       * mostrano come una citazione e non come un problema — la riga in
       * fondo a un registro che racconta come si è svolto il corso è
       * informazione, e finché stava fra gli avvisi di qualità sembrava
       * un difetto della lettura.
       */
      noteLibere: string[];
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

function descriviCampo(c: EtichettaCampo): string {
  const forma =
    c.tipo === "numero"
      ? c.unita
        ? ` (numero, in ${c.unita})`
        : " (numero)"
      : c.tipo === "data"
        ? " (data)"
        : c.tipo === "scelta"
          ? ` (uno fra: ${(c.valori ?? []).join(", ")})`
          : "";
  return `- \`${c.chiave}\` — ${c.etichetta}${forma}${c.essenziale ? " · essenziale" : ""}`;
}

/**
 * Le regole del §4 dette al modello, più quelle specifiche del tipo.
 *
 * Non sostituiscono i controlli lato server — un'istruzione è una
 * richiesta, non una garanzia — ma un modello a cui si chiede di lasciare
 * vuoto ciò che non vede lascia vuoto molto più spesso di uno a cui non
 * lo si chiede.
 *
 * Sono COMPOSTE, non scritte a mano una per tipo: l'elenco dei campi
 * viene dallo stesso dato che genera lo schema, quindi un campo aggiunto
 * allo schema compare nelle istruzioni senza che nessuno se ne ricordi.
 */
export function istruzioni(voce: VoceLeggibile, ctx: ContestoLettura): string {
  const tabella = voce.forma === "tabella";

  return [
    `Sei un estrattore di dati da documenti aziendali italiani. Il documento allegato dovrebbe essere: ${voce.nome}.`,
    "",
    tabella
      ? "Il documento è una TABELLA o un registro: restituisci in `righe` una riga per ogni voce che ci trovi, nell'ordine in cui compaiono. Ogni riga porta le sue celle, la sua confidenza e la pagina."
      : "Il documento è una SCHEDA: restituisci in `campi` un elemento per ciascuno dei campi elencati sotto, usando esattamente quei nomi.",
    "",
    "REGOLE, nell'ordine di importanza:",
    "1. NON INVENTARE MAI. Se un valore non è leggibile con certezza, lascialo come stringa VUOTA e scrivi in `nota` perché. Un campo vuoto è un esito corretto; un valore plausibile inventato è il danno peggiore che tu possa fare, perché finisce in un documento che l'impresa porta in banca.",
    tabella
      ? "2. PROVENIENZA SEMPRE. Per ogni riga indica la `pagina` (0 se non la sai) e in `estrattoDa` la riga ESATTA come appare sul documento, senza riformattarla."
      : "2. PROVENIENZA SEMPRE. Per ogni campo indica la `pagina` (0 se non la sai) e in `estrattoDa` la stringa ESATTA come compare nel documento, senza riformattarla.",
    tabella
      ? "3. CONFIDENZA PER RIGA, da 0 a 1, sincera. Se una sola cella è incerta, abbassa la confidenza della riga e DI' QUALE nella `nota`."
      : "3. CONFIDENZA PER CAMPO, da 0 a 1, sincera: 1 solo se il valore è scritto in chiaro e senza ambiguità. Se hai dedotto, calcolato o interpretato, scendi.",
    "4. `fonteLettura`: «testo» se il valore è testo del documento, «immagine» se l'hai letto da una pagina scansionata o fotografata, «manoscritto» se è scritto a mano — comprese le correzioni a penna sopra il prestampato. Non è un dettaglio: i valori manoscritti li trattiamo in modo diverso.",
    "5. FORMA DEI VALORI: i numeri col punto decimale e senza separatore di migliaia (12500 o 3187.45, mai 12.500 né 3.187,45); le date come AAAA-MM-GG. In `estrattoDa` invece resta la forma originale del documento.",
    "",
    tabella ? "LE COLONNE, coi loro nomi esatti:" : "I CAMPI, coi loro nomi esatti:",
    ...voce.campi.map(descriviCampo),
    ...(voce.istruzioni && voce.istruzioni.length > 0
      ? ["", "IN DETTAGLIO:", ...voce.istruzioni]
      : []),
    "",
    "PRIMA DI TUTTO:",
    `- \`tipoRilevato\`: «atteso» se il documento è davvero ${voce.nome}; «altro-documento-dello-stesso-genere» se è un documento simile ma non quello (per esempio una bolletta del gas al posto di una elettrica); «altro» in ogni altro caso. Se non è «atteso», scrivi in \`tipoEffettivo\` che cosa è, in poche parole, e non estrarre nulla: un'estrazione parziale da un documento sbagliato sembra un successo ed è l'errore più costoso.`,
    "- `qualita`: «leggibile», «faticosa» se la scansione o la grafia ti costringono a indovinare, «illeggibile» se non si legge. Su «illeggibile» non estrarre nulla.",
    "- `avvertenze`: quello che il documento dichiara e che chi lo legge deve sapere. Frasi brevi, in italiano.",
    "- `noteLibere`: le note che qualcuno ha SCRITTO sul documento — la riga in fondo a un registro, l'annotazione a margine. Riportale parola per parola, per quanto la grafia lo permette, senza riassumerle e senza commentarle: sono parole del cliente, non tue. Se il documento non ne ha, lascia l'elenco vuoto. Qui NON vanno le tue osservazioni sulla lettura: quelle sono `avvertenze`.",
    "",
    ctx.nativo
      ? "Questo PDF ha uno strato di testo: i valori dovrebbero essere leggibili in chiaro."
      : "Questo documento è una scansione o una fotografia: non ha testo selezionabile. Sii più prudente con la confidenza, e segnala la qualità se ti costringe a interpretare.",
    "",
    `L'anno di rendicontazione dell'impresa è ${ctx.annoRendicontazione}: non scartare un documento di un altro anno, estrailo comunque — al periodo pensiamo noi.`,
  ].join("\n");
}

/* ------------------------------------------------------------------ */
/* Dal grezzo all'esito — la parte che si prova                        */
/* ------------------------------------------------------------------ */

/**
 * Valida la risposta con lo schema, applica le correzioni globali
 * (manoscritto, qualità) e i controlli di plausibilità del tipo, e
 * restituisce l'esito. È indipendente dal fatto che la risposta sia stata
 * generata con vincolo di formato: il vincolo riduce gli errori di forma,
 * non li elimina, e non dice NULLA sulla plausibilità (§4.6).
 */
export function interpretaRisposta(
  grezzo: unknown,
  voce: VoceLeggibile,
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

  // ═══ Documento di un altro tipo (§4.5) ═══
  // Si dice, non si estrae quello che riesce: un'estrazione parziale da un
  // documento sbagliato è la forma più costosa di errore, perché sembra
  // un successo.
  if (dati.tipoRilevato !== "atteso") {
    const effettivo = String(dati.tipoEffettivo ?? "").trim();
    return {
      esito: "altro_tipo",
      tipoRilevato: effettivo || "altro",
      messaggio: effettivo
        ? `Questo non è ${voce.nome}: sembra ${effettivo}. Correggi il tipo del documento e lo leggiamo con lo schema giusto.`
        : `Questo non sembra essere ${voce.nome}. Correggi il tipo del documento: quello che è, lo sai tu meglio di noi.`,
    };
  }

  if (qualita === "illeggibile") {
    return {
      esito: "illeggibile",
      messaggio:
        "Non siamo riusciti a leggere questo documento. Se è una fotografia, rifalla con più luce e col documento disteso; se hai il PDF originale, quello si legge meglio di qualunque scansione.",
    };
  }

  const campi =
    voce.forma === "scheda"
      ? normalizzaCampi(
          (Array.isArray(dati.campi) ? dati.campi : []) as CampoGrezzo[],
          voce.campi,
          qualita,
        )
      : [];
  const righe =
    voce.forma === "tabella"
      ? normalizzaRighe(
          (Array.isArray(dati.righe) ? dati.righe : []) as RigaGrezza[],
          voce.campi,
          qualita,
        )
      : [];

  // I VINCOLI DICHIARATI girano sempre e per primi: valgono su ogni tipo
  // di documento di ogni ambito, presente e futuro. Il verificatore
  // proprio del tipo — se ce l'ha — aggiunge solo i ragionamenti che un
  // vincolo non sa esprimere.
  const contesto = {
    annoRendicontazione: ctx.annoRendicontazione,
    grezzo: dati,
    campi: voce.campi,
  };
  const generico = verificaGenerica(campi, righe, contesto);
  const proprio = voce.verifica?.(campi, righe, contesto);

  const avvisiDocumento = [
    ...generico.avvisiDocumento,
    ...(proprio?.avvisiDocumento ?? []),
  ];
  const fuoriPeriodo = generico.fuoriPeriodo || (proprio?.fuoriPeriodo ?? false);

  const righeDiTesto = (v: unknown) =>
    (Array.isArray(v) ? (v as unknown[]) : [])
      .map((a) => String(a).trim())
      .filter((a) => a.length > 0);

  const avvertenze = righeDiTesto(dati.avvertenze);
  const noteLibere = righeDiTesto(dati.noteLibere);

  // Niente di utile letto: dirlo è più onesto che mostrare una tabella di
  // caselle vuote e lasciare al cliente il compito di accorgersene.
  const vuoto =
    voce.forma === "scheda"
      ? voce.campi
          .filter((c) => c.essenziale)
          .every((c) => campi.find((x) => x.chiave === c.chiave)?.valore == null)
      : righe.length === 0;

  if (vuoto) {
    return {
      esito: "illeggibile",
      messaggio:
        voce.forma === "scheda"
          ? `Abbiamo letto il documento ma non ci abbiamo trovato i dati che servono. Controlla che sia ${voce.nome}, oppure inseriscili a mano.`
          : `Abbiamo letto il documento ma non ci abbiamo trovato nessuna riga utilizzabile. Controlla che sia ${voce.nome}, oppure inserisci i dati a mano.`,
    };
  }

  return {
    esito: "ok",
    forma: voce.forma,
    campi,
    righe,
    qualita,
    avvisi: avvisiDocumento,
    avvertenze,
    noteLibere,
    fuoriPeriodo,
  };
}

/* ------------------------------------------------------------------ */
/* Riepilogo per il portale                                            */
/* ------------------------------------------------------------------ */

/** Quanto è stato letto, e con quanta sicurezza. */
export function riepilogo(esito: {
  campi: CampoEstratto[];
  righe: RigaEstratta[];
}) {
  const unita: { confidenza: number; avvisi: string[] }[] = [
    ...esito.campi.filter((c) => c.valore !== null),
    ...esito.righe,
  ];
  const media =
    unita.length === 0
      ? 0
      : unita.reduce((t, c) => t + c.confidenza, 0) / unita.length;
  return {
    letti: unita.length,
    totali: esito.campi.length > 0 ? esito.campi.length : esito.righe.length,
    confidenzaMedia: Math.round(media * 100) / 100,
    daControllare: unita.filter((c) => c.confidenza < 0.7 || c.avvisi.length > 0)
      .length,
  };
}
