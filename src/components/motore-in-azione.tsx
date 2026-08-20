import { Check, FileSpreadsheet, FileText, Receipt } from "lucide-react";

/**
 * LA SCENA MADRE (brief §3.2): documento reale → campi che si accendono
 * uno a uno → documento conforme.
 *
 * È l'unica cosa che deve essere guardata in quella sezione: tutto il
 * resto le fa da didascalia (brief §2a, un solo protagonista).
 *
 * Perché in CSS e non in JS: una scena che si ripete non deve dipendere
 * da un osservatore, da un timer o da una libreria — e soprattutto non
 * deve poter restare a metà. Qui il ciclo è dichiarato una volta e il
 * browser lo esegue nel compositor; con «riduci movimento» il foglio si
 * mostra già pieno e già timbrato, che poi è il messaggio.
 *
 * Onestà: è un ESEMPIO, e lo dice. I numeri di un'impresa vera stanno
 * nel suo fascicolo, non in una vetrina.
 */

/** Le righe del foglio: nome del campo, valore, da dove arriva. */
const RIGHE = [
  { campo: "Ragione sociale", valore: "Metallika S.r.l.", fonte: "visura" },
  { campo: "Codice ATECO 2025", valore: "25.62.00", fonte: "registro imprese" },
  { campo: "Dipendenti (media annua)", valore: "34", fonte: "cedolini" },
  { campo: "Energia elettrica", valore: "412.800 kWh", fonte: "bollette" },
  { campo: "Gasolio per autotrazione", valore: "18.240 l", fonte: "fatture" },
  {
    campo: "Emissioni Scope 1 e 2",
    valore: "213,4 tCO₂e",
    fonte: "calcolato dall'AI Ver0",
    calcolato: true,
  },
];

/** I documenti di partenza: quelli che l'impresa ha già in un cassetto. */
const PARTENZA = [
  { icona: FileText, nome: "Visura" },
  { icona: Receipt, nome: "Bollette" },
  { icona: FileSpreadsheet, nome: "Cedolini" },
];

export function MotoreInAzione() {
  return (
    <div className="vz-scena mx-auto grid max-w-4xl grid-cols-1 items-center gap-6 md:grid-cols-[auto_1fr]">
      {/* SINISTRA — quello che l'impresa ha già. In colonna su desktop,
          in riga su mobile: sempre prima del foglio, perché è da lì che
          la scena parte. */}
      <div className="flex flex-row justify-center gap-2 md:flex-col md:gap-3">
        {PARTENZA.map(({ icona: Icona, nome }) => (
          <div
            key={nome}
            className="flex w-24 shrink-0 flex-col items-center gap-1.5 rounded-xl border border-white/15 bg-white/[0.04] px-3 py-3 md:w-28"
          >
            <Icona size={18} className="text-moss" aria-hidden />
            <span className="text-[11px] font-medium text-moss">{nome}</span>
          </div>
        ))}
      </div>

      {/* DESTRA — il foglio che si compila. */}
      <div className="relative">
        {/* Il tratto che collega i documenti al foglio: solo da tablet in
            su, dove i due blocchi stanno affiancati davvero. */}
        <span
          aria-hidden
          className="vz-flow-track absolute -left-6 top-1/2 hidden h-0.5 w-6 md:block"
        />

        <div className="relative overflow-hidden rounded-2xl bg-white p-5 text-left shadow-lift sm:p-6">
          {/* Intestazione del documento */}
          <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 border-b border-line pb-3">
            <p className="font-display text-lg text-ink">
              Inventario GHG · esempio
            </p>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-light">
              composto dall&apos;AI Ver0
            </p>
          </div>

          {/* Il cursore di lettura che scorre mentre i campi si accendono */}
          <span
            aria-hidden
            className="vz-lettura pointer-events-none absolute inset-x-0 top-16 h-14 bg-gradient-to-b from-mint/0 via-mint/10 to-mint/0"
            style={{ "--vz-corsa": "190px" } as React.CSSProperties}
          />

          <dl className="relative mt-3 space-y-2">
            {RIGHE.map((r, i) => (
              <div
                key={r.campo}
                className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 border-b border-line/60 pb-2 last:border-0"
              >
                <dt className="text-xs text-gray-warm">{r.campo}</dt>
                <dd
                  className="vz-riga-valore flex min-w-0 items-baseline gap-2"
                  style={{ "--vz-i": i } as React.CSSProperties}
                >
                  <span
                    className={
                      "text-sm font-semibold tabular-nums " +
                      (r.calcolato ? "text-mint" : "text-ink")
                    }
                  >
                    {r.valore}
                  </span>
                  <span className="shrink-0 rounded-full bg-moss px-1.5 py-0.5 text-[9px] font-semibold text-pine">
                    {r.fonte}
                  </span>
                </dd>
              </div>
            ))}
          </dl>

          {/* Il timbro: arriva quando il foglio è pieno. Dice «conforme
              allo standard», non «certificato» — la certificazione la
              rilascia un ente terzo, mai noi.

              Sta nel flusso e non sopra il foglio: in assoluto finiva a
              coprire l'ultima riga sugli schermi stretti. Anima solo
              l'opacità, quindi lo spazio è già suo e nulla si sposta
              quando compare. */}
          <div className="mt-4 flex justify-end">
          <div
            aria-hidden
            className="vz-timbro flex -rotate-2 items-center gap-2 rounded-full border-2 border-mint/40 bg-mint/10 px-3 py-1.5"
          >
            <Check size={14} strokeWidth={3} className="text-mint" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-mint">
              Conforme allo standard
            </span>
          </div>
          </div>
        </div>

        <p className="mt-2 text-center text-[11px] text-moss/70 md:text-left">
          Esempio di composizione: i dati della tua impresa restano nel tuo
          fascicolo.
        </p>
      </div>
    </div>
  );
}
