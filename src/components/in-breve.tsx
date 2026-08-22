import type { DomandaRisposta } from "@/lib/faq-servizio";

/**
 * IN BREVE — il blocco che risponde prima che la pagina cominci.
 *
 * Sta in alto di proposito. Chi arriva da una risposta generata ha già
 * letto un riassunto altrui e viene qui per verificarlo: la prima cosa
 * che deve trovare è la stessa informazione, per esteso e attribuibile.
 * Chi arriva da una ricerca, invece, di solito cerca una cosa sola —
 * quanto costa, a chi serve — e non dovrebbe doverla scavare.
 *
 * FORMA: una lista di definizioni, che è quello che è. `dt` la domanda,
 * `dd` la risposta: la relazione fra le due sta nel markup, non solo
 * nella grafica, e regge anche letta da uno screen reader.
 *
 * Le stesse voci finiscono nel markup FAQPage della pagina. Sono una
 * fonte sola: il markup non può dichiarare risposte che nessuno vede.
 */
export function InBreve({ voci }: { voci: DomandaRisposta[] }) {
  if (voci.length === 0) return null;
  return (
    <section
      aria-labelledby="in-breve"
      className="mb-4 rounded-xl border border-line bg-white p-4 sm:p-5"
    >
      <h2
        id="in-breve"
        className="mb-3 font-display text-xl text-ink"
      >
        In breve
      </h2>
      {/* Una colonna sola: la scheda servizio è già una colonna stretta, e
          due colonne dentro una colonna stretta fanno righe da quattro
          parole. Una domanda per riga, separate da un filo. */}
      <dl className="divide-y divide-line">
        {voci.map((v) => (
          <div key={v.domanda} className="min-w-0 py-3 first:pt-0 last:pb-0">
            <dt className="text-sm font-semibold leading-snug text-pine">
              {v.domanda}
            </dt>
            <dd className="mt-1 text-sm leading-relaxed text-gray-warm">
              {v.risposta}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
