-- =====================================================================
-- SCELTA DEL MODELLO PER COMPITO, E NESSUN LAVORO RIPETUTO
--
-- Due aggiunte, entrambe al servizio della stessa domanda: quanto costa
-- davvero, e dove si può non spendere.
--
--   1. `extractions.livello` e `escalato_da`: con quale modello si è
--      letto e se si è dovuto salire. Senza queste due colonne il
--      confronto fra livelli non si può fare — e la scelta del modello
--      si fa sui numeri, non sulle impressioni.
--   2. `documents.impronta`: l'impronta del CONTENUTO del file. Due file
--      identici caricati due volte sono lo stesso lavoro, e rifarlo è
--      spendere due volte per lo stesso risultato.
-- =====================================================================

alter table public.extractions
  add column livello text
  constraint livello_valido
  check (livello is null or livello in ('leggero', 'intermedio', 'superiore'));

-- Valorizzata solo quando si è saliti: dice da dove si è partiti, e
-- quindi quante volte il livello di partenza non è bastato.
alter table public.extractions add column escalato_da text;
alter table public.extractions add column escalato_perche text;

comment on column public.extractions.livello is
  'Il livello con cui si è CONCLUSA la lettura. Con escalato_da valorizzata, il costo della riga comprende anche il tentativo precedente: l''escalation non è gratis e il log non deve farla sembrare tale.';

-- ---------------------------------------------------------------------
-- L'impronta del contenuto.
--
-- SHA-256 dei byte del file. Non è il percorso e non è il nome: due
-- copie dello stesso PDF con nomi diversi hanno la stessa impronta, ed è
-- proprio quel caso che vogliamo riconoscere.
--
-- L'indice è per organizzazione: il riuso non attraversa MAI il confine
-- fra due clienti, nemmeno a parità di contenuto. Sarebbe un dato di uno
-- riusato per un altro.
-- ---------------------------------------------------------------------
alter table public.documents add column impronta text
  constraint impronta_lunghezza check (impronta is null or length(impronta) = 64);

create index documents_impronta_idx
  on public.documents (organization_id, impronta)
  where impronta is not null;

comment on column public.documents.impronta is
  'SHA-256 del contenuto del file. Serve a riconoscere lo stesso documento caricato due volte e a riusarne la lettura — mai fra organizzazioni diverse.';
