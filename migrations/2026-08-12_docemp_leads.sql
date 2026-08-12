-- Documentos empresariais (empresa RB/ECO > pasta > PDFs)
create table if not exists public.documentos_empresa (
  id          uuid primary key default gen_random_uuid(),
  empresa     text not null check (empresa in ('RB','ECO')),
  pasta       text not null check (pasta in ('CONSTITUTIVOS','CERTIDOES','OUTROS')),
  nome        text not null,
  arquivo_url text,
  criado_por  text,
  criado_em   timestamptz not null default now()
);
create index if not exists idx_documentos_empresa_filtro
  on public.documentos_empresa (empresa, pasta, criado_em desc);
alter table public.documentos_empresa enable row level security;

-- Leads (comercial)
create table if not exists public.leads (
  id         uuid primary key default gen_random_uuid(),
  nome       text not null,
  telefone   text,
  origem     text check (origem in ('GOOGLE','INSTAGRAM','INDICACAO','PARCEIRO')),
  servico    text,
  observacao text,
  status     text not null default 'NOVO' check (status in ('NOVO','EM_CONTATO','QUALIFICADO','GANHO','PERDIDO')),
  criado_em  timestamptz not null default now()
);
create index if not exists idx_leads_origem on public.leads (origem, criado_em desc);
alter table public.leads enable row level security;

-- Backend usa a service_role (bypassa RLS). Nenhuma policy pública é criada de propósito.
