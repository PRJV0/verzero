import type { Metadata } from "next";
import { CalendarRange, Check, ExternalLink, Globe, Sparkles, X } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import {
  componiScheda,
  destinazioniCampo,
  type CampoScheda,
} from "@/lib/impresa";
import { FONTI_DICHIARATE } from "@/lib/arricchimento/orchestratore";

import { caricaContesto } from "../_contesto";
import {
  CardOpportunita,
  ChipDestinazione,
  IntestazioneSezione,
  Occhiello,
  SelettoreCliente,
  ZonaInput,
} from "../_ui";
import { AggiornaDati } from "./aggiorna";
import { AzioniCampo, ContatoreDaConfermare } from "./conferma";
import { salvaAnnoRendicontazione, salvaSitoWeb } from "./azioni";
import { anniSelezionabili, annoElaborazione } from "@/lib/periodo";

export const metadata: Metadata = {
  title: "La tua impresa — il tuo ecosistema",
  robots: { index: false, follow: false },
};

/** L'icona del Motore: lo zero E1 in miniatura (dato recuperato da noi). */
function IconaMotore({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 14 18" className={className} fill="none" aria-hidden>
      <ellipse cx="7" cy="9" rx="4.6" ry="6.8" stroke="currentColor" strokeWidth="2.2" />
    </svg>
  );
}

/**
 * Il link alla pagina esatta da cui viene un dato (SPEC §12.D): senza
 * questo il cliente non potrebbe controllare ciò che gli proponiamo, e
 * un dato non controllabile non ha posto in un documento.
 */
function LinkFonte({ url }: { url: string }) {
  let etichetta = url;
  try {
    const u = new URL(url);
    etichetta = `${u.hostname.replace(/^www\./, "")}${u.pathname === "/" ? "" : u.pathname}`;
  } catch {
    // URL non interpretabile: si mostra com'è.
  }
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer nofollow"
      className="inline-flex max-w-full items-center gap-1 text-[10px] text-gray-light underline decoration-dotted hover:text-pine"
    >
      <ExternalLink size={9} className="shrink-0" />
      <span className="truncate">{etichetta.slice(0, 52)}</span>
    </a>
  );
}

/** Il badge di provenienza: la firma visiva della scheda (§12.H). */
function BadgeProvenienza({ campo }: { campo: CampoScheda }) {
  if (campo.rifiutato) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-paper px-2 py-0.5 text-[10px] font-semibold text-gray-warm">
        <X size={10} strokeWidth={3} /> Proposta respinta da te
      </span>
    );
  }
  if (campo.daConfermare) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-soft px-2 py-0.5 text-[10px] font-semibold text-amber-ink">
        Da confermare{campo.fonte ? ` · ${campo.fonte}` : ""}
      </span>
    );
  }
  if (campo.provenienza === "motore") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-mint/15 px-2 py-0.5 text-[10px] font-semibold text-mint">
        <IconaMotore className="h-3 w-2" /> Recuperato da noi
        {campo.fonte ? ` · ${campo.fonte}` : ""}
      </span>
    );
  }
  if (campo.provenienza === "utente") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-moss px-2 py-0.5 text-[10px] font-semibold text-pine">
        <Check size={10} strokeWidth={3} /> Inserito da te
        {campo.fonte ? ` · ${campo.fonte}` : ""}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-dashed border-pine/30 bg-white px-2 py-0.5 text-[10px] font-semibold text-gray-warm">
      <Sparkles size={10} className="text-mint" /> Lo recupereremo noi
      {campo.fonte ? ` · ${campo.fonte}` : ""}
    </span>
  );
}

/**
 * LA TUA IMPRESA (SPEC §12.H, sezioni 2.0 e 2.1): la scheda anagrafica,
 * ogni campo con la sua provenienza e la sua destinazione. Il Motore la
 * compila interrogando le banche dati ufficiali; ciò che porta arriva in
 * stato «da confermare» e diventa definitivo solo quando lo confermi tu.
 */
