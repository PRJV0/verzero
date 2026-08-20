import Link from "next/link";
import {
  ArrowRight,
  Briefcase,
  Sparkles,
  Users,
  type LucideIcon,
} from "lucide-react";

import type { ContestoPortale } from "./_contesto";

/** Stati condivisi di ordini e moduli. */
export const STATO_BADGE: Record<string, string> = {
  richiesta: "bg-moss text-pine",
  richiesto: "bg-moss text-pine",
  in_attivazione: "bg-amber-soft text-amber-ink",
  attivo: "bg-moss text-pine",
  sospeso: "bg-paper text-gray-warm",
  disdetto: "bg-paper text-gray-light",
};
export const STATO_LABEL: Record<string, string> = {
  richiesta: "In attesa di avvio",
  richiesto: "In attesa di avvio",
  in_attivazione: "In attivazione",
  attivo: "Attivo",
  sospeso: "Sospeso",
  disdetto: "Disdetto",
};

/** Lo stato spiegato in una frase (§12.F: mai codici, per non esperti). */
export const STATO_FRASE: Record<string, string> = {
  richiesta:
    "Richiesta registrata: ti contattiamo per fissare l'avvio del tuo percorso. Nessun addebito fino all'inizio effettivo delle attività.",
  richiesto:
    "Richiesta registrata: ti contattiamo per fissare l'avvio del tuo percorso. Nessun addebito fino all'inizio effettivo delle attività.",
  in_attivazione:
    "Ordine ricevuto: stiamo attivando il percorso e nessun addebito è ancora partito.",
  attivo: "Il percorso è attivo: ci stiamo lavorando.",
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


/* ================================================================== */
/* PRIMITIVE VISIVE DEL PORTALE (SPEC §12.C — densità visiva)          */
/*                                                                     */
/* Tre regole che valgono ovunque, e che servono a far capire il       */
/* portale in cinque secondi:                                          */
/*                                                                     */
/*  IL COLORE HA UN SIGNIFICATO, sempre lo stesso:                     */
/*    menta = l'ha fatto l'AI Ver0 · ambra = serve qualcosa da te      */
/*    pino  = struttura e navigazione                                  */
/*  LE ZONE SI DISTINGUONO: dove si LEGGE ha fondo bianco e bordo      */
/*    sottile; dove si INSERISCE ha fondo salvia e bordo tratteggiato. */
/*  OGNI NUMERO HA UN SEGNO: nessuna percentuale nuda.                 */
/* ================================================================== */

/** Testata di sezione: icona, titolo in Fraunces, riga di contesto. */
export function TestataSezione({
  icona: Icona,
  titolo,
  sotto,
  azione,
}: {
  icona: LucideIcon;
  titolo: string;
  sotto?: string;
  azione?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="flex min-w-0 items-start gap-3">
        <span
          aria-hidden
          className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-moss text-pine"
        >
          <Icona size={18} />
        </span>
        <div className="min-w-0">
          <h2 className="font-display text-2xl leading-tight text-ink">
            {titolo}
          </h2>
          {sotto && (
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-gray-warm">
              {sotto}
            </p>
          )}
        </div>
      </div>
      {azione && <div className="shrink-0">{azione}</div>}
    </div>
  );
}

/**
 * ZONA DI LETTURA: qui si guarda un risultato. Fondo bianco, bordo
 * sottile, nessun invito ad agire — è un foglio, non un modulo.
 */
export function ZonaLettura({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-2xl border border-line bg-white p-5 ${className}`}>
      {children}
    </div>
  );
}

/**
 * ZONA DI INSERIMENTO: qui il portale chiede qualcosa. Fondo salvia e
 * bordo tratteggiato, gli stessi ovunque — così l'occhio impara dove
 * deve agire senza doverlo leggere.
 */
export function ZonaInput({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border-2 border-dashed border-pine/30 bg-moss/40 p-5 ${className}`}
    >
      {children}
    </div>
  );
}

/** Etichetta piccola e stabile sopra un dato: dà gerarchia senza rumore. */
export function Occhiello({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-light">
      {children}
    </p>
  );
}

/** Nessun numero senza un segno che lo accompagni. */
export function Metrica({
  valore,
  unita,
  etichetta,
  percentuale,
  tono = "menta",
}: {
  valore: string | number;
  unita?: string;
  etichetta: string;
  /** Se presente, disegna la barra: il numero non resta mai nudo. */
  percentuale?: number;
  tono?: "menta" | "ambra" | "pino";
}) {
  const colore = {
    menta: "bg-mint",
    ambra: "bg-amber-ink/60",
    pino: "bg-pine",
  }[tono];
  return (
    <div>
      <p className="flex items-baseline gap-1">
        <span className="font-display text-3xl leading-none tabular-nums text-ink">
          {valore}
        </span>
        {unita && (
          <span className="text-sm font-medium text-gray-warm">{unita}</span>
        )}
      </p>
      <p className="mt-1 text-xs leading-snug text-gray-warm">{etichetta}</p>
      {percentuale !== undefined && (
        <div
          className="mt-2 h-1.5 overflow-hidden rounded-full bg-line/60"
          role="img"
          aria-label={`${percentuale} per cento`}
        >
          <div
            className={`h-full rounded-full ${colore}`}
            style={{ width: `${Math.min(100, Math.max(0, percentuale))}%` }}
          />
        </div>
      )}
    </div>
  );
}

/**
 * La legenda del colore, mostrata una volta sola in Panoramica. Non è
 * decorazione: è il patto che rende leggibile tutto il resto senza
 * spiegazioni ripetute in ogni schermata.
 */
export function LegendaColori() {
  const voci = [
    { colore: "bg-mint", testo: "l'ha fatto l'AI Ver0" },
    { colore: "bg-amber-ink/70", testo: "serve qualcosa da te" },
    { colore: "bg-pine", testo: "struttura del documento" },
  ];
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
      <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-gray-light">
        <Sparkles size={12} className="text-mint" /> Come leggere i colori
      </span>
      {voci.map((v) => (
        <span
          key={v.testo}
          className="inline-flex items-center gap-1.5 text-xs text-gray-warm"
        >
          <span aria-hidden className={`h-2.5 w-2.5 rounded-full ${v.colore}`} />
          {v.testo}
        </span>
      ))}
    </div>
  );
}
