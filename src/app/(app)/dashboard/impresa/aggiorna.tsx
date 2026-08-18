"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, CircleAlert, Minus, RefreshCw } from "lucide-react";

/** Le fonti dichiarate, passate dal server: nomi e vincoli veri. */
export type FonteDichiarata = {
  chiave: string;
  nome: string;
  cosaRecupera: string;
  stato: "attiva" | "spenta";
  vincolo: string | null;
};

type EsitoFonte = {
  chiave: string;
  esito: "ok" | "nessun_dato" | "errore" | "non_disponibile";
  campiScritti: number;
  campi: string[];
  durataMs: number;
};

/**
 * «IL MOTORE STA LAVORANDO» (SPEC §12.H, tappa 2.1).
 *
 * L'arricchimento risponde in NDJSON, una riga per fonte appena finisce:
 * qui le leggiamo mentre arrivano, così la progressione è VERA. Niente
 * barre che si muovono da sole mentre il server pensa — sarebbe la stessa
 * bugia che rifiutiamo nei documenti.
 */
export function AggiornaDati({
  fonti,
  organizationId,
}: {
  fonti: FonteDichiarata[];
  /** Presente solo per il consulente: l'impresa su cui sta lavorando. */
  organizationId?: string;
}) {
  const router = useRouter();
  const [inCorso, setInCorso] = useState(false);
  const [esiti, setEsiti] = useState<Record<string, EsitoFonte>>({});
  const [errore, setErrore] = useState<string | null>(null);
  const [finito, setFinito] = useState(false);

  async function avvia() {
    setInCorso(true);
    setEsiti({});
    setErrore(null);
    setFinito(false);

    try {
      const risposta = await fetch("/api/arricchimento", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(organizationId ? { organizationId } : {}),
      });
      if (!risposta.ok || !risposta.body) {
        const j = (await risposta.json().catch(() => ({}))) as {
          error?: string;
        };
        setErrore(j.error ?? "Non siamo riusciti ad avviare il recupero.");
        setInCorso(false);
        return;
      }

      const lettore = risposta.body.getReader();
      const decoder = new TextDecoder();
      let resto = "";
      for (;;) {
        const { done, value } = await lettore.read();
        if (done) break;
        resto += decoder.decode(value, { stream: true });
        const righe = resto.split("\n");
        // L'ultima può essere spezzata a metà: la teniamo per il giro dopo.
        resto = righe.pop() ?? "";
        for (const riga of righe) {
          if (!riga.trim()) continue;
          try {
            const esito = JSON.parse(riga) as EsitoFonte;
            setEsiti((precedenti) => ({ ...precedenti, [esito.chiave]: esito }));
          } catch {
            // Riga malformata: la saltiamo, il resto del flusso vale.
          }
        }
      }
      setFinito(true);
      // Ricarico i dati del server: i campi nuovi devono comparire subito.
      router.refresh();
    } catch {
      setErrore("Connessione interrotta durante il recupero: riprova.");
    } finally {
      setInCorso(false);
    }
  }

  const scrittiTotali = Object.values(esiti).reduce(
    (somma, e) => somma + e.campiScritti,
    0,
  );

  return (
    <section className="rounded-2xl border border-line bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-ink">
            Il recupero automatico
          </h2>
          <p className="mt-1 max-w-xl text-sm leading-relaxed text-gray-warm">
            Il Motore interroga le banche dati ufficiali per compilare la
            scheda al posto tuo. Ciò che trova te lo mette davanti con la
            fonte: confermi tu, sempre.
          </p>
        </div>
        <button
          type="button"
          onClick={avvia}
          disabled={inCorso}
          className="vz-press inline-flex shrink-0 items-center gap-2 rounded-lg bg-pine px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
        >
          <RefreshCw size={15} className={inCorso ? "animate-spin" : ""} />
          {inCorso ? "Il Motore sta lavorando…" : "Aggiorna i dati"}
        </button>
      </div>

      {(inCorso || finito) && (
        <ul className="mt-4 space-y-1.5 border-t border-line pt-4">
          {fonti.map((f) => {
            const esito = esiti[f.chiave];
            const attesa = !esito && inCorso;
            return (
              <li
                key={f.chiave}
                className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 text-sm"
              >
                <span className="flex min-w-0 items-center gap-2">
                  <StatoPallino esito={esito?.esito} attesa={attesa} />
                  <span className="min-w-0 text-gray-warm">{f.nome}</span>
                </span>
                <span className="shrink-0 text-xs">
                  {!esito ? (
                    <span className="text-gray-light">
                      {inCorso ? "in attesa…" : "—"}
                    </span>
                  ) : (
                    <TestoEsito esito={esito} vincolo={f.vincolo} />
                  )}
                </span>
              </li>
            );
          })}
        </ul>
      )}

      {finito && (
        <p className="mt-3 rounded-lg bg-moss/50 px-3.5 py-2.5 text-sm leading-relaxed text-pine">
          {scrittiTotali > 0 ? (
            <>
              <strong className="font-semibold">
                {scrittiTotali}{" "}
                {scrittiTotali === 1 ? "dato recuperato" : "dati recuperati"}
              </strong>
              : li trovi qui sotto con la fonte, in attesa della tua conferma.
            </>
          ) : (
            <>
              Nessun dato nuovo da aggiungere questa volta. Le fonti che oggi
              non possiamo interrogare sono segnate qui sopra col motivo.
            </>
          )}
        </p>
      )}

      {errore && (
        <p
          role="alert"
          className="mt-3 rounded-lg border border-amber-ink/30 bg-amber-soft px-3.5 py-2.5 text-sm text-amber-ink"
        >
          {errore}
        </p>
      )}
    </section>
  );
}

function StatoPallino({
  esito,
  attesa,
}: {
  esito?: EsitoFonte["esito"];
  attesa: boolean;
}) {
  if (attesa) {
    return (
      <span
        aria-hidden
        className="h-4 w-4 shrink-0 animate-pulse rounded-full bg-line"
      />
    );
  }
  if (esito === "ok") {
    return (
      <span
        aria-hidden
        className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-mint/20 text-mint"
      >
        <Check size={11} strokeWidth={3.5} />
      </span>
    );
  }
  if (esito === "errore") {
    return (
      <span aria-hidden className="shrink-0 text-amber-ink">
        <CircleAlert size={15} />
      </span>
    );
  }
  return (
    <span aria-hidden className="shrink-0 text-gray-light">
      <Minus size={15} />
    </span>
  );
}

function TestoEsito({
  esito,
  vincolo,
}: {
  esito: EsitoFonte;
  vincolo: string | null;
}) {
  if (esito.esito === "ok") {
    return (
      <span className="font-medium text-mint">
        {esito.campiScritti}{" "}
        {esito.campiScritti === 1 ? "dato" : "dati"} recuperati
      </span>
    );
  }
  if (esito.esito === "errore") {
    return <span className="text-amber-ink">non ha risposto</span>;
  }
  if (esito.esito === "non_disponibile") {
    return (
      <span
        className="cursor-help text-gray-light underline decoration-dotted"
        title={vincolo ?? undefined}
      >
        non ancora accessibile
      </span>
    );
  }
  return <span className="text-gray-light">nulla di nuovo</span>;
}
