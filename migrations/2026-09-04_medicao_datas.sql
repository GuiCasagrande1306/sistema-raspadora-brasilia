-- Medições/notas que cobrem VÁRIOS dias: a nota do mês agrupa vários dias de medição.
-- Guarda todas as datas da nota (o campo `data` continua como a data de referência / 1º dia).
alter table public.medicoes_obra add column if not exists datas jsonb not null default '[]'::jsonb;
