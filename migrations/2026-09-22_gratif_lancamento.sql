-- Liga a gratificação paga (cronograma) ao lançamento no Pagamento Diário, pra debitar o caixa e poder remover ao desmarcar.
alter table public.cronograma_alocacoes add column if not exists gratif_lancamento_id uuid;
