-- =====================================================================
-- TAPPA 2.1, estensione (SPEC §12.D) — presenza web del cliente.
--
-- Tre aggiunte, tutte al servizio della stessa regola: un dato preso dal
-- web del cliente deve essere VERIFICABILE e RIFIUTABILE.
--
-- 1. organizations.sito_web — il sito ufficiale, dichiarato in
--    registrazione (o, in futuro, dedotto dalla visura camerale). È
--    l'unico dominio che il Motore ha il permesso di leggere.
-- 2. company_fields.fonte_url — l'indirizzo esatto della pagina da cui
--    il dato è stato preso. Senza questo un dato qualitativo non è
--    controllabile, e un dato non controllabile non lo scriviamo.
-- 3. stato 'rifiutato' — il cliente può respingere OGNI SINGOLO campo,
--    non solo confermarlo. Un campo rifiutato non torna più: il Motore
--    lo tratta come intoccabile, esattamente come uno confermato.
-- =====================================================================

alter table public.organizations
  add column sito_web text
  constraint sito_web_lunghezza check (sito_web is null or length(sito_web) <= 300);

alter table public.company_fields
  add column fonte_url text
  constraint fonte_url_lunghezza check (fonte_url is null or length(fonte_url) <= 1000);

-- Il terzo stato: né confermato né in attesa — respinto dal cliente.
alter table public.company_fields
  drop constraint stato_campo_valido;
alter table public.company_fields
  add constraint stato_campo_valido
  check (stato in ('confermato', 'da_confermare', 'rifiutato'));

-- I permessi di colonna restano quelli della 2.0: l'utente può toccare
-- valore, stato e confirmed_at — quindi può rifiutare — ma NON fonte,
-- fonte_url e provenienza, che restano firma del back-office. Il grant
-- si ripete perché la nuova colonna non deve entrarci.
revoke update on public.company_fields from authenticated;
grant update (valore, stato, confirmed_at)
  on public.company_fields to authenticated;
