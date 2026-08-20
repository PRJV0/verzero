import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Archive,
  CircleHelp,
  ClipboardList,
  FileText,
  Image as ImageIcon,
  Inbox,
} from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { documentiAttivi } from "@/lib/bozza";
import {
  TIPI_DOCUMENTO,
  pesoLeggibile,
  smistamento,
  tipiRichiesti,
  tipoDocumento,
} from "@/lib/documenti";

import { caricaContesto } from "../_contesto";
import {
  CardOpportunita,
  IntestazioneSezione,
  Occhiello,
  SelettoreCliente,
  TestataSezione,
} from "../_ui";
import { CaricaDocumenti } from "./carica";
import { correggiTipoDocumento, eliminaDocumento } from "./azioni";

export const metadata: Metadata = {
  title: "Documenti — il tuo ecosistema",
  robots: { index: false, follow: false },
};

const DATA = (iso: string) =>
  new Date(iso).toLocaleDateString("it-IT", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

/**
 * HUB DOCUMENTI (SPEC §12.E): la porta principale.
 *
 * Struttura della pagina, nell'ordine in cui serve a chi arriva:
 *  1. si carica — subito, senza preamboli;
 *  2. si vede cosa serve DAVVERO ai propri percorsi, con esempi concreti;
 *  3. si vede cosa è già arrivato e DOVE è finito.
 *
 * Nessuna promessa di «carica qualsiasi cosa»: l'elenco è quello dei tuoi
 * percorsi, e se un documento non serve lo diciamo con garbo invece di
 * archiviarlo in silenzio facendo credere che stia lavorando per te.
 */
export default async function DocumentiPage({
  searchParams,
}: {
  searchParams: Promise<{ cliente?: string }>;
}) {
  const { cliente } = await searchParams;
  const contesto = await caricaContesto(cliente, "/dashboard/documenti");
  const supabase = await createClient();

  const [{ data: moduli }, { data: documenti }] = contesto.org
    ? await Promise.all([
        supabase
          .from("module_activations")
          .select("module, stato")
          .eq("organization_id", contesto.org.id),
        supabase
          .from("documents")
          .select("*")
          .eq("organization_id", contesto.org.id)
          .order("created_at", { ascending: false }),
      ])
    : [{ data: [] }, { data: [] }];

  const attiviDocs = documentiAttivi(
    (moduli ?? [])
      .filter((m) => ["attivo", "in_attivazione"].includes(m.stato))
      .map((m) => m.module),
  );
  const richiesti = tipiRichiesti(attiviDocs);
  const archivio = documenti ?? [];
  const caricatiPerTipo = new Set(
    archivio.filter((d) => d.tipo).map((d) => d.tipo as string),
  );
  const daClassificare = archivio.filter((d) => d.stato === "da_classificare");

  if (!contesto.org) {
    return (
      <main>
        <IntestazioneSezione
          eyebrow="DOCUMENTI"
          titolo="Porta qui i documenti che hai già"
          sotto="L'archivio unico della tua impresa: carichi una volta sola e smistiamo noi ciò che serve a ciascun percorso."
        />
        <SelettoreCliente contesto={contesto} base="/dashboard/documenti" />
        {contesto.ruolo === "impresa" && (
          <div className="mt-8">
            <CardOpportunita
              titolo="L'archivio nasce col primo percorso"
              testo="Attiva un percorso e qui comparirà la lista esatta dei documenti che servono — con gli esempi, e senza chiederti nulla di superfluo."
              cta={{ href: "/servizi", label: "Apri il catalogo" }}
            />
          </div>
        )}
      </main>
    );
  }

  return (
    <main>
      <IntestazioneSezione
        eyebrow="DOCUMENTI"
        titolo="Porta qui i documenti che hai già"
        sotto="Carichi una volta sola: l'AI Ver0 riconosce cosa sono e li manda ai percorsi giusti, dicendoti dove è finito ciascuno. Niente moduli da compilare, niente nomi da rispettare."
      />

      <SelettoreCliente contesto={contesto} base="/dashboard/documenti" />

      {contesto.ruolo === "impresa" && (
        <section className="mt-8">
          <CaricaDocumenti organizationId={contesto.org.id} />
        </section>
      )}

      {/* 2. Cosa serve, derivato dai percorsi attivi — con esempi veri. */}
      {richiesti.length > 0 && (
        <section className="mt-10">
          <TestataSezione
            icona={ClipboardList}
            titolo="Cosa serve ai tuoi percorsi"
            sotto="Solo questo, e niente altro. Quello che manca non blocca nulla: puoi portarlo quando ce l'hai."
          />

          <ul className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
            {richiesti.map(({ tipo, destinazioni }) => {
              const arrivato = caricatiPerTipo.has(tipo.chiave);
              return (
                <li
                  key={tipo.chiave}
                  className={
                    "rounded-2xl border p-5 transition-colors " +
                    (arrivato
                      ? "border-mint/40 bg-mint/5"
                      : "border-line bg-white")
                  }
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Occhiello>
                        {arrivato ? "Già in archivio" : "Serve a te"}
                      </Occhiello>
                      <p className="mt-0.5 text-[15px] font-bold leading-snug text-ink">
                        {tipo.nome}
                      </p>
                    </div>
                    <span
                      className={
                        "shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide " +
                        (arrivato
                          ? "bg-mint/15 text-mint"
                          : "bg-paper text-gray-warm")
                      }
                    >
                      {arrivato ? "Ricevuto" : "Da portare"}
                    </span>
                  </div>
                  <p className="mt-1.5 text-sm leading-relaxed text-gray-warm">
                    {tipo.spiega}
                  </p>
                  <p className="mt-2 text-xs text-gray-light">
                    Per esempio: {tipo.esempi.join(" · ")}
                  </p>
                  <ul className="mt-3 space-y-1 border-t border-line pt-3">
                    {destinazioni.map((d) => (
                      <li
                        key={`${d.doc}-${d.sezione}`}
                        className="text-xs font-medium text-pine"
                      >
                        <span aria-hidden className="mr-1 text-mint">
                          →
                        </span>
                        alimenta {d.doc} → {d.sezione}
                      </li>
                    ))}
                  </ul>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* 3. Cosa c'è già, e dove è finito. */}
      <section className="mt-10">
        <TestataSezione
          icona={Archive}
          titolo="Il tuo archivio"
          sotto="Tutto quello che hai portato, con la strada che ha preso."
        />

        {archivio.length === 0 ? (
          <div className="mt-3 flex items-start gap-3 rounded-2xl border border-dashed border-pine/30 bg-moss/40 p-5">
            <Inbox size={20} className="mt-0.5 shrink-0 text-pine" />
            <p className="text-sm leading-relaxed text-gray-warm">
              Ancora vuoto. Il primo documento che carichi comparirà qui con il
              suo tipo e la strada che ha preso — e le sezioni del tuo
              fascicolo si aggiorneranno di conseguenza.
            </p>
          </div>
        ) : (
          <>
            {daClassificare.length > 0 && (
              <p className="mt-3 flex items-start gap-2.5 rounded-xl border border-amber-ink/25 bg-amber-soft/60 px-4 py-3 text-sm leading-relaxed text-amber-ink">
                <CircleHelp size={16} className="mt-0.5 shrink-0" />
                <span>
                  <strong className="font-semibold">
                    {daClassificare.length}{" "}
                    {daClassificare.length === 1
                      ? "documento aspetta"
                      : "documenti aspettano"}{" "}
                    che ci dica cosa {daClassificare.length === 1 ? "è" : "sono"}
                  </strong>
                  : dal nome del file non l&apos;abbiamo capito, e preferiamo
                  chiedere piuttosto che metterlo nel posto sbagliato.
                </span>
              </p>
            )}

            <ul className="mt-3 space-y-2">
              {archivio.map((d) => {
                const tipo = tipoDocumento(d.tipo);
                const dove = smistamento(tipo, attiviDocs);
                const immagine = d.mime.startsWith("image/");
                return (
                  <li
                    key={d.id}
                    className="overflow-hidden rounded-xl border border-line bg-white"
                  >
                    <div className="flex flex-wrap items-start gap-3 p-4">
                      <span
                        aria-hidden
                        className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-paper text-pine"
                      >
                        {immagine ? (
                          <ImageIcon size={18} />
                        ) : (
                          <FileText size={18} />
                        )}
                      </span>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-ink">
                          {d.nome_file}
                        </p>
                        <p className="mt-0.5 text-xs text-gray-light">
                          {pesoLeggibile(d.dimensione)} · caricato il{" "}
                          {DATA(d.created_at)}
                          {tipo && (
                            <>
                              {" · "}
                              <span className="text-gray-warm">
                                {tipo.nome}
                                {d.tipo_confermato ? " (confermato da te)" : ""}
                              </span>
                            </>
                          )}
                        </p>

                        {/* Dove è finito: la promessa dell'hub. */}
                        {d.stato === "smistato" && dove.length > 0 && (
                          <ul className="mt-2 space-y-1">
                            {dove.map((x) => (
                              <li
                                key={`${x.doc}-${x.sezione}`}
                                className="text-xs font-medium text-mint"
                              >
                                <span aria-hidden className="mr-1">
                                  →
                                </span>
                                alimenta {x.doc} → {x.sezione}
                              </li>
                            ))}
                          </ul>
                        )}

                        {/* Non pertinente: si dice, con garbo. */}
                        {d.stato === "non_pertinente" && (
                          <p className="mt-2 text-xs leading-relaxed text-gray-warm">
                            Non serve ai percorsi che hai attivi: lo teniamo
                            nell&apos;archivio, e se un giorno attiverai un
                            percorso che lo usa lo troveremo già qui.
                          </p>
                        )}

                        {/* Da classificare: si chiede, senza indovinare. */}
                        {d.stato === "da_classificare" &&
                          contesto.ruolo === "impresa" && (
                            <form
                              action={async (formData: FormData) => {
                                "use server";
                                const scelto = String(formData.get("tipo") ?? "");
                                if (scelto) {
                                  await correggiTipoDocumento(d.id, scelto);
                                }
                              }}
                              className="mt-2 flex flex-wrap items-center gap-2"
                            >
                              <label
                                htmlFor={`tipo-${d.id}`}
                                className="text-xs text-gray-warm"
                              >
                                Che documento è?
                              </label>
                              <select
                                id={`tipo-${d.id}`}
                                name="tipo"
                                defaultValue=""
                                className="min-w-0 flex-1 rounded-lg border border-line bg-white px-2.5 py-1.5 text-xs text-ink outline-none focus:border-mint sm:flex-none"
                              >
                                <option value="" disabled>
                                  Scegli…
                                </option>
                                {TIPI_DOCUMENTO.map((t) => (
                                  <option key={t.chiave} value={t.chiave}>
                                    {t.nome}
                                  </option>
                                ))}
                              </select>
                              <button
                                type="submit"
                                className="rounded-lg border border-pine px-3 py-1.5 text-xs font-semibold text-pine transition-colors hover:bg-moss"
                              >
                                Conferma
                              </button>
                            </form>
                          )}
                      </div>

                      {contesto.ruolo === "impresa" && (
                        <form
                          action={async () => {
                            "use server";
                            await eliminaDocumento(d.id);
                          }}
                          className="shrink-0"
                        >
                          <button
                            type="submit"
                            className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-gray-light transition-colors hover:bg-paper hover:text-amber-ink"
                          >
                            Rimuovi
                          </button>
                        </form>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </section>

      <p className="mt-8 flex flex-wrap items-center gap-x-2 gap-y-1 border-t border-line pt-5 text-xs leading-relaxed text-gray-light">
        <span>
          I file restano in un archivio privato della tua impresa, in Unione
          Europea. Oggi li riconosciamo dal nome; la lettura del contenuto
          arriva con la prossima tappa.
        </span>
        <Link
          href="/privacy"
          className="inline-flex items-center gap-1 font-medium text-pine hover:underline"
        >
          Come trattiamo i tuoi dati <ArrowRight size={12} />
        </Link>
      </p>
    </main>
  );
}
