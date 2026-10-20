-- Data prevista de pagamento da nota/medição (só lembrete; some quando marcar "Recebido")
alter table public.medicoes_obra add column if not exists data_pagamento_previsto date;
