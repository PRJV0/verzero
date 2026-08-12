import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  QrCode,
  ScrollText,
  CalendarClock,
  ShieldCheck,
} from "lucide-react";

import { Sigillo } from "@/components/brand/sigillo";
import { TargaVerifica } from "@/components/brand/targa";
import { JsonLd } from "@/components/json-ld";
import { SigilloScrolly } from "@/components/sigillo-scrolly";
import { jsonLdBreadcrumb, jsonLdFaq, metadataPagina } from "@/lib/seo";

export const metadata: Metadata = metadataPagina({
  title: "Il Sigillo Ver0: non si compra, si dimostra",
  description:
    "Il marchio di verifica Ver0: criteri pubblici, dati validati da persone, QR di verifica e millesimo annuale. Coerente con la direttiva UE 2024/825.",
  path: "/sigillo",
});

const PERCORSI = [
  "Carbon footprint con le categorie obbligatorie confermate",
  "Bilancio di Sostenibilità (VSME) completo e validato",
  "Sistema di gestione ISO completato (famiglia certificabile)",
  "Fascicolo UNI/PdR 125 pronto per l'audit",
  "Check-up energetico con monitoraggio attivo",
];

const VERIFICA = [
  {
    icon: QrCode,
    title: "Un QR su ogni Sigillo",
    desc: "Il Sigillo millesimato porterà un QR che apre la pagina pubblica di verifica dell'impresa. Chiunque — una banca, un capofiliera, una stazione appaltante — potrà controllare in un istante.",
  },
  {
    icon: ScrollText,
    title: "Una pagina pubblica, senza login",
    desc: "Ragione sociale, P.IVA, settore, livello e anno, metodologia, data di verifica e di scadenza, link ai criteri pubblici e un canale per segnalare usi impropri. Nient'altro: privacy by design.",
  },
  {
    icon: BadgeCheck,
    title: "Un kit grafico ufficiale",
    desc: "All'impresa qualificata forniremo il Sigillo in versione colore e monocromatica, con il QR che rimanda alla sua pagina di verifica. Da usare su sito, offerte e documenti.",
  },
];

/** Domande vere, con risposte già presenti in pagina: il markup FAQPage
 *  descrive contenuto visibile, mai contenuto inventato per il motore. */
const DOMANDE = [
  {
    domanda: "Il Sigillo Ver0 è una certificazione?",
    risposta:
      "No. È il marchio di verifica della piattaforma: attesta percorsi completati e validati dal team tecnico. Le certificazioni di norma le rilasciano esclusivamente gli enti terzi accreditati; Verzero prepara e accompagna.",
  },
  {
    domanda: "Il Sigillo si può comprare?",
    risposta:
      "No. Non è mai una voce di prezzo: si ottiene completando percorsi qualificanti con criteri pubblici, e i dati vengono verificati prima del rilascio.",
  },
  {
    domanda: "Quanto dura il Sigillo?",
    risposta:
      "Dodici mesi. Porta l'anno di rilascio e alla scadenza decade: chi lo espone è verificato oggi, non una volta nel passato.",
  },
  {
    domanda: "Chi può verificare un Sigillo?",
    risposta:
      "Chiunque, senza login: il QR sul Sigillo apre la pagina pubblica di verifica dell'impresa, con ambito, anno, metodologia e data della verifica.",
  },
];

