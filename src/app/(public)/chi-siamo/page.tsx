import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, UserCheck } from "lucide-react";

import { Sigillo } from "@/components/brand/sigillo";
import { JsonLd } from "@/components/json-ld";
import { GARANZIE } from "@/lib/sicurezza";
import { PhotoDuotone } from "@/components/photo-duotone";
import { SOLO_STANDARD_UFFICIALI } from "@/lib/catalog";
import { COMPETENZE_TEAM } from "@/lib/team";
import { SITO, jsonLdBreadcrumb, metadataPagina } from "@/lib/seo";

export const metadata: Metadata = metadataPagina({
  title: "Chi siamo: chi prepara i documenti e chi li controlla",
  description:
    "Verzero prepara i documenti che le imprese devono avere in regola — bilanci di sostenibilità, manuali ISO, calcoli delle emissioni — e li tiene aggiornati.",
  path: "/chi-siamo",
  // Pagina istituzionale: qui il soggetto è Verzero, quindi
  // l'anteprima social porta il marchio e non una fotografia.
  image: SITO.ogMarchio,
});

/**
 * CHI SIAMO — REGISTRO EDITORIALE.
 *
 * ═══ PERCHÉ QUESTA PAGINA È FATTA DIVERSAMENTE DALLE ALTRE ═══
 * Perché tutte le pagine del sito erano fatte uguali. Misurato: home,
 * chi siamo e il Sigillo avevano SETTE sezioni ciascuna, con la stessa
 * alternanza di fasce chiare e scure e le stesse aperture centrate. Un
 * sito in cui ogni pagina ha lo stesso impianto è un sito in cui il
 * cambio di contenuto non si sente: si scorre, e sembra sempre la
 * stessa pagina.
 *
 * Il sistema resta quello — stessa tipografia, stessa palette, stessi
 * componenti, stesso Zero. Cambia l'ARCHITETTURA, e cambia in funzione
 * del lavoro che la pagina fa. Questa deve reggere una lettura lunga di
 * chi vuole capire chi siamo prima di comprare, quindi è un articolo:
 *
 *   · UN SOLO CAMBIO DI FONDO in tutta la pagina, ed è la chiusura. Le
 *     sezioni si separano con lo SPAZIO e un filetto, non con una fascia
 *     di colore: l'alternanza a bande è il ritmo della home, e la home
 *     è l'unica che può permettersela.
 *   · ALLINEAMENTO A SINISTRA, non centrato: un testo lungo centrato non
 *     si legge, e il centraggio è la firma della home.
 *   · MISURA DA LETTURA (62 caratteri) e corpo da lettura (17 px, con
 *     interlinea 1,7), non da manifesto.
 *   · TITOLI DA ARTICOLO e non da manifesto: sono sottotitoli di
 *     sezione, stanno sotto la scala dei titoli-statement della home.
 *   · UNA FOTOGRAFIA PROTAGONISTA, larga, subito dopo l'apertura.
 *   · NIENTE PARTICELLE E NIENTE `MotoreInAzione`: quella scena sta già
 *     in home e in /come-funziona, e una terza volta qui era una delle
 *     ragioni per cui le tre pagine si somigliavano. Qui l'AI si
 *     racconta a parole, che è quello che fa un articolo.
 *
 * ═══ L'APERTURA SI CAPISCE AL PRIMO PASSAGGIO ═══
 * Diceva «Abbiamo messo la qualifica d'impresa in abbonamento», ed era
 * gergo nostro: «qualifica d'impresa» è il modo in cui chiamiamo il
 * mestiere fra noi, non una cosa che qualcuno cerchi o riconosca, e «in
 * abbonamento» da solo è un modello di vendita senza un oggetto. Chi non
 * ci ha mai sentiti nominare leggeva una frase che non gli diceva
 * niente, in cima alla pagina che dovrebbe spiegargli chi siamo.
 *
 * Adesso l'apertura nomina le COSE: i documenti, e tre esempi di
 * documento. Il criterio, che vale per tutto il sito: se una frase ha
 * bisogno di essere riletta o decodificata, è scritta per noi.
 *
 * ═══ E NON NEGA ═══
 * Diceva «La qualifica d'impresa non è un progetto. È uno stato.» —
 * negazione più affermazione. La stessa identica figura apriva
 * /come-funziona («Non è un assistente. È un'intelligenza…») e la pagina
 * del Sigillo («Il Sigillo non si compra. Si dimostra.»): tre pagine su
 * otto con la stessa mossa retorica. Al Sigillo resta, perché lì è la
 * frase di marca; qui l'apertura diventa dichiarativa in prima persona,
 * che è la voce giusta per una pagina che parla di noi.
 *
 * ═══ REGOLA DI TONO (vincolante, decisione del fondatore) ═══
 * La pagina è sempre propositiva. Non si apre mai dal problema, non
 * esistono sezioni negative e non si generalizza mai in negativo sulla
 * categoria dei consulenti: sono partner del modello (v. programma
 * partner), non un bersaglio.
 *
 * ALTRI VINCOLI: nessun claim di primato assoluto; nessun dato
 * societario finché la società non esiste; nessun numero inventato — il
 * 53 dei test di isolamento è misurato, lo stampa `scripts/test-rls.mjs`;
 * per il team nessun nome, foto o riferimento personale, e la sola
 * fotografia della pagina non ritrae persone.
 */

