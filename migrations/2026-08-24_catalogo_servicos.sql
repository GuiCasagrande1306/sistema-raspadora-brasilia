-- Catálogo de Serviços (descrição padrão + preço por unidade, em reais)
create table if not exists public.servicos_catalogo (
  id        uuid primary key default gen_random_uuid(),
  nome      text not null,
  descricao text,
  unidade   text not null default 'm2',   -- m2 | ml | m3
  preco     numeric not null default 0,   -- R$ por unidade
  criado_em timestamptz not null default now()
);
create index if not exists idx_servicos_nome on public.servicos_catalogo (nome);
alter table public.servicos_catalogo enable row level security;

-- Backend usa a service_role (bypassa RLS). Sem policy pública de propósito.
