import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  BookMarked,
  ClipboardList,
  BadgeCheck,
  FileCheck2,
  Info,
  LifeBuoy,
  ListOrdered,
  Sparkles,
} from "lucide-react";

import { DomandeFrequenti } from "@/components/domande-frequenti";
import { JsonLd } from "@/components/json-ld";
import { FasciaListaAttesa } from "@/components/lista-attesa";
import { OndaParticelle } from "@/components/onda-particelle";
import { ControlloEdizione } from "@/components/controllo-edizione";
import { QualitaOutput } from "@/components/qualita-output";
import { PRESET } from "@/lib/onda";
import { TracciaApertura } from "@/components/traccia-evento";
import { EVENTI } from "@/lib/eventi";
import { guidePerServizio } from "@/lib/guide";
import {
  RICHIAMO_SUPPORTO_AUDIT,
  SERVIZI,
  SERVIZI_CERTIFICABILI,
  SOLO_STANDARD_UFFICIALI,
  getServizio,
} from "@/lib/catalog";
import { prezzoDa, prezzoDettaglio, prezzoUnaTantum } from "@/lib/pricing";
import { faqServizio } from "@/lib/faq-servizio";
import {
  jsonLdBreadcrumb,
  jsonLdFaq,
  jsonLdService,
  metadataPagina,
} from "@/lib/seo";

import { PrezzoBox } from "./prezzo-box";

/** Pre-genera le pagine di dettaglio a build time. */
export function generateStaticParams() {
  return SERVIZI.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const s = getServizio(slug);
  if (!s) return { title: "Servizio non trovato" };
  // La description nasce dalla riga breve del catalogo, non dal paragrafo
  // "cos'è": quello supera i 300 caratteri e verrebbe troncato a metà frase.
  const prezzo = prezzoDa(s.slug);
  const descrizione = `${s.short}${prezzo ? ` Prezzo pubblico ${prezzo}, per fascia dimensionale.` : ""}`;
  // I nomi brevi da soli fanno un titolo povero: si allungano con ciò che
  // la pagina offre davvero. Quelli già lunghi restano come sono.
  const titolo =
    s.name.length >= 30 ? s.name : `${s.name} — prezzi e come funziona`;
  return metadataPagina({
    title: titolo,
    description: descrizione.slice(0, 160),
    path: `/servizi/${s.slug}`,
  });
}

/**
 * Pagina servizio con la struttura fissa §12.Q:
 * cos'è / come funziona con Ver0 / tu ricevi / requisiti e vincoli /
 * Opportunità (che resta in ogni pagina).
 */
