-- ════════════════════════════════════════════════════════════════════
-- GLI ELABORATI GENERATI E IL MARCHIO DEL CLIENTE (docs/motore.md §5, §6, §8)
--
-- ⚠️  NON ANCORA APPLICATA AL REMOTO. Si applica via Management API in
--     HTTPS (la rete blocca il protocollo Postgres, v. CLAUDE.md), poi si
--     registra la versione in supabase_migrations.schema_migrations.
--     Finché non c'è, il portale lo dice invece di rompersi: la bozza
--     resta, il controllo di consegna gira, e il pannello del documento
--     finale spiega che la generazione non è ancora attiva su questo
--     ambiente (src/lib/elaborato/archivio.ts).
--
-- Cinque pezzi:
--   1. `brand_settings` — la veste dei documenti, una riga per impresa;
--   2. il bucket `marchi` — il logo, già preparato per la stampa;
--   3. `elaborati_versioni` — ogni generazione è una VERSIONE, immutabile;
--   4. il bucket `elaborati` — i file PDF e DOCX di ogni versione;
--   5. i segni di provenienza sulle correzioni del cliente, messi dalla
--      banca dati e non dal portale.
--
-- ═══ CHI SCRIVE ═══
-- Le versioni e il logo li scrive il SERVER col service role, dopo aver
-- verificato chi chiede e che cosa: una versione è un documento
-- consegnato, e un client che potesse inserirne una potrebbe fabbricare
-- un inventario «validato». Il cliente scrive solo le parti della veste
-- che sono sue parole: colore, nome in intestazione, contatti.
-- ════════════════════════════════════════════════════════════════════

begin;

