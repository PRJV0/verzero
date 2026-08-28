/**
 * Tipi del database Postgres — allineati a mano alla migration
 * supabase/migrations/20260804100000_fase1_fondamenta.sql.
 *
 * Quando la CLI è collegata al progetto conviene rigenerarli:
 *   npx supabase gen types typescript --linked > src/types/database.ts
 */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Dimensione = "micro" | "piccola" | "media" | "grande";
export type Formula = "mensile" | "annuale";

type Organization = {
  id: string;
  ragione_sociale: string;
  partita_iva: string;
  dimensione: Dimensione;
  settore: string | null;
  billing_email: string | null;
  billing_sdi: string | null;
  billing_indirizzo: string | null;
  /** Codice pubblico non indovinabile della pagina /verifica (§12.F). */
  codice_verifica: string;
  /** Il sito ufficiale dichiarato: l'unico dominio che l'AI Ver0 legge
   *  per l'arricchimento qualitativo (§12.D). */
  sito_web: string | null;
  /** L'anno solare CHIUSO a cui si riferiscono i documenti (§12.C):
   *  diverso dall'anno in cui li elaboriamo. */
  anno_rendicontazione: number;
  created_at: string;
  updated_at: string;
};

type Profile = {
  id: string;
  /** Nullo solo per i consulenti: le imprese ne hanno sempre una. */
  organization_id: string | null;
  full_name: string | null;
  /** Ruolo dentro l'organizzazione. */
  role: "owner" | "member";
  /** Profilo di accesso all'ecosistema (SPEC §12.K). */
  ruolo: "impresa" | "consulente" | "amministratore";
  /** Quando il wizard di primo accesso è stato visto (o saltato). */
  wizard_visto_at: string | null;
  created_at: string;
  updated_at: string;
};

/** Mandato consulente ↔ organizzazione (SPEC §12.K): il consulente legge i
 *  dati del cliente solo con stato attivo; l'impresa vede e revoca. */
type ConsultantOrganization = {
  id: string;
  consultant_id: string;
  organization_id: string;
  stato: "attivo" | "revocato";
  created_at: string;
  updated_at: string;
};

type Order = {
  id: string;
  organization_id: string;
  created_by: string | null;
  servizio_slug: string;
  taglio: string | null;
  dimensione: Dimensione;
  /** "una_tantum" per i servizi one-shot senza canone (supporto all'audit). */
  formula: Formula | "una_tantum";
  /** Nullo sugli ordini una tantum: lì il prezzo sta in prezzo_una_tantum.
   *  Il vincolo prezzo_coerente a database tiene le due forme esclusive. */
  prezzo_canone: number | null;
  prezzo_una_tantum: number | null;
  /** "richiesta": modalità pre-lancio, nessun addebito (SPEC §12.B). */
  stato: "richiesta" | "in_attivazione" | "attivo" | "disdetto";
  note_interne: string | null;
  created_at: string;
  updated_at: string;
};

type Consent = {
  id: string;
  organization_id: string;
  user_id: string | null;
  doc_type: "condizioni_servizio" | "mandato_banche_dati";
  doc_version: string;
  accepted_at: string;
  revoked_at: string | null;
  created_at: string;
  updated_at: string;
};

type ModuleActivation = {
  id: string;
  organization_id: string;
  module: string;
  order_id: string | null;
  stato: "richiesto" | "in_attivazione" | "attivo" | "sospeso" | "disdetto";
  activated_at: string | null;
  renews_at: string | null;
  created_at: string;
  updated_at: string;
};

/** Messaggi dal modulo pubblico /contatti: tabella chiusa, solo service_role. */
type ContactMessage = {
  id: string;
  nome: string;
  azienda: string | null;
  email: string;
  oggetto: "informazioni" | "servizi" | "partnership";
  messaggio: string;
  /** Hash con pepper: serve solo al rate limiting, mai l'IP in chiaro. */
  ip_hash: string | null;
  user_agent: string | null;
  stato: "nuovo" | "in_lavorazione" | "chiuso";
  note_interne: string | null;
  created_at: string;
};

/** Scheda impresa estesa (SPEC §12.H): un record per campo, con
 *  provenienza, fonte e stato di conferma. */
type CompanyField = {
  id: string;
  organization_id: string;
  campo: string;
  valore: string | null;
  provenienza: "utente" | "motore";
  fonte: string | null;
  /** La pagina esatta da cui viene il dato (§12.D). */
  fonte_url: string | null;
  /** 'rifiutato': il cliente ha respinto la proposta del Motore. */
  stato: "confermato" | "da_confermare" | "rifiutato";
  confirmed_at: string | null;
  created_at: string;
  updated_at: string;
};

/** Registro tecnico dell'arricchimento (tappa 2.1): solo back-office —
 *  RLS attiva senza alcuna policy, ci arriva unicamente la service_role. */
type EnrichmentRun = {
  id: string;
  organization_id: string;
  innesco: "ordine" | "manuale";
  fonte: string;
  esito: "ok" | "nessun_dato" | "errore" | "non_disponibile";
  dettaglio: string | null;
  campi_scritti: number;
  durata_ms: number;
  created_at: string;
};

/** Hub documenti (SPEC §12.E): il file sta nello storage, qui c'è la sua
 *  descrizione, il tipo riconosciuto e lo stato di smistamento. */
