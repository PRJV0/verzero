import { NumeroCheSale } from "@/components/numero-che-sale";

/**
 * L'anello del Sigillo come cruscotto (SPEC §12.G + §12.E).
 *
 * Un segmento per sezione della bozza, con cinque livelli che
 * raccontano lo stato reale del documento:
 *   PIENA (menta accesa) — dati veri dentro, CONFERMATI dal cliente;
 *   LETTA (menta viva)   — il Motore ha letto, il cliente non ha ancora
 *                          confermato: si vede la salita, ma l'ultimo
 *                          tratto resta al gesto umano;
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
  chiave,
}: {
  segmenti: ("piena" | "letta" | "quasi" | "mezza" | "vuota")[];
  percentuale: number;
  dimensione?: number;
  /** Identifica l'anello fra un accesso e l'altro: serve al numero che
   *  sale per ripartire da dove eravamo invece che da zero. */
  chiave?: string;
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

  // Cinque livelli, e ognuno costa un gradino guadagnato: «quasi» è la
  // sezione che ha ricevuto i documenti e aspetta la lettura, «letta»
  // quella che ha i dati dentro ma non ancora la conferma del cliente.
  // Senza il quarto gradino, leggere una bolletta non muoverebbe nulla
  // sotto gli occhi di chi guarda; senza la distinzione fra «letta» e
  // «piena», l'anello direbbe che il lavoro è finito quando manca proprio
  // il gesto su cui si regge il prodotto.
  const colore = {
    piena: "#1D9E75",
    letta: "#3BAF86",
    quasi: "#5FBF9B",
    mezza: "#9ED9C2",
    vuota: "#DCE4DD",
  };
  const piene = segmenti.filter((s) => s === "piena").length;
  const lette = segmenti.filter((s) => s === "letta").length;

  return (
    <svg
      viewBox="0 0 100 100"
      role="img"
      aria-label={`Bozza al ${percentuale} per cento: ${piene} sezioni su ${totale} compilate con dati confermati${lette > 0 ? `, ${lette} in attesa della tua conferma` : ""}`}
      style={{ width: dimensione, height: dimensione }}
      className="vz-anello-vivo shrink-0"
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
      {/* I segmenti si disegnano uno dopo l'altro, 70ms l'uno dall'altro:
          la meccanica del prodotto resa visibile (brief §3.6). Senza
          movimento sono semplicemente lì, colorati. */}
      {segmenti.map((stato, i) => (
        <path
          key={i}
          className="vz-arco"
          style={{ "--vz-i": i } as React.CSSProperties}
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
        <NumeroCheSale valore={percentuale} chiave={chiave} />
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
