import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Building2,
  CalendarDays,
  FolderOpen,
  Megaphone,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { getServizio } from "@/lib/catalog";
import { componentiPercorso, completamentoBozza } from "@/lib/bozza";
import { isUnaTantum } from "@/lib/pricing";
import { suggerimenti } from "@/lib/suggerimenti";

import { caricaContesto } from "./_contesto";
import {
  CardOpportunita,
  IntestazioneSezione,
  STATO_BADGE,
  STATO_LABEL,
  SelettoreCliente,
} from "./_ui";
import { WizardPrimoAccesso } from "./wizard";

export const metadata: Metadata = {
  title: "Panoramica — il tuo ecosistema",
  robots: { index: false, follow: false },
};

const eur = (n: number) => n.toLocaleString("it-IT");

/**
 * PANORAMICA (SPEC §12.H + §12.F): l'evidenza in chiaro dei servizi in
 * corso — col bundle sempre scomposto nei suoi documenti — le opportunità
 * calcolate sui dati già posseduti, e le altre sezioni mai come vuoti.
 */
export default async function PanoramicaPage({
  searchParams,
}: {
  searchParams: Promise<{ cliente?: string }>;
}) {
  const { cliente } = await searchParams;
  const contesto = await caricaContesto(cliente, "/dashboard");
  const supabase = await createClient();

  // Il selettore cliente viaggia con OGNI link del portale (mai l'id grezzo
  // dell'URL: quello validato dal contesto).
  const conCliente = (href: string) =>
    contesto.ruolo === "consulente" && contesto.org
      ? `${href}?cliente=${contesto.org.id}`
      : href;

  const [{ data: moduli }, { data: ordini }] = contesto.org
    ? await Promise.all([
        supabase
          .from("module_activations")
          .select("*")
          .eq("organization_id", contesto.org.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("orders")
          .select("*")
          .eq("organization_id", contesto.org.id)
          .order("created_at", { ascending: false }),
      ])
    : [{ data: [] }, { data: [] }];

  const attivi = moduli ?? [];
  const percorsiNomi = attivi.map(
    (m) => getServizio(m.module)?.name ?? m.module,
  );
  const documentiPrimo =
    attivi.length > 0 ? (getServizio(attivi[0].module)?.documenti ?? []) : [];

  /** La prossima azione, onesta: dipende dallo stato reale del modulo. */
  const prossimaAzione = (stato: string) => {
    switch (stato) {
      case "in_attivazione":
        return "Ti ricontattiamo noi per l'attivazione del pagamento: nessun addebito è stato fatto.";
      case "sospeso":
        return "Il percorso è in pausa: scrivici dalla sezione Consulenza per riprenderlo.";
      case "disdetto":
        return "Il percorso è chiuso. Il lavoro fatto resta tuo: puoi riattivarlo dal catalogo quando vuoi.";
      default:
        return "Tieni a portata i documenti del fascicolo: il Motore ti dice esattamente quali e perché.";
    }
  };

  // Suggerimenti (§12.F): con i dati che già abbiamo, cosa costerebbe poco
  // attivare. Solo per chi ha percorsi, mai invadenti, sconto cliente attivo.
  const conCanoneAttivo = attivi.some(
    (m) => m.stato === "attivo" && !isUnaTantum(m.module),
  );
  const opportunita =
    contesto.org && attivi.length > 0
      ? suggerimenti(
          attivi.map((m) => m.module),
          contesto.org.dimensione,
          conCanoneAttivo,
        )
      : [];

  return (
    <main>
      {/* Wizard di primo accesso: una sola volta, sempre saltabile. */}
      {contesto.ruolo === "impresa" && !contesto.wizardVisto && contesto.org && (
        <WizardPrimoAccesso
          ragioneSociale={contesto.org.ragione_sociale}
          partitaIva={contesto.org.partita_iva}
          percorsi={percorsiNomi}
          documenti={documentiPrimo}
        />
      )}

      <IntestazioneSezione
        eyebrow="PANORAMICA"
        titolo={
          contesto.org ? contesto.org.ragione_sociale : "Il tuo ecosistema"
        }
        sotto={
          contesto.org
            ? `P.IVA ${contesto.org.partita_iva} · accesso come ${contesto.email}`
            : contesto.ruolo === "consulente"
              ? `Accesso come ${contesto.email}. I tuoi clienti compariranno qui con il primo mandato.`
              : `Accesso come ${contesto.email}. Il tuo ecosistema nasce con il primo percorso attivato.`
        }
      />

      <SelettoreCliente contesto={contesto} base="/dashboard" />

      {/* I servizi in corso, in chiaro */}
      <section className="mt-8">
        <h2 className="text-sm font-semibold text-ink">Servizi in corso</h2>
        {attivi.length > 0 ? (
          <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-2">
            {attivi.map((m) => {
              const s = getServizio(m.module);
              const componenti = contesto.org
                ? componentiPercorso(m.module, contesto.org)
                : [];
              return (
                <article
                  key={m.id}
                  className="rounded-2xl border border-line bg-white p-5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="text-[15px] font-bold leading-snug text-ink">
                        {s?.name ?? m.module}
                      </h3>
                      {s?.taglio && (
                        <p className="mt-0.5 text-xs font-medium text-gray-warm">
                          {s.taglio}
                        </p>
                      )}
                    </div>
                    <span
                      className={
                        "shrink-0 rounded-full px-3 py-1 text-xs font-medium " +
                        (STATO_BADGE[m.stato] ?? "bg-paper text-gray-warm")
                      }
                    >
                      {STATO_LABEL[m.stato] ?? m.stato}
                    </span>
                  </div>

                  {/* Il lavoro già svolto, mai il compito da fare (§12.G) —
                      e il bundle sempre scomposto nei suoi documenti (§12.F). */}
                  {componenti.length > 0 && (
                    <div className="mt-4 space-y-3">
                      {componenti.map((comp) => {
                        const percentuale = completamentoBozza(comp.bozza);
                        return (
                          <div key={comp.key}>
                            <div className="flex items-baseline justify-between gap-3 text-xs text-gray-warm">
                              <span className="min-w-0 truncate">
                                {componenti.length > 1
                                  ? comp.nome
                                  : comp.bozza.intestazione}
                              </span>
                              <span className="shrink-0 font-semibold tabular-nums text-mint">
                                bozza al {percentuale}%
                              </span>
                            </div>
                            <div className="mt-1.5 flex gap-1">
                              {comp.bozza.sezioni.map((sez, i) => (
                                <span
                                  key={i}
                                  className={
                                    "h-1.5 flex-1 rounded-full " +
                                    (sez.stato !== "in-attesa"
                                      ? "bg-mint"
                                      : "bg-line/60")
                                  }
                                />
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <p className="mt-4 border-t border-line pt-3 text-xs leading-relaxed text-gray-warm">
                    <strong className="font-semibold text-ink">
                      Prossima azione:{" "}
                    </strong>
                    {prossimaAzione(m.stato)}
                  </p>

                  <Link
                    href={conCliente("/dashboard/percorsi")}
                    className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-pine hover:underline"
                  >
                    Apri il percorso e leggi la bozza <ArrowRight size={15} />
                  </Link>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="mt-3">
            <CardOpportunita
              icona={Building2}
              titolo="Il primo percorso apre l'ecosistema"
              testo="Prezzi pubblici per fascia dimensionale, documenti che hai già, validazione umana su tutto: scegli da dove cominciare."
              cta={{ href: "/servizi", label: "Apri il catalogo" }}
            />
          </div>
        )}
        {(ordini ?? []).some((o) => o.stato === "in_attivazione") && (
          <p className="mt-2 text-xs text-gray-light">
            Gli ordini «in attivazione» non hanno generato alcun addebito.
          </p>
        )}
      </section>

      {/* Con i dati che già abbiamo (§12.F): opportunità, mai pressione. */}
      {opportunita.length > 0 && (
        <section className="mt-10">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-ink">
            <Sparkles size={15} className="text-mint" />
            Con i dati che già abbiamo potresti attivare
          </h2>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {opportunita.map((o) => (
              <article
                key={o.slug}
                className="flex flex-col rounded-2xl border border-line bg-white p-5"
              >
                <h3 className="text-[15px] font-bold leading-snug text-ink">
                  {o.nome}
                </h3>
                {o.taglio && (
                  <p className="mt-0.5 text-xs font-medium text-gray-warm">
                    {o.taglio}
                  </p>
                )}
                <p className="mt-2.5 text-sm leading-relaxed text-gray-warm">
                  {o.motivo}
                </p>

                {/* L'effort residuo, calcolato e dichiarato */}
                <p className="mt-2.5 text-xs leading-relaxed">
                  {o.effort === null ? (
                    <span className="inline-flex rounded-full bg-mint/15 px-2.5 py-1 font-semibold text-mint">
                      Zero documenti aggiuntivi: abbiamo già tutto
                    </span>
                  ) : (
                    <span className="text-gray-warm">
                      <strong className="font-semibold text-ink">
                        Ti serviranno solo:
                      </strong>{" "}
                      {o.effort.join(", ")}.
                    </span>
                  )}
                </p>
                {o.effortNota && (
                  <p className="mt-1 text-[11px] leading-snug text-gray-light">
                    {o.effortNota}
                  </p>
                )}

                <div className="mt-3 flex flex-wrap items-baseline justify-between gap-2 border-t border-line pt-3">
                  {o.mensile !== null ? (
                    <p className="text-sm text-gray-warm">
                      {o.mensileScontato !== null ? (
                        <>
                          <span className="tabular-nums line-through">
                            {eur(o.mensile)} €
                          </span>{" "}
                          <strong className="font-semibold tabular-nums text-ink">
                            {eur(o.mensileScontato)} €/mese
                          </strong>{" "}
                          <span className="text-xs">
                            con lo sconto cliente attivo −15%, applicato
                            all&apos;attivazione
                          </span>
                        </>
                      ) : (
                        <strong className="font-semibold tabular-nums text-ink">
                          {eur(o.mensile)} €/mese
                        </strong>
                      )}
                    </p>
                  ) : (
                    <p className="text-sm text-gray-warm">Prezzo su richiesta</p>
                  )}
                  <Link
                    href={`/servizi/${o.slug}`}
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-pine hover:underline"
                  >
                    Vedi cosa comprende <ArrowRight size={15} />
                  </Link>
                </div>
              </article>
            ))}
          </div>
          <p className="mt-2 text-xs text-gray-light">
            Suggerimenti calcolati sui dati del tuo fascicolo: puoi
            ignorarli, non li ripetiamo altrove.
          </p>
        </section>
      )}

      {/* Le altre sezioni come opportunità: mai vuoti tristi. */}
      <section className="mt-10">
        <h2 className="text-sm font-semibold text-ink">
          Il resto del tuo ecosistema
        </h2>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <CardOpportunita
            icona={ShieldCheck}
            titolo="Il Sigillo Ver0"
            testo="Si conquista completando un percorso qualificante: criteri pubblici, dati verificati, l'anno sempre stampato sopra. Intanto puoi già dichiarare il percorso avviato."
            cta={{ href: conCliente("/dashboard/sigillo"), label: "Vedi a che punto sei" }}
          />
          <CardOpportunita
            icona={FolderOpen}
            titolo="I tuoi documenti"
            testo="L'archivio unico di bollette, visure e report: si popola con il fascicolo del tuo percorso."
            cta={{ href: conCliente("/dashboard/documenti"), label: "Apri l'archivio" }}
          />
          <CardOpportunita
            icona={Megaphone}
            titolo="Bandi per il tuo profilo"
            testo="L'osservatorio incluso nell'abbonamento: segnaliamo noi le opportunità che premiano le tue qualifiche."
            cta={{ href: conCliente("/dashboard/bandi"), label: "Scopri l'osservatorio" }}
          />
          <CardOpportunita
            icona={CalendarDays}
            titolo="Consulenza quando serve"
            testo="Specialisti veri, prenotabili sulla tua pratica. E un'assistenza che risponde."
            cta={{ href: conCliente("/dashboard/consulenza"), label: "Vedi come funziona" }}
          />
        </div>
      </section>
    </main>
  );
}
