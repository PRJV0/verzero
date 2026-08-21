import { BadgeCheck, BookMarked, FileSearch, RefreshCw, Ruler, UserCheck } from "lucide-react";

/**
 * LA QUALITÀ DEGLI ELABORATI — quello che si consegna, non come lo si fa.
 *
 * Mancava ovunque: si raccontava il metodo e il prezzo, mai il livello
 * del documento che esce. Chi deve portarlo in banca o in audit vuole
 * sapere prima di tutto com'è fatto.
 *
 * TONO: fattuale. Nessun superlativo, nessun claim che non si possa
 * dimostrare aprendo un documento. «Struttura professionale» si può
 * verificare; «la migliore del mercato» no, e non si scrive.
 *
 * VINCOLO (SPEC §13.7): si dice «pronto per la certificazione», mai
 * «certificato». La certificazione la rilascia un organismo accreditato
 * dopo un audit, e non è nel nostro perimetro.
 *
 * Un solo componente per home, /come-funziona e schede servizio: gli
 * stessi sei fatti scritti in tre posti, dopo due modifiche, direbbero
 * tre cose diverse.
 */

export const QUALITA = [
  {
    icona: BookMarked,
    titolo: "Conformi alle norme, citate per esteso",
    testo:
      "Ogni documento dichiara lo standard su cui è costruito — numero, anno, edizione — e ne segue la struttura punto per punto.",
  },
  {
    icona: Ruler,
    titolo: "Struttura professionale",
    testo:
      "L'impianto documentale è quello che un organismo di certificazione o una banca si aspetta di trovare: sezioni, allegati e riferimenti al posto giusto.",
  },
  {
    icona: FileSearch,
    titolo: "Ogni dato con la sua fonte",
    testo:
      "Accanto a ciascun valore resta scritto da dove viene: quale documento, quale banca dati, quale calcolo.",
  },
  {
    icona: BadgeCheck,
    titolo: "Metodologia esplicitata",
    testo:
      "Perimetro, criteri e fattori applicati sono dichiarati nel documento. Dove un dato è stimato, è scritto che è una stima.",
  },
  {
    icona: UserCheck,
    titolo: "Validati da un professionista",
    testo:
      "Nessun documento esce senza il controllo di una persona del team tecnico, che mette per iscritto i rilievi.",
  },
  {
    icona: RefreshCw,
    titolo: "Aggiornati quando la norma cambia",
    testo:
      "Se lo standard evolve, i documenti interessati vengono rivisti: quello che hai in mano non invecchia nel cassetto.",
  },
] as const;

/**
 * `tono="scuro"` per le sezioni su pino profondo, `chiaro` per le altre.
 * `compatto` riduce a una lista senza card: serve nelle schede servizio,
 * dove la pagina è già densa.
 */
export function QualitaOutput({
  tono = "chiaro",
  compatto = false,
}: {
  tono?: "chiaro" | "scuro";
  compatto?: boolean;
}) {
  const scuro = tono === "scuro";

  if (compatto) {
    return (
      <ul className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
        {QUALITA.map(({ icona: Icona, titolo, testo }) => (
          <li key={titolo} className="flex gap-3">
            <Icona
              size={16}
              aria-hidden
              className={
                "mt-0.5 shrink-0 " + (scuro ? "text-mint-bright" : "text-mint")
              }
            />
            <span className="min-w-0">
              <span
                className={
                  "block text-sm font-semibold " +
                  (scuro ? "text-white" : "text-ink")
                }
              >
                {titolo}
              </span>
              <span
                className={
                  "mt-0.5 block text-xs leading-relaxed " +
                  (scuro ? "text-moss/70" : "text-gray-warm")
                }
              >
                {testo}
              </span>
            </span>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {QUALITA.map(({ icona: Icona, titolo, testo }) => (
        <article
          key={titolo}
          className={
            "rounded-2xl border p-5 " +
            (scuro
              ? "border-white/12 bg-white/[0.04]"
              : "border-line bg-white")
          }
        >
          <span
            aria-hidden
            className={
              "inline-flex h-11 w-11 items-center justify-center rounded-xl " +
              (scuro
                ? "bg-mint-bright/15 text-mint-bright"
                : "bg-moss text-pine")
            }
          >
            <Icona size={19} />
          </span>
          <h3
            className={
              "mt-4 font-display text-xl leading-tight " +
              (scuro ? "text-white" : "text-ink")
            }
          >
            {titolo}
          </h3>
          <p
            className={
              "mt-2 text-sm leading-relaxed " +
              (scuro ? "text-moss/75" : "text-gray-warm")
            }
          >
            {testo}
          </p>
        </article>
      ))}
    </div>
  );
}
