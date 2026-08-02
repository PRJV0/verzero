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

export const metadata: Metadata = {
  title: "Il bollino Impresa Ver0 — non si compra, si dimostra",
  description:
    "Il marchio di certificazione Ver0: criteri pubblici, dati verificati dal team tecnico, pagina pubblica di verifica con QR, millesimato ogni anno. Coerente con la direttiva UE 2024/825.",
};

/** Sigillo circolare millesimato, riuso in hero e sezioni. */
function Sigillo({ size = "lg" }: { size?: "lg" | "sm" }) {
  const box = size === "lg" ? "h-28 w-28 border-[3px]" : "h-16 w-16 border-2";
  const zero = size === "lg" ? "text-4xl" : "text-2xl";
  const year = size === "lg" ? "text-[11px]" : "text-[9px]";
  return (
    <div
      className={`flex ${box} shrink-0 flex-col items-center justify-center rounded-full border-pine bg-moss`}
    >
      <span
        className={`font-display font-semibold leading-none text-pine ${zero}`}
      >
        0
      </span>
      <span className={`tracking-widest text-pine-dark ${year}`}>2026</span>
    </div>
  );
}

const PERCORSI = [
  "Carbon footprint con le categorie obbligatorie confermate",
  "Bilancio VSME completo e validato",
  "Sistema di gestione ISO completato (famiglia certificabile)",
  "Fascicolo UNI/PdR 125 pronto per l'audit",
  "Check-up energetico con monitoraggio attivo",
];

const VERIFICA = [
  {
    icon: QrCode,
    title: "Un QR su ogni sigillo",
    desc: "Il sigillo millesimato porta un QR che apre la pagina pubblica di verifica dell'impresa. Chiunque — una banca, un capofiliera, una stazione appaltante — può controllare in un istante.",
  },
  {
    icon: ScrollText,
    title: "Una pagina pubblica, senza login",
    desc: "Ragione sociale, P.IVA, settore, livello e anno, metodologia, data di verifica e di scadenza, link ai criteri pubblici e un canale per segnalare usi impropri. Nient'altro: privacy by design.",
  },
  {
    icon: BadgeCheck,
    title: "Un kit grafico ufficiale",
    desc: "All'impresa certificata forniamo il sigillo in versione colore e monocromatica, con il QR che rimanda alla sua pagina di verifica. Da usare su sito, offerte e documenti.",
  },
];

