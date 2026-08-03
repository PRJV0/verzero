/**
 * Sigillo Ver0 — inline da public/brand/sigillo-ver0.svg (zero canonico E1,
 * anello punteggiato, millesimo). Con `segmenti` mostra la variante in cui
 * ogni percorso verificato riempie un segmento dell'anello (pino = livello 1,
 * mint = ulteriore percorso), come public/brand/sigillo-ver0-segmenti.svg.
 *
 * Inline (non <img>) così il millesimo usa il vero Fraunces della pagina.
 */
export function Sigillo({
  className = "",
  segmenti = false,
  year = "2026",
}: {
  className?: string;
  segmenti?: boolean;
  year?: string;
}) {
  return (
    <svg
      viewBox="0 0 200 200"
      role="img"
      aria-label={
        segmenti ? "Sigillo Ver0 con percorsi verificati" : "Sigillo Ver0"
      }
      className={className}
    >
      <circle cx="100" cy="100" r="98" fill="#FFFFFF" />
      <circle
        cx="100"
        cy="100"
        r="82"
        fill="none"
        stroke="#0E5238"
        strokeWidth="2.2"
        strokeDasharray="0.1 11.4"
        strokeLinecap="round"
      />
      {segmenti && (
        <>
          <path
            d="M 100 18 A 82 82 0 0 1 169 59"
            fill="none"
            stroke="#0E5238"
            strokeWidth="4.6"
            strokeLinecap="round"
          />
          <path
            d="M 175 68 A 82 82 0 0 1 179 110"
            fill="none"
            stroke="#1D9E75"
            strokeWidth="4.6"
            strokeLinecap="round"
          />
        </>
      )}
      <ellipse
        cx="100"
        cy="92"
        rx="25"
        ry="38"
        fill="none"
        stroke="#0E5238"
        strokeWidth="4.2"
      />
      <text
        x="100"
        y="152"
        textAnchor="middle"
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "15px",
          letterSpacing: "5px",
        }}
        fill="#0A3D2A"
      >
        {year}
      </text>
    </svg>
  );
}
