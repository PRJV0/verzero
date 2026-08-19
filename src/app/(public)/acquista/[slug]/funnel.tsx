"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  CreditCard,
  Info,
  Landmark,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import {
  DIMENSIONI,
  DIMENSIONE_LABEL,
  DIMENSIONE_RANGE,
  FORMULE,
  isUnaTantum,
  prezzoDettaglio,
  prezzoUnaTantum,
  rinnovoLabel,
  RINNOVO_LIBERO,
  type Dimensione,
  type Formula,
} from "@/lib/pricing";
import { CANONE_INCLUDE } from "@/lib/canone";
import { getServizio } from "@/lib/catalog";
import {
  PASSWORD_REGOLE,
  passwordValida,
  validaPartitaIva,
} from "@/lib/piva";

/**
 * Funnel di acquisto in step (SPEC §12.T):
 * riepilogo persistente e vivo → registrazione azienda con email e password
 * (o login rapido) → consensi espliciti mai pre-spuntati → pagamento con
 * provider dichiaratamente disattivato → conferma ed ecosistema.
 *
 * Lo stato è persistito in localStorage: chi esce riprende dallo step in cui
 * era. I consensi registrati qui (timestamp) migreranno nella tabella
 * `consents` con la fase 1 del database (SPEC §15.1).
 */

const eur = (n: number) => n.toLocaleString("it-IT");

/** Coppie di "taglio" alternativo dello stesso servizio (switch nel riepilogo). */
const TAGLI: Record<string, { slug: string; label: string }[]> = {
  "carbon-footprint-scope-1-2": [
    { slug: "carbon-footprint-scope-1-2", label: "Scope 1 e 2" },
    { slug: "carbon-footprint-scope-1-2-3", label: "Scope 1, 2 e 3" },
  ],
  "carbon-footprint-scope-1-2-3": [
    { slug: "carbon-footprint-scope-1-2", label: "Scope 1 e 2" },
    { slug: "carbon-footprint-scope-1-2-3", label: "Scope 1, 2 e 3" },
  ],
  "bilancio-sostenibilita-vsme-base": [
    { slug: "bilancio-sostenibilita-vsme-base", label: "Base · modulo base VSME" },
    { slug: "bilancio-sostenibilita-vsme-avanzato", label: "Avanzato · base + modulo completo" },
  ],
  "bilancio-sostenibilita-vsme-avanzato": [
    { slug: "bilancio-sostenibilita-vsme-base", label: "Base · modulo base VSME" },
    { slug: "bilancio-sostenibilita-vsme-avanzato", label: "Avanzato · base + modulo completo" },
  ],
  "manuale-sistema-gestione-iso-45001": [
    { slug: "manuale-sistema-gestione-iso-9001", label: "ISO 9001 · qualità" },
    { slug: "manuale-sistema-gestione-iso-14001", label: "ISO 14001 · ambiente" },
    { slug: "manuale-sistema-gestione-iso-45001", label: "ISO 45001 · sicurezza" },
  ],
  "manuale-sistema-gestione-iso-9001": [
    { slug: "manuale-sistema-gestione-iso-9001", label: "ISO 9001 · qualità" },
    { slug: "manuale-sistema-gestione-iso-14001", label: "ISO 14001 · ambiente" },
    { slug: "manuale-sistema-gestione-iso-45001", label: "ISO 45001 · sicurezza" },
  ],
  "manuale-sistema-gestione-iso-14001": [
    { slug: "manuale-sistema-gestione-iso-9001", label: "ISO 9001 · qualità" },
    { slug: "manuale-sistema-gestione-iso-14001", label: "ISO 14001 · ambiente" },
    { slug: "manuale-sistema-gestione-iso-45001", label: "ISO 45001 · sicurezza" },
  ],
};

const STEP_LABELS = ["Riepilogo", "Registrazione", "Consensi", "Pagamento"];

type Azienda = {
  ragioneSociale: string;
  piva: string;
  email: string;
  /** Sito ufficiale, facoltativo: da lì il Motore prende le parti
   *  narrative dei documenti (SPEC §12.D). */
  sitoWeb: string;
};

type FunnelState = {
  step: 1 | 2 | 3 | 4 | 5;
  dimensione: Dimensione;
  formula: Formula;
  azienda: Azienda;
  registrato: boolean;
  /** Id utente dalla signUp: serve alle API quando la sessione non c'è ancora
      (progetti Supabase con conferma email obbligatoria). */
  userId?: string;
  /** L'account richiede conferma email (impostazione Supabase). */
  emailDaConfermare: boolean;
  consensi: { tos: boolean; bancheDati: boolean; acceptedAt?: string };
};

const DEFAULT_STATE: FunnelState = {
  step: 1,
  dimensione: "micro",
  formula: "mensile",
  azienda: { ragioneSociale: "", piva: "", email: "", sitoWeb: "" },
  registrato: false,
  emailDaConfermare: false,
  consensi: { tos: false, bancheDati: false },
};

const storageKey = (slug: string) => `vz-funnel-${slug}`;

