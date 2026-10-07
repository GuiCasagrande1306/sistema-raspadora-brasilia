-- Status da obra NO CRONOGRAMA DIÁRIO: quando concluída, a obra some do painel diário.
-- É independente do Kanban financeiro (coluna_kanban/liquidado): a obra pode estar
-- fisicamente concluída e ainda em recebimento. Default false (toda obra nasce "em execução").
alter table public.obras_financeiro add column if not exists cronograma_concluida boolean not null default false;
