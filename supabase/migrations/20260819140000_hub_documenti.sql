-- =====================================================================
-- HUB DOCUMENTI (SPEC §12.E) — archivio unico dei documenti del cliente.
--
-- Due pezzi: la tabella che descrive ogni documento e il bucket privato
-- che ne contiene il file. Entrambi chiusi allo stesso modo: ogni
-- organizzazione vede e tocca SOLO la propria cartella, e il consulente
-- solo quelle dei clienti che gli hanno dato mandato attivo.
--
-- Il file NON è nel database: nel database c'è il suo indirizzo. La
-- cartella è la prima parte del percorso ed è l'id dell'organizzazione —
-- è su quel pezzo di stringa che la RLS dello storage fa il confronto.
-- =====================================================================

create table public.documents (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  caricato_da     uuid references auth.users (id) on delete set null,

  -- Il file
  nome_file       text not null
                  constraint nome_file_lunghezza check (length(nome_file) between 1 and 300),
  percorso        text not null unique
                  constraint percorso_lunghezza check (length(percorso) between 3 and 500),
  mime            text not null,
  dimensione      integer not null
                  constraint dimensione_positiva check (dimensione > 0),

  -- Il riconoscimento. `tipo` è la chiave di src/lib/documenti.ts; è
  -- nullo finché non si sa cosa sia. `tipo_confermato` distingue ciò che
  -- ha deciso il cliente da ciò che ha ipotizzato il riconoscimento
  -- automatico: la differenza conta, perché una regola sul nome del file
  -- è un indizio, non una certezza.
  tipo            text,
  tipo_confermato boolean not null default false,

  stato           text not null default 'da_classificare'
                  constraint stato_documento_valido
                  check (stato in ('smistato', 'da_classificare', 'non_pertinente')),

  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index documents_organization_idx
  on public.documents (organization_id, created_at desc);
create index documents_tipo_idx on public.documents (organization_id, tipo);

create trigger documents_updated_at
  before update on public.documents
  for each row execute function public.set_updated_at();

alter table public.documents enable row level security;

-- Lettura: l'impresa i propri, il consulente quelli dei clienti con
-- mandato attivo — stesso perimetro di tutto il resto del portale.
create policy doc_select on public.documents
  for select to authenticated
  using (
    organization_id = public.current_org_id()
    or organization_id in (select public.orgs_gestite())
  );

-- Scrittura: solo l'impresa titolare. Il consulente legge, non carica:
-- il caricamento per conto del cliente arriva col flusso di delega.
create policy doc_insert on public.documents
  for insert to authenticated
  with check (organization_id = public.current_org_id());

create policy doc_update on public.documents
  for update to authenticated
  using (organization_id = public.current_org_id())
  with check (organization_id = public.current_org_id());

create policy doc_delete on public.documents
  for delete to authenticated
  using (organization_id = public.current_org_id());

-- L'utente può correggere il tipo di un documento e archiviarlo, non
-- riscriverne l'indirizzo o la dimensione: quelli li stabilisce il
-- caricamento. Grant a colonna, come per la scheda impresa.
revoke update on public.documents from authenticated;
grant update (tipo, tipo_confermato, stato) on public.documents to authenticated;

-- ---------------------------------------------------------------------
-- Il bucket privato.
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'documenti',
  'documenti',
  false,
  20971520, -- 20 MB: una bolletta scansionata sta larga, un video no
  array[
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/heic',
    'image/heif'
  ]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- La cartella è l'organizzazione: `documenti/<organization_id>/<file>`.
-- storage.foldername() spezza il percorso, il primo elemento è la
-- cartella, e su quello si applica la stessa regola di tutto il resto.
create policy doc_storage_select on storage.objects
  for select to authenticated
  using (
    bucket_id = 'documenti'
    and (
      (storage.foldername(name))[1] = public.current_org_id()::text
      or (storage.foldername(name))[1] in (
        select o::text from public.orgs_gestite() o
      )
    )
  );

create policy doc_storage_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'documenti'
    and (storage.foldername(name))[1] = public.current_org_id()::text
  );

create policy doc_storage_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'documenti'
    and (storage.foldername(name))[1] = public.current_org_id()::text
  );
