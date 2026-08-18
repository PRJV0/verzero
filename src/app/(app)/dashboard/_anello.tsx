/**
 * L'anello del Sigillo come cruscotto (SPEC §12.G + identità visiva):
 * il completamento non è una barra qualunque ma l'anello punteggiato
 * che si riempie di segmenti — un segmento per sezione della bozza,
 * pieni quelli già composti dal Motore — con la percentuale al centro.
 * Un solo segno grafico che unisce dashboard e marchio.
 */
export function AnelloSigillo({
  totale,
  pieni,
  percentuale,
  dimensione = 112,
}: {
  totale: number;
  pieni: number;
  percentuale: number;
  dimensione?: number;
}) {
  const R = 40;
  const punto = (gradi: number) => [
    50 + R * Math.cos((gradi * Math.PI) / 180),
    50 + R * Math.sin((gradi * Math.PI) / 180),
  ];
  const spazio = Math.min(14, 360 / totale / 3);
  const ampiezza = 360 / totale - spazio;
  const arco = (i: number) => {
    const from = -90 + i * (ampiezza + spazio) + spazio / 2;
    const to = from + ampiezza;
    const [x1, y1] = punto(from);
    const [x2, y2] = punto(to);
    return `M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${R} ${R} 0 ${ampiezza > 180 ? 1 : 0} 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`;
  };

  return (
    <svg
      viewBox="0 0 100 100"
      role="img"
      aria-label={`Bozza al ${percentuale} per cento: ${pieni} sezioni su ${totale} già composte`}
      style={{ width: dimensione, height: dimensione }}
      className="shrink-0"
    >
      {/* Cornice punteggiata, come sul Sigillo */}
      <circle
        cx="50"
        cy="50"
        r="47"
        fill="none"
        stroke="#0E5238"
        strokeOpacity="0.3"
        strokeWidth="1.4"
        strokeDasharray="0.1 6.4"
        strokeLinecap="round"
      />
      {Array.from({ length: totale }, (_, i) => (
        <path
          key={i}
          d={arco(i)}
          fill="none"
          stroke={i < pieni ? "#1D9E75" : "#DCE4DD"}
          strokeWidth="5"
          strokeLinecap="round"
        />
      ))}
      <text
        x="50"
        y="48"
        textAnchor="middle"
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "24px",
          fontVariantNumeric: "tabular-nums",
        }}
        fill="#0E5238"
      >
        {percentuale}%
      </text>
      <text
        x="50"
        y="62"
        textAnchor="middle"
        style={{ fontSize: "8px", letterSpacing: "1px" }}
        fill="#6B7A6E"
      >
        DELLA BOZZA
      </text>
    </svg>
  );
}