export function FunnelAcquisto({
  slug,
  nome,
  short,
}: {
  slug: string;
  nome: string;
  short: string;
}) {
  const searchParams = useSearchParams();
  const [state, setState] = useState<FunnelState>(DEFAULT_STATE);
  const [pronto, setPronto] = useState(false);
  const stepHeadingRef = useRef<HTMLHeadingElement>(null);

  // Ripristino dello stato salvato + dimensione dalla query. La lettura di
  // localStorage DEVE stare in un effect (SSR-safe: il server non ha window e
  // un lazy initializer creerebbe hydration mismatch); il setState singolo al
  // mount non genera cascate.
  useEffect(() => {
    let restored = DEFAULT_STATE;
    try {
      const raw = localStorage.getItem(storageKey(slug));
      if (raw) restored = { ...DEFAULT_STATE, ...JSON.parse(raw) };
    } catch {
      /* stato corrotto: si riparte dallo step 1 */
    }
    const qDim = searchParams.get("dimensione") as Dimensione | null;
    if (qDim && DIMENSIONI.includes(qDim) && qDim !== "grande") {
      restored = { ...restored, dimensione: qDim };
    }
    // Un funnel già concluso non si riprende: nuovo acquisto da capo.
    if (restored.step === 5) {
      restored = { ...DEFAULT_STATE, dimensione: restored.dimensione };
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- ripristino una tantum al mount da localStorage (SSR-safe)
    setState(restored);
    setPronto(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- solo al mount
  }, [slug]);

  // Persistenza a ogni cambiamento (dopo il ripristino iniziale). A ordine
  // concluso (step 5) la chiave si rimuove: un nuovo acquisto riparte da capo.
  useEffect(() => {
    if (!pronto) return;
    try {
      if (state.step === 5) {
        localStorage.removeItem(storageKey(slug));
      } else {
        localStorage.setItem(storageKey(slug), JSON.stringify(state));
      }
    } catch {
      /* storage pieno o negato: il funnel resta utilizzabile in sessione */
    }
  }, [state, slug, pronto]);

  const set = useCallback(
    (patch: Partial<FunnelState>) => setState((s) => ({ ...s, ...patch })),
    [],
  );

  const goTo = useCallback(
    (step: FunnelState["step"]) => {
      setState((s) => ({ ...s, step }));
      // Focus sull'intestazione del nuovo step (accessibilità).
      requestAnimationFrame(() => stepHeadingRef.current?.focus());
    },
    [],
  );

  const prezzo = prezzoDettaglio(slug, state.dimensione);
  // Servizi one-shot (es. supporto all'audit): nessun canone, nessuna formula.
  const unaTantum = prezzoUnaTantum(slug, state.dimensione);
  const tagli = TAGLI[slug];

  const riepilogo = (
    <RiepilogoPanel
      slug={slug}
      nome={nome}
      state={state}
      tagli={tagli}
    />
  );

  if (!pronto) {
    // Skeleton con la stessa geometria del funnel: niente salti di layout
    // quando lo stato salvato viene ripristinato.
    return (
      <main aria-busy className="mx-auto max-w-5xl px-5 py-8">
        <span className="sr-only">Caricamento del funnel…</span>
        <div className="h-4 w-40 animate-pulse rounded bg-line/60" />
        <div className="mt-3 h-9 w-72 max-w-full animate-pulse rounded bg-line/60" />
        <div className="mt-4 h-4 w-56 animate-pulse rounded bg-line/40" />
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_340px]">
          <div className="space-y-3">
            <div className="h-7 w-64 animate-pulse rounded bg-line/60" />
            <div className="h-24 animate-pulse rounded-xl bg-line/40" />
            <div className="h-24 animate-pulse rounded-xl bg-line/40" />
            <div className="h-12 w-40 animate-pulse rounded-lg bg-line/60" />
          </div>
          <div className="hidden h-72 animate-pulse rounded-xl bg-line/40 lg:block" />
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-5 py-8">
      {state.step < 5 && (
        <>
          <p className="text-xs text-gray-warm">
            <Link href={`/servizi/${slug}`} className="hover:text-pine">
              <ArrowLeft size={12} className="mr-1 inline" />
              Torna a {nome}
            </Link>
          </p>
          <h1 className="mt-2 font-display text-3xl text-ink md:text-4xl">
            Attiva {nome}
          </h1>

          {/* Barra di avanzamento */}
          <ol className="mt-5 flex flex-wrap gap-x-4 gap-y-1 text-xs">
            {STEP_LABELS.map((label, i) => {
              const n = (i + 1) as FunnelState["step"];
              const done = state.step > n;
              const current = state.step === n;
              return (
                <li
                  key={label}
                  aria-current={current ? "step" : undefined}
                  className={
                    "flex items-center gap-1.5 " +
                    (current
                      ? "font-semibold text-pine"
                      : done
                        ? "text-mint"
                        : "text-gray-light")
                  }
                >
                  {done ? (
                    <Check size={13} />
                  ) : (
                    <span
                      aria-hidden
                      className={
                        "inline-flex h-4 w-4 items-center justify-center rounded-full border text-[10px] " +
                        (current ? "border-pine" : "border-line")
                      }
                    >
                      {n}
                    </span>
                  )}
                  {label}
                </li>
              );
            })}
          </ol>
        </>
      )}

      <div
        className={
          "mt-6 grid grid-cols-1 gap-6 " +
          (state.step < 5 ? "lg:grid-cols-[1fr_340px]" : "")
        }
      >
        <div>
          {/* Riepilogo comprimibile, in alto su mobile */}
          {state.step < 5 && (
            <details className="mb-5 rounded-xl border border-line bg-white lg:hidden">
              <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-ink">
                Riepilogo · {nome} ·{" "}
                {unaTantum !== null
                  ? `${eur(unaTantum)} € una tantum`
                  : prezzo
                    ? state.formula === "mensile"
                      ? `${eur(prezzo.mensile)} €/mese`
                      : `${eur(prezzo.annuale)} €/anno`
                    : ""}
              </summary>
              <div className="border-t border-line px-4 py-3">{riepilogo}</div>
            </details>
          )}

          {state.step === 1 && (
            <StepRiepilogo
              headingRef={stepHeadingRef}
              slug={slug}
              state={state}
              set={set}
              avanti={() => goTo(2)}
            />
          )}
          {state.step === 2 && (
            <StepRegistrazione
              headingRef={stepHeadingRef}
              state={state}
              set={set}
              indietro={() => goTo(1)}
              avanti={() => goTo(3)}
            />
          )}
          {state.step === 3 && (
            <StepConsensi
              headingRef={stepHeadingRef}
              state={state}
              set={set}
              indietro={() => goTo(2)}
              avanti={() => goTo(4)}
            />
          )}
          {state.step === 4 && (
            <StepPagamento
              headingRef={stepHeadingRef}
              slug={slug}
              nome={nome}
              state={state}
              set={set}
              indietro={() => goTo(3)}
              completa={async () => {
                // Fase 1: ordine, consensi e attivazione si scrivono a database.
                try {
                  const r = await fetch("/api/funnel/ordine", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      userId: state.userId,
                      slug,
                      dimensione: state.dimensione,
                      formula: state.formula,
                      tosAcceptedAt: state.consensi.acceptedAt,
                      mandatoAcceptedAt: state.consensi.acceptedAt,
                    }),
                  });
                  if (!r.ok && r.status !== 207) {
                    const j = (await r.json().catch(() => ({}))) as {
                      error?: string;
                    };
                    return j.error ?? "Salvataggio non riuscito: riprova.";
                  }
                } catch {
                  return "Rete non raggiungibile: l'ordine non è stato salvato, riprova.";
                }
                // La bozza locale ha finito il suo compito.
                try {
                  localStorage.removeItem(storageKey(slug));
                  localStorage.removeItem("vz-ordine");
                } catch {
                  /* niente storage, nessun problema */
                }
                goTo(5);
                return null;
              }}
            />
          )}
          {state.step === 5 && (
            <StepConferma
              headingRef={stepHeadingRef}
              nome={nome}
              short={short}
              state={state}
            />
          )}
        </div>

        {/* Riepilogo persistente a lato su desktop */}
        {state.step < 5 && (
          <aside className="hidden lg:block">
            <div className="sticky top-6 rounded-xl border border-line bg-white p-4">
              {riepilogo}
            </div>
          </aside>
        )}
      </div>
    </main>
  );
}

