-- ============================================================
--  ORÇAMENTOS & MEDIÇÕES DE CAMPO — replica o bloco de papel oficial
--  Aplicado no Supabase em 2026-07-31.
--  (coluna servico_tipo normalizada sem acento p/ evitar identificador citado)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.orcamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_orcamento SERIAL,                          -- número incremental (ex: 194)
  data_orcamento DATE DEFAULT CURRENT_DATE,
  cliente_nome VARCHAR(255) NOT NULL,
  cliente_fone VARCHAR(50),
  endereco_obra TEXT,
  servico_tipo VARCHAR(100),                        -- FULGET, RASPAGEM, SINTECO...
  status VARCHAR(50) DEFAULT 'PENDENTE_MEDICAO',    -- PENDENTE_MEDICAO, MEDIDO, APROVADO, CANCELADO
  itens JSONB DEFAULT '[]'::jsonb,                  -- [{descricao, area_m2, valor_unit, total}]
  valor_total NUMERIC(10,2) DEFAULT 0.00,
  observacoes TEXT,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orcamentos_status ON public.orcamentos(status);

-- Opcional: iniciar a numeração a partir do bloco de papel atual, ex. 194:
-- SELECT setval(pg_get_serial_sequence('public.orcamentos','numero_orcamento'), 193, true);
