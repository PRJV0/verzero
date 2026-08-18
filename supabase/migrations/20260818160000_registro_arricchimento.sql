-- =====================================================================
-- TAPPA 2.1 (SPEC §12.H) — Registro tecnico dell'arricchimento.
--
-- Ogni interrogazione a una fonte lascia una riga: quale fonte, com'è
-- andata, quanto ha impiegato, quanti campi ha scritto. Serve a noi per
-- capire quali fonti reggono e quali no — non al cliente, che vede
-- soltanto l'esito nella sua scheda.
--
-- RLS ATTIVA E SENZA ALCUNA POLICY: è la forma più stretta possibile.
-- Nessun utente autenticato può leggere o scrivere questa tabella; ci
-- arriva solo la service_role, che per natura bypassa la RLS. Se un
-- giorno servisse mostrarne una parte al cliente, si aggiunge una policy
-- esplicita — mai il contrario.
-- =====================================================================

create table public.enrichment_runs (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  -- Chi ha chiesto l'arricchimento: 'ordine' (automatico all'attivazione)
  -- oppure 'manuale' (pulsante «Aggiorna i dati» nella scheda).
  innesco         text not null default 'manuale'
                  constraint innesco_valido check (innesco in ('ordine', 'manuale')),
  fonte           text not null,
  esito           text not null
                  constraint esito_valido
                  check (esito in ('ok', 'nessun_dato', 'errore', 'non_disponibile')),
  -- Messaggio tecnico: errore della fonte o vincolo che la tiene spenta.
  dettaglio       text,
  campi_scritti   integer not null default 0,
  durata_ms       integer not null default 0,
  created_at      timestamptz not null default now()
);

create index enrichment_runs_organization_idx
  on public.enrichment_runs (organization_id, created_at desc);

alter table public.enrichment_runs enable row level security;

-- Nessuna policy, volutamente: tabella di solo back-office.
