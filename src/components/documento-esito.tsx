import { BadgeCheck, Megaphone, ShieldCheck } from "lucide-react";

import { IMPRESA_ESEMPIO } from "@/lib/impresa-esempio";

/**
 * QUELLO CHE RICEVI, mostrato invece che elencato.
 *
 * Qui prima c'era una lista di percorsi con accanto la norma. Diceva
 * quanti documenti sappiamo fare, non com'è fatto quello che arriva — e
 * la seconda domanda è l'unica che si fa chi deve portarlo in banca o in
 * audit. Quindi si mostra la bozza: impaginazione, indice, riferimento
 * normativo in evidenza, tabella dei dati, pagina di validazione.
 *
 * ═══ VINCOLI, tutti e tre vincolanti ═══
 *
 * 1. IMPRESA INVENTATA E DICHIARATA (CLAUDE.md). Il mockup porta il nome
 *    dell'impresa d'esempio e la parola «esempio» visibile. Un nome vero
 *    in una vetrina è un dato personale pubblicato senza base giuridica.
 *
 * 2. NORME CITATE IN MODO GENERICO. «Conforme alla norma di riferimento
 *    del percorso scelto», mai l'elenco norma-per-norma: la mappatura fra
 *    percorso, norma e sezioni è metodo operativo, e sul sito pubblico
 *    non ci va (CLAUDE.md — metodo e risultato sì, mappature no).
 *
 * 3. MAI «CERTIFICATO» (SPEC §13.7). Il documento è pronto per la
 *    certificazione; la certificazione la rilascia un organismo
 *    accreditato dopo un audit, e non è nel nostro perimetro.
 *
 * ACCESSIBILITÀ: è una figura, non un documento da leggere. Numeri di
 * pagina e valori di tabella sono verosimili per far leggere il FORMATO —
 * letti ad alta voce sarebbero rumore. Quindi `role="img"` con una
 * descrizione, e il contenuto interno fuori dall'albero.
 */

const INDICE = [
  { n: "1", voce: "Perimetro e confini", pagina: "4" },
  { n: "2", voce: "Metodologia e fattori applicati", pagina: "9" },
  { n: "3", voce: "Dati, calcoli e risultati", pagina: "14" },
  { n: "4", voce: "Fonti di ogni valore", pagina: "26" },
];

const RIGHE = [
  ["Energia elettrica", "412.800", "kWh"],
  ["Gas naturale", "38.150", "Smc"],
  ["Flotta aziendale", "21.470", "litri"],
];

/** Gli accessori: ci sono, e si vede che sono accessori. */
const ACCESSORI = [
  {
    icona: Megaphone,
    titolo: "Kit di comunicazione",
    testo: "Il risultato in una forma che puoi mostrare a clienti e bandi.",
  },
  {
    icona: ShieldCheck,
    titolo: "Sigillo Ver0",
    testo: "La targa verificabile, con il QR di controllo.",
  },
];

/**
 * IL FOGLIO — la bozza del documento, da sola.
 *
 * Sta in un componente suo perché lo usano in due: questa sezione, che
 * gli mette accanto gli accessori, e la guida in cinque passi, dove al
 * quinto passo il documento finito si vede dentro il portale. È lo
 * STESSO documento che nei passi prima si sta completando, e disegnarlo
 * due volte vorrebbe dire farne due diversi alla prima correzione.
 */
