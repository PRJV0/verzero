"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, CheckCircle2, Eye, ImageUp, Loader2, Palette, Trash2, XCircle } from "lucide-react";

import { rapportoLeggibile } from "@/lib/contrasto";
import {
  COLORI_NEUTRI,
  FORMATI_LOGO,
  MAX_BYTE_LOGO,
  verificaColore,
  type TonoMessaggio,
} from "@/lib/elaborato/veste";

const MEGA_LOGO = Math.round(MAX_BYTE_LOGO / (1024 * 1024));

import { caricaLogoAzione, rimuoviLogoAzione, salvaVesteAzione } from "./azioni-veste";

/**
 * LA VESTE DEI DOCUMENTI — logo, colore, contatti, e l'anteprima.
 *
 * Il colore si giudica MENTRE lo si sceglie, con la stessa funzione che lo
 * applicherà al documento (`verificaColore`): chi sceglie un verde chiaro
 * vede subito che per i titoli non basta, e dove lo useremo invece.
 * Il logo si giudica al caricamento, sul server, e i messaggi dicono che
 * cosa va bene e che cosa no — senza gergo: «in stampa non si vedrebbe»,
 * non «contrasto insufficiente sul canale alfa».
 */

type Messaggio = { tono: TonoMessaggio; testo: string };

const ICONA: Record<TonoMessaggio, typeof CheckCircle2> = {
  ok: CheckCircle2,
  avviso: AlertTriangle,
  blocco: XCircle,
};
const TONO: Record<TonoMessaggio, string> = {
  ok: "text-mint",
  avviso: "text-amber-ink",
  blocco: "text-amber-ink",
};

