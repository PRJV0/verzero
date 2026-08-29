import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, FileText, UserCheck } from "lucide-react";

import { Sigillo } from "@/components/brand/sigillo";
import { NastroZero } from "@/components/nastro-zero";
import { NarrazioneZero } from "@/components/zero-narrazione";
import { FasciaListaAttesa } from "@/components/lista-attesa";
import { HeroHome } from "@/components/hero-home";
import { OndaParticelle } from "@/components/onda-particelle";
import { PrezzoPrincipio } from "@/components/prezzo-principio";
import { AnnuncioFase } from "@/components/annuncio-fase";
import { FONDO_SOGLIA, PRESET } from "@/lib/onda";
import { AnteprimaPassi } from "@/components/guida-passi";
import { MotoreInAzione } from "@/components/motore-in-azione";
import { JsonLd } from "@/components/json-ld";
import { SOLO_STANDARD_UFFICIALI } from "@/lib/catalog";
import { DIMENSIONE_LABEL, DIMENSIONE_RANGE, DIMENSIONI } from "@/lib/pricing";
import { COMPETENZE_TEAM } from "@/lib/team";
import { SITO, jsonLdOrganization, jsonLdWebSite } from "@/lib/seo";

/**
 * Home come MANIFESTO (SPEC §12.J): vende la potenza del Motore e il
 * risultato, NON spiega il processo. Ogni sezione: un titolo-statement
 * (2-5 parole, display grande) + massimo 2 righe + una CTA imperativa.
 * La profondità tecnica vive in /come-funziona e nelle pagine servizio —
 * anche come protezione del know-how: il «come» non si regala in home.
 *
 * Grafica: contrasto pino/bianco netto, niente gradienti, blocchi decisi,
 * bottoni grandi, spazi generosi attorno a pochi elementi grandi. Le
 * filigrane (zeri giganti, foto in trasparenza) restano.
 */

/* --- Elementi decorativi (aria-hidden, puramente grafici) --- */

function ZeroWatermark({
  className = "",
  tone = "pine",
}: {
  className?: string;
  tone?: "pine" | "light";
}) {
  const color = tone === "light" ? "text-white/[0.06]" : "text-pine/[0.05]";
  return (
    <span
      aria-hidden
      className={`pointer-events-none absolute select-none font-display leading-none ${color} ${className}`}
    >
      0
    </span>
  );
}


/** Parola-Zero: accento ricorrente del Registro A (corsivo menta). */
function ZeroWord({
  children,
  tone = "light",
}: {
  children: React.ReactNode;
  tone?: "light" | "dark";
}) {
  return (
    <em
      className={
        "font-display font-semibold " +
        (tone === "dark" ? "text-mint-bright" : "text-mint")
      }
    >
      {children}
    </em>
  );
}

/** Bottone-manifesto: grande, netto, verbo imperativo. */
function CtaGrande({
  href,
  children,
  tone = "pine",
}: {
  href: string;
  children: React.ReactNode;
  tone?: "pine" | "white";
}) {
  return (
    <Link
      href={href}
      className={
        "vz-press inline-flex items-center gap-2 rounded-xl px-7 py-4 text-base font-semibold hover:-translate-y-0.5 " +
        (tone === "pine"
          ? "bg-pine text-white"
          : "bg-white text-pine")
      }
    >
      {children} <ArrowRight size={18} />
    </Link>
  );
}

/* --- Dati di pagina --- */

/** Le tre battute della sezione documenti (§12.J): secche, senza processo. */
const BATTUTE = [
  { icon: FileText, t: "Solo il necessario." },
  { icon: null, t: "L'AI Ver0 lavora." }, // icona: lo zero E1, disegnato sotto
  { icon: UserCheck, t: "Un professionista valida." },
];

export const metadata: Metadata = {
  title: { absolute: `${SITO.nome} — ${SITO.payoff}` },
  description:
    "Qualifica la tua impresa in abbonamento: un'intelligenza proprietaria costruita per i documenti d'impresa, professionisti che validano, prezzi pubblici.",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "it_IT",
    siteName: SITO.nome,
    title: `${SITO.nome} — ${SITO.payoff}`,
    description:
      "Qualifica la tua impresa in abbonamento: un'intelligenza proprietaria costruita per i documenti d'impresa, professionisti che validano, prezzi pubblici.",
    url: "/",
    images: [
      {
        url: SITO.ogMarchio,
        width: 1200,
        height: 630,
        alt: `${SITO.nome} — ${SITO.payoff}`,
      },
    ],
  },
};

