-- Boletos + Pagamento Diário (financeiro; valores em centavos)
create table if not exists public.boletos (
  id              uuid primary key default gen_random_uuid(),
  descricao       text not null,
  fornecedor      text,
  valor           bigint not null default 0,   -- centavos
  vencimento      date not null,
  categoria       text default 'OUTRO',
  pago            boolean not null default false,
  data_pagamento  date,
  comprovante_url text,
  criado_em       timestamptz not null default now()
);
create index if not exists idx_boletos_venc on public.boletos (vencimento, pago);
alter table public.boletos enable row level security;

create table if not exists public.lancamentos_diarios (
  id              uuid primary key default gen_random_uuid(),
  data            date not null,
  descricao       text not null,
  valor           bigint not null default 0,   -- centavos
  categoria       text default 'OUTRO',
  forma           text default 'PIX',
  pago            boolean not null default true,
  data_pagamento  date,
  comprovante_url text,
  criado_em       timestamptz not null default now()
);
create index if not exists idx_lancdia_data on public.lancamentos_diarios (data);
alter table public.lancamentos_diarios enable row level security;

-- Backend usa a service_role (bypassa RLS). Sem policy pública de propósito.
