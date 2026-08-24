-- Leads v2: novos campos + novas etapas/origens
alter table public.leads
  add column if not exists responsavel        text,
  add column if not exists endereco           text,
  add column if not exists data_inicio        date,
  add column if not exists situacao_pagamento text default 'PENDENTE';

-- remove os CHECKs antigos (status/origem) para aceitar os novos valores
alter table public.leads drop constraint if exists leads_status_check;
alter table public.leads drop constraint if exists leads_origem_check;

-- migra as etapas antigas para as novas
update public.leads set status='MARCAR_VISITA' where status in ('NOVO','EM_CONTATO','QUALIFICADO');
update public.leads set status='FECHADO'       where status='GANHO';
alter table public.leads alter column status set default 'MARCAR_VISITA';
update public.leads set situacao_pagamento='PENDENTE' where situacao_pagamento is null;
