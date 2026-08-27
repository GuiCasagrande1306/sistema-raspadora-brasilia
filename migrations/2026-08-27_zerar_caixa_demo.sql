-- LIMPEZA de dados de DEMONSTRAÇÃO do Fluxo de Caixa.
-- ⚠️ Isto apaga as contas de exemplo (Banco do Brasil Reserva, Caixinha PIX, Itaú)
-- e TODAS as movimentações de caixa (saldos/projeções). Rode UMA vez, ao começar de verdade.
-- Depois, cadastre as contas reais em Cofre Bancário → Nova Conta.

delete from public.movimentacoes_caixa;   -- zera movimentações/projeções
delete from public.contas_bancarias;       -- remove as contas de exemplo

-- (Opcional) Se também quiser zerar os VALES de exemplo:
-- delete from public.vales_diaria;
