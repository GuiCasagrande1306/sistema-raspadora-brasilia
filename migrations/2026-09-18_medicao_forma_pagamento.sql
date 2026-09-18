-- Data do recebimento (≠ data da nota) + forma de pagamento (PIX, transferência, dinheiro, etc.)
-- Inclui serviços recebidos SEM nota (registra só o pagamento).
alter table public.medicoes_obra add column if not exists data_recebimento date;
alter table public.medicoes_obra add column if not exists forma_pagamento text;
