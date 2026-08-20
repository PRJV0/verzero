/**
 * LE TRE COSE CHE DICIAMO A CHI HA APPENA CHIESTO L'ATTIVAZIONE.
 *
 * Sono tre, in quest'ordine, e non cambiano a seconda di dove si
 * leggono: schermata finale del funnel, email di conferma, portale.
 *
 *   1. NESSUN ADDEBITO — la paura di chi ha appena lasciato la propria
 *      partita IVA a uno sconosciuto. Va tolta per prima.
 *   2. TI CONTATTIAMO — cosa succede adesso, senza date promesse.
 *   3. NEL FRATTEMPO — due cose utili e circoscritte, così l'attesa non
 *      e' tempo morto: confermare i dati che abbiamo gia' recuperato e
 *      portare i documenti che l'impresa ha gia'.
 *
 * Stanno qui e non in tre file diversi perche' un messaggio ripetuto in
 * tre punti, se lo si scrive tre volte, dopo due modifiche dice tre cose
 * diverse — ed e' esattamente nel passaggio piu' delicato del funnel.
 *
 * REGOLA DI TONO: presente, mai cantiere. Niente «stiamo completando»,
 * «presto», «in arrivo». E nessun invito a un «ecosistema» pieno che si
 * apre davvero solo dopo l'avvio: si invita a quello che esiste gia',
 * cioe' la scheda impresa e l'archivio documenti.
 */

export const AVVIO = {
  addebito: {
    titolo: "Nessun addebito",
    testo:
      "Non ti verrà addebitato nulla fino all'inizio effettivo delle attività, che concorderemo insieme.",
  },
  contatto: {
    titolo: "Ti contattiamo per fissare l'avvio del tuo percorso",
    testo:
      "Concordiamo insieme da dove partire e come organizzare il lavoro.",
  },
  intanto: {
    titolo: "Nel frattempo puoi già fare due cose utili",
    testo: "Così quando partiamo sei avanti.",
    azioni: [
      {
        titolo: "Conferma i dati della tua impresa",
        testo:
          "Li abbiamo già recuperati dai registri ufficiali: ti resta da controllarli e confermarli, o correggere quello che non torna.",
        infinito: "confermare i dati della tua impresa",
        href: "/dashboard/impresa",
        /* L'invito circoscritto: promette una scheda, non un ambiente. */
        cta: "La tua scheda impresa è già pronta: dai un'occhiata",
      },
      {
        titolo: "Carica i documenti che hai già",
        testo:
          "Bollette, visure, organigramma, certificati: quello che è già nel tuo archivio non lo cerchiamo due volte.",
        infinito: "caricare i documenti che hai già",
        href: "/dashboard/documenti",
        cta: "Porta qui i documenti che hai già",
      },
    ],
  },
} as const;

/** Cosa si sblocca dopo l'avvio: si dichiara, non si lascia intuire. */
export const DOPO_AVVIO =
  "Con l'avvio partono la composizione dei documenti, il fascicolo con l'avanzamento e la targa di percorso avviato.";

/**
 * Le tre cose in testo semplice e in HTML, per l'email.
 *
 * Stanno qui accanto ai testi, e non dentro il modulo che spedisce,
 * perche' cosi' si possono rendere e rileggere senza mandare niente a
 * nessuno: una copia mirror nello script di prova, dopo due modifiche,
 * mostrerebbe un'email diversa da quella che parte davvero.
 */
export function bloccoAvvioTesto(siteUrl: string): string {
  return [
    `${AVVIO.addebito.titolo.toUpperCase()}. ${AVVIO.addebito.testo}`,
    "",
    `${AVVIO.contatto.titolo}.`,
    AVVIO.contatto.testo,
    "",
    `${AVVIO.intanto.titolo}. ${AVVIO.intanto.testo}`,
    "",
    ...AVVIO.intanto.azioni.flatMap((a, i) => [
      `${i + 1}. ${a.titolo}`,
      `   ${a.testo}`,
      `   ${a.cta}`,
      `   ${siteUrl}${a.href}`,
      "",
    ]),
  ].join("\n");
}

export function bloccoAvvioHtml(siteUrl: string): string {
  return [
    '<p style="background:#F6F1E4;border-left:4px solid #0E5238;padding:12px 16px">',
    `<strong>${AVVIO.addebito.titolo}.</strong> ${AVVIO.addebito.testo}</p>`,
    `<p>${AVVIO.contatto.titolo}. ${AVVIO.contatto.testo}</p>`,
    `<p><strong>${AVVIO.intanto.titolo}.</strong> ${AVVIO.intanto.testo}</p>`,
    "<ol>",
    ...AVVIO.intanto.azioni.map(
      (a) =>
        `<li style="margin-bottom:10px"><strong>${a.titolo}</strong><br>${a.testo}<br>` +
        `<a href="${siteUrl}${a.href}" style="color:#0E5238;font-weight:600">${a.cta}</a></li>`,
    ),
    "</ol>",
  ].join("\n");
}
