-- Ajustes no cadastro de colaborador e documentos
alter table public.colaboradores      add column if not exists ctps text;      -- CTPS (nem todos têm PIS)
alter table public.colaboradores      add column if not exists foto_url text;  -- foto 3x4 do colaborador
-- múltiplos arquivos por documento (além do arquivo_url principal)
alter table public.documentos_colaborador add column if not exists anexos jsonb not null default '[]';
-- boleto: texto livre quando a categoria é OUTRO
alter table public.boletos add column if not exists categoria_custom text;
