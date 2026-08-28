import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { tipoDocumento } from "@/lib/documenti";
import { voceMotore } from "@/lib/motore/famiglie";

import { IntestazioneSezione } from "../../_ui";
import { linkVista } from "../azioni";
import { ConfermaAffiancata, type RigaVista } from "./conferma";

export const metadata: Metadata = {
  title: "Conferma i dati letti — il tuo ecosistema",
  robots: { index: false, follow: false },
};

/**
 * LA SCHERMATA DI CONFERMA (docs/motore.md §3, §4.4).
 *
 * Esiste per una ragione sola: rendere veloce un gesto obbligatorio. La
 * conferma umana non si può togliere — è il fondamento del prodotto — ma
 * si può togliere tutto quello che la circonda e la rende lenta: cercare
 * il documento, ingrandirlo, trovare la riga giusta, tornare indietro.
 *
 * Qui il documento sta accanto ai dati, aperto sulla pagina della riga
 * che si sta guardando, e la tastiera basta per andare avanti.
 */
export default async function ConfermaDocumentoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  // La RLS è la barriera: se il documento non è dell'organizzazione di
  // chi guarda, semplicemente non esiste.
  const { data: documento } = await supabase
    .from("documents")
    .select("id, nome_file, mime, tipo, stato, lettura_nota, note_libere")
    .eq("id", id)
    .maybeSingle();
  if (!documento) notFound();

  const { data: campi } = await supabase
    .from("document_fields")
    .select("*")
    .eq("document_id", id)
    .order("riga", { ascending: true })
    .order("created_at", { ascending: true });

  const tipo = tipoDocumento(documento.tipo);
  const voce = voceMotore(documento.tipo);
  const url = await linkVista(id);

  // Le celle si raggruppano per riga, nell'ordine delle colonne dichiarate
  // dal tipo: l'ordine di lettura sul foglio, non quello di inserimento.
  const perRiga = new Map<number, typeof campi>();
  for (const c of campi ?? []) {
    const elenco = perRiga.get(c.riga) ?? [];
    elenco.push(c);
    perRiga.set(c.riga, elenco);
  }
  const ordineColonne = new Map(
    (voce?.campi ?? []).map((c, i) => [c.chiave, i] as const),
  );

  const righe: RigaVista[] = [...perRiga.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([riga, celle]) => {
      const ordinate = [...(celle ?? [])].sort(
        (a, b) =>
          (ordineColonne.get(a.campo) ?? 99) - (ordineColonne.get(b.campo) ?? 99),
      );
      const prima = ordinate[0];
      return {
        riga,
        celle: ordinate.map((c) => ({
          id: c.id,
          chiave: c.campo,
          etichetta: c.etichetta,
          valore: c.valore,
          unita: c.unita,
        })),
        // Confidenza, pagina, estratto e fonte sono della RIGA e uguali su
        // tutte le sue celle (v. la migrazione): si legge la prima.
        confidenza: prima?.confidenza ?? 0,
        pagina: prima?.pagina ?? null,
        estrattoDa: prima?.estratto_da ?? null,
        fonteLettura: prima?.fonte_lettura ?? "testo",
        nota: prima?.nota ?? null,
        avvisi: [...new Set(ordinate.flatMap((c) => c.avvisi ?? []))],
        stato: prima?.stato ?? "da_confermare",
      };
    });

  const daConfermare = righe.filter((r) => r.stato === "da_confermare").length;

  return (
    <main>
      <Link
        href="/dashboard/documenti"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-warm hover:text-pine"
      >
        <ArrowLeft size={13} aria-hidden /> Torna all&apos;archivio
      </Link>

      <IntestazioneSezione
        eyebrow="CONFERMA"
        titolo={
          daConfermare === 0
            ? "Tutto controllato"
            : "Controlla quello che abbiamo letto"
        }
        sotto={
          righe.length === 0
            ? `Da questo documento non abbiamo ancora estratto nulla.`
            : `${documento.nome_file}${tipo ? ` · ${tipo.nome}` : ""}. Il documento è qui accanto: confronta e conferma. Finché non lo fai, questi dati restano fuori dai calcoli e dai documenti.`
        }
      />

      {documento.lettura_nota && (
        <p className="mt-4 rounded-xl border border-amber-ink/25 bg-amber-soft/60 px-4 py-3 text-sm leading-relaxed text-amber-ink">
          {documento.lettura_nota}
        </p>
      )}

      {/* LE NOTE SCRITTE SUL DOCUMENTO — citazione, non avviso.
          Stavano fra le avvertenze, cioè in ambra accanto a «la grafia
          non è agevole»: una frase scritta dal cliente sembrava un
          difetto della lettura. Qui è quello che è — una citazione, in
          corsivo, dietro un filetto — e non ha il colore dell'allarme. */}
      {documento.note_libere && documento.note_libere.length > 0 && (
        <figure className="mt-4 border-l-2 border-pine/30 pl-4">
          <figcaption className="text-[11px] font-semibold uppercase tracking-widest text-gray-light">
            Scritto sul documento
          </figcaption>
          {documento.note_libere.map((nota: string) => (
            <blockquote
              key={nota}
              className="mt-1.5 font-display text-[15px] italic leading-relaxed text-ink"
            >
              «{nota}»
            </blockquote>
          ))}
        </figure>
      )}

      <div className="mt-6">
        {righe.length === 0 ? (
          <p className="rounded-xl border border-dashed border-pine/30 bg-moss/40 p-5 text-sm leading-relaxed text-gray-warm">
            Questo documento non ha ancora dati letti. Torna all&apos;archivio e
            avvia la lettura.
          </p>
        ) : (
          <ConfermaAffiancata
            documentId={documento.id}
            nomeFile={documento.nome_file}
            mime={documento.mime}
            url={url}
            righe={righe}
          />
        )}
      </div>
    </main>
  );
}
