-- =====================================================================
-- LA CODA A BASSA PRIORITÀ (limiti di uso corretto)
--
-- Quando un'organizzazione supera la prima soglia contrattuale, il
-- servizio NON si ferma: le letture entrano in coda e arrivano un po'
-- più tardi. Serve uno stato in più, perché «in coda» e «in lettura»
-- sono due cose diverse e il cliente deve poterle distinguere: la
-- seconda sta succedendo adesso, la prima succederà.
--
-- La coda è la tabella `documents` stessa: un documento in attesa È il
-- lavoro in attesa, e una seconda tabella che lo duplichi sarebbe una
-- seconda verità da tenere allineata.
-- =====================================================================

alter table public.documents drop constraint stato_documento_valido;
alter table public.documents add constraint stato_documento_valido
  check (stato in (
    'smistato',
    'da_classificare',
    'non_pertinente',
    'in_coda',           -- accodato: si legge appena c'è spazio
    'in_lettura',
    'letto',
    'illeggibile'
  ));

comment on column public.documents.stato is
  'in_coda: il cliente ha superato la prima soglia di uso corretto e la lettura è differita — mai un blocco, solo un''attesa dichiarata.';
