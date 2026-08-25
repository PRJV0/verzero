import type { Metadata } from "next";
import { AlertTriangle, Coins, Gauge, ScrollText } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { REGISTRO_MOTORE, tipiDichiarati, tipiLeggibili } from "@/lib/motore/famiglie";
import { FAIR_USE, statoUso } from "@/lib/motore/fair-use";
import { DOLLARO, TETTI } from "@/lib/motore/tetti";

import { IntestazioneSezione, TestataSezione } from "../_ui";

export const metadata: Metadata = {
  title: "Motore — back-office",
  robots: { index: false, follow: false },
};

/**
 * IL CRUSCOTTO DEL MOTORE — solo back-office.
 *
 * Risponde alle domande che senza registro non hanno risposta: quanto
 * costa davvero una pratica, quale cliente costa più degli altri, quale
 * tipo di documento fallisce più spesso, e se un tetto è scattato.
 *
 * ═══ LA BARRIERA È LA RLS, NON QUESTA PAGINA ═══
 * `extractions` e `motore_allarmi` hanno una policy `is_admin()`: chi non
 * è amministratore non legge nulla nemmeno chiamando l'API a mano. Qui
 * non c'è nessun controllo di ruolo da scavalcare, perché non c'è
 * nessun controllo di ruolo: se la RLS non dà righe, la pagina è vuota.
 *
 * ═══ E NON SI MOSTRA MAI AL CLIENTE ═══
 * I numeri di questa pagina — costi, tetti, allarmi — non compaiono da
 * nessuna parte nel portale del cliente. Un tetto di spesa è un
 * dispositivo di sicurezza nostro, e travestirlo da attenzione
 * ambientale o da limite di servizio sarebbe una bugia (riuso.ts).
 */

const soldi = (micro: number) => `$${(micro / DOLLARO).toFixed(3)}`;

