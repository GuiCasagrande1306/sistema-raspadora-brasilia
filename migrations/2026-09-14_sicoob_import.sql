-- Importação do extrato Sicoob para o Cofre (movimentações de caixa)
-- sicoob_ref: marca qual conta do Cofre espelha qual conta Sicoob ('principal' | 'cofre')
-- sicoob_tx_id: id da transação no Sicoob, para não importar o mesmo lançamento duas vezes
alter table public.contas_bancarias add column if not exists sicoob_ref text;
alter table public.movimentacoes_caixa add column if not exists sicoob_tx_id text;
create unique index if not exists uq_mov_sicoob_tx on public.movimentacoes_caixa(sicoob_tx_id) where sicoob_tx_id is not null;
