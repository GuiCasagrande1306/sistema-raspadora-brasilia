-- ============================================================
--  PERFIL DO USUÁRIO — foto (avatar) + bucket público
--  Aplicado no Supabase em 2026-07-31.
-- ============================================================
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Bucket público de avatares
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Upload liberado para usuários autenticados
DROP POLICY IF EXISTS "Permitir upload de avatar pelo próprio usuário" ON storage.objects;
CREATE POLICY "Permitir upload de avatar pelo próprio usuário"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'avatars');

-- Atualização/substituição do próprio avatar
DROP POLICY IF EXISTS "Permitir update de avatar autenticado" ON storage.objects;
CREATE POLICY "Permitir update de avatar autenticado"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'avatars');
