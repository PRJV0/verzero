import Link from "next/link";
import { ArrowRight, Briefcase, Users } from "lucide-react";

import type { ContestoPortale } from "./_contesto";

/** Stati condivisi di ordini e moduli. */
export const STATO_BADGE: Record<string, string> = {
  in_attivazione: "bg-amber-soft text-amber-ink",
  attivo: "bg-moss text-pine",
  sospeso: "bg-paper text-gray-warm",
  disdetto: "bg-paper text-gray-light",
};
export const STATO_LABEL: Record<string, string> = {
  in_attivazione: "In attivazione",
  attivo: "Attivo",
  sospeso: "Sospeso",
  disdetto: "Disdetto",
};

/** Lo stato spiegato in una frase (§12.F: mai codici, per non esperti). */
export const STATO_FRASE: Record<string, string> = {
  in_attivazione:
    "Ordine ricevuto: stiamo attivando il percorso e nessun addebito è ancora partito.",
  attivo: "Il percorso è attivo: il Motore ci sta lavorando.",
  sospeso: "Il percorso è in pausa: quando riprende, si riparte da dove eri.",
  disdetto:
    "Il percorso è chiuso: il lavoro fatto resta tuo e puoi riattivarlo quando vuoi.",
};

/** Chip di destinazione (§12.F): a quale documento contribuisce un dato. */
export function ChipDestinazione({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center rounded-full border border-pine/25 bg-white px-2 py-0.5 text-[10px] font-medium text-pine">
      <span aria-hidden className="mr-1">
        →
      </span>
      {label}
    </span>
  );
}

/** Intestazione comune delle sezioni del portale. */
export function IntestazioneSezione({
  eyebrow,
  titolo,
  sotto,
}: {
  eyebrow: string;
  titolo: string;
  sotto?: string;
}) {
  return (
    <div>
      <p className="text-xs font-semibold tracking-widest text-pine">
        {eyebrow}
      </p>
      <h1 className="mt-1 font-display text-3xl text-ink md:text-4xl">
        {titolo}
      </h1>
      {sotto && (
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-gray-warm">
          {sotto}
        </p>
      )}
    </div>
  );
}

/**
 * Selettore cliente del consulente (SPEC §12.K/§12.H): stessa struttura
 * del portale, filtrata sul cliente scelto. Compare solo per il ruolo
 * consulente; il parametro viaggia con la navigazione.
 */
export function SelettoreCliente({
  contesto,
  base,
}: {
  contesto: ContestoPortale;
  base: string;
}) {
  if (contesto.ruolo !== "consulente") return null;
  return (
    <div className="mt-5 rounded-xl border border-line bg-white p-4">
      <p className="flex items-center gap-2 text-xs font-semibold text-ink">
        <Briefcase size={14} className="text-pine" /> CONSULENTE PARTNER ·
        cliente selezionato
      </p>
      {contesto.clienti.length === 0 ? (
        <p className="mt-2 text-sm text-gray-warm">
          Nessun cliente collegato: quando un&apos;impresa ti darà mandato, il
          suo ecosistema comparirà qui.
        </p>
      ) : (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {contesto.clienti.map((c) => {
            const attivo = c.id === contesto.org?.id;
            return (
              <Link
                key={c.id}
                href={`${base}?cliente=${c.id}`}
                aria-current={attivo ? "true" : undefined}
                className={
                  "rounded-full border px-3 py-1.5 text-sm transition-colors " +
                  (attivo
                    ? "border-pine bg-pine font-medium text-white"
                    : "border-line bg-white text-gray-warm hover:border-pine/40")
                }
              >
                {c.ragione_sociale}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

/**
 * Le sezioni non ancora attive si presentano come OPPORTUNITÀ eleganti
 * (SPEC §12.H): cosa faranno per te e, se c'è, la via per attivarle.
 * Mai un vuoto triste.
 */
export function CardOpportunita({
  icona: Icona = Users,
  titolo,
  testo,
  cta,
}: {
  icona?: typeof Users;
  titolo: string;
  testo: string;
  cta?: { href: string; label: string };
}) {
  return (
    <div className="rounded-2xl border border-dashed border-pine/30 bg-moss/40 p-5">
      <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-white text-pine">
        <Icona size={20} />
      </span>
      <p className="mt-3 font-display text-xl text-ink">{titolo}</p>
      <p className="mt-1.5 text-sm leading-relaxed text-gray-warm">{testo}</p>
      {cta && (
        <Link
          href={cta.href}
          className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-pine hover:underline"
        >
          {cta.label} <ArrowRight size={15} />
        </Link>
      )}
    </div>
  );
}