export default async function ImpresaPage({
  searchParams,
}: {
  searchParams: Promise<{ cliente?: string }>;
}) {
  const { cliente } = await searchParams;
  const contesto = await caricaContesto(cliente, "/dashboard/impresa");
  const supabase = await createClient();

  const [{ data: righe }, { data: moduli }] = contesto.org
    ? await Promise.all([
        supabase
          .from("company_fields")
          .select("campo, valore, provenienza, fonte, fonte_url, stato")
          .eq("organization_id", contesto.org.id),
        supabase
          .from("module_activations")
          .select("module")
          .eq("organization_id", contesto.org.id),
      ])
    : [{ data: [] }, { data: [] }];

  const scheda = contesto.org ? componiScheda(contesto.org, righe ?? []) : [];
  const moduliAttivi = (moduli ?? []).map((m) => m.module);
  const tuttiCampi = scheda.flatMap((g) => g.campi);
  const daConfermare = tuttiCampi.filter((c) => c.daConfermare).length;
  const sitoDichiarato = tuttiCampi.find((c) => c.chiave === "sito_web")?.valore;
  const fontiSpente = FONTI_DICHIARATE.filter((f) => f.stato === "spenta");

  return (
    <main>
      <IntestazioneSezione
        eyebrow="LA TUA IMPRESA"
        titolo="La scheda della tua impresa"
        sotto="Ogni dato dichiara da dove viene — inserito da te, recuperato dall'AI Ver0 o in arrivo dalle banche dati ufficiali — e a quali documenti sta contribuendo: rispondi una volta sola, allo smistamento pensiamo noi."
      />

      <SelettoreCliente contesto={contesto} base="/dashboard/impresa" />

      {!contesto.org ? (
        contesto.ruolo === "impresa" ? (
          <div className="mt-8">
            <CardOpportunita
              titolo="La scheda nasce con il primo percorso"
              testo="Alla registrazione la compiliamo con i tuoi dati, e il resto lo recuperiamo dalle fonti ufficiali: niente da ricopiare."
              cta={{ href: "/servizi", label: "Apri il catalogo" }}
            />
          </div>
        ) : null
      ) : (
        <div className="mt-8 space-y-4">
          {/* ZONA DI INSERIMENTO — l'anno decide titoli, periodi e richieste
              di TUTTI i documenti, quindi sta in cima e si vede che è un
              campo, non una scritta (SPEC §12.C). */}
          {contesto.ruolo === "impresa" && (
            <ZonaInput>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex min-w-0 items-start gap-3">
                  <span
                    aria-hidden
                    className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-pine"
                  >
                    <CalendarRange size={18} />
                  </span>
                  <div className="min-w-0">
                    <Occhiello>Periodo dei tuoi documenti</Occhiello>
                    <p className="mt-1 font-display text-xl text-ink">
                      Anno di rendicontazione
                    </p>
                    <p className="mt-1 max-w-xl text-sm leading-relaxed text-gray-warm">
                      I documenti si riferiscono sempre a un anno solare già
                      chiuso — è ciò che li rende accettabili da banche ed
                      enti. Da non confondere con l&apos;anno in cui li
                      elaboriamo, che è il {annoElaborazione()}.
                    </p>
                  </div>
                </div>
                <form
                  action={salvaAnnoRendicontazione}
                  className="flex shrink-0 items-center gap-2"
                >
                  <label htmlFor="anno" className="sr-only">
                    Anno di rendicontazione
                  </label>
                  <select
                    id="anno"
                    name="anno"
                    defaultValue={contesto.org.anno_rendicontazione}
                    className="rounded-lg border-2 border-pine/30 bg-white px-3 py-2.5 font-display text-lg tabular-nums text-ink outline-none focus:border-mint"
                  >
                    {anniSelezionabili().map((a) => (
                      <option key={a} value={a}>
                        {a}
                      </option>
                    ))}
                  </select>
                  <button
                    type="submit"
                    className="vz-press rounded-lg bg-pine px-4 py-2.5 text-sm font-semibold text-white"
                  >
                    Salva
                  </button>
                </form>
              </div>
            </ZonaInput>
          )}

          {/* Il recupero automatico, con progressione vera per fonte */}
          <AggiornaDati
            fonti={FONTI_DICHIARATE}
            organizationId={
              contesto.ruolo === "consulente" ? contesto.org.id : undefined
            }
          />

          {/* Senza sito dichiarato il Motore non ha da dove leggere: lo
              chiediamo qui, spiegando cosa ne farà (§12.D). */}
          {!sitoDichiarato && contesto.ruolo === "impresa" && (
            <form
              action={salvaSitoWeb}
              className="rounded-2xl border border-dashed border-pine/30 bg-moss/40 p-5"
            >
              <p className="flex items-center gap-2 text-sm font-semibold text-ink">
                <Globe size={15} className="text-pine" /> Qual è il tuo sito?
              </p>
              <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-gray-warm">
                Dal tuo sito l&apos;AI Ver0 prende ciò che nessuna banca dati ha:
                come descrivi la tua attività, i prodotti, le sedi, i mercati e
                le certificazioni che esponi. Sono le parti narrative del
                bilancio di sostenibilità e dei manuali — quelle che di solito
                si scrivono da zero. Leggiamo solo il tuo sito, rispettando le
                regole che pubblica per i programmi automatici, e ogni frase
                che prendiamo resta una citazione con il link alla pagina.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <input
                  type="text"
                  name="sito"
                  required
                  placeholder="www.latuaimpresa.it"
                  className="min-w-0 flex-1 rounded-lg border border-line bg-white px-3 py-2.5 text-sm outline-none transition-colors focus:border-mint"
                />
                <button
                  type="submit"
                  className="vz-press shrink-0 rounded-lg bg-pine px-4 py-2.5 text-sm font-semibold text-white"
                >
                  Salva il sito
                </button>
              </div>
            </form>
          )}

          {daConfermare > 0 && contesto.ruolo === "impresa" && (
            <ContatoreDaConfermare iniziale={daConfermare} />
          )}
          {daConfermare > 0 && contesto.ruolo === "consulente" && (
            <p className="rounded-xl border border-amber-ink/25 bg-amber-soft/60 px-4 py-3 text-sm leading-relaxed text-amber-ink">
              <strong className="font-semibold tabular-nums">
                {daConfermare}{" "}
                {daConfermare === 1
                  ? "dato aspetta la conferma dell'impresa"
                  : "dati aspettano la conferma dell'impresa"}
              </strong>
              : li abbiamo recuperati noi, ma entrano nei documenti solo quando
              è l&apos;impresa a dire che sono giusti.
            </p>
          )}

          {scheda.map((gruppo) => (
            <section
              key={gruppo.titolo}
              className="overflow-hidden rounded-2xl border border-line bg-white"
            >
              <h2 className="border-b-2 border-line bg-paper px-5 py-3 font-display text-lg text-ink">
                {gruppo.titolo}
              </h2>
              <dl>
                {gruppo.campi.map((c, i) => {
                  // Un dato, più documenti (§12.F): il chip dice a quali
                  // documenti in lavorazione questo campo contribuisce.
                  const dest = destinazioniCampo(c.chiave, moduliAttivi);
                  return (
                    <div
                      key={c.chiave}
                      className={
                        "flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-5 py-3.5" +
                        (i > 0 ? " border-t border-line/60" : "") +
                        (c.daConfermare ? " bg-amber-soft/25" : "")
                      }
                    >
                      <dt className="min-w-0 text-sm text-gray-warm">
                        {c.label}
                        {dest && (
                          <span className="mt-1 flex flex-wrap gap-1">
                            {dest === "tutti" ? (
                              <ChipDestinazione label="tutti i tuoi documenti" />
                            ) : (
                              dest.map((d) => (
                                <ChipDestinazione key={d} label={d} />
                              ))
                            )}
                          </span>
                        )}
                      </dt>
                      <dd className="flex min-w-0 flex-col items-end gap-1 text-right">
                        <span
                          className={
                            "text-sm " +
                            (c.valore
                              ? "font-semibold tabular-nums text-ink"
                              : "text-gray-light")
                          }
                        >
                          {c.valore ?? "—"}
                        </span>
                        <BadgeProvenienza campo={c} />
                        {/* La conferma: il dato diventa tuo, e da lì in poi
                            nessun recupero successivo lo sovrascrive. */}
                        {c.fonteUrl && <LinkFonte url={c.fonteUrl} />}
                        {c.daConfermare && contesto.ruolo === "impresa" && (
                          <AzioniCampo chiave={c.chiave} />
                        )}
                      </dd>
                    </div>
                  );
                })}
              </dl>
            </section>
          ))}

          {/* Trasparenza sulle fonti che non possiamo ancora interrogare:
              meglio dire perché che lasciar credere a una dimenticanza. */}
          {fontiSpente.length > 0 && (
            <details className="rounded-2xl border border-line bg-white p-5">
              <summary className="cursor-pointer text-sm font-semibold text-ink">
                Perché alcune fonti non le interroghiamo ancora
              </summary>
              <ul className="mt-3 space-y-3">
                {fontiSpente.map((f) => (
                  <li key={f.chiave}>
                    <p className="text-sm font-medium text-ink">{f.nome}</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-gray-warm">
                      {f.vincolo}
                    </p>
                  </li>
                ))}
              </ul>
              <p className="mt-3 border-t border-line pt-3 text-xs leading-relaxed text-gray-light">
                Preferiamo un campo vuoto a un dato preso in modo scorretto:
                è la stessa disciplina con cui costruiamo i tuoi documenti.
              </p>
            </details>
          )}
        </div>
      )}
    </main>
  );
}
