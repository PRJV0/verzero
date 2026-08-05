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
  created_at: string;
  updated_at: string;
};

type Profile = {
  id: string;
  organization_id: string;
  full_name: string | null;
  role: "owner" | "member";
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
  formula: Formula;
  prezzo_canone: number;
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
    };
    Views: Record<string, never>;
    Functions: {
      current_org_id: { Args: Record<string, never>; Returns: string };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
