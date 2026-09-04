-- Diaristas: colaboradores NÃO fichados (sem prontuário completo), cadastro enxuto,
-- mas que aparecem no Cronograma Diário para serem alocados nas obras.
alter table public.colaboradores add column if not exists is_diarista boolean not null default false;
