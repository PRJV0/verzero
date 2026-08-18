-- =====================================================================
-- TAPPA 2.0 — chiusure di sicurezza emerse dalla review (SPEC §12.H/§12.K).
--
-- Tre falle chiuse con i GRANT a livello di colonna (più robusti di un
-- trigger: valgono qualunque sia la policy) + un with check più stretto:
--
-- 1. profiles: l'utente poteva auto-promuoversi (ruolo='consulente',
--    role='owner') via PATCH. Ora authenticated aggiorna SOLO
--    full_name e wizard_visto_at; ruolo/role/organization_id li tocca
--    solo il back-office (service_role, che ha i propri grant).
--
-- 2. company_fields: il client poteva spacciare un dato come
--    «Recuperato da noi» (provenienza='motore') — falsa
--    auto-certificazione. Ora l'insert dell'utente è vincolato a
--    provenienza='utente' e l'update può toccare solo valore, stato e
--    confirmed_at: mai provenienza né fonte. Il Motore (service_role)
--    resta libero: è lui a scrivere i campi arricchiti della 2.1.
--
-- 3. consultant_organizations: la policy di revoca ammetteva anche la
--    RIattivazione (stato='attivo') e, senza grant di colonna, la
--    riassegnazione del consulente. Ora l'impresa può solo REVOCARE:
--    colonna stato soltanto, valore 'revocato' soltanto. La
--    riattivazione arriverà dal flusso di invito (fase 2, back-office).
-- =====================================================================

-- 1. profiles: colonne aggiornabili dal client ridotte al minimo.
revoke update on public.profiles from authenticated;
grant update (full_name, wizard_visto_at) on public.profiles to authenticated;

-- 2. company_fields: l'utente dichiara solo per sé.
drop policy cf_insert on public.company_fields;
create policy cf_insert on public.company_fields
  for insert to authenticated
  with check (
    organization_id = public.current_org_id()
    and provenienza = 'utente'
  );

revoke update on public.company_fields from authenticated;
grant update (valore, stato, confirmed_at)
  on public.company_fields to authenticated;

-- 3. consultant_organizations: la revoca è a senso unico.
drop policy co_revoca on public.consultant_organizations;
create policy co_revoca on public.consultant_organizations
  for update to authenticated
  using (organization_id = public.current_org_id())
  with check (
    organization_id = public.current_org_id()
    and stato = 'revocato'
  );

revoke update on public.consultant_organizations from authenticated;
grant update (stato) on public.consultant_organizations to authenticated;
