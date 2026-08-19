/**
 * L'anello del Sigillo come cruscotto (SPEC §12.G + §12.E).
 *
 * Un segmento per sezione della bozza, con quattro livelli che
 * raccontano lo stato reale del documento:
 *   PIENA (menta accesa) — la sezione ha i dati veri dentro;
 *   QUASI (menta media)  — i documenti sono arrivati, manca la lettura;
 *   MEZZA (menta tenue)  — struttura e norma impostate, contenuto in arrivo;
 *   VUOTA (grigio)       — sezione ancora in attesa.
 *
 * Il livello intermedio non è un vezzo: è ciò che permette all'anello di
 * SALIRE quando l'arricchimento porta un dato e una sezione passa da
 * impostata a popolata. Con due soli stati la percentuale restava ferma,
 * e un indicatore fermo davanti a un progresso vero è un indicatore che
 * mente. Un solo segno grafico che unisce dashboard e marchio.
 */
export function AnelloSigillo({
  segmenti,
  percentuale,
  dimensione = 112,
}: {
  segmenti: ("piena" | "quasi" | "mezza" | "vuota")[];
  percentuale: number;
  dimensione?: number;
}) {
  const totale = segmenti.length;
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

  // Quattro livelli, non tre: «quasi» è la sezione che ha ricevuto i
  // documenti e aspetta solo la lettura. Senza questo gradino, caricare
  // una bolletta non muoverebbe nulla sotto gli occhi del cliente.
  const colore = {
    piena: "#1D9E75",
    quasi: "#5FBF9B",
    mezza: "#9ED9C2",
    vuota: "#DCE4DD",
  };
  const piene = segmenti.filter((s) => s === "piena").length;

  return (
    <svg
      viewBox="0 0 100 100"
      role="img"
      aria-label={`Bozza al ${percentuale} per cento: ${piene} sezioni su ${totale} compilate coi tuoi dati`}
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
      {segmenti.map((stato, i) => (
        <path
          key={i}
          d={arco(i)}
          fill="none"
          stroke={colore[stato]}
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
