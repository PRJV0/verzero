import { LOCKUP, PAYOFF_LOCKUP } from "@/lib/marchio";
import {
  TRACCIATO_NOME,
  TRACCIATO_NOME_CORTO,
  TRACCIATO_PAYOFF,
} from "@/lib/marchio-tracciati";
import { SITO } from "@/lib/seo";

/**
 * IL LOCKUP IN SVG — stesse proporzioni, altro mezzo.
 *
 * ═══ PERCHÉ NON È UN SECONDO MARCHIO ═══
 * Legge `LOCKUP` e `PAYOFF_LOCKUP`, cioè gli stessi numeri del
 * componente React. Non c'è un disegno da qualche parte che qualcuno
 * dovrà ricordarsi di aggiornare: i file in `public/brand/` si
 * rigenerano da qui (`scripts/esporta-marchio.mjs`) e la targa
 * scaricabile lo incorpora chiamando questa funzione.
 *
 * ═══ NIENTE TESTO: SOLO TRACCIATI ═══
 * Il nome e il payoff sono contorni vettoriali
 * (`src/lib/marchio-tracciati.ts`), non elementi `<text>`. La prima
 * versione dichiarava `font-family: Fraunces` come fanno gli altri file
 * in `public/brand/`, e sembrava giusta perché sul sito il carattere
 * c'è. Rasterizzata fuori dal browser mostrava «Verzer» in Georgia: il
 * file ufficiale del marchio disegnava lettere che non sono quelle del
 * marchio, e nessuno se ne sarebbe accorto finché il file non fosse
 * finito nella presentazione di qualcun altro.
 *
 * Con i tracciati non c'è nessun carattere da avere: il file disegna
 * sempre le stesse lettere, in ogni programma, anche in quelli che di
 * `textLength` non sanno nulla.
 */

const esc = (s: string) =>
  s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");

/** Cento unità = un em del logotipo: numeri leggibili nel file. */
const U = 100;

/**
 * Il gruppo del lockup, da incorporare in un disegno più grande.
 * L'origine è l'angolo in alto a sinistra dell'INCHIOSTRO: l'altezza
 * delle maiuscole della riga 1, non la cima della scatola di riga.
 */
export function marchioEstesoGruppo({
  colore,
  scala = 1,
}: {
  colore: string;
  /** Moltiplicatore sulle cento unità: 1 = un em del logotipo = 100. */
  scala?: number;
}): string {
  const n = (v: number) => +(v * U).toFixed(2);
  const zeroX = LOCKUP.larghezzaNome + LOCKUP.distanzaZero;

  return [
    `<g fill="${colore}"${scala === 1 ? "" : ` transform="scale(${scala})"`}>`,
    // I tracciati sono in em con la linea di base a y = 0: si portano
    // alla loro linea e si scalano. Il payoff è in em SUOI, quindi la
    // scala porta dentro anche il rapporto fra i due corpi.
    `<path transform="translate(0 ${n(LOCKUP.baseNomeDaCima)}) scale(${U})" d="${TRACCIATO_NOME}"/>`,
    `<path transform="translate(0 ${n(LOCKUP.basePayoffDaCima)}) scale(${n(PAYOFF_LOCKUP.scala)})" d="${TRACCIATO_PAYOFF}"/>`,
    `<ellipse cx="${n(zeroX + LOCKUP.zeroLarghezza / 2)}" cy="${n(LOCKUP.zeroAltezza / 2)}" rx="${n((LOCKUP.zeroLarghezza - LOCKUP.zeroTratto) / 2)}" ry="${n((LOCKUP.zeroAltezza - LOCKUP.zeroTratto) / 2)}" fill="none" stroke="${colore}" stroke-width="${n(LOCKUP.zeroTratto)}"/>`,
    `</g>`,
  ].join("\n  ");
}

/**
 * Il file autonomo, con l'area di rispetto già dentro il riquadro.
 *
 * Il respiro fa parte del file apposta: chi lo riceve lo incolla in una
 * presentazione senza sapere che il marchio ne vuole intorno quanto la
 * larghezza del suo zero, e così se lo porta comunque dietro.
 */