const DATA = (iso: string) =>
  new Date(iso).toLocaleString("it-IT", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

export default async function MotorePage() {
  const supabase = await createClient();

  const [{ data: estrazioni }, { data: allarmi }, { data: organizzazioni }] =
    await Promise.all([
      supabase
        .from("extractions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500),
      supabase
        .from("motore_allarmi")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50),
      supabase.from("organizations").select("id, ragione_sociale"),
    ]);

  // L'uso corretto per cliente: è il numero che il CLIENTE vede (in
  // documenti), messo accanto a quello che vede solo il back-office (in
  // valuta). Le due colonne servono a domande diverse: la prima dice se
  // sta per scattare un gradino contrattuale, la seconda se c'è
  // un'anomalia tecnica.
  const [{ data: documentiLetti }, { data: attivazioni }] = await Promise.all([
    supabase
      .from("documents")
      .select("organization_id")
      .in("stato", ["letto", "illeggibile"]),
    supabase
      .from("module_activations")
      .select("organization_id")
      .in("stato", ["richiesto", "attivo", "in_attivazione"]),
  ]);
  const conta = (righe: { organization_id: string }[] | null) => {
    const m = new Map<string, number>();
    for (const r of righe ?? []) m.set(r.organization_id, (m.get(r.organization_id) ?? 0) + 1);
    return m;
  };
  const lettiPerOrg = conta(documentiLetti);
  const percorsiPerOrg = conta(attivazioni);

  const righe = estrazioni ?? [];
  const nomeOrg = new Map(
    (organizzazioni ?? []).map((o) => [o.id, o.ragione_sociale]),
  );

  const totale = righe.reduce((t, r) => t + (r.costo_micro ?? 0), 0);
  const riuscite = righe.filter((r) => r.esito === "ok").length;

  const inizioGiorno = new Date();
  inizioGiorno.setUTCHours(0, 0, 0, 0);
  const oggi = righe
    .filter((r) => new Date(r.created_at) >= inizioGiorno)
    .reduce((t, r) => t + (r.costo_micro ?? 0), 0);

  /* — Per cliente — */
  const perCliente = new Map<
    string,
    { letture: number; costo: number; errori: number }
  >();
  for (const r of righe) {
    const k = r.organization_id ?? "—";
    const v = perCliente.get(k) ?? { letture: 0, costo: 0, errori: 0 };
    v.letture++;
    v.costo += r.costo_micro ?? 0;
    if (r.esito !== "ok") v.errori++;
    perCliente.set(k, v);
  }

  /* — Per MODELLO: è il confronto che decide la taratura dei livelli — */
  const perModello = new Map<
    string,
    { letture: number; costo: number; errori: number; escalation: number }
  >();
  for (const r of righe) {
    const k = r.modello ?? "—";
    const v = perModello.get(k) ?? { letture: 0, costo: 0, errori: 0, escalation: 0 };
    v.letture++;
    v.costo += r.costo_micro ?? 0;
    if (r.esito !== "ok") v.errori++;
    if (r.escalato_da) v.escalation++;
    perModello.set(k, v);
  }
  const salite = righe.filter((r) => r.escalato_da).length;

  /* — L'andamento: sette giorni, per vedere se una taratura ha giovato — */
  const giorno = (iso: string) => iso.slice(0, 10);
  const perGiorno = new Map<string, { letture: number; costo: number }>();
  for (const r of righe) {
    const k = giorno(r.created_at);
    const v = perGiorno.get(k) ?? { letture: 0, costo: 0 };
    v.letture++;
    v.costo += r.costo_micro ?? 0;
    perGiorno.set(k, v);
  }
  const andamento = [...perGiorno.entries()].sort().slice(-7);
  const massimo = Math.max(1, ...andamento.map(([, v]) => v.costo));

  /* — Per tipo di documento: dove si sbaglia, e quanto costa — */
  const perTipo = new Map<
    string,
    { letture: number; costo: number; errori: number; token: number }
  >();
  for (const r of righe) {
    const k = r.tipo ?? "—";
    const v = perTipo.get(k) ?? { letture: 0, costo: 0, errori: 0, token: 0 };
    v.letture++;
    v.costo += r.costo_micro ?? 0;
    v.token += (r.token_ingresso ?? 0) + (r.token_uscita ?? 0);
    if (r.esito !== "ok") v.errori++;
    perTipo.set(k, v);
  }

  const daVedere = (allarmi ?? []).filter((a) => !a.visto_at);

  return (
    <main>
      <IntestazioneSezione
        eyebrow="BACK-OFFICE"
        titolo="Il Motore, coi numeri veri"
        sotto="Costo per pratica e per cliente, tetti di spesa, e dove la lettura fallisce. Questi numeri non compaiono da nessuna parte nel portale del cliente."
      />

      {/* Gli allarmi per primi: se c'è qualcosa di fermo, si vede subito. */}
      {daVedere.length > 0 && (
        <section className="mt-6">
          <TestataSezione
            icona={AlertTriangle}
            titolo={`${daVedere.length} ${daVedere.length === 1 ? "allarme" : "allarmi"} di spesa`}
            sotto="Un tetto superato ferma il lavoro e lascia una traccia qui: un blocco silenzioso è indistinguibile da un guasto."
          />
          <ul className="mt-3 space-y-2">
            {daVedere.map((a) => (
              <li
                key={a.id}
                className={
                  "rounded-xl border p-4 " +
                  (a.livello === "tetto"
                    ? "border-amber-ink/30 bg-amber-soft"
                    : "border-line bg-white")
                }
              >
                <p className="text-sm font-semibold text-ink">
                  {a.livello === "tetto" ? "FERMATO" : "Soglia superata"} ·{" "}
                  {a.ambito}
                  {a.organization_id && (
                    <span className="font-normal text-gray-warm">
                      {" "}
                      — {nomeOrg.get(a.organization_id) ?? a.organization_id}
                    </span>
                  )}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-gray-warm">
                  {a.nota}
                </p>
                <p className="mt-1 text-[11px] text-gray-light">
                  {DATA(a.created_at)} · speso {soldi(a.speso_micro)} su{" "}
                  {soldi(a.tetto_micro)}
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* I numeri in testa. */}
      <section className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { etichetta: "Letture", valore: String(righe.length), nota: `${riuscite} riuscite` },
          { etichetta: "Speso in totale", valore: soldi(totale), nota: "ultime 500 letture" },
          {
            etichetta: "Oggi",
            valore: soldi(oggi),
            nota: `tetto ${soldi(TETTI.giorno.tetto)}`,
          },
          {
            etichetta: "Costo medio",
            valore: righe.length > 0 ? soldi(totale / righe.length) : "—",
            nota: "per lettura",
          },
        ].map((c) => (
          <div key={c.etichetta} className="rounded-xl border border-line bg-white p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-light">
              {c.etichetta}
            </p>
            <p className="mt-1 font-display text-2xl tabular-nums text-ink">
              {c.valore}
            </p>
            <p className="mt-0.5 text-[11px] text-gray-warm">{c.nota}</p>
          </div>
        ))}
      </section>

      {/* Per cliente: è la pratica, ed è il numero che decide. */}
      <section className="mt-8">
        <TestataSezione
          icona={Coins}
          titolo="Costo per cliente"
          sotto={`Una pratica è il lavoro di un anno per un cliente. «Uso corretto» è quello che vede il cliente, in documenti (${FAIR_USE.documenti.inclusi} per percorso); «speso» è quello che vediamo solo noi.`}
        />
        {perCliente.size === 0 ? (
          <p className="mt-3 text-sm text-gray-warm">Nessuna lettura registrata.</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[34rem] text-sm">
              <thead>
                <tr className="border-b border-line text-left text-[11px] uppercase tracking-wide text-gray-light">
                  <th className="py-2 font-semibold">Cliente</th>
                  <th className="py-2 text-right font-semibold">Letture</th>
                  <th className="py-2 text-right font-semibold">Errori</th>
                  <th className="py-2 text-right font-semibold">Uso corretto</th>
                  <th className="py-2 text-right font-semibold">Speso</th>
                  <th className="py-2 text-right font-semibold">Sul tetto</th>
                </tr>
              </thead>
              <tbody>
                {[...perCliente.entries()]
                  .sort((a, b) => b[1].costo - a[1].costo)
                  .map(([id, v]) => {
                    const quota = v.costo / TETTI.pratica.tetto;
                    return (
                      <tr key={id} className="border-b border-line/60">
                        <td className="py-2 pr-3 text-ink">
                          {nomeOrg.get(id) ?? "— (organizzazione rimossa)"}
                        </td>
                        <td className="py-2 text-right tabular-nums text-gray-warm">
                          {v.letture}
                        </td>
                        <td className="py-2 text-right tabular-nums text-gray-warm">
                          {v.errori > 0 ? (
                            <span className="text-amber-ink">{v.errori}</span>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="py-2 text-right tabular-nums">
                          {(() => {
                            const u = statoUso(
                              { documenti: lettiPerOrg.get(id) ?? 0, generazioni: 0 },
                              percorsiPerOrg.get(id) ?? 0,
                            );
                            return (
                              <span
                                className={
                                  u.livello === "contatto"
                                    ? "font-semibold text-amber-ink"
                                    : u.livello === "differita"
                                      ? "text-amber-ink"
                                      : "text-gray-warm"
                                }
                                title={
                                  u.livello === "normale"
                                    ? "Dentro la dotazione"
                                    : u.livello === "differita"
                                      ? "In coda a bassa priorità"
                                      : "Da contattare per concordare la prosecuzione"
                                }
                              >
                                {u.usato.documenti}/{u.dotazione.documenti}
                              </span>
                            );
                          })()}
                        </td>
                        <td className="py-2 text-right font-semibold tabular-nums text-ink">
                          {soldi(v.costo)}
                        </td>
                        <td className="py-2 text-right tabular-nums text-gray-warm">
                          {Math.round(quota * 100)}%
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Per tipo: dove si sbaglia e dove si spende. */}
      <section className="mt-8">
        <TestataSezione
          icona={Gauge}
          titolo="Per tipo di documento"
          sotto="Quale tipo costa di più e quale fallisce di più: è così che si decide dove intervenire, invece di supporlo."
        />
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[34rem] text-sm">
            <thead>
              <tr className="border-b border-line text-left text-[11px] uppercase tracking-wide text-gray-light">
                <th className="py-2 font-semibold">Tipo</th>
                <th className="py-2 text-right font-semibold">Letture</th>
                <th className="py-2 text-right font-semibold">Errori</th>
                <th className="py-2 text-right font-semibold">Token medi</th>
                <th className="py-2 text-right font-semibold">Costo medio</th>
              </tr>
            </thead>
            <tbody>
              {[...perTipo.entries()]
                .sort((a, b) => b[1].costo - a[1].costo)
                .map(([tipo, v]) => (
                  <tr key={tipo} className="border-b border-line/60">
                    <td className="py-2 pr-3 text-ink">{tipo}</td>
                    <td className="py-2 text-right tabular-nums text-gray-warm">
                      {v.letture}
                    </td>
                    <td className="py-2 text-right tabular-nums text-gray-warm">
                      {v.errori > 0 ? (
                        <span className="text-amber-ink">{v.errori}</span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="py-2 text-right tabular-nums text-gray-warm">
                      {Math.round(v.token / Math.max(1, v.letture))}
                    </td>
                    <td className="py-2 text-right font-semibold tabular-nums text-ink">
                      {soldi(v.costo / Math.max(1, v.letture))}
                    </td>
                  </tr>
                ))}
              {perTipo.size === 0 && (
                <tr>
                  <td colSpan={5} className="py-3 text-gray-warm">
                    Nessuna lettura registrata.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Per modello: la taratura dei livelli si decide qui. */}
      <section className="mt-8">
        <TestataSezione
          icona={Coins}
          titolo="Per modello"
          sotto={`Quale livello sta leggendo cosa, e quanto costa. ${salite} letture su ${righe.length} hanno dovuto salire di livello: se questa quota cresce, il livello di partenza è tarato troppo in basso.`}
        />
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[30rem] text-sm">
            <thead>
              <tr className="border-b border-line text-left text-[11px] uppercase tracking-wide text-gray-light">
                <th className="py-2 font-semibold">Modello</th>
                <th className="py-2 text-right font-semibold">Letture</th>
                <th className="py-2 text-right font-semibold">Errori</th>
                <th className="py-2 text-right font-semibold">Salite</th>
                <th className="py-2 text-right font-semibold">Costo medio</th>
              </tr>
            </thead>
            <tbody>
              {[...perModello.entries()]
                .sort((a, b) => b[1].letture - a[1].letture)
                .map(([modello, v]) => (
                  <tr key={modello} className="border-b border-line/60">
                    <td className="py-2 pr-3 text-ink">{modello}</td>
                    <td className="py-2 text-right tabular-nums text-gray-warm">
                      {v.letture}
                    </td>
                    <td className="py-2 text-right tabular-nums text-gray-warm">
                      {v.errori > 0 ? (
                        <span className="text-amber-ink">{v.errori}</span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="py-2 text-right tabular-nums text-gray-warm">
                      {v.escalation > 0 ? v.escalation : "—"}
                    </td>
                    <td className="py-2 text-right font-semibold tabular-nums text-ink">
                      {soldi(v.costo / Math.max(1, v.letture))}
                    </td>
                  </tr>
                ))}
              {perModello.size === 0 && (
                <tr>
                  <td colSpan={5} className="py-3 text-gray-warm">
                    Nessuna lettura registrata.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* L'andamento: una taratura si giudica dal prima e dopo. */}
      {andamento.length > 1 && (
        <section className="mt-8">
          <TestataSezione
            icona={Gauge}
            titolo="Andamento della spesa"
            sotto="Gli ultimi giorni con letture. Serve a rispondere alla sola domanda che conta dopo una taratura: è servita?"
          />
          <ul className="mt-3 space-y-1.5">
            {andamento.map(([g, v]) => (
              <li key={g} className="flex items-center gap-3 text-xs">
                <span className="w-20 shrink-0 tabular-nums text-gray-light">{g}</span>
                <span className="h-2 flex-1 overflow-hidden rounded-full bg-line">
                  <span
                    className="block h-full rounded-full bg-mint"
                    style={{ width: `${(v.costo / massimo) * 100}%` }}
                  />
                </span>
                <span className="w-32 shrink-0 text-right tabular-nums text-gray-warm">
                  {soldi(v.costo)} · {v.letture} letture
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* La tassonomia: cosa sappiamo leggere, e cosa no. */}
      <section className="mt-8">
        <TestataSezione
          icona={ScrollText}
          titolo="La tassonomia documentale"
          sotto={`${tipiLeggibili().length} tipi su ${REGISTRO_MOTORE.length} si sanno leggere. Gli altri sono dichiarati: archiviati e smistati, non ancora letti.`}
        />
        <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-2">
          <div className="rounded-xl border border-mint/40 bg-mint/5 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-mint">
              Si leggono
            </p>
            <ul className="mt-2 space-y-1 text-sm text-ink">
              {tipiLeggibili().map((v) => (
                <li key={v.tipo}>
                  {v.nome}{" "}
                  <span className="text-xs text-gray-light">
                    · {v.famiglia} · {v.forma} · {v.versione}
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border border-line bg-white p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-warm">
              Dichiarati, non ancora letti
            </p>
            <ul className="mt-2 space-y-1 text-sm text-gray-warm">
              {tipiDichiarati().map((v) => (
                <li key={v.tipo}>
                  {v.nome}{" "}
                  <span className="text-xs text-gray-light">
                    · {v.famiglia} · {v.forma}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* I tetti, con la loro motivazione: senza, fra sei mesi nessuno
          saprà se rialzarli o abbassarli. */}
      <section className="mt-8">
        <TestataSezione
          icona={AlertTriangle}
          titolo="I tetti di spesa"
          sotto="Invisibili al cliente. Servono a fermare un difetto prima che diventi una fattura, non a razionare il servizio."
        />
        <ul className="mt-3 space-y-2">
          {Object.values(TETTI).map((t) => (
            <li key={t.ambito} className="rounded-xl border border-line bg-white p-4">
              <p className="text-sm font-semibold text-ink">
                {t.ambito} — allarme a {soldi(t.soglia)}, blocco a {soldi(t.tetto)}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-gray-warm">{t.perche}</p>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
