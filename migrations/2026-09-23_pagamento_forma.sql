-- Forma de pagamento em boletos e pagamentos fixos (nem todo fixo é boleto: tem PIX, transferência etc.)
alter table public.boletos          add column if not exists forma_pagamento text;
alter table public.pagamentos_fixos add column if not exists forma_pagamento text;
