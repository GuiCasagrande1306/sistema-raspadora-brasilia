-- Código da carteirinha de Vale-Transporte no cadastro do colaborador
alter table public.colaboradores
  add column if not exists carteirinha_vt text;
