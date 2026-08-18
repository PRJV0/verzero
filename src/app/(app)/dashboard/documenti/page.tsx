import type { Metadata } from "next";
import { FileText, FolderOpen, ScanLine, UserCheck } from "lucide-react";

import { caricaContesto } from "../_contesto";
import { IntestazioneSezione, SelettoreCliente } from "../_ui";

export const metadata: Metadata = {
  title: "Documenti — il tuo ecosistema",
  robots: { index: false, follow: false },
};

/**
 * DOCUMENTI (SPEC §12.H, sezione 4 di 8): l'archivio unico. Lo storage
 * arriva con la tappa 2.2 — la sezione si presenta come opportunità:
 * cosa conterrà e come lavorerà, mai un vuoto triste.
 */
export default async function DocumentiPage({
  searchParams,
}: {
  searchParams: Promise<{ cliente?: string }>;
}) {
  const { cliente } = await searchParams;
  const contesto = await caricaContesto(cliente, "/dashboard/documenti");

  const COSA = [
    {
      icon: FileText,
      t: "Tutto in un posto solo",
      d: "Bollette, visure, registri e i report che generiamo per te: un archivio unico, ordinato per percorso.",
    },
    {
      icon: ScanLine,
      t: "Letti dal Motore",
      d: "Ogni documento caricato viene letto e trasformato in dati strutturati, con la fonte tracciata riga per riga.",
    },
    {
      icon: UserCheck,
      t: "Validati da persone",
      d: "Nessun documento emesso senza verifica umana: l'esito resta qui, accanto al documento.",
    },
  ];

  return (
    <main>
      <IntestazioneSezione
        eyebrow="DOCUMENTI"
        titolo="L'archivio della tua impresa"
        sotto="Qui vivranno i documenti dei tuoi percorsi: quelli che carichi tu e quelli che generiamo noi. Il caricamento guidato apre con la prossima tappa."
      />

      <SelettoreCliente contesto={contesto} base="/dashboard/documenti" />

      <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {COSA.map((c) => {
          const Icon = c.icon;
          return (
            <div
              key={c.t}
              className="rounded-2xl border border-line bg-white p-5"
            >
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-moss text-pine">
                <Icon size={20} />
              </span>
              <p className="mt-3 font-display text-lg text-ink">{c.t}</p>
              <p className="mt-1.5 text-sm leading-relaxed text-gray-warm">
                {c.d}
              </p>
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex items-center gap-3 rounded-2xl border border-dashed border-pine/30 bg-moss/40 p-5">
        <FolderOpen size={20} className="shrink-0 text-pine" />
        <p className="text-sm leading-relaxed text-gray-warm">
          Intanto tieni a portata di mano i documenti del tuo fascicolo — la
          lista precisa è nella sezione «I tuoi percorsi». Ti avvisiamo noi
          quando l&apos;archivio è pronto a riceverli.
        </p>
      </div>
    </main>
  );
}
