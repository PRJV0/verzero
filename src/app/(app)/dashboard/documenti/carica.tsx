"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, CircleAlert, Loader2, Upload } from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import {
  ESTENSIONI_AMMESSE,
  nomeSicuro,
  pesoLeggibile,
  tipoDocumento,
  validaFile,
} from "@/lib/documenti";

import { registraDocumento } from "./azioni";

type Esito = {
  nome: string;
  stato: "in-corso" | "fatto" | "errore";
  messaggio?: string;
  /** Dove è finito: si dice subito, è il senso dell'hub. */
  destinazioni?: string[];
};

/**
 * IL CARICATORE (SPEC §12.E).
 *
 * Il file va DIRETTAMENTE nel bucket privato dal browser: non passa dal
 * nostro server, che per una scansione da 20 MB sarebbe uno stretto
 * inutile. La cartella è l'organizzazione e la RLS dello storage
 * verifica che sia la propria — chi provasse a scrivere altrove viene
 * respinto dal database, non da un controllo nel client.
 *
 * Ogni file ha la sua riga di esito: uno che fallisce non ferma gli
 * altri, e il motivo è scritto in italiano — «pesa 34 MB, il limite è
 * 20» dice cosa fare, «upload error» no.
 */
export function CaricaDocumenti({
  organizationId,
  compatto = false,
  tipoAtteso,
}: {
  organizationId: string;
  /** Versione ridotta, per l'uso dentro il fascicolo di un percorso. */
  compatto?: boolean;
  /** Quando si carica da un fascicolo: cosa stiamo aspettando lì. */
  tipoAtteso?: string;
}) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [sopra, setSopra] = useState(false);
  const [esiti, setEsiti] = useState<Esito[]>([]);
  const [inCorso, setInCorso] = useState(false);

  async function caricaTutti(files: FileList | File[]) {
    const elenco = [...files];
    if (elenco.length === 0) return;
    setInCorso(true);
    setEsiti(elenco.map((f) => ({ nome: f.name, stato: "in-corso" })));

    const supabase = createClient();
    // Uno per volta, di proposito: l'ordine degli esiti resta leggibile e
    // non saturiamo la connessione di chi carica da un telefono.
    for (const [i, file] of elenco.entries())
      await (async () => {
        const aggiorna = (e: Partial<Esito>) =>
          setEsiti((precedenti) =>
            precedenti.map((p, j) => (j === i ? { ...p, ...e } : p)),
          );

        const errore = validaFile(file);
        if (errore) {
          aggiorna({ stato: "errore", messaggio: errore });
          return;
        }

        const percorso = `${organizationId}/${Date.now()}-${nomeSicuro(file.name)}`;
        const { error: erroreCaricamento } = await supabase.storage
          .from("documenti")
          .upload(percorso, file, {
            contentType: file.type || "application/octet-stream",
            upsert: false,
          });
        if (erroreCaricamento) {
          aggiorna({
            stato: "errore",
            messaggio:
              /exceeded|maximum/i.test(erroreCaricamento.message)
                ? `«${file.name}» supera il limite di 20 MB.`
                : `Non siamo riusciti a caricare «${file.name}». Riprova tra un momento.`,
          });
          return;
        }

        const esito = await registraDocumento({
          percorso,
          nomeFile: file.name,
          mime: file.type || "application/pdf",
          dimensione: file.size,
        });

        if (!esito.ok) {
          // Registrazione fallita: togliamo il file, per non lasciare
          // nel bucket qualcosa che nessuna schermata mostrerà mai.
          await supabase.storage.from("documenti").remove([percorso]);
          aggiorna({ stato: "errore", messaggio: esito.errore });
          return;
        }

        const tipo = tipoDocumento(esito.tipo);
        aggiorna({
          stato: "fatto",
          messaggio:
            esito.stato === "da_classificare"
              ? "Caricato, ma non siamo sicuri di cosa sia: diccelo tu qui sotto."
              : esito.stato === "non_pertinente"
                ? `Riconosciuto come ${tipo?.nome.toLowerCase()}: non serve ai percorsi che hai attivi, lo teniamo nell'archivio.`
                : `Riconosciuto come ${tipo?.nome.toLowerCase()}.`,
          destinazioni:
            esito.stato === "smistato"
              ? (tipo?.destinazioni.map((d) => `${d.doc} → ${d.sezione}`) ?? [])
              : [],
        });
      })();

    setInCorso(false);
    router.refresh();
  }

  const zona = compatto
    ? "rounded-lg border border-dashed px-3 py-3 text-center"
    : "rounded-2xl border-2 border-dashed px-6 py-10 text-center";

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setSopra(true);
        }}
        onDragLeave={() => setSopra(false)}
        onDrop={(e) => {
          e.preventDefault();
          setSopra(false);
          void caricaTutti(e.dataTransfer.files);
        }}
        className={`${zona} transition-colors ${
          sopra ? "border-mint bg-mint/5" : "border-pine/25 bg-moss/30"
        }`}
      >
        <input
          ref={input}
          type="file"
          multiple
          accept=".pdf,.jpg,.jpeg,.png,.webp,.heic,.heif,application/pdf,image/*"
          onChange={(e) => {
            if (e.target.files) void caricaTutti(e.target.files);
            e.target.value = "";
          }}
          className="hidden"
        />

        {compatto ? (
          <button
            type="button"
            onClick={() => input.current?.click()}
            disabled={inCorso}
            className="inline-flex items-center gap-2 text-xs font-semibold text-pine hover:underline disabled:opacity-60"
          >
            {inCorso ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <Upload size={13} />
            )}
            {inCorso ? "Caricamento…" : "Carica qui"}
            {tipoAtteso && !inCorso && (
              <span className="font-normal text-gray-light">· {tipoAtteso}</span>
            )}
          </button>
        ) : (
          <>
            <span className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-xl bg-white text-pine">
              <Upload size={22} />
            </span>
            <p className="mt-3 font-display text-xl text-ink">
              Trascina qui i tuoi documenti
            </p>
            <p className="mx-auto mt-1.5 max-w-md text-sm leading-relaxed text-gray-warm">
              Puoi caricarne quanti vuoi in una volta sola. Li riconosciamo noi
              e ti diciamo subito in quale documento finiscono.
            </p>
            <button
              type="button"
              onClick={() => input.current?.click()}
              disabled={inCorso}
              className="vz-press mt-4 inline-flex items-center gap-2 rounded-lg bg-pine px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
            >
              {inCorso ? (
                <>
                  <Loader2 size={15} className="animate-spin" /> Caricamento…
                </>
              ) : (
                "Scegli dal dispositivo"
              )}
            </button>
            <p className="mt-2.5 text-xs text-gray-light">
              {ESTENSIONI_AMMESSE} · fino a {pesoLeggibile(20 * 1024 * 1024)} per
              file
            </p>
          </>
        )}
      </div>

      {esiti.length > 0 && (
        <ul className="mt-3 space-y-2">
          {esiti.map((e, i) => (
            <li
              key={`${e.nome}-${i}`}
              className={
                "rounded-lg border px-3.5 py-2.5 text-sm " +
                (e.stato === "errore"
                  ? "border-amber-ink/30 bg-amber-soft/70"
                  : "border-line bg-white")
              }
            >
              <p className="flex items-start gap-2">
                {e.stato === "in-corso" && (
                  <Loader2 size={14} className="mt-0.5 shrink-0 animate-spin text-pine" />
                )}
                {e.stato === "fatto" && (
                  <Check size={14} strokeWidth={3} className="mt-0.5 shrink-0 text-mint" />
                )}
                {e.stato === "errore" && (
                  <CircleAlert size={14} className="mt-0.5 shrink-0 text-amber-ink" />
                )}
                <span className="min-w-0">
                  <span className="font-medium text-ink">{e.nome}</span>
                  {e.messaggio && (
                    <span
                      className={
                        "mt-0.5 block text-xs leading-snug " +
                        (e.stato === "errore" ? "text-amber-ink" : "text-gray-warm")
                      }
                    >
                      {e.messaggio}
                    </span>
                  )}
                </span>
              </p>
              {/* Dove è finito: è la promessa dell'hub, quindi si vede. */}
              {e.destinazioni && e.destinazioni.length > 0 && (
                <ul className="mt-1.5 space-y-1 pl-6">
                  {e.destinazioni.map((d) => (
                    <li
                      key={d}
                      className="text-xs font-medium text-mint"
                    >
                      <span aria-hidden className="mr-1">
                        →
                      </span>
                      alimenta {d}
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
