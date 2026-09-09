-- Obras & Resultado: de quem é a obra — o colaborador que recebe a comissão dela.
alter table public.obras_financeiro add column if not exists comissao_responsavel text;
