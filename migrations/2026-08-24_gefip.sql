-- GEFIP: pastas dinâmicas (Ano > Mês > Obra) + documentos PDF
create table if not exists public.gefip_pastas (
  id        uuid primary key default gen_random_uuid(),
  ano       int  not null,
  mes       text not null,          -- '01'..'12'
  obra      text,                   -- null = pasta de MÊS; preenchida = pasta de OBRA
  criado_em timestamptz not null default now()
);
create index if not exists idx_gefip_pastas on public.gefip_pastas (ano, mes, obra);
alter table public.gefip_pastas enable row level security;

create table if not exists public.gefip_docs (
  id           uuid primary key default gen_random_uuid(),
  ano          int  not null,
  mes          text not null,
  obra         text not null,
  nome         text not null,
  arquivo_path text,
  arquivo_url  text,
  criado_por   text,
  criado_em    timestamptz not null default now()
);
create index if not exists idx_gefip_docs on public.gefip_docs (ano, mes, obra, criado_em desc);
alter table public.gefip_docs enable row level security;

-- Backend usa a service_role (bypassa RLS). Sem policy pública de propósito.
