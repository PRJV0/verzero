import type { ModelloElaborato } from "@/lib/elaborati";

import type { Validazione, VoceRevisione } from "./contenuto";

/**
 * GLI INGRESSI DELLA COMPOSIZIONE — la forma delle righe di banca dati.
 *
 * La composizione è una funzione pura: riceve le righe così come le
 * restituisce Supabase e produce il documento. Nessuna chiamata di rete
 * dentro, per due ragioni che contano più dell'eleganza:
 *
 * 1. si prova senza banca dati — `scripts/test-elaborato.mjs` e il
 *    collaudo con l'impresa inventata girano sulle stesse funzioni che
 *    usa il portale;
 * 2. l'impronta degli ingressi (il riuso, docs/motore.md §7bis) si calcola
 *    su esattamente ciò che la composizione ha visto, non su una seconda
 *    lettura fatta un istante dopo.
 *
 * Le righe arrivano TUTTE, confermate e no. Il filtro sulla conferma sta
 * nei compositori e il controllo di consegna lo ripete: se qualcuno un
 * giorno passasse solo le confermate «per sicurezza», le mancanze da
 * confermare sparirebbero dall'elenco che il cliente legge.
 */

export type OrganizzazioneIngresso = {
  id: string;
  ragione_sociale: string;
  partita_iva: string;
  anno_rendicontazione: number;
  sito_web?: string | null;
  /** Quando si è registrata: è la data dei dati «inseriti alla registrazione». */
  created_at?: string | null;
};

export type CampoImpresaIngresso = {
  campo: string;
  valore: string | null;
  provenienza: "utente" | "motore";
  fonte: string | null;
  fonte_url?: string | null;
  stato: "confermato" | "da_confermare" | "rifiutato";
  confirmed_at: string | null;
  updated_at?: string | null;
};

export type DocumentoIngresso = {
  id: string;
  nome_file: string;
  tipo: string | null;
  stato: string;
  letto_at?: string | null;
  created_at: string;
  da_fotocamera?: boolean | null;
};

export type CampoDocumentoIngresso = {
  document_id: string;
  riga: number;
  campo: string;
  etichetta: string;
  valore: string | null;
  unita: string | null;
  pagina: number | null;
  fonte_lettura: string;
  calcolato?: boolean | null;
  avvisi: string[] | null;
  stato: "da_confermare" | "confermato" | "rifiutato";
  confirmed_at: string | null;
};

export type IngressoComposizione = {
  /** Il modello GIÀ scelto per l'esercizio (`modelloElaborato(chiave, anno)`). */
  modello: ModelloElaborato;
  /** Le opzioni del taglio (`scope3`, `avanzato`). */
  opzioni: string[];
  /** Lo slug del percorso che lo produce: finisce nelle azioni del portale. */
  percorso: string;
  organizzazione: OrganizzazioneIngresso;
  campi: CampoImpresaIngresso[];
  documenti: DocumentoIngresso[];
  campiDocumento: CampoDocumentoIngresso[];
  /** La revisione che si sta componendo. */
  revisione: { numero: number; data: string; motivo: string };
  validazione: Validazione;
  /** Le revisioni già emesse per lo stesso documento e lo stesso esercizio. */
  revisioniPrecedenti: VoceRevisione[];
  /** Documento d'esempio con impresa inventata. */
  esempio?: boolean;
};
