"use client";

import { useId, useRef, useState } from "react";
import { Check, Upload } from "lucide-react";

import {
  FASCICOLI,
  FASCICOLO_CHIUSA,
  type DocumentoFascicolo,
} from "@/lib/motore";

/**
 * IL FASCICOLO DEL PERCORSO — anteprima fedele della dashboard (lo sarà).
 *
 * Trattamento solido: bordi netti, numeri tabellari, nessuna decorazione
 * gratuita. Un tab per percorso mostra la trasversalità del Motore; ogni
 * documento è una card con aspetto carta; l'anello punteggiato del
 * Sigillo fa da indicatore di completamento — stessa grammatica visiva
 * del marchio: un segmento pieno per documento in fascicolo.
 *
 * Tre stati, gerarchia voluta: CARICATO chiude, LO RECUPERIAMO NOI è il
 * momento-magia (menta, icona del Motore), DA CARICARE è un invito in
 * ambra — mai rosso, perché non è un errore.
 */

/** L'icona del Motore: lo zero canonico E1, in miniatura. */
function IconaMotore({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 14 18" className={className} fill="none" aria-hidden>
      <ellipse cx="7" cy="9" rx="4.6" ry="6.8" stroke="currentColor" strokeWidth="2.2" />
    </svg>
  );
}

/** Miniatura con aspetto carta: foglio, righe di testo, angolo piegato. */
function MiniaturaDocumento({ stato }: { stato: DocumentoFascicolo["stato"] }) {
  const attenuata = stato === "da-caricare";
  return (
    <svg
      viewBox="0 0 40 52"
      className={"shrink-0 " + (attenuata ? "opacity-60" : "")}
      style={{ height: 52, width: 40 }}
      aria-hidden
    >
      {/* Foglio con angolo piegato */}
      <path
        d="M3 3 h26 l8 8 v38 h-34 z"
        fill="#FFFFFF"
        stroke="#0E5238"
        strokeOpacity={attenuata ? 0.35 : 0.55}
        strokeWidth="1.6"
      />
      <path
        d="M29 3 v8 h8"
        fill="none"
        stroke="#0E5238"
        strokeOpacity={attenuata ? 0.35 : 0.55}
        strokeWidth="1.6"
      />
      {/* Righe di testo */}
      {[19, 25, 31, 37].map((y, i) => (
        <rect
          key={y}
          x="8"
          y={y}
          width={i === 3 ? 14 : 24}
          height="2.6"
          rx="1.3"
          fill="#0E5238"
          fillOpacity={attenuata ? 0.15 : 0.25}
        />
      ))}
    </svg>
  );
}

/** Anello punteggiato del Sigillo come indicatore di completamento. */
function AnelloFascicolo({ totale, pieni }: { totale: number; pieni: number }) {
  const R = 40;
  const punto = (gradi: number) => [
    50 + R * Math.cos((gradi * Math.PI) / 180),
    50 + R * Math.sin((gradi * Math.PI) / 180),
  ];
  const spazio = 14; // gradi di vuoto tra un segmento e l'altro
  const ampiezza = 360 / totale - spazio;
  const arco = (i: number) => {
    const from = -90 + i * (ampiezza + spazio) + spazio / 2;
    const to = from + ampiezza;
    const [x1, y1] = punto(from);
    const [x2, y2] = punto(to);
    return `M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${R} ${R} 0 ${ampiezza > 180 ? 1 : 0} 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`;
  };

  return (
    <svg
      viewBox="0 0 100 100"
      role="img"
      aria-label={`Fascicolo: ${pieni} documenti su ${totale} già presenti`}
      className="h-20 w-20 shrink-0"
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
      {/* Un segmento per documento: pieni prima, vuoti come traccia */}
      {Array.from({ length: totale }, (_, i) => (
        <path
          key={i}
          d={arco(i)}
          fill="none"
          stroke={i < pieni ? "#0E5238" : "#DCE4DD"}
          strokeWidth="5"
          strokeLinecap="round"
        />
      ))}
      <text
        x="50"
        y="47"
        textAnchor="middle"
        className="tabular-nums"
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "26px",
          fontVariantNumeric: "tabular-nums",
        }}
        fill="#0E5238"
      >
        {pieni}/{totale}
      </text>
      <text
        x="50"
        y="62"
        textAnchor="middle"
        style={{ fontSize: "8.5px", letterSpacing: "1px" }}
        fill="#6B7A6E"
      >
        DOCUMENTI
      </text>
    </svg>
  );
}

