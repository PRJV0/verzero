"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  CheckCircle2,
  Download,
  Eye,
  FileCheck2,
  FileText,
  Loader2,
  RefreshCw,
  ShieldCheck,
  Wrench,
} from "lucide-react";

import type { EsitoGenerazione } from "@/lib/elaborato/archivio";
import type { Dichiarazione } from "@/lib/elaborato/dichiarazioni";
import type { Mancanza } from "@/lib/elaborato/mancanze";

import {
  dichiarazioneAzione,
  generaElaboratoAzione,
  linkVersioneAzione,
  type RichiestaDichiarazione,
} from "./azioni-elaborato";

/**
 * IL DOCUMENTO FINALE, SOTTO LA BOZZA.
 *
 * La bozza mostra la forma del documento mentre i dati arrivano; qui c'è
 * il documento che si consegna. Tre cose, in quest'ordine:
 *
 *   1. se si può generare — e se no, ESATTAMENTE che cosa manca, con il
 *      posto dove rimediare e con la distinzione fra ciò che può fare il
 *      cliente e ciò che tocca a noi;
 *   2. il bottone, e accanto l'anteprima della veste;
 *   3. le versioni già emesse, con il loro stato di validazione e i file.
 *
 * Nessuna percentuale durante la generazione: non la conosciamo, e una
 * percentuale inventata in una schermata che parla di documenti
 * verificabili è la finzione che non ci possiamo permettere.
 */

export type VersioneVista = {
  id: string;
  revisione: number;
  codice: string;
  data: string;
  motivo: string;
  pagine: number;
  docx: boolean;
  validata: boolean;
  validataIl: string | null;
};

const DATA = (iso: string) =>
  new Date(iso).toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" });

/**
 * LA DICHIARAZIONE, DOVE È IL RIMEDIO.
 *
 * Accanto alla mancanza che nessun documento può sciogliere — un
 * contatore aperto a metà anno, un'organizzazione senza consumi diretti —
 * c'è la frase da dichiarare, parola per parola quella che il documento
 * riporterà, e il gesto per dichiararla. Se è già resa e il documento la
 * trova smentita, il gesto è correggerla o ritirarla.
 */
