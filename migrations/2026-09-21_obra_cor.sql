-- Cor personalizada por obra (usada no Cronograma e no calendário da Agenda).
alter table public.obras_financeiro add column if not exists cor text;