/** Le quattro regole che il codice fa rispettare da sé. */
const REGOLE = [
  {
    titolo: "Solo standard ufficiali",
    testo: SOLO_STANDARD_UFFICIALI,
  },
  {
    titolo: "Zero scorciatoie",
    testo:
      "Il Sigillo Ver0 non si compra: lo si ottiene completando i documenti previsti e facendoli controllare, e ogni anno va riconquistato. Un attestato che si potesse comprare non varrebbe niente per chi lo riceve, e chi lo espone lo sa.",
  },
  {
    titolo: "Dati custoditi in Europa",
    testo:
      "Infrastruttura e documenti dei clienti Verzero risiedono nell'Unione Europea e sono trattati secondo il GDPR. Ogni impresa vede soltanto i propri dati, e l'isolamento fra imprese è coperto da 53 test automatici eseguiti a ogni rilascio: se ne fallisce uno, il rilascio si ferma.",
  },
  {
    titolo: "Prezzi pubblici",
    testo:
      "I prezzi sono scritti sul sito e cambiano solo con la dimensione dell'impresa: chiunque può fare il conto da solo, anche prima di parlarci. Non ci sono preventivi su misura, e quindi non c'è la trattativa in cui chi sa negoziare paga meno di chi non sa.",
  },
];

/**
 * L'occhiello editoriale: a sinistra, non centrato, e con il filetto
 * che apre la sezione. È lo stacco che sostituisce il cambio di fondo.
 */
function ApreSezione({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-8">
      <span aria-hidden className="mb-6 block h-px w-full bg-line" />
      <p className="text-[13px] font-semibold uppercase tracking-[0.16em] text-pine">
        {children}
      </p>
    </div>
  );
}

/** Il paragrafo dell'articolo: misura e corpo da lettura lunga. */
function P({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-5 max-w-[62ch] text-[17px] leading-[1.7] text-gray-warm">
      {children}
    </p>
  );
}

/** Il sottotitolo di sezione: da articolo, non da manifesto. */
function H2({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="max-w-[20ch] font-display text-[2rem] leading-[1.1] tracking-[-0.02em] text-ink md:text-[3rem]">
      {children}
    </h2>
  );
}

