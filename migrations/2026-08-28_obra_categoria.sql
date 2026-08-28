-- Categoria/setor da obra — usada para filtrar o Cronograma Diário do Adelino
-- (ele só vê Fulget/Concreto/Cimento queimado; Raspagem e Limpeza não aparecem lá)
alter table public.obras_financeiro add column if not exists categoria_servico text;
