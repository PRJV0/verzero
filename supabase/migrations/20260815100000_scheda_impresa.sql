-- =====================================================================
-- TAPPA 2.0 (SPEC §12.H) — Scheda impresa estesa + primo accesso.
--
-- company_fields: un record per campo della scheda impresa, con
-- PROVENIENZA (inserito dall'utente | recuperato dal Motore), FONTE
-- (registrazione, InfoCamere, INI-PEC, …) e STATO DI CONFERMA. È
-- l'architettura su cui la 2.1 innesterà l'arricchimento automatico:
-- il Motore scrive campi con provenienza 'motore' e stato
-- 'da_confermare'; l'utente conferma o corregge.
-- =====================================================================

-- ---------------------------------------------------------------------
-- profiles: momento del primo accesso (wizard mostrato una sola volta).
-- ---------------------------------------------------------------------
alter table public.profiles add column wizard_visto_at timestamptz;

-- Correzione della policy di aggiornamento del profilo: il with check
-- `organization_id = current_org_id()` falliva per i CONSULENTI, dove
-- entrambi i lati sono null (null = null → null → negato). Con
-- IS NOT DISTINCT FROM il confronto tratta null come uguale a null,
-- mantenendo il vincolo per le imprese: nessuno cambia organizzazione.
drop policy profiles_update on public.profiles;
create policy profiles_update on public.profiles
  for update to authenticated
  using (id = auth.uid())
  with check (
    id = auth.uid()
    and organization_id is not distinct from public.current_org_id()
  );

-- ---------------------------------------------------------------------
-- company_fields — la scheda impresa, campo per campo.
-- ---------------------------------------------------------------------
create table public.company_fields (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  campo           text not null
                  constraint campo_valido check (length(campo) between 2 and 60),
  valore          text
                  constraint valore_lunghezza check (valore is null or length(valore) <= 2000),
  provenienza     text not null default 'utente'
                  constraint provenienza_valida check (provenienza in ('utente', 'motore')),
  -- La fonte del dato: 'registrazione', 'InfoCamere', 'INI-PEC', 'VIES'…
  fonte           text,
  stato           text not null default 'confermato'
                  constraint stato_campo_valido check (stato in ('confermato', 'da_confermare')),
  confirmed_at    timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (organization_id, campo)
);

create index company_fields_organization_idx
  on public.company_fields (organization_id);

create trigger company_fields_updated_at
  before update on public.company_fields
  for each row execute function public.set_updated_at();

alter table public.company_fields enable row level security;

-- Lettura: l'impresa vede la propria scheda; il consulente quella dei
-- clienti con mandato attivo (stesso perimetro delle altre tabelle).
create policy cf_select on public.company_fields
  for select to authenticated
  using (
    organization_id = public.current_org_id()
    or organization_id in (select public.orgs_gestite())
  );

-- Scrittura: SOLO l'impresa titolare (il consulente legge; il Motore
-- scrive via service_role, che bypassa la RLS).
create policy cf_insert on public.company_fields
  for insert to authenticated
  with check (organization_id = public.current_org_id());

create policy cf_update on public.company_fields
  for update to authenticated
  using (organization_id = public.current_org_id())
  with check (organization_id = public.current_org_id());

comment on table public.company_fields is
  'Scheda impresa estesa (SPEC §12.H): un record per campo, con provenienza (utente|motore), fonte e stato di conferma. La 2.1 vi innesta l''arricchimento automatico.';
