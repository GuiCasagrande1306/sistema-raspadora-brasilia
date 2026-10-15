-- Reestrutura agenda_concreto: polido/vassourado → piso_polido/piso_vassourado
--                              laje → laje_polido + laje_vassourado (novo)
ALTER TABLE public.agenda_concreto RENAME COLUMN polido TO piso_polido;
ALTER TABLE public.agenda_concreto RENAME COLUMN vassourado TO piso_vassourado;
ALTER TABLE public.agenda_concreto RENAME COLUMN m2_polido TO m2_piso_polido;
ALTER TABLE public.agenda_concreto RENAME COLUMN m2_vassourado TO m2_piso_vassourado;
ALTER TABLE public.agenda_concreto RENAME COLUMN laje TO laje_polido;
ALTER TABLE public.agenda_concreto RENAME COLUMN m2_laje TO m2_laje_polido;
ALTER TABLE public.agenda_concreto ADD COLUMN IF NOT EXISTS laje_vassourado boolean NOT NULL DEFAULT false;
ALTER TABLE public.agenda_concreto ADD COLUMN IF NOT EXISTS m2_laje_vassourado integer NOT NULL DEFAULT 0;
