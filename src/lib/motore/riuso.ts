/**
 * IL RIUSO — non rifare due volte la stessa cosa.
 *
 * ═══ DUE COSE DIVERSE, DA NON CONFONDERE MAI ═══
 *
 * 1. I TETTI DI SPESA (`tetti.ts`) sono un limite di budget, sono nostri
 *    e sono INVISIBILI al cliente.
 * 2. IL RIUSO, che sta qui, non è un limite: è una scelta di merito. Se
 *    nulla è cambiato dall'ultima versione, rigenerare produce lo stesso
 *    documento — e un'elaborazione che non cambia nulla è energia spesa
 *    per niente. Questo si dice, e si dice per quello che è.
 *
 * **Mai attribuire all'ambiente un limite che è di budget.** È la regola
 * che tiene onesto tutto il resto: se un domani un tetto di spesa venisse
 * raccontato come attenzione ambientale, il primo cliente che se ne
 * accorge avrebbe ragione a non credere più a nient'altro.
 *
 * ═══ QUANDO SI RIGENERA, SI RIGENERA E BASTA ═══
 * Se qualcosa è cambiato — dati confermati, documenti nuovi, una norma
 * aggiornata — la rigenerazione avviene senza obiezioni, senza messaggi e
 * senza chiedere conferma. Il riuso non è un attrito da mettere in mezzo
 * al lavoro: è una cortesia per il caso in cui il lavoro non c'è.
 */

/**
 * L'IMPRONTA di un elaborato: tutto ciò che, cambiando, cambierebbe il
 * risultato. Due impronte uguali significano due documenti identici, e
 * rigenerare sarebbe rifare lo stesso lavoro.
 *
 * Non è un hash del file prodotto — quello si conosce solo dopo averlo
 * prodotto, cioè dopo aver speso. È un hash degli INGRESSI.
 */
export type Impronta = {
  /** I dati confermati che entrano nel documento, e il loro contenuto. */
  dati: string;
  /** I documenti di origine, coi loro stati di lettura. */
  documenti: string;
  /** Le edizioni delle norme usate: se cambiano, il documento cambia. */
  norme: string;
  /** Il modello del documento: cambiarlo cambia l'elaborato. */
  modello: string;
};

/** L'impronta come stringa confrontabile. */
export function improntaTesto(i: Impronta): string {
  return [i.dati, i.documenti, i.norme, i.modello].join("|");
}

export type StatoRigenerazione = {
  /** L'impronta di adesso. */
  adesso: Impronta;
  /** L'impronta dell'ultima versione generata, se ce n'è una. */
  ultima: Impronta | null;
  /** Quando è stata generata l'ultima versione. */
  ultimaIl: Date | null;
  /** Quante versioni sono state generate nell'ultima ora. */
  versioniNellUltimaOra: number;
  /** Adesso, passato da fuori: le funzioni qui dentro restano pure. */
  ora: Date;
};

export type DecisioneRigenerazione =
  /** Nulla è cambiato: si riapre quello che c'è già. */
  | { azione: "riusa"; messaggio: string; motivo: string; ultimaIl: Date }
  /** Qualcosa è cambiato: si rigenera, senza obiezioni. */
  | { azione: "rigenera"; cambiato: string[] }
  /** Si rigenera, con un invito gentile a non farlo dieci volte di fila. */
  | { azione: "rigenera"; cambiato: string[]; avviso: string };

/** Quante versioni in un'ora prima di suggerire di prendere fiato. */
export const VERSIONI_RAVVICINATE = 3;

/**
 * Il messaggio del riuso, parola per parola.
 *
 * Sta qui e non nella pagina perché è un impegno, non una stringa: dice
 * al cliente perché non stiamo rifacendo il lavoro, e la ragione che dà
 * dev'essere quella vera. Accanto va SEMPRE il modo di generare comunque
 * una nuova versione — un riuso senza via d'uscita non è un riuso, è un
 * divieto.
 */
export const MESSAGGIO_RIUSO =
  "Nulla è cambiato dall'ultima versione: ti riapriamo il documento già generato. Ogni elaborazione ha un costo energetico e non ha senso spenderlo due volte per lo stesso risultato.";

