-- ============================================================
--  GD4 / AutoDoc — cadastro completo do colaborador
--  Aplicado no Supabase em 2026-07-31.
-- ============================================================
ALTER TABLE public.colaboradores ADD COLUMN IF NOT EXISTS rne VARCHAR(30);
ALTER TABLE public.colaboradores ADD COLUMN IF NOT EXISTS apelido VARCHAR(80);
ALTER TABLE public.colaboradores ADD COLUMN IF NOT EXISTS nacionalidade VARCHAR(60) DEFAULT 'Brasileira';
ALTER TABLE public.colaboradores ADD COLUMN IF NOT EXISTS estado_residencia VARCHAR(2);
ALTER TABLE public.colaboradores ADD COLUMN IF NOT EXISTS cidade_residencia VARCHAR(120);
ALTER TABLE public.colaboradores ADD COLUMN IF NOT EXISTS genero VARCHAR(30);
ALTER TABLE public.colaboradores ADD COLUMN IF NOT EXISTS etnia VARCHAR(30);
ALTER TABLE public.colaboradores ADD COLUMN IF NOT EXISTS pcd BOOLEAN DEFAULT false;
ALTER TABLE public.colaboradores ADD COLUMN IF NOT EXISTS primeiro_emprego BOOLEAN DEFAULT false;
ALTER TABLE public.colaboradores ADD COLUMN IF NOT EXISTS numero_registro VARCHAR(40);
ALTER TABLE public.colaboradores ADD COLUMN IF NOT EXISTS escolaridade VARCHAR(60);
ALTER TABLE public.colaboradores ADD COLUMN IF NOT EXISTS qualificacao_profissional VARCHAR(120);
ALTER TABLE public.colaboradores ADD COLUMN IF NOT EXISTS cbo VARCHAR(20);       -- código CBO da função
ALTER TABLE public.colaboradores ADD COLUMN IF NOT EXISTS responsavel VARCHAR(120); -- responsável pela documentação
