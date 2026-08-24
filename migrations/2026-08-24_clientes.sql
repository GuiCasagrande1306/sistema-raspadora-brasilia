-- Módulo Clientes + automação Lead -> Cliente -> Obra
create table if not exists public.clientes (
  id          uuid primary key default gen_random_uuid(),
  nome        text not null,
  telefone    text,
  endereco    text,
  origem      text,
  responsavel text,
  observacao  text,
  criado_em   timestamptz not null default now()
);
create index if not exists idx_clientes_nome on public.clientes (nome);
alter table public.clientes enable row level security;

-- vínculos no lead (cliente/obra gerados ao fechar)
alter table public.leads
  add column if not exists cliente_id uuid,
  add column if not exists obra_id    uuid;

-- campos de execução/vínculo na obra (preenchidos depois da criação automática)
alter table public.obras_financeiro
  add column if not exists cliente_id            uuid,
  add column if not exists origem_lead_id        uuid,
  add column if not exists responsavel           text,
  add column if not exists data_inicio           date,
  add column if not exists data_prevista_termino date,
  add column if not exists equipe_responsavel    text;

-- Backend usa a service_role (bypassa RLS). Sem policy pública de propósito.
