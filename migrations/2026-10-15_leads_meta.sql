-- 1) leads_v2 (2026-08-24) nunca rodou em produção: campos novos + remove CHECKs antigos de origem/status
alter table public.leads
  add column if not exists responsavel        text,
  add column if not exists endereco           text,
  add column if not exists data_inicio        date,
  add column if not exists situacao_pagamento text default 'PENDENTE';
alter table public.leads drop constraint if exists leads_status_check;
alter table public.leads drop constraint if exists leads_origem_check;
update public.leads set status='MARCAR_VISITA' where status in ('NOVO','EM_CONTATO','QUALIFICADO');
update public.leads set status='FECHADO'       where status='GANHO';
alter table public.leads alter column status set default 'MARCAR_VISITA';
update public.leads set situacao_pagamento='PENDENTE' where situacao_pagamento is null;

-- 2) Integração Meta: id do lead na Meta ("meta:<leadgen_id>") — único, pra não duplicar quando a Meta reenvia
alter table public.leads add column if not exists externo_id text;
create unique index if not exists leads_externo_id_key on public.leads (externo_id);
