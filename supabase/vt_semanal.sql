-- Vale-Transporte semanal (edição inline) — CARTEIRINHA | CONTA
CREATE TABLE IF NOT EXISTS public.vt_semanal (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  colaborador_id UUID NOT NULL REFERENCES public.colaboradores(id) ON DELETE CASCADE,
  ano_mes VARCHAR(7) NOT NULL,          -- '2026-08'
  semana INT NOT NULL,                  -- 1..5
  qtd_viagens INT NOT NULL DEFAULT 0,
  valor_passagem NUMERIC(6,2) NOT NULL DEFAULT 4.30,
  forma_pagamento VARCHAR(20) NOT NULL DEFAULT 'CARTEIRINHA',  -- CARTEIRINHA | CONTA
  observacao TEXT,
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uniq_vt_semana UNIQUE (colaborador_id, ano_mes, semana)
);
CREATE INDEX IF NOT EXISTS idx_vtsem ON public.vt_semanal(ano_mes, semana);
