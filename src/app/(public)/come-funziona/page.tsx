import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookMarked, UserCheck } from "lucide-react";

import { DocumentoEsito } from "@/components/documento-esito";
import { GuidaPassi, type VetrinaGuida } from "@/components/guida-passi";
import { JsonLd } from "@/components/json-ld";
import { MotoreInAzione } from "@/components/motore-in-azione";
import { QualitaOutput } from "@/components/qualita-output";
import { SOLO_STANDARD_UFFICIALI, getServizio } from "@/lib/catalog";
import { prezzoDa } from "@/lib/pricing";
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
      "Nessun documento esce senza il controllo di una persona del team tecnico, che verifica perimetro, criteri e completezza e mette per iscritto i rilievi. La responsabilità resta di chi lo ha validato, e resta tracciata dentro la piattaforma.",
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
/**
 * QUELLO CHE SI VEDE DENTRO I MOCKUP della guida.
 *
 * Nomi dal catalogo, prezzi dal listino: si costruisce QUI, sul server,
 * e si passa al componente. Due ragioni, e valgono entrambe. La prima è
 * la regola: nessun prezzo scritto a mano nelle pagine, e un prezzo
 * dentro un mockup è comunque un prezzo scritto in una pagina. La
 * seconda è il peso: la guida è un componente client, e importarci il
 * catalogo vorrebbe dire spedirlo intero a chi apre questa pagina.
 */