/** L'invito gentile quando si rigenera molte volte in poco tempo. */
export const MESSAGGIO_CICLI_RAVVICINATI =
  "Hai generato questo documento più volte in poco tempo. Se stai ancora sistemando i dati, conviene finire le modifiche e generare una volta sola: il risultato è lo stesso e il lavoro è meno.";

/**
 * Che cosa è cambiato fra due impronte, in italiano. È il testo che
 * accompagna una rigenerazione: dire «rigenero» senza dire perché lascia
 * il cliente a chiedersi se serviva davvero.
 */
export function cosaECambiato(adesso: Impronta, ultima: Impronta): string[] {
  const cambiato: string[] = [];
  if (adesso.dati !== ultima.dati) cambiato.push("hai confermato dati nuovi");
  if (adesso.documenti !== ultima.documenti) {
    cambiato.push("sono arrivati o sono stati letti documenti nuovi");
  }
  if (adesso.norme !== ultima.norme) {
    cambiato.push("la norma di riferimento ha cambiato edizione");
  }
  if (adesso.modello !== ultima.modello) {
    cambiato.push("il modello del documento è stato aggiornato");
  }
  return cambiato;
}

/**
 * La decisione. Pura, e provata: è il punto in cui si decide se spendere.
 *
 * Nessuna versione precedente → si genera, senza discutere: la prima
 * volta non c'è niente da riusare.
 */
export function decidiRigenerazione(
  stato: StatoRigenerazione,
): DecisioneRigenerazione {
  const { adesso, ultima, ultimaIl } = stato;

  if (!ultima || !ultimaIl) return { azione: "rigenera", cambiato: [] };

  const cambiato = cosaECambiato(adesso, ultima);

  if (cambiato.length === 0) {
    return {
      azione: "riusa",
      messaggio: MESSAGGIO_RIUSO,
      motivo: `Ultima versione del ${ultimaIl.toLocaleDateString("it-IT", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })}.`,
      ultimaIl,
    };
  }

  // Qualcosa è cambiato: si rigenera. L'avviso sui cicli ravvicinati NON
  // è una condizione — non blocca, non chiede conferma, non rallenta.
  if (stato.versioniNellUltimaOra >= VERSIONI_RAVVICINATE) {
    return { azione: "rigenera", cambiato, avviso: MESSAGGIO_CICLI_RAVVICINATI };
  }
  return { azione: "rigenera", cambiato };
}

/* ------------------------------------------------------------------ */
/* Lo stesso principio, applicato alla LETTURA di un documento         */
/* ------------------------------------------------------------------ */

export type StatoRilettura = {
  /** L'ultima lettura riuscita, se c'è. */
  lettaIl: Date | null;
  /** La versione di schema con cui era stata letta. */
  versioneSchema: string | null;
  /** La versione di schema di adesso. */
  versioneAdesso: string;
  /** Quando il file è stato caricato o sostituito l'ultima volta. */
  documentoAggiornatoIl: Date | null;
};

export const MESSAGGIO_RILETTURA_INUTILE =
  "Questo documento l'abbiamo già letto e da allora non è cambiato: ti riapriamo i dati che ne avevamo ricavato. Ogni elaborazione ha un costo energetico e non ha senso spenderlo due volte per lo stesso risultato.";

/**
 * Rileggere lo stesso file con lo stesso schema restituisce gli stessi
 * dati. Non è un caso di scuola: è il doppio clic, è il ritorno sulla
 * pagina, è il ritentativo dopo un errore altrove.
 *
 * Si rilegge quando il file è cambiato, quando lo schema è cambiato, o
 * quando il cliente lo chiede espressamente — e allora si rilegge senza
 * obiezioni.
 */
export function serveRileggere(stato: StatoRilettura): {
  serve: boolean;
  messaggio?: string;
  motivo?: string;
} {
  if (!stato.lettaIl) return { serve: true, motivo: "mai letto" };
  if (stato.versioneSchema !== stato.versioneAdesso) {
    return { serve: true, motivo: "lo schema di lettura è cambiato" };
  }
  if (
    stato.documentoAggiornatoIl &&
    stato.documentoAggiornatoIl.getTime() > stato.lettaIl.getTime()
  ) {
    return { serve: true, motivo: "il file è stato sostituito" };
  }
  return { serve: false, messaggio: MESSAGGIO_RILETTURA_INUTILE };
}
