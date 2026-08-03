/**
 * Targa di verifica del Sigillo Ver0 — inline da
 * public/brand/targa-verifica-ver0.svg. Anteprima: il QR e il codice mostrati
 * sono un esempio; quelli reali sono univoci per ciascuna impresa e generati
 * dalla piattaforma. Reso responsive (larghezza piena, altezza automatica).
 */
export function TargaVerifica({ className = "" }: { className?: string }) {
  const serif = { fontFamily: "var(--font-display)" };
  const sans = { fontFamily: "var(--font-sans)" };
  return (
    <svg
      viewBox="0 0 440 170"
      role="img"
      aria-label="Anteprima della targa di verifica del Sigillo Ver0: sigillo, codice univoco e QR"
      className={className}
    >
      <rect
        x="1"
        y="1"
        width="438"
        height="168"
        rx="14"
        fill="#FFFFFF"
        stroke="#0E5238"
        strokeWidth="1.4"
      />
      <circle cx="85" cy="78" r="58" fill="#FFFFFF" />
      <circle
        cx="85"
        cy="78"
        r="48"
        fill="none"
        stroke="#0E5238"
        strokeWidth="1.4"
        strokeDasharray="0.1 6.9"
        strokeLinecap="round"
      />
      <path
        d="M 85 30 A 48 48 0 0 1 125 53"
        fill="none"
        stroke="#0E5238"
        strokeWidth="2.8"
        strokeLinecap="round"
      />
      <path
        d="M 129 59 A 48 48 0 0 1 131 85"
        fill="none"
        stroke="#1D9E75"
        strokeWidth="2.8"
        strokeLinecap="round"
      />
      <ellipse
        cx="85"
        cy="73"
        rx="15"
        ry="23"
        fill="none"
        stroke="#0E5238"
        strokeWidth="2.6"
      />
      <text
        x="85"
        y="109"
        textAnchor="middle"
        style={{ ...serif, fontSize: "9px", letterSpacing: "3px" }}
        fill="#0A3D2A"
      >
        2026
      </text>
      <rect
        x="318"
        y="24"
        width="96"
        height="96"
        rx="6"
        fill="none"
        stroke="#0E5238"
        strokeWidth="1.6"
      />
      <rect
        x="326"
        y="32"
        width="22"
        height="22"
        fill="none"
        stroke="#0E5238"
        strokeWidth="3"
      />
      <rect
        x="384"
        y="32"
        width="22"
        height="22"
        fill="none"
        stroke="#0E5238"
        strokeWidth="3"
      />
      <rect
        x="326"
        y="90"
        width="22"
        height="22"
        fill="none"
        stroke="#0E5238"
        strokeWidth="3"
      />
      <text
        x="366"
        y="82"
        textAnchor="middle"
        style={{ ...sans, fontSize: "11px" }}
        fill="#0E5238"
      >
        QR
      </text>
      <text
        x="176"
        y="52"
        style={{ ...serif, fontWeight: 700, fontSize: "17px" }}
        fill="#0E5238"
      >
        Sigillo Ver0
      </text>
      <text x="176" y="76" style={{ ...sans, fontSize: "12px" }} fill="#0A3D2A">
        Percorsi verificati, ogni anno.
      </text>
      <text
        x="176"
        y="104"
        style={{ ...sans, fontSize: "11px", letterSpacing: "1px" }}
        fill="#0E5238"
      >
        VER0-2026-00001
      </text>
      <text x="176" y="124" style={{ ...sans, fontSize: "11px" }} fill="#0A3D2A">
        Verifica su verzero.it/verifica
      </text>
      <text x="30" y="152" style={{ ...sans, fontSize: "9px" }} fill="#6B7F74">
        Il QR e il codice sono univoci per ciascuna impresa e generati dalla
        piattaforma.
      </text>
    </svg>
  );
}
