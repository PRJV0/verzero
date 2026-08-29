"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight, Check, CircleAlert } from "lucide-react";

import { EVENTI, traccia } from "@/lib/eventi";
import { OndaParticelle } from "@/components/onda-particelle";
import { PRESET } from "@/lib/onda";
import { TESTI_ATTESA } from "@/lib/attesa";

/**
 * MODULO LISTA D'ATTESA.
 *
 * I testi sono decisi dal fondatore e vanno alla lettera: dicono una
 * cosa scomoda — apriamo a pochi — e la trasformano nella ragione per
 * lasciare il contatto. Non toccarli senza il suo assenso.
 *
 * Difese anti-bot come nel modulo contatti: campo trappola invisibile e
 * tempo minimo di compilazione. L'istante di apertura si legge dopo il
 * montaggio, perché leggere l'orologio durante il render è impuro.
 */


export function ListaAttesa({
  /** Da dove arriva l'iscrizione: serve al fondatore per capire l'interesse. */
  interesse,
  /** In fondo alle pagine servizio la fascia è più contenuta. */
  compatto = false,
}: {
  interesse?: string;
  compatto?: boolean;
}) {
  const [email, setEmail] = useState("");
  const [azienda, setAzienda] = useState("");
  const [stato, setStato] = useState<"idle" | "invio" | "fatto">("idle");
  const [errore, setErrore] = useState<string | null>(null);

  const trappola = useRef("");
  const apertoIl = useRef(0);
  useEffect(() => {
    apertoIl.current = Date.now();
  }, []);

  async function invia(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStato("invio");
    setErrore(null);
    try {
      const risposta = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          azienda,
          interesse,
          trappola: trappola.current,
          apertoIl: apertoIl.current,
        }),
      });
      const esito = (await risposta.json().catch(() => ({}))) as {
        error?: string;
      };
      if (!risposta.ok) {
        setErrore(esito.error ?? "Non siamo riusciti a registrarti: riprova.");
        setStato("idle");
        return;
      }
      traccia(EVENTI.WAITLIST_ISCRITTO, interesse ? { interesse } : {});
      setStato("fatto");
    } catch {
      setErrore("Connessione interrotta: riprova tra un momento.");
      setStato("idle");
    }
  }

  if (stato === "fatto") {
    return (
      <div
        role="status"
        className="flex items-start gap-3 rounded-2xl border-2 border-mint/40 bg-mint/5 px-5 py-5"
      >
        <span
          aria-hidden
          className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-mint/20 text-mint"
        >
          <Check size={17} strokeWidth={3} />
        </span>
        <p className="text-base leading-relaxed text-pine-dark">
          {TESTI_ATTESA.conferma}
        </p>
      </div>
    );
  }

  const campo =
    "w-full rounded-lg border border-line bg-white px-3.5 py-3 text-sm outline-none transition-colors focus:border-mint";

  return (
    <form onSubmit={invia} className={compatto ? "" : "max-w-xl"}>
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="min-w-0 flex-1">
          <label htmlFor={`attesa-email-${interesse ?? "home"}`} className="sr-only">
            La tua email
          </label>
          <input
            id={`attesa-email-${interesse ?? "home"}`}
            type="email"
            required
            autoComplete="email"
            placeholder="La tua email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={campo}
          />
        </div>
        <div className="min-w-0 flex-1">
          <label
            htmlFor={`attesa-azienda-${interesse ?? "home"}`}
            className="sr-only"
          >
            La tua azienda
          </label>
          <input
            id={`attesa-azienda-${interesse ?? "home"}`}
            type="text"
            autoComplete="organization"
            placeholder="La tua azienda"
            value={azienda}
            onChange={(e) => setAzienda(e.target.value)}
            className={campo}
          />
        </div>
        <button
          type="submit"
          disabled={stato === "invio"}
          className="vz-press inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg bg-pine px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
        >
          {stato === "invio" ? "Un istante…" : TESTI_ATTESA.pulsante}
          {stato !== "invio" && <ArrowRight size={15} />}
        </button>
      </div>

      {/* Campo trappola: nessun umano lo vede, nessun umano lo compila. */}
      <input
        type="text"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden
        onChange={(e) => {
          trappola.current = e.target.value;
        }}
        className="absolute left-[-9999px] h-0 w-0 opacity-0"
      />

      {errore && (
        <p
          role="alert"
          className="mt-2.5 flex items-start gap-2 text-sm text-amber-ink"
        >
          <CircleAlert size={15} className="mt-0.5 shrink-0" />
          {errore}
        </p>
      )}
    </form>
  );
}

/** La fascia completa, con titolo e testo: per la home e le schede servizio. */
export function FasciaListaAttesa({
  interesse,
  scuro = false,
}: {
  interesse?: string;
  scuro?: boolean;
}) {
  return (
    <section
      aria-labelledby={`attesa-h-${interesse ?? "home"}`}
      className={
        scuro
          ? "relative isolate overflow-hidden bg-pine-deep px-5 py-16 md:py-20"
          : "relative isolate overflow-hidden border-t border-line bg-paper px-5 py-14"
      }
    >
      {/* L'onda chiude la home sotto il modulo. Qui c'è un form, quindi
          sta al minimo: la regola è che dove si legge o si scrive un
          fondale non compete mai. */}
      <OndaParticelle
        config={scuro ? PRESET.tenueScura : PRESET.tenue}
        className="-z-10"
      />
      {scuro && (
        <span
          aria-hidden
          className="pointer-events-none absolute -right-10 -top-16 select-none font-display text-[18rem] leading-none text-white/[0.04]"
        >
          0
        </span>
      )}
      <div className="relative mx-auto max-w-3xl">
        <h2
          id={`attesa-h-${interesse ?? "home"}`}
          className={
            "font-display text-3xl leading-tight md:text-4xl " +
            (scuro ? "text-white" : "text-ink")
          }
        >
          {TESTI_ATTESA.titolo}
        </h2>
        <p
          className={
            "mt-3 max-w-2xl text-base leading-relaxed " +
            (scuro ? "text-moss" : "text-gray-warm")
          }
        >
          {TESTI_ATTESA.testo}
        </p>
        <div className="mt-6">
          <ListaAttesa interesse={interesse} />
        </div>
      </div>
    </section>
  );
}