/** Il badge di stato: la gerarchia visiva dei tre momenti. */
function BadgeStato({ stato }: { stato: DocumentoFascicolo["stato"] }) {
  if (stato === "caricato") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-pine px-2.5 py-1 text-[11px] font-semibold text-white">
        <Check size={12} strokeWidth={3} /> Caricato
      </span>
    );
  }
  if (stato === "recuperato") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-mint/15 px-2.5 py-1 text-[11px] font-semibold text-mint">
        <IconaMotore className="h-3.5 w-2.5" /> Lo recuperiamo noi
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-soft px-2.5 py-1 text-[11px] font-semibold text-amber-ink">
      <Upload size={12} /> Da caricare
    </span>
  );
}

export function FascicoloPercorso() {
  const [attivo, setAttivo] = useState(FASCICOLI[0].id);
  const tablist = useRef<HTMLDivElement>(null);
  const idBase = useId();
  const fascicolo = FASCICOLI.find((f) => f.id === attivo)!;

  const pieni = fascicolo.documenti.filter(
    (d) => d.stato !== "da-caricare",
  ).length;
  const totale = fascicolo.documenti.length;

  // Frecce sinistra/destra tra i tab (pattern tablist).
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    const i = FASCICOLI.findIndex((f) => f.id === attivo);
    const prossimo =
      FASCICOLI[
        (i + (e.key === "ArrowRight" ? 1 : FASCICOLI.length - 1)) %
          FASCICOLI.length
      ];
    setAttivo(prossimo.id);
    tablist.current
      ?.querySelector<HTMLElement>(`#${CSS.escape(`${idBase}-tab-${prossimo.id}`)}`)
      ?.focus();
  };

  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-lift">
      {/* Tab per percorso: la trasversalità del Motore. Scorrevoli su mobile. */}
      <div
        ref={tablist}
        role="tablist"
        aria-label="Scegli il percorso"
        onKeyDown={onKeyDown}
        className="flex gap-1 overflow-x-auto border-b border-line bg-paper px-3 pt-3"
      >
        {FASCICOLI.map((f) => {
          const selezionato = f.id === attivo;
          return (
            <button
              key={f.id}
              id={`${idBase}-tab-${f.id}`}
              role="tab"
              aria-selected={selezionato}
              aria-controls={`${idBase}-panel-${f.id}`}
              tabIndex={selezionato ? 0 : -1}
              onClick={() => setAttivo(f.id)}
              className={
                "shrink-0 whitespace-nowrap rounded-t-lg border border-b-0 px-4 py-2.5 text-sm transition-colors " +
                (selezionato
                  ? "border-line bg-white font-semibold text-pine"
                  : "border-transparent text-gray-warm hover:text-pine")
              }
            >
              {f.label}
            </button>
          );
        })}
      </div>

      <div
        id={`${idBase}-panel-${fascicolo.id}`}
        role="tabpanel"
        aria-labelledby={`${idBase}-tab-${fascicolo.id}`}
        className="p-4 sm:p-6"
      >
        {/* Testa del fascicolo: anello + intestazione */}
        <div className="flex items-center gap-4 sm:gap-5">
          <AnelloFascicolo totale={totale} pieni={pieni} />
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-light">
              Fascicolo del percorso
            </p>
            <h3 className="mt-0.5 font-display text-2xl text-ink">
              {fascicolo.label}
            </h3>
            <p className="mt-1 text-xs leading-relaxed text-gray-warm">
              <span className="font-semibold tabular-nums text-pine">
                {pieni} su {totale}
              </span>{" "}
              documenti già in fascicolo · {fascicolo.norma}
            </p>
          </div>
        </div>

        {/* Le card-documento: impilate su mobile, a due colonne da sm in su */}
        <ul className="mt-5 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {fascicolo.documenti.map((d) => (
            <li
              key={d.nome}
              className="flex items-center gap-3 rounded-xl border border-line bg-white p-3"
            >
              <MiniaturaDocumento stato={d.stato} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-ink">
                  {d.nome}
                </p>
                <p className="mt-0.5 text-xs leading-snug text-gray-warm">
                  {d.requisito}
                </p>
                <div className="mt-1.5">
                  <BadgeStato stato={d.stato} />
                </div>
              </div>
            </li>
          ))}
        </ul>

        {/* La chiusa: resta, in ogni percorso. */}
        <p className="mt-4 border-t border-line pt-3 text-xs text-gray-warm">
          {FASCICOLO_CHIUSA}
        </p>
      </div>
    </div>
  );
}
