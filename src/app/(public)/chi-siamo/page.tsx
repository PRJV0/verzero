import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BookMarked,
  Eye,
  Globe,
  Handshake,
  ShieldCheck,
  UserCheck,
  Users,
} from "lucide-react";

import { Sigillo } from "@/components/brand/sigillo";
import { JsonLd } from "@/components/json-ld";
import { OndaParticelle } from "@/components/onda-particelle";
import { GARANZIE } from "@/lib/sicurezza";
import { FONDO_SOGLIA, PRESET } from "@/lib/onda";
import { MotoreInAzione } from "@/components/motore-in-azione";
import { PhotoDuotone } from "@/components/photo-duotone";
import { SOLO_STANDARD_UFFICIALI } from "@/lib/catalog";
import { COMPETENZE_TEAM } from "@/lib/team";
import { SITO, jsonLdBreadcrumb, metadataPagina } from "@/lib/seo";

export const metadata: Metadata = metadataPagina({
  title: "Chi siamo: le persone e l'intelligenza dietro i documenti",
  description:
    "Verzero qualifica le imprese in abbonamento: un'intelligenza proprietaria per i documenti d'impresa, professionisti qualificati che validano, prezzi pubblici.",
  path: "/chi-siamo",
  // Pagina istituzionale: qui il soggetto è Verzero, quindi
  // l'anteprima social porta il marchio e non una fotografia.
  image: SITO.ogMarchio,
});

/**
 * CHI SIAMO — la pagina che si apre per seconda.
 *
 * ═══ PERCHÉ È STATA RIFATTA ═══
 * Diceva «siamo partiti da zero» e «abbiamo ricostruito la consulenza»:
 * una storia d'origine e la promessa di essere un fornitore migliore
 * DENTRO la categoria che l'hero ha appena lasciato. Chi arrivava dalla
 * home leggeva un cambio di modello e qui trovava un cambio di
 * fornitore. Adesso la pagina dichiara la stessa cosa della home — una
 * qualifica che si tiene in abbonamento — e spende il suo spazio sulle
 * due cose che la reggono: l'intelligenza, che è nostra, e le persone,
 * che rispondono di quello che validano.
 *
 * Portava anche tre promesse di tempo («Giorni, non mesi», «pronti in
 * pochi giorni», «tempi che si misurano in giorni»), vietate da SPEC
 * §12.O e sopravvissute a due revisioni perché nessun controllo le
 * cercava. Ora le cerca `scripts/controllo-lessico.mjs`, prima della
 * build.
 *
 * ═══ REGOLA DI TONO (vincolante, decisione del fondatore) ═══
 * La pagina è sempre propositiva. Non si apre mai dal problema, non
 * esistono sezioni negative e non si generalizza mai in negativo sulla
 * categoria dei consulenti: sono partner del modello (v. programma
 * partner), non un bersaglio.
 *
 * ALTRI VINCOLI: nessun claim di primato assoluto, solo formule di
 * identità; nessun dato societario finché la società non esiste; nessun
 * numero inventato — il 53 dei test di isolamento è misurato, lo stampa
 * `scripts/test-rls.mjs`; per il team nessun nome, foto o riferimento
 * personale.
 *
 * ═══ UNA SOLA FOTOGRAFIA, E NON RITRAE PERSONE ═══
 * La sezione del team aveva uno scatto di due persone al lavoro,
 * didascalia «ingegneri e analisti che validano». Non sono le nostre:
 * rivendicare un'organizzazione strutturata con l'immagine di qualcun
 * altro è il tipo di prova che non regge, ed è la stessa correzione già
 * fatta in home. Al suo posto le competenze, che sono verificabili.
 * Resta la filigrana della chiusura, che è un paesaggio.
 *
 * ═══ GRAMMATICA ═══
 * La stessa della home nuova: occhielli a 13px con `tracking-[0.16em]`
 * — sotto quella misura non si vedono e non si capisce in che sezione si
 * è —, titoli-statement in scala da affermazione e non da intestazione,
 * un solo protagonista visivo per sezione, fondi alternati chiaro/scuro
 * con stacco netto.
 */

