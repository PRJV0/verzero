-- =====================================================================
-- IL MOTORE — TABELLE, TETTI DI SPESA E BACK-OFFICE
--
-- Tre cose:
--   1. `document_fields` impara le RIGHE. La bolletta è una scheda a
--      campi fissi, ma un registro di formazione o i dati di organico
--      sono tabelle: N righe della stessa forma. Senza la colonna `riga`
--      la seconda riga sovrascriverebbe la prima.
--   2. `motore_allarmi` — i tetti di spesa superati, in un posto dove si
--      vedono. Invisibili al cliente: mai attribuire all'ambiente o al
--      servizio un limite che è di budget.
--   3. Lettura di back-office su `extractions` per l'amministratore: il
--      cruscotto costo-per-pratica non può leggere una tabella chiusa.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Le righe.
--
-- `riga = 0` è la scheda (campi fissi, una volta sola); `riga >= 1` sono
-- le righe di una tabella, nell'ordine in cui stanno sul foglio. Il
-- vincolo di unicità si sposta di conseguenza: la stessa colonna può
-- ripetersi su righe diverse, ed è proprio quello che deve succedere.
-- ---------------------------------------------------------------------
alter table public.document_fields
  add column riga integer not null default 0
  constraint riga_non_negativa check (riga >= 0);

alter table public.document_fields
  drop constraint document_fields_document_id_campo_key;

alter table public.document_fields
  add constraint document_fields_document_riga_campo_key
  unique (document_id, riga, campo);

create index document_fields_riga_idx
  on public.document_fields (document_id, riga);

-- La provenienza di una TABELLA è per riga, non per cella (v. schemi.ts):
-- confidenza, pagina, estratto e fonte di lettura sono uguali su tutte le
-- celle della stessa riga, ed è così che vanno letti.
comment on column public.document_fields.riga is
  'Zero per le schede a campi fissi; da 1 in su per le righe di una tabella, nell''ordine del documento. Confidenza, pagina, estratto_da e fonte_lettura sono della RIGA e si ripetono su tutte le sue celle.';

-- ---------------------------------------------------------------------
-- 2. Gli allarmi di spesa — solo back-office.
--
-- Un tetto superato deve lasciare una traccia che qualcuno vede: un
-- blocco silenzioso è indistinguibile da un guasto, e un guasto che
-- nessuno guarda diventa un cliente fermo senza spiegazione.
-- ---------------------------------------------------------------------
create table public.motore_allarmi (
  id              uuid primary key default gen_random_uuid(),
  -- 'pratica' | 'organizzazione' | 'giorno'
  ambito          text not null
                  constraint ambito_valido
                  check (ambito in ('pratica', 'organizzazione', 'giorno')),
  -- 'soglia' quando si avvicina, 'tetto' quando si è fermato.
  livello         text not null
                  constraint livello_valido check (livello in ('soglia', 'tetto')),
  organization_id uuid references public.organizations (id) on delete set null,
  /** Il percorso, quando l'ambito è la pratica. */
  modulo          text,
  speso_micro     integer not null,
  tetto_micro     integer not null,
  nota            text,
  visto_at        timestamptz,
  created_at      timestamptz not null default now()
);

create index motore_allarmi_recenti_idx
  on public.motore_allarmi (created_at desc);
create index motore_allarmi_da_vedere_idx
  on public.motore_allarmi (visto_at, created_at desc);

alter table public.motore_allarmi enable row level security;

-- Solo l'amministratore, e solo in lettura: gli allarmi li scrive il
-- Motore col service role.
create policy allarmi_select_admin on public.motore_allarmi
  for select to authenticated
  using (public.is_admin());

comment on table public.motore_allarmi is
  'Tetti di spesa del Motore superati (docs/motore.md §7). SOLO back-office: il cliente non vede né il tetto né l''allarme — mai attribuire al servizio un limite che è di budget.';

-- ---------------------------------------------------------------------
-- 3. Il log tecnico diventa leggibile dall'amministratore.
--
-- Restava chiuso a tutti (ci accedeva solo il service role). Il cruscotto
-- costo-per-pratica e costo-per-cliente ha bisogno di leggerlo, e la
-- barriera giusta è la stessa di tutto il back-office: `is_admin()` sulla
-- policy, non un controllo nel codice della pagina.
-- ---------------------------------------------------------------------
create policy extractions_select_admin on public.extractions
  for select to authenticated
  using (public.is_admin());
