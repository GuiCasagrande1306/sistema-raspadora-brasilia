-- Descontos manuais na folha (FALTA / INSS / OUTRO) — valores variáveis lançados a cada folha.
-- Abatidos do líquido no fechamento; não mexem no caixa.
create table if not exists public.descontos_folha (
  id                  uuid primary key default gen_random_uuid(),
  colaborador_id      uuid not null,
  tipo                text not null default 'FALTA',   -- FALTA | INSS | OUTRO
  valor               bigint not null default 0,       -- centavos
  observacao          text,
  data_lancamento     date,
  abatido_folha       boolean not null default false,
  folha_fechamento_id uuid,
  criado_em           timestamptz not null default now()
);
create index if not exists idx_descontos_colab on public.descontos_folha (colaborador_id, abatido_folha);
alter table public.descontos_folha enable row level security;
