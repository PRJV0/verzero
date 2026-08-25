/**
 * LE SCELTE RAPIDE sotto la barra in home — visibili da subito, non alla
 * comparsa dei risultati.
 *
 * ═══ PERCHÉ UN FILE DA SOLO ═══
 * Stavano in `orientatore.ts`, ed è il posto giusto per significato ma
 * quello sbagliato per il peso: importarle da lì trascina in home il
 * catalogo, le guide, il registro delle norme e il listino — tutto,
 * per cinque stringhe che si devono vedere prima di qualunque cosa.
 * Qui non c'è un import, quindi non c'è niente da trascinare. Il resto
 * dell'orientatore arriva quando qualcuno tocca il campo davvero
 * (`src/components/orientatore.tsx`).
 *
 * ═══ CHE MESTIERE FANNO ═══
 * Insegnano che cosa si può chiedere, e nel frattempo portano da
 * qualche parte. Perché insegnino, devono essere scritte come le
 * scriverebbe chi cerca: metà situazioni («me lo chiede la banca») e
 * metà nomi di cose («ISO 9001»), perché quelle sono le due lingue con
 * cui la gente arriva. Un elenco di soli nomi di servizio insegnerebbe
 * solo che qui si cercano nomi di servizio.
 *
 * ═══ L'ETICHETTA È LA RICERCA ═══
 * Non c'è un'etichetta breve che nasconde una frase lunga: quello che
 * si legge sul chip è esattamente quello che finisce nella barra. Un
 * chip che scrive nel campo qualcosa di diverso da sé insegna una cosa
 * falsa su come si usa il campo.
 *
 * Ognuna DEVE dare risultati, e `scripts/test-orientatore.mjs` lo
 * verifica: una scelta rapida che risponde «non abbiamo un percorso» è
 * il modo più rapido di far smettere di provare.
 *
 * ═══ L'ORDINE, E LA QUINTA ═══
 * L'ordine non è alfabetico né per importanza: prima le due situazioni,
 * poi le tre cose — ed è anche l'ordine in cui i chip vanno a capo bene
 * su DUE misure insieme, misurate in pagina e non stimate:
 *
 *   largo (576 px)  163 + 159 + 168 | 83 + 129   → tre più due
 *   stretto (335 px) 146 + 143 | 74 + 116        → due più due
 *
 * Il ritorno a capo è avido, quindi l'unica leva è l'ordine: con la più
 * lunga in coda la prima riga se ne prendeva quattro e la quinta
 * restava da sola, che è la cosa che fa sembrare storto un blocco
 * altrimenti a posto.
 *
 * Su schermo stretto se ne mostrano QUATTRO. Cinque etichette in
 * italiano su 375 pixel occupano tre righe, e tre righe di suggerimenti
 * sotto una barra di ricerca sono un elenco, non un suggerimento. La
 * quinta non sparisce dal codice — la nasconde il CSS — così non c'è
 * una scelta dopo l'idratazione e non c'è sfarfallio (regola
 * «adattare, non degradare»: stesso contenuto, due rese).
 */
export type SceltaRapida = {
  testo: string;
  /** Mostrata solo da `sm` in su: è la più lunga delle cinque. */
  soloLargo?: boolean;
};

export const SCELTE_RAPIDE: SceltaRapida[] = [
  { testo: "Me lo chiede la banca" },
  { testo: "Partecipo a un bando" },
  { testo: "Bilancio di sostenibilità", soloLargo: true },
  { testo: "ISO 9001" },
  { testo: "Carbon footprint" },
];
