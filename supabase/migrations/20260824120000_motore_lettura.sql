-- =====================================================================
-- IL MOTORE — LETTURA DEI DOCUMENTI (docs/motore.md §4, §7)
--
-- Tre pezzi:
--   1. `documents.stato` impara a dire che un documento è in lettura,
--      letto, o illeggibile: senza, il portale non può mostrare
--      avanzamento onesto né esito;
--   2. `document_fields` — i campi estratti, uno per riga, ciascuno con
--      confidenza, PAGINA di provenienza, estratto testuale e stato di
--      conferma. È qui che vive la regola inviolabile: nasce sempre
--      `da_confermare`, e finché è così non entra nei calcoli né fa
--      salire l'anello a peso pieno;
--   3. `extractions` — il log tecnico, di SOLO back-office: una riga per
--      chiamata, con token, durata, costo calcolato dai token effettivi e
--      risposta grezza. Nessuna policy per gli utenti autenticati.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Gli stati di lettura di un documento.
-- ---------------------------------------------------------------------
alter table public.documents drop constraint stato_documento_valido;
alter table public.documents add constraint stato_documento_valido
  check (stato in (
    'smistato',          -- riconosciuto e assegnato ai percorsi
    'da_classificare',   -- non sappiamo cos'è: si chiede
    'non_pertinente',    -- non serve ai percorsi attivi
    'in_lettura',        -- il Motore lo sta leggendo adesso
    'letto',             -- letto: i campi sono in document_fields
    'illeggibile'        -- provato a leggere, non si legge: si dice perché
  ));

-- Il motivo per cui non si è potuto leggere, in italiano, da mostrare in
-- pagina. Un «illeggibile» senza rimedio è una porta chiusa.
alter table public.documents add column lettura_nota text;
alter table public.documents add column letto_at timestamptz;

-- L'utente può correggere il tipo e archiviare; gli stati di lettura li
-- scrive il Motore col service role. Il grant a colonna resta com'era.

-- ---------------------------------------------------------------------
-- 2. document_fields — i campi estratti, con la loro verificabilità.
-- ---------------------------------------------------------------------
create table public.document_fields (
  id              uuid primary key default gen_random_uuid(),
  document_id     uuid not null references public.documents (id) on delete cascade,
  organization_id uuid not null references public.organizations (id) on delete cascade,

  campo           text not null
                  constraint campo_lunghezza check (length(campo) between 2 and 60),
  etichetta       text not null,
  -- Sempre testo: la formattazione è resa, non dato. Un numero salvato
  -- come testo si mostra com'è stato letto e non prende arrotondamenti
  -- dal tipo di colonna.
  valore          text
                  constraint valore_lunghezza check (valore is null or length(valore) <= 500),
  unita           text,

  -- ═══ La verificabilità (docs/motore.md §4.2, §4.3) ═══
  confidenza      numeric(3,2) not null default 0
                  constraint confidenza_fra_zero_e_uno check (confidenza between 0 and 1),
  pagina          integer
                  constraint pagina_positiva check (pagina is null or pagina > 0),
  -- La stringa così com'è scritta nel documento: è la prova che il valore
  -- è stato letto e non dedotto.
  estratto_da     text,
  fonte_lettura   text not null default 'testo'
                  constraint fonte_lettura_valida
                  check (fonte_lettura in ('testo', 'immagine', 'manoscritto')),
  nota            text,
  -- Quello che non torna, già in italiano: un array di frasi.
  avvisi          text[] not null default '{}',

  -- ═══ La regola inviolabile (docs/motore.md §4.4) ═══
  -- Nasce SEMPRE 'da_confermare'. Il default non è una comodità: è il
  -- posizionamento legale del prodotto — l'AI assiste, il cliente valida.
  stato           text not null default 'da_confermare'
                  constraint stato_campo_valido
                  check (stato in ('da_confermare', 'confermato', 'rifiutato')),
  confirmed_at    timestamptz,

  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  -- Rileggere lo stesso documento aggiorna i suoi campi, non ne crea di
  -- nuovi accanto ai vecchi.
  unique (document_id, campo)
);

create index document_fields_organization_idx
  on public.document_fields (organization_id, stato);
create index document_fields_document_idx
  on public.document_fields (document_id);

create trigger document_fields_updated_at
  before update on public.document_fields
  for each row execute function public.set_updated_at();

alter table public.document_fields enable row level security;

-- Lettura: l'impresa i propri, il consulente quelli dei clienti con
-- mandato attivo — stesso perimetro di tutto il resto del portale.
create policy df_select on public.document_fields
  for select to authenticated
  using (
    organization_id = public.current_org_id()
    or organization_id in (select public.orgs_gestite())
  );

-- Scrittura: le righe le crea il Motore (service role). L'impresa
-- CONFERMA, CORREGGE o RIFIUTA — e nient'altro: non può inventarsi una
-- confidenza o una pagina di provenienza, che sono il fondamento della
-- verificabilità.
create policy df_update on public.document_fields
  for update to authenticated
  using (organization_id = public.current_org_id())
  with check (organization_id = public.current_org_id());

revoke update on public.document_fields from authenticated;
grant update (valore, stato, confirmed_at) on public.document_fields to authenticated;

comment on table public.document_fields is
  'I campi estratti dai documenti (docs/motore.md §4): valore, confidenza, pagina di provenienza, estratto testuale, stato di conferma. Nasce sempre da_confermare e non entra nei calcoli finché il cliente non conferma.';

-- ---------------------------------------------------------------------
-- 3. extractions — il log tecnico, di solo back-office.
--
-- Nessuna policy per gli utenti autenticati: ci accede il service role.
-- Serve a tre domande che senza registro non hanno risposta — quanto
-- costa davvero una pratica, quale tipo di documento fallisce più
-- spesso, se un cambio di prompt ha peggiorato le cose.
-- ---------------------------------------------------------------------
create table public.extractions (
  id               uuid primary key default gen_random_uuid(),
  document_id      uuid references public.documents (id) on delete set null,
  organization_id  uuid references public.organizations (id) on delete set null,

  famiglia         text,
  tipo             text,
  versione_schema  text,
  modello          text not null,

  esito            text not null
                   constraint esito_valido
                   check (esito in ('ok', 'altro_tipo', 'illeggibile', 'non_valido', 'errore')),
  qualita          text,
  -- Dal rilevamento locale: serve a sapere se la scansione costa e
  -- sbaglia più del nativo, invece di supporlo.
  pdf_nativo       boolean,
  pagine           integer,

  token_ingresso   integer,
  token_uscita     integer,
  -- MILIONESIMI di dollaro, interi: una somma di centinaia di migliaia di
  -- frazioni decimali deriva, e questo numero alimenta il tetto di spesa.
  costo_micro      integer,
  durata_ms        integer,

  avvisi           text[],
  errore           text,
  -- La risposta così com'è arrivata: senza, un dato sbagliato non si può
  -- spiegare a posteriori.
  grezzo           jsonb,

  created_at       timestamptz not null default now()
);

create index extractions_organization_idx
  on public.extractions (organization_id, created_at desc);
create index extractions_document_idx on public.extractions (document_id);
create index extractions_esito_idx on public.extractions (esito, created_at desc);

alter table public.extractions enable row level security;

comment on table public.extractions is
  'Log tecnico del Motore (docs/motore.md §7), SOLO back-office: nessuna policy per authenticated. Una riga per chiamata, con token, durata e costo calcolato dai token effettivi.';
