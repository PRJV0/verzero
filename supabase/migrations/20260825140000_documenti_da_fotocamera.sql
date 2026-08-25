-- =====================================================================
-- ACQUISIZIONE DA FOTOCAMERA
--
-- Un documento fotografato non è un documento caricato: nasce da una
-- foto, non ha strato di testo, e la sua confidenza attesa è più bassa.
-- Il Motore lo capisce da solo — un PDF di sole immagini non ha testo,
-- quindi il rilevamento locale lo classifica come scansione — ma il
-- CLIENTE deve poterlo vedere nel fascicolo senza aprire il file:
-- «questo l'ho fotografato io» spiega da solo perché una riga è segnata
-- da controllare.
-- =====================================================================

alter table public.documents add column da_fotocamera boolean not null default false;

-- Quante pagine sono state cucite in quel documento: serve a dire
-- «tre fogli, un documento solo» invece di lasciarlo intuire.
alter table public.documents add column pagine_scattate integer
  constraint pagine_positive check (pagine_scattate is null or pagine_scattate > 0);

comment on column public.documents.da_fotocamera is
  'Acquisito con la fotocamera dal portale: non nativo per costruzione, confidenza attesa più bassa, e nel fascicolo si vede.';

-- L'utente può marcare i propri documenti come fotografati al momento
-- della registrazione: è un fatto sul file, non un giudizio.
grant update (tipo, tipo_confermato, stato, da_fotocamera, pagine_scattate)
  on public.documents to authenticated;
