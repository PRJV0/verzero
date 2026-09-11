-- ════════════════════════════════════════════════════════════════════
-- CONFIDENZA PER CELLA — la provenienza scende dalla riga alla cella.
--
-- ⚠️  NON ANCORA APPLICATA AL REMOTO. Si applica via Management API in
--     HTTPS (la rete blocca il protocollo Postgres, v. CLAUDE.md), poi si
--     registra la versione in supabase_migrations.schema_migrations.
--     Il codice funziona anche SENZA questa migrazione: v. sotto.
--
-- ═══ CHE COSA NON SERVIVA ═══
-- La tabella `document_fields` era già per cella: una riga per
-- (documento, riga, campo), ciascuna con confidenza, estratto_da,
-- fonte_lettura, nota e avvisi propri. Il difetto non era nello schema —
-- era che il Motore ci scriveva dentro i valori DELLA RIGA, copiati
-- identici su tutte le sue celle. Quello è già corretto nel codice e non
-- richiede migrazione.
--
-- ═══ CHE COSA SERVE DAVVERO ═══
-- Due cose, entrambe piccole.
--
-- 1. `fonte_lettura` deve poter dire 'calcolato'. Un valore che abbiamo
--    ricavato da altre celle — le ore fra ingresso e uscita, i
--    partecipanti contati dalle firme — non è né stampato né
--    manoscritto: non è stato LETTO. Oggi la parola non esiste nel
--    vincolo, e finché non esiste il codice la fa viaggiare negli
--    `avvisi`, che sono già persistiti e già mostrati al cliente.
--    Funziona, ma un avviso è una frase: non si può filtrare, contare o
--    usare per decidere che cosa mostrare per primo.
--
-- 2. Una colonna `calcolato` esplicita, così la scheda di conferma può
--    separare in un colpo solo ciò che il documento dice da ciò che
--    abbiamo ricavato noi — che è la promessa fatta al cliente.
--
-- ═══ PERCHÉ È SICURA ═══
-- Entrambe le modifiche sono ADDITIVE: il vincolo si allarga (non si
-- restringe) e la colonna nasce con un default. Nessuna riga esistente
-- diventa invalida, nessuna lettura già confermata cambia stato. Il
-- codice prima della migrazione non scrive mai 'calcolato' in
-- fonte_lettura, quindi l'ordine fra rilascio e migrazione non conta.
-- ════════════════════════════════════════════════════════════════════

begin;

-- 1. La fonte di lettura ammette anche ciò che non è stato letto.
alter table public.document_fields
  drop constraint if exists fonte_lettura_valida;

alter table public.document_fields
  add constraint fonte_lettura_valida
  check (fonte_lettura in ('testo', 'immagine', 'manoscritto', 'calcolato'));

comment on column public.document_fields.fonte_lettura is
  'Come è arrivato il valore: testo (PDF nativo), immagine (scansione), '
  'manoscritto (scritto a mano), calcolato (ricavato da noi da altre celle, '
  'non letto sul documento).';

-- 2. Il flag esplicito, per poterci filtrare sopra.
alter table public.document_fields
  add column if not exists calcolato boolean not null default false;

comment on column public.document_fields.calcolato is
  'Vero quando il valore non è scritto sul documento ma è stato ricavato '
  'da altre celle. Il cliente deve sempre poter distinguere ciò che ha '
  'detto il suo documento da ciò che abbiamo dedotto noi.';

-- 3. La citazione ora è della cella e non della riga: un indice su
--    (documento, riga) serve alla scheda di conferma, che carica e
--    salva una riga alla volta mentre il cliente avanza da tastiera.
create index if not exists document_fields_documento_riga_idx
  on public.document_fields (document_id, riga);

commit;

-- ════════════════════════════════════════════════════════════════════
-- DOPO L'APPLICAZIONE, registrare la versione:
--
--   insert into supabase_migrations.schema_migrations (version, name)
--   values ('20260911170000', 'confidenza_per_cella')
--   on conflict (version) do nothing;
-- ════════════════════════════════════════════════════════════════════
