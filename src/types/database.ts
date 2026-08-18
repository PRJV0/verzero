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
  ruolo: "impresa" | "consulente";
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
  stato: "in_attivazione" | "attivo" | "disdetto";
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
  stato: "in_attivazione" | "attivo" | "sospeso" | "disdetto";
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
  stato: "confermato" | "da_confermare";
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
    };
    Views: Record<string, never>;
    Functions: {
      current_org_id: { Args: Record<string, never>; Returns: string };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
