/**
 * CONSENSO AI COOKIE — modello condiviso fra client e server.
 *
 * Stato di fatto, e va detto per primo perché cambia tutto: oggi Ver0
 * NON installa cookie di misurazione né di marketing. Gli unici cookie
 * presenti sono quelli di sessione, necessari a tenerti dentro dopo
 * l'accesso, e per quelli la legge non chiede consenso — chiede di
 * spiegarli, e lo facciamo in /cookie-policy.
 *
 * Allora perché un banner? Perché il giorno in cui aggiungeremo una
 * statistica d'uso, il consenso dev'essere già raccolto e rispettato
 * PRIMA che quello script parta. La regola che questo modulo impone è
 * quella: nessuno script non essenziale può caricarsi senza un sì
 * esplicito, e finché non c'è una scelta le categorie non necessarie
 * valgono NO. Il rifiuto è la posizione di partenza, non una punizione.
 */

export const COOKIE_CONSENSO = "vz-consenso";
/** Sei mesi: oltre, si richiede — è la prassi consigliata dal Garante. */
export const DURATA_CONSENSO_GIORNI = 180;
/** Cambiare versione fa ripresentare il banner: si usa se cambiano le finalità. */
export const VERSIONE_CONSENSO = 1;

export type CategorieConsenso = {
  /** Sempre vere: senza, il servizio non funziona. Non sono negoziabili. */
  necessari: true;
  /** Statistiche d'uso aggregate. Nessuno strumento installato oggi. */
  misurazione: boolean;
  /** Pubblicità e profilazione. Nessuno strumento installato oggi. */
  marketing: boolean;
};

export type Consenso = {
  versione: number;
  categorie: CategorieConsenso;
  /** Quando è stata fatta la scelta: va conservato come prova. */
  scelto: string;
};

/** In assenza di scelta vale il NO su tutto ciò che non è necessario. */
export const CONSENSO_PREDEFINITO: CategorieConsenso = {
  necessari: true,
  misurazione: false,
  marketing: false,
};

export const CATEGORIE_DESCRITTE = [
  {
    chiave: "necessari" as const,
    titolo: "Necessari",
    testo:
      "Tengono aperta la tua sessione dopo l'accesso e proteggono i moduli dagli abusi. Senza questi non potresti restare dentro al portale.",
    esempi: "Cookie di sessione Supabase, memoria della scelta sui cookie.",
    obbligatorio: true,
  },
  {
    chiave: "misurazione" as const,
    titolo: "Misurazione d'uso",
    testo:
      "Servirebbero a capire quali pagine aiutano davvero e quali confondono, in forma aggregata.",
    esempi: "Nessuno strumento installato al momento.",
    obbligatorio: false,
  },
  {
    chiave: "marketing" as const,
    titolo: "Marketing e profilazione",
    testo:
      "Servirebbero a mostrarti annunci su altri siti o a misurarne il rendimento.",
    esempi: "Nessuno strumento installato al momento.",
    obbligatorio: false,
  },
];

/** Legge il consenso da una stringa di cookie. Non lancia mai. */
export function leggiConsenso(valore: string | undefined): Consenso | null {
  if (!valore) return null;
  try {
    const dati = JSON.parse(decodeURIComponent(valore)) as Consenso;
    if (dati.versione !== VERSIONE_CONSENSO) return null;
    if (!dati.categorie || typeof dati.categorie !== "object") return null;
    return {
      versione: dati.versione,
      scelto: dati.scelto,
      categorie: {
        necessari: true,
        misurazione: dati.categorie.misurazione === true,
        marketing: dati.categorie.marketing === true,
      },
    };
  } catch {
    return null;
  }
}

export function serializzaConsenso(categorie: CategorieConsenso): string {
  const consenso: Consenso = {
    versione: VERSIONE_CONSENSO,
    categorie: { ...categorie, necessari: true },
    scelto: new Date().toISOString(),
  };
  return encodeURIComponent(JSON.stringify(consenso));
}
