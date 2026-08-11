-- =====================================================================
-- DUE PROFILI DI ACCESSO (SPEC §12.K): impresa e consulente partner.
--
-- L'impresa resta TITOLARE dei propri dati. Il consulente accede ai dati
-- di un'organizzazione SOLO attraverso un collegamento con mandato
-- ATTIVO in consultant_organizations: il collegamento nasce da un invito
-- o consenso dell'impresa e l'impresa può revocarlo in ogni momento.
-- In questa fase il consulente LEGGE (dashboard con selettore cliente);
-- le scritture per conto del cliente arrivano con le fasi 2-3.
-- =====================================================================

-- ---------------------------------------------------------------------
-- profiles: il ruolo di accesso. "role" resta il ruolo DENTRO
-- l'organizzazione (owner/member); "ruolo" distingue i due profili.
-- Il consulente non appartiene a un'organizzazione cliente: il suo
-- organization_id resta nullo, e per le imprese resta obbligatorio.
-- ---------------------------------------------------------------------
alter table public.profiles
  add column ruolo text not null default 'impresa'
  constraint ruolo_valido check (ruolo in ('impresa', 'consulente'));

alter table public.profiles alter column organization_id drop not null;

alter table public.profiles
  add constraint impresa_ha_organizzazione
  check (ruolo = 'consulente' or organization_id is not null);

-- ---------------------------------------------------------------------
-- consultant_organizations: il mandato consulente ↔ organizzazione.
-- ---------------------------------------------------------------------
create table public.consultant_organizations (
  id              uuid primary key default gen_random_uuid(),
  consultant_id   uuid not null references auth.users (id) on delete cascade,
  organization_id uuid not null references public.organizations (id) on delete cascade,
  stato           text not null default 'attivo'
                  constraint mandato_valido check (stato in ('attivo', 'revocato')),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (consultant_id, organization_id)
);

create index consultant_organizations_consultant_idx
  on public.consultant_organizations (consultant_id) where stato = 'attivo';
create index consultant_organizations_organization_idx
  on public.consultant_organizations (organization_id);

create trigger consultant_organizations_updated_at
  before update on public.consultant_organizations
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- Helper RLS: le organizzazioni gestite dal consulente corrente, con
-- mandato attivo. SECURITY DEFINER come current_org_id(), così le policy
-- delle altre tabelle possono usarla senza ricorsione RLS.
-- ---------------------------------------------------------------------
create or replace function public.orgs_gestite()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select organization_id
  from public.consultant_organizations
  where consultant_id = auth.uid() and stato = 'attivo';
$$;

revoke all on function public.orgs_gestite() from anon;

-- ---------------------------------------------------------------------
-- RLS su consultant_organizations.
-- Il consulente vede i propri collegamenti; l'impresa vede quelli verso
-- di sé e può revocarli (titolarità del dato). Nessun insert da client:
-- in questa fase i collegamenti nascono dal back-office (service_role);
-- il flusso di invito arriva con la fase 2.
-- ---------------------------------------------------------------------
alter table public.consultant_organizations enable row level security;

create policy co_select on public.consultant_organizations
  for select to authenticated
  using (
    consultant_id = auth.uid()
    or organization_id = public.current_org_id()
  );

create policy co_revoca on public.consultant_organizations
  for update to authenticated
  using (organization_id = public.current_org_id())
  with check (
    organization_id = public.current_org_id()
    and stato in ('attivo', 'revocato')
  );

-- ---------------------------------------------------------------------
-- Policy di lettura estese: l'impresa vede sé stessa (come prima), il
-- consulente vede le organizzazioni con mandato attivo. Le scritture
-- restano SOLO dell'impresa: nessuna estensione a insert/update.
-- ---------------------------------------------------------------------
drop policy org_select on public.organizations;
create policy org_select on public.organizations
  for select to authenticated
  using (
    id = public.current_org_id()
    or id in (select public.orgs_gestite())
  );

drop policy orders_select on public.orders;
create policy orders_select on public.orders
  for select to authenticated
  using (
    organization_id = public.current_org_id()
    or organization_id in (select public.orgs_gestite())
  );

drop policy consents_select on public.consents;
create policy consents_select on public.consents
  for select to authenticated
  using (
    organization_id = public.current_org_id()
    or organization_id in (select public.orgs_gestite())
  );

drop policy activations_select on public.module_activations;
create policy activations_select on public.module_activations
  for select to authenticated
  using (
    organization_id = public.current_org_id()
    or organization_id in (select public.orgs_gestite())
  );

comment on table public.consultant_organizations is
  'Mandati consulente-organizzazione (SPEC §12.K). Il consulente legge i dati del cliente solo con stato attivo; l''impresa vede e revoca i collegamenti verso di sé.';