-- ---------------------------------------------------------------------
-- 1. brand_settings — la veste dei documenti.
-- ---------------------------------------------------------------------
create table if not exists public.brand_settings (
  organization_id   uuid primary key references public.organizations (id) on delete cascade,

  -- Il logo, già rifilato e convertito in PNG dal server. Le dimensioni
  -- servono a posarlo senza sgranarlo; le scrive chi l'ha misurato.
  logo_percorso     text
                    constraint logo_percorso_lunghezza check (logo_percorso is null or length(logo_percorso) between 3 and 300),
  logo_larghezza    integer constraint logo_larghezza_positiva check (logo_larghezza is null or logo_larghezza > 0),
  logo_altezza      integer constraint logo_altezza_positiva check (logo_altezza is null or logo_altezza > 0),
  logo_vettoriale   boolean not null default false,
  -- I messaggi del controllo sul logo, come li ha letti il cliente.
  logo_esito        jsonb,

  colore_accento    text
                    constraint colore_formato check (colore_accento is null or colore_accento ~ '^#[0-9A-Fa-f]{6}$'),
  nome_intestazione text constraint nome_lunghezza check (nome_intestazione is null or length(nome_intestazione) <= 80),
  indirizzo         text constraint indirizzo_lunghezza check (indirizzo is null or length(indirizzo) <= 200),
  sito              text constraint sito_lunghezza check (sito is null or length(sito) <= 200),
  contatto          text constraint contatto_lunghezza check (contatto is null or length(contatto) <= 200),

  updated_by        uuid references auth.users (id) on delete set null,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

drop trigger if exists brand_settings_updated_at on public.brand_settings;
create trigger brand_settings_updated_at
  before update on public.brand_settings
  for each row execute function public.set_updated_at();

alter table public.brand_settings enable row level security;

drop policy if exists bs_select on public.brand_settings;
create policy bs_select on public.brand_settings
  for select to authenticated
  using (
    organization_id = public.current_org_id()
    or organization_id in (select public.orgs_gestite())
  );

drop policy if exists bs_insert on public.brand_settings;
create policy bs_insert on public.brand_settings
  for insert to authenticated
  with check (organization_id = public.current_org_id());

drop policy if exists bs_update on public.brand_settings;
create policy bs_update on public.brand_settings
  for update to authenticated
  using (organization_id = public.current_org_id())
  with check (organization_id = public.current_org_id());

-- Il cliente scrive le sue parole; il logo e le sue misure no.
-- `organization_id` è anche nel permesso di aggiornamento perché l'upsert
-- di PostgREST riscrive la colonna del conflitto: il «with check» della
-- policy impedisce comunque di spostare la riga su un'altra impresa.
revoke insert, update on public.brand_settings from authenticated;
grant insert (organization_id, colore_accento, nome_intestazione, indirizzo, sito, contatto, updated_by)
  on public.brand_settings to authenticated;
grant update (organization_id, colore_accento, nome_intestazione, indirizzo, sito, contatto, updated_by)
  on public.brand_settings to authenticated;

comment on table public.brand_settings is
  'La veste dei documenti generati (docs/motore.md §6): logo preparato dal server, colore d''accento e contatti scritti dal cliente. Senza riga, i documenti escono nella veste neutra.';

-- ---------------------------------------------------------------------
-- 2. Il bucket `marchi`.
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('marchi', 'marchi', false, 5242880, array['image/png'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists marchi_select on storage.objects;
create policy marchi_select on storage.objects
  for select to authenticated
  using (
    bucket_id = 'marchi'
    and (
      (storage.foldername(name))[1] = public.current_org_id()::text
      or (storage.foldername(name))[1] in (select o::text from public.orgs_gestite() o)
    )
  );
-- Nessuna policy di scrittura: il logo lo carica il server dopo averlo
-- controllato. Un file messo nel bucket dal browser salterebbe il controllo.

-- ---------------------------------------------------------------------
-- 3. elaborati_versioni — ogni generazione è una versione.
-- ---------------------------------------------------------------------
create table if not exists public.elaborati_versioni (
  id                     uuid primary key default gen_random_uuid(),
  organization_id        uuid not null references public.organizations (id) on delete cascade,

  percorso               text not null,
  modello                text not null,
  documento              text not null,
  esercizio              integer not null
                         constraint esercizio_plausibile check (esercizio between 2015 and 2100),
  revisione              integer not null constraint revisione_non_negativa check (revisione >= 0),
  codice                 text not null,
  motivo                 text not null,
  -- Che cosa è cambiato rispetto alla revisione precedente, in italiano.
  cambiato               text[] not null default '{}',

  -- ═══ Su che cosa è costruita — COPIATO dentro, non riferito ═══
  standard               text,
  versione_standard      text,
  designazione_standard  text,
  riferimenti            jsonb not null default '[]',
  fonti                  jsonb not null default '[]',
  -- L'albero completo del documento: rigenerare il file di una versione
  -- (per la validazione) non deve ricomporla dai dati di oggi.
  contenuto              jsonb not null,
  impronta               jsonb not null,
  impronta_testo         text not null,
  veste                  jsonb not null default '{}',

  -- ═══ La validazione professionale ═══
  stato_validazione      text not null default 'in_attesa'
                         constraint stato_validazione_valido check (stato_validazione in ('in_attesa', 'validata')),
  validata_da            text,
  validata_qualifica     text,
  validata_il            timestamptz,
  rilievi                text[],
  -- La revisione di cui questa è la validazione, quando lo è. In cascata e
  -- non «set null»: azzerare il riferimento sarebbe una modifica, e le
  -- versioni non si modificano — il vincolo sotto la bloccherebbe, e con
  -- lei la cancellazione dell'impresa.
  valida_revisione       uuid references public.elaborati_versioni (id) on delete cascade,

  -- ═══ I file ═══
  pdf_percorso           text not null,
  pdf_byte               integer not null constraint pdf_byte_positivi check (pdf_byte > 0),
  pdf_pagine             integer not null constraint pdf_pagine_positive check (pdf_pagine > 0),
  pdf_sha256             text not null constraint pdf_sha_lunghezza check (length(pdf_sha256) = 64),
  docx_percorso          text,
  docx_byte              integer,
  docx_sha256            text,

  generata_da            uuid references auth.users (id) on delete set null,
  created_at             timestamptz not null default now(),

  unique (organization_id, modello, esercizio, revisione),
  constraint validata_ha_chi check (
    stato_validazione = 'in_attesa'
    or (validata_da is not null and validata_il is not null)
  )
);

create index if not exists elaborati_versioni_documento_idx
  on public.elaborati_versioni (organization_id, modello, esercizio, revisione desc);
create index if not exists elaborati_versioni_in_attesa_idx
  on public.elaborati_versioni (stato_validazione, created_at desc);

alter table public.elaborati_versioni enable row level security;

drop policy if exists ev_select on public.elaborati_versioni;
create policy ev_select on public.elaborati_versioni
  for select to authenticated
  using (
    organization_id = public.current_org_id()
    or organization_id in (select public.orgs_gestite())
    or public.is_admin()
  );
-- Nessuna policy di scrittura per authenticated: le versioni le scrive il
-- server col service role.

-- Una versione consegnata non si modifica: una correzione è una revisione
-- nuova. Il vincolo vale anche per il service role, perché è il service
-- role che potrebbe sbagliare. La cancellazione resta possibile — la
-- cancellazione dell'impresa porta via i suoi documenti, per diritto.
--
-- UNA SOLA ECCEZIONE, e non è una modifica del documento: l'azzeramento di
-- `generata_da`. Postgres lo esegue da sé, come UPDATE, quando l'utente che
-- ha generato la versione viene cancellato (`on delete set null`): senza
-- l'eccezione quella cancellazione — anche quella dovuta per diritto
-- all'oblio — fallirebbe su ogni documento che l'utente ha generato. Si
-- ammette solo se TUTTO il resto della riga resta identico.
create or replace function public.versioni_immutabili()
returns trigger
language plpgsql
as $$
begin
  if old.generata_da is not null
     and new.generata_da is null
     and (to_jsonb(new) - 'generata_da') = (to_jsonb(old) - 'generata_da') then
    return new;
  end if;
  raise exception 'Una versione di elaborato non si modifica: si emette una revisione nuova.';
end;
$$;

drop trigger if exists elaborati_versioni_immutabili on public.elaborati_versioni;
create trigger elaborati_versioni_immutabili
  before update on public.elaborati_versioni
  for each row execute function public.versioni_immutabili();

comment on table public.elaborati_versioni is
  'Gli elaborati generati (docs/motore.md §8): una riga per revisione, immutabile, con norme, fonti e contenuto copiati dentro, impronta degli ingressi per il riuso e stato di validazione. Scritta solo dal server.';

-- ---------------------------------------------------------------------
-- 4. Il bucket `elaborati`.
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'elaborati',
  'elaborati',
  false,
  52428800,
  array['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists elaborati_select on storage.objects;
create policy elaborati_select on storage.objects
  for select to authenticated
  using (
    bucket_id = 'elaborati'
    and (
      (storage.foldername(name))[1] = public.current_org_id()::text
      or (storage.foldername(name))[1] in (select o::text from public.orgs_gestite() o)
    )
  );

-- ---------------------------------------------------------------------
-- 5. La provenienza la decide chi scrive, non chi dichiara.
--
-- Nel documento consegnato un valore riscritto dal cliente porta la sigla
-- I, uno letto dal documento la D, uno recuperato da una banca dati la B.
-- La composizione lo capisce da un segno — l'avviso «Scritto da te» sulle
-- celle dei documenti, `provenienza` sulla scheda impresa — che scrive il
-- portale. Ma il client può aggiornare `valore` da solo, e il segno non lo
-- tocca: un PATCH diretto farebbe passare un numero suo per letto dalla
-- bolletta, o un indirizzo suo per recuperato dal VIES.
--
-- Qui il segno lo mette la banca dati, quando cambia il valore e a
-- cambiarlo è un utente autenticato (il service role scrive le letture
-- del Motore e le correzioni già marcate dal server).
-- ---------------------------------------------------------------------
create or replace function public.document_fields_scritto_dal_cliente()
returns trigger
language plpgsql
as $$
begin
  if current_user = 'authenticated' and new.valore is distinct from old.valore then
    new.avvisi := array['Scritto da te: questo valore non viene dalla nostra lettura.'];
  end if;
  return new;
end;
$$;

drop trigger if exists document_fields_scritto_dal_cliente on public.document_fields;
create trigger document_fields_scritto_dal_cliente
  before update on public.document_fields
  for each row execute function public.document_fields_scritto_dal_cliente();

create or replace function public.company_fields_corretto_dal_cliente()
returns trigger
language plpgsql
as $$
begin
  if current_user = 'authenticated' and new.valore is distinct from old.valore and old.provenienza = 'motore' then
    new.provenienza := 'utente';
    new.fonte := 'Corretto dall''impresa nella scheda';
    new.fonte_url := null;
  end if;
  return new;
end;
$$;

drop trigger if exists company_fields_corretto_dal_cliente on public.company_fields;
create trigger company_fields_corretto_dal_cliente
  before update on public.company_fields
  for each row execute function public.company_fields_corretto_dal_cliente();

commit;

-- ════════════════════════════════════════════════════════════════════
-- DOPO L'APPLICAZIONE, registrare la versione:
--
--   insert into supabase_migrations.schema_migrations (version, name)
--   values ('20260915120000', 'elaborati_e_marchio')
--   on conflict (version) do nothing;
-- ════════════════════════════════════════════════════════════════════
