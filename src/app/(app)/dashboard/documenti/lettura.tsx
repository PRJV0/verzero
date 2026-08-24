"use client";

import { useState, useTransition } from "react";
import { BookOpenCheck, Leaf, Loader2 } from "lucide-react";

import { leggiDocumentoAzione } from "./azioni";

/**
 * IL BOTTONE CHE AVVIA LA LETTURA, E L'ATTESA CHE NE SEGUE.
 *
 * ═══ AVANZAMENTO ONESTO ═══
 * Leggere una bolletta richiede qualche decina di secondi, e in quel
 * tempo non sappiamo a che punto siamo: l'API risponde una volta sola,
 * alla fine. Quindi NON si mostra una percentuale — sarebbe inventata, e
 * una percentuale inventata è esattamente il genere di finzione che
 * questo prodotto non si può permettere in una schermata che parla di
 * dati verificabili.
 *
 * Si mostra invece che cosa sta succedendo (le tre fasi, in ordine, in
 * italiano) e un'indicazione di durata che non promette niente: «di
 * solito meno di un minuto». Chi guarda capisce che il sistema sta
 * lavorando senza che gli si menta su quanto manca.
 */

const FASI = [
  "Apriamo il documento",
  "Leggiamo le pagine",
  "Controlliamo che i valori tornino",
];

export function BottoneLettura({
  id,
  rilettura = false,
}: {
  id: string;
  rilettura?: boolean;
}) {
  const [inCorso, avvia] = useTransition();
  const [errore, setErrore] = useState<string | null>(null);
  const [riuso, setRiuso] = useState<string | null>(null);
  const [daSostituire, setDaSostituire] = useState<string | null>(null);
  const [fase, setFase] = useState(0);

  function leggi(opzioni: { forza?: boolean; sostituisci?: boolean } = {}) {
    setErrore(null);
    setRiuso(null);
    setDaSostituire(null);
    setFase(0);
    // Le fasi avanzano a tempo perché il tempo è l'unica cosa che
    // sappiamo davvero: sono una descrizione del lavoro, non una misura
    // del progresso, e infatti l'ultima non si chiude da sola.
    const passo = setInterval(
      () => setFase((f) => Math.min(f + 1, FASI.length - 1)),
      6000,
    );
    avvia(async () => {
      const esito = await leggiDocumentoAzione(id, opzioni);
      clearInterval(passo);
      if (esito.riusato) setRiuso(esito.messaggio);
      else if (esito.chiedeSostituzione) setDaSostituire(esito.messaggio);
      else if (!esito.ok) setErrore(esito.messaggio);
    });
  }

  if (inCorso) {
    return (
      <div className="mt-2 rounded-xl border border-mint/40 bg-mint/5 p-3">
        <p className="flex items-center gap-2 text-xs font-semibold text-pine">
          <Loader2 size={14} className="animate-spin" aria-hidden />
          {FASI[fase]}…
        </p>
        <p className="mt-1 text-[11px] text-gray-light" aria-live="polite">
          Di solito ci vuole meno di un minuto. Puoi restare qui: quando
          abbiamo finito compaiono i dati letti, da controllare.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={() => leggi()}
        className="vz-press inline-flex items-center gap-1.5 rounded-lg border border-pine px-3 py-1.5 text-xs font-semibold text-pine transition-colors hover:bg-moss"
      >
        <BookOpenCheck size={13} aria-hidden />
        {rilettura ? "Rileggi il documento" : "Leggi il contenuto"}
      </button>
      {errore && (
        <p className="mt-1.5 text-xs leading-relaxed text-amber-ink" role="alert">
          {errore}
        </p>
      )}

      {/* ═══ IL RIUSO ═══ Non è un limite ed è importante che non lo
          sembri: nulla è cambiato, quindi rifare il lavoro darebbe lo
          stesso risultato spendendo energia due volte. Accanto c'è
          SEMPRE il modo di rileggere comunque — un riuso senza via
          d'uscita non è un riuso, è un divieto (src/lib/motore/riuso.ts). */}
      {riuso && (
        <div className="mt-2 rounded-xl border border-mint/40 bg-mint/5 p-3" role="status">
          <p className="flex items-start gap-2 text-xs leading-relaxed text-pine-dark">
            <Leaf size={13} aria-hidden className="mt-0.5 shrink-0 text-mint" />
            {riuso}
          </p>
          <button
            type="button"
            onClick={() => leggi({ forza: true })}
            className="mt-2 text-[11px] font-semibold text-pine underline hover:no-underline"
          >
            Rileggilo comunque
          </button>
        </div>
      )}

      {daSostituire && (
        <div className="mt-2 rounded-xl border border-amber-ink/25 bg-amber-soft/60 p-3">
          <p className="text-xs leading-relaxed text-amber-ink">{daSostituire}</p>
          <button
            type="button"
            onClick={() => leggi({ forza: true, sostituisci: true })}
            className="mt-2 text-[11px] font-semibold text-amber-ink underline hover:no-underline"
          >
            Sì, rileggi e sostituisci
          </button>
        </div>
      )}
    </div>
  );
}