/** Le quattro regole che il codice fa rispettare da sé. */
const PRINCIPI = [
  {
    icon: BookMarked,
    title: "Solo standard ufficiali",
    desc: SOLO_STANDARD_UFFICIALI,
  },
  {
    icon: ShieldCheck,
    title: "Zero scorciatoie",
    desc: "Il Sigillo Ver0 non si compra: si ottiene con percorsi verificati, e ogni anno va riconquistato.",
  },
  {
    icon: Globe,
    title: "Dati custoditi in Europa",
    desc: "Infrastruttura e documenti dei clienti Verzero risiedono nell'Unione Europea, trattati secondo il GDPR.",
  },
  {
    icon: Eye,
    title: "Prezzi pubblici",
    desc: "Il listino Verzero è pubblico e per fascia dimensionale: chiunque può fare il conto da solo, anche prima di parlarci.",
  },
];

/** Occhiello: unica misura in tutta la pagina, come in home. */
function Occhiello({
  children,
  tono = "chiaro",
}: {
  children: React.ReactNode;
  tono?: "chiaro" | "scuro";
}) {
  return (
    <p
      className={
        "text-[13px] font-semibold uppercase tracking-[0.16em] " +
        (tono === "scuro" ? "text-mint-bright" : "text-pine")
      }
    >
      {children}
    </p>
  );
}

