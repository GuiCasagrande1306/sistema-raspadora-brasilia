-- Pagamento Diário: quando a categoria é OUTRO, guardar o texto livre do que é.
alter table public.lancamentos_diarios add column if not exists categoria_custom text;
