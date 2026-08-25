-- =====================================================================
-- TRIAGE E DATI PARTICOLARI (art. 9 GDPR)
--
-- Un gradino prima dell'estrazione: si guarda che documento è, e si
-- decide se leggerlo. Due esiti fermano tutto:
--
--   NON PERTINENTE  — non serve a nessun percorso attivo. Si archivia e
--                     si dice, ma non si estrae: leggere un documento
--                     che non alimenta niente è lavoro e spesa per
--                     nulla, e dati trattati senza motivo.
--   DATI PARTICOLARI — contiene con buona probabilità dati sanitari,
--                     giudiziari, biometrici o altri dati dell'art. 9.
--                     Qui non conta la pertinenza: non si legge MAI, non
--                     si conserva nulla del contenuto, e si chiede al
--                     cliente di toglierlo dall'archivio.
--
-- Del contenuto non resta niente: nel database ci sono l'esito e la
-- CATEGORIA, cioè metadati sulla decisione — non il documento.
-- =====================================================================

alter table public.documents drop constraint stato_documento_valido;
alter table public.documents add constraint stato_documento_valido
  check (stato in (
    'smistato',
    'da_classificare',
    'non_pertinente',
    'dati_particolari',  -- fermato dall'art. 9: da rimuovere
    'in_coda',
    'in_lettura',
    'letto',
    'illeggibile'
  ));

alter table public.documents add column triage_esito text
  constraint triage_esito_valido
  check (triage_esito is null or triage_esito in (
    'procedi', 'non_pertinente', 'dati_particolari', 'illeggibile'
  ));

-- La categoria dell'art. 9 riconosciuta: è un metadato sulla DECISIONE,
-- non un pezzo del documento. Serve a dire al cliente perché ci siamo
-- fermati, e a nient'altro.
alter table public.documents add column triage_categoria text;
alter table public.documents add column triage_at timestamptz;

comment on column public.documents.triage_categoria is
  'La categoria di dati particolari riconosciuta (salute, giudiziari, biometrici, identita). Metadato sulla decisione: del contenuto non si conserva nulla.';

-- ---------------------------------------------------------------------
-- Il log tecnico distingue le due fasi: senza, il costo del triage si
-- confonderebbe con quello dell'estrazione e non si potrebbe più dire
-- se il gradino in più conviene.
-- ---------------------------------------------------------------------
alter table public.extractions add column fase text not null default 'estrazione'
  constraint fase_valida check (fase in ('triage', 'estrazione'));

comment on column public.extractions.fase is
  'triage: il primo sguardo, con modello leggero. estrazione: la lettura vera. Separati per poter misurare se il gradino in più costa meno di quello che evita.';
