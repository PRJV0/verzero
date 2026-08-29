import { TESTI_ATTESA } from "@/lib/attesa";

/**
 * L'ANNUNCIO DELLA FASE — apriamo a poche imprese alla volta.
 *
 * ═══ PERCHÉ NON STA PIÙ IN CIMA ALLA HOME ═══
 * Stava sopra il claim, ed era la prima cosa che si leggeva del sito.
 * Detta lì diceva «non siamo ancora pronti», e ogni affermazione che
 * seguiva — l'intelligenza proprietaria, i professionisti che validano,
 * il prezzo pubblico — arrivava a un lettore che aveva già ricevuto una
 * riserva. Un'informazione vera messa nel posto in cui indebolisce
 * tutto il resto.
 *
 * Detta ACCANTO AL PREZZO diventa un'altra cosa: chi è arrivato lì sta
 * valutando quanto costa, e sapere che le prime imprese hanno condizioni
 * riservate è una ragione per muoversi adesso invece che una scusa.
 * Stesso testo, due letture opposte, e la differenza è solo dove sta.
 *
 * ═══ UNA FORMA SOLA, TRE POSTI ═══
 * Home (accanto al prezzo), catalogo, e il modulo della lista d'attesa
 * — che è l'unico posto in cui viveva bene fin dall'inizio, e da cui
 * questo componente prende le parole: i testi della fase sono una
 * decisione del fondatore e vanno alla lettera, quindi si leggono da
 * `TESTI_ATTESA` invece di essere ricopiati qui.
 */

/** La riga breve: le parole della lista d'attesa, dette in una frase. */
export const ANNUNCIO_FASE = {
  /** Il fatto. */
  fatto: TESTI_ATTESA.titolo.replace(/\.$/, ""),
  /** Perché conviene esserci fra le prime. */
  vantaggio: "condizioni fondatori riservate alle prime",
} as const;

export function AnnuncioFase({
  tono = "scuro",
  className = "",
}: {
  tono?: "scuro" | "chiaro";
  className?: string;
}) {
  const scuro = tono === "scuro";
  return (
    <p
      className={
        "inline-flex max-w-full items-center gap-2.5 rounded-full border px-4 py-2 text-left text-[12.5px] leading-snug sm:py-1.5 " +
        (scuro
          ? "border-mint-bright/30 bg-mint-bright/[0.07] text-moss"
          : "border-pine/20 bg-moss/60 text-pine") +
        (className ? ` ${className}` : "")
      }
    >
      <span
        aria-hidden
        className={
          "h-1.5 w-1.5 shrink-0 rounded-full " +
          (scuro ? "bg-mint-bright" : "bg-pine")
        }
      />
      {/* UN SOLO figlio di testo, e non due: con il testo spezzato fra
          un nodo e uno `<strong>` il flex li tratta come due elementi, e
          su schermo stretto andavano a capo come blocchi separati — il
          pallino da una parte e mezza frase dall'altra. */}
      <span>
        {ANNUNCIO_FASE.fatto} —{" "}
        <strong
          className={
            "font-semibold " + (scuro ? "text-mint-bright" : "text-pine-dark")
          }
        >
          {ANNUNCIO_FASE.vantaggio}
        </strong>
      </span>
    </p>
  );
}
