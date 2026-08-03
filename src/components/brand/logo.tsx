/**
 * Logotipo Ver0 con lo zero canonico E1: "Ver" in Fraunces + ellisse monolinea
 * (niente foglia), come da public/brand/logo-ver0.svg. Reso in ibrido
 * HTML+SVG così "Ver" usa il vero Fraunces della pagina e lo zero è l'ellisse
 * esatta. currentColor: eredita il colore del testo (pine di default).
 */
export function Logo({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-[0.06em] font-display text-xl font-semibold leading-none text-pine ${className}`}
    >
      Ver
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
      {/* Lo zero è l'ellisse: lo diamo agli screen reader come testo. */}
      <span className="sr-only">0</span>
    </span>
  );
}
