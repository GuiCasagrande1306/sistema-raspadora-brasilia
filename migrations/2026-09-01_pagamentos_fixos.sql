-- Pagamentos fixos mensais (aluguel, contador, internet, etc.): cadastra 1x e vira boleto todo mês.
create table if not exists public.pagamentos_fixos (
  id               uuid primary key default gen_random_uuid(),
  descricao        text not null,
  fornecedor       text,
  categoria        text default 'OUTRO',
  categoria_custom text,
  valor            bigint not null default 0,   -- centavos
  dia_vencimento   int  not null default 5,     -- dia do mês (1-31; ajusta p/ último dia se o mês for menor)
  ativo            boolean not null default true,
  observacao       text,
  criado_em        timestamptz not null default now()
);
alter table public.pagamentos_fixos enable row level security;

-- rastreio no boleto: qual fixo o gerou e de qual competência (evita duplicar no mesmo mês)
alter table public.boletos add column if not exists fixo_id uuid;
alter table public.boletos add column if not exists competencia text;   -- 'YYYY-MM'
create index if not exists idx_boletos_fixo on public.boletos (fixo_id, competencia);