export default function ChiSiamoPage() {
  return (
    <main className="bg-paper">
      <JsonLd
        dati={jsonLdBreadcrumb([
          { nome: "Home", path: "/" },
          { nome: "Chi siamo", path: "/chi-siamo" },
        ])}
      />

      {/* ── L'ATTACCO ──────────────────────────────────────────────────
          Dichiarativo e in prima persona plurale: è una pagina che parla
          di noi, e la tesi sta nella prima frase come in un articolo. La
          riga sotto non ripete la tesi — apre l'argomentazione, e le
          quattro sezioni che seguono sono i quattro pezzi. */}
      <section className="px-5 pb-14 pt-20 md:pb-20 md:pt-28">
        <div className="mx-auto max-w-4xl">
          <p className="text-[13px] font-semibold uppercase tracking-[0.16em] text-pine">
            Chi siamo
          </p>
          <h1 className="mt-6 max-w-[19ch] font-display text-[2.05rem] leading-[1.1] tracking-[-0.02em] text-ink md:text-[3.6rem]">
            Prepariamo i documenti che le imprese devono avere in regola,{" "}
            <span className="text-pine">e li teniamo aggiornati.</span>
          </h1>
          <p className="mt-8 max-w-[58ch] font-display text-[1.2rem] leading-[1.5] text-pine md:text-[1.5rem]">
            Bilanci di sostenibilità, manuali dei sistemi di gestione, calcoli
            delle emissioni: li scrive un&apos;intelligenza artificiale che
            abbiamo costruito noi e li controlla un professionista prima che
            arrivino all&apos;impresa. Si paga con un canone mensile, e i prezzi
            sono scritti sul sito.
          </p>
        </div>
      </section>

      {/* LA FOTOGRAFIA PROTAGONISTA — larga, subito dopo l'attacco, come
          l'apertura di un servizio giornalistico. È una sola in tutta la
          pagina (più la filigrana della chiusura) e non ritrae persone:
          la regola sul team vale anche per le immagini, e uno scatto di
          gente al lavoro che non è la nostra sarebbe una prova falsa. */}
      <div className="px-5 pb-16 md:pb-24">
        <PhotoDuotone
          src="/photos/sito3.jpg"
          alt="Una foglia divisa a metà: da un lato la nervatura naturale, dall'altro la stessa forma ricostruita come una rete di dati."
          intensity="soft"
          priority
          className="mx-auto aspect-[16/9] max-w-6xl rounded-3xl shadow-lift md:aspect-[21/9]"
        />
      </div>

      {/* ── 1. L'AI ─────────────────────────────────────────────────── */}
      <section className="px-5 pb-16 md:pb-24">
        <div className="mx-auto max-w-4xl">
          <ApreSezione>La nostra AI</ApreSezione>
          <H2>
            L&apos;abbiamo costruita noi, e per un mestiere solo.
          </H2>
          <P>
            L&apos;intelligenza artificiale che legge i documenti delle imprese
            è di Verzero. Non è un assistente generico a cui abbiamo aggiunto
            delle istruzioni: è costruita sui documenti che le imprese hanno
            già — bollette, visure, cedolini, certificati, registri — e sulle
            norme che li governano.
          </P>
          <P>
            La differenza si vede in quello che succede quando un documento è
            fatto male: storto, fotografato di sbieco, compilato a mano, con
            una data che manca. Un assistente generico riempie il buco con
            qualcosa di plausibile. La nostra AI lascia il campo vuoto e lo
            segnala, perché un valore inventato dentro un documento che poi
            finisce davanti a un auditor è un danno, non una comodità.
          </P>
          <P>
            È anche la ragione per cui non la chiamiamo un chatbot e non la
            mettiamo a disposizione per parlarci. Fa una cosa sola: prende i
            documenti che le dai e ne scrive uno nuovo, in cui ogni dato resta
            riconducibile alla riga da cui è stato preso.
          </P>
          <p className="mt-7">
            <Link
              href="/come-funziona"
              className="inline-flex items-center gap-1.5 text-[15px] font-semibold text-pine hover:underline"
            >
              Guarda il metodo per esteso <ArrowRight size={15} />
            </Link>
          </p>
        </div>
      </section>

      {/* ── 2. LE PERSONE ───────────────────────────────────────────── */}
      <section className="px-5 pb-16 md:pb-24">
        <div className="mx-auto max-w-4xl">
          <ApreSezione>Chi valida</ApreSezione>
          <H2>Un documento esce quando una persona lo convalida.</H2>
          <P>
            Il team di Verzero è fatto di professionisti qualificati che
            leggono ogni documento prima che arrivi al cliente e restano
            responsabili di quel controllo. Non è un controllo a campione:
            è il passaggio obbligato di ogni documento, e non esiste una via che
            lo salti quando c&apos;è fretta.
          </P>
          <P>
            È la metà del prodotto che non si può automatizzare, ed è anche la
            metà che costa. La teniamo perché un documento che nessuno ha
            letto è un documento di cui nessuno risponde — e chi lo porta a un
            controllo è il cliente, non noi.
          </P>

          <ul className="mt-9 grid max-w-3xl grid-cols-1 gap-3 sm:grid-cols-2">
            {COMPETENZE_TEAM.map((c) => (
              <li
                key={c}
                className="flex items-start gap-3 rounded-xl border border-line bg-white px-5 py-4"
              >
                <UserCheck
                  size={18}
                  className="mt-0.5 shrink-0 text-pine"
                  aria-hidden
                />
                <span className="text-[15px] leading-snug text-ink">{c}</span>
              </li>
            ))}
          </ul>

          <P>
            Nessun nome e nessun volto in questa pagina, e nemmeno una
            fotografia che faccia finta di ritrarli. Chi ha esaminato un
            documento il cliente lo vede nel portale, sul suo documento, dove
            gli serve: in vetrina servirebbe solo a noi.
          </P>
        </div>
      </section>

      {/* ── 3. LE REGOLE ────────────────────────────────────────────── */}
      {/* Erano due sezioni — «i principi» in quattro schede su fondo
          salvia e «sicurezza e riservatezza» in quattro schede su fondo
          carta — e dicevano cose della stessa natura con due impaginati
          diversi a due schermate di distanza. Qui sono un elenco solo, in
          forma di articolo: titolo e paragrafo, senza scheda. */}
      <section className="px-5 pb-16 md:pb-24">
        <div className="mx-auto max-w-4xl">
          <ApreSezione>Come stiamo in piedi</ApreSezione>
          <H2>Quattro regole che valgono anche quando costano.</H2>
          <P>
            Non sono buoni propositi: ognuna delle quattro ha, dentro il
            prodotto, qualcosa che la fa rispettare da sé — un controllo che
            ferma un rilascio, un listino che è un file solo, un registro che
            fa fallire la build se una norma è superata.
          </P>

          <dl className="mt-10 max-w-[62ch] space-y-9">
            {REGOLE.map((r) => (
              <div key={r.titolo}>
                <dt className="font-display text-[1.35rem] leading-tight text-ink">
                  {r.titolo}
                </dt>
                <dd className="mt-2.5 text-[17px] leading-[1.7] text-gray-warm">
                  {r.testo}
                </dd>
              </div>
            ))}
          </dl>

          {/* Le garanzie per esteso restano nella loro pagina: qui basta
              sapere che esistono e dove sono. */}
          <div className="mt-12 max-w-[62ch] border-l-2 border-mint/50 pl-6">
            <p className="text-[15px] leading-relaxed text-pine-dark">
              Sulla riservatezza dichiariamo le garanzie, non
              l&apos;implementazione: {GARANZIE.map((g) => g.titolo.toLowerCase()).join(", ")}.
            </p>
            <p className="mt-4">
              <Link
                href="/sicurezza"
                className="inline-flex items-center gap-1.5 text-[15px] font-semibold text-pine hover:underline"
              >
                Le garanzie per esteso <ArrowRight size={15} />
              </Link>
            </p>
          </div>
        </div>
      </section>

      {/* ── 4. IL PROGRAMMA PARTNER ─────────────────────────────────── */}
      {/* Sta in questa pagina e non nel menu perché parla a un pubblico
          diverso: i consulenti, non le imprese. Ed è il posto in cui la
          regola di tono diventa concreta — sono partner del modello, e
          questa sezione è la prova che non sono un bersaglio. */}
      <section className="px-5 pb-20 md:pb-28">
        <div className="mx-auto max-w-4xl">
          <ApreSezione>Per commercialisti e consulenti</ApreSezione>
          <H2>Il lavoro documentale lo facciamo noi, la relazione resta tua.</H2>
          <P>
            Se segui delle imprese, puoi portarle su Ver0 e restare tu il
            riferimento. Un accesso solo con il selettore per passare da
            un&apos;impresa all&apos;altra, e vedi soltanto quelle che ti hanno
            dato il mandato, finché è attivo.
          </P>
          <P>
            I documenti li produce e li valida il team tecnico di Verzero: la
            responsabilità di quello che esce resta nostra, e tu non ti assumi
            niente al posto nostro. Le condizioni dedicate ai partner si
            concordano su richiesta.
          </P>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/partner"
              className="vz-press inline-flex items-center gap-2 rounded-xl bg-pine px-6 py-3.5 text-sm font-semibold text-white"
            >
              Come si diventa partner <ArrowRight size={16} />
            </Link>
            <Link
              href="/contatti"
              className="vz-press inline-flex items-center gap-2 rounded-xl border-2 border-pine px-6 py-3.5 text-sm font-semibold text-pine"
            >
              Candidati
            </Link>
          </div>
        </div>
      </section>

      {/* ── LA CHIUSURA ────────────────────────────────────────────────
          L'UNICO cambio di fondo della pagina, e cade dove serve: dopo
          quattromila caratteri di lettura chiara, il pino profondo dice
          che l'articolo è finito. Il Sigillo è la prova, la riga sullo
          Zero è la firma. */}
      <section className="relative overflow-hidden bg-pine-deep px-5 py-20 md:py-28">
        <div aria-hidden className="absolute inset-0 opacity-15">
          <PhotoDuotone src="/photos/sito4.jpg" className="h-full w-full" />
        </div>
        <div aria-hidden className="absolute inset-0 bg-pine-deep/70" />
        <div className="relative mx-auto max-w-4xl">
          <div className="flex flex-col gap-10 sm:flex-row sm:items-center sm:gap-12">
            <Sigillo tone="dark" className="h-24 w-24 shrink-0 md:h-28 md:w-28" />
            <div className="min-w-0">
              <h2 className="font-display text-[2rem] leading-[1.1] tracking-[-0.02em] text-white md:text-[3rem]">
                Il metodo non si racconta.{" "}
                <span className="text-mint-bright">Si dimostra.</span>
              </h2>
              <p className="mt-5 max-w-[58ch] text-[16px] leading-relaxed text-moss">
                Per questo esiste il Sigillo Ver0: criteri pubblici, dati
                verificati, millesimo che ogni anno va riconquistato. Quello che
                Verzero promette qui, lì diventa controllabile da chiunque.
              </p>
              <p className="mt-7">
                <Link
                  href="/sigillo"
                  className="vz-press inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3.5 text-[15px] font-semibold text-pine"
                >
                  Scopri il Sigillo <ArrowRight size={16} />
                </Link>
              </p>
            </div>
          </div>

          <p className="mt-16 max-w-[52ch] border-t border-white/15 pt-10 font-display text-[1.3rem] leading-snug text-moss md:text-[1.7rem]">
            Ci chiamiamo Ver0 per un principio solo, lo Zero, che torna in ogni
            promessa. Lo Zero, da noi, non è il niente — è il traguardo.
          </p>
        </div>
      </section>
    </main>
  );
}
