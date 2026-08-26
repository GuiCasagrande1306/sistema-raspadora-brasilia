-- Config do app (chave/valor) — usado para dados da empresa e da proposta
create table if not exists public.config_app (
  chave         text primary key,
  valor         jsonb,
  atualizado_em timestamptz not null default now()
);
alter table public.config_app enable row level security;

-- Backend usa a service_role (bypassa RLS). Sem policy pública de propósito.
