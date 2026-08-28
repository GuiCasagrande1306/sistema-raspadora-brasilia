-- GEFIP: permite documentos "gerais" no nível do MÊS (sem obra) para depois alocar nas obras
alter table public.gefip_docs alter column obra drop not null;
