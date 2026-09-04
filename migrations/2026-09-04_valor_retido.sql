-- Valor retido pela construtora (liberado ~6 meses após o fim da obra).
-- Sem lembrete, esse dinheiro se perde — guardamos o valor + a data de resgate p/ avisar.
alter table public.medicoes_obra add column if not exists valor_retido          bigint  not null default 0;   -- centavos
alter table public.medicoes_obra add column if not exists data_resgate          date;                          -- lembrete p/ cobrar
alter table public.medicoes_obra add column if not exists retido_resgatado      boolean not null default false;
alter table public.medicoes_obra add column if not exists data_retido_resgatado date;
create index if not exists idx_medicoes_retido on public.medicoes_obra (retido_resgatado, data_resgate) where valor_retido > 0;
