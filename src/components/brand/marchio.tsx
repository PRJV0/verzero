import { NomeSenzaZero, ZeroE1 } from "@/components/brand/logo";
import { LOCKUP, PAYOFF_LOCKUP, variantePer } from "@/lib/marchio";

/**
 * IL MARCHIO — due varianti, un segno solo.
 *
 * ═══ NON È UN FILE DISEGNATO A PARTE ═══
 * Il nome e lo zero vengono da `logo.tsx`, che è il logotipo che sta
 * nell'intestazione: qui si RICOMPONGONO, non si ridisegnano. È il motivo
 * per cui il segno resta identico ovunque anche quando qualcuno tocca il
 * logotipo — se cambia lì, cambia qui lo stesso giorno.
 *
 * ═══ SEMPLICE ═══
 * Il logotipo attuale, invariato: «Verzer» più lo zero canonico come
 * ultima lettera. Sta nell'intestazione, nel portale e ovunque serva il
 * marchio da solo.
 *
 * ═══ ESTESA ═══
 * Tre elementi in proporzioni fisse (`src/lib/marchio.ts`):
 *
 *   riga 1   «Verzer» — il logotipo PRIVATO dello zero finale
 *   riga 2   «AZIENDA A NORMA IN TEMPO» in Inter maiuscolo spaziato,
 *            della STESSA larghezza esatta della riga 1
 *   a destra UN SOLO zero canonico, alto dall'altezza delle maiuscole
 *            della riga 1 fino alla linea di base del payoff
 *
 * Lo zero chiude tutte e due le righe insieme: si legge «Verzer0» in
 * orizzontale e «in tempo 0» sulla seconda riga. È l'unico punto in cui
 * lo zero fa due lavori, ed è la ragione per cui il payoff finisce con
 * «in tempo» e non con «in tempo Zero»: la parola c'è già, disegnata.
 *
 * ═══ PERCHÉ LE DUE RIGHE FINISCONO ALLINEATE ═══
 * Non per fortuna e non a occhio. La riga 2 ha una crenatura calcolata
 * (`PAYOFF_LOCKUP.tracking`) per portare «AZIENDA A NORMA IN TEMPO»
 * esattamente alla larghezza di «Verzer», e `text-align-last: justify`
 * assorbe negli spazi fra le parole il residuo che resta quando il
 * carattere non è ancora arrivato o rende in modo un filo diverso. Senza
 * quel giustificato una differenza di mezzo pixel si vedrebbe: le due
 * righe terminano sulla stessa verticale, che è il bordo sinistro dello
 * zero, e un disallineamento lì è l'unica cosa che l'occhio nota.
 */

type Variante = "semplice" | "estesa";

export function Marchio({
  variante = "semplice",
  dimensione,
  className = "",
  titolo,
}: {
  variante?: Variante;
  /**
   * La misura del logotipo in pixel — OBBLIGATORIA per la variante
   * estesa, che è un oggetto a proporzioni fisse e non un testo che
   * eredita il corpo da chi lo contiene.
   *
   * Sotto `LOCKUP.minimaPx` si ottiene la variante semplice: non è un
   * consiglio nel brand book, è quello che fa il componente. Un payoff
   * illeggibile non è un payoff più piccolo, è sporcizia intorno al
   * marchio.
   */
  dimensione?: number;
  className?: string;
  /** Sostituisce l'etichetta per chi legge con la sintesi vocale. */
  titolo?: string;
}) {
  if (variantePer(variante, dimensione) === "semplice") {
    return (
      <span
        className={`inline-flex items-center gap-[0.04em] font-display font-semibold leading-none ${className}`}
        style={dimensione ? { fontSize: `${dimensione}px` } : undefined}
      >
        <NomeSenzaZero />
        <ZeroE1 />
        <span className="sr-only">o</span>
      </span>
    );
  }

  const em = (v: number) => `${v}em`;

  return (
    <span
      role="img"
      aria-label={titolo ?? `Verzero — ${PAYOFF_LOCKUP.completo}`}
      className={`relative inline-block align-top ${className}`}
      style={{
        fontSize: `${dimensione}px`,
        width: em(LOCKUP.larghezza),
        // La scatola del componente è la scatola dell'INCHIOSTRO: si
        // tagliano il vuoto sopra le maiuscole della riga 1 e quello
        // sotto la linea di base del payoff. Senza, chi lo impagina si
        // ritrova un margine invisibile e l'area di rispetto misurata
        // dal bordo sbagliato.
        marginTop: em(-LOCKUP.vuotoSopra),
        marginBottom: em(-LOCKUP.vuotoSotto),
      }}
    >
      <span
        aria-hidden
        className="block font-display font-semibold"
        style={{ lineHeight: LOCKUP.interlineaNome }}
      >
        <NomeSenzaZero />
      </span>

      <span
        aria-hidden
        className="block whitespace-nowrap font-sans"
        style={{
          fontSize: em(PAYOFF_LOCKUP.scala),
          fontWeight: PAYOFF_LOCKUP.peso,
          lineHeight: LOCKUP.interlineaPayoff,
          letterSpacing: em(PAYOFF_LOCKUP.tracking),
          // LA LARGHEZZA VA DICHIARATA, e non è quella del lockup.
          // `text-align-last: justify` riempie la scatola in cui si
          // trova: lasciata libera, la riga 2 si stirava fino al bordo
          // destro dell'intero marchio — cioè PASSANDO SOPRA lo zero.
          // Qui la scatola è lunga quanto il nome, più il vuoto che la
          // crenatura lascia dopo l'ultima lettera: così l'inchiostro
          // finisce esattamente dove finisce «Verzer».
          width: em(
            (LOCKUP.larghezzaNome + PAYOFF_LOCKUP.codaCrenatura) /
              PAYOFF_LOCKUP.scala,
          ),
          marginTop: em(LOCKUP.staccoPayoff / PAYOFF_LOCKUP.scala),
          textAlignLast: "justify",
        }}
      >
        {PAYOFF_LOCKUP.riga}
      </span>

      {/* LO ZERO che chiude le due righe. Assoluto e non in fila: deve
          partire dall'altezza delle maiuscole della riga 1 e arrivare
          alla linea di base della riga 2, cioè da due posizioni che
          nessun allineamento di flex conosce. */}
      <svg
        aria-hidden
        viewBox={`0 0 ${LOCKUP.zeroLarghezza * 1000} ${LOCKUP.zeroAltezza * 1000}`}
        fill="none"
        className="absolute"
        style={{
          left: em(LOCKUP.larghezzaNome + LOCKUP.distanzaZero),
          top: em(LOCKUP.zeroDaSopra),
          width: em(LOCKUP.zeroLarghezza),
          height: em(LOCKUP.zeroAltezza),
        }}
      >
        <ellipse
          cx={(LOCKUP.zeroLarghezza * 1000) / 2}
          cy={(LOCKUP.zeroAltezza * 1000) / 2}
          rx={(LOCKUP.zeroLarghezza - LOCKUP.zeroTratto) * 500}
          ry={(LOCKUP.zeroAltezza - LOCKUP.zeroTratto) * 500}
          stroke="currentColor"
          strokeWidth={LOCKUP.zeroTratto * 1000}
        />
      </svg>
    </span>
  );
}