function vetrinaGuida(): VetrinaGuida {
  const scelti = [
    "bilancio-sostenibilita-vsme-base",
    "carbon-footprint-scope-1-2",
    "percorso-ver0",
  ];
  const risultati = scelti.map((slug) => {
    const s = getServizio(slug);
    return {
      nome: s?.name ?? "",
      taglio: s?.taglio ?? "",
      prezzo: prezzoDa(slug) ?? "",
      // La riga di beneficio è quella del catalogo, parola per parola:
      // due formulazioni della stessa cosa sono due promesse diverse.
      riga: s?.short ?? "",
    };
  });
  const primo = getServizio(scelti[0]!);
  return {
    risultati,
    scheda: {
      nome: primo?.name ?? "",
      taglio: primo?.taglio ?? "",
      prezzo: prezzoDa(scelti[0]!) ?? "",
      // I primi tre di `output`, che è quello che la scheda del servizio
      // dichiara di produrre: non una lista scritta per il mockup.
      copre: (primo?.output ?? []).slice(0, 4).map((r) => r.split(/[,(—]/)[0]!.trim()),
    },
  };
}

export default function ComeFunzionaPage() {
  return (
    <main>
      <JsonLd
        dati={jsonLdBreadcrumb([
          { nome: "Home", path: "/" },
          { nome: "Come funziona", path: "/come-funziona" },
        ])}
      />

      {/* ── L'APERTURA, IN VOCE DIDATTICA ────────────────────────────
          Il titolo è un'ENUMERAZIONE TERNARIA, e non è una scelta di
          gusto: diceva «Non è un assistente. È un'intelligenza costruita
          per questo» — negazione più affermazione, la stessa identica
          figura che apriva /chi-siamo e la pagina del Sigillo. Tre
          pagine su otto con la stessa mossa. Qui l'enumerazione fa anche
          il lavoro giusto per questa pagina: dichiara l'indice di quello
          che si sta per vedere, che è come si apre una dimostrazione.

          Fondo CARTA e non salvia, e testo a sinistra: da qui in giù la
          pagina non cambia più colore fino ai cinque passi. */}
      <section className="bg-paper px-5 pb-12 pt-16 md:pb-16 md:pt-20">
        <div className="mx-auto max-w-4xl">
          <p className="text-[13px] font-semibold uppercase tracking-[0.16em] text-pine">
            Come funziona
          </p>
          <h1 className="mt-6 max-w-[18ch] font-display text-[2.4rem] leading-[1.06] tracking-[-0.02em] text-ink md:text-[3.6rem]">
            Che cosa leggiamo, chi lo verifica,{" "}
            <span className="text-pine">che cosa ricevi.</span>
          </h1>
          <p className="mt-7 max-w-[62ch] text-[17px] leading-[1.7] text-gray-warm">
            Un&apos;intelligenza artificiale proprietaria, specializzata sui
            documenti d&apos;impresa e sulle norme che li governano: legge
            quello che hai, compone quello che serve, un professionista valida.
            Questa pagina non lo racconta — lo mostra, nell&apos;ordine in cui
            succede.
          </p>
        </div>
      </section>

      {/* LA GUIDA IN CINQUE PASSI — la sezione principale della pagina,
          e sta per prima di proposito: prima di raccontare com'è fatto il
          sistema, si mostra che cosa succede a chi lo usa. Chi arriva qui
          non ha chiesto un'architettura, ha chiesto «e quindi?». */}
      {/* ── L'UNICO MOMENTO SCURO DELLA PAGINA ───────────────────────
          È la dimostrazione vera e propria, ed è l'unica cosa che questa
          pagina fa meglio di ogni altra: quindi si stacca. Il pino
          profondo qui non è decorazione — le cinque schermate sono
          finestre bianche, e su fondo scuro staccano dalla pagina invece
          di confondersi con essa. Tutto il resto della pagina resta
          chiaro, così questo blocco si vede da lontano nello
          scorrimento. */}
      <section
        aria-labelledby="guida-passi"
        className="bg-pine-deep py-16 md:py-24"
      >
        <div className="mx-auto mb-12 max-w-4xl px-5">
          <p className="text-[13px] font-semibold uppercase tracking-[0.16em] text-mint-bright">
            Dal tuo punto di vista
          </p>
          <h2
            id="guida-passi"
            className="mt-5 max-w-[20ch] font-display text-[2.2rem] leading-[1.06] tracking-[-0.02em] text-white md:text-[3.4rem]"
          >
            Cinque passi, dall&apos;inizio alla consegna.
          </h2>
        </div>
        <GuidaPassi vetrina={vetrinaGuida()} tono="scuro" />

        {/* UNA SOLA CTA, e porta al catalogo: chi ha appena visto i
            cinque passi ha una domanda sola, «e quanto costa». */}
        <div className="mt-14 flex justify-center px-5">
          <Link
            href="/servizi"
            className="vz-press inline-flex items-center gap-2 rounded-xl bg-white px-7 py-4 text-base font-semibold text-pine hover:-translate-y-0.5"
          >
            Guarda i percorsi <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* LO SCHEMA DEL SISTEMA, lo stesso della home, con il dettaglio
          che qui si può aprire. */}
      {/* LO SCHEMA DEL SISTEMA — la FIGURA di un testo didattico.
          Era una seconda fascia scura a tutta larghezza con le
          particelle: due fasce scure su una pagina che ne deve avere
          UNA, e il fascio di particelle in una pagina che deve
          dimostrare invece di impressionare. `MotoreInAzione` resta
          scuro perché è costruito così, ma adesso è un RIQUADRO dentro
          una sezione chiara — cioè una figura in mezzo al testo, con la
          sua didascalia — e non un cambio di scena. */}
      <section className="bg-paper px-5 py-16 md:py-24">
        <div className="mx-auto max-w-4xl">
          <p className="text-[13px] font-semibold uppercase tracking-[0.16em] text-pine">
            Il sistema
          </p>
          <h2 className="mt-5 max-w-[20ch] font-display text-[2rem] leading-[1.1] tracking-[-0.02em] text-ink md:text-[3rem]">
            Lo stesso schema, per ogni percorso.
          </h2>
          <p className="mt-6 max-w-[62ch] text-[17px] leading-[1.7] text-gray-warm">
            Cambia la norma, non il modo di lavorare. Ogni blocco dello schema
            si apre: dentro c&apos;è il metodo, non le nostre regole interne.
          </p>
        </div>
        <div className="mx-auto mt-10 max-w-6xl overflow-hidden rounded-3xl bg-pine-deep px-5 py-12 md:py-16">
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
      <section className="bg-paper px-5 pb-16 md:pb-24">
        <div className="mx-auto max-w-4xl">
          <div className="mb-10">
            <span aria-hidden className="mb-8 block h-px w-full bg-line" />
            <p className="text-[13px] font-semibold uppercase tracking-[0.16em] text-pine">
              Il metodo
            </p>
            <h2 className="mt-5 max-w-[20ch] font-display text-[2rem] leading-[1.1] tracking-[-0.02em] text-ink md:text-[3rem]">
              Come lavoriamo, fase per fase.
            </h2>
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
      <section className="bg-paper px-5 pb-16 md:pb-24">
        <div className="mx-auto max-w-5xl">
          <div className="max-w-4xl">
            <span aria-hidden className="mb-8 block h-px w-full bg-line" />
            <p className="text-[13px] font-semibold uppercase tracking-[0.16em] text-pine">
              Tu ricevi
            </p>
            <h2 className="mt-5 max-w-[20ch] font-display text-[2rem] leading-[1.1] tracking-[-0.02em] text-ink md:text-[3rem]">
              Un documento, non una scheda.
            </h2>
            <p className="mt-6 max-w-[62ch] text-[17px] leading-[1.7] text-gray-warm">
              Impaginato, con l&apos;indice, il riferimento normativo del
              percorso, i dati in tabella e la pagina di validazione a nome di
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
      <section className="bg-paper px-5 pb-20 md:pb-28">
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

      {/* NESSUNA CTA IN FONDO ALLA PAGINA, ed è una scelta.
          Ce n'era una — «Visto il metodo, scegli il percorso» — identica
          per destinazione e per senso a quella che chiude i cinque
          passi, quattro sezioni più su. Due inviti allo stesso posto
          sulla stessa pagina non raddoppiano le probabilità che qualcuno
          li segua: dicono che non sapevamo dove metterne uno. La
          chiusura è quella della guida, che è la sezione principale. */}
    </main>
  );
}
