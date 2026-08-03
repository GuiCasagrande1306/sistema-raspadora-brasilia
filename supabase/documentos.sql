-- ============================================================
--  GESTÃO DE DOCUMENTOS (padrão Inmeta) — checklist SST/RH por colaborador
--  Aplicado no Supabase em 2026-07-31.
-- ============================================================

-- Campos extras de prontuário (padrão Inmeta)
ALTER TABLE public.colaboradores ADD COLUMN IF NOT EXISTS codigo_interno VARCHAR(40);
ALTER TABLE public.colaboradores ADD COLUMN IF NOT EXISTS email VARCHAR(120);
ALTER TABLE public.colaboradores ADD COLUMN IF NOT EXISTS celular1 VARCHAR(30);
ALTER TABLE public.colaboradores ADD COLUMN IF NOT EXISTS celular2 VARCHAR(30);
ALTER TABLE public.colaboradores ADD COLUMN IF NOT EXISTS data_demissao DATE;
ALTER TABLE public.colaboradores ADD COLUMN IF NOT EXISTS obras_vinculadas JSONB DEFAULT '[]'::jsonb;

-- Documentos do colaborador (checklist padronizado com código/versão/status de análise)
CREATE TABLE IF NOT EXISTS public.documentos_colaborador (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  colaborador_id UUID NOT NULL REFERENCES public.colaboradores(id) ON DELETE CASCADE,
  codigo VARCHAR(4) NOT NULL,                    -- 01, 02, 03, ... 21
  versao INT NOT NULL DEFAULT 1,
  data_emissao DATE,
  tem_vencimento BOOLEAN NOT NULL DEFAULT false,
  data_vencimento DATE,
  status_analise VARCHAR(20) NOT NULL DEFAULT 'NAO_VALIDADO'
    CHECK (status_analise IN ('VALIDADO','NAO_VALIDADO','REPROVADO')),
  arquivo_url TEXT,
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_colab_doc UNIQUE (colaborador_id, codigo)
);
CREATE INDEX IF NOT EXISTS idx_doccolab ON public.documentos_colaborador(colaborador_id);

-- SEED demo: alguns documentos para o Cleber e o Diego
INSERT INTO public.documentos_colaborador (colaborador_id, codigo, versao, data_emissao, tem_vencimento, data_vencimento, status_analise)
SELECT id, d.codigo, d.versao, d.emissao::date, d.tv, NULLIF(d.venc,'')::date, d.st
FROM public.colaboradores c
JOIN (VALUES
  ('Cleber Estêvão','01',1,'2022-03-15',false,'','VALIDADO'),
  ('Cleber Estêvão','03',2,'2025-09-20',true,'2026-09-20','VALIDADO'),
  ('Cleber Estêvão','19',1,'2025-08-20',true,'2026-08-20','NAO_VALIDADO'),
  ('Diego Matos','01',1,'2024-11-04',false,'','VALIDADO'),
  ('Diego Matos','19',1,'2024-07-10',true,'2026-07-15','REPROVADO')
) AS d(nome,codigo,versao,emissao,tv,venc,st) ON c.nome=d.nome
ON CONFLICT (colaborador_id, codigo) DO NOTHING;
