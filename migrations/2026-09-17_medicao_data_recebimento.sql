-- Data em que o pagamento da nota/medição foi efetivamente recebido (≠ data da nota).
alter table public.medicoes_obra add column if not exists data_recebimento date;