export default async function ServizioPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const s = getServizio(slug);
  if (!s) notFound();

  // Prezzo di partenza (fascia micro): è quello che dichiariamo nei dati
  // strutturati, coerente con il "da" mostrato in vetrina.
  const canone = prezzoDettaglio(s.slug, "micro");
  // Una sola guida, la prima pertinente: il rimando serve a chi si chiede
  // perché gli stiano chiedendo questo documento, non a riempire la barra.
  const guida = guidePerServizio(s.slug)[0];
  const unaTantum = prezzoUnaTantum(s.slug, "micro");

  // Le domande frequenti: una sola lista, mostrata in pagina e dichiarata
  // nel markup. Se le due cose divergono, il markup mente.
  const domande = faqServizio(s);

  return (
    <>
      {/* Primo segnale d'interesse reale: chi apre una scheda servizio
          sta valutando, non passando (src/lib/eventi.ts). */}
      <TracciaApertura
        evento={EVENTI.SERVIZIO_APERTO}
        dettagli={{ servizio: s.slug }}
      />
    <main className="mx-auto max-w-3xl px-4 pb-12 pt-6">
      {/* Dati strutturati: il servizio con la sua offerta in fascia micro,
          la stessa esposta in pagina come prezzo di partenza. */}
      <JsonLd
        dati={jsonLdService({
          nome: s.name,
          descrizione: s.short,
          path: `/servizi/${s.slug}`,
          offerta: canone
            ? { tipo: "canone", mensile: canone.mensile }
            : unaTantum !== null
              ? { tipo: "una-tantum", importo: unaTantum }
              : null,
        })}
      />
      <JsonLd
        dati={jsonLdBreadcrumb([
          { nome: "Home", path: "/" },
          { nome: "Servizi", path: "/servizi" },
          { nome: s.name, path: `/servizi/${s.slug}` },
        ])}
      />
      {/* FAQPage: le stesse domande stampate in fondo alla pagina, mai
          una in più e carattere per carattere. Il markup descrive solo
          contenuto visibile. */}
      <JsonLd dati={jsonLdFaq(domande)} />

      {/* L'intestazione porta la firma dell'onda, appena percepibile:
          sotto c'è il listino, cioè dati — e sui dati il fondale tace. */}
      {/* Il margine negativo deve valere ESATTAMENTE il padding di <main>
          (px-4): con -mx-5 la fascia usciva di 4px per lato e la pagina
          scorreva in orizzontale sul telefono. */}
      <div className="relative isolate -mx-4 mb-4 overflow-hidden px-4 pb-4 pt-2">
        <OndaParticelle config={PRESET.tenue} className="-z-10" />
        <Link
          href="/servizi"
          className="relative flex items-center gap-1.5 text-xs text-gray-warm hover:text-pine"
        >
          <ArrowLeft size={13} /> Tutti i servizi
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {/* Colonna contenuti */}
        <div className="md:col-span-2">
          <h1 className="mb-1 font-display text-3xl text-ink md:text-4xl">
            {s.name}
          </h1>
          {/* §12.I: il taglio è la riga secondaria, mai parte del nome. */}
          {s.taglio && (
            <p className="mb-1 text-sm font-semibold uppercase tracking-wide text-pine">
              {s.taglio}
            </p>
          )}
          {s.copre && (
            <div className="mb-2 mt-2 flex flex-wrap gap-1.5">
              {s.copre.map((c) => (
                <span
                  key={c}
                  className="rounded-full border border-mint/40 bg-moss px-2.5 py-1 text-xs font-medium text-pine"
                >
                  {c}
                </span>
              ))}
            </div>
          )}

          {/* LA RIGA DI RICHIAMO, dove c'è: ferma chi non stava cercando
              questo servizio. Sopra la descrizione e in evidenza, perché
              la descrizione risponde a chi ha già deciso di leggere. */}
          {s.richiamo && (
            <p className="mb-4 border-l-4 border-mint pl-4 font-display text-xl leading-snug text-ink md:text-2xl">
              {s.richiamo}
            </p>
          )}

          {/* ═══ 1. CHE COS'È, E A CHI SERVE ═══
              `perChi` viveva solo dentro «In breve»: spostando le domande
              in fondo sarebbe sparito dall'apertura, che è l'unico posto
              in cui serve davvero — chi legge deve capire in due righe se
              la pagina parla di lui. */}
          <p className="text-[15px] leading-relaxed text-gray-warm">
            {s.cosE}
          </p>
          <p className="mt-3 text-[15px] leading-relaxed text-gray-warm">
            {s.perChi}
          </p>

          {/* IL GANCIO, solo dove ha senso: chi legge questa scheda ha un
              manuale in mano e vuole sapere se è indietro. La risposta è
              un fatto pubblico e non chiediamo niente per darla. */}
          {s.slug === "aggiornamento-sistema-gestione" && (
            <div className="mt-6">
              <ControlloEdizione />
            </div>
          )}

          {/* ═══ 2. COME LO PRODUCIAMO ═══
              Qui dentro confluisce quello che prima era sparso in cinque
              riquadri affiancati — cosa serve dall'impresa, il lavoro
              passo per passo, cosa si consegna e com'è fatto, su quali
              norme, dove si ferma — perché sono le fasi di una cosa
              sola e si leggono in fila, non a blocchi. */}
          <h2 className="mt-8 font-display text-2xl text-ink">
            Come lo produciamo
          </h2>

          <h3 className="mt-5 flex items-center gap-2 font-display text-xl text-ink">
            <ClipboardList size={16} className="text-pine" aria-hidden /> Tu
            porti quello che hai già
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-gray-warm">
            Di norma bastano documenti che hai già in azienda. Quando attivi,
            il portale ti chiede uno per uno quelli che servono a questo
            percorso, li legge e ti segnala cosa manca: nessuna lista da
            interpretare e nessun documento chiesto per scrupolo.
          </p>
          {/* I requisiti stavano in un riquadro a parte, in fondo: sono la
              parte scomoda di «cosa serve», e separarli dal resto li
              faceva sembrare una postilla. */}
          <ul className="mt-2.5 space-y-1.5">
            {s.requisiti.map((x) => (
              <li key={x} className="flex items-start gap-2 text-sm leading-relaxed text-gray-warm">
                <span
                  aria-hidden
                  className="mt-2 h-1 w-1 shrink-0 rounded-full bg-gray-warm"
                />
                {x}
              </li>
            ))}
          </ul>

          <h3 className="mt-6 flex items-center gap-2 font-display text-xl text-ink">
            <ListOrdered size={16} className="text-pine" aria-hidden /> Il
            lavoro, passo per passo
          </h3>
          <ol className="mt-2 space-y-2">
            {s.comeFunziona.map((x, i) => (
              <li key={x} className="flex items-start gap-2.5 text-sm leading-relaxed text-gray-warm">
                <span
                  aria-hidden
                  className="mt-0.5 inline-flex shrink-0 items-center justify-center rounded-full bg-moss text-[10px] font-semibold text-pine"
                  style={{ height: 18, width: 18 }}
                >
                  {i + 1}
                </span>
                {x}
              </li>
            ))}
          </ol>

          <h3 className="mt-6 flex items-center gap-2 font-display text-xl text-ink">
            <FileCheck2 size={16} className="text-pine" aria-hidden /> Tu ricevi
          </h3>
          <ul className="mt-2 space-y-1.5">
            {s.output.map((x) => (
              <li key={x} className="flex items-start gap-2 text-sm leading-relaxed text-gray-warm">
                <FileCheck2
                  size={15}
                  aria-hidden
                  className="mt-0.5 shrink-0 text-pine"
                />
                {x}
              </li>
            ))}
          </ul>
          <div className="mt-3 rounded-xl border border-line bg-paper p-4">
            <p className="mb-2.5 flex items-center gap-2 text-sm font-semibold text-ink">
              <BadgeCheck size={15} className="text-pine" aria-hidden /> Com&apos;è
              fatto quello che ricevi
            </p>
            <QualitaOutput compatto />
          </div>

          <h3 className="mt-6 flex items-center gap-2 font-display text-xl text-ink">
            <BookMarked size={16} className="text-pine" aria-hidden /> Su quali
            norme
          </h3>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {s.riferimenti.map((r) => (
              <span
                key={r}
                className="rounded-full border border-line bg-paper px-2.5 py-1 text-xs text-pine"
              >
                {r}
              </span>
            ))}
          </div>
          <p className="mt-2 text-sm leading-relaxed text-gray-warm">
            {SOLO_STANDARD_UFFICIALI}
          </p>

          {/* DOVE SI FERMA. Resta in evidenza (§12.M): il confine non è
              una postilla, e chi legge deve incontrarlo prima di
              decidere — non dopo. */}
          {s.perimetro && (
            <div className="mt-5 flex items-start gap-3 rounded-xl border border-amber-ink/25 bg-amber-soft p-4">
              <Info size={16} className="mt-0.5 shrink-0 text-amber-ink" aria-hidden />
              <p className="text-sm leading-relaxed text-amber-ink">
                <strong className="font-semibold">Dove si ferma: </strong>
                {s.perimetro}
              </p>
            </div>
          )}

          {/* ═══ 3. CHE COSA APRE ═══ */}
          <h2 className="mt-8 flex items-center gap-2 font-display text-2xl text-ink">
            <Sparkles size={17} className="text-mint" aria-hidden /> Che cosa
            ti apre
          </h2>
          <ul className="mt-3 space-y-2 rounded-xl bg-moss p-4">
            {s.opportunita.map((x) => (
              <li key={x} className="flex items-start gap-2 text-sm leading-relaxed text-pine">
                <Sparkles size={15} aria-hidden className="mt-0.5 shrink-0 text-mint" />
                {x}
              </li>
            ))}
          </ul>
        </div>

        {/* Box prezzo con selettore di dimensione (matrice §12.X, ciclo §12.Q) */}
        <div>
          <PrezzoBox slug={s.slug} />
          <p className="mt-3 text-center text-xs text-gray-light">
            Dati ospitati in UE · dietro lo schermo ci sono sempre persone
          </p>

          {/* Link interni verso le pagine correlate (regola SEO §seo.ts) */}
          <nav
            aria-label="Pagine correlate"
            className="mt-4 flex flex-col gap-1.5 border-t border-line pt-4 text-sm"
          >
            {guida && (
              <Link
                href={`/guide/${guida.slug}`}
                className="font-medium text-pine hover:underline"
              >
                Perché te lo chiedono
              </Link>
            )}
            <Link
              href="/sigillo"
              className="font-medium text-pine hover:underline"
            >
              Come si ottiene il Sigillo Ver0
            </Link>
            <Link
              href="/chi-siamo"
              className="font-medium text-pine hover:underline"
            >
              Chi verifica i documenti
            </Link>
            <Link
              href="/contatti"
              className="font-medium text-pine hover:underline"
            >
              Hai una domanda su questo servizio?
            </Link>
          </nav>
        </div>
      </div>

      {/* Richiamo al supporto all'audit sui soli percorsi certificabili:
          l'audit lo fa un organismo terzo, noi adeguiamo i documenti. */}
      {SERVIZI_CERTIFICABILI.includes(s.slug) && (
        <section className="mx-auto mt-12 max-w-5xl px-5">
          <div className="flex flex-col gap-4 rounded-2xl border border-line bg-paper p-5 sm:flex-row sm:items-center">
            <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-moss text-pine">
              <LifeBuoy size={20} />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-ink">
                {RICHIAMO_SUPPORTO_AUDIT.titolo}
              </p>
              <p className="mt-1 text-sm leading-relaxed text-gray-warm">
                {RICHIAMO_SUPPORTO_AUDIT.testo}
              </p>
            </div>
            <Link
              href={`/servizi/${RICHIAMO_SUPPORTO_AUDIT.slug}`}
              className="inline-flex shrink-0 items-center gap-1.5 self-start rounded-lg border border-pine px-4 py-2 text-sm font-medium text-pine transition-all hover:-translate-y-0.5 hover:shadow-soft sm:self-auto"
            >
              {RICHIAMO_SUPPORTO_AUDIT.cta} <ArrowRight size={15} />
            </Link>
          </div>
        </section>
      )}

      {/* ═══ 4. LE DOMANDE FREQUENTI ═══ Le stesse voci del markup
          FAQPage dichiarato in cima: una fonte sola, `domande`. */}
      <DomandeFrequenti voci={domande} />
    </main>

      {/* La stessa fascia in fondo alla scheda: chi è arrivato a leggere
          fin qui è la persona giusta a cui chiederlo. */}
      <FasciaListaAttesa interesse={s.slug} />
    </>
  );
}
