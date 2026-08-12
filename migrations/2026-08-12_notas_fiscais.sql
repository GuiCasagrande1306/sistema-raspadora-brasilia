-- Notas fiscais em PDF: empresa (RB/ECO) > tipo (MO/MAT) > ano
create table if not exists public.notas_fiscais (
  id          uuid primary key default gen_random_uuid(),
  empresa     text not null check (empresa in ('RB','ECO')),
  tipo        text not null check (tipo in ('MO','MAT')),
  ano         int  not null,
  nome        text not null,
  arquivo_url text,
  criado_por  text,
  criado_em   timestamptz not null default now()
);

create index if not exists idx_notas_fiscais_filtro
  on public.notas_fiscais (empresa, tipo, ano, criado_em desc);

alter table public.notas_fiscais enable row level security;
-- Backend usa a service_role (bypassa RLS). Nenhuma policy pública é criada de propósito.
