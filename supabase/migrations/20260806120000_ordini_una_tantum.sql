-- ---------------------------------------------------------------------
-- Ordini una tantum (SPEC: supporto all'audit di certificazione).
--
-- Finora ogni ordine era un canone: `formula` ammetteva solo mensile e
-- annuale e `prezzo_canone` era obbligatorio. I servizi one-shot — si paga
-- l'intervento, non il tempo — non ci stavano dentro.
--
-- Modifica additiva e reversibile: si allarga il dominio di `formula`, si
-- rende nullable `prezzo_canone` e si aggiunge un vincolo che tiene le due
-- forme mutuamente esclusive, così nessun ordine puo restare senza prezzo.
-- ---------------------------------------------------------------------

alter table public.orders drop constraint if exists formula_valida;

alter table public.orders
  add constraint formula_valida
  check (formula in ('mensile', 'annuale', 'una_tantum'));

alter table public.orders alter column prezzo_canone drop not null;

alter table public.orders drop constraint if exists prezzo_coerente;

alter table public.orders
  add constraint prezzo_coerente
  check (
    (formula = 'una_tantum'
      and prezzo_una_tantum is not null
      and prezzo_canone is null)
    or (formula in ('mensile', 'annuale')
      and prezzo_canone is not null)
  );
