-- Data de nascimento do colaborador (coluna opcional para a lista de Colaboradores)
alter table public.colaboradores
  add column if not exists data_nascimento date;
