-- Medição: observações da medição (medidas/detalhes de campo), separadas das observações comerciais da proposta.
alter table public.orcamentos add column if not exists observacoes_medicao text;
