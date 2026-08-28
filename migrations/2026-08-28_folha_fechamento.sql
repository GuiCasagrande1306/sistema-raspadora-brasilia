-- Fechamento de folha "de verdade": trava o período, gera recibos e abate os vales.
create table if not exists public.folha_fechamentos (
  id             uuid primary key default gen_random_uuid(),
  desde          date not null,
  ate            date not null,
  total_a_pagar  bigint not null default 0,   -- centavos (líquido)
  total_diarias  bigint not null default 0,
  total_comissoes bigint not null default 0,
  total_vales    bigint not null default 0,
  total_bonus    bigint not null default 0,
  colaboradores  jsonb  not null default '[]',  -- snapshot das linhas no fechamento
  data           date,                          -- data do fechamento (timeline do cliente)
  criado_em      timestamptz not null default now()
);
create index if not exists idx_folha_fech_periodo on public.folha_fechamentos (desde, ate);

create table if not exists public.recibos (
  id                  uuid primary key default gen_random_uuid(),
  tipo                text not null default 'FOLHA',  -- FOLHA | AVULSO
  colaborador_id      uuid,
  colaborador_nome    text,
  referencia          text,          -- ex.: "Folha 01/08 a 28/08/2026"
  periodo_desde       date,
  periodo_ate         date,
  valor               bigint not null default 0,      -- centavos (líquido)
  detalhe             jsonb,          -- {dias,m2,diarias,comissao,bonus,vales}
  folha_fechamento_id uuid,
  data                date,
  criado_em           timestamptz not null default now()
);
create index if not exists idx_recibos_colab on public.recibos (colaborador_id, criado_em);
create index if not exists idx_recibos_fech  on public.recibos (folha_fechamento_id);

-- liga o vale ao fechamento que o abateu (rastreabilidade)
alter table public.vales_diaria add column if not exists folha_fechamento_id uuid;

alter table public.folha_fechamentos enable row level security;
alter table public.recibos enable row level security;
