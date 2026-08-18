-- =====================================================================
-- SIGILLO IN PERCORSO (SPEC §12.F) — codice di verifica pubblico.
--
-- Ogni organizzazione riceve un codice non indovinabile che identifica
-- la sua pagina pubblica /verifica/[codice]: la pagina dichiara un
-- percorso AVVIATO e in corso — mai un risultato — ed è raggiunta dal
-- QR della targa di avvio. Il codice non è un segreto (finisce stampato
-- sulla targa) ma nemmeno enumerabile: niente id sequenziali.
--
-- Lettura: il titolare (e il consulente con mandato) via RLS esistente;
-- la pagina pubblica passa dalla service_role filtrando per codice.
-- Nessuna policy anon: il database resta chiuso al pubblico.
-- =====================================================================

alter table public.organizations
  add column codice_verifica text not null unique
  default substr(md5(gen_random_uuid()::text || clock_timestamp()::text), 1, 12);
