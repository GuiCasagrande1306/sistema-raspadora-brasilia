-- Catálogo: metragem mínima + valor fixo abaixo do mínimo (o mínimo por causa das máquinas).
-- Na proposta: se a área < metragem mínima, cobra o valor fixo; senão área × preço/unidade.
alter table public.servicos_catalogo add column if not exists metragem_minima numeric not null default 0;
alter table public.servicos_catalogo add column if not exists valor_fixo      numeric not null default 0;