export default function ChiSiamoPage() {
  return (
    <main>
      <JsonLd
        dati={jsonLdBreadcrumb([
          { nome: "Home", path: "/" },
          { nome: "Chi siamo", path: "/chi-siamo" },
        ])}
      />

      {/* 1. LA DICHIARAZIONE — nessuna foto, nessuna card, nessun elenco.
          Il protagonista è la frase, e su fondo scuro con le particelle
          è anche l'unica cosa che si vede. La storia d'origine («siamo
          partiti da zero») è uscita dall'apertura: raccontava noi a
          qualcuno che era venuto a capire che cosa cambia per lui. Lo
          Zero torna in chiusura, dove è una conclusione e non una
          presentazione. */}
      <section
        className="relative isolate overflow-hidden px-5 py-24 md:py-32"
        style={{
          background: `linear-gradient(to bottom, ${FONDO_SOGLIA[0]}, ${FONDO_SOGLIA[1]})`,
        }}
      >
        <OndaParticelle config={PRESET.pacata} className="-z-10" />
        <div className="relative mx-auto max-w-4xl text-center">
          <div className="mb-7">
            <Occhiello tono="scuro">Chi siamo</Occhiello>
          </div>
          <h1 className="font-display text-[2.9rem] leading-[0.98] tracking-[-0.025em] text-white md:text-[4.4rem]">
            La qualifica d&apos;impresa non è un progetto.
            <span className="mt-2 block text-mint-bright">È uno stato.</span>
          </h1>
          <p className="mx-auto mt-8 max-w-[46ch] font-display text-xl leading-snug text-moss md:text-[1.7rem]">
            Verzero lo tiene aggiornato in abbonamento, con due cose costruite
            apposta: un&apos;intelligenza proprietaria per i documenti
            d&apos;impresa, e professionisti qualificati che validano prima
            della consegna.
          </p>
        </div>
      </section>

      {/* 2. LE PERSONE — è qui che arriva chi clicca «Conosci chi valida»
          in home, quindi qui la promessa va onorata con qualcosa in più
          di quattro righe: che cosa vuol dire validare, e che cosa
          resta in capo a chi l'ha fatto. */}
      <section className="bg-white px-5 py-16 md:py-24">
        <div className="mx-auto grid max-w-5xl grid-cols-1 items-center gap-12 md:grid-cols-[1fr_1fr]">
          <div>
            <div className="mb-5">
              <Occhiello>Chi valida</Occhiello>
            </div>
            <h2 className="font-display text-[2.1rem] leading-[1.0] tracking-[-0.02em] text-ink md:text-[4rem]">
              {/* Lo stacco cade dopo «esce» e non dopo «quando»: su
                  schermo stretto «Il documento esce quando» va a capo da
                  sé e lascia «quando» solo su una riga. */}
              Un documento esce
              <span className="block text-pine">
                quando una persona lo convalida.
              </span>
            </h2>
            <p className="mt-6 max-w-md text-[15px] leading-relaxed text-gray-warm md:text-base">
              Il team di Verzero è fatto di professionisti qualificati che
              esaminano ogni elaborato prima che arrivi al cliente e restano
              responsabili di quella validazione. Non è un controllo a
              campione: è il passaggio obbligato di ogni documento.
            </p>
          </div>

          {/* L'elenco su una colonna sola, e la nota sotto di lui.
              A due colonne le quattro voci facevano 157 px contro i 634
              della colonna di testo: un pulviscolo di pillole accanto a
              un'affermazione grande. E la nota sul perché non ci sono
              nomi spiega proprio questo elenco, quindi sta qui e non
              dall'altra parte. */}
          <div>
            <ul className="grid grid-cols-1 gap-3">
              {COMPETENZE_TEAM.map((c) => (
                <li
                  key={c}
                  className="flex items-start gap-3 rounded-xl border border-line bg-paper/60 px-5 py-5"
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
            <p className="mt-6 text-sm leading-relaxed text-gray-warm">
              Nessun nome e nessun volto in questa pagina. Chi ha esaminato un
              documento il cliente lo vede nel portale, sul suo documento, dove
              gli serve: in vetrina servirebbe solo a noi.
            </p>
          </div>
        </div>
      </section>

      {/* 3. L'INTELLIGENZA — stesso occhiello della home, di proposito:
          è la stessa affermazione, e ripeterla con parole diverse su due
          pagine la farebbe sembrare due cose. Qui cambia l'angolo — non
          su che cosa è costruito, ma perché l'abbiamo costruito noi — e
          il dettaglio del metodo resta in /come-funziona.

          NESSUN «COME»: niente soglie, niente modelli, niente schemi di
          estrazione (CLAUDE.md, «metodo sì, mappature no»). */}
      <section
        className="relative isolate overflow-hidden px-5 py-16 md:py-24"
        style={{
          background: `linear-gradient(to bottom, ${FONDO_SOGLIA[0]}, ${FONDO_SOGLIA[1]})`,
        }}
      >
        <OndaParticelle config={PRESET.tecnica} className="-z-10" />
        <div className="relative mx-auto max-w-4xl text-center">
          <div className="mb-6">
            <Occhiello tono="scuro">L&apos;intelligenza è nostra</Occhiello>
          </div>
          <h2 className="font-display text-[2.1rem] leading-[1.06] tracking-[-0.02em] text-white md:text-[4rem]">
            Un motore costruito per{" "}
            <span className="text-mint-bright">un mestiere solo.</span>
          </h2>
          <p className="mx-auto mt-7 max-w-2xl font-display text-xl leading-snug text-moss md:text-[1.6rem]">
            Verzero non si appoggia a un assistente generico: il Motore Ver0
            lavora sui documenti che le imprese hanno già e sulle norme che li
            governano, e ogni dato che propone resta riconducibile alla riga da
            cui viene.
          </p>

          <div className="mt-12">
            <MotoreInAzione />
          </div>

          <p className="mx-auto mt-10 max-w-xl text-sm leading-relaxed text-moss/70">
            Il metodo per esteso — che cosa leggiamo, con che mandato, chi
            valida — sta in{" "}
            <Link
              href="/come-funziona"
              className="font-semibold text-mint-bright hover:underline"
            >
              come funziona
            </Link>
            .
          </p>
        </div>
      </section>

      {/* 4. I PRINCIPI — quattro regole, e ognuna ha un pezzo di codice o
          un controllo che la fa rispettare. Il titolo lo dice: sono
          regole, non intenzioni. */}
      <section className="relative bg-moss px-5 py-16 md:py-24">
        <div className="mx-auto max-w-4xl">
          <div className="mb-5">
            <Occhiello>Come stiamo in piedi</Occhiello>
          </div>
          <h2 className="max-w-3xl font-display text-[2rem] leading-[1.04] tracking-[-0.02em] text-ink md:text-[3.6rem]">
            Quattro regole che valgono
            <span className="block text-pine">anche quando costano.</span>
          </h2>
          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {PRINCIPI.map((p) => {
              const Icon = p.icon;
              return (
                <article
                  key={p.title}
                  className="vz-reveal rounded-2xl bg-white p-6 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-lift"
                >
                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-moss text-pine">
                    <Icon size={20} />
                  </span>
                  <h3 className="mt-4 font-display text-xl text-ink">
                    {p.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-gray-warm">
                    {p.desc}
                  </p>
                </article>
              );
            })}
          </div>
          <Link
            href="/servizi"
            className="mt-8 inline-flex items-center gap-1.5 text-sm font-semibold text-pine hover:underline"
          >
            Il listino, per intero <ArrowRight size={15} />
          </Link>
        </div>
      </section>

      {/* 5. SICUREZZA — i principi qui, i dettagli tecnici nella pagina
          dedicata. Le garanzie si dichiarano, l'implementazione no
          (CLAUDE.md, «trasparenza vs riservatezza»). */}
      <section className="bg-paper px-5 py-16 md:py-24">
        <div className="mx-auto max-w-4xl">
          <div className="mb-5">
            <Occhiello>Sicurezza e riservatezza</Occhiello>
          </div>
          <h2 className="font-display text-[2rem] leading-[1.04] tracking-[-0.02em] text-ink md:text-[3.6rem]">
            I tuoi documenti restano tuoi.
          </h2>
          <div className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {GARANZIE.map((g) => (
              <article
                key={g.titolo}
                className="rounded-2xl border border-line bg-white p-5"
              >
                <h3 className="font-display text-xl leading-tight text-ink">
                  {g.titolo}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-warm">
                  {g.punti[0]}
                </p>
              </article>
            ))}
          </div>
          <p className="mt-6 rounded-2xl border-2 border-mint/40 bg-mint/5 px-5 py-4 text-sm leading-relaxed text-pine-dark">
            <strong className="font-semibold">
              L&apos;isolamento fra imprese è coperto da 53 test automatici
            </strong>
            , eseguiti a ogni rilascio: se ne fallisce uno, il rilascio si
            ferma.
          </p>
          <Link
            href="/sicurezza"
            className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-pine hover:underline"
          >
            I dettagli tecnici <ArrowRight size={15} />
          </Link>
        </div>
      </section>

      {/* 6. IL PROGRAMMA PARTNER — sta in questa pagina e non nel menu
          perché parla a un pubblico diverso: i consulenti, non le
          imprese. Ed è il posto in cui la regola di tono diventa
          concreta — sono partner del modello, e questa sezione è la
          prova che non sono un bersaglio. */}
      <section className="bg-white px-5 py-16 md:py-24">
        <div className="mx-auto max-w-4xl">
          <div className="mb-5">
            <Occhiello>Per commercialisti e consulenti</Occhiello>
          </div>
          <h2 className="font-display text-[2rem] leading-[1.04] tracking-[-0.02em] text-ink md:text-[3.6rem]">
            Il lavoro documentale lo facciamo noi.
            <span className="block text-pine">La relazione resta tua.</span>
          </h2>
          <p className="mt-6 max-w-2xl text-[15px] leading-relaxed text-gray-warm md:text-base">
            Se segui delle imprese, puoi portarle su Ver0 e restare tu il
            riferimento.
          </p>
          <div className="mt-9 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {[
              {
                icona: Users,
                t: "Una dashboard multi-cliente",
                d: "Un solo accesso, il selettore per passare da un'impresa all'altra. Vedi solo le imprese che ti hanno dato il mandato, e solo finché è attivo.",
              },
              {
                icona: Handshake,
                t: "Lo stesso impianto per ogni cliente",
                d: "Percorsi standardizzati, documenti conformi alle norme citate, ogni dato riconducibile alla sua fonte. Condizioni dedicate ai partner, su richiesta.",
              },
              {
                icona: ShieldCheck,
                t: "La responsabilità resta nostra",
                d: "I documenti li produce e li valida il team tecnico di Verzero. Tu non ti assumi niente al posto nostro.",
              },
            ].map(({ icona: Icona, t: titolo, d }) => (
              <article
                key={titolo}
                className="vz-reveal rounded-2xl border border-line/70 bg-white p-5 shadow-soft"
              >
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-moss text-pine">
                  <Icona size={19} />
                </span>
                <h3 className="mt-3 font-display text-xl text-pine">{titolo}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-warm">{d}</p>
              </article>
            ))}
          </div>
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

      {/* 7. LA CHIUSURA — il Sigillo come prova, e solo alla fine il nome.
          La riga sullo Zero è la frase migliore della pagina e sta in
          fondo di proposito: dopo che si è visto che cosa facciamo, dire
          da dove viene il nome è una conclusione; all'inizio sarebbe
          stata una presentazione. */}
      <section className="relative overflow-hidden bg-pine-deep px-5 py-16 text-center md:py-24">
        {/* LA FILIGRANA VA POSIZIONATA DA FUORI, non passando `absolute`
            a `PhotoDuotone`: quel componente ha `relative` nella propria
            classe base, e fra due utilità di `position` vince l'ordine
            del foglio di stile, non quello scritto nell'attributo. Qui
            vinceva `relative`, quindi la foto non era una filigrana —
            era una fascia di 223 px nel flusso che spingeva giù il
            sigillo e il titolo. Non dava errore: sembrava solo una
            sezione con troppo spazio vuoto in cima. */}
        <div aria-hidden className="absolute inset-0 opacity-15">
          <PhotoDuotone src="/photos/sito4.jpg" className="h-full w-full" />
        </div>
        <div aria-hidden className="absolute inset-0 bg-pine-deep/70" />
        <div className="relative mx-auto max-w-3xl">
          <div className="mb-7 flex justify-center">
            <Sigillo tone="dark" className="h-24 w-24" />
          </div>
          <h2 className="font-display text-[2.1rem] leading-[1.04] tracking-[-0.02em] text-white md:text-[3.8rem]">
            Il metodo non si racconta.
            <span className="block text-mint-bright">Si dimostra.</span>
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-sm leading-relaxed text-moss md:text-base">
            Per questo esiste il Sigillo Ver0: criteri pubblici, dati
            verificati, millesimo che ogni anno va riconquistato. Quello che
            Verzero promette qui, lì diventa controllabile da chiunque.
          </p>
          <div className="mt-8 flex justify-center">
            <Link
              href="/sigillo"
              className="vz-press inline-flex items-center gap-2 rounded-xl bg-white px-7 py-4 text-base font-semibold text-pine hover:-translate-y-0.5"
            >
              Scopri il Sigillo <ArrowRight size={18} />
            </Link>
          </div>
          <p className="mx-auto mt-14 max-w-2xl border-t border-white/15 pt-10 font-display text-[1.4rem] leading-snug text-moss md:text-[1.9rem]">
            Ci chiamiamo Ver0 per un principio solo, lo Zero, che torna in ogni
            promessa. Lo Zero, da noi, non è il niente — è il traguardo.
          </p>
        </div>
      </section>
    </main>
  );
}