export function FoglioDocumento({
  grande = false,
  compatto = false,
}: {
  grande?: boolean;
  /** Dentro una finestra stretta: niente foglio dietro, niente ombra. */
  compatto?: boolean;
}) {
  const scala = grande ? "text-[11px]" : "text-[8px]";

  return (
    <>
      <div
        role="img"
        aria-label="Bozza del documento che ricevi: copertina con il riferimento normativo del percorso, indice, tabella dei dati con l'unità di misura e pagina di validazione a nome del team tecnico. Esempio su un'impresa inventata."
        className={
          "relative " +
          (compatto ? "h-full w-full" : "mx-auto ") +
          (compatto ? "" : grande ? "max-w-md" : "max-w-[22rem]")
        }
      >
        {/* Il foglio dietro: profondità, e il documento non è mai una
            pagina sola. Inclinato appena — di più sembrerebbe un
            ventaglio. Dentro una finestra non ci va: lì il documento è
            già dentro una cornice, e una seconda ombra sarebbe rumore. */}
        {!compatto && (
          <div
            aria-hidden
            className="absolute inset-0 translate-x-2 translate-y-2 rotate-[1.4deg] rounded-lg border border-line bg-white/85 shadow-lift"
          />
        )}

        <div
          aria-hidden
          className={
            "relative flex flex-col overflow-hidden rounded-lg border border-line bg-white text-ink " +
            (compatto ? "h-full " : "shadow-lift ") +
            scala
          }
        >
          {/* Testata: il marchio, e la parola «esempio» che non si nasconde. */}
          <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
            <span className="flex items-center gap-1.5 font-display font-semibold tracking-wide text-pine">
              <svg viewBox="0 0 14 18" className="h-3 w-2.5" fill="none">
                <ellipse
                  cx="7"
                  cy="9"
                  rx="4.6"
                  ry="6.8"
                  stroke="currentColor"
                  strokeWidth="2.2"
                />
              </svg>
              VERZERO
            </span>
            <span className="rounded-full bg-amber-soft px-2 py-0.5 font-semibold uppercase tracking-widest text-amber-ink">
              esempio
            </span>
          </div>

          <div className="flex min-h-0 flex-1 flex-col px-4 pb-4 pt-3.5">
            {/* Copertina */}
            <p className="font-display leading-tight text-ink" style={{ fontSize: "2.1em" }}>
              Bilancio di Sostenibilità
            </p>
            <p className="mt-1.5 font-semibold text-pine">
              {IMPRESA_ESEMPIO.nome}
            </p>
            <p className="text-gray-warm">
              {IMPRESA_ESEMPIO.piva} · Esercizio 2025
            </p>

            {/* Il riferimento normativo, in evidenza e volutamente generico. */}
            <p className="mt-3 inline-flex items-center gap-1.5 rounded border border-mint/40 bg-mint/10 px-2 py-1 font-semibold text-pine">
              <BadgeCheck className="h-3 w-3 shrink-0" />
              Conforme alla norma di riferimento del percorso scelto
            </p>

            {/* Indice, con la filettatura di punti: è il segno che dice
                «documento impaginato» prima ancora che si legga. */}
            <p className="mt-4 font-semibold uppercase tracking-widest text-gray-light">
              Indice
            </p>
            <ul className="mt-1.5 space-y-1">
              {INDICE.map((r) => (
                <li key={r.n} className="flex items-baseline gap-1.5">
                  <span className="tabular-nums text-gray-warm">{r.n}.</span>
                  <span className="shrink-0 text-ink">{r.voce}</span>
                  <span className="min-w-0 flex-1 translate-y-[-0.2em] border-b border-dotted border-line" />
                  <span className="tabular-nums text-gray-warm">{r.pagina}</span>
                </li>
              ))}
            </ul>

            {/* Tabella dati: intestazione, allineamento a destra sui numeri,
                cifre tabellari. Le tre cose che rendono una tabella vera. */}
            <p className="mt-4 font-semibold uppercase tracking-widest text-gray-light">
              Dati del periodo
            </p>
            <table className="mt-1.5 w-full border-collapse">
              <thead>
                <tr className="border-b border-line text-gray-warm">
                  <th className="py-1 text-left font-semibold">Vettore</th>
                  <th className="py-1 text-right font-semibold">Quantità</th>
                  <th className="py-1 pl-2 text-left font-semibold">U.m.</th>
                </tr>
              </thead>
              <tbody>
                {RIGHE.map(([vettore, quantita, um]) => (
                  <tr key={vettore} className="border-b border-line/70">
                    <td className="py-1 text-ink">{vettore}</td>
                    <td className="py-1 text-right tabular-nums text-ink">
                      {quantita}
                    </td>
                    <td className="py-1 pl-2 text-gray-warm">{um}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* La pagina di validazione: è la parte che rende il documento
                opponibile a chi lo legge, e va vista. */}
            <div className="mt-4 rounded border border-pine/25 bg-paper px-3 py-2.5">
              <p className="font-semibold uppercase tracking-widest text-pine">
                Validazione
              </p>
              <div className="mt-1.5 flex items-end justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-ink">
                    Verificato dal team tecnico prima della consegna
                  </p>
                  <p className="text-gray-warm">
                    Rilievi allegati · ogni valore con la sua fonte
                  </p>
                </div>
                <span
                  className="shrink-0 -rotate-6 rounded border-2 border-pine/60 px-2 py-1 font-display font-semibold uppercase tracking-wider text-pine/80"
                  style={{ fontSize: "0.95em" }}
                >
                  Validato
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export function DocumentoEsito({
  tono = "scuro",
  grande = false,
}: {
  tono?: "chiaro" | "scuro";
  grande?: boolean;
}) {
  const scuro = tono === "scuro";

  return (
    <div className="min-w-0">
      <FoglioDocumento grande={grande} />

      {/* Gli accessori: più piccoli, sotto, e detti come accessori. */}
      <div className="mt-4 grid grid-cols-2 gap-2">
        {ACCESSORI.map(({ icona: Icona, titolo, testo }) => (
          <div
            key={titolo}
            className={
              "rounded-lg border px-3 py-2.5 " +
              (scuro
                ? "border-white/12 bg-white/[0.04]"
                : "border-line bg-white")
            }
          >
            <Icona
              size={14}
              aria-hidden
              className={scuro ? "text-mint-bright" : "text-mint"}
            />
            <p
              className={
                "mt-1.5 text-xs font-semibold " +
                (scuro ? "text-white" : "text-ink")
              }
            >
              {titolo}
            </p>
            <p
              className={
                "mt-0.5 text-[11px] leading-snug " +
                (scuro ? "text-moss/60" : "text-gray-warm")
              }
            >
              {testo}
            </p>
          </div>
        ))}
      </div>

      <p
        className={
          "mt-3 px-1 text-[11px] leading-relaxed " +
          (scuro ? "text-moss/60" : "text-gray-warm")
        }
      >
        Documenti che reggono la lettura di chi li riceve: banca, capofiliera,
        stazione appaltante, organismo di certificazione.
      </p>
    </div>
  );
}
