-- =====================================================================
-- OSSERVABILITÀ E RACCOLTA LEAD.
--
-- Quattro cose: il ruolo amministratore, il registro degli eventi, la
-- lista d'attesa e le note interne sui lead. Il filo comune è che tutto
-- questo è materiale di BACK-OFFICE: gli eventi e i messaggi non devono
-- essere leggibili da nessun cliente, e le note interne meno che mai.
--
-- Nota sul registro eventi: NON apriamo la tabella in scrittura ad anon.
-- Gli eventi arrivano da una route che scrive con la service_role dopo
-- aver validato il nome contro un elenco chiuso — una tabella con insert
-- pubblico è un invito a riempirla di spazzatura.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Ruolo amministratore.
-- ---------------------------------------------------------------------
alter table public.profiles drop constraint ruolo_valido;
alter table public.profiles
  add constraint ruolo_valido
  check (ruolo in ('impresa', 'consulente', 'amministratore'));

-- L'amministratore non ha organizzazione, come il consulente.
alter table public.profiles drop constraint if exists impresa_ha_organizzazione;
alter table public.profiles
  add constraint impresa_ha_organizzazione
  check (ruolo <> 'impresa' or organization_id is not null);

/**
 * Chi è amministratore. SECURITY DEFINER per poterla usare dentro le
 * policy senza ricorsione, con search_path bloccato.
 *
 * Il ruolo NON è assegnabile dal client: i grant di colonna della 2.0
 * escludono `ruolo` dagli aggiornamenti consentiti a authenticated, e i
 * test RLS lo verificano. Si diventa amministratori solo dal back-office.
 */
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and ruolo = 'amministratore'
  );
$$;

revoke all on function public.is_admin() from anon;

-- ---------------------------------------------------------------------
-- 2. Registro eventi — analitica di prima parte, senza cookie.
-- ---------------------------------------------------------------------
create table public.events (
  id          bigserial primary key,
  -- Nome dell'evento, da un elenco chiuso lato applicazione.
  nome        text not null
              constraint nome_evento_lunghezza check (length(nome) between 2 and 60),
  -- Il percorso della pagina, senza query: mai dati personali negli URL.
  percorso    text
              constraint percorso_lunghezza check (percorso is null or length(percorso) <= 300),
  -- Da dove arriva la visita (host del referrer, non l'URL completo).
  sorgente    text
              constraint sorgente_lunghezza check (sorgente is null or length(sorgente) <= 120),
  -- Dettagli non personali: slug del servizio, passo del funnel, formula.
  dettagli    jsonb not null default '{}'::jsonb,
  -- Impronta dell'IP con pepper, solo per distinguere le sessioni e
  -- frenare gli abusi: l'IP in chiaro non entra mai qui.
  visitatore  text
              constraint visitatore_lunghezza check (visitatore is null or length(visitatore) = 64),
  created_at  timestamptz not null default now()
);

create index events_nome_idx on public.events (nome, created_at desc);
create index events_created_idx on public.events (created_at desc);

alter table public.events enable row level security;

-- Lettura riservata all'amministratore; la scrittura passa dalla
-- service_role (nessuna policy di insert per authenticated o anon).
create policy events_select_admin on public.events
  for select to authenticated
  using (public.is_admin());

-- ---------------------------------------------------------------------
-- 3. Lista d'attesa.
-- ---------------------------------------------------------------------
create table public.waitlist (
  id          uuid primary key default gen_random_uuid(),
  email       text not null
              constraint waitlist_email_formato check (email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  nome        text,
  azienda     text,
  interesse   text,
  stato       text not null default 'nuovo'
              constraint waitlist_stato_valido
              check (stato in ('nuovo', 'contattato', 'convertito', 'chiuso')),
  note_interne text,
  ip_hash     text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (email)
);

create trigger waitlist_updated_at
  before update on public.waitlist
  for each row execute function public.set_updated_at();

alter table public.waitlist enable row level security;

create policy waitlist_select_admin on public.waitlist
  for select to authenticated
  using (public.is_admin());
create policy waitlist_update_admin on public.waitlist
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------
-- 4. Note interne sui lead + lettura dei messaggi per l'amministratore.
-- ---------------------------------------------------------------------
alter table public.contact_messages add column note_interne text;
alter table public.orders add column note_interne text;

-- contact_messages finora era chiusa a chiunque: ora l'amministratore
-- la legge e la lavora. Nessun altro ruolo la vede.
create policy contatti_select_admin on public.contact_messages
  for select to authenticated
  using (public.is_admin());
create policy contatti_update_admin on public.contact_messages
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Gli ordini: l'impresa vede i propri (policy esistente), l'ammini-
-- stratore li vede tutti perché è lui a doverli attivare.
create policy orders_select_admin on public.orders
  for select to authenticated
  using (public.is_admin());
create policy orders_update_admin on public.orders
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------
-- 5. Stato «richiesta» sugli ordini (modalità pre-lancio).
-- ---------------------------------------------------------------------
alter table public.orders drop constraint ord_stato_valido;
alter table public.orders
  add constraint ord_stato_valido
  check (stato in ('richiesta', 'in_attivazione', 'attivo', 'disdetto'));

-- Le attivazioni seguono lo stesso vocabolario: un percorso richiesto
-- non è ancora in attivazione, è in attesa che ne concordiamo l'avvio.
alter table public.module_activations drop constraint act_stato_valido;
alter table public.module_activations
  add constraint act_stato_valido
  check (stato in ('richiesto', 'in_attivazione', 'attivo', 'sospeso', 'disdetto'));

-- L'amministratore vede le attivazioni di tutti: è il suo cruscotto.
create policy attivazioni_select_admin on public.module_activations
  for select to authenticated
  using (public.is_admin());

-- L'amministratore legge le organizzazioni per dare un nome ai lead.
create policy org_select_admin on public.organizations
  for select to authenticated
  using (public.is_admin());
