-- Obra (opcional) em cada saída: custo direto no relatório por serviço
alter table public.lancamentos_diarios add column if not exists obra_id uuid;
alter table public.boletos add column if not exists obra_id uuid;
