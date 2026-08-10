"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight, Check, CircleAlert } from "lucide-react";

import {
  LIMITI,
  OGGETTI,
  PROMESSA_RISPOSTA,
  validaContatto,
  type CampoContatto,
  type DatiContatto,
} from "@/lib/contatti";

/** Messaggio d'errore sotto il campo, collegato via aria-describedby. */
function CampoErrore({ campo, testo }: { campo: string; testo?: string }) {
  if (!testo) return null;
  return (
    <p
      id={`errore-${campo}`}
      className="mt-1 flex items-start gap-1.5 text-xs text-amber-ink"
    >
      <CircleAlert size={13} className="mt-0.5 shrink-0" />
      {testo}
    </p>
  );
}

/**
 * Modulo di contatto. Le validazioni sono le stesse del server
 * (src/lib/contatti.ts) e compaiono sotto il campo, legate all'input con
 * aria-describedby: un errore che il lettore di schermo non annuncia è un
 * errore che non esiste per chi non vede.
 */
export function ModuloContatto() {
  const [dati, setDati] = useState<DatiContatto>({
    nome: "",
    azienda: "",
    email: "",
    oggetto: "",
    messaggio: "",
  });
  const [errori, setErrori] = useState<Partial<Record<CampoContatto, string>>>(
    {},
  );
  const [inviato, setInviato] = useState(false);
  const [invio, setInvio] = useState(false);
  const [erroreGenerale, setErroreGenerale] = useState<string | null>(null);
  /** Campo trappola e istante di apertura: difese anti-bot, invisibili.
   *  L'istante si prende dopo il montaggio: leggere l'orologio durante il
   *  render renderebbe il render impuro. */
  const trappola = useRef("");
  const apertoIl = useRef(0);
  useEffect(() => {
    apertoIl.current = Date.now();
  }, []);

  const set = (campo: keyof DatiContatto, valore: string) => {
    setDati((d) => ({ ...d, [campo]: valore }));
    // L'errore sparisce mentre l'utente corregge, non al prossimo invio.
    if (errori[campo as CampoContatto])
      setErrori((e) => ({ ...e, [campo]: undefined }));
  };

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErroreGenerale(null);
    const trovati = validaContatto(dati);
    if (Object.keys(trovati).length > 0) {
      setErrori(trovati);
      // Porta il focus sul primo campo da correggere.
      const primo = Object.keys(trovati)[0];
      document.getElementById(`campo-${primo}`)?.focus();
      return;
    }

    setInvio(true);
    try {
      const r = await fetch("/api/contatti", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...dati,
          trappola: trappola.current,
          apertoIl: apertoIl.current,
        }),
      });
      const esito = await r.json().catch(() => ({}));
      if (!r.ok) {
        if (esito.errori) setErrori(esito.errori);
        setErroreGenerale(esito.error ?? "Invio non riuscito, riprova.");
        return;
      }
      setInviato(true);
    } catch {
      setErroreGenerale(
        "Invio non riuscito: controlla la connessione e riprova.",
      );
    } finally {
      setInvio(false);
    }
  }

  if (inviato) {
    return (
      <div
        role="status"
        className="rounded-2xl border border-mint/40 bg-moss p-6 text-center"
      >
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-mint/20 text-pine">
          <Check size={24} />
        </span>
        <p className="mt-3 font-display text-2xl text-pine-dark">
          Messaggio ricevuto
        </p>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-pine">
          {PROMESSA_RISPOSTA} Dall&apos;indirizzo che ci hai lasciato riceverai
          una risposta scritta da una persona, non da un sistema automatico.
        </p>
      </div>
    );
  }

  const classeCampo = (campo: CampoContatto) =>
    "w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-ink outline-none transition-colors placeholder:text-gray-light focus:border-pine " +
    (errori[campo] ? "border-amber-ink/60" : "border-line");

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      {/* Campo trappola: fuori dal flusso visivo e dal focus, ignorato dai
          gestori di password. I bot lo compilano, le persone no. */}
      <div aria-hidden className="absolute left-[-9999px] top-auto h-px w-px overflow-hidden">
        <label htmlFor="campo-sito">Non compilare questo campo</label>
        <input
          id="campo-sito"
          name="sito"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          onChange={(e) => (trappola.current = e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="campo-nome"
            className="block text-sm font-medium text-ink"
          >
            Nome e cognome
          </label>
          <input
            id="campo-nome"
            type="text"
            autoComplete="name"
            maxLength={LIMITI.nome.max}
            value={dati.nome}
            onChange={(e) => set("nome", e.target.value)}
            aria-invalid={!!errori.nome}
            aria-describedby={errori.nome ? "errore-nome" : undefined}
            className={"mt-1.5 " + classeCampo("nome")}
            placeholder="Come ti chiami"
          />
          <CampoErrore campo="nome" testo={errori.nome} />
        </div>

        <div>
          <label
            htmlFor="campo-azienda"
            className="block text-sm font-medium text-ink"
          >
            Azienda{" "}
            <span className="font-normal text-gray-light">(facoltativo)</span>
          </label>
          <input
            id="campo-azienda"
            type="text"
            autoComplete="organization"
            maxLength={LIMITI.azienda.max}
            value={dati.azienda}
            onChange={(e) => set("azienda", e.target.value)}
            aria-invalid={!!errori.azienda}
            aria-describedby={errori.azienda ? "errore-azienda" : undefined}
            className={"mt-1.5 " + classeCampo("azienda")}
            placeholder="Ragione sociale"
          />
          <CampoErrore campo="azienda" testo={errori.azienda} />
        </div>
      </div>

      <div>
        <label
          htmlFor="campo-email"
          className="block text-sm font-medium text-ink"
        >
          Email
        </label>
        <input
          id="campo-email"
          type="email"
          autoComplete="email"
          maxLength={LIMITI.email.max}
          value={dati.email}
          onChange={(e) => set("email", e.target.value)}
          aria-invalid={!!errori.email}
          aria-describedby={errori.email ? "errore-email" : undefined}
          className={"mt-1.5 " + classeCampo("email")}
          placeholder="nome@azienda.it"
        />
        <CampoErrore campo="email" testo={errori.email} />
      </div>

      <fieldset>
        <legend className="text-sm font-medium text-ink">
          Di cosa vuoi parlare
        </legend>
        <div
          role="radiogroup"
          aria-invalid={!!errori.oggetto}
          aria-describedby={errori.oggetto ? "errore-oggetto" : undefined}
          className="mt-1.5 grid grid-cols-1 gap-1.5 sm:grid-cols-3"
        >
          {OGGETTI.map((o) => {
            const scelto = dati.oggetto === o.valore;
            return (
              <button
                key={o.valore}
                type="button"
                role="radio"
                aria-checked={scelto}
                onClick={() => set("oggetto", o.valore)}
                className={
                  "rounded-lg border px-3 py-2.5 text-left transition-all " +
                  (scelto
                    ? "border-pine bg-moss shadow-soft"
                    : "border-line bg-white hover:border-pine/40")
                }
              >
                <span
                  className={
                    "block text-sm font-semibold " +
                    (scelto ? "text-pine-dark" : "text-ink")
                  }
                >
                  {o.label}
                </span>
                <span className="mt-0.5 block text-xs leading-relaxed text-gray-warm">
                  {o.aiuto}
                </span>
              </button>
            );
          })}
        </div>
        <CampoErrore campo="oggetto" testo={errori.oggetto} />
      </fieldset>

      <div>
        <label
          htmlFor="campo-messaggio"
          className="block text-sm font-medium text-ink"
        >
          Messaggio
        </label>
        <textarea
          id="campo-messaggio"
          rows={6}
          maxLength={LIMITI.messaggio.max}
          value={dati.messaggio}
          onChange={(e) => set("messaggio", e.target.value)}
          aria-invalid={!!errori.messaggio}
          aria-describedby={
            errori.messaggio ? "errore-messaggio" : "aiuto-messaggio"
          }
          className={"mt-1.5 resize-y " + classeCampo("messaggio")}
          placeholder="Raccontaci la tua situazione: settore, dimensione, cosa ti hanno chiesto e da chi."
        />
        <CampoErrore campo="messaggio" testo={errori.messaggio} />
        {!errori.messaggio && (
          <p id="aiuto-messaggio" className="mt-1 text-xs text-gray-light">
            Più contesto ci dai, più utile sarà la risposta.{" "}
            {dati.messaggio.length}/{LIMITI.messaggio.max}
          </p>
        )}
      </div>

      {erroreGenerale && (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-lg bg-amber-soft px-3 py-2.5 text-sm text-amber-ink"
        >
          <CircleAlert size={15} className="mt-0.5 shrink-0" />
          {erroreGenerale}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-4">
        <button
          type="submit"
          disabled={invio}
          className="inline-flex items-center gap-1.5 rounded-lg bg-pine px-5 py-2.5 text-sm font-medium text-white transition-all hover:-translate-y-0.5 hover:shadow-soft disabled:opacity-60"
        >
          {invio ? "Invio in corso…" : "Invia il messaggio"}
          {!invio && <ArrowRight size={15} />}
        </button>
        <p className="text-xs text-gray-warm">{PROMESSA_RISPOSTA}</p>
      </div>
    </form>
  );
}
