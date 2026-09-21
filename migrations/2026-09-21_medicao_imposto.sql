-- ISS (imposto) da medição/nota, pra calcular o líquido (valor − retenção técnica − ISS).
alter table public.medicoes_obra add column if not exists imposto_valor bigint;
