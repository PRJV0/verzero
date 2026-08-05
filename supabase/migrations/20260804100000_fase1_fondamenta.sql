-- =====================================================================
-- FASE 1 — Fondamenta dati (SPEC §3, §4, §12.T, §15.1)
-- Tabelle: organizations, profiles, orders, consents, module_activations.
-- RLS OBBLIGATORIA su tutte: ogni utente vede/modifica SOLO i dati della
-- propria organizzazione (via profiles.organization_id). La service_role
-- bypassa la RLS per le operazioni di back-office (comportamento nativo
-- Supabase: il ruolo service_role ha BYPASSRLS).
-- =====================================================================

-- ---------------------------------------------------------------------
-- Trigger comune: updated_at sempre aggiornato.
-- ---------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------
-- organizations — l'impresa cliente (tenant).
-- ---------------------------------------------------------------------
create table public.organizations (
  id               uuid primary key default gen_random_uuid(),
  ragione_sociale  text not null,
  partita_iva      text not null unique
                   constraint partita_iva_formato check (partita_iva ~ '^[0-9]{11}$'),
  dimensione       text not null default 'micro'
                   constraint dimensione_valida check (dimensione in ('micro','piccola','media','grande')),
  settore          text,
  -- Dati di fatturazione (completati al primo pagamento reale).
  billing_email    text,
  billing_sdi      text,
  billing_indirizzo text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create trigger organizations_updated_at
  before update on public.organizations
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- profiles — estende auth.users; aggancia l'utente alla sua organizzazione.
-- ---------------------------------------------------------------------
create table public.profiles (
  id              uuid primary key references auth.users (id) on delete cascade,
  organization_id uuid not null references public.organizations (id) on delete cascade,
  full_name       text,
  role            text not null default 'owner'
                  constraint role_valido check (role in ('owner','member')),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index profiles_organization_id_idx on public.profiles (organization_id);

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- Helper RLS: organizzazione dell'utente corrente.
-- SECURITY DEFINER per poterla usare dentro le policy di profiles stessa
-- senza ricorsione RLS; search_path bloccato per sicurezza.
-- ---------------------------------------------------------------------
create or replace function public.current_org_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select organization_id from public.profiles where id = auth.uid();
$$;

revoke all on function public.current_org_id() from anon;

-- ---------------------------------------------------------------------
-- orders — gli ordini del funnel di acquisto (SPEC §12.T).
-- Prezzi fotografati all'ordine (interi in euro, IVA esclusa).
-- ---------------------------------------------------------------------
create table public.orders (
  id                 uuid primary key default gen_random_uuid(),
  organization_id    uuid not null references public.organizations (id) on delete cascade,
  created_by         uuid references auth.users (id) on delete set null,
  servizio_slug      text not null,
  taglio             text,
  dimensione         text not null
                     constraint ord_dimensione_valida check (dimensione in ('micro','piccola','media','grande')),
  formula            text not null
                     constraint formula_valida check (formula in ('mensile','annuale')),
  prezzo_canone      integer not null,
  prezzo_una_tantum  integer,
  stato              text not null default 'in_attivazione'
                     constraint ord_stato_valido check (stato in ('in_attivazione','attivo','disdetto')),
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index orders_organization_id_idx on public.orders (organization_id);
create index orders_stato_idx on public.orders (stato);

create trigger orders_updated_at
  before update on public.orders
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- consents — consensi tracciati con versione del testo (SPEC §15.1).
-- ---------------------------------------------------------------------
create table public.consents (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  user_id         uuid references auth.users (id) on delete set null,
  doc_type        text not null
                  constraint doc_type_valido check (doc_type in ('condizioni_servizio','mandato_banche_dati')),
  doc_version     text not null,
  accepted_at     timestamptz not null,
  revoked_at      timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index consents_organization_id_idx on public.consents (organization_id);
create index consents_doc_type_idx on public.consents (doc_type);

create trigger consents_updated_at
  before update on public.consents
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- module_activations — i moduli/servizi dell'organizzazione (SPEC §4).
-- ---------------------------------------------------------------------
create table public.module_activations (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  module          text not null,
  order_id        uuid references public.orders (id) on delete set null,
  stato           text not null default 'in_attivazione'
                  constraint act_stato_valido check (stato in ('in_attivazione','attivo','sospeso','disdetto')),
  activated_at    timestamptz,
  renews_at       timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index module_activations_organization_id_idx on public.module_activations (organization_id);
create index module_activations_module_idx on public.module_activations (module);

create trigger module_activations_updated_at
  before update on public.module_activations
  for each row execute function public.set_updated_at();

-- =====================================================================
-- ROW LEVEL SECURITY — barriera primaria (SPEC §3).
-- Nessuna policy per anon: chi non è autenticato non vede nulla.
-- Le scritture di onboarding (creazione org/profile) e di back-office
-- passano dalla service_role, che bypassa la RLS.
-- =====================================================================

alter table public.organizations      enable row level security;
alter table public.profiles           enable row level security;
alter table public.orders             enable row level security;
alter table public.consents           enable row level security;
alter table public.module_activations enable row level security;

-- organizations: vedo e aggiorno solo la mia.
create policy org_select on public.organizations
  for select to authenticated
  using (id = public.current_org_id());

create policy org_update on public.organizations
  for update to authenticated
  using (id = public.current_org_id())
  with check (id = public.current_org_id());

-- profiles: vedo me stesso e i colleghi della mia organizzazione;
-- aggiorno solo il mio profilo (mai il campo organization_id: bloccato
-- dal with check che deve restare nella stessa org).
create policy profiles_select on public.profiles
  for select to authenticated
  using (id = auth.uid() or organization_id = public.current_org_id());

create policy profiles_update on public.profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid() and organization_id = public.current_org_id());

-- orders: visibili e scrivibili solo dentro la propria organizzazione.
create policy orders_select on public.orders
  for select to authenticated
  using (organization_id = public.current_org_id());

create policy orders_insert on public.orders
  for insert to authenticated
  with check (organization_id = public.current_org_id());

create policy orders_update on public.orders
  for update to authenticated
  using (organization_id = public.current_org_id())
  with check (organization_id = public.current_org_id());

-- consents: come sopra; l'inserimento è legato anche all'utente che firma.
create policy consents_select on public.consents
  for select to authenticated
  using (organization_id = public.current_org_id());

create policy consents_insert on public.consents
  for insert to authenticated
  with check (
    organization_id = public.current_org_id()
    and user_id = auth.uid()
  );

create policy consents_update on public.consents
  for update to authenticated
  using (organization_id = public.current_org_id())
  with check (organization_id = public.current_org_id());

-- module_activations: lettura per l'organizzazione; scritture dal back-office
-- (service_role) o comunque solo dentro la propria organizzazione.
create policy activations_select on public.module_activations
  for select to authenticated
  using (organization_id = public.current_org_id());

create policy activations_insert on public.module_activations
  for insert to authenticated
  with check (organization_id = public.current_org_id());

create policy activations_update on public.module_activations
  for update to authenticated
  using (organization_id = public.current_org_id())
  with check (organization_id = public.current_org_id());
