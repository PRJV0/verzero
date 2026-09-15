"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Download, Loader2, ShieldCheck } from "lucide-react";

import type { EsitoGenerazione } from "@/lib/elaborato/archivio";

import { linkPerValidazioneAzione, validaVersioneAzione } from "./azioni-validazione";

/**
 * Una revisione in attesa, con il modulo per registrarne la validazione.
 * Il documento si apre prima di validarlo: il bottone è sopra il modulo.
 */
export function ValidaRevisione({
  versione,
}: {
  versione: { id: string; titolo: string; organizzazione: string; creata: string };
}) {
  const router = useRouter();
  const [inCorso, avvia] = useTransition();
  const [esito, setEsito] = useState<EsitoGenerazione | null>(null);

  return (
    <li className="rounded-xl border border-line bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-ink">{versione.titolo}</p>
          <p className="text-xs text-gray-warm">
            {versione.organizzazione} · generata il {versione.creata}
          </p>
        </div>
        <button
          type="button"
          onClick={async () => {
            const url = await linkPerValidazioneAzione(versione.id);
            if (url) window.location.href = url;
          }}
          className="inline-flex items-center gap-1 rounded-md border border-line px-2 py-1 text-[11px] font-medium text-pine hover:border-pine/40"
        >
          <Download size={12} /> Apri il PDF
        </button>
      </div>
      <form
        action={(form) =>
          avvia(async () => {
            const r = await validaVersioneAzione(form);
            setEsito(r);
            if (r.esito === "generata") router.refresh();
          })
        }
        className="mt-3 grid gap-2 sm:grid-cols-2"
      >
        <input type="hidden" name="versione" value={versione.id} />
        <input name="professionista" required placeholder="Nome e cognome di chi valida" className="rounded-lg border border-line bg-paper px-3 py-1.5 text-sm" />
        <input name="qualifica" required placeholder="Qualifica (es. esperto in gestione dell'energia)" className="rounded-lg border border-line bg-paper px-3 py-1.5 text-sm" />
        <textarea
          name="rilievi"
          rows={3}
          placeholder="Rilievi, uno per riga (vuoto = nessun rilievo)"
          className="rounded-lg border border-line bg-paper px-3 py-1.5 text-sm sm:col-span-2"
        />
        <div className="flex items-center gap-2 sm:col-span-2">
          <button type="submit" disabled={inCorso} className="inline-flex items-center gap-1.5 rounded-lg bg-pine px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60">
            {inCorso ? <Loader2 size={13} className="animate-spin" /> : <ShieldCheck size={13} />} Registra la validazione
          </button>
          {esito?.esito === "generata" && (
            <span className="text-xs text-mint">Emessa la revisione {esito.versione.revisione}, validata.</span>
          )}
          {(esito?.esito === "errore" || esito?.esito === "non-disponibile") && (
            <span className="text-xs text-amber-ink">{esito.messaggio}</span>
          )}
          {esito?.esito === "mancanze" && (
            <span className="text-xs text-amber-ink">
              Il controllo di consegna non passa più: {esito.mancanze.map((m) => m.messaggio).join(" ")}
            </span>
          )}
        </div>
      </form>
    </li>
  );
}
