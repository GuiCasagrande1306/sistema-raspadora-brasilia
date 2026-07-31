-- ============================================================
--  PERFIS DE USUÁRIO (ROLES) — vincula Supabase Auth ao sistema
--  Aplicado no Supabase em 2026-07-31.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  role VARCHAR(20) DEFAULT 'OPERACIONAL',          -- 'ADMIN' ou 'OPERACIONAL'
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir leitura pública dos perfis autenticados" ON public.profiles;
CREATE POLICY "Permitir leitura pública dos perfis autenticados"
ON public.profiles FOR SELECT USING (auth.role() = 'authenticated');
