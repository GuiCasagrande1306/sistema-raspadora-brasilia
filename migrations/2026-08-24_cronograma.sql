-- Cronograma Diário: funções/diárias (editáveis) + alocação por obra/dia
create table if not exists public.funcoes_diaria (
  id        uuid primary key default gen_random_uuid(),
  nome      text not null,
  valor     bigint not null default 0,   -- diária em centavos
  criado_em timestamptz not null default now()
);
alter table public.funcoes_diaria enable row level security;

create table if not exists public.cronograma_alocacoes (
  id               uuid primary key default gen_random_uuid(),
  data             date not null,
  colaborador_id   uuid,
  colaborador_nome text,
  obra_id          uuid,
  obra_nome        text,
  funcao           text,
  valor_diaria     bigint not null default 0,  -- centavos
  criado_em        timestamptz not null default now()
);
create index if not exists idx_cron_data on public.cronograma_alocacoes (data);
create index if not exists idx_cron_colab on public.cronograma_alocacoes (colaborador_id, data);
alter table public.cronograma_alocacoes enable row level security;

-- Backend usa a service_role (bypassa RLS). Sem policy pública de propósito.
