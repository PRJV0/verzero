import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookMarked, UserCheck } from "lucide-react";

import { FascicoloPercorso } from "@/components/fascicolo-percorso";
import { JsonLd } from "@/components/json-ld";
import { MotoreInAzione } from "@/components/motore-in-azione";
import { OndaParticelle } from "@/components/onda-particelle";
import { QualitaOutput } from "@/components/qualita-output";
import { SOLO_STANDARD_UFFICIALI } from "@/lib/catalog";
import { FONDO_SOGLIA, PRESET } from "@/lib/onda";
import { jsonLdBreadcrumb, metadataPagina } from "@/lib/seo";

export const metadata: Metadata = metadataPagina({
  title: "Come funziona: l'AI Ver0, i documenti, la validazione",
  description:
    "Il fascicolo del percorso documento per documento, cosa legge l'AI Ver0, cosa genera e chi valida: la profondità tecnica, con le norme citate.",
  path: "/come-funziona",
});

/**
 * /come-funziona — la casa della profondità tecnica (SPEC §12.J).
 *
 * STESSA GRAMMATICA DELLA HOME, non un secondo schema. Chi arriva da lì
 * deve riconoscere il sistema — fonti, Motore proprietario, esiti,
 * portale già composto — e trovarci sotto quello che in home non c'era:
 * il metodo. Lo schema è LO STESSO COMPONENTE, con il livello di
 * dettaglio acceso; le rappresentazioni verticali di prima (GHG e ISO
 * 9001 come schemi a sé) sono state tolte: erano due grammatiche diverse
 * per la stessa cosa.
 *
 * VINCOLO: si spiega il metodo, mai le regole interne di estrazione.
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

      {/* IL FOCUS: un percorso alla volta, dichiarato come esempio. Il
          selettore mostra lo stesso schema su altri percorsi — è così
          che si vede che il sistema è trasversale e non è nato per un
          solo servizio. */}
      <section className="bg-paper px-5 py-16 md:py-24">
        <div className="mx-auto max-w-4xl">
          <div className="mb-8 text-center">
            <p className="mb-4 text-xs font-semibold tracking-widest text-pine">
              UN PERCORSO DA VICINO
            </p>
            <h2 className="font-display text-4xl leading-[1.05] text-ink md:text-5xl">
              Come si riempie un fascicolo.
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-gray-warm">
              Esempio su un&apos;impresa inventata, con il Carbon Footprint
              perché è il percorso più leggibile. Cambia scheda per vedere lo
              stesso schema sugli altri.
            </p>
          </div>
          <FascicoloPercorso />
        </div>
      </section>

      {/* COM'È FATTO IL DOCUMENTO CHE ESCE. */}
      <section className="bg-white px-5 py-16 md:py-24">
        <div className="mx-auto max-w-5xl">
          <div className="mx-auto max-w-2xl text-center">
            <p className="mb-4 text-xs font-semibold tracking-widest text-pine">
              GLI ELABORATI
            </p>
            <h2 className="font-display text-4xl leading-[1.05] text-ink md:text-5xl">
              Com&apos;è fatto il documento che esce.
            </h2>
          </div>
          <div className="mt-10">
            <QualitaOutput />
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
          Ogni pagina servizio elenca il suo «Cosa ti chiederemo»: la lista
          esatta dei documenti, prima di attivare.
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
