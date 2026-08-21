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

/** Lo zero canonico E1: ellisse monolinea, mai una O di sistema. */
function ZeroE1() {
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

export function Logo({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-[0.04em] font-display text-xl font-semibold leading-none text-pine ${className}`}
    >
      Verzer
      <ZeroE1 />
      {/* Lo zero è l'ellisse: agli screen reader va dato come testo,
          altrimenti il marchio si legge «Verzer». */}
      <span className="sr-only">o</span>
    </span>
  );
}

/**
 * Il monogramma: spazi stretti, favicon, marchiature di servizio. Stessa
 * costruzione, nome corto.
 */
export function Monogramma({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-[0.06em] font-display text-xl font-semibold leading-none text-pine ${className}`}
    >
      Ver
      <ZeroE1 />
      <span className="sr-only">0</span>
    </span>
  );
}
