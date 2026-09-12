-- Cronograma Diário: observação por alocação + controle de gratificação paga
-- observacao: nota livre sobre o funcionário naquele dia (chegou atrasado, meia diária, etc.)
-- gratificacao_paga: marca que a gratificação daquela função (ex.: PEDREIRO - GRATIFICAÇÃO) já foi paga à parte
alter table public.cronograma_alocacoes add column if not exists observacao text;
alter table public.cronograma_alocacoes add column if not exists gratificacao_paga boolean default false;
