import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  BarChart3,
  Inbox,
  Mail,
  Sparkles,
  TrendingUp,
  UserPlus,
} from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { getServizio } from "@/lib/catalog";
import { DIMENSIONE_LABEL } from "@/lib/pricing";
import { EVENTI, PASSI_FUNNEL } from "@/lib/eventi";

import {
  IntestazioneSezione,
  Metrica,
  Occhiello,
  TestataSezione,
  ZonaLettura,
} from "../_ui";
import { salvaNota, cambiaStatoLead } from "./azioni";

export const metadata: Metadata = {
  title: "Lead — back-office",
  robots: { index: false, follow: false },
};

const DATA = (iso: string) =>
  new Date(iso).toLocaleDateString("it-IT", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

/**
 * Gli eventi degli ultimi 30 giorni. Sta fuori dal componente perché
 * legge l'orologio: farlo durante il render è impuro, e il compilatore
 * di React ha ragione a fermarci.
 */
async function caricaEventiRecenti(
  supabase: Awaited<ReturnType<typeof createClient>>,
) {
  const daTrenta = new Date(Date.now() - 30 * 24 * 60 * 60_000).toISOString();
  return supabase
    .from("events")
    .select("nome, dettagli, sorgente, created_at")
    .gte("created_at", daTrenta)
    .limit(5000);
}

/**
 * BACK-OFFICE LEAD — riservato al ruolo amministratore.
 *
 * Un lead che finisce in tabella senza che nessuno lo veda è un lead
 * perso: qui stanno insieme i messaggi dal sito, le richieste di
 * attivazione e le iscrizioni alla lista d'attesa, con stato e note
 * interne. In cima, l'imbuto: dove le persone si fermano è il dato più
 * prezioso che questa piattaforma produce.
 *
 * La barriera è la RLS — `is_admin()` sulle policy di lettura — non
 * questo componente. Il `notFound()` qui sotto serve a non mostrare una
 * pagina vuota a chi non deve nemmeno sapere che esiste.
 */
export default async function LeadPage({
  searchParams,
}: {
  searchParams: Promise<{ vista?: string }>;
}) {
  const { vista } = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) notFound();

  const { data: profilo } = await supabase
    .from("profiles")
    .select("ruolo")
    .eq("id", user.id)
    .maybeSingle();
  if (profilo?.ruolo !== "amministratore") notFound();

  const [
    { data: contatti },
    { data: ordini },
    { data: iscrizioni },
    { data: eventi },
  ] = await Promise.all([
    supabase
      .from("contact_messages")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("waitlist")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50),
    caricaEventiRecenti(supabase),
  ]);

  // Le imprese, per dare un nome agli ordini.
  const { data: imprese } = await supabase
    .from("organizations")
    .select("id, ragione_sociale");
  const nomeImpresa = new Map(
    (imprese ?? []).map((o) => [o.id, o.ragione_sociale]),
  );

  /* ---------------------------------------------------------------- */
  /* L'imbuto: quanti arrivano a ciascun passo, e dove si fermano.      */
  /* ---------------------------------------------------------------- */
  const registro = eventi ?? [];
  const conta = (nome: string) => registro.filter((e) => e.nome === nome).length;
  const perPasso = PASSI_FUNNEL.map((passo) => ({
    passo,
    quanti: registro.filter(
      (e) => e.nome === EVENTI.FUNNEL_PASSO && e.dettagli?.passo === passo,
    ).length,
  }));
  const aperture = conta(EVENTI.SERVIZIO_APERTO);
  const completati = conta(EVENTI.FUNNEL_COMPLETATO);
  const massimo = Math.max(aperture, ...perPasso.map((p) => p.quanti), 1);

  const sorgenti = Object.entries(
    registro.reduce<Record<string, number>>((acc, e) => {
      const s = e.sorgente ?? "diretto";
      acc[s] = (acc[s] ?? 0) + 1;
      return acc;
    }, {}),
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  const sezioni = [
    { chiave: "richieste", label: "Richieste", n: (ordini ?? []).length },
    { chiave: "contatti", label: "Messaggi", n: (contatti ?? []).length },
    { chiave: "waitlist", label: "Lista d'attesa", n: (iscrizioni ?? []).length },
  ];
  const attiva = sezioni.some((s) => s.chiave === vista) ? vista : "richieste";

  return (
    <main>
      <IntestazioneSezione
        eyebrow="BACK-OFFICE"
        titolo="Lead e richieste"
        sotto="Tutto ciò che arriva dal sito, in un posto solo: richieste di attivazione, messaggi e iscrizioni, con lo stato e le note che ti servono per lavorarli."
      />

      {/* L'IMBUTO — il dato più prezioso: dove si perdono le persone. */}
      <section className="mt-8">
        <TestataSezione
          icona={TrendingUp}
          titolo="L'imbuto degli ultimi 30 giorni"
          sotto="Ogni gradino è un passo completato. Il salto più grande fra due gradini è il punto su cui vale la pena lavorare."
        />
        <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-[1fr_260px]">
          <ZonaLettura>
            <ul className="space-y-3">
              {[
                { etichetta: "Schede servizio aperte", quanti: aperture },
                ...perPasso.map((p) => ({
                  etichetta: `Passo «${p.passo}» completato`,
                  quanti: p.quanti,
                })),
                { etichetta: "Richieste inviate", quanti: completati },
              ].map((riga, i, tutte) => {
                const precedente = i > 0 ? tutte[i - 1].quanti : null;
                const caduta =
                  precedente && precedente > 0
                    ? Math.round(100 - (riga.quanti / precedente) * 100)
                    : null;
                return (
                  <li key={riga.etichetta}>
                    <div className="flex flex-wrap items-baseline justify-between gap-x-3 text-sm">
                      <span className="min-w-0 text-gray-warm">
                        {riga.etichetta}
                      </span>
                      <span className="shrink-0 tabular-nums">
                        <strong className="font-display text-lg text-ink">
                          {riga.quanti}
                        </strong>
                        {caduta !== null && caduta > 0 && (
                          <span className="ml-2 text-xs font-medium text-amber-ink">
                            −{caduta}%
                          </span>
                        )}
                      </span>
                    </div>
                    <div className="mt-1 h-2 overflow-hidden rounded-full bg-line/60">
                      <div
                        className="h-full rounded-full bg-mint"
                        style={{
                          width: `${Math.round((riga.quanti / massimo) * 100)}%`,
                        }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
            {registro.length === 0 && (
              <p className="mt-4 flex items-start gap-2 text-sm leading-relaxed text-gray-warm">
                <Sparkles size={15} className="mt-0.5 shrink-0 text-mint" />
                Nessun evento registrato ancora: comparirà qui appena qualcuno
                aprirà una scheda servizio.
              </p>
            )}
          </ZonaLettura>

          <ZonaLettura>
            <Occhiello>Da dove arrivano</Occhiello>
            {sorgenti.length === 0 ? (
              <p className="mt-2 text-sm text-gray-warm">
                Ancora nessuna sorgente.
              </p>
            ) : (
              <ul className="mt-2 space-y-2">
                {sorgenti.map(([nome, quanti]) => (
                  <li
                    key={nome}
                    className="flex items-baseline justify-between gap-3 text-sm"
                  >
                    <span className="min-w-0 truncate text-gray-warm">
                      {nome}
                    </span>
                    <span className="shrink-0 font-semibold tabular-nums text-ink">
                      {quanti}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-4 border-t border-line pt-4">
              <Metrica
                valore={conta(EVENTI.CONTATTO_INVIATO)}
                etichetta="moduli contatti inviati (30 giorni)"
                tono="pino"
              />
            </div>
          </ZonaLettura>
        </div>
      </section>

      {/* Le tre liste, in schede. */}
      <section className="mt-10">
        <TestataSezione icona={BarChart3} titolo="Chi si è fatto vivo" />
        <div className="mt-4 flex flex-wrap gap-1.5">
          {sezioni.map((s) => (
            <a
              key={s.chiave}
              href={`/dashboard/lead?vista=${s.chiave}`}
              aria-current={attiva === s.chiave ? "page" : undefined}
              className={
                "rounded-full border px-3.5 py-1.5 text-sm transition-colors " +
                (attiva === s.chiave
                  ? "border-pine bg-pine font-medium text-white"
                  : "border-line bg-white text-gray-warm hover:border-pine/40")
              }
            >
              {s.label}{" "}
              <span className="tabular-nums opacity-70">{s.n}</span>
            </a>
          ))}
        </div>

        <div className="mt-4 space-y-2">
          {attiva === "richieste" &&
            ((ordini ?? []).length === 0 ? (
              <Vuoto icona={Inbox} testo="Nessuna richiesta, per ora." />
            ) : (
              (ordini ?? []).map((o) => {
                const s = getServizio(o.servizio_slug);
                return (
                  <RigaLead
                    key={o.id}
                    titolo={nomeImpresa.get(o.organization_id) ?? "Impresa"}
                    sotto={`${s?.name ?? o.servizio_slug} · ${DIMENSIONE_LABEL[o.dimensione]} · ${
                      o.formula === "una_tantum"
                        ? "una tantum"
                        : o.formula === "mensile"
                          ? "canone mensile"
                          : "annuale"
                    } · ${o.prezzo_canone ?? o.prezzo_una_tantum ?? "—"} €`}
                    stato={o.stato}
                    data={o.created_at}
                    nota={o.note_interne}
                    tabella="orders"
                    id={o.id}
                    stati={["richiesta", "in_attivazione", "attivo", "disdetto"]}
                  />
                );
              })
            ))}

          {attiva === "contatti" &&
            ((contatti ?? []).length === 0 ? (
              <Vuoto icona={Mail} testo="Nessun messaggio, per ora." />
            ) : (
              (contatti ?? []).map((c) => (
                <RigaLead
                  key={c.id}
                  titolo={`${c.nome}${c.azienda ? ` — ${c.azienda}` : ""}`}
                  sotto={`${c.oggetto} · ${c.email}`}
                  corpo={c.messaggio}
                  stato={c.stato}
                  data={c.created_at}
                  nota={c.note_interne}
                  tabella="contact_messages"
                  id={c.id}
                  stati={["nuovo", "in_lavorazione", "chiuso"]}
                />
              ))
            ))}

          {attiva === "waitlist" &&
            ((iscrizioni ?? []).length === 0 ? (
              <Vuoto
                icona={UserPlus}
                testo="Nessuna iscrizione alla lista d'attesa."
              />
            ) : (
              (iscrizioni ?? []).map((w) => (
                <RigaLead
                  key={w.id}
                  titolo={w.nome ?? w.email}
                  sotto={`${w.email}${w.azienda ? ` · ${w.azienda}` : ""}`}
                  corpo={w.interesse ?? undefined}
                  stato={w.stato}
                  data={w.created_at}
                  nota={w.note_interne}
                  tabella="waitlist"
                  id={w.id}
                  stati={["nuovo", "contattato", "convertito", "chiuso"]}
                />
              ))
            ))}
        </div>
      </section>
    </main>
  );
}

function Vuoto({
  icona: Icona,
  testo,
}: {
  icona: typeof Inbox;
  testo: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-dashed border-pine/30 bg-moss/40 p-5">
      <Icona size={18} className="shrink-0 text-pine" />
      <p className="text-sm text-gray-warm">{testo}</p>
    </div>
  );
}

/** Una riga di lead: dati essenziali, stato modificabile, nota interna. */
function RigaLead({
  titolo,
  sotto,
  corpo,
  stato,
  data,
  nota,
  tabella,
  id,
  stati,
}: {
  titolo: string;
  sotto: string;
  corpo?: string;
  stato: string;
  data: string;
  nota: string | null;
  tabella: "orders" | "contact_messages" | "waitlist";
  id: string;
  stati: string[];
}) {
  return (
    <article className="rounded-2xl border border-line bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[15px] font-bold leading-snug text-ink">{titolo}</p>
          <p className="mt-0.5 text-sm text-gray-warm">{sotto}</p>
        </div>
        <p className="shrink-0 text-xs tabular-nums text-gray-light">
          {DATA(data)}
        </p>
      </div>

      {corpo && (
        <p className="mt-3 whitespace-pre-line rounded-lg bg-paper px-3.5 py-2.5 text-sm leading-relaxed text-gray-warm">
          {corpo}
        </p>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-line pt-3">
        <form
          action={async (formData: FormData) => {
            "use server";
            await cambiaStatoLead(tabella, id, String(formData.get("stato")));
          }}
          className="flex items-center gap-2"
        >
          <label htmlFor={`stato-${id}`} className="text-xs text-gray-warm">
            Stato
          </label>
          <select
            id={`stato-${id}`}
            name="stato"
            defaultValue={stato}
            className="rounded-lg border border-line bg-white px-2.5 py-1.5 text-xs text-ink outline-none focus:border-mint"
          >
            {stati.map((s) => (
              <option key={s} value={s}>
                {s.replace(/_/g, " ")}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="rounded-lg border border-pine px-3 py-1.5 text-xs font-semibold text-pine transition-colors hover:bg-moss"
          >
            Aggiorna
          </button>
        </form>
      </div>

      <form
        action={async (formData: FormData) => {
          "use server";
          await salvaNota(tabella, id, String(formData.get("nota") ?? ""));
        }}
        className="mt-2 flex flex-wrap gap-2"
      >
        <label htmlFor={`nota-${id}`} className="sr-only">
          Nota interna
        </label>
        <input
          id={`nota-${id}`}
          name="nota"
          defaultValue={nota ?? ""}
          placeholder="Nota interna (la vedi solo tu)"
          className="min-w-0 flex-1 rounded-lg border border-line bg-paper px-3 py-2 text-sm outline-none focus:border-mint"
        />
        <button
          type="submit"
          className="shrink-0 rounded-lg border border-line px-3 py-2 text-xs font-medium text-gray-warm transition-colors hover:border-pine/40 hover:text-pine"
        >
          Salva nota
        </button>
      </form>
    </article>
  );
}
