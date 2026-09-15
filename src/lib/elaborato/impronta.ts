import { createHash } from "node:crypto";

import { cellaCalcolata, cellaScrittaDalCliente } from "@/lib/motore/portale";
import type { Impronta } from "@/lib/motore/riuso";

import type { EsitoComposizione } from "./componi";
import type { IngressoComposizione } from "./ingresso";

/**
 * L'IMPRONTA DI UN ELABORATO — ciò che, cambiando, cambierebbe il documento.
 *
 * È l'hash degli INGRESSI, non del file (docs/motore.md §7bis): il file si
 * conosce solo dopo averlo prodotto, cioè dopo aver speso. Cinque
 * componenti, perché «che cosa è cambiato» si deve poter dire al cliente:
 *
 *   dati       i valori CONFERMATI che la composizione legge — scheda
 *              impresa e campi dei documenti dei tipi che il modello usa;
 *   documenti  quali documenti di quei tipi ci sono, e in che stato;
 *   norme      i riferimenti copiati nel documento, col loro stato;
 *   modello    la struttura e i testi del modello;
 *   fattori    le banche dati di calcolo citate (edizione e valore);
 *   veste      logo, colore e contatti.
 *
 * Le date di conferma NON entrano: confermare di nuovo lo stesso valore
 * non cambia il documento, e rigenerarlo per quello sarebbe lavoro inutile.
 * Un documento non pertinente a questo modello nemmeno: caricare un
 * organigramma non rende «nuovo» un inventario delle emissioni.
 */

const hash = (valore: unknown) =>
  createHash("sha256").update(JSON.stringify(valore)).digest("hex").slice(0, 24);

export function improntaElaborato(
  ingresso: IngressoComposizione,
  composizione: EsitoComposizione,
  improntaVeste: string,
): Impronta {
  const tipi = new Set(composizione.tipiLetti);
  const documenti = ingresso.documenti
    .filter((d) => d.tipo && tipi.has(d.tipo))
    .map((d) => [d.id, d.tipo, d.stato])
    .sort((a, b) => String(a[0]).localeCompare(String(b[0])));
  const idDocumenti = new Set(documenti.map((d) => d[0]));

  const campi = ingresso.campi
    .filter((c) => c.stato === "confermato" && c.valore !== null)
    .map((c) => [c.campo, c.valore, c.provenienza, c.fonte ?? "", c.fonte_url ?? ""])
    .sort((a, b) => String(a[0]).localeCompare(String(b[0])));

  const letti = ingresso.campiDocumento
    .filter((c) => idDocumenti.has(c.document_id))
    // Anche lo STATO entra: un valore passato da confermato a da confermare
    // esce dal documento, e il documento cambia. E la PROVENIENZA della
    // cella: lo stesso numero riscritto a mano dal cliente passa da D a I
    // nel documento, anche se il valore non cambia.
    .map((c) => [
      c.document_id,
      c.riga,
      c.campo,
      c.valore,
      c.unita ?? "",
      c.pagina ?? 0,
      c.stato,
      cellaScrittaDalCliente(c) ? "scritto" : cellaCalcolata({ calcolato: c.calcolato ?? null, fonteLettura: c.fonte_lettura, avvisi: c.avvisi }) ? "ricavato" : "letto",
    ])
    .sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));

  const org = ingresso.organizzazione;
  const e = composizione.elaborato;

  return {
    dati: hash({
      org: [org.ragione_sociale, org.partita_iva, org.anno_rendicontazione, org.sito_web ?? ""],
      campi,
      letti,
      opzioni: [...ingresso.opzioni].sort(),
    }),
    documenti: hash(documenti),
    norme: hash(e.riferimenti.map((r) => [r.designazione, r.stato, r.dal ?? ""])),
    modello: e.modello.impronta,
    fattori: hash(
      e.fonti
        .filter((f) => f.tipo === "banca-dati")
        .map((f) => [f.titolo, f.dettaglio.filter((d) => !d.startsWith("Campi usati"))]),
    ),
    veste: hash(improntaVeste),
  };
}
