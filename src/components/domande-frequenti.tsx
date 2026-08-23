import type { DomandaRisposta } from "@/lib/faq-servizio";

/**
 * LE DOMANDE FREQUENTI — in fondo, e per una ragione.
 *
 * Stavano in cima, sotto il titolo «In breve», e rispondevano prima che
 * la pagina cominciasse. L'intenzione era buona — chi arriva da una
 * risposta generata viene a verificarla, e non deve scavare — ma l'esito
 * era che si leggeva due volte la stessa cosa nello spazio di due
 * schermate: prima la risposta breve, poi il paragrafo che la ripeteva
 * per esteso. Una pagina che si contraddice nel ritmo, non nel merito.
 *
 * Ora il corpo della pagina è un discorso unico — che cos'è, come lo
 * produciamo, che cosa apre, quanto costa — e queste domande stanno in
 * fondo, dove un riassunto è al suo posto. Non è una ripetizione
 * accidentale: è la forma ESTRAIBILE delle stesse informazioni, e la
 * riga di apertura lo dice al lettore invece di lasciarglielo scoprire.
 *
 * ═══ PERCHÉ NON SI POSSONO TOGLIERE ═══
 * Un motore manda una persona sulla pagina; un assistente legge la
 * pagina e RISPONDE al posto suo. Il secondo ha bisogno di frasi che
 * reggano ritagliate: «costa 45 € al mese» non serve a nessuno fuori dal
 * suo paragrafo, «il Carbon Footprint di Organizzazione di Verzero costa
 * 45 € al mese, IVA esclusa, per le microimprese fino a 9 addetti» sì.
 * Quelle frasi vivono qui.
 *
 * FORMA: una lista di definizioni, che è quello che è. `dt` la domanda,
 * `dd` la risposta: la relazione sta nel markup, non solo nella grafica.
 *
 * Le stesse voci, CARATTERE PER CARATTERE, finiscono nel markup FAQPage
 * della pagina: una fonte sola (`faqServizio`), passata sia qui sia a
 * `jsonLdFaq`. Il markup non può dichiarare risposte che nessuno vede.
 */
export function DomandeFrequenti({ voci }: { voci: DomandaRisposta[] }) {
  if (voci.length === 0) return null;
  return (
    <section
      aria-labelledby="domande-frequenti"
      className="mt-12 border-t-2 border-line pt-8"
    >
      <h2
        id="domande-frequenti"
        className="font-display text-2xl text-ink md:text-3xl"
      >
        Domande frequenti
      </h2>
      <p className="mt-1.5 text-sm text-gray-warm">
        Le stesse informazioni della pagina, in forma di domanda: comode se
        stai confrontando più percorsi o se sei arrivato qui da una ricerca.
      </p>
      <dl className="mt-5 divide-y divide-line border-y border-line">
        {voci.map((v) => (
          <div key={v.domanda} className="min-w-0 py-4">
            <dt className="font-display text-lg leading-snug text-ink">
              {v.domanda}
            </dt>
            <dd className="mt-1.5 text-sm leading-relaxed text-gray-warm">
              {v.risposta}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
