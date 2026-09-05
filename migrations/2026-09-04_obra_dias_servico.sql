-- Obras de dias variáveis (ex.: concreto feito em dias não corridos):
-- guarda as datas específicas em que o serviço foi feito (além de início/término das obras corridas).
alter table public.obras_financeiro add column if not exists dias_servico jsonb not null default '[]'::jsonb;
