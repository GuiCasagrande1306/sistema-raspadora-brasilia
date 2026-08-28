-- Razão social no cadastro de cliente (além do nome/fantasia)
alter table public.clientes add column if not exists razao_social text;
