import { SIGLA_FONTE, type Fonte, type TipoFonte } from "./contenuto";

/**
 * IL REGISTRO DELLE FONTI — la sigla accanto a ogni dato, e che cosa c'è dietro.
 *
 * ═══ PERCHÉ UNA SIGLA E NON UNA NOTA A PIÈ DI PAGINA ═══
 * Un inventario delle emissioni ha centinaia di valori. Una nota per
 * valore affoga il documento; nessuna nota lo rende un PDF come un altro.
 * La sigla — D3, B1, C2 — pesa quanto una virgola, si legge senza
 * interrompere la tabella, e rimanda a UNA voce dell'appendice dove sta
 * tutto: quale bolletta, quale pagina, confermata quando; quale banca
 * dati, quale edizione; quale calcolo, su quali ingressi. È la differenza
 * fra un documento che si legge e un documento che si verifica.
 *
 * ═══ UNA VOCE PER COSA, NON PER VALORE ═══
 * Dodici valori letti dalla stessa bolletta hanno la stessa sigla: la
 * fonte è la bolletta. Le pagine usate si accumulano nel dettaglio.
 * Numerare ogni valore darebbe un registro lungo quanto il documento, e
 * nessuno lo aprirebbe.
 *
 * Le sigle si assegnano nell'ordine di prima citazione: rileggendo il
 * documento dall'inizio i numeri crescono, e lo stesso ingresso produce
 * sempre le stesse sigle — che è ciò che permette di confrontare due
 * revisioni.
 */

export const DATA_LUNGA = (iso: string): string => {
  const d = new Date(iso.length === 10 ? `${iso}T00:00:00Z` : iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("it-IT", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Rome",
  });
};

type Bozza = Omit<Fonte, "id">;

export class RegistroFonti {
  private perChiave = new Map<string, Fonte>();
  private contatori: Record<TipoFonte, number> = {
    documento: 0,
    "banca-dati": 0,
    calcolato: 0,
    inserito: 0,
  };
  /** Le pagine usate per ciascuna fonte-documento: si scrivono alla fine. */
  private pagine = new Map<string, Set<number>>();
  /** La conferma più recente fra i valori usati di una fonte. */
  private conferme = new Map<string, string>();

  /**
   * Registra una fonte (o ritrova quella già registrata con la stessa
   * chiave) e restituisce la sigla. `crea` gira solo la prima volta.
   */
  registra(chiave: string, crea: () => Bozza): string {
    const esistente = this.perChiave.get(chiave);
    if (esistente) return esistente.id;
    const bozza = crea();
    this.contatori[bozza.tipo] += 1;
    const id = `${SIGLA_FONTE[bozza.tipo]}${this.contatori[bozza.tipo]}`;
    this.perChiave.set(chiave, { ...bozza, id });
    return id;
  }

  /** Annota una pagina del documento da cui è stato letto un valore usato. */
  pagina(id: string, pagina: number | null | undefined) {
    if (!pagina) return;
    const set = this.pagine.get(id) ?? new Set<number>();
    set.add(pagina);
    this.pagine.set(id, set);
  }

  /**
   * Annota una conferma e — se il valore usato NON è confermato — segna la
   * fonte come non confermata. Basta un valore: il controllo di consegna
   * guarda la fonte, e una fonte che porta anche un solo dato non
   * confermato non ha titolo per stare in un documento consegnato.
   */
  conferma(id: string, confermatoIl: string | null | undefined, confermato = true) {
    const fonte = this.trova(id);
    if (!fonte) return;
    if (!confermato || !confermatoIl) {
      fonte.confermata = false;
      return;
    }
    const prima = this.conferme.get(id);
    if (!prima || confermatoIl > prima) this.conferme.set(id, confermatoIl);
  }

  trova(id: string): Fonte | undefined {
    for (const f of this.perChiave.values()) if (f.id === id) return f;
    return undefined;
  }

  /** Il registro, in ordine: documenti, banche dati, calcoli, dati inseriti. */
  elenco(): Fonte[] {
    const ordine: TipoFonte[] = ["documento", "banca-dati", "calcolato", "inserito"];
    return [...this.perChiave.values()]
      .map((f): Fonte => {
        const pagine = this.pagine.get(f.id);
        const conferma = this.conferme.get(f.id);
        const dettaglio = [...f.dettaglio];
        if (pagine && pagine.size > 0) {
          const elenco = [...pagine].sort((a, b) => a - b);
          dettaglio.push(
            `${elenco.length === 1 ? "Pagina" : "Pagine"} ${elenco.join(", ")}`,
          );
        }
        return {
          ...f,
          dettaglio,
          ...(f.confermata && conferma && !f.confermataIl
            ? { confermataIl: DATA_LUNGA(conferma) }
            : {}),
        };
      })
      .sort(
        (a, b) =>
          ordine.indexOf(a.tipo) - ordine.indexOf(b.tipo) ||
          Number(a.id.slice(1)) - Number(b.id.slice(1)),
      );
  }
}
