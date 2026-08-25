/**
 * IL LOGOTIPO — variante B del brand book: il nome per esteso.
 *
 * «Verzer» in Fraunces più lo zero canonico E1 (ellisse monolinea, niente
 * foglia) come ultima lettera: si legge «Verzero» e lo zero è il segno del
 * marchio, non una O qualsiasi. Reso in ibrido HTML+SVG così le lettere
 * usano il vero Fraunces della pagina e lo zero è l'ellisse esatta di
 * `public/brand/logo-verzero.svg`.
 *
 * Il monogramma «Ver0» resta per gli spazi stretti, il favicon, il
 * Sigillo e la targa: dove il nome per esteso diventerebbe illeggibile,
 * il marchio si accorcia — non si rimpicciolisce.
 *
 * ATTENZIONE ai testi: «Ver0» è anche il nome del PRODOTTO (Sigillo Ver0,
 * AI Ver0) e lì non si tocca. Questo file riguarda il marchio, non i
 * contenuti.
 *
 * `currentColor`: eredita il colore del testo, così lo stesso componente
 * funziona su fondo chiaro e su fondo scuro senza varianti.
 */

/**
 * Lo zero canonico E1: ellisse monolinea, mai una O di sistema.
 *
 * Esportato perché il lockup esteso (`marchio.tsx`) lo RIUSA invece di
 * ridisegnarlo: due ellissi scritte in due file diventano due ellissi
 * diverse alla prima correzione, e il segno del marchio è proprio
 * questo.
 */
export function ZeroE1() {
  return (
    <svg
      viewBox="0 0 30 40"
      className="h-[0.82em] w-auto"
      fill="none"
      aria-hidden="true"
    >
      <ellipse
        cx="15"
        cy="20"
        rx="11"
        ry="15"
        stroke="currentColor"
        strokeWidth="4"
      />
    </svg>
  );
}

/**
 * Il nome PRIVATO dello zero finale.
 *
 * Da solo non è il marchio e non va usato da solo: esiste perché la
 * riga 1 del lockup esteso è il logotipo senza la sua ultima lettera,
 * che lì diventa lo zero grande a destra.
 */
export function NomeSenzaZero() {
  return <>Verzer</>;
}

/**
 * ═══ QUI NON C'È PIÙ UN COMPONENTE «LOGO» ═══
 * C'era, e lo usavano intestazione e footer. Ora il marchio si compone
 * in un posto solo (`src/components/brand/marchio.tsx`), che di questo
 * file usa i due pezzi qui sopra: il nome e lo zero. Tenere anche un
 * `Logo` avrebbe voluto dire due strade per disegnare la stessa cosa —
 * ed è esattamente da lì che nascono le versioni che divergono.
 */
