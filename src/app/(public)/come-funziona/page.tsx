import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookMarked, UserCheck } from "lucide-react";

import { DocumentoEsito } from "@/components/documento-esito";
import { GuidaPassi } from "@/components/guida-passi";
import { JsonLd } from "@/components/json-ld";
import { MotoreInAzione } from "@/components/motore-in-azione";
import { OndaParticelle } from "@/components/onda-particelle";
import { QualitaOutput } from "@/components/qualita-output";
import { SOLO_STANDARD_UFFICIALI } from "@/lib/catalog";
import { FONDO_SOGLIA, PRESET } from "@/lib/onda";
import { SITO, jsonLdBreadcrumb, metadataPagina } from "@/lib/seo";

export const metadata: Metadata = metadataPagina({
  title: "Come funziona: l'AI Ver0, i documenti, la validazione",
  description:
    "Il metodo fase per fase: cosa legge la nostra AI proprietaria, come resta tracciata ogni fonte, chi valida prima della consegna, com'è fatto il documento.",
  path: "/come-funziona",
  // Pagina istituzionale: qui il soggetto è Verzero, quindi
  // l'anteprima social porta il marchio e non una fotografia.
  image: SITO.ogMarchio,
});

/**
 * LE FASI DEL METODO — generiche per scelta.
 *
 * Gli esempi restano al livello di «bollette o visure»: mai la mappatura
 * documento → norma → sezione, che è il modo in cui lavoriamo e non un
 * contenuto da vetrina (regola in CLAUDE.md). Chi attiva la trova nel
 * portale, costruita sul suo percorso.
 */
const FASI = [
  {
    titolo: "Attivi il percorso",
    testo:
      "Scegli il percorso dal listino pubblico: prezzo e perimetro sono scritti prima di iniziare. All'attivazione ci dai il mandato per interrogare le banche dati ufficiali al posto tuo — ed è revocabile quando vuoi.",
  },
  {
    titolo: "Ti chiediamo quello che serve, e solo quello",
    testo:
      "La raccolta è guidata: il portale ti chiede i documenti che il tuo percorso richiede — di norma documenti che hai già in azienda, come bollette o visure — e ti dice quali mancano. La lista precisa la vedi lì, costruita sul percorso che hai attivato.",
  },
  {
    titolo: "La nostra AI proprietaria legge, incrocia e compone",
    testo:
      "Estrae i dati dai tuoi documenti, li confronta con le fonti ufficiali e segnala ciò che non torna. Ogni valore resta legato alla sua origine: quale documento, quale banca dati, quale calcolo. Dove un dato è stimato, nel documento è scritto che è una stima.",
  },
  {
    titolo: "Un professionista valida, e ci mette il nome",
    testo:
      "Nessun documento esce senza il controllo di una persona del team tecnico, che verifica perimetro, criteri e completezza e mette per iscritto i rilievi. La responsabilità resta di chi firma la verifica, dentro la piattaforma.",
  },
  {
    titolo: "Quando la norma cambia, il documento si aggiorna",
    testo:
      "Gli standard evolvono: seguiamo le revisioni e rivediamo i documenti interessati. Quello che hai in mano non invecchia nel cassetto — ed è compreso nel canone, non un intervento a parte.",
  },
];

/**
 * /come-funziona — la casa del metodo (SPEC §12.J).
 *
 * STESSA GRAMMATICA DELLA HOME, non un secondo schema: chi arriva da lì
 * deve riconoscere il sistema — tu porti, la nostra AI lavora, tu ricevi
 * — e trovarci sotto quello che in home non c'era. Lo schema è LO STESSO
 * COMPONENTE, con il livello di dettaglio acceso.
 *
 * VINCOLO (CLAUDE.md): metodo e risultato sì, mappature operative no. Qui
 * c'era il fascicolo per percorso — quali documenti servono per il
 * carbon, quali per la 9001 — ed era know-how regalato: al suo posto le
 * fasi, con esempi generici e non esaustivi. La lista precisa vive nel
 * portale, dopo l'attivazione.
 *
 * Ritmo chiaro/scuro/chiaro come in home, e nelle sezioni scure il
 * fascio luminoso — la stessa implementazione, calibrata.
 */
