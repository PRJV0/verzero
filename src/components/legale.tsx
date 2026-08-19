import Link from "next/link";
import { CircleAlert } from "lucide-react";

/**
 * Elementi comuni delle pagine legali (privacy, cookie policy).
 *
 * Regola di tono: qui non si fa finto legalese. Dove il testo è pronto
 * si scrive per farsi capire; dove serve la mano di un legale o manca un
 * dato societario, si dichiara — un'informativa che finge completezza è
 * peggio di una che ammette cosa manca.
 */

export function SezioneLegale({
  id,
  titolo,
  children,
}: {
  id: string;
  titolo: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="mt-10 scroll-mt-24">
      <h2 className="font-display text-2xl text-ink">{titolo}</h2>
      <div className="mt-3 space-y-3 text-sm leading-relaxed text-gray-warm">
        {children}
      </div>
    </section>
  );
}

/** Un punto che aspetta la validazione del legale o un dato societario. */
export function DaValidare({ children }: { children: React.ReactNode }) {
  return (
    <p className="flex gap-2.5 rounded-lg border border-amber-ink/25 bg-amber-soft/60 px-3.5 py-2.5 text-xs leading-relaxed text-amber-ink">
      <CircleAlert size={15} className="mt-0.5 shrink-0" />
      <span>
        <strong className="font-semibold">Da far validare: </strong>
        {children}
      </span>
    </p>
  );
}

/** Tabella responsiva: su mobile diventa un elenco di schede leggibili. */
export function TabellaLegale({
  colonne,
  righe,
}: {
  colonne: string[];
  righe: React.ReactNode[][];
}) {
  return (
    <div className="mt-3 overflow-x-auto">
      <table className="w-full min-w-[34rem] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b-2 border-line">
            {colonne.map((c) => (
              <th
                key={c}
                scope="col"
                className="py-2 pr-4 align-bottom text-xs font-semibold uppercase tracking-wide text-pine"
              >
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {righe.map((riga, i) => (
            <tr key={i} className="border-b border-line/70 align-top">
              {riga.map((cella, j) => (
                <td
                  key={j}
                  className="py-3 pr-4 text-sm leading-relaxed text-gray-warm"
                >
                  {cella}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Intestazione comune con la data e il rimando all'altra informativa. */
export function IntestazioneLegale({
  titolo,
  sotto,
  aggiornato,
  altra,
}: {
  titolo: string;
  sotto: string;
  aggiornato: string;
  altra: { href: string; label: string };
}) {
  return (
    <>
      <h1 className="font-display text-4xl text-ink md:text-5xl">{titolo}</h1>
      <p className="mt-4 text-base leading-relaxed text-gray-warm">{sotto}</p>
      <p className="mt-3 text-xs text-gray-light">
        Ultimo aggiornamento: {aggiornato} ·{" "}
        <Link href={altra.href} className="text-pine underline">
          {altra.label}
        </Link>
      </p>
    </>
  );
}

/** Il titolare del trattamento: segnaposto finché la società non esiste. */
export function TitolareSegnaposto() {
  return (
    <>
      <p>
        Il titolare del trattamento è il soggetto che decide perché e come i
        tuoi dati vengono trattati. Per Ver0 sarà la società in corso di
        costituzione; fino alla sua iscrizione il riferimento operativo è{" "}
        <a
          href="mailto:privacy@verzero.it"
          className="font-medium text-pine underline"
        >
          privacy@verzero.it
        </a>
        , indirizzo al quale puoi rivolgere fin da ora qualunque richiesta.
      </p>
      <DaValidare>
        denominazione, forma giuridica, sede legale, partita IVA e legale
        rappresentante della società titolare vanno inseriti qui appena
        l&apos;iscrizione è perfezionata. Va valutata anche la nomina di un
        responsabile della protezione dei dati: non è obbligatoria per
        un&apos;impresa di queste dimensioni e con questi trattamenti, ma la
        presenza di dati di dipendenti trattati per conto dei clienti merita
        una valutazione esplicita.
      </DaValidare>
    </>
  );
}