/* ------------------------------------------------------------------ */
/* Riepilogo (pannello persistente, si aggiorna live)                  */
/* ------------------------------------------------------------------ */

function RiepilogoPanel({
  slug,
  nome,
  state,
  tagli,
}: {
  slug: string;
  nome: string;
  state: FunnelState;
  tagli?: { slug: string; label: string }[];
}) {
  const p = prezzoDettaglio(slug, state.dimensione);
  const unaTantum = prezzoUnaTantum(slug, state.dimensione);
  return (
    <div className="text-sm">
      <p className="font-semibold text-ink">{nome}</p>

      {tagli && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {tagli.map((t) => (
            <Link
              key={t.slug}
              href={`/acquista/${t.slug}?dimensione=${state.dimensione}`}
              aria-current={t.slug === slug ? "true" : undefined}
              className={
                "rounded-full border px-2.5 py-1 text-xs transition-colors " +
                (t.slug === slug
                  ? "border-pine bg-moss font-medium text-pine-dark"
                  : "border-line text-gray-warm hover:border-pine/40")
              }
            >
              {t.label}
            </Link>
          ))}
        </div>
      )}

      {/* Il perimetro si dichiara anche qui: è il punto in cui si compra. */}
      {getServizio(slug)?.perimetro && (
        <p className="mt-2 rounded-lg bg-amber-soft px-3 py-2 text-xs leading-relaxed text-amber-ink">
          {getServizio(slug)!.perimetro}
        </p>
      )}

      <dl className="mt-3 space-y-1 text-xs text-gray-warm">
        <div className="flex justify-between">
          <dt>Dimensione</dt>
          <dd className="font-medium text-ink">
            {DIMENSIONE_LABEL[state.dimensione]}
          </dd>
        </div>
        <div className="flex justify-between">
          <dt>Formula</dt>
          <dd className="font-medium text-ink">
            {unaTantum !== null
              ? "Una tantum"
              : state.formula === "mensile"
                ? "Canone mensile"
                : "Unica soluzione annuale (−10%)"}
          </dd>
        </div>
      </dl>

      {unaTantum !== null && (
        <div
          key={state.dimensione}
          className="vz-price-in mt-3 border-t border-line/70 pt-3"
        >
          <p className="mt-1 flex items-baseline justify-between">
            <span className="text-xs text-gray-warm">Intervento</span>
            <span className="font-display text-2xl tabular-nums text-pine">
              {eur(unaTantum)} €
            </span>
          </p>
          <p className="text-right text-xs text-gray-light">
            una tantum · IVA esclusa
          </p>
          <p className="mt-2 text-xs leading-relaxed text-gray-warm">
            <span className="font-semibold text-pine">
              Nessun canone e nessun rinnovo
            </span>
            <br />
            Si paga una volta sola, per l&apos;intervento.
          </p>
        </div>
      )}

      {p && (
        <div key={state.dimensione + state.formula} className="vz-price-in mt-3 border-t border-line/70 pt-3">
          <p className="mt-1 flex items-baseline justify-between">
            <span className="text-xs text-gray-warm">
              {state.formula === "mensile"
                ? "Canone primo anno"
                : "Canone annuale (1° anno)"}
            </span>
            <span className="font-display text-2xl tabular-nums text-pine">
              {state.formula === "mensile"
                ? `${eur(p.mensile)} €/mese`
                : `${eur(p.annuale)} €/anno`}
            </span>
          </p>
          <p className="text-right text-xs text-gray-light">
            {state.formula === "mensile"
              ? "impegno minimo 12 mesi · IVA esclusa"
              : `−10% · risparmi ${eur(p.risparmio)} € · IVA esclusa`}
          </p>
          {/* Ciclo di vita del canone (§12.Q) */}
          <p className="mt-2 text-xs leading-relaxed text-gray-warm">
            <span className="font-semibold text-pine">
              {rinnovoLabel(slug, state.dimensione)}
            </span>
            <br />
            {RINNOVO_LIBERO}
          </p>
        </div>
      )}

      <div className="mt-3 border-t border-line/70 pt-3">
        <p className="text-xs font-semibold text-pine">
          {unaTantum !== null ? "L'intervento include" : "Il canone include"}
        </p>
        {/* I benefici del canone non valgono per un one-shot: lì l'elenco
            giusto è ciò che l'intervento consegna. */}
        <ul className="mt-1.5 space-y-1">
          {(unaTantum !== null
            ? (getServizio(slug)?.output ?? [])
            : CANONE_INCLUDE.map((b) => b.title)
          ).map((voce) => (
            <li
              key={voce}
              className="flex items-start gap-1.5 text-xs text-gray-warm"
            >
              <Check size={12} className="mt-0.5 shrink-0 text-mint" />
              {voce}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Step 1 — Riepilogo e scelte                                         */
/* ------------------------------------------------------------------ */

function StepRiepilogo({
  headingRef,
  slug,
  state,
  set,
  avanti,
}: {
  headingRef: React.RefObject<HTMLHeadingElement | null>;
  slug: string;
  state: FunnelState;
  set: (p: Partial<FunnelState>) => void;
  avanti: () => void;
}) {
  const oneShot = isUnaTantum(slug);
  return (
    <section aria-labelledby="step1-h">
      <h2
        id="step1-h"
        ref={headingRef}
        tabIndex={-1}
        className="font-display text-2xl text-ink outline-none"
      >
        {oneShot ? "Componi il tuo intervento" : "Componi il tuo abbonamento"}
      </h2>
      <p className="mt-1 text-sm text-gray-warm">
        Controlla le scelte nel riepilogo: si aggiorna a ogni modifica.
      </p>

      <fieldset className="mt-5">
        <legend className="text-sm font-medium text-ink">
          Dimensione della tua impresa
        </legend>
        <div className="mt-2 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
          {DIMENSIONI.filter((d) => d !== "grande").map((d) => {
            const selected = d === state.dimensione;
            return (
              <button
                key={d}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => set({ dimensione: d })}
                className={
                  "rounded-lg border px-3 py-2.5 text-left transition-all " +
                  (selected
                    ? "border-pine bg-moss shadow-soft"
                    : "border-line bg-white hover:border-pine/40")
                }
              >
                <span
                  className={
                    "block text-sm font-semibold " +
                    (selected ? "text-pine-dark" : "text-ink")
                  }
                >
                  {DIMENSIONE_LABEL[d]}
                </span>
                <span className="block text-xs text-gray-warm">
                  {DIMENSIONE_RANGE[d]}
                </span>
              </button>
            );
          })}
        </div>
        <p className="mt-2 text-xs text-gray-warm">
          Grande impresa (250+ addetti)? Percorsi su misura:{" "}
          <a
            href="mailto:info@verzero.it?subject=Percorsi%20su%20misura"
            className="font-medium text-pine hover:underline"
          >
            parliamone
          </a>
          .
        </p>
      </fieldset>

      {/* I one-shot non hanno formula da scegliere: si paga l'intervento. */}
      {oneShot ? (
        <p className="mt-6 rounded-xl border border-line bg-paper px-4 py-3 text-sm text-gray-warm">
          Intervento <strong className="font-semibold text-pine">una tantum</strong>:
          nessun canone, nessun rinnovo, nessun impegno successivo.
        </p>
      ) : (
        <fieldset className="mt-6">
          <legend className="text-sm font-medium text-ink">
            Formula di pagamento
          </legend>
          <div className="mt-2 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
            {FORMULE.map((f) => {
              const selected = f === state.formula;
              return (
                <button
                  key={f}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => set({ formula: f })}
                  className={
                    "rounded-lg border px-3 py-2.5 text-left transition-all " +
                    (selected
                      ? "border-pine bg-moss shadow-soft"
                      : "border-line bg-white hover:border-pine/40")
                  }
                >
                  <span
                    className={
                      "block text-sm font-semibold " +
                      (selected ? "text-pine-dark" : "text-ink")
                    }
                  >
                    {f === "mensile"
                      ? "Canone mensile"
                      : "Unica soluzione annuale"}
                  </span>
                  <span className="block text-xs text-gray-warm">
                    {f === "mensile"
                      ? "impegno minimo 12 mesi"
                      : "sconto 10% applicato"}
                  </span>
                </button>
              );
            })}
          </div>
        </fieldset>
      )}

      <button
        type="button"
        onClick={avanti}
        className="mt-7 inline-flex items-center gap-1.5 rounded-lg bg-pine px-5 py-2.5 text-sm font-medium text-white transition-all hover:-translate-y-0.5 hover:shadow-soft"
      >
        Continua <ArrowRight size={15} />
      </button>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Step 2 — Registrazione azienda (o login rapido)                     */
/* ------------------------------------------------------------------ */

function StepRegistrazione({
  headingRef,
  state,
  set,
  indietro,
  avanti,
}: {
  headingRef: React.RefObject<HTMLHeadingElement | null>;
  state: FunnelState;
  set: (p: Partial<FunnelState>) => void;
  indietro: () => void;
  avanti: () => void;
}) {
  const [mode, setMode] = useState<"registrati" | "accedi">("registrati");
  const [form, setForm] = useState<Azienda>(state.azienda);
  const [password, setPassword] = useState("");
  const [errori, setErrori] = useState<Record<string, string>>({});
  const [invio, setInvio] = useState(false);
  const [erroreServer, setErroreServer] = useState<string | null>(null);

  const campo = (k: keyof Azienda) => ({
    value: form[k],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value })),
    "aria-invalid": errori[k] ? true : undefined,
    "aria-describedby": errori[k] ? `err-${k}` : undefined,
  });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErroreServer(null);
    const errs: Record<string, string> = {};
    if (mode === "registrati" && form.ragioneSociale.trim().length < 2) {
      errs.ragioneSociale = "Inserisci la ragione sociale dell'impresa.";
    }
    if (mode === "registrati" && !validaPartitaIva(form.piva)) {
      errs.piva =
        "Partita IVA non valida: servono 11 cifre e un codice di controllo corretto.";
    }
    if (!/^\S+@\S+\.\S+$/.test(form.email)) {
      errs.email = "Inserisci un indirizzo email valido.";
    }
    if (mode === "registrati" ? !passwordValida(password) : password.length === 0) {
      errs.password =
        mode === "registrati"
          ? "La password non rispetta ancora tutti i requisiti elencati."
          : "Inserisci la password.";
    }
    setErrori(errs);
    if (Object.keys(errs).length > 0) return;

    setInvio(true);
    const supabase = createClient();
    if (mode === "registrati") {
      const { data, error } = await supabase.auth.signUp({
        email: form.email,
        password,
        options: {
          data: {
            ragione_sociale: form.ragioneSociale.trim(),
            partita_iva: form.piva.replace(/\s/g, ""),
          },
        },
      });
      if (error) {
        setInvio(false);
        if (/already|registered|exists/i.test(error.message)) {
          setErroreServer(
            "Questa email ha già un account: usa «Ho già un account» qui sotto per accedere.",
          );
        } else {
          setErroreServer(error.message);
        }
        return;
      }
      // Fase 1: l'impresa nasce a database (organizations + profiles).
      try {
        const r = await fetch("/api/funnel/registrazione", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: data.user?.id,
            ragioneSociale: form.ragioneSociale.trim(),
            piva: form.piva.replace(/\s/g, ""),
            sitoWeb: form.sitoWeb.trim(),
            dimensione: state.dimensione,
          }),
        });
        if (!r.ok) {
          const j = (await r.json().catch(() => ({}))) as { error?: string };
          setInvio(false);
          setErroreServer(
            j.error ?? "Registrazione impresa non riuscita, riprova.",
          );
          return;
        }
      } catch {
        setInvio(false);
        setErroreServer("Rete non raggiungibile: riprova tra poco.");
        return;
      }
      setInvio(false);
      set({
        azienda: form,
        registrato: true,
        userId: data.user?.id,
        emailDaConfermare: !data.session,
      });
      avanti();
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email: form.email,
        password,
      });
      setInvio(false);
      if (error) {
        setErroreServer(
          "Accesso non riuscito: controlla email e password. Se accedi di solito col link via email, puoi continuare a usarlo dalla pagina di accesso.",
        );
        return;
      }
      set({ azienda: { ...state.azienda, email: form.email }, registrato: true });
      avanti();
    }
  }

  if (state.registrato) {
    return (
      <section aria-labelledby="step2-h">
        <h2
          id="step2-h"
          ref={headingRef}
          tabIndex={-1}
          className="font-display text-2xl text-ink outline-none"
        >
          Account pronto
        </h2>
        <p className="mt-2 flex items-start gap-2 text-sm text-gray-warm">
          <CheckCircle2 size={17} className="mt-0.5 shrink-0 text-mint" />
          Sei registrato come{" "}
          <strong className="font-medium text-ink">{state.azienda.email}</strong>
        </p>
        <div className="mt-6 flex gap-2">
          <button
            type="button"
            onClick={indietro}
            className="rounded-lg border border-line px-4 py-2.5 text-sm text-gray-warm"
          >
            Indietro
          </button>
          <button
            type="button"
            onClick={avanti}
            className="inline-flex items-center gap-1.5 rounded-lg bg-pine px-5 py-2.5 text-sm font-medium text-white"
          >
            Continua <ArrowRight size={15} />
          </button>
        </div>
      </section>
    );
  }

  const input =
    "w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm outline-none focus:border-mint aria-[invalid]:border-amber-ink";

  return (
    <section aria-labelledby="step2-h">
      <h2
        id="step2-h"
        ref={headingRef}
        tabIndex={-1}
        className="font-display text-2xl text-ink outline-none"
      >
        {mode === "registrati" ? "Registra la tua azienda" : "Accedi al tuo account"}
      </h2>
      <p className="mt-1 text-sm text-gray-warm">
        {mode === "registrati"
          ? "Creiamo l'account della tua impresa: email e password. Il link via email resta disponibile per gli accessi successivi."
          : "Bentornato: entra con email e password per continuare l'acquisto."}
      </p>

      <form onSubmit={submit} noValidate className="mt-5 max-w-md space-y-4">
        {erroreServer && (
          <p
            role="alert"
            className="rounded-lg border border-amber-ink/30 bg-amber-soft px-3 py-2.5 text-sm text-amber-ink"
          >
            {erroreServer}
          </p>
        )}

        {mode === "registrati" && (
          <>
            <div>
              <label
                htmlFor="ragione-sociale"
                className="mb-1 block text-sm font-medium text-ink"
              >
                Ragione sociale
              </label>
              <input
                id="ragione-sociale"
                autoComplete="organization"
                className={input}
                placeholder="Es. Meccanica Toscana S.r.l."
                {...campo("ragioneSociale")}
              />
              {errori.ragioneSociale && (
                <p id="err-ragioneSociale" className="mt-1 text-xs text-amber-ink">
                  {errori.ragioneSociale}
                </p>
              )}
            </div>
            <div>
              <label
                htmlFor="piva"
                className="mb-1 block text-sm font-medium text-ink"
              >
                Partita IVA
              </label>
              <input
                id="piva"
                inputMode="numeric"
                autoComplete="off"
                className={input}
                placeholder="11 cifre"
                {...campo("piva")}
              />
              {errori.piva && (
                <p id="err-piva" className="mt-1 text-xs text-amber-ink">
                  {errori.piva}
                </p>
              )}
            </div>
          </>
        )}

        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium text-ink">
            Email aziendale
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            className={input}
            placeholder="nome@azienda.it"
            {...campo("email")}
          />
          {errori.email && (
            <p id="err-email" className="mt-1 text-xs text-amber-ink">
              {errori.email}
            </p>
          )}
        </div>

        {mode === "registrati" && (
          <div>
            <label
              htmlFor="sitoWeb"
              className="mb-1 block text-sm font-medium text-ink"
            >
              Sito dell&apos;impresa{" "}
              <span className="font-normal text-gray-light">(facoltativo)</span>
            </label>
            <input
              id="sitoWeb"
              type="text"
              autoComplete="url"
              className={input}
              placeholder="www.latuaimpresa.it"
              {...campo("sitoWeb")}
            />
            <p className="mt-1 text-xs leading-relaxed text-gray-light">
              Se ce l&apos;hai, il Motore ne ricava le parti descrittive dei
              tuoi documenti — attività, prodotti, sedi, certificazioni esposte
              — citando sempre la pagina. Puoi aggiungerlo anche dopo.
            </p>
          </div>
        )}

        <div>
          <label
            htmlFor="password"
            className="mb-1 block text-sm font-medium text-ink"
          >
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete={mode === "registrati" ? "new-password" : "current-password"}
            className={input}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-invalid={errori.password ? true : undefined}
            aria-describedby={
              mode === "registrati" ? "password-regole" : errori.password ? "err-password" : undefined
            }
          />
          {mode === "registrati" && (
            <ul id="password-regole" className="mt-2 space-y-0.5">
              {PASSWORD_REGOLE.map((r) => {
                const ok = r.test(password);
                return (
                  <li
                    key={r.label}
                    className={
                      "flex items-center gap-1.5 text-xs " +
                      (ok ? "text-mint" : "text-gray-warm")
                    }
                  >
                    <Check size={12} className={ok ? "" : "opacity-30"} />
                    {r.label}
                  </li>
                );
              })}
            </ul>
          )}
          {errori.password && (
            <p id="err-password" className="mt-1 text-xs text-amber-ink">
              {errori.password}
            </p>
          )}
        </div>

        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={indietro}
            className="rounded-lg border border-line px-4 py-2.5 text-sm text-gray-warm"
          >
            Indietro
          </button>
          <button
            type="submit"
            disabled={invio}
            className="inline-flex items-center gap-1.5 rounded-lg bg-pine px-5 py-2.5 text-sm font-medium text-white disabled:opacity-60"
          >
            {invio
              ? "Un istante…"
              : mode === "registrati"
                ? "Crea account e continua"
                : "Accedi e continua"}
            {!invio && <ArrowRight size={15} />}
          </button>
        </div>
      </form>

      <button
        type="button"
        onClick={() => {
          setMode((m) => (m === "registrati" ? "accedi" : "registrati"));
          setErrori({});
          setErroreServer(null);
        }}
        className="mt-4 text-sm font-medium text-pine hover:underline"
      >
        {mode === "registrati"
          ? "Ho già un account: accedi"
          : "Non hai un account? Registra la tua azienda"}
      </button>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Step 3 — Consensi                                                   */
/* ------------------------------------------------------------------ */

function StepConsensi({
  headingRef,
  state,
  set,
  indietro,
  avanti,
}: {
  headingRef: React.RefObject<HTMLHeadingElement | null>;
  state: FunnelState;
  set: (p: Partial<FunnelState>) => void;
  indietro: () => void;
  avanti: () => void;
}) {
  const [errore, setErrore] = useState(false);
  const c = state.consensi;

  function continua() {
    if (!c.tos || !c.bancheDati) {
      setErrore(true);
      return;
    }
    set({ consensi: { ...c, acceptedAt: new Date().toISOString() } });
    avanti();
  }

  const box =
    "flex items-start gap-3 rounded-xl border border-line bg-white p-4 text-sm";

  return (
    <section aria-labelledby="step3-h">
      <h2
        id="step3-h"
        ref={headingRef}
        tabIndex={-1}
        className="font-display text-2xl text-ink outline-none"
      >
        Consensi
      </h2>
      <p className="mt-1 text-sm text-gray-warm">
        Due spunte distinte, entrambe necessarie. Nessuna è pre-selezionata.
      </p>

      <div className="mt-5 max-w-2xl space-y-3">
        <label className={box}>
          <input
            type="checkbox"
            checked={c.tos}
            onChange={(e) => {
              set({ consensi: { ...c, tos: e.target.checked } });
              setErrore(false);
            }}
            className="mt-0.5 h-4 w-4 accent-[#0E5238]"
          />
          <span className="text-gray-warm">
            Ho letto e accetto le{" "}
            <Link
              href="/termini"
              target="_blank"
              className="font-medium text-pine underline"
            >
              condizioni di servizio
            </Link>{" "}
            e l&apos;informativa privacy.
          </span>
        </label>

        <label className={box}>
          <input
            type="checkbox"
            checked={c.bancheDati}
            onChange={(e) => {
              set({ consensi: { ...c, bancheDati: e.target.checked } });
              setErrore(false);
            }}
            className="mt-0.5 h-4 w-4 accent-[#0E5238]"
          />
          <span className="text-gray-warm">
            <strong className="font-medium text-ink">
              Autorizzo espressamente Verzero
            </strong>{" "}
            ad accedere in nome e per conto della mia azienda alle banche dati
            ufficiali — Registro Imprese e Camere di Commercio, provider di
            dati camerali, Cerved e assimilati, catasti e fonti energetiche —
            al solo fine di reperire le informazioni necessarie a erogare i
            servizi acquistati (anagrafica, ATECO, addetti, dati economici e
            consumi). L&apos;autorizzazione è revocabile in ogni momento
            dal tuo ecosistema: alla revoca la piattaforma continua a
            funzionare con inserimento manuale dei dati.
          </span>
        </label>

        {errore && (
          <p
            role="alert"
            className="rounded-lg border border-amber-ink/30 bg-amber-soft px-3 py-2.5 text-sm text-amber-ink"
          >
            Per proseguire servono entrambe le spunte: l&apos;accettazione delle
            condizioni e l&apos;autorizzazione alle banche dati. Senza
            quest&apos;ultima non potremmo reperire i dati della tua azienda.
          </p>
        )}

        <p className="text-xs text-gray-light">
          Il consenso viene registrato con data e ora. Formulazione legale in
          revisione con il legale prima del lancio.
        </p>
      </div>

      <div className="mt-6 flex gap-2">
        <button
          type="button"
          onClick={indietro}
          className="rounded-lg border border-line px-4 py-2.5 text-sm text-gray-warm"
        >
          Indietro
        </button>
        <button
          type="button"
          onClick={continua}
          className="inline-flex items-center gap-1.5 rounded-lg bg-pine px-5 py-2.5 text-sm font-medium text-white"
        >
          Continua <ArrowRight size={15} />
        </button>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Step 4 — Pagamento (provider disattivato, trasparente)              */
/* ------------------------------------------------------------------ */

function StepPagamento({
  headingRef,
  slug,
  state,
  set,
  indietro,
  completa,
}: {
  headingRef: React.RefObject<HTMLHeadingElement | null>;
  slug: string;
  nome: string;
  state: FunnelState;
  set: (p: Partial<FunnelState>) => void;
  indietro: () => void;
  /** Salva l'ordine a database; restituisce un messaggio d'errore o null. */
  completa: () => Promise<string | null>;
}) {
  const [metodo, setMetodo] = useState<"carta" | "sepa">("carta");
  const [invio, setInvio] = useState(false);
  const [errore, setErrore] = useState<string | null>(null);
  const p = prezzoDettaglio(slug, state.dimensione);
  const unaTantum = prezzoUnaTantum(slug, state.dimensione);

  async function onCompleta() {
    setInvio(true);
    setErrore(null);
    const err = await completa();
    setInvio(false);
    if (err) setErrore(err);
  }

  return (
    <section aria-labelledby="step4-h">
      <h2
        id="step4-h"
        ref={headingRef}
        tabIndex={-1}
        className="font-display text-2xl text-ink outline-none"
      >
        Pagamento
      </h2>

      {unaTantum !== null ? (
        <p className="mt-5 max-w-md rounded-lg border border-line bg-paper px-4 py-3 text-sm text-gray-warm">
          Importo dell&apos;intervento:{" "}
          <strong className="font-semibold tabular-nums text-pine">
            {eur(unaTantum)} €
          </strong>{" "}
          una tantum, IVA esclusa. Nessun canone e nessun rinnovo.
        </p>
      ) : (
        <fieldset className="mt-5 max-w-md">
          <legend className="text-sm font-medium text-ink">Formula</legend>
          <div className="mt-2 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
            {FORMULE.map((f) => {
              const selected = f === state.formula;
              return (
                <button
                  key={f}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => set({ formula: f })}
                  className={
                    "rounded-lg border px-3 py-2.5 text-left transition-all " +
                    (selected
                      ? "border-pine bg-moss shadow-soft"
                      : "border-line bg-white hover:border-pine/40")
                  }
                >
                  <span
                    className={
                      "block text-sm font-semibold " +
                      (selected ? "text-pine-dark" : "text-ink")
                    }
                  >
                    {f === "mensile"
                      ? p
                        ? `${eur(p.mensile)} €/mese`
                        : "Mensile"
                      : p
                        ? `${eur(p.annuale)} €/anno`
                        : "Annuale"}
                  </span>
                  <span className="block text-xs text-gray-warm">
                    {f === "mensile"
                      ? "impegno minimo 12 mesi"
                      : p
                        ? `unica soluzione · −10% · risparmi ${eur(p.risparmio)} €`
                        : "unica soluzione · −10% applicato"}
                  </span>
                </button>
              );
            })}
          </div>
        </fieldset>
      )}

      <fieldset className="mt-6 max-w-md">
        <legend className="text-sm font-medium text-ink">
          Metodo di pagamento
        </legend>
        <div className="mt-2 space-y-1.5">
          {(
            [
              { id: "carta", label: "Carta di credito o debito", icon: CreditCard },
              { id: "sepa", label: "Addebito SEPA / bonifico", icon: Landmark },
            ] as const
          ).map((m) => {
            const selected = metodo === m.id;
            const Icon = m.icon;
            return (
              <button
                key={m.id}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => setMetodo(m.id)}
                className={
                  "flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-all " +
                  (selected
                    ? "border-pine bg-moss shadow-soft"
                    : "border-line bg-white hover:border-pine/40")
                }
              >
                <Icon size={17} className="shrink-0 text-pine" />
                <span
                  className={
                    "text-sm " +
                    (selected ? "font-semibold text-pine-dark" : "text-ink")
                  }
                >
                  {m.label}
                </span>
              </button>
            );
          })}
        </div>

        <p
          role="status"
          className="mt-3 flex items-start gap-2 rounded-lg border border-amber-ink/30 bg-amber-soft px-3 py-2.5 text-sm text-amber-ink"
        >
          <Info size={16} className="mt-0.5 shrink-0" />
          I pagamenti si attivano a breve: completa l&apos;ordine senza alcun
          addebito e ti ricontattiamo noi per l&apos;attivazione.
        </p>
      </fieldset>

      {errore && (
        <p
          role="alert"
          className="mt-4 max-w-md rounded-lg border border-amber-ink/30 bg-amber-soft px-3 py-2.5 text-sm text-amber-ink"
        >
          {errore}
        </p>
      )}

      <div className="mt-6 flex gap-2">
        <button
          type="button"
          onClick={indietro}
          className="rounded-lg border border-line px-4 py-2.5 text-sm text-gray-warm"
        >
          Indietro
        </button>
        <button
          type="button"
          onClick={onCompleta}
          disabled={invio}
          className="inline-flex items-center gap-1.5 rounded-lg bg-pine px-5 py-2.5 text-sm font-medium text-white transition-all hover:-translate-y-0.5 hover:shadow-soft disabled:opacity-60"
        >
          {invio ? "Salvataggio…" : "Completa l'ordine (senza pagamento)"}
          {!invio && <ArrowRight size={15} />}
        </button>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Step 5 — Conferma                                                   */
/* ------------------------------------------------------------------ */

function StepConferma({
  headingRef,
  nome,
  short,
  state,
}: {
  headingRef: React.RefObject<HTMLHeadingElement | null>;
  nome: string;
  short: string;
  state: FunnelState;
}) {
  return (
    <section aria-labelledby="step5-h" className="mx-auto max-w-xl text-center">
      <CheckCircle2 size={44} className="mx-auto text-mint" />
      <h2
        id="step5-h"
        ref={headingRef}
        tabIndex={-1}
        className="mt-4 font-display text-3xl text-ink outline-none md:text-4xl"
      >
        Ordine confermato
      </h2>
      <p className="mt-3 text-sm text-gray-warm">
        <strong className="font-medium text-ink">{nome}</strong> — {short}
      </p>
      <p className="mt-2 inline-flex items-center gap-2 rounded-full bg-amber-soft px-3.5 py-1.5 text-xs font-medium text-amber-ink">
        Stato: in attivazione
      </p>
      <p className="mx-auto mt-4 max-w-md text-sm text-gray-warm">
        Nessun addebito è stato effettuato: ti ricontattiamo per l&apos;attivazione
        del pagamento. Intanto il tuo ecosistema è già pronto.
      </p>
      {state.emailDaConfermare && (
        <p
          role="status"
          className="mx-auto mt-3 max-w-md rounded-lg border border-line bg-paper px-3 py-2.5 text-xs text-gray-warm"
        >
          Ti abbiamo inviato una email di conferma: aprila per attivare
          l&apos;accesso al tuo ecosistema.
        </p>
      )}
      <div className="mt-7">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 rounded-lg bg-pine px-5 py-2.5 text-sm font-medium text-white transition-all hover:-translate-y-0.5 hover:shadow-soft"
        >
          Vai al tuo ecosistema <ArrowRight size={15} />
        </Link>
      </div>
    </section>
  );
}