function Dichiara({ d, fatto }: { d: Dichiarazione; fatto: () => void }) {
  const [inCorso, avvia] = useTransition();
  const [errore, setErrore] = useState<string | null>(null);
  const periodo = d.tipo === "periodo-contatore" && d.valore?.includes("/") ? d.valore.split("/") : null;
  const [dal, setDal] = useState(periodo?.[0] ?? "");
  const [al, setAl] = useState(periodo?.[1] ?? "");

  function invia(richiesta: RichiestaDichiarazione) {
    setErrore(null);
    avvia(async () => {
      const r = await dichiarazioneAzione(richiesta);
      if (r.ok) fatto();
      else setErrore(r.errore);
    });
  }

  const bottone =
    "inline-flex items-center gap-1 rounded-md border border-pine/30 bg-white px-2.5 py-1 text-[11px] font-semibold text-pine transition-colors hover:border-pine disabled:opacity-60";
  const secondario = "text-[11px] font-medium text-gray-warm underline-offset-2 hover:text-pine hover:underline disabled:opacity-60";

  return (
    <div className="mt-2 rounded-lg border border-pine/20 bg-white px-3 py-2.5">
      {d.tipo === "assenza" ? (
        <>
          <p className="text-[11px] leading-snug text-ink">
            {d.resa ? "Hai dichiarato: " : "Da dichiarare: "}«{d.testo}»
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            {d.resa ? (
              <button type="button" disabled={inCorso} className={bottone} onClick={() => invia({ tipo: "assenza", fonte: d.fonte, esercizio: d.esercizio, ritira: true })}>
                Ritira la dichiarazione
              </button>
            ) : (
              <button type="button" disabled={inCorso} className={bottone} onClick={() => invia({ tipo: "assenza", fonte: d.fonte, esercizio: d.esercizio })}>
                Lo dichiaro
              </button>
            )}
            {inCorso && <Loader2 size={13} className="animate-spin text-pine" />}
          </div>
        </>
      ) : (
        <>
          <p className="text-[11px] leading-snug text-ink">{d.resa ? `Hai dichiarato: «${d.testo}»` : d.testo}</p>
          <form
            className="mt-2 flex flex-wrap items-end gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              invia({ tipo: "periodo-contatore", punto: d.punto, esercizio: d.esercizio, dal, al });
            }}
          >
            <label className="flex flex-col text-[10px] font-medium text-gray-warm">
              Attivo dal
              <input
                type="date"
                required
                min={`${d.esercizio}-01-01`}
                max={`${d.esercizio}-12-31`}
                value={dal}
                onChange={(e) => setDal(e.target.value)}
                className="mt-0.5 rounded-md border border-line px-2 py-1 text-xs text-ink"
              />
            </label>
            <label className="flex flex-col text-[10px] font-medium text-gray-warm">
              al
              <input
                type="date"
                required
                min={`${d.esercizio}-01-01`}
                max={`${d.esercizio}-12-31`}
                value={al}
                onChange={(e) => setAl(e.target.value)}
                className="mt-0.5 rounded-md border border-line px-2 py-1 text-xs text-ink"
              />
            </label>
            <button type="submit" disabled={inCorso} className={bottone}>
              Dichiara il periodo
            </button>
            {inCorso && <Loader2 size={13} className="mb-1.5 animate-spin text-pine" />}
          </form>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <button
              type="button"
              disabled={inCorso}
              className={secondario}
              onClick={() => invia({ tipo: "periodo-contatore", punto: d.punto, esercizio: d.esercizio, inattivo: true })}
            >
              Nel {d.esercizio} non è stato attivo
            </button>
            {d.resa && (
              <button
                type="button"
                disabled={inCorso}
                className={secondario}
                onClick={() => invia({ tipo: "periodo-contatore", punto: d.punto, esercizio: d.esercizio, ritira: true })}
              >
                Ritira la dichiarazione
              </button>
            )}
          </div>
        </>
      )}
      {errore && <p className="mt-1.5 text-[11px] text-amber-ink">{errore}</p>}
    </div>
  );
}

