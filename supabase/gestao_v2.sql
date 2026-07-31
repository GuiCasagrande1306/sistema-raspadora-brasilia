-- ============================================================
--  GESTÃO INTEGRADA v2 — DP produção, DRE por obra, Bancos & Fluxo de Caixa
--  Genérico (madeira + piso industrial). Dinheiro em CENTAVOS (integer).
--  Aplicado no Supabase em 2026-07-31.
-- ============================================================

-- ---- Colaboradores: campos de produção/comissão ----
ALTER TABLE public.colaboradores ADD COLUMN IF NOT EXISTS cpf VARCHAR(14);
ALTER TABLE public.colaboradores ADD COLUMN IF NOT EXISTS tipo_chave_pix VARCHAR(20);      -- CPF, TELEFONE, EMAIL, ALEATORIA
ALTER TABLE public.colaboradores ADD COLUMN IF NOT EXISTS comissao_por_m2 INTEGER DEFAULT 0; -- centavos por m²

-- ---- Obras: campos extras (domínio flexível) ----
ALTER TABLE public.obras_financeiro ADD COLUMN IF NOT EXISTS cliente_telefone VARCHAR(50);
ALTER TABLE public.obras_financeiro ADD COLUMN IF NOT EXISTS bairro_regiao VARCHAR(100);
ALTER TABLE public.obras_financeiro ADD COLUMN IF NOT EXISTS tipo_tratamento VARCHAR(100);   -- Bona Traffic HD, Synteko, Osmocolor, Fulget...
ALTER TABLE public.obras_financeiro ADD COLUMN IF NOT EXISTS data_inicio DATE;
ALTER TABLE public.obras_financeiro ADD COLUMN IF NOT EXISTS data_previsao_fim DATE;

-- ---- CONTAS BANCÁRIAS ----
CREATE TABLE IF NOT EXISTS public.contas_bancarias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome_instituicao VARCHAR(120) NOT NULL,
  tipo_conta VARCHAR(30) NOT NULL DEFAULT 'CORRENTE',   -- CORRENTE, POUPANCA_RESERVA, CAIXA_OPERACIONAL
  agencia VARCHAR(20),
  conta VARCHAR(30),
  saldo_atual INTEGER NOT NULL DEFAULT 0,               -- centavos
  chave_pix_vinculada VARCHAR(140),
  is_caixinha BOOLEAN NOT NULL DEFAULT false,           -- marca a "Caixinha PIX Campo"
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---- MOVIMENTAÇÕES DE CAIXA (fluxo) ----
CREATE TABLE IF NOT EXISTS public.movimentacoes_caixa (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conta_bancaria_id UUID REFERENCES public.contas_bancarias(id) ON DELETE CASCADE,
  obra_id UUID REFERENCES public.obras_financeiro(id) ON DELETE SET NULL,
  colaborador_id UUID REFERENCES public.colaboradores(id) ON DELETE SET NULL,
  data_movimento DATE NOT NULL DEFAULT CURRENT_DATE,
  descricao TEXT,
  categoria VARCHAR(40) NOT NULL,                       -- RECEITA_OBRA, FOLHA_DP, VALE_CAMPO, COMPRA_INSUMOS, COMBUSTIVEL_LOGISTICA, IMPOSTOS, TRANSFERENCIA, OUTROS
  tipo VARCHAR(10) NOT NULL CHECK (tipo IN ('ENTRADA','SAIDA')),
  valor INTEGER NOT NULL,                               -- centavos (sempre positivo)
  status VARCHAR(10) NOT NULL DEFAULT 'REALIZADO' CHECK (status IN ('PREVISTO','REALIZADO')),
  conciliado BOOLEAN NOT NULL DEFAULT false,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---- APONTAMENTO DIÁRIO (metragem por obra) + rateio por colaborador ----
CREATE TABLE IF NOT EXISTS public.apontamentos_diarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  obra_id UUID REFERENCES public.obras_financeiro(id) ON DELETE CASCADE,
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  metragem_dia_m2 NUMERIC(10,2) NOT NULL DEFAULT 0,
  observacoes_tecnicas TEXT,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.apontamento_equipe (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  apontamento_id UUID REFERENCES public.apontamentos_diarios(id) ON DELETE CASCADE,
  colaborador_id UUID REFERENCES public.colaboradores(id) ON DELETE CASCADE,
  m2_rateado NUMERIC(10,2) NOT NULL DEFAULT 0,          -- metragem_dia / nº da equipe
  data DATE NOT NULL DEFAULT CURRENT_DATE
);

-- ---- VALES / ADIANTAMENTOS (debitam a caixinha, abatem na folha) ----
CREATE TABLE IF NOT EXISTS public.vales_diaria (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  colaborador_id UUID REFERENCES public.colaboradores(id) ON DELETE CASCADE,
  obra_id UUID REFERENCES public.obras_financeiro(id) ON DELETE SET NULL,
  data_lancamento DATE NOT NULL DEFAULT CURRENT_DATE,
  tipo VARCHAR(30) NOT NULL DEFAULT 'ADIANTAMENTO_VALE', -- DIARIA, ADIANTAMENTO_VALE, BONUS_METRAGEM, REEMBOLSO_COMBUSTIVEL
  valor INTEGER NOT NULL,                               -- centavos
  observacao TEXT,
  status_pagamento VARCHAR(10) NOT NULL DEFAULT 'PAGO' CHECK (status_pagamento IN ('PENDENTE','PAGO')),
  abatido_folha BOOLEAN NOT NULL DEFAULT false,         -- já descontado num fechamento?
  movimentacao_id UUID REFERENCES public.movimentacoes_caixa(id) ON DELETE SET NULL,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---- CUSTOS DE INSUMOS POR OBRA ----
CREATE TABLE IF NOT EXISTS public.custos_obras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  obra_id UUID REFERENCES public.obras_financeiro(id) ON DELETE CASCADE,
  descricao_insumo VARCHAR(160) NOT NULL,               -- Resina Bona Traffic 4.95L, Lixa Grão 36...
  quantidade_utilizada NUMERIC(10,2) NOT NULL DEFAULT 1,
  custo_unitario INTEGER NOT NULL DEFAULT 0,            -- centavos
  custo_total INTEGER NOT NULL DEFAULT 0,               -- centavos (qtd * unit)
  movimentacao_id UUID REFERENCES public.movimentacoes_caixa(id) ON DELETE SET NULL,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mov_conta ON public.movimentacoes_caixa(conta_bancaria_id);
CREATE INDEX IF NOT EXISTS idx_mov_data ON public.movimentacoes_caixa(data_movimento);
CREATE INDEX IF NOT EXISTS idx_apeq_colab ON public.apontamento_equipe(colaborador_id);
CREATE INDEX IF NOT EXISTS idx_vales_colab ON public.vales_diaria(colaborador_id);
CREATE INDEX IF NOT EXISTS idx_custos_obra ON public.custos_obras(obra_id);

-- ---- SEED: contas bancárias ----
INSERT INTO public.contas_bancarias (nome_instituicao, tipo_conta, agencia, conta, saldo_atual, is_caixinha) VALUES
  ('Itaú Unibanco PJ', 'CORRENTE', '0001', '12345-6', 8500000, false),
  ('Banco do Brasil Reserva', 'POUPANCA_RESERVA', '3456', '78901-2', 12000000, false),
  ('Caixinha PIX Campo', 'CAIXA_OPERACIONAL', NULL, NULL, 250000, true)
ON CONFLICT DO NOTHING;
