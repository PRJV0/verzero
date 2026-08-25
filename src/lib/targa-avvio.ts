import "server-only";

import QRCode from "qrcode";

import { LOCKUP } from "@/lib/marchio";
import { marchioEstesoGruppo } from "@/lib/marchio-svg";

/**
 * LA TARGA DI AVVIO (SPEC §12.F) — il file SVG scaricabile.
 *
 * Dal primo giorno l'impresa può dichiarare che il percorso è INIZIATO:
 * la targa porta il sigillo in stato di avvio (anello punteggiato, MAI
 * segmenti pieni: quelli si accendono solo a percorso verificato), il
 * millesimo «Percorso avviato 2026» e il QR verso la pagina pubblica
 * che conferma lo stato. Wording rigoroso: dichiara un percorso in
 * corso, mai un risultato — anti-greenwashing by design.
 *
 * Il file è autonomo (si stampa, si mette in firma, si pubblica): i font
 * dichiarano Fraunces/Inter con fallback di sistema, senza dipendenze.
 */

const PINE = "#0E5238";
const PINE_DARK = "#0A3D2A";
const INK = "#1A241D";
const GRAY = "#5A6B5F";
const PAPER = "#FBFAF7";

/**
 * Corpo del logotipo nel lockup della targa.
 *
 * È la misura minima del lockup (`LOCKUP.minimaPx`), non una più
 * piccola: a 34 unità il payoff scendeva a sei, cioè sotto la soglia
 * che il componente in pagina si rifiuta di attraversare. Una regola
 * che vale sullo schermo e non su un file che si stampa non è una
 * regola.
 */
const MARCHIO_CORPO = LOCKUP.minimaPx;

const esc = (s: string) =>
  s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

/** Il QR come path SVG (moduli scuri), scalato in un box `lato` × `lato`. */
function qrPath(testo: string, lato: number): { d: string; moduli: number } {
  const qr = QRCode.create(testo, { errorCorrectionLevel: "M" });
  const n = qr.modules.size;
  const cella = lato / n;
  let d = "";
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (qr.modules.get(r, c)) {
        d += `M${(c * cella).toFixed(2)} ${(r * cella).toFixed(2)}h${cella.toFixed(2)}v${cella.toFixed(2)}h-${cella.toFixed(2)}z`;
      }
    }
  }
  return { d, moduli: n };
}

export function targaAvvioSvg({
  ragioneSociale,
  partitaIva,
  urlVerifica,
  anno = 2026,
}: {
  ragioneSociale: string;
  partitaIva: string;
  urlVerifica: string;
  anno?: number;
}): string {
  const qr = qrPath(urlVerifica, 132);
  const urlBreve = urlVerifica.replace(/^https?:\/\//, "");
  // Le ragioni sociali lunghe scendono di corpo, mai fuori dalla targa.
  const corpoNome =
    ragioneSociale.length > 34 ? 24 : ragioneSociale.length > 24 ? 29 : 34;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 640" role="img" aria-label="Targa di avvio Ver0 ${anno} — ${esc(ragioneSociale)}: percorso avviato, in corso di completamento">
  <rect width="1000" height="640" fill="${PAPER}"/>
  <rect x="16" y="16" width="968" height="608" rx="18" fill="none" stroke="${PINE}" stroke-width="2.5"/>
  <rect x="28" y="28" width="944" height="584" rx="12" fill="none" stroke="${PINE}" stroke-opacity="0.22" stroke-width="1"/>

  <!-- Il sigillo in stato di AVVIO: anello punteggiato, nessun segmento pieno -->
  <g transform="translate(235,300)">
    <circle r="150" fill="#FFFFFF"/>
    <circle r="128" fill="none" stroke="${PINE}" stroke-width="3.4"
      stroke-dasharray="0.2 17.7" stroke-linecap="round"/>
    <ellipse cx="0" cy="-12" rx="39" ry="59" fill="none" stroke="${PINE}" stroke-width="6.5"/>
    <text y="82" text-anchor="middle" fill="${PINE_DARK}"
      font-family="Fraunces, Georgia, serif" font-size="23" letter-spacing="7">${anno}</text>
    <text y="112" text-anchor="middle" fill="${GRAY}"
      font-family="Inter, -apple-system, sans-serif" font-size="12" letter-spacing="3">PERCORSO AVVIATO</text>
  </g>

  <!-- La dichiarazione: un percorso in corso, mai un risultato -->
  <g transform="translate(455,0)">
    <text y="128" fill="${PINE}" font-family="Inter, -apple-system, sans-serif"
      font-size="14" font-weight="600" letter-spacing="3.5">SIGILLO VER0 · TARGA DI AVVIO</text>
    <text y="186" fill="${PINE_DARK}" font-family="Fraunces, Georgia, serif"
      font-size="44">Percorso avviato ${anno}</text>
    <text y="240" fill="${INK}" font-family="Fraunces, Georgia, serif"
      font-size="${corpoNome}">${esc(ragioneSociale)}</text>
    <text y="270" fill="${GRAY}" font-family="Inter, -apple-system, sans-serif"
      font-size="16">Partita IVA ${esc(partitaIva)}</text>

    <text y="322" fill="${GRAY}" font-family="Inter, -apple-system, sans-serif" font-size="15.5">
      <tspan x="0">Questa impresa ha avviato un percorso di qualificazione</tspan>
      <tspan x="0" dy="24">di sostenibilità, oggi in corso di completamento.</tspan>
      <tspan x="0" dy="24">La targa dichiara un percorso iniziato, non un risultato:</tspan>
      <tspan x="0" dy="24">il Sigillo Ver0 arriva solo a percorso verificato.</tspan>
    </text>

    <g transform="translate(0,448)">
      <rect x="-10" y="-10" width="152" height="152" rx="8" fill="#FFFFFF"
        stroke="${PINE}" stroke-opacity="0.25"/>
      <path d="${qr.d}" fill="${PINE_DARK}"/>
    </g>
    <text x="170" y="490" fill="${GRAY}" font-family="Inter, -apple-system, sans-serif" font-size="14">
      <tspan x="170">Lo stato del percorso è pubblico:</tspan>
      <tspan x="170" dy="22">chiunque può verificarlo qui.</tspan>
    </text>
    <text x="170" y="548" fill="${PINE}" font-family="Inter, -apple-system, sans-serif"
      font-size="15" font-weight="600">${esc(urlBreve)}</text>
  </g>

  <!-- CHI LA EMETTE: il lockup esteso sotto il sigillo, nella colonna
       di sinistra. Il sigillo dice che cos'è la targa, il marchio dice
       chi risponde — e stanno bene incolonnati. A destra non ci stava
       senza finire addosso all'indirizzo di verifica.
       I margini sono l'AREA DI RISPETTO del marchio, presa da lì e non
       scelta a occhio. -->
  <g transform="translate(${(235 - (MARCHIO_CORPO * LOCKUP.larghezza) / 2).toFixed(1)},${(612 - 34 - MARCHIO_CORPO * LOCKUP.altezza).toFixed(1)}) scale(${(MARCHIO_CORPO / 100).toFixed(4)})">
    ${marchioEstesoGruppo({ colore: PINE })}
  </g>
</svg>
`;
}