type Documento = {
  id: string;
  organization_id: string;
  caricato_da: string | null;
  nome_file: string;
  /** Indirizzo nel bucket privato: `<organization_id>/<file>`. */
  percorso: string;
  mime: string;
  dimensione: number;
  /** Chiave di src/lib/documenti.ts; nulla finché non si sa cosa sia. */
  tipo: string | null;
  /** Vero quando è stato il cliente a dirlo, non una regola sul nome. */
  tipo_confermato: boolean;
  /** SHA-256 del contenuto: riconosce lo stesso file caricato due volte. */
  impronta: string | null;
  /** Acquisito con la fotocamera: non nativo per costruzione. */
  da_fotocamera: boolean;
  /** L'esito del primo sguardo, prima dell'estrazione. */
  triage_esito: "procedi" | "non_pertinente" | "dati_particolari" | "illeggibile" | null;
  /** La categoria dell'art. 9 riconosciuta: metadato, mai contenuto. */
  triage_categoria: string | null;
  triage_at: string | null;
  /** Quante foto sono state cucite in questo documento. */
  pagine_scattate: number | null;
  stato:
    | "smistato"
    | "da_classificare"
    | "non_pertinente"
    /** Fermato dal triage: contiene dati particolari (art. 9 GDPR). */
    | "dati_particolari"
    /** Accodato: oltre la dotazione di uso corretto, si legge più tardi. */
    | "in_coda"
    /** Il Motore lo sta leggendo adesso. */
    | "in_lettura"
    /** Letto: i campi stanno in `document_fields`. */
    | "letto"
    /** Provato a leggere e non si legge: `lettura_nota` dice perché. */
    | "illeggibile";
  /** Il motivo, in italiano, da mostrare in pagina. */
  lettura_nota: string | null;
  /** Le note scritte sul documento dal cliente: citazione, non avviso. */
  note_libere: string[] | null;
  letto_at: string | null;
  created_at: string;
  updated_at: string;
};

/**
 * Un campo estratto da un documento (docs/motore.md §4). Ogni riga porta
 * la propria verificabilità: confidenza, pagina, e la stringa così com'è
 * scritta nel documento. Nasce sempre `da_confermare`.
 */
type CampoDocumento = {
  id: string;
  document_id: string;
  organization_id: string;
  /** Zero per le schede; da 1 in su per le righe di una tabella. */
  riga: number;
  campo: string;
  etichetta: string;
  valore: string | null;
  unita: string | null;
  confidenza: number;
  pagina: number | null;
  estratto_da: string | null;
  fonte_lettura: "testo" | "immagine" | "manoscritto";
  nota: string | null;
  avvisi: string[];
  stato: "da_confermare" | "confermato" | "rifiutato";
  confirmed_at: string | null;
  created_at: string;
  updated_at: string;
};

/** Un tetto di spesa superato. Solo back-office: il cliente non lo vede. */
type AllarmeMotore = {
  id: string;
  ambito: "pratica" | "organizzazione" | "giorno";
  livello: "soglia" | "tetto";
  organization_id: string | null;
  modulo: string | null;
  speso_micro: number;
  tetto_micro: number;
  nota: string | null;
  visto_at: string | null;
  created_at: string;
};

/** Log tecnico del Motore: back-office (service role e amministratore). */
type Estrazione = {
  id: string;
  document_id: string | null;
  organization_id: string | null;
  famiglia: string | null;
  tipo: string | null;
  versione_schema: string | null;
  modello: string;
  /** «triage» il primo sguardo, «estrazione» la lettura vera. */
  fase: "triage" | "estrazione";
  /** Il livello con cui si è conclusa la lettura. */
  livello: "leggero" | "intermedio" | "superiore" | null;
  /** Valorizzata solo se si è saliti: da dove, e perché. */
  escalato_da: string | null;
  escalato_perche: string | null;
  esito: "ok" | "altro_tipo" | "illeggibile" | "non_valido" | "errore";
  qualita: string | null;
  pdf_nativo: boolean | null;
  pagine: number | null;
  token_ingresso: number | null;
  token_uscita: number | null;
  /** Milionesimi di dollaro, interi. */
  costo_micro: number | null;
  durata_ms: number | null;
  avvisi: string[] | null;
  errore: string | null;
  grezzo: unknown;
  created_at: string;
};

/** Registro eventi: analitica di prima parte, senza cookie. Scritto
 *  dalla service_role, letto solo dall'amministratore. */
type Evento = {
  id: number;
  nome: string;
  percorso: string | null;
  sorgente: string | null;
  dettagli: Record<string, string>;
  /** Impronta con pepper, mai l'IP: distingue le sessioni, non le persone. */
  visitatore: string | null;
  created_at: string;
};

/** Lista d'attesa: lead raccolti prima dell'apertura dei pagamenti. */
type Waitlist = {
  id: string;
  email: string;
  nome: string | null;
  azienda: string | null;
  interesse: string | null;
  stato: "nuovo" | "contattato" | "convertito" | "chiuso";
  note_interne: string | null;
  ip_hash: string | null;
  created_at: string;
  updated_at: string;
};

type Row<T> = {
  Row: T;
  Insert: Partial<T>;
  Update: Partial<T>;
  Relationships: [];
};

export type Database = {
  public: {
    Tables: {
      organizations: Row<Organization>;
      profiles: Row<Profile>;
      orders: Row<Order>;
      consents: Row<Consent>;
      module_activations: Row<ModuleActivation>;
      contact_messages: Row<ContactMessage>;
      consultant_organizations: Row<ConsultantOrganization>;
      company_fields: Row<CompanyField>;
      enrichment_runs: Row<EnrichmentRun>;
      documents: Row<Documento>;
      document_fields: Row<CampoDocumento>;
      extractions: Row<Estrazione>;
      motore_allarmi: Row<AllarmeMotore>;
      events: Row<Evento>;
      waitlist: Row<Waitlist>;
    };
    Views: Record<string, never>;
    Functions: {
      current_org_id: { Args: Record<string, never>; Returns: string };
      is_admin: { Args: Record<string, never>; Returns: boolean };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
