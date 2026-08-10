-- ---------------------------------------------------------------------
-- Messaggi dal modulo di contatto pubblico (/contatti).
--
-- Modello di accesso: la tabella e CHIUSA. RLS attiva e NESSUNA policy —
-- quindi anon e authenticated non possono ne leggere ne scrivere. L'unica
-- via di scrittura e l'API server (/api/contatti) che usa la service role
-- e applica validazione e rate limiting; la lettura resta al service_role.
--
-- Privacy: non memorizziamo l'IP in chiaro ma un hash con pepper, che
-- serve solo a contare i tentativi ravvicinati. E un dato di sicurezza,
-- non un identificatore da conservare in forma leggibile.
-- ---------------------------------------------------------------------

create table public.contact_messages (
  id          uuid primary key default gen_random_uuid(),
  nome        text not null constraint nome_non_vuoto check (length(btrim(nome)) between 2 and 120),
  azienda     text constraint azienda_lunghezza check (azienda is null or length(btrim(azienda)) <= 160),
  email       text not null constraint email_plausibile check (email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[a-z]{2,}$'),
  oggetto     text not null
              constraint oggetto_valido check (oggetto in ('informazioni', 'servizi', 'partnership')),
  messaggio   text not null constraint messaggio_lunghezza check (length(btrim(messaggio)) between 10 and 4000),
  -- Hash dell'IP (sha256 con pepper applicativo): solo per il rate limiting.
  ip_hash     text,
  user_agent  text,
  -- Stato di lavorazione, per quando arrivera la casella condivisa.
  stato       text not null default 'nuovo'
              constraint stato_valido check (stato in ('nuovo', 'in_lavorazione', 'chiuso')),
  created_at  timestamptz not null default now()
);

-- Il rate limiting interroga per hash e finestra temporale.
create index contact_messages_ip_hash_created_at_idx
  on public.contact_messages (ip_hash, created_at desc);
create index contact_messages_created_at_idx
  on public.contact_messages (created_at desc);

alter table public.contact_messages enable row level security;

-- Nessuna policy, volutamente: senza policy la RLS nega tutto a chiunque
-- non sia service_role. Se un giorno servira una casella in area riservata,
-- si aggiungera una policy di sola lettura per un ruolo interno esplicito.

comment on table public.contact_messages is
  'Messaggi dal modulo pubblico /contatti. Scrittura solo via API service_role con rate limiting; nessun accesso per anon/authenticated.';
