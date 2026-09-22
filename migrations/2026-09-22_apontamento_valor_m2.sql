-- Taxa do acabamento por m² (vassourado/polido) no apontamento, pra comissão dos pedreiros = m² × taxa.
alter table public.apontamento_equipe add column if not exists valor_m2 bigint;