export default function HomePage() {
  return (
    <>
      {/* L'entità: chi siamo, e il sito che la pubblica. Due nodi legati
          dallo stesso `@id`, così chi legge il markup trova un'azienda
          sola invece di due che si somigliano. */}
      <JsonLd dati={jsonLdOrganization()} />
      <JsonLd dati={jsonLdWebSite()} />

      <HeroHome />

      {/* CHI SI DEVE RICONOSCERE, e sta qui perché è la prima domanda
          che uno si fa: «vale anche per me?». Il sito diceva «le
          imprese», che è come dire nessuno.

          ═══ PERCHÉ NON È PIÙ A DUE POLI ═══
          C'erano due frasi ai lati e una pastiglia in mezzo che diceva
          «stesso impianto». Chiedeva al lettore di ricostruire da sé il
          senso della composizione: due etichette accostate non sono
          un'affermazione, e la cosa che contava — che il metodo è UNO —
          era la scritta più piccola delle tre.

          Adesso l'affermazione la fa il titolo, in scala da titolo, e i
          due casi stanno dentro la riga sotto, dove sono esempi che si
          leggono invece che poli da interpretare. Sotto, le fasce vere
          del listino: dicono la seconda metà della frase — che a cambiare
          è il prezzo — con i nomi e le soglie che il cliente ritroverà
          sul catalogo, non con un'allusione. */}
      <section className="border-b border-line bg-white px-5 py-16 md:py-24">
        <div className="mx-auto max-w-4xl text-center">
          <p className="mb-5 text-[13px] font-semibold uppercase tracking-[0.16em] text-pine">
            Per chi è
          </p>
          <h2 className="font-display text-[2.4rem] leading-[1.0] tracking-[-0.02em] text-ink md:text-[4rem]">
            Lo stesso metodo,{" "}
            <span className="text-pine">per ogni impresa.</span>
          </h2>
          <p className="mx-auto mt-7 max-w-[52ch] font-display text-[1.2rem] leading-snug text-gray-warm md:text-[1.55rem]">
            Che tu debba fare il primo bilancio di sostenibilità o rispondere
            alle richieste di banche e committenti, il percorso è lo stesso:
            cambia il prezzo, che segue la dimensione della tua impresa.
          </p>

          {/* Le quattro fasce vengono da `pricing.ts`, come ogni altro
              numero del sito: qui si vedono i nomi e le soglie, non una
              parafrasi che il listino potrebbe smentire. */}
          {/* Griglia sullo stretto, fila sul largo. A `flex-wrap` centrato
              le quattro fasce venivano larghe una diversa dall'altra e
              incolonnate storte: una griglia a due colonne le allinea, e
              sul largo tornano una fila sola. */}
          <ul className="mx-auto mt-10 grid max-w-3xl grid-cols-2 gap-2.5 sm:flex sm:flex-wrap sm:justify-center">
            {DIMENSIONI.map((d) => (
              <li
                key={d}
                className="rounded-xl border border-line bg-paper/70 px-4 py-3 text-left"
              >
                <span className="block text-[14px] font-semibold text-ink">
                  {DIMENSIONE_LABEL[d]}
                </span>
                <span className="block text-[12px] leading-snug text-gray-light">
                  {DIMENSIONE_RANGE[d]}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* LO ZERO DI VER0 — un contenuto, due presentazioni.
          Le sei declinazioni vengono dalla stessa fonte (`src/lib/zeri.ts`);
          cambia il modo di mostrarle, perché i due contesti non hanno gli
          stessi vincoli.

          SU LARGO la narrazione allo scorrimento: c'è spazio per una
          parola alla volta grande quanto un titolo, e la corsa di
          scorrimento è abbastanza lunga perché l'avvicendamento si legga.

          SU STRETTO il nastro che scorre da solo: lì il palco sticky ruba
          spazio alla lettura (SPEC §12.O) e il movimento legato allo
          scorrimento non regge — chi scorre veloce salta le fasi, chi
          scorre piano le vede a strappi.

          La scelta la fa il CSS, non JavaScript: entrambe stanno nel
          markup e una sola è visibile alla volta. `display: none` toglie
          l'altra anche dall'albero di accessibilità e ne ferma le
          animazioni, quindi non c'è nulla che giri o venga letto due
          volte — e non c'è lo sfarfallio che darebbe una scelta fatta
          dopo l'idratazione. */}
      {/* NIENTE `overflow-hidden` su questa sezione: un antenato che
          ritaglia annulla il `position: sticky` del palco, e la
          narrazione perde l'ancoraggio senza dare alcun errore. Chi
          ritaglia lo fa per conto suo — la filigrana qui sotto e il
          nastro dentro di sé. */}
      <section className="relative bg-moss py-16 md:py-24">
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          <ZeroWatermark tone="pine" className="-bottom-24 -left-10 text-[26rem]" />
        </div>
        <div className="relative">
          <div className="mx-auto max-w-4xl px-5 text-center">
            <h2 className="font-display text-[3rem] leading-[0.98] tracking-[-0.02em] text-ink md:text-[4.6rem]">
              Lo <ZeroWord>Zero</ZeroWord> di Ver0
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-sm text-gray-warm md:text-base">
              Un principio solo, che regge sempre la stessa domanda:
              «dimostramelo».
            </p>
          </div>

          {/* Da 768px in su: la narrazione. */}
          <div className="hidden px-5 md:block">
            <div className="mx-auto max-w-4xl">
              <NarrazioneZero />
            </div>
          </div>

          {/* Sotto i 768px: il nastro. */}
          <div className="mt-10 border-y border-pine/12 py-6 md:hidden">
            <NastroZero />
          </div>
        </div>
      </section>

      {/* IL MOTORE — manifesto della potenza, senza fasi né meccanismi
          (§12.J: il «come» vive dentro, in /come-funziona). */}
      <section className="relative isolate overflow-hidden bg-pine-deep px-5 py-16 md:py-24">
        {/* L'onda torna qui in palette invertita e più nitida: è la
            sezione del Motore, e le si addice un carattere tecnico. */}
        <OndaParticelle config={PRESET.tecnica} className="-z-10" />
        <ZeroWatermark
          tone="light"
          className="-left-20 top-1/2 -translate-y-1/2 text-[28rem]"
        />
        {/* Glow menta discreti: profondità sulle superfici scure */}
        <span aria-hidden className="pointer-events-none absolute -right-32 -top-24 h-96 w-96 rounded-full bg-mint-bright/10 blur-3xl" />
        <span aria-hidden className="pointer-events-none absolute -bottom-32 left-1/4 h-80 w-80 rounded-full bg-mint-bright/[0.07] blur-3xl" />
        <div className="relative mx-auto max-w-4xl text-center">
          {/* Mai "VER0" in maiuscoletto: si legge "VERO" (decisione già presa). */}
          <p className="mb-6 text-[13px] font-semibold uppercase tracking-[0.16em] text-mint-bright">
            L&apos;INTELLIGENZA È NOSTRA
          </p>
          <h2 className="mx-auto max-w-4xl font-display text-[2.5rem] leading-[1.02] tracking-[-0.02em] text-white md:text-[4rem]">
            Costruito sui documenti che le imprese hanno già e le{" "}
            <span className="text-mint-bright">norme che li governano.</span>
          </h2>
          {/* DUE VARIANTI SCRITTE, UNA SCELTA.
              (a) «Verzero non adatta un assistente generico: l'intelligenza
                  che legge i documenti d'impresa è nostra, ed è nata per
                  farlo.»
              (b) quella qui sotto.
              Vince la (b) perché apre affermando invece di negare: la (a)
              mette in testa alla frase quello che NON siamo, e la prima
              cosa che il lettore incontra diventa l'assistente generico.
              La negazione serve ancora — è il confronto che il lettore
              farebbe comunque — ma sta dopo, come precisazione.

              La frase di prima («Non ci appoggiamo a un assistente
              generico a cui si chiede di arrangiarsi: su questo mestiere
              il Motore Ver0 non improvvisa») negava due volte, non
              nominava mai il fatto, e affidava il senso a due metafore —
              «arrangiarsi», «non improvvisa» — che dicono qualcosa solo
              a chi ha già capito. E chiamava in causa il Motore, che
              stiamo riducendo a nome interno. */}
          <p className="mx-auto mt-7 max-w-2xl font-display text-xl leading-snug text-moss md:text-[1.6rem]">
            È un&apos;intelligenza{" "}
            <span className="text-mint-bright">proprietaria</span>, nata per
            questo mestiere: non un assistente generico adattato a svolgerlo.
          </p>

          {/* LA SCENA MADRE: qui il Motore smette di essere raccontato e
              si vede lavorare. È il PROTAGONISTA UNICO della sezione: le
              tre battute che gli stavano sotto e i cinque passi sono
              usciti di qui, perché una sezione con quattro centri non ne
              ha nessuno (brief §2a, §3.2). */}
          <div className="mt-12">
            <MotoreInAzione />
          </div>

          <div className="mt-12">
            <CtaGrande href="/come-funziona" tone="white">
              Guardalo da vicino
            </CtaGrande>
          </div>
        </div>
      </section>

      {/* I CINQUE PASSI, fascia loro.
          Stavano dentro la sezione del Motore, che così aveva quattro
          protagonisti: lo statement, la scena del Motore, tre battute e
          i passi. Una sezione con quattro centri non ne ha nessuno. Qui
          i passi hanno la loro fascia, stretta, e la sezione sopra torna
          ad avere una cosa sola da guardare. */}
      <section className="border-y border-line bg-paper px-5 py-16 md:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-3xl text-center">
            <p className="mb-5 text-[13px] font-semibold uppercase tracking-[0.16em] text-pine">
              Come succede, in cinque passi
            </p>
            <h2 className="font-display text-[2.1rem] leading-[1.04] tracking-[-0.02em] text-ink md:text-[3.2rem]">
              {/* Niente virgola: «dal momento X a quello Y» è un arco
                  continuo, e la virgola lo spezzava a metà. La pausa la
                  dà già l'andata a capo. */}
              Dal momento in cui scrivi{" "}
              <span className="text-pine">a quello in cui ricevi.</span>
            </h2>
          </div>
          <div className="mt-12">
            <AnteprimaPassi />
          </div>
          <div className="mt-12 text-center">
            <CtaGrande href="/come-funziona">Guarda i cinque passi</CtaGrande>
          </div>
        </div>
      </section>

      {/* IL TEAM COME ASSET, non come rassicurazione.
          Prima c'era una fotografia di due persone al lavoro e la riga
          «dietro lo schermo, consulenti veri»: si leggeva come «stai
          tranquillo, c'è anche qualcuno». Ma il team non è la rete di
          sicurezza dell'AI — è la seconda metà del prodotto, e quella che
          si assume la responsabilità.

          VIA LA FOTOGRAFIA. Mostrava persone che non sono le nostre:
          rivendicare un'organizzazione strutturata con l'immagine di
          qualcun altro è esattamente il tipo di prova che non regge. Al
          suo posto le competenze, che sono verificabili.

          NIENTE NOMI, NIENTE VOLTI, NIENTE GEOGRAFIA — la stessa regola
          del profilo del fondatore. E nessuna qualifica che non possiamo
          dimostrare: qui stanno le figure che validano davvero, non un
          organigramma desiderato. */}
      <section className="bg-white px-5 py-16 md:py-24">
        <div className="mx-auto grid max-w-5xl grid-cols-1 items-center gap-12 md:grid-cols-[1fr_1fr]">
          <div>
            <p className="mb-5 text-[13px] font-semibold uppercase tracking-[0.16em] text-pine">
              Chi valida
            </p>
            <h2 className="font-display text-[3rem] leading-[0.98] tracking-[-0.02em] text-ink md:text-[4.2rem]">
              Ogni documento passa
              <span className="block text-pine">da una persona.</span>
            </h2>
            <p className="mt-6 max-w-md text-[15px] leading-relaxed text-gray-warm md:text-base">
              Non un revisore chiamato all&apos;occorrenza: un team di
              professionisti qualificati che valida ogni documento prima che
              esca, e che di quella validazione resta responsabile.
            </p>
            <div className="mt-8">
              <CtaGrande href="/chi-siamo">Conosci chi valida</CtaGrande>
            </div>
          </div>

          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {COMPETENZE_TEAM.map((c) => (
              <li
                key={c}
                className="flex items-start gap-3 rounded-xl border border-line bg-paper/60 px-4 py-4"
              >
                <UserCheck
                  size={17}
                  className="mt-0.5 shrink-0 text-pine"
                  aria-hidden
                />
                <span className="text-[14px] leading-snug text-ink">{c}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* SERVIZI E PREZZI — il cuore della conversione: statement + vetrina. */}
      {/* IL PREZZO COME PRINCIPIO. Qui c'erano due sezioni: la griglia
          del catalogo coi prezzi e il blocco del canone. La griglia se ne
          va — elenco e prezzi per servizio hanno una sola casa, ed è la
          pagina Servizi — e il canone non sparisce ma diventa una delle
          tre prove di questo blocco, altrimenti sarebbe una ripetizione.

          Fondo scuro di proposito: fra «consulenti veri» e «solo standard
          ufficiali» c'era una corsa di cinque sezioni chiare di fila, e
          un manifesto sul prezzo è esattamente il punto in cui la pagina
          deve cambiare respiro. */}
      <section
        id="prezzo"
        className="relative isolate overflow-hidden px-5 py-16 md:py-24"
        style={{
          background: `linear-gradient(to bottom, ${FONDO_SOGLIA[0]}, ${FONDO_SOGLIA[1]})`,
        }}
      >
        <OndaParticelle config={PRESET.tecnica} className="-z-10" />
        <div className="relative">
          <PrezzoPrincipio />
          {/* L'ANNUNCIO DELLA FASE STA QUI, e non più in cima alla home.
              Sopra il claim diceva «non siamo ancora pronti» a chi non
              sapeva ancora che cosa vendiamo. Qui parla a chi ha appena
              letto quanto costa: è il punto in cui «le prime hanno
              condizioni riservate» smette di essere una riserva e
              diventa una ragione per muoversi adesso. */}
          <div className="mt-8 text-center">
            <AnnuncioFase tono="scuro" />
          </div>
        </div>
      </section>

      {/* SIGILLO — registro scuro istituzionale (§11.X). */}
      <section id="sigillo" className="relative isolate overflow-hidden bg-pine-deep px-5 py-16 md:py-24">
        <OndaParticelle config={PRESET.tenueScura} className="-z-10" />
        <div className="relative mx-auto flex max-w-4xl flex-col items-center gap-8 text-center sm:flex-row sm:gap-10 sm:text-left">
          <Sigillo tone="dark" className="h-32 w-32 shrink-0 md:h-40 md:w-40" />
          <div className="min-w-0">
            <h2 className="font-display text-[2.7rem] leading-[0.98] tracking-[-0.02em] text-white md:text-[4.4rem]">
              Il Sigillo non si compra.
              <span className="block text-mint-bright">Si dimostra.</span>
            </h2>
            <p className="mt-4 max-w-lg text-sm text-moss md:text-base">
              Criteri pubblici, dati verificati, QR di controllo. Millesimato:
              ogni anno va riconquistato.
            </p>
            {/* «Solo standard ufficiali» era una sezione a sé, bianca, fra
                il prezzo e il Sigillo. È la stessa promessa che fa il
                Sigillo — un attestato vale se dietro c'è una norma vera —
                e ripeterla due volte a due schermate di distanza la
                indeboliva invece di rafforzarla. Qui è dove serve. */}
            <p className="mt-4 max-w-lg text-sm text-moss/80">
              {SOLO_STANDARD_UFFICIALI}
            </p>
            <div className="mt-7">
              <CtaGrande href="/sigillo" tone="white">
                Scopri il Sigillo
              </CtaGrande>
            </div>
          </div>
        </div>
      </section>

      {/* LISTA D'ATTESA (fascia dedicata): dice una cosa scomoda —
          apriamo a pochi — e la trasforma nella ragione per lasciare il
          contatto. Testi decisi dal fondatore, alla lettera. */}
      <FasciaListaAttesa interesse="home" />
    </>
  );
}
