import { Building2, Gavel, Handshake, Landmark, ShieldCheck, Users } from "lucide-react";

import { FAMIGLIE } from "@/lib/catalog";

/**
 * CHI TI VALUTA, E COSA RISPONDE OGNI FAMIGLIA.
 *
 * La pagina si apriva sul catalogo, cioè sulla risposta prima della
 * domanda. Chi arriva qui non sta cercando un elenco: sta cercando di
 * capire se questa roba serve al suo problema, e il suo problema ha
 * quasi sempre un nome e un cognome — la banca, il capofiliera, la
 * stazione appaltante, il cliente, l'organismo che verrà a fare l'audit.
 *
 * Lo schema dice quella cosa lì in tre secondi: al centro l'impresa,
 * sopra chi le chiede qualcosa, sotto le tre famiglie come risposte.
 * Poche parole, molta struttura.
 *
 * FORMA. Tre piani impilati, non una raggiera: una disposizione radiale
 * su schermo stretto diventa illeggibile o va riscritta due volte, e qui
 * la gerarchia (chi chiede → chi risponde) è già verticale per natura.
 * Il collegamento è un filo con la punta, disegnato in CSS: nessuna
 * immagine, nessun testo dentro una grafica.
 *
 * ACCESSIBILITÀ: è contenuto, non decorazione. Sono elenchi veri con
 * un'intestazione ciascuno; le icone sono `aria-hidden` perché ripetono
 * la parola che hanno accanto.
 */

const CHI_VALUTA = [
  { icona: Landmark, nome: "La banca", cosa: "per il credito" },
  { icona: Handshake, nome: "Il capofiliera", cosa: "per restare fornitore" },
  { icona: Gavel, nome: "La stazione appaltante", cosa: "per i bandi" },
  { icona: Users, nome: "Il cliente finale", cosa: "per fidarsi" },
  { icona: ShieldCheck, nome: "L'organismo", cosa: "per certificare" },
];

/** Il filo che collega un piano al successivo, con la punta in fondo. */
function Filo() {
  return (
    <span aria-hidden className="mx-auto flex h-8 w-4 flex-col items-center">
      <span className="w-px flex-1 bg-pine/25" />
      <span className="-mt-px h-1.5 w-1.5 rotate-45 border-b border-r border-pine/40" />
    </span>
  );
}

export function SchemaQualifica() {
  return (
    <section
      aria-labelledby="schema-qualifica"
      className="rounded-3xl border border-line bg-white p-5 shadow-soft sm:p-7"
    >
      <h2
        id="schema-qualifica"
        className="text-center font-display text-2xl leading-tight text-ink sm:text-3xl"
      >
        Qualcuno ti chiede una prova, un percorso Verzero la produce.
      </h2>

      {/* Piano 1 — chi chiede.
          Le etichette erano occhielli in maiuscoletto: leggibili come
          categorie, non come frasi. Chi arriva qui non deve decifrare
          un'intestazione, deve capire una situazione. */}
      <p className="mt-6 text-center text-sm font-semibold text-ink">
        Banche, committenti, bandi e clienti chiedono prove
      </p>
      <ul className="mt-3 flex flex-wrap justify-center gap-2">
        {CHI_VALUTA.map(({ icona: Icona, nome, cosa }) => (
          <li
            key={nome}
            className="flex items-center gap-2 rounded-full border border-line bg-paper px-3 py-1.5"
          >
            <Icona size={14} aria-hidden className="shrink-0 text-pine" />
            <span className="text-xs font-semibold text-ink">{nome}</span>
            <span className="text-xs text-gray-warm">{cosa}</span>
          </li>
        ))}
      </ul>

      <Filo />

      {/* Piano 2 — l'impresa, al centro. */}
      <div className="mx-auto flex max-w-sm items-center justify-center gap-3 rounded-2xl bg-pine-deep px-5 py-4 text-white">
        <Building2 size={20} aria-hidden className="shrink-0 text-mint-bright" />
        <p className="font-display text-xl leading-tight">La tua impresa</p>
      </div>

      <Filo />

      {/* Piano 3 — le tre famiglie, come risposte. */}
      <p className="text-center text-sm font-semibold text-ink">
        I percorsi che producono quelle prove
      </p>
      <ul className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {FAMIGLIE.map(({ key, titolo, sintesi, icona: Icona }) => (
          <li
            key={key}
            className="rounded-2xl border border-line bg-paper p-4"
          >
            <span
              aria-hidden
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-moss text-pine"
            >
              <Icona size={17} />
            </span>
            <p className="mt-2.5 font-display text-lg leading-tight text-ink">
              {titolo}
            </p>
            {/* Mezza riga: qui serve il senso, non il dettaglio — che sta
                due schermate più giù, sopra le schede. */}
            <p className="mt-1 text-xs leading-relaxed text-gray-warm">
              {sintesi}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
