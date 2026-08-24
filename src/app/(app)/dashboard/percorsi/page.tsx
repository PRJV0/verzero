import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  Inbox,
  LifeBuoy,
  Lock,
} from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import {
  RICHIAMO_SUPPORTO_AUDIT,
  SERVIZI_CERTIFICABILI,
  getServizio,
} from "@/lib/catalog";
import {
  bozzaConDocumenti,
  componentiPercorso,
  completamentoBozza,
  documentiAttivi,
  segmentiBozza,
  type CampiNoti,
  type ComponentePercorso,
  type SezioneBozza,
} from "@/lib/bozza";
import { tipiRichiesti, tipoDocumento } from "@/lib/documenti";
import { raggruppaLetture } from "@/lib/motore/portale";
import { AVVIO, DOPO_AVVIO } from "@/lib/avvio";

import { CaricaDocumenti } from "../documenti/carica";

import { caricaContesto } from "../_contesto";
import { AnelloSigillo } from "../_anello";
import {
  CardOpportunita,
  Occhiello,
  ZonaInput,
  ChipDestinazione,
  IntestazioneSezione,
  STATO_BADGE,
  STATO_FRASE,
  STATO_LABEL,
  SelettoreCliente,
} from "../_ui";

export const metadata: Metadata = {
  title: "I tuoi percorsi — il tuo ecosistema",
  robots: { index: false, follow: false },
};

/** Righe di testo accennate: la metafora del documento in composizione. */
function RigheAccennate({ quante = 2 }: { quante?: number }) {
  return (
    <div aria-hidden className="mt-2 space-y-1.5">
      {Array.from({ length: quante }, (_, i) => (
        <div
          key={i}
          className="h-2 rounded-sm bg-line/50"
          style={{ width: `${88 - i * 26}%` }}
        />
      ))}
    </div>
  );
}

/** Una sezione del foglio-bozza, numerata, con lo stato dichiarato e la
 *  spiegazione per chi non è del mestiere (§12.F). */
function SezioneFoglio({
  sezione,
  numero,
}: {
  sezione: SezioneBozza;
  numero: number;
}) {
  return (
    <div className="border-t border-line/70 px-5 py-4 first:border-t-0 sm:px-6">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <p className="min-w-0 text-sm font-semibold text-ink">
          <span className="mr-2 tabular-nums text-gray-light">{numero}.</span>
          {sezione.titolo}
        </p>
        {sezione.stato === "in-attesa" ? (
          <span className="shrink-0 rounded-full bg-paper px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-warm">
            In attesa
          </span>
        ) : sezione.stato === "ricevuta" ? (
          <span className="shrink-0 rounded-full bg-mint/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-mint">
            Documenti ricevuti
          </span>
        ) : sezione.stato === "letta" ? (
          // Letta ma non confermata: l'etichetta dice ESATTAMENTE a che
          // punto siamo. «Dall'AI Ver0» qui suonerebbe come «fatto», e non
          // lo è finché il cliente non ha guardato i numeri.
          <span className="shrink-0 rounded-full bg-amber-soft px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-ink">
            Letta · da confermare
          </span>
        ) : (
          <span className="shrink-0 rounded-full bg-mint/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-mint">
            Dall&apos;AI Ver0{sezione.fonte ? ` · ${sezione.fonte}` : ""}
          </span>
        )}
      </div>

      {sezione.spiega && (
        <p className="mt-1 text-xs leading-snug text-gray-light">
          {sezione.spiega}
        </p>
      )}

      {(sezione.stato === "popolata" || sezione.stato === "letta") &&
        sezione.righe && (
        <dl className="mt-2 space-y-1">
          {sezione.righe.map((r) => (
            <div
              key={r.etichetta}
              className="flex flex-wrap justify-between gap-x-4 text-sm"
            >
              <dt className="text-gray-warm">{r.etichetta}</dt>
              <dd className="font-semibold tabular-nums text-ink">
                {r.valore}
              </dd>
            </div>
          ))}
        </dl>
      )}

      {sezione.stato === "letta" && (
        <p className="mt-1.5 text-xs leading-relaxed text-amber-ink">
          Questi valori li ha letti l&apos;AI Ver0 dai tuoi documenti e
          aspettano la tua conferma: finché non la dai restano fuori dal
          calcolo.{" "}
          <Link href="/dashboard/documenti" className="font-semibold underline">
            Controllali
          </Link>
          .
        </p>
      )}

      {sezione.stato === "impostata" && <RigheAccennate quante={2} />}

      {/* Ricevuta: il documento è in nostre mani, la lettura arriva con
          la prossima tappa. Lo diciamo invece di far credere che i
          numeri siano già dentro. */}
      {sezione.stato === "ricevuta" && (
        <>
          <RigheAccennate quante={2} />
          <p className="mt-1.5 text-xs text-mint">
            Hai portato i documenti che servivano: l&apos;AI Ver0 li legge e
            compila questa sezione.
          </p>
        </>
      )}

      {sezione.stato === "in-attesa" && (
        <>
          <RigheAccennate quante={1} />
          {sezione.attende && (
            <p className="mt-1.5 text-xs text-gray-light">
              Si compila con {sezione.attende}.
            </p>
          )}
        </>
      )}
    </div>
  );
}

