-- Medições / Notas recebidas por obra (faturamento em parcelas, em vez de contrato fechado)
create table if not exists public.medicoes_obra (
  id         uuid primary key default gen_random_uuid(),
  obra_id    uuid not null,
  data       date,
  descricao  text,          -- ex.: "1ª medição", "NF 123"
  valor      bigint not null default 0,   -- centavos
  recebido   boolean not null default false,
  criado_em  timestamptz not null default now()
);
create index if not exists idx_medicoes_obra on public.medicoes_obra (obra_id, data);
alter table public.medicoes_obra enable row level security;
