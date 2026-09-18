-- Liga o vale (abate na folha) ao lançamento diário que o gerou (Pagamento Diário categoria "Vale"),
-- pra excluir os dois juntos e não duplicar.
alter table public.vales_diaria add column if not exists lancamento_diario_id uuid;