/** Un documento del percorso: foglio-bozza + anello + «per completare». */
function FoglioComponente({
  comp,
  attiviDocs,
  tipiCaricati,
  organizationId,
}: {
  comp: ComponentePercorso;
  attiviDocs: Set<string>;
  tipiCaricati: Set<string>;
  /** Presente solo per l'impresa: il consulente legge, non carica. */
  organizationId?: string;
}) {
  const bozza = comp.bozza;
  const percentuale = completamentoBozza(bozza);
  const segmenti = segmentiBozza(bozza);
  const conDati = segmenti.filter((s) => s === "piena").length;
  const lette = segmenti.filter((s) => s === "letta").length;
  const ricevute = segmenti.filter((s) => s === "quasi").length;
  const impostate = segmenti.filter((s) => s === "mezza").length;
  const mancanti = bozza.daFornire.filter(
    (v) => !v.tipo || !tipiCaricati.has(v.tipo),
  );

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_260px]">
      {/* Il fascicolo come oggetto di carta */}
      <div className="overflow-hidden rounded-xl border-2 border-line bg-white shadow-soft">
        <div className="flex items-center justify-between gap-3 border-b-2 border-line bg-paper px-5 py-3 sm:px-6">
          <p className="font-display text-lg text-ink">{bozza.intestazione}</p>
          <span className="shrink-0 text-[10px] font-semibold uppercase tracking-widest text-gray-light">
            Anteprima
          </span>
        </div>
        {bozza.sezioni.map((sez, i) => (
          <SezioneFoglio key={sez.titolo} sezione={sez} numero={i + 1} />
        ))}
      </div>

      {/* Colonna quieta: anello-cruscotto + cosa serve, col perché */}
      <aside className="space-y-4">
        <div className="flex flex-col items-center rounded-xl border border-line bg-white p-5 text-center">
          {/* La chiave lega l'anello a QUESTO documento: al prossimo
              accesso la percentuale riparte da dove eravamo e si vede
              salire di quanto è cresciuta davvero (brief §3.3). */}
          <AnelloSigillo
            segmenti={segmenti}
            percentuale={percentuale}
            chiave={comp.key}
          />
          <p className="mt-3 text-xs leading-relaxed text-gray-warm">
            <span className="font-semibold tabular-nums text-pine">
              {conDati} {conDati === 1 ? "sezione" : "sezioni"}
            </span>{" "}
            {conDati === 1 ? "compilata" : "compilate"} coi tuoi dati
            {lette > 0 && (
              <>
                ,{" "}
                <span className="font-semibold tabular-nums text-amber-ink">
                  {lette}
                </span>{" "}
                {lette === 1 ? "letta" : "lette"} e in attesa della tua conferma
              </>
            )}
            {ricevute > 0 && (
              <>
                ,{" "}
                <span className="font-semibold tabular-nums text-pine">
                  {ricevute}
                </span>{" "}
                con i documenti ricevuti
              </>
            )}
            {impostate > 0 && (
              <>
                ,{" "}
                <span className="font-semibold tabular-nums text-pine">
                  {impostate}
                </span>{" "}
                {impostate === 1 ? "impostata" : "impostate"}
                {" dall'AI Ver0"}
              </>
            )}
            . In tutto {bozza.sezioni.length}.
          </p>
        </div>

        {/* ZONA DI INSERIMENTO: bordo tratteggiato e fondo salvia, come
            ovunque nel portale. Si distingue a colpo d'occhio dal foglio
            bianco accanto, che è invece da leggere (SPEC §12.C). */}
        <div className="rounded-xl border-2 border-dashed border-pine/30 bg-moss/40 p-4">
          <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-pine">
            <Inbox size={12} /> Per completare ci serve
          </p>
          {bozza.daFornire.length === 0 && bozza.zeroDocumenti ? (
            <>
              <p className="mt-2.5 inline-flex rounded-full bg-mint/15 px-2.5 py-1 text-[11px] font-semibold text-mint">
                Zero documenti aggiuntivi
              </p>
              <p className="mt-2 text-xs leading-relaxed text-gray-warm">
                {bozza.zeroDocumenti}
              </p>
            </>
          ) : (
            <>
              <ul className="mt-2.5 space-y-2">
                {bozza.daFornire.map((v) => {
                  // Un dato, più documenti (§12.F): se la stessa cosa serve
                  // anche a un altro documento in lavorazione, si vede scritto.
                  const anche = (v.destinazioni ?? []).filter(
                    (d) => d !== comp.doc && attiviDocs.has(d),
                  );
                  const arrivato = !!v.tipo && tipiCaricati.has(v.tipo);
                  return (
                    <li
                      key={v.documento}
                      className={
                        "rounded-lg border px-3 py-2.5 " +
                        (arrivato
                          ? "border-mint/40 bg-mint/5"
                          : "border-amber-ink/20 bg-amber-soft/70")
                      }
                    >
                      <p className="flex items-start gap-1.5 text-xs font-semibold text-ink">
                        {arrivato && (
                          <Check
                            size={12}
                            strokeWidth={3}
                            className="mt-0.5 shrink-0 text-mint"
                          />
                        )}
                        <span className="min-w-0">{v.documento}</span>
                      </p>
                      <p className="mt-0.5 text-[11px] leading-snug text-gray-warm">
                        {arrivato ? "Ricevuto, grazie: è nel tuo archivio." : v.perche}
                      </p>
                      {anche.length > 0 && !arrivato && (
                        <p className="mt-1.5 flex flex-wrap gap-1">
                          {anche.map((d) => (
                            <ChipDestinazione key={d} label={`anche ${d}`} />
                          ))}
                        </p>
                      )}
                    </li>
                  );
                })}
              </ul>

              {/* Il caricamento vive anche qui, dentro il fascicolo: chi sta
                  guardando cosa manca deve poterlo dare subito (§12.E). */}
              {organizationId && mancanti.length > 0 && (
                <div className="mt-2.5">
                  <CaricaDocumenti
                    organizationId={organizationId}
                    compatto
                    tipoAtteso={
                      mancanti.length === 1
                        ? (tipoDocumento(mancanti[0].tipo ?? null)?.nome ??
                          undefined)
                        : undefined
                    }
                  />
                </div>
              )}
              <p className="mt-2.5 text-[11px] leading-relaxed text-gray-light">
                {mancanti.length === 0
                  ? "Hai portato tutto. Ora l'AI Ver0 legge i documenti e compila le sezioni: ti avvisiamo noi quando la bozza è pronta."
                  : "Puoi caricarli qui o dalla sezione Documenti: è lo stesso archivio."}
              </p>
            </>
          )}
        </div>
      </aside>
    </div>
  );
}

