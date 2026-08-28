-- =====================================================================
-- LE NOTE SCRITTE SUL DOCUMENTO
--
-- Misurato su un registro presenze vero: in fondo al foglio c'era una
-- riga a mano che raccontava come si era svolto il corso — «due
-- modalità, video proiettati su schermo e una parte in aula con
-- confronto diretto». Il Motore la leggeva e la infilava fra le
-- AVVERTENZE, cioè accanto a «la grafia non è sempre agevole».
--
-- Sono due cose diverse e vanno in due posti diversi. Le avvertenze
-- sono nostre e parlano di com'è andata la lettura; questa è una frase
-- che ha scritto il cliente, ed è contenuto del suo documento. Messa
-- fra gli avvisi sembrava un difetto; qui diventa quello che è, e in
-- pagina si mostra come una citazione.
-- =====================================================================

alter table public.documents add column note_libere text[];

comment on column public.documents.note_libere is
  'Le note scritte a mano sul documento, parola per parola. Contenuto del cliente, non nostro: si mostrano come citazione, mai fra gli avvisi di qualità.';
