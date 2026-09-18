-- Marca recebimentos SEM nota fiscal (ex.: PIX por serviço sem nota) — seção separada das medições/notas.
alter table public.medicoes_obra add column if not exists sem_nota boolean default false;