/**
 * PERCORSO IN ATTESA DI AVVIO (stato «richiesto»).
 *
 * Qui la bozza non c'è ancora e fingere il contrario sarebbe peggio del
 * vuoto. Ma «vuoto» non è un'opzione: la schermata dice le stesse due
 * cose utili della schermata finale e dell'email — conferma i dati,
 * porta i documenti — e poi DICHIARA cosa si sblocca con l'avvio,
 * nominando i documenti che il percorso produrrà. Chi legge sa dove
 * mettere le mani adesso e cosa aspettarsi dopo.
 */
function PercorsoInAttesa({
  componenti,
  daConfermare,
  documentiMancanti,
}: {
  componenti: ComponentePercorso[];
  daConfermare: number;
  documentiMancanti: number;
}) {
  const conteggi = [
    daConfermare > 0
      ? `${daConfermare} ${daConfermare === 1 ? "dato recuperato" : "dati recuperati"} da controllare`
      : null,
    documentiMancanti > 0
      ? `${documentiMancanti} ${documentiMancanti === 1 ? "tipo di documento" : "tipi di documento"} da portare`
      : null,
  ];

  return (
    <div className="mt-4 space-y-4">
      <ZonaInput>
        <Occhiello>{AVVIO.intanto.titolo}</Occhiello>
        <p className="mt-1.5 text-sm leading-relaxed text-pine-dark">
          {AVVIO.intanto.testo}
        </p>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {AVVIO.intanto.azioni.map((a, i) => (
            <Link
              key={a.href}
              href={a.href}
              className="group flex flex-col rounded-xl border border-line bg-white px-4 py-3.5 transition-all hover:-translate-y-0.5 hover:border-pine/40 hover:shadow-soft"
            >
              <span className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                <span className="text-sm font-semibold text-ink">
                  {a.titolo}
                </span>
                {conteggi[i] && (
                  <span className="rounded-full bg-amber-soft px-2 py-0.5 text-[10px] font-semibold tabular-nums text-amber-ink">
                    {conteggi[i]}
                  </span>
                )}
              </span>
              <span className="mt-1 text-xs leading-relaxed text-gray-warm">
                {a.testo}
              </span>
              <span className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-pine">
                {a.cta} <ArrowRight size={13} />
              </span>
            </Link>
          ))}
        </div>
      </ZonaInput>

      {/* COSA SI SBLOCCA: dichiarato, non lasciato intuire. I documenti
          si nominano per esteso (§12.F), così l'attesa ha un oggetto. */}
      <div className="rounded-2xl border border-line bg-white p-5">
        <p className="flex items-center gap-2 text-sm font-semibold text-ink">
          <Lock size={15} className="shrink-0 text-gray-light" />
          Quando partiamo si sblocca il lavoro sui documenti
        </p>
        <ul className="mt-3 space-y-2">
          {componenti.map((c) => (
            <li key={c.key} className="flex items-start gap-2.5 text-sm">
              <span
                aria-hidden
                className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-pine/30"
              />
              <span className="min-w-0">
                <span className="font-medium text-ink">{c.nome}</span>{" "}
                {c.taglio && (
                  <span className="text-xs text-gray-warm">
                    {c.taglio}
                  </span>
                )}
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs leading-relaxed text-gray-warm">
          {DOPO_AVVIO} Quello che confermi e carichi adesso finisce lì
          dentro: non si ricomincia da capo.
        </p>
      </div>
    </div>
  );
}

/**
 * I TUOI PERCORSI (SPEC §12.G + §12.F): la vista si apre sul LAVORO GIÀ
 * SVOLTO — il foglio-bozza di ogni documento — e il Percorso Ver0 si
 * presenta sempre scomposto nei suoi quattro documenti componenti,
 * ciascuno con bozza, anello e fascicolo propri.
 */
export default async function PercorsiPage({
  searchParams,
}: {
  searchParams: Promise<{ cliente?: string }>;
}) {
  const { cliente } = await searchParams;
  const contesto = await caricaContesto(cliente, "/dashboard/percorsi");
  const supabase = await createClient();

  const [
    { data: moduli },
    { data: righeScheda },
    { data: documenti },
    { data: campiLetti },
  ] =
    contesto.org
      ? await Promise.all([
          supabase
            .from("module_activations")
            .select("*")
            .eq("organization_id", contesto.org.id)
            .order("created_at", { ascending: false }),
          supabase
            .from("company_fields")
            .select("campo, valore, fonte, stato")
            .eq("organization_id", contesto.org.id),
          supabase
            .from("documents")
            .select("id, tipo, stato")
            .eq("organization_id", contesto.org.id),
          supabase
            .from("document_fields")
            .select("document_id, riga, campo, etichetta, valore, unita, stato")
            .eq("organization_id", contesto.org.id),
        ])
      : [{ data: [] }, { data: [] }, { data: [] }, { data: [] }];

  // I tipi già in archivio: è ciò che fa cambiare stato alle sezioni e
  // alle voci del fascicolo, e muovere l'anello (SPEC §12.E).
  const tipiCaricati = new Set(
    (documenti ?? [])
      .filter((d) => d.tipo && d.stato !== "non_pertinente")
      .map((d) => d.tipo as string),
  );

  const attivi = moduli ?? [];
  // I dati recuperati dal Motore entrano nelle bozze (tappa 2.1): è qui
  // che l'arricchimento si vede nei documenti e fa salire l'anello.
  // Un campo RIFIUTATO dal cliente non entra in nessun documento: la sua
  // riga resta solo perché il Motore non lo riproponga (SPEC §12.D).
  const campiNoti: CampiNoti = Object.fromEntries(
    (righeScheda ?? [])
      .filter((r) => r.valore && r.stato !== "rifiutato")
      .map((r) => [
        r.campo,
        {
          valore: r.valore as string,
          fonte: r.fonte,
          // Un campo recuperato dal Motore e non ancora confermato entra
          // nel foglio — è il modo in cui il cliente lo vede — ma tiene la
          // sezione a «letta»: l'anello sale a peso pieno solo dopo la
          // conferma (docs/motore.md §4.4).
          daConfermare: r.stato === "da_confermare",
        },
      ]),
  );

  // Quello che il Motore ha LETTO dai documenti, raggruppato per tipo: è
  // la chiave con cui le sezioni dichiarano cosa aspettano, e per questo
  // i valori compaiono nella sezione giusta invece che in un pannello a
  // parte che non significa niente per chi legge.
  const tipoPerDocumento = Object.fromEntries(
    (documenti ?? []).map((d) => [d.id, d.tipo]),
  );
  const datiLetti = raggruppaLetture(campiLetti ?? [], tipoPerDocumento);

  const attiviDocs = documentiAttivi(attivi.map((m) => m.module));

  // I due numeri che rendono concrete le azioni proposte a chi aspetta
  // l'avvio: senza, l'invito resta un invito generico.
  const daConfermare = (righeScheda ?? []).filter(
    (r) => r.valore && r.stato === "da_confermare",
  ).length;
  const documentiMancanti = tipiRichiesti(attiviDocs).filter(
    (r) => !tipiCaricati.has(r.tipo.chiave),
  ).length;

  return (
    <main>
      <IntestazioneSezione
        eyebrow="I TUOI PERCORSI"
        titolo="Abbiamo già iniziato"
        sotto="Ogni percorso si apre sulla bozza del documento: le sezioni già composte si leggono, quelle in attesa sono al loro posto. Sotto, le poche cose che servono da te — col perché."
      />

      <SelettoreCliente contesto={contesto} base="/dashboard/percorsi" />

      {attivi.length === 0 ? (
        <div className="mt-8">
          <CardOpportunita
            titolo="Nessun percorso attivo, per ora"
            testo="Dal catalogo attivi quando vuoi: prezzi pubblici, la lista dei documenti dichiarata prima dell'acquisto, validazione umana su tutto."
            cta={{ href: "/servizi", label: "Apri il catalogo dei percorsi" }}
          />
        </div>
      ) : (
        <div className="mt-8 space-y-10">
          {attivi.map((m) => {
            const s = getServizio(m.module);
            const componenti = contesto.org
              ? componentiPercorso(m.module, contesto.org, campiNoti).map(
                  (c) => ({
                    ...c,
                    bozza: bozzaConDocumenti(c.bozza, tipiCaricati, datiLetti),
                  }),
                )
              : [];
            if (componenti.length === 0) return null;
            const bundle = componenti.length > 1;
            // Le attivazioni usano «richiesto»; «richiesta» e lo stato
            // dell'ordine, un'altra tabella: qui non arriva mai.
            const inAttesa = m.stato === "richiesto";

            return (
              <article key={m.id}>
                {/* Intestazione del percorso */}
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <div className="min-w-0">
                    <h2 className="font-display text-2xl text-ink">
                      {s?.name ?? m.module}
                    </h2>
                    {s?.taglio && (
                      <p className="text-xs font-medium text-gray-warm">
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
                {STATO_FRASE[m.stato] && (
                  <p className="mt-1 text-xs text-gray-warm">
                    {STATO_FRASE[m.stato]}
                  </p>
                )}

                {/* Il bundle si presenta SEMPRE scomposto (§12.F) */}
                {bundle && !inAttesa && (
                  <p className="mt-3 max-w-2xl rounded-lg bg-paper px-4 py-2.5 text-xs leading-relaxed text-gray-warm">
                    Questo percorso produce{" "}
                    <strong className="font-semibold text-ink">
                      {componenti.length} documenti distinti
                    </strong>
                    , ognuno col suo fascicolo. I dati si chiedono una volta
                    sola: quando una cosa serve a due documenti, lo trovi
                    scritto accanto.
                  </p>
                )}

                {/* In attesa di avvio la bozza non esiste ancora: al suo
                    posto le due azioni utili e cosa si sblocca dopo. */}
                {inAttesa ? (
                  <PercorsoInAttesa
                    componenti={componenti}
                    daConfermare={daConfermare}
                    documentiMancanti={documentiMancanti}
                  />
                ) : (
                <div className="mt-4 space-y-8">
                  {componenti.map((comp, idx) => (
                    <section key={comp.key}>
                      {bundle && (
                        <div className="mb-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                          <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-light">
                            Documento {idx + 1} di {componenti.length}
                          </p>
                          <h3 className="min-w-0 font-display text-lg text-ink">
                            {comp.nome}
                            {comp.taglio && (
                              <span className="ml-2 text-xs font-sans font-medium text-gray-warm">
                                {comp.taglio}
                              </span>
                            )}
                          </h3>
                        </div>
                      )}
                      <FoglioComponente
                        comp={comp}
                        attiviDocs={attiviDocs}
                        tipiCaricati={tipiCaricati}
                        organizationId={
                          contesto.ruolo === "impresa"
                            ? contesto.org?.id
                            : undefined
                        }
                      />
                    </section>
                  ))}
                </div>
                )}

                {/* Percorsi certificabili: i rilievi si adeguano qui. */}
                {SERVIZI_CERTIFICABILI.includes(m.module) && (
                  <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-line bg-white px-4 py-3">
                    <LifeBuoy size={16} className="shrink-0 text-pine" />
                    <p className="min-w-0 flex-1 text-xs text-gray-warm">
                      L&apos;organismo di certificazione ti ha lasciato rilievi
                      (le richieste di correzione dopo la visita)? Li carichi,
                      noi adeguiamo i documenti e prepariamo la risposta punto
                      per punto.
                    </p>
                    <Link
                      href={`/acquista/${RICHIAMO_SUPPORTO_AUDIT.slug}`}
                      className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-pine px-3 py-1.5 text-xs font-medium text-pine transition-colors hover:bg-moss"
                    >
                      Carica i rilievi <ArrowRight size={13} />
                    </Link>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </main>
  );
}
