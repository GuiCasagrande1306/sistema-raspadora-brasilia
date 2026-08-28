-- LIMPEZA das OBRAS de demonstração (financeiro).
-- Mantém as obras REAIS (ex.: MARIA CLARA, criada a partir de um lead fechado).
-- Mantém boletos, lançamentos diários, leads e clientes já cadastrados.

-- vales de exemplo (aparecem na Folha)
delete from public.vales_diaria;

-- obras de exemplo (seed) — remove só estas 5 pelo nome
delete from public.obras_financeiro
  where cliente in (
    'Construtora Opus',
    'Residencial Vila Rica',
    'Rede Supermercados Real',
    'TCI Construtora',
    'CasaCor Brasília'
  );