export function VesteDocumenti({
  iniziali,
  logoUrl,
  esitoLogo,
  disponibile,
  anteprimaHref,
  solaLettura,
}: {
  iniziali: { colore: string | null; nome: string | null; indirizzo: string | null; sito: string | null; contatto: string | null };
  logoUrl: string | null;
  esitoLogo: Messaggio[] | null;
  disponibile: boolean;
  anteprimaHref: string | null;
  solaLettura: boolean;
}) {
  const router = useRouter();
  const [colore, setColore] = useState(iniziali.colore ?? "");
  const [salvando, salva] = useTransition();
  const [caricando, carica] = useTransition();
  const [esitoSalvataggio, setEsitoSalvataggio] = useState<{ ok: boolean; testo: string } | null>(null);
  const [messaggiLogo, setMessaggiLogo] = useState<Messaggio[] | null>(esitoLogo);
  const [erroreLogo, setErroreLogo] = useState<string | null>(null);

  const verifica = useMemo(() => verificaColore(colore || null), [colore]);
  const campione = verifica.colori;

  function inviaVeste(form: FormData) {
    setEsitoSalvataggio(null);
    salva(async () => {
      const r = await salvaVesteAzione(form);
      setEsitoSalvataggio(
        r.ok
          ? { ok: true, testo: r.avvisi.length ? `Salvato. ${r.avvisi.join(" ")}` : "Salvato: i prossimi documenti usano questa veste." }
          : { ok: false, testo: r.errore },
      );
      if (r.ok) router.refresh();
    });
  }

  function inviaLogo(form: FormData) {
    setErroreLogo(null);
    // Un file oltre il limite si ferma qui: arrivato al server verrebbe
    // troncato dalla piattaforma, con un errore che non dice perché.
    const file = form.get("logo");
    if (file instanceof File && file.size > MAX_BYTE_LOGO) {
      setMessaggiLogo(null);
      setErroreLogo(`Il file supera i ${MEGA_LOGO} MB: per un logo basta molto meno, prova a esportarlo di nuovo.`);
      return;
    }
    carica(async () => {
      const r = await caricaLogoAzione(form);
      setMessaggiLogo(r.messaggi ?? null);
      if (!r.ok) setErroreLogo(r.errore);
      else router.refresh();
    });
  }

  return (
    <section className="rounded-2xl border border-line bg-white p-5">
      <h2 className="flex items-center gap-2 text-sm font-semibold text-ink">
        <Palette size={15} className="text-pine" /> Veste dei documenti
      </h2>
      <p className="mt-1 text-xs leading-relaxed text-gray-warm">
        Il tuo logo, il tuo colore e i tuoi contatti su copertina, intestazioni e piè di pagina di tutti i documenti
        generati. Se non imposti nulla i documenti escono in una veste neutra, comunque completa.
      </p>
      {!disponibile && (
        <p className="mt-3 rounded-lg bg-paper px-3 py-2 text-xs text-gray-warm">
          La veste dei documenti non è ancora attiva su questo ambiente: puoi già provare il colore qui sotto.
        </p>
      )}

      <div className="mt-4 grid gap-5 lg:grid-cols-2">
        {/* Il logo */}
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-light">Logo</p>
          <div className="mt-2 flex h-24 items-center justify-center rounded-lg border border-line bg-[#F2F1EC] p-3">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt="Il logo usato nei documenti" className="max-h-16 max-w-full object-contain" />
            ) : (
              <p className="text-xs text-gray-warm">Nessun logo: in copertina compare il nome dell&apos;impresa.</p>
            )}
          </div>
          {!solaLettura && (
            <form action={inviaLogo} className="mt-2 flex flex-wrap items-center gap-2">
              <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-xs font-medium text-pine hover:border-pine/40">
                <ImageUp size={14} /> Scegli il file
                <input
                  type="file"
                  name="logo"
                  accept={FORMATI_LOGO.join(",")}
                  className="sr-only"
                  onChange={(e) => e.currentTarget.form?.requestSubmit()}
                  disabled={caricando}
                />
              </label>
              <span className="text-[11px] text-gray-light">PNG, JPEG o SVG, fino a {MEGA_LOGO} MB</span>
              {caricando && <Loader2 size={14} className="animate-spin text-pine" />}
              {logoUrl && (
                <button
                  type="button"
                  onClick={() => carica(async () => { await rimuoviLogoAzione(); setMessaggiLogo(null); router.refresh(); })}
                  className="inline-flex items-center gap-1 text-[11px] text-gray-warm hover:text-amber-ink"
                >
                  <Trash2 size={12} /> Togli il logo
                </button>
              )}
            </form>
          )}
          {erroreLogo && <p className="mt-2 text-xs font-semibold text-amber-ink">{erroreLogo}</p>}
          {messaggiLogo && messaggiLogo.length > 0 && (
            <ul className="mt-2 space-y-1">
              {messaggiLogo.map((m) => {
                const Icona = ICONA[m.tono];
                return (
                  <li key={m.testo} className={`flex items-start gap-1.5 text-xs leading-snug ${TONO[m.tono]}`}>
                    <Icona size={13} className="mt-0.5 shrink-0" />
                    <span className="text-ink">{m.testo}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Il colore e i contatti */}
        <form action={inviaVeste} className="space-y-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-light">Colore d&apos;accento</p>
            <div className="mt-2 flex items-center gap-2">
              <input
                type="color"
                aria-label="Scegli il colore"
                value={verifica.scelto ?? COLORI_NEUTRI.accento}
                onChange={(e) => setColore(e.target.value.toUpperCase())}
                disabled={solaLettura}
                className="h-9 w-12 cursor-pointer rounded border border-line bg-white"
              />
              <input
                name="colore"
                value={colore}
                onChange={(e) => setColore(e.target.value)}
                placeholder="nessuno: veste neutra"
                disabled={solaLettura}
                className="w-40 rounded-lg border border-line bg-paper px-3 py-1.5 font-mono text-sm text-ink"
              />
            </div>
            {/* Il campione è la resa vera: fascia, titolo e filetto coi ruoli decisi dalla verifica. */}
            <div className="mt-2 overflow-hidden rounded-lg border border-line bg-[#F2F1EC]">
              <div className="h-1.5" style={{ background: campione.campitura }} />
              <div className="px-3 py-2">
                <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: campione.accentoTesto }}>
                  Sezione 1
                </p>
                <p className="text-sm font-semibold" style={{ color: campione.inchiostro }}>
                  Titolo di una sezione
                </p>
                <div className="mt-1.5 h-px" style={{ background: campione.accentoSegno }} />
              </div>
            </div>
            {verifica.misure && (
              <p className="mt-1.5 text-[11px] text-gray-warm">
                Contrasto sulla carta: {rapportoLeggibile(verifica.misure.carta)} — usato per{" "}
                {verifica.usatoPer.length > 0
                  ? verifica.usatoPer.map((u) => ({ testo: "titoli", segno: "filetti", campitura: "fasce e grafici" })[u]).join(", ")
                  : "niente"}
                .
              </p>
            )}
            {verifica.avvisi.map((a) => (
              <p key={a} className="mt-1 text-xs leading-snug text-amber-ink">{a}</p>
            ))}
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            {[
              { name: "nome", etichetta: "Nome in intestazione", valore: iniziali.nome, segnaposto: "la ragione sociale" },
              { name: "indirizzo", etichetta: "Indirizzo", valore: iniziali.indirizzo, segnaposto: "via, CAP, comune" },
              { name: "sito", etichetta: "Sito", valore: iniziali.sito, segnaposto: "www…" },
              { name: "contatto", etichetta: "Contatto", valore: iniziali.contatto, segnaposto: "email o telefono" },
            ].map((c) => (
              <label key={c.name} className="block">
                <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-light">{c.etichetta}</span>
                <input
                  name={c.name}
                  defaultValue={c.valore ?? ""}
                  placeholder={c.segnaposto}
                  disabled={solaLettura}
                  className="mt-1 w-full rounded-lg border border-line bg-paper px-3 py-1.5 text-sm text-ink"
                />
              </label>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {!solaLettura && (
              <button
                type="submit"
                disabled={salvando}
                className="inline-flex items-center gap-1.5 rounded-lg bg-pine px-3 py-1.5 text-xs font-semibold text-white hover:bg-pine-dark disabled:opacity-60"
              >
                {salvando && <Loader2 size={13} className="animate-spin" />} Salva la veste
              </button>
            )}
            {anteprimaHref && (
              <a
                href={anteprimaHref}
                target="_blank"
                rel="noopener"
                className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-xs font-medium text-pine hover:border-pine/40"
              >
                <Eye size={13} /> Anteprima su un tuo documento
              </a>
            )}
          </div>
          {esitoSalvataggio && (
            <p className={`text-xs ${esitoSalvataggio.ok ? "text-mint" : "font-semibold text-amber-ink"}`}>{esitoSalvataggio.testo}</p>
          )}
        </form>
      </div>
    </section>
  );
}
