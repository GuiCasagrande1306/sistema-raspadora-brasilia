-- ============================================================
--  SST / NRs · Vacinas · Anexos · Multi-empresa · Prontuário
--  Aplicado no Supabase em 2026-07-31.
-- ============================================================

-- ---- Multi-empresa + prontuário no colaborador ----
ALTER TABLE public.colaboradores ADD COLUMN IF NOT EXISTS empresa VARCHAR(20) DEFAULT 'RB_PISOS';   -- RB_PISOS, ECO_PISOS
ALTER TABLE public.colaboradores ADD COLUMN IF NOT EXISTS rg VARCHAR(30);
ALTER TABLE public.colaboradores ADD COLUMN IF NOT EXISTS orgao_emissor_rg VARCHAR(20);
ALTER TABLE public.colaboradores ADD COLUMN IF NOT EXISTS pis VARCHAR(30);
ALTER TABLE public.colaboradores ADD COLUMN IF NOT EXISTS titulo_eleitor VARCHAR(30);
ALTER TABLE public.colaboradores ADD COLUMN IF NOT EXISTS data_nascimento DATE;
ALTER TABLE public.colaboradores ADD COLUMN IF NOT EXISTS historico_observacoes TEXT;
ALTER TABLE public.colaboradores ADD COLUMN IF NOT EXISTS documentos_drive_link TEXT;

-- ---- Obra vinculada a uma empresa do grupo ----
ALTER TABLE public.obras_financeiro ADD COLUMN IF NOT EXISTS empresa_responsavel VARCHAR(20) DEFAULT 'RB_PISOS';

-- ---- Documentos SST / NRs (com elaboração e vencimento) ----
CREATE TABLE IF NOT EXISTS public.documentos_sst (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  colaborador_id UUID NOT NULL REFERENCES public.colaboradores(id) ON DELETE CASCADE,
  tipo_documento VARCHAR(20) NOT NULL,          -- ASO, NR06, NR07, NR12, NR18, NR23, NR35, ANUENCIA_NR12
  data_elaboracao DATE,
  data_vencimento DATE,
  arquivo_pdf_url TEXT,
  observacoes TEXT,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---- Carteira de vacinação ----
CREATE TABLE IF NOT EXISTS public.vacinas_colaborador (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  colaborador_id UUID NOT NULL REFERENCES public.colaboradores(id) ON DELETE CASCADE,
  tipo_vacina VARCHAR(30) NOT NULL,             -- ANTITETANICA_DT, FEBRE_AMARELA, HEPATITE_B, OUTRAS
  data_aplicacao DATE,
  data_vencimento_dose DATE,
  comprovante_pdf_url TEXT,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---- Central de anexos PDF (dossiê) ----
CREATE TABLE IF NOT EXISTS public.documentos_anexo (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  colaborador_id UUID NOT NULL REFERENCES public.colaboradores(id) ON DELETE CASCADE,
  nome_documento VARCHAR(160) NOT NULL,
  arquivo_url TEXT,
  mime_type VARCHAR(80) DEFAULT 'application/pdf',
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sst_colab ON public.documentos_sst(colaborador_id);
CREATE INDEX IF NOT EXISTS idx_sst_venc ON public.documentos_sst(data_vencimento);
CREATE INDEX IF NOT EXISTS idx_vac_colab ON public.vacinas_colaborador(colaborador_id);
CREATE INDEX IF NOT EXISTS idx_anexo_colab ON public.documentos_anexo(colaborador_id);

-- ---- SEED de demonstração ----
-- distribui empresas
UPDATE public.colaboradores SET empresa='ECO_PISOS' WHERE nome IN ('Luiz Paulo','Marcos Aurélio');
UPDATE public.colaboradores SET empresa='RB_PISOS' WHERE empresa IS NULL;
UPDATE public.obras_financeiro SET empresa_responsavel='ECO_PISOS' WHERE cliente ILIKE '%CasaCor%';

-- alguns documentos SST com vencimentos variados (para alertas/status)
INSERT INTO public.documentos_sst (colaborador_id, tipo_documento, data_elaboracao, data_vencimento)
SELECT id, d.tipo, d.elab::date, d.venc::date FROM public.colaboradores c
JOIN (VALUES
  ('Cleber Estêvão','NR35','2025-08-20','2026-08-20'),   -- vence em ~20d (prestes)
  ('Cleber Estêvão','ASO','2025-09-20','2026-09-20'),
  ('Diego Matos','NR35','2024-07-10','2026-07-15'),       -- vencido
  ('Diego Matos','NR12','2025-08-01','2027-08-01'),
  ('Luiz Paulo','ASO','2025-11-30','2026-11-30')
) AS d(nome,tipo,elab,venc) ON c.nome=d.nome;
