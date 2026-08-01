/**
 * Tipi del database Postgres.
 *
 * Placeholder di fase 0. Dalla fase 1, quando lo schema di SPEC §4 sarà
 * applicato con le migration, questo file va RIGENERATO e non scritto a mano:
 *
 *   npx supabase gen types typescript --project-id <ref> > src/types/database.ts
 */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: Record<string, never>;
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
