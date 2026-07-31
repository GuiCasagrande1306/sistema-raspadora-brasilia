-- ============================================================
--  VALE-TRANSPORTE (VT) — controle diário + balanço semanal
--  Aplicado no Supabase em 2026-07-31.
-- ============================================================

-- STEP 1: Tabela de registros diários
CREATE TABLE IF NOT EXISTS public.registro_diario_vt (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  colaborador_id UUID REFERENCES public.colaboradores(id) ON DELETE CASCADE,
  data_registro DATE NOT NULL DEFAULT CURRENT_DATE,
  qtd_viagens INT DEFAULT 2,
  forma_pagamento VARCHAR(50) DEFAULT 'CARTEIRINHA',
  observacao TEXT,
  CONSTRAINT unique_colaborador_dia UNIQUE (colaborador_id, data_registro)
);

-- STEP 2: Coluna de pagamento padrão no colaborador
ALTER TABLE public.colaboradores
ADD COLUMN IF NOT EXISTS forma_pagamento_padrao VARCHAR(50) DEFAULT 'CARTEIRINHA';

-- STEP 3: View do balanço semanal
CREATE OR REPLACE VIEW public.vw_balanco_semanal_vt AS
SELECT
  c.id AS colaborador_id,
  c.nome AS funcionario,
  SUM(COALESCE(r.qtd_viagens, 2)) AS total_viagens,
  4.30 AS valor_passagem,
  (SUM(COALESCE(r.qtd_viagens, 2)) * 4.30) AS valor_total,
  COALESCE(MAX(r.forma_pagamento), c.forma_pagamento_padrao, 'CARTEIRINHA') AS forma_pagamento,
  STRING_AGG(DISTINCT r.observacao, ' | ') FILTER (WHERE r.observacao IS NOT NULL AND r.observacao != '') AS observacoes
FROM public.colaboradores c
LEFT JOIN public.registro_diario_vt r ON c.id = r.colaborador_id
GROUP BY c.id, c.nome, c.forma_pagamento_padrao;
