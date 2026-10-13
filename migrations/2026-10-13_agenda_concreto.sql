-- Tabela de programação de concreto (polido / vassourado por obra / dia)
create table if not exists public.agenda_concreto (
  id uuid default gen_random_uuid() primary key,
  data date not null,
  obra_id uuid references public.obras_financeiro(id) on delete cascade,
  polido boolean not null default false,
  vassourado boolean not null default false,
  m2_polido integer not null default 0,
  m2_vassourado integer not null default 0,
  criado_por text,
  created_at timestamptz default now()
);
alter table public.agenda_concreto enable row level security;
grant select, insert, delete on public.agenda_concreto to authenticated;
create policy "agenda_concreto_auth" on public.agenda_concreto
  for all using (auth.role() = 'authenticated');
