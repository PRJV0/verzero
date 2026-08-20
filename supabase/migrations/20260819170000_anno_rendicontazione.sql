-- =====================================================================
-- ANNO DI RENDICONTAZIONE (SPEC §12.C).
--
-- Il periodo a cui il documento SI RIFERISCE non è l'anno in cui lo
-- elaboriamo, e confonderli non è un dettaglio estetico: un inventario
-- delle emissioni «2026» prodotto a metà 2026 sarebbe un documento su un
-- anno non ancora chiuso — cioè un documento che nessun ente accetta.
--
-- Ogni impresa dichiara il proprio anno di rendicontazione; di norma è
-- l'ultimo anno solare chiuso, ma chi arriva tardi può volere l'anno
-- precedente, e chi ha esercizio non solare va gestito a parte.
-- =====================================================================

alter table public.organizations
  add column anno_rendicontazione integer not null
  default (extract(year from now())::int - 1)
  constraint anno_rendicontazione_plausibile
  check (anno_rendicontazione between 2015 and 2100);

comment on column public.organizations.anno_rendicontazione is
  'Anno solare chiuso a cui si riferiscono i documenti. Diverso dall''anno di elaborazione (SPEC §12.C).';