export default function SigilloPage() {
  return (
    <main>
      <JsonLd
        dati={jsonLdBreadcrumb([
          { nome: "Home", path: "/" },
          { nome: "Il Sigillo", path: "/sigillo" },
        ])}
      />
      <JsonLd dati={jsonLdFaq(DOMANDE)} />
      {/* Hero — registro scuro istituzionale (§11.X): pino profondo, sigillo
          tono-su-tono bianco con segmento menta acceso. */}
      <section className="bg-pine-deep px-5 py-16 text-center">
        <div className="mb-6 flex justify-center">
          <Sigillo tone="dark" className="h-28 w-28" />
        </div>
        <p className="mb-4 text-xs font-semibold tracking-widest text-mint-bright">
          IL MARCHIO DI VERIFICA
        </p>
        <h1 className="mx-auto max-w-2xl font-display text-5xl leading-[1.05] text-white md:text-6xl">
          Il Sigillo non si compra.{" "}
          <em className="text-mint-bright">Si dimostra.</em>
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-sm text-moss">
          È il marchio di verifica della piattaforma, esposto dalle aziende che
          raggiungono i criteri. Criteri pubblici, dati verificati da persone,
          revocabilità: costruito in coerenza con la direttiva UE 2024/825
          contro il greenwashing.
        </p>
      </section>

      {/* Cos'è */}
      <section className="bg-white px-5 py-16">
        <div className="mx-auto max-w-3xl">
          <h2 className="font-display text-4xl text-ink md:text-5xl">
            Una qualifica, non un logo
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-gray-warm">
            Attraverso i servizi Ver0 le imprese ottengono qualcosa che vale al
            di fuori della piattaforma: reputazione, attendibilità e
            riconoscimento davanti a banche, clienti capofiliera e stazioni
            appaltanti. Il Sigillo rende quella qualifica — lo status{" "}
            <strong className="font-semibold text-pine">Impresa Ver0</strong> —
            leggibile e verificabile da chiunque, in un colpo d&apos;occhio. Non
            è il timbro di un&apos;intenzione: è l&apos;evidenza di un lavoro
            fatto e controllato dal team tecnico. Verzero prepara e accompagna;
            le certificazioni di norma le rilasciano gli enti terzi accreditati.
          </p>
        </div>
      </section>

      {/* Scala multi-percorso */}
      <section className="bg-paper px-5 py-16">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center font-display text-4xl text-ink md:text-5xl">
            Un solo Sigillo, più strade per meritarlo
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-sm text-gray-warm">
            La scala è multi-percorso: si sale completando percorsi qualificanti,
            ognuno con criteri pubblici e mai a pagamento. Più percorsi
            verificati = più ambiti sulla stessa pagina di verifica, mai Sigilli
            multipli.
          </p>

          <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* Livello 1 */}
            <div className="rounded-2xl bg-white p-5 shadow-soft">
              <span className="inline-flex items-center gap-2 rounded-full bg-moss px-3 py-1 text-xs font-medium text-pine">
                <ShieldCheck size={14} /> Livello 1
              </span>
              <p className="mt-3 font-display text-xl text-ink">
                Percorso verificato
              </p>
              <p className="mt-2 text-sm text-gray-warm">
                Si ottiene completando almeno un percorso qualificante con la
                validazione del team tecnico. La dicitura sotto il Sigillo dice
                quale ambito è verificato (es. «dati verificati — carbon»); la
                pagina pubblica elenca quali ambiti e da quando.
              </p>
              <p className="mt-4 text-xs font-medium text-pine">
                Percorsi qualificanti
              </p>
              <ul className="mt-2 space-y-1.5">
                {PERCORSI.map((p) => (
                  <li
                    key={p}
                    className="flex items-start gap-2 text-sm text-gray-warm"
                  >
                    <BadgeCheck
                      size={15}
                      className="mt-0.5 shrink-0 text-mint"
                    />
                    {p}
                  </li>
                ))}
              </ul>
            </div>

            {/* Livello 2 */}
            <div className="rounded-2xl bg-white p-5 shadow-soft ring-2 ring-pine">
              <span className="inline-flex items-center gap-2 rounded-full bg-pine px-3 py-1 text-xs font-medium text-white">
                <BadgeCheck size={14} /> Livello 2 — Sigillo pieno
              </span>
              <p className="mt-3 font-display text-xl text-ink">
                Risultato dimostrato
              </p>
              <p className="mt-2 text-sm text-gray-warm">
                Il livello 1 più un risultato misurato nel proprio ambito. Premia
                il fatto, non il documento:
              </p>
              <ul className="mt-3 space-y-1.5">
                {[
                  "Emissioni in calo a parità di perimetro (carbon)",
                  "Certificazione di terza parte da organismo accreditato (ISO / PdR 125)",
                  "KPI di parità migliorati anno su anno",
                  "Risparmi energetici realizzati e misurati",
                ].map((p) => (
                  <li
                    key={p}
                    className="flex items-start gap-2 text-sm text-gray-warm"
                  >
                    <BadgeCheck
                      size={15}
                      className="mt-0.5 shrink-0 text-pine"
                    />
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Sistema dei segmenti — sezione narrativa con scrollytelling:
          l'anello si riempie di un segmento per percorso verificato. */}
      <SigilloScrolly />


      {/* Verificabilità + targa — fondo scuro istituzionale, targa presentata
          su placca bianca (§11.X: su superfici stampate sempre placca bianca) */}
      <section className="bg-pine-deep px-5 py-16">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="font-display text-4xl text-white md:text-5xl">
            Ogni Sigillo sarà verificabile pubblicamente
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-moss">
            La verificabilità è la promessa del Sigillo: chi lo espone accetta di
            poter essere controllato. Ecco l&apos;anteprima della targa di
            verifica che accompagnerà ogni impresa qualificata.
          </p>

          <div className="mx-auto mt-8 max-w-xl rounded-2xl bg-white p-4 shadow-lift sm:p-6">
            <TargaVerifica className="h-auto w-full" />
          </div>

          <div className="mt-10 grid grid-cols-1 gap-4 text-left sm:grid-cols-3">
            {VERIFICA.map((v) => {
              const Icon = v.icon;
              return (
                <div
                  key={v.title}
                  className="rounded-2xl border border-white/15 bg-white/5 p-5 backdrop-blur-sm"
                >
                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-mint-bright/15 text-mint-bright">
                    <Icon size={20} />
                  </span>
                  <p className="mt-3 text-sm font-semibold text-white">
                    {v.title}
                  </p>
                  <p className="mt-1.5 text-xs leading-relaxed text-moss">
                    {v.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Millesimatura */}
      <section className="bg-pine-dark px-5 py-16">
        <div className="mx-auto flex max-w-4xl flex-col items-center gap-6 md:flex-row">
          <Sigillo tone="dark" className="h-24 w-24 shrink-0" />
          <div className="text-center md:text-left">
            <p className="inline-flex items-center gap-2 font-display text-2xl text-white">
              <CalendarClock size={22} className="text-mint" />
              <span>
                <em className="text-mint">Zero</em> scorciatoie: millesimato ogni
                anno
              </span>
            </p>
            <p className="mt-2 max-w-lg text-sm text-moss">
              Il Sigillo porta l&apos;anno e scade dopo dodici mesi. Chi lo
              espone è verificato oggi, non una volta nel passato. Alla scadenza
              o alla revoca il Sigillo decade: è questa la sua integrità, ed è
              ciò che lo rende credibile davanti a chi lo legge.
            </p>
          </div>
        </div>
      </section>

      {/* Domande frequenti: le stesse marcate in JSON-LD */}
      <section className="bg-paper px-5 py-16">
        <div className="mx-auto max-w-3xl">
          <h2 className="font-display text-4xl text-ink md:text-5xl">
            Domande frequenti
          </h2>
          <dl className="mt-8 space-y-5">
            {DOMANDE.map((d) => (
              <div
                key={d.domanda}
                className="rounded-2xl border border-line/70 bg-white p-5"
              >
                <dt className="font-display text-xl text-ink">{d.domanda}</dt>
                <dd className="mt-2 text-sm leading-relaxed text-gray-warm">
                  {d.risposta}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* CTA + nota conformità */}
      <section className="bg-white px-5 py-16 text-center">
        <h2 className="font-display text-4xl text-ink md:text-5xl">
          La via diretta al Sigillo
        </h2>
        <p className="mx-auto mt-3 max-w-lg text-sm text-gray-warm">
          Il Percorso Ver0 riunisce carbon footprint e bilancio VSME e dà accesso
          ai requisiti del livello 1. Il Sigillo non è mai una voce di prezzo: si
          conquista con il lavoro verificato.
        </p>
        <div className="mt-6 flex justify-center">
          <Link
            href="/servizi/percorso-ver0"
            className="inline-flex items-center gap-1.5 rounded-lg bg-pine px-5 py-2.5 text-sm font-medium text-white shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-lift"
          >
            Scopri il Percorso Ver0 <ArrowRight size={15} />
          </Link>
        </div>
        {/* Link interni verso le pagine correlate (regola SEO §seo.ts) */}
        <nav
          aria-label="Pagine correlate"
          className="mx-auto mt-8 flex max-w-xl flex-wrap justify-center gap-x-5 gap-y-2 text-sm"
        >
          <Link href="/servizi" className="font-medium text-pine hover:underline">
            Tutti i percorsi qualificanti
          </Link>
          <Link
            href="/chi-siamo"
            className="font-medium text-pine hover:underline"
          >
            Chi verifica i dati
          </Link>
          <Link
            href="/contatti"
            className="font-medium text-pine hover:underline"
          >
            Domande sul Sigillo? Scrivici
          </Link>
        </nav>

        <p className="mx-auto mt-8 max-w-xl text-xs leading-relaxed text-gray-light">
          Marchio di verifica conforme alla direttiva UE 2024/825: criteri
          pubblici per ogni percorso, verifica da parte del team tecnico,
          revocabilità con motivazione. Il Sigillo Ver0 non è uno schema di
          certificazione riconosciuto dai portali di terze parti e non va
          presentato come tale.
        </p>
      </section>
    </main>
  );
}