export default function BollinoPage() {
  return (
    <main>
      {/* Hero */}
      <section className="bg-moss px-5 py-14 text-center">
        <div className="mb-5 flex justify-center">
          <Sigillo />
        </div>
        <p className="mb-3 text-xs font-medium tracking-widest text-mint">
          IMPRESA CERTIFICATA VER0
        </p>
        <h1 className="mx-auto max-w-2xl font-display text-3xl leading-tight text-pine-dark md:text-4xl">
          Il bollino non si compra. Si dimostra.
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-sm text-pine">
          È il marchio di certificazione della piattaforma, esposto dalle
          aziende che raggiungono i criteri. Criteri pubblici, dati verificati
          da persone, revocabilità: costruito in coerenza con la direttiva UE
          2024/825 contro il greenwashing.
        </p>
      </section>

      {/* Cos'è */}
      <section className="mx-auto max-w-3xl px-5 py-10">
        <h2 className="font-display text-2xl text-ink">
          Una qualifica, non un logo
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-gray-warm">
          Attraverso i servizi Ver0 le imprese ottengono qualcosa che vale al di
          fuori della piattaforma: reputazione, attendibilità e riconoscimento
          davanti a banche, clienti capofiliera e stazioni appaltanti. Il
          bollino rende quella qualifica leggibile e verificabile da chiunque, in
          un colpo d&apos;occhio. Non certifichiamo un&apos;intenzione:
          attestiamo un lavoro fatto e controllato.
        </p>
      </section>

      {/* Scala multi-percorso */}
      <section className="bg-paper px-5 py-10">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center font-display text-2xl text-ink">
            Un solo sigillo, più strade per meritarlo
          </h2>
          <p className="mx-auto mt-2 max-w-2xl text-center text-sm text-gray-warm">
            La scala è multi-percorso: si sale completando percorsi qualificanti,
            ognuno con criteri pubblici e mai a pagamento. Più percorsi verificati
            = più ambiti sulla stessa pagina di verifica, mai sigilli multipli.
          </p>

          <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* Livello 1 */}
            <div className="rounded-xl border border-line bg-white p-5">
              <span className="inline-flex items-center gap-2 rounded-full bg-moss px-3 py-1 text-xs font-medium text-pine">
                <ShieldCheck size={14} /> Livello 1
              </span>
              <p className="mt-3 font-display text-xl text-ink">
                Percorso verificato
              </p>
              <p className="mt-2 text-sm text-gray-warm">
                Si ottiene completando almeno un percorso qualificante con la
                validazione del team tecnico. La dicitura sotto il sigillo dice
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
                    <BadgeCheck size={15} className="mt-0.5 shrink-0 text-mint" />
                    {p}
                  </li>
                ))}
              </ul>
            </div>

            {/* Livello 2 */}
            <div className="rounded-xl border-2 border-pine bg-white p-5">
              <span className="inline-flex items-center gap-2 rounded-full bg-pine px-3 py-1 text-xs font-medium text-white">
                <BadgeCheck size={14} /> Livello 2 — sigillo pieno
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
                    <BadgeCheck size={15} className="mt-0.5 shrink-0 text-pine" />
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Come si verifica */}
      <section className="mx-auto max-w-4xl px-5 py-10">
        <h2 className="text-center font-display text-2xl text-ink">
          Come si verifica
        </h2>
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {VERIFICA.map((v) => {
            const Icon = v.icon;
            return (
              <div
                key={v.title}
                className="rounded-xl border border-line bg-white p-5"
              >
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-moss text-pine">
                  <Icon size={20} />
                </span>
                <p className="mt-3 text-sm font-semibold text-ink">{v.title}</p>
                <p className="mt-1.5 text-xs leading-relaxed text-gray-warm">
                  {v.desc}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Millesimatura */}
      <section className="bg-pine-dark px-5 py-10">
        <div className="mx-auto flex max-w-4xl flex-col items-center gap-6 md:flex-row">
          <div className="rounded-full border-[3px] border-white">
            <Sigillo size="sm" />
          </div>
          <div className="text-center md:text-left">
            <p className="inline-flex items-center gap-2 font-display text-2xl text-white">
              <CalendarClock size={22} className="text-mint" /> Millesimato: ogni
              anno va riconquistato
            </p>
            <p className="mt-2 max-w-lg text-sm text-moss">
              Il sigillo porta l&apos;anno e scade dopo dodici mesi. Chi lo
              espone è verificato oggi, non una volta nel passato. Alla scadenza
              o alla revoca il bollino decade: è questa la sua integrità, ed è
              ciò che lo rende credibile davanti a chi lo legge.
            </p>
          </div>
        </div>
      </section>

      {/* CTA + nota conformità */}
      <section className="mx-auto max-w-3xl px-5 py-12 text-center">
        <h2 className="font-display text-2xl text-ink">
          La via diretta al bollino
        </h2>
        <p className="mx-auto mt-2 max-w-lg text-sm text-gray-warm">
          Il Percorso Ver0 riunisce carbon footprint e bilancio VSME e dà accesso
          ai requisiti del livello 1. Il bollino non è mai una voce di prezzo: si
          conquista con il lavoro verificato.
        </p>
        <div className="mt-6 flex justify-center">
          <Link
            href="/servizi/percorso-ver0"
            className="inline-flex items-center gap-1.5 rounded-lg bg-pine px-5 py-2.5 text-sm font-medium text-white"
          >
            Scopri il Percorso Ver0 <ArrowRight size={15} />
          </Link>
        </div>
        <p className="mx-auto mt-8 max-w-xl text-xs leading-relaxed text-gray-light">
          Marchio di certificazione conforme alla direttiva UE 2024/825: criteri
          pubblici per ogni percorso, verifica da parte del team tecnico,
          revocabilità con motivazione. Il bollino Ver0 non è uno schema di
          certificazione riconosciuto dai portali di terze parti e non va
          presentato come tale.
        </p>
      </section>
    </main>
  );
}