export default function ComeFunzionaPage() {
  return (
    <main>
      <JsonLd
        dati={jsonLdBreadcrumb([
          { nome: "Home", path: "/" },
          { nome: "Come funziona", path: "/come-funziona" },
        ])}
      />

      {/* Apertura: qui si spiega, e lo si dichiara. */}
      <section className="bg-moss px-5 py-16 md:py-24">
        <div className="mx-auto max-w-3xl text-center">
          <p className="mb-4 text-xs font-semibold tracking-widest text-pine">
            COME FUNZIONA
          </p>
          <h1 className="font-display text-5xl leading-[1.02] text-pine-dark md:text-6xl">
            Non è un assistente. È un&apos;intelligenza costruita per questo.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-pine">
            Un&apos;AI proprietaria specializzata sui documenti d&apos;impresa e
            sulle norme che li governano: legge quello che hai, compone quello
            che serve, un professionista valida. Qui vedi il lavoro da vicino.
          </p>
        </div>
      </section>

      {/* LA GUIDA IN CINQUE PASSI — la sezione principale della pagina,
          e sta per prima di proposito: prima di raccontare com'è fatto il
          sistema, si mostra che cosa succede a chi lo usa. Chi arriva qui
          non ha chiesto un'architettura, ha chiesto «e quindi?». */}
      <section
        aria-labelledby="guida-passi"
        className="border-b border-line bg-white py-16 md:py-24"
      >
        <div className="mx-auto mb-12 max-w-3xl px-5 text-center">
          <p className="mb-4 text-xs font-semibold tracking-widest text-pine">
            DAL TUO PUNTO DI VISTA
          </p>
          <h2
            id="guida-passi"
            className="font-display text-4xl leading-[1.05] text-ink md:text-5xl"
          >
            Cinque passi, dall&apos;inizio alla consegna.
          </h2>
        </div>
        <GuidaPassi />

        {/* UNA SOLA CTA, e porta al catalogo: chi ha appena visto i
            cinque passi ha una domanda sola, «e quanto costa». */}
        <div className="mt-14 flex justify-center px-5">
          <Link
            href="/servizi"
            className="vz-press inline-flex items-center gap-2 rounded-xl bg-pine px-7 py-4 text-base font-semibold text-white hover:-translate-y-0.5"
          >
            Guarda i percorsi <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* LO SCHEMA DEL SISTEMA, lo stesso della home, con il dettaglio
          che qui si può aprire. */}
      <section
        className="relative isolate overflow-hidden px-5 py-16 md:py-24"
        style={{
          background: `linear-gradient(to bottom, ${FONDO_SOGLIA[0]}, ${FONDO_SOGLIA[1]})`,
        }}
      >
        <OndaParticelle config={PRESET.tecnica} className="-z-10" />
        <div className="relative mx-auto mb-10 max-w-3xl text-center">
          <p className="mb-4 text-xs font-semibold tracking-widest text-mint-bright">
            IL SISTEMA
          </p>
          <h2 className="font-display text-4xl leading-[1.05] text-white md:text-5xl">
            Lo stesso schema, per ogni percorso.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-moss/75">
            Ogni blocco si apre: dentro c&apos;è il metodo, non le nostre
            regole interne.
          </p>
        </div>
        <div className="relative">
          <MotoreInAzione dettaglio />
        </div>
      </section>

      {/* IL METODO, FASE PER FASE.
          Qui c'era il fascicolo per percorso: quali documenti servono per
          il carbon, quali per la 9001, con le sezioni che ognuno alimenta.
          È know-how operativo, ed era regalato a chiunque passasse. La
          lista precisa esiste ancora, ma dove serve davvero: nel portale,
          costruita sul percorso attivato. Qui resta il metodo — come
          lavoriamo e cosa ne esce — con esempi generici e non esaustivi. */}
      <section className="bg-paper px-5 py-16 md:py-24">
        <div className="mx-auto max-w-4xl">
          <div className="mb-10 text-center">
            <p className="mb-4 text-xs font-semibold tracking-widest text-pine">
              IL METODO
            </p>
            <h2 className="font-display text-4xl leading-[1.05] text-ink md:text-5xl">
              Come lavoriamo, fase per fase.
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-gray-warm">
              Lo stesso impianto per ogni percorso: cambia la norma, non il
              modo di lavorare.
            </p>
          </div>
          <ol className="space-y-3">
            {FASI.map((f, i) => (
              <li
                key={f.titolo}
                className="flex gap-4 rounded-2xl border border-line bg-white p-5 sm:gap-5 sm:p-6"
              >
                <span
                  aria-hidden
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-moss font-display text-lg tabular-nums text-pine"
                >
                  {i + 1}
                </span>
                <div className="min-w-0">
                  <h3 className="font-display text-2xl leading-tight text-ink">
                    {f.titolo}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-gray-warm">
                    {f.testo}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* IL DOCUMENTO CHE RICEVI — prima si vede, poi si legge com'è
          fatto. In home lo stesso mockup sta dentro la terza fase del
          flusso; qui ha lo spazio per essere guardato. */}
      <section className="bg-white px-5 py-16 md:py-24">
        <div className="mx-auto max-w-5xl">
          <div className="mx-auto max-w-2xl text-center">
            <p className="mb-4 text-xs font-semibold tracking-widest text-pine">
              TU RICEVI
            </p>
            <h2 className="font-display text-4xl leading-[1.05] text-ink md:text-5xl">
              Un documento, non una scheda.
            </h2>
            <p className="mx-auto mt-4 text-sm leading-relaxed text-gray-warm">
              Impaginato, con l&apos;indice, il riferimento normativo del
              percorso, i dati in tabella e la pagina di validazione firmata da
              chi l&apos;ha controllato.
            </p>
          </div>
          <div className="mt-10 grid grid-cols-1 items-start gap-10 lg:grid-cols-[minmax(0,26rem)_1fr]">
            <DocumentoEsito tono="chiaro" grande />
            {/* Versione compatta: accanto al mockup la colonna è stretta,
                e le card a tre colonne diventerebbero sei parole a capo. */}
            <QualitaOutput compatto />
          </div>
        </div>
      </section>

      {/* La validazione umana e il principio delle norme: i due pilastri del metodo */}
      <section className="bg-white px-5 py-16">
        <div className="mx-auto grid max-w-4xl grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="border-2 border-line p-6">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-moss text-pine">
              <UserCheck size={20} />
            </span>
            <h2 className="mt-4 font-display text-2xl text-ink">
              La responsabilità resta di persone
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-gray-warm">
              Nessun documento viene emesso senza una verifica umana, e ogni
              verifica porta il nome di chi l&apos;ha fatta. Le elaborazioni
              dell&apos;AI Ver0 sono sempre dichiarate.
            </p>
            <Link
              href="/chi-siamo"
              className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-pine hover:underline"
            >
              Conosci chi verifica <ArrowRight size={15} />
            </Link>
          </div>
          <div className="border-2 border-line p-6">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-moss text-pine">
              <BookMarked size={20} />
            </span>
            <h2 className="mt-4 font-display text-2xl text-ink">
              Solo standard ufficiali
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-gray-warm">
              {SOLO_STANDARD_UFFICIALI} Ogni documento cita la norma su cui è
              costruito, riga per riga.
            </p>
            <Link
              href="/sigillo"
              className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-pine hover:underline"
            >
              Come si dimostra: il Sigillo <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </section>

      {/* CTA finale: dal metodo al catalogo. */}
      <section className="border-t-2 border-line bg-white px-5 py-16 text-center">
        <h2 className="font-display text-4xl text-ink md:text-5xl">
          Visto il metodo, scegli il percorso.
        </h2>
        <p className="mx-auto mt-3 max-w-lg text-sm text-gray-warm">
          Ogni pagina servizio dichiara prezzo, perimetro e cosa produce.
          Quando attivi, il portale ti chiede esattamente i documenti che
          servono a quel percorso.
        </p>
        <div className="mt-7 flex justify-center">
          <Link
            href="/servizi"
            className="vz-press inline-flex items-center gap-2 rounded-xl bg-pine px-7 py-4 text-base font-semibold text-white hover:-translate-y-0.5"
          >
            Calcola il prezzo <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    </main>
  );
}
