-- Campo livre de observação na obra (Dados comerciais)
alter table public.obras_financeiro add column if not exists observacao text;
