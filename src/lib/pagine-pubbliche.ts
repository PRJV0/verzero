/**
 * LE PAGINE PUBBLICHE — fonte unica di sitemap e llms.txt.
 *
 * Erano due elenchi: uno dentro `sitemap.ts` e uno che stava per nascere
 * dentro `llms.txt`. Due elenchi della stessa cosa divergono alla prima
 * pagina nuova, e il secondo a divergere è sempre quello che nessuno
 * guarda. Qui stanno insieme, con la riga di descrizione che serve a
 * llms.txt e i parametri che servono alla sitemap.
 *
 * Le pagine transazionali (/acquista, /login, /dashboard) NON stanno qui:
 * restano fuori da sitemap, da llms.txt e dall'indice (v. `robots.ts`).
 *
 * LA RIGA DI DESCRIZIONE si scrive per essere letta FUORI dal sito: deve
 * reggere da sola, dentro una risposta generata, senza il contesto della
 * pagina attorno. Quindi soggetto esplicito e nessun rimando implicito.
 */

export type PaginaPubblica = {
  path: string;
  /** Come si chiama la pagina in un indice, non il suo <title>. */
  titolo: string;
  /** Una riga, autoconclusiva: finirà dentro llms.txt. */
  riga: string;
  priorita: number;
  frequenza: "weekly" | "monthly" | "yearly";
};

export const PAGINE_PUBBLICHE: PaginaPubblica[] = [
  {
    path: "/",
    titolo: "Home",
    riga: "Che cos'è Verzero, a chi si rivolge e il principio dello Zero su cui è costruito il servizio.",
    priorita: 1,
    frequenza: "weekly",
  },
  {
    path: "/servizi",
    titolo: "Servizi e prezzi",
    riga: "Il catalogo completo dei percorsi di qualifica d'impresa, con il prezzo pubblico di ciascuno per fascia dimensionale.",
    priorita: 0.9,
    frequenza: "weekly",
  },
  {
    path: "/come-funziona",
    titolo: "Come funziona",
    riga: "Il metodo fase per fase: cosa porta l'impresa, cosa legge e compone l'AI proprietaria di Verzero, chi valida prima della consegna e com'è fatto il documento che si riceve.",
    priorita: 0.8,
    frequenza: "monthly",
  },
  {
    path: "/sigillo",
    titolo: "Il Sigillo Ver0",
    riga: "Il Sigillo Ver0 è la targa verificabile che attesta i percorsi conclusi da un'impresa: criteri pubblici, QR di controllo e millesimo che va riconquistato ogni anno.",
    priorita: 0.8,
    frequenza: "monthly",
  },
  {
    path: "/chi-siamo",
    titolo: "Chi siamo",
    riga: "Chi c'è dietro Verzero, come lavora il team tecnico che valida i documenti e quali principi vincolano il servizio.",
    priorita: 0.7,
    frequenza: "monthly",
  },
  {
    path: "/partner",
    titolo: "Programma partner",
    riga: "Come commercialisti e consulenti possono portare le imprese che seguono su Verzero restando loro il riferimento della relazione.",
    priorita: 0.6,
    frequenza: "monthly",
  },
  {
    path: "/sicurezza",
    titolo: "Sicurezza e riservatezza",
    riga: "Quali garanzie Verzero dichiara sui documenti delle imprese: dove risiedono i dati, chi vi accede e con quale titolo, come si revoca un mandato.",
    priorita: 0.6,
    frequenza: "monthly",
  },
  {
    path: "/contatti",
    titolo: "Contatti",
    riga: "Come scrivere a Verzero e che cosa aspettarsi come risposta.",
    priorita: 0.6,
    frequenza: "yearly",
  },
  {
    path: "/termini",
    titolo: "Termini di servizio",
    riga: "Le condizioni contrattuali del servizio Verzero.",
    priorita: 0.3,
    frequenza: "yearly",
  },
  {
    path: "/privacy",
    titolo: "Informativa privacy",
    riga: "Come Verzero tratta i dati personali, ai sensi del GDPR.",
    priorita: 0.3,
    frequenza: "yearly",
  },
  {
    path: "/cookie-policy",
    titolo: "Cookie policy",
    riga: "Quali cookie usa il sito di Verzero e perché oggi sono solo quelli necessari.",
    priorita: 0.3,
    frequenza: "yearly",
  },
];