export function marchioEstesoSvg({ scuro = false }: { scuro?: boolean }): string {
  const colore = scuro ? "#E7F0EA" : "#0E5238";
  const respiro = LOCKUP.respiro * U;
  const larghezza = +(LOCKUP.larghezza * U + respiro * 2).toFixed(2);
  const altezza = +(LOCKUP.altezza * U + respiro * 2).toFixed(2);

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${larghezza} ${altezza}" role="img" aria-label="Verzero — ${esc(SITO.payoff)}">
  <title>Verzero — ${esc(SITO.payoff)}</title>
  <desc>Lockup esteso: il logotipo privato dello zero finale, il payoff in maiuscolo spaziato della stessa larghezza, e un solo zero canonico che chiude entrambe le righe. Generato da src/lib/marchio-svg.ts: non va modificato a mano.</desc>
${scuro ? `  <rect width="${larghezza}" height="${altezza}" fill="#0A2E1F"/>\n` : ""}  <g transform="translate(${respiro.toFixed(2)},${respiro.toFixed(2)})">
  ${marchioEstesoGruppo({ colore })}
  </g>
</svg>
`;
}

/* ------------------------------------------------------------------ */
/* La variante SEMPLICE, per i file                                    */
/* ------------------------------------------------------------------ */

/**
 * IL LOGOTIPO DA SOLO, misurato sul componente in pagina.
 *
 * Lo zero della variante semplice va dall'altezza delle maiuscole alla
 * linea di base: è alto quanto una maiuscola e ci poggia sopra, come
 * l'ultima lettera che è. Sono i numeri letti sul logotipo
 * dell'intestazione — e sono stati letti due volte, perché la prima
 * misura era sbagliata: dentro un contenitore flex anche la sonda
 * allineata alla linea di base viene centrata come tutti gli altri, e
 * dava uno zero che scendeva mezzo em sotto la riga.
 */
const SEMPLICE = {
  stacco: 0.04,
  /** Dalla scatola 30×40 dello zero canonico E1, alta 0,82 em. */
  rx: (11 / 40) * 0.82,
  ry: (15 / 40) * 0.82,
  tratto: (4 / 40) * 0.82,
  scatolaLarghezza: (30 / 40) * 0.82,
  maiuscole: 0.7,
};

export function logotipoSvg({
  scuro = false,
  monogramma = false,
}: {
  scuro?: boolean;
  monogramma?: boolean;
}): string {
  const colore = scuro ? "#E7F0EA" : "#0E5238";
  const tracciato = monogramma ? TRACCIATO_NOME_CORTO : TRACCIATO_NOME;
  const larghezzaNome = monogramma ? 1.67349 : LOCKUP.larghezzaNome;

  const n = (v: number) => +(v * U).toFixed(2);
  // Lo zero è centrato nella sua scatola, e la scatola comincia dopo lo
  // stacco: il centro dell'ellisse sta a metà di quella scatola.
  const zeroCentro =
    larghezzaNome + SEMPLICE.stacco + SEMPLICE.scatolaLarghezza / 2;
  // L'origine del disegno è la cima delle maiuscole: la linea di base
  // sta un'altezza-maiuscole più giù, e lo zero ci poggia sopra.
  const base = SEMPLICE.maiuscole;
  const altezza = base;
  const zeroCentroY = base - (SEMPLICE.ry + SEMPLICE.tratto / 2);
  const larghezza = zeroCentro + SEMPLICE.rx + SEMPLICE.tratto / 2;
  const respiro = SEMPLICE.scatolaLarghezza * U;
  const tela = { w: n(larghezza) + respiro * 2, h: n(altezza) + respiro * 2 };
  const nome = monogramma ? "Ver0" : "Verzero";

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${tela.w.toFixed(2)} ${tela.h.toFixed(2)}" role="img" aria-label="${nome}">
  <title>${nome} — logotipo con lo zero canonico E1</title>
  <desc>Il nome in Fraunces come tracciati vettoriali, con lo zero canonico (ellisse monolinea) come ultima lettera. Generato da src/lib/marchio-svg.ts: non va modificato a mano.</desc>
${scuro ? `  <rect width="${tela.w.toFixed(2)}" height="${tela.h.toFixed(2)}" fill="#0A2E1F"/>\n` : ""}  <g transform="translate(${respiro.toFixed(2)},${respiro.toFixed(2)})" fill="${colore}">
    <path transform="translate(0 ${n(base)}) scale(${U})" d="${tracciato}"/>
    <ellipse cx="${n(zeroCentro)}" cy="${n(zeroCentroY)}" rx="${n(SEMPLICE.rx)}" ry="${n(SEMPLICE.ry)}" fill="none" stroke="${colore}" stroke-width="${n(SEMPLICE.tratto)}"/>
  </g>
</svg>
`;
}

/* ------------------------------------------------------------------ */
/* La card social                                                      */
/* ------------------------------------------------------------------ */

/**
 * L'ANTEPRIMA SOCIAL DI MARCA — 1200×630, il formato che chiedono tutti.
 *
 * Solo il lockup su fondo pino, centrato, con molto respiro intorno.
 * Niente claim, niente indirizzo, nessun testo aggiunto: una card di
 * marca ha un lavoro solo, e il payoff è già dentro il marchio. Ogni
 * riga in più sarebbe un secondo messaggio che compete con l'anteprima
 * del titolo che il social mette accanto.
 *
 * Va dove il soggetto È il marchio — home e pagine istituzionali. Le
 * schede dei percorsi tengono la loro fotografia: chi condivide un
 * percorso condivide quello, non il logo di chi lo fa.
 */
export function cardSocialeSvg(): string {
  const L = 1200;
  const H = 630;
  // Il lockup occupa metà della larghezza: abbastanza da leggersi
  // nell'anteprima piccola di una chat, non tanto da sembrare stampato
  // fino al bordo.
  const larghezzaMarchio = L * 0.52;
  const scala = larghezzaMarchio / (LOCKUP.larghezza * U);
  const x = (L - larghezzaMarchio) / 2;
  const y = (H - LOCKUP.altezza * U * scala) / 2;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${L} ${H}" width="${L}" height="${H}" role="img" aria-label="Verzero — ${esc(SITO.payoff)}">
  <title>Verzero — ${esc(SITO.payoff)}</title>
  <rect width="${L}" height="${H}" fill="#0A2E1F"/>
  <g transform="translate(${x.toFixed(2)},${y.toFixed(2)}) scale(${scala.toFixed(5)})">
  ${marchioEstesoGruppo({ colore: "#E7F0EA" })}
  </g>
</svg>
`;
}
