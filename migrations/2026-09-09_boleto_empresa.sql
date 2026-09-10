-- Empresa (R.B Pisos / Eco Pisos) nos boletos, para identificar de qual empresa é cada pagamento.
-- Valores usados pelo app: 'RB_PISOS' | 'ECO_PISOS' | NULL (não definida)
alter table public.boletos add column if not exists empresa text;
