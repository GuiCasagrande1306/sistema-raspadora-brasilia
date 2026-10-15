-- Itens de obra removidos da Agenda (só esconde no calendário; não altera o cadastro da obra)
create table if not exists public.agenda_ocultos (
  id uuid default gen_random_uuid() primary key,
  obra_id uuid not null references public.obras_financeiro(id) on delete cascade,
  data date not null,
  tipo text not null,
  criado_por text,
  created_at timestamptz default now(),
  unique (obra_id, data, tipo)
);
alter table public.agenda_ocultos enable row level security;
grant select, insert, delete on public.agenda_ocultos to authenticated;
create policy "agenda_ocultos_auth" on public.agenda_ocultos
  for all using (auth.role() = 'authenticated');
