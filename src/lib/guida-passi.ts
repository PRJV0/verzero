/**
 * LA GUIDA IN CINQUE PASSI — fonte unica.
 *
 * La legge la sezione completa in `/come-funziona` e la versione ridotta
 * in home, che mostra i soli titoli. Due elenchi sarebbero due percorsi
 * diversi alla prima revisione, e il passo che cambia in una pagina e non
 * nell'altra è esattamente il genere di incoerenza che nessuno nota.
 *
 * ═══ COSA SUCCEDE, MAI COME LO FACCIAMO ═══
 * Ogni riga descrive quello che vede e fa il CLIENTE. Non ci va — e va
 * tolto se qualcuno ce lo mette — niente di questo:
 *   · quali documenti servono per quale norma;
 *   · come si estrae un dato, con che modello, con quali soglie;
 *   · quali banche dati interroghiamo e come;
 *   · quali sezioni di un elaborato alimenta un documento.
 * Il criterio è quello di CLAUDE.md, «metodo sì, mappature no»: se una
 * riga permette di ricostruire come si assembla un percorso, non va in
 * pagina. Le checklist precise vivono nel portale, dopo l'attivazione.
 *
 * ═══ NESSUNA PROMESSA DI TEMPI ═══
 * In nessun passo. Né «in pochi minuti», né «in giorni», né «subito»:
 * ogni numero promesso è un ostaggio (SPEC §12.O), e qui la tentazione è
 * fortissima perché una sequenza di passi sembra chiedere una durata.
 * Non la chiede.
 *
 * ═══ UNA RIGA SOLA ═══
 * Titolo breve e una riga di testo, non due. Un passo che ha bisogno di
 * due frasi è un passo che non è stato capito abbastanza.
 */

export type Passo = {
  /** Il numero, che è anche l'ordine e la fetta di scorrimento. */
  n: 1 | 2 | 3 | 4 | 5;
  titolo: string;
  /** Una riga. Una. */
  riga: string;
};

export const PASSI: Passo[] = [
  {
    n: 1,
    titolo: "Dici cosa ti serve",
    riga: "Scrivi la tua situazione con parole tue, e ti rispondono i percorsi che c'entrano davvero.",
  },
  {
    n: 2,
    titolo: "Scegli il tuo percorso",
    riga: "Prezzo e perimetro sono scritti prima di attivare: sai cosa comprende e cosa no.",
  },
  {
    n: 3,
    titolo: "Entri e trovi il lavoro già fatto",
    riga: "Il documento ti aspetta già in buona parte compilato, con quanto manca in chiaro.",
  },
  {
    n: 4,
    titolo: "Confermi e completi",
    riga: "Controlli i dati proposti e porti quello che manca: a ogni conferma l'anello sale.",
  },
  {
    n: 5,
    titolo: "Ricevi",
    riga: "Il documento finito, il Sigillo da esporre e il Kit per raccontarlo a chi te l'ha chiesto.",
  },
];
