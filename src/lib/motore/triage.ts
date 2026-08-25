import { z } from "zod";

import { REGISTRO_MOTORE } from "./famiglie";

/**
 * IL TRIAGE — si guarda che cos'è, prima di leggerlo.
 *
 * ═══ PERCHÉ UN GRADINO IN PIÙ ═══
 * I clienti caricheranno documenti sbagliati. Non per distrazione:
 * perché «porta quello che hai» è un invito, e chi lo accoglie porta
 * anche quello che non serve. Senza un primo sguardo, ogni documento
 * inatteso costa una lettura intera per scoprire che non andava letto —
 * e, peggio, viene LETTO prima che qualcuno decida se andava letto.
 *
 * Due esiti fermano tutto, e sono diversi fra loro:
 *
 *   NON PERTINENTE — non alimenta nessun percorso attivo. Si archivia,
 *                    si dice con garbo, non si estrae. È un risparmio e
 *                    insieme una minimizzazione: dati non trattati
 *                    perché non servivano.
 *
 *   DATI PARTICOLARI — contiene con buona probabilità dati sanitari,
 *                    giudiziari, biometrici o altri dati dell'art. 9
 *                    GDPR. Qui **la pertinenza non conta**: non si legge
 *                    mai, nemmeno se il documento servisse. Non è una
 *                    scelta di prudenza commerciale — è che quei dati
 *                    non ci servono, e trattarli senza che servano non
 *                    ha una base per esistere.
 *
 * ═══ DEL CONTENUTO NON RESTA NIENTE ═══
 * Il triage restituisce una CATEGORIA e un esito, non un testo. Nel log
 * tecnico finisce che ci siamo fermati e perché; il documento non viene
 * copiato, riassunto o citato da nessuna parte. È la differenza fra
 * registrare una decisione e conservare un dato.
 */

/* ------------------------------------------------------------------ */
/* Le categorie                                                        */
/* ------------------------------------------------------------------ */

/**
 * Le categorie dell'art. 9 che ci possono davvero arrivare, più
 * l'identità — che l'art. 9 non elenca ma che porta con sé un documento
 * di riconoscimento, cioè esattamente ciò che non ci serve mai.
 */
export const CATEGORIE_PARTICOLARI = [
  "nessuna",
  "salute",
  "giudiziari",
  "biometrici",
  "identita",
  "altro-art9",
] as const;

export type CategoriaParticolare = (typeof CATEGORIE_PARTICOLARI)[number];

/** Come si chiama davanti al cliente, senza gergo e senza allarmismo. */
export const NOME_CATEGORIA: Record<CategoriaParticolare, string> = {
  nessuna: "",
  salute: "dati sulla salute",
  giudiziari: "dati giudiziari",
  biometrici: "dati biometrici",
  identita: "un documento d'identità",
  "altro-art9": "dati personali particolari",
};

/* ------------------------------------------------------------------ */
/* Lo schema del primo sguardo                                         */
/* ------------------------------------------------------------------ */

const CHIAVI_TIPO = ["altro", ...REGISTRO_MOTORE.map((v) => v.tipo)] as [
  string,
  ...string[],
];

/**
 * Volutamente minuscolo: quattro campi e nessun testo libero se non una
 * riga. Il triage deve costare il meno possibile — è il gradino che si
 * paga su OGNI documento, compresi quelli buoni.
 */
export const SchemaTriage = z.object({
  /** Che documento sembra, scelto fra quelli che conosciamo. */
  tipoProbabile: z.enum(CHIAVI_TIPO),
  /** Contiene, con buona probabilità, dati dell'art. 9 GDPR. */
  datiParticolari: z.boolean(),
  categoria: z.enum(CATEGORIE_PARTICOLARI),
  /** Si legge abbastanza da poterne ricavare qualcosa. */
  leggibile: z.boolean(),
});

export type Triage = z.infer<typeof SchemaTriage>;

/**
 * Le istruzioni del triage.
 *
 * Due cose sole, e nessuna estrazione: che documento è, e se contiene
 * roba che non dobbiamo trattare. Si chiede esplicitamente di NON
 * riportare contenuto — nemmeno un esempio, nemmeno una riga — perché
 * ciò che il modello scrive finisce nel nostro log.
 */
export function istruzioniTriage(tipiPertinenti: string[]): string {
  return [
    "Guarda il documento allegato e dimmi due cose. NON estrarre dati, NON riassumere, NON riportare frasi del documento: serve solo la classificazione.",
    "",
    "1. `tipoProbabile`: che tipo di documento è, scelto SOLO fra questi identificativi. Se non è nessuno di questi, rispondi «altro».",
    ...REGISTRO_MOTORE.map((v) => `   - ${v.tipo}: ${v.nome}`),
    "",
    "2. `datiParticolari` e `categoria`: il documento contiene, con buona probabilità, dati personali particolari ai sensi dell'articolo 9 del GDPR?",
    "   - «salute»: certificati medici, referti, visite di idoneità, infortuni con diagnosi, sorveglianza sanitaria, dati sulle condizioni dei lavoratori.",
    "   - «giudiziari»: casellario, carichi pendenti, procedimenti penali.",
    "   - «biometrici»: impronte, riconoscimento facciale, dati usati per identificare una persona.",
    "   - «identita»: carte d'identità, passaporti, patenti, permessi di soggiorno.",
    "   - «altro-art9»: convinzioni religiose o politiche, appartenenza sindacale, origine etnica, vita sessuale.",
    "   - «nessuna»: nient'altro di tutto questo.",
    "",
    "   Nel dubbio, DÌ DI SÌ. Un documento fermato per sbaglio costa al cliente un clic; un documento con dati sanitari che passa è un problema che non si ripara.",
    "   Attenzione: un elenco di addetti per genere e inquadramento NON è un dato particolare, e nemmeno un registro di formazione sulla sicurezza. Lo diventa se compaiono diagnosi, idoneità mediche o certificati.",
    "",
    "3. `leggibile`: si legge abbastanza da poterne ricavare qualcosa?",
    "",
    `Contesto: questa impresa sta lavorando su documenti di questo genere — ${tipiPertinenti.length > 0 ? tipiPertinenti.join(", ") : "nessun percorso attivo"}. Ti serve solo a interpretare meglio, non a compiacere: se il documento è altro, dillo.`,
  ].join("\n");
}

