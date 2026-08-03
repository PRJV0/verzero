/**
 * Foto-duotone (Registro A, SPEC §12.W): immagine in scala di grigi + doppio
 * overlay verde brand (multiply per le ombre in pino, screen per accendere le
 * luci in menta). Effetto interamente in CSS: basta sostituire il file
 * dell'immagine e il trattamento resta identico.
 *
 * FOTO SEGNAPOSTO: i file in /public/img/placeholder-*.svg sono astratti e
 * locali. Il fondatore sostituirà gli scatti veri mantenendo gli stessi path
 * (o passando un nuovo `src`): nessun altro cambio necessario.
 */
export function PhotoDuotone({
  src,
  alt = "",
  className = "",
  imgClassName = "",
}: {
  src: string;
  /** Vuoto per immagini decorative (default). */
  alt?: string;
  className?: string;
  imgClassName?: string;
}) {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element -- asset statico locale con filtri CSS; nessuna ottimizzazione runtime necessaria */}
      <img
        src={src}
        alt={alt}
        className={`h-full w-full object-cover grayscale contrast-110 ${imgClassName}`}
      />
      {/* Ombre in pino */}
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-tr from-pine-dark via-pine/80 to-pine/40 mix-blend-multiply"
      />
      {/* Luci in menta */}
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-tl from-mint/35 to-transparent mix-blend-screen"
      />
    </div>
  );
}
