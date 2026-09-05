-- VT: observação por colaborador que persiste entre as semanas (editável/apagável),
-- pra não ter que preencher tudo de novo toda semana (igual ao nº da carteirinha).
alter table public.colaboradores add column if not exists observacao_vt text;