/* ------------------------------------------------------------------ */
/* La decisione                                                        */
/* ------------------------------------------------------------------ */

export type Decisione =
  | { azione: "procedi" }
  | {
      azione: "dati-particolari";
      categoria: CategoriaParticolare;
      messaggio: string;
    }
  | { azione: "non-pertinente"; messaggio: string }
  | { azione: "illeggibile"; messaggio: string };

/**
 * IL MESSAGGIO SUI DATI PARTICOLARI, parola per parola.
 *
 * Dice tre cose e in quest'ordine: che cosa abbiamo visto, che non lo
 * trattiamo, e che cosa fare adesso. Non dà del distratto a nessuno —
 * chi carica un certificato medico insieme ai registri di formazione sta
 * facendo il suo lavoro, non un errore — e non allude a conseguenze.
 */
export function messaggioDatiParticolari(categoria: CategoriaParticolare): string {
  const cosa = NOME_CATEGORIA[categoria];
  return (
    `Questo documento sembra contenere ${cosa || "dati personali particolari"}: ` +
    "sono dati che non ci servono e che preferiamo non trattare. " +
    "Non l'abbiamo letto e non ne conserviamo il contenuto. Rimuovilo dall'archivio: " +
    "se ti serve per un adempimento, tienilo dove lo tieni di solito."
  );
}

/**
 * La decisione del triage. Pura: riceve il verdetto del primo sguardo e
 * i tipi che servono ai percorsi attivi, e dice se si va avanti.
 *
 * ═══ L'ORDINE NON È CASUALE ═══
 * I dati particolari si guardano PER PRIMI, prima ancora della
 * leggibilità e della pertinenza. Un certificato medico pertinente resta
 * un certificato medico; un certificato medico illeggibile pure. Mettere
 * quel controllo in fondo significherebbe che basta un documento storto
 * per saltarlo.
 */
export function decidiTriage(
  triage: Triage,
  tipiPertinenti: string[],
): Decisione {
  if (triage.datiParticolari || triage.categoria !== "nessuna") {
    // Basta uno dei due segnali: un modello che dice «sì» e poi «nessuna»
    // si sta contraddicendo, e nel dubbio ci si ferma.
    const categoria =
      triage.categoria !== "nessuna" ? triage.categoria : "altro-art9";
    return {
      azione: "dati-particolari",
      categoria,
      messaggio: messaggioDatiParticolari(categoria),
    };
  }

  if (!triage.leggibile) {
    return {
      azione: "illeggibile",
      messaggio:
        "Non siamo riusciti a leggere questo documento. Se è una fotografia, rifalla con più luce e col foglio disteso; se hai il PDF originale, quello si legge meglio di qualunque scansione.",
    };
  }

  if (!tipiPertinenti.includes(triage.tipoProbabile)) {
    return {
      azione: "non-pertinente",
      messaggio: messaggioNonPertinente(triage.tipoProbabile),
    };
  }

  return { azione: "procedi" };
}

/**
 * Il messaggio della non pertinenza.
 *
 * Il tono è quello di chi conserva, non di chi respinge: il documento
 * resta in archivio, e se un domani il cliente attiva il percorso che lo
 * usa se lo ritrova già lì. Dire «non serve» e basta farebbe pensare a
 * un errore suo.
 */
export function messaggioNonPertinente(tipoProbabile: string): string {
  const voce = REGISTRO_MOTORE.find((v) => v.tipo === tipoProbabile);
  const cosa = voce ? `una ${voce.nome}` : "un documento";
  return (
    `Sembra ${cosa}, e non serve ai percorsi che hai attivi: l'abbiamo archiviato ` +
    "senza leggerlo. Puoi lasciarlo lì — se un giorno attivi un percorso che lo " +
    "usa lo troviamo già pronto — oppure rimuoverlo, se l'hai caricato per sbaglio."
  );
}

/* ------------------------------------------------------------------ */
/* Quando il triage si può saltare                                     */
/* ------------------------------------------------------------------ */

/**
 * Il triage costa, e si paga su ogni documento: vale la pena saltarlo
 * dove non aggiunge nulla.
 *
 * Si salta SOLO quando lo stesso documento è già passato di qui — stesso
 * file, già guardato — perché ripeterlo darebbe la stessa risposta. Non
 * si salta mai perché il cliente ha dichiarato il tipo: una dichiarazione
 * dice che cosa il cliente CREDE di aver caricato, e un certificato
 * medico finito per sbaglio in mezzo ai registri porta il nome del file
 * sbagliato quanto il resto.
 */
export function serveTriage(giaFatto: {
  esito: string | null;
  quando: Date | null;
  documentoAggiornatoIl: Date | null;
}): boolean {
  if (!giaFatto.esito || !giaFatto.quando) return true;
  if (
    giaFatto.documentoAggiornatoIl &&
    giaFatto.documentoAggiornatoIl.getTime() > giaFatto.quando.getTime()
  ) {
    return true;
  }
  return false;
}
