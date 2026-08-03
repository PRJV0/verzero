/**
 * Sigillo Ver0 — inline da public/brand/sigillo-ver0.svg (zero canonico E1,
 * anello punteggiato, millesimo). Con `segmenti` mostra la variante in cui
 * ogni percorso verificato riempie un segmento dell'anello, come
 * public/brand/sigillo-ver0-segmenti.svg.
 *
 * `tone` segue la regola di fondo della SPEC §11.X:
 * - "light" (default): placca circolare bianca, tratti pino — per superfici
 *   chiare e stampate.
 * - "dark": tono-su-tono in bianco, senza placca, con segmento menta acceso
 *   #2FCF9A — per le sezioni scure del sito (fondo pino).
 *
 * Inline (non <img>) così il millesimo usa il vero Fraunces della pagina.
 */
export function Sigillo({
  className = "",
  segmenti = false,
  tone = "light",
  year = "2026",
}: {
  className?: string;
  segmenti?: boolean;
  tone?: "light" | "dark";
  year?: string;
}) {
  const dark = tone === "dark";
  const ink = dark ? "#FFFFFF" : "#0E5238";
  const mint = dark ? "#2FCF9A" : "#1D9E75";
  const yearFill = dark ? "#E7F0EA" : "#0A3D2A";

  return (
    <svg
      viewBox="0 0 200 200"
      role="img"
      aria-label={
        segmenti ? "Sigillo Ver0 con percorsi verificati" : "Sigillo Ver0"
      }
      className={className}
    >
      {/* Placca bianca solo su fondo chiaro: su scuro il sigillo è tono-su-tono. */}
      {!dark && <circle cx="100" cy="100" r="98" fill="#FFFFFF" />}
      <circle
        cx="100"
        cy="100"
        r="82"
        fill="none"
        stroke={ink}
        strokeWidth="2.2"
        strokeDasharray="0.1 11.4"
        strokeLinecap="round"
      />
      {segmenti ? (
        <>
          <path
            d="M 100 18 A 82 82 0 0 1 169 59"
            fill="none"
            stroke={ink}
            strokeWidth="4.6"
            strokeLinecap="round"
          />
          <path
            d="M 175 68 A 82 82 0 0 1 179 110"
            fill="none"
            stroke={mint}
            strokeWidth="4.6"
            strokeLinecap="round"
          />
        </>
      ) : (
        dark && (
          /* Su fondo scuro il sigillo porta sempre il segmento menta acceso (§11.X). */
          <path
            d="M 100 18 A 82 82 0 0 1 169 59"
            fill="none"
            stroke={mint}
            strokeWidth="4.6"
            strokeLinecap="round"
          />
        )
      )}
      <ellipse
        cx="100"
        cy="92"
        rx="25"
        ry="38"
        fill="none"
        stroke={ink}
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
        fill={yearFill}
      >
        {year}
      </text>
    </svg>
  );
}
