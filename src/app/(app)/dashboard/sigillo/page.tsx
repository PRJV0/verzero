import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Download, ExternalLink } from "lucide-react";

import { Sigillo } from "@/components/brand/sigillo";
import { createClient } from "@/lib/supabase/server";
import { getServizio } from "@/lib/catalog";
import { publicEnv } from "@/lib/env";

import { caricaContesto } from "../_contesto";
import { IntestazioneSezione, SelettoreCliente } from "../_ui";

export const metadata: Metadata = {
  title: "Sigillo — il tuo ecosistema",
  robots: { index: false, follow: false },
};

/**
 * SIGILLO (SPEC §12.H + §12.F): lo stato del marchio di verifica.
 *
 * Stato 1 — «PERCORSO AVVIATO»: dal primo giorno l'anello punteggiato
 * (mai segmenti pieni) e la TARGA DI AVVIO scaricabile, col QR verso la
 * pagina pubblica. La targa dichiara un percorso in corso, mai un
 * risultato. Stato 2 — i segmenti pieni arrivano SOLO a percorso
 * verificato. Anti-greenwashing by design.
 */
export default async function SigilloPage({
  searchParams,
}: {
  searchParams: Promise<{ cliente?: string }>;
}) {
  const { cliente } = await searchParams;
  const contesto = await caricaContesto(cliente, "/dashboard/sigillo");
  const supabase = await createClient();

  const [{ data: moduli }, { data: orgConCodice }] = contesto.org
    ? await Promise.all([
        supabase
          .from("module_activations")
          .select("module, stato")
          .eq("organization_id", contesto.org.id),
        supabase
          .from("organizations")
          .select("codice_verifica")
          .eq("id", contesto.org.id)
          .maybeSingle(),
      ])
    : [{ data: [] }, { data: null }];
  const attivi = (moduli ?? []).filter((m) => m.stato === "attivo");
  const avviato = attivi.length > 0;
  const codice = orgConCodice?.codice_verifica ?? null;

  const conCliente = (href: string) =>
    contesto.ruolo === "consulente" && contesto.org
      ? `${href}?cliente=${contesto.org.id}`
      : href;

  return (
    <main>
      <IntestazioneSezione
        eyebrow="SIGILLO"
        titolo="Il tuo Sigillo Ver0"
        sotto="Il marchio di verifica non si compra: si conquista completando un percorso, e ogni anno va riconquistato. Ma già da oggi puoi dichiarare una cosa vera: che il percorso è iniziato."
      />

      <SelettoreCliente contesto={contesto} base="/dashboard/sigillo" />

      {/* L'anello, nello stato onesto di oggi */}
      <div className="mt-8 overflow-hidden rounded-2xl bg-pine-deep p-6 text-center sm:p-8">
        <div className="flex justify-center">
          <Sigillo
            tone="dark"
            avvio={avviato}
            className={avviato ? "h-28 w-28" : "h-28 w-28 opacity-60"}
          />
        </div>
        <p className="mt-4 font-display text-2xl text-white">
          {avviato ? "Percorso avviato 2026" : "Il tuo anello è ancora da riempire"}
        </p>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-moss">
          {avviato
            ? "L'anello per ora è punteggiato, ed è giusto così: i segmenti pieni si accendono solo quando un percorso è completato e validato dal team tecnico. Nessuno può comprarli prima."
            : "Ogni percorso completato e validato accende un segmento dell'anello. Il primo passo è attivare un percorso qualificante."}
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <Link
            href={avviato ? conCliente("/dashboard/percorsi") : "/servizi"}
            className="vz-press inline-flex items-center gap-1.5 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-pine"
          >
            {avviato ? "Completa il fascicolo" : "Attiva un percorso"}
            <ArrowRight size={15} />
          </Link>
          <Link
            href="/sigillo"
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/30 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:border-mint-bright/60"
          >
            Come funziona il Sigillo
          </Link>
        </div>
      </div>

      {/* La targa di avvio: qualcosa di vero da mostrare, da subito (§12.F) */}
      {avviato && codice && (
        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-line bg-white p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-pine">
              La targa di avvio
            </p>
            <p className="mt-2 text-sm leading-relaxed text-gray-warm">
              Un file pronto da stampare o pubblicare — sul sito, nelle
              offerte, in firma email — che dichiara una cosa vera e
              verificabile: il percorso è iniziato. Porta il sigillo
              punteggiato, l&apos;anno e un codice QR: chi lo inquadra arriva
              alla tua pagina pubblica e vede lo stato reale del percorso.
            </p>
            <p className="mt-2 text-xs leading-relaxed text-gray-light">
              La targa dichiara un percorso in corso, mai un risultato: non è
              una certificazione e non è ancora il Sigillo.
            </p>
            <a
              href={conCliente("/api/targa-avvio")}
              download
              className="vz-press mt-4 inline-flex items-center gap-2 rounded-lg bg-pine px-4 py-2.5 text-sm font-semibold text-white"
            >
              <Download size={15} /> Scarica la targa di avvio
            </a>
            <p className="mt-1.5 text-[11px] text-gray-light">
              Cosa succede dopo: scarichi un file immagine (SVG) già
              impaginato coi tuoi dati, senza filigrane.
            </p>
          </div>

          <div className="rounded-2xl border border-line bg-white p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-pine">
              La tua pagina pubblica
            </p>
            <p className="mt-2 text-sm leading-relaxed text-gray-warm">
              È la pagina a cui punta il QR della targa: dichiara che il
              percorso è avviato e in corso di completamento, con la data di
              avvio e i percorsi in lavorazione. Chiunque può aprirla, nessun
              accesso richiesto.
            </p>
            <p className="mt-2 break-all rounded-lg bg-paper px-3 py-2 text-xs tabular-nums text-gray-warm">
              {publicEnv.siteUrl.replace(/^https?:\/\//, "")}/verifica/{codice}
            </p>
            <a
              href={`/verifica/${codice}`}
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex items-center gap-2 rounded-lg border border-pine px-4 py-2.5 text-sm font-medium text-pine transition-colors hover:bg-moss"
            >
              <ExternalLink size={15} /> Apri la pagina pubblica
            </a>
            <p className="mt-1.5 text-[11px] text-gray-light">
              Si apre in una nuova scheda: è quello che vedrà chi inquadra il
              QR.
            </p>
          </div>
        </div>
      )}

      {attivi.length > 0 && (
        <div className="mt-4 rounded-2xl border border-line bg-white p-5">
          <p className="text-sm font-semibold text-ink">
            I tuoi percorsi verso il Sigillo
          </p>
          <ul className="mt-2 space-y-1.5">
            {attivi.map((m) => (
              <li key={m.module} className="text-sm text-gray-warm">
                {getServizio(m.module)?.name ?? m.module} — in corso: quando
                sarà completato e validato, il segmento si accenderà qui.
              </li>
            ))}
          </ul>
        </div>
      )}
    </main>
  );
}
