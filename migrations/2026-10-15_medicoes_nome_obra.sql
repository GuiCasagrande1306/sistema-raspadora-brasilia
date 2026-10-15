-- Adiciona campo nome_obra em medicoes_obra (texto livre para identificar no Valores Retidos)
ALTER TABLE public.medicoes_obra ADD COLUMN IF NOT EXISTS nome_obra text;