export function PannelloElaborato({
  percorso,
  chiaveModello,
  documento,
  consegnabile,
  mancanze,
  disponibile,
  messaggioNonDisponibile,
  versioni,
  cambiato,
  superata,
  puoGenerare,
  cliente,
}: {
  percorso: string;
  chiaveModello: string;
  documento: string;
  consegnabile: boolean;
  mancanze: Mancanza[];
  disponibile: boolean;
  messaggioNonDisponibile: string;
  versioni: VersioneVista[];
  cambiato: string[];
  superata: string | null;
  puoGenerare: boolean;
  cliente?: string;
}) {
  const router = useRouter();
  const [inCorso, avvia] = useTransition();
  const [esito, setEsito] = useState<EsitoGenerazione | null>(null);
  const [erroreFile, setErroreFile] = useState<string | null>(null);

  const ultima = versioni[0];
  const mancanzeViste = esito?.esito === "mancanze" ? esito.mancanze : mancanze;
  const daTe = mancanzeViste.filter((m) => m.chi === "impresa");
  const daNoi = mancanzeViste.filter((m) => m.chi === "verzero");
  const bloccato = esito?.esito === "mancanze" || !consegnabile;

  const anteprima = `/dashboard/percorsi/anteprima?percorso=${encodeURIComponent(percorso)}&modello=${encodeURIComponent(chiaveModello)}${cliente ? `&cliente=${encodeURIComponent(cliente)}` : ""}`;

  function genera(forza: boolean) {
    setEsito(null);
    avvia(async () => {
      const r = await generaElaboratoAzione(percorso, chiaveModello, forza);
      setEsito(r);
      if (r.esito === "generata") router.refresh();
    });
  }

  async function scarica(id: string, formato: "pdf" | "docx") {
    setErroreFile(null);
    const r = await linkVersioneAzione(id, formato);
    if ("url" in r) window.location.href = r.url;
    else setErroreFile(r.errore);
  }

  const stato = bloccato
    ? { testo: `Mancano ${mancanzeViste.length} ${mancanzeViste.length === 1 ? "cosa" : "cose"}`, classe: "bg-amber-soft text-amber-ink" }
    : !ultima
      ? { testo: "Pronto da generare", classe: "bg-mint/15 text-mint" }
      : cambiato.length > 0
        ? { testo: "Nuova revisione possibile", classe: "bg-mint/15 text-mint" }
        : { testo: `Revisione ${ultima.revisione} generata`, classe: "bg-moss text-pine" };

  return (
    <section className="mt-4 overflow-hidden rounded-xl border border-line bg-white">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line bg-paper px-5 py-3 sm:px-6">
        <p className="flex items-center gap-2 text-sm font-semibold text-ink">
          <FileCheck2 size={16} className="text-pine" /> Il documento finale
          <span className="font-normal text-gray-warm">· {documento}</span>
        </p>
        <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${stato.classe}`}>{stato.testo}</span>
      </div>

      <div className="space-y-4 px-5 py-4 sm:px-6">
        {!disponibile && (
          <p className="rounded-lg bg-paper px-3 py-2 text-xs leading-relaxed text-gray-warm">{messaggioNonDisponibile}</p>
        )}

        {superata && (
          <p className="rounded-lg bg-amber-soft px-3 py-2 text-xs leading-relaxed text-amber-ink">{superata}</p>
        )}

        {bloccato ? (
          <div className="space-y-3">
            <p className="text-sm leading-relaxed text-gray-warm">
              Prima di consegnare un documento controlliamo che ci sia tutto quello che la sua struttura richiede, che
              ogni dato sia confermato e che ogni norma citata sia in vigore. Adesso non passa: ecco che cosa serve.
            </p>
            {daTe.length > 0 && (
              <div className="rounded-xl border-2 border-dashed border-pine/30 bg-moss/40 p-4">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-pine">Serve da te</p>
                <ul className="mt-2 space-y-2">
                  {daTe.map((m) => (
                    <li key={`${m.tipo}-${m.messaggio}`} className="rounded-lg border border-amber-ink/20 bg-amber-soft/70 px-3 py-2.5">
                      {m.sezione && <p className="text-[10px] font-semibold uppercase tracking-wide text-amber-ink/80">{m.sezione}</p>}
                      <p className="text-xs font-semibold leading-snug text-ink">{m.messaggio}</p>
                      <p className="mt-0.5 text-[11px] leading-snug text-gray-warm">{m.rimedio}</p>
                      {m.azione && (
                        <a href={m.azione.href} className="mt-1.5 inline-flex items-center gap-1 text-xs font-semibold text-pine underline-offset-2 hover:underline">
                          {m.azione.etichetta} <ArrowRight size={12} />
                        </a>
                      )}
                      {m.dichiarazione && puoGenerare && (
                        <Dichiara
                          d={m.dichiarazione}
                          fatto={() => {
                            setEsito(null);
                            router.refresh();
                          }}
                        />
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {daNoi.length > 0 && (
              <div className="rounded-xl border border-line bg-paper p-4">
                <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-gray-warm">
                  <Wrench size={12} /> Da parte nostra
                </p>
                <ul className="mt-2 space-y-2">
                  {daNoi.map((m) => (
                    <li key={`${m.tipo}-${m.messaggio}`} className="text-xs leading-snug text-ink">
                      {m.messaggio} <span className="text-gray-warm">{m.rimedio}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <p className="flex items-start gap-2 text-sm leading-relaxed text-ink">
              <ShieldCheck size={16} className="mt-0.5 shrink-0 text-mint" />
              <span>
                Il controllo di consegna è superato: tutte le sezioni richieste sono piene, ogni dato è confermato e ogni
                riferimento normativo è in vigore.
              </span>
            </p>
            {ultima && cambiato.length > 0 && (
              <p className="rounded-lg bg-mint/5 px-3 py-2 text-xs leading-relaxed text-pine">
                Dalla revisione {ultima.revisione}: {cambiato.join("; ")}.
              </p>
            )}
            <div className="flex flex-wrap items-center gap-2">
              {puoGenerare && disponibile && (
                <button
                  type="button"
                  onClick={() => genera(false)}
                  disabled={inCorso}
                  className="inline-flex items-center gap-2 rounded-lg bg-pine px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-pine-dark disabled:opacity-60"
                >
                  {inCorso ? <Loader2 size={15} className="animate-spin" /> : <FileText size={15} />}
                  {inCorso
                    ? "Stiamo componendo il documento"
                    : ultima
                      ? `Genera la revisione ${ultima.revisione + 1}`
                      : "Genera il documento"}
                </button>
              )}
              <a
                href={anteprima}
                target="_blank"
                rel="noopener"
                className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-2 text-xs font-medium text-pine transition-colors hover:border-pine/40"
              >
                <Eye size={14} /> Anteprima della veste
              </a>
            </div>
            {!puoGenerare && (
              <p className="text-xs text-gray-warm">Il documento lo genera l&apos;impresa titolare dei dati: da qui puoi consultare le versioni.</p>
            )}
          </div>
        )}

        {esito?.esito === "riuso" && (
          <div className="rounded-lg border border-line bg-paper px-3 py-2.5 text-xs leading-relaxed text-ink">
            <p>{esito.messaggio}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <button type="button" onClick={() => scarica(esito.versione.id, "pdf")} className="inline-flex items-center gap-1 font-semibold text-pine hover:underline">
                <Download size={12} /> Apri la revisione {esito.versione.revisione}
              </button>
              <button type="button" onClick={() => genera(true)} disabled={inCorso} className="inline-flex items-center gap-1 text-gray-warm hover:text-pine">
                <RefreshCw size={12} /> Genera comunque una nuova revisione
              </button>
            </div>
          </div>
        )}
        {esito?.esito === "generata" && (
          <p className="flex items-start gap-2 rounded-lg bg-mint/10 px-3 py-2 text-xs leading-relaxed text-pine">
            <CheckCircle2 size={14} className="mt-0.5 shrink-0" />
            <span>
              Revisione {esito.versione.revisione} generata ({esito.versione.codice}): è in attesa della validazione
              professionale, e la trovi qui sotto.{esito.avviso ? ` ${esito.avviso}` : ""}
            </span>
          </p>
        )}
        {(esito?.esito === "errore" || esito?.esito === "non-disponibile") && (
          <p className="rounded-lg bg-amber-soft px-3 py-2 text-xs text-amber-ink">{esito.messaggio}</p>
        )}

        {versioni.length > 0 && (
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-light">Versioni emesse</p>
            <ul className="mt-2 divide-y divide-line/70 rounded-lg border border-line">
              {versioni.map((v) => (
                <li key={v.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-ink">
                      Revisione {v.revisione}
                      <span className="ml-2 font-normal text-gray-warm">{DATA(v.data)}</span>
                    </p>
                    <p className="text-[11px] leading-snug text-gray-warm">
                      {v.motivo} · {v.codice}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${v.validata ? "bg-mint/15 text-mint" : "bg-paper text-gray-warm"}`}
                    >
                      {v.validata ? `Validata${v.validataIl ? ` il ${DATA(v.validataIl)}` : ""}` : "In attesa di validazione"}
                    </span>
                    <button type="button" onClick={() => scarica(v.id, "pdf")} className="inline-flex items-center gap-1 rounded-md border border-line px-2 py-1 text-[11px] font-medium text-pine hover:border-pine/40">
                      <Download size={12} /> PDF · {v.pagine} pag.
                    </button>
                    {v.docx && (
                      <button type="button" onClick={() => scarica(v.id, "docx")} className="inline-flex items-center gap-1 rounded-md border border-line px-2 py-1 text-[11px] font-medium text-pine hover:border-pine/40">
                        <Download size={12} /> DOCX
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
            {erroreFile && <p className="mt-2 text-xs text-amber-ink">{erroreFile}</p>}
          </div>
        )}
      </div>
    </section>
  );
}
