/**
 * Dati strutturati in pagina.
 *
 * Il contenuto arriva da src/lib/seo.ts e descrive SEMPRE ciò che la
 * pagina mostra davvero: markup che dichiara cose non presenti a schermo
 * è una violazione delle linee guida, oltre che una bugia.
 */
export function JsonLd({ dati }: { dati: object }) {
  return (
    <script
      type="application/ld+json"
      // Serializzazione di un oggetto costruito da noi, non da input utente.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(dati) }}
    />
  );
}
