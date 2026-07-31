-- ============================================================
--  RASPADORA BRASÍLIA — Schema Supabase / PostgreSQL (v2 — DP completo)
--  Pisos industriais (concreto, epóxi, fulget) e restauração de madeira.
--  Rode no SQL Editor do Supabase. Valores monetários em CENTAVOS (integer).
-- ============================================================

-- ---------- OBRAS / FINANCEIRO ----------
create table if not exists obras_financeiro (
  id               uuid primary key default gen_random_uuid(),
  cliente          text not null,
  endereco         text,
  metragem_m2      numeric(10,2) not null,
  tipo_piso        text,
  valor_contrato   integer not null,                     -- CENTAVOS
  custo_insumos    integer not null default 0,           -- CENTAVOS
  custo_mao_obra   integer not null default 0,           -- CENTAVOS (diárias lançadas pelo DP)
  status_pagamento text not null default 'aguardando_sinal',
  coluna_kanban    text not null default 'aprovado'
                   check (coluna_kanban in ('aprovado','execucao','afericao','liquidado')),
  progresso        integer not null default 0,
  created_at       timestamptz not null default now()
);

-- ---------- COLABORADORES (DP) ----------
create table if not exists colaboradores (
  id                   uuid primary key default gen_random_uuid(),
  nome                 text not null,
  cargo                text not null,                     -- 'Operador de Fulget', 'Aplicador de Epóxi'...
  status               text not null default 'admissao'
                       check (status in ('admissao','ativo','ferias','desligamento')),
  chave_pix            text,
  telefone             text,
  contato_emergencia   text,
  data_admissao        date,
  valor_diaria         integer,                           -- CENTAVOS
  obra_alocada         uuid references obras_financeiro(id) on delete set null,
  meta_m2              integer not null default 0,
  feito_m2             integer not null default 0,
  saldo_ferias_dias    integer not null default 0,
  created_at           timestamptz not null default now()
);

-- ---------- HISTÓRICO FUNCIONAL ----------
create table if not exists historico_funcional (
  id             uuid primary key default gen_random_uuid(),
  colaborador_id uuid not null references colaboradores(id) on delete cascade,
  data           date not null default current_date,
  evento         text not null,                           -- 'Admissão','Promoção','Transferência','Elogio','Advertência'
  observacao     text
);

-- ---------- PONTO & FREQUÊNCIA ----------
create table if not exists ponto_frequencia (
  id             uuid primary key default gen_random_uuid(),
  colaborador_id uuid not null references colaboradores(id) on delete cascade,
  data           date not null default current_date,
  presenca       boolean not null default true,
  horas_extras   numeric(5,2) not null default 0,
  obra_id        uuid references obras_financeiro(id) on delete set null
);

-- ---------- FOLHA DE PAGAMENTO / COMISSÕES ----------
create table if not exists folha_pagamento (
  id              uuid primary key default gen_random_uuid(),
  colaborador_id  uuid not null references colaboradores(id) on delete cascade,
  mes_referencia  text not null,                          -- 'YYYY-MM'
  salario_base    integer not null default 0,             -- CENTAVOS (soma diárias por m²)
  comissoes       integer not null default 0,             -- CENTAVOS
  descontos_vales integer not null default 0,             -- CENTAVOS
  valor_liquido   integer not null default 0,             -- CENTAVOS
  unique (colaborador_id, mes_referencia)
);

-- ---------- DOCUMENTOS DP (com vencimento) ----------
create table if not exists documentos_dp (
  id              uuid primary key default gen_random_uuid(),
  colaborador_id  uuid not null references colaboradores(id) on delete cascade,
  tipo_doc        text not null,                          -- 'CNH','ASO','Ficha EPI','Comprovante'
  url_arquivo     text,
  data_vencimento date
);

-- ---------- LANÇAMENTOS DE CAIXA ----------
create table if not exists lancamentos (
  id         uuid primary key default gen_random_uuid(),
  obra_id    uuid references obras_financeiro(id) on delete cascade,
  tipo       text not null check (tipo in ('entrada','saida')),
  categoria  text not null,                               -- sinal|saldo|insumo|diaria|combustivel|vale
  valor      integer not null,                            -- CENTAVOS
  descricao  text,
  created_at timestamptz not null default now()
);

create index if not exists idx_colab_status on colaboradores(status);
create index if not exists idx_obras_kanban on obras_financeiro(coluna_kanban);
create index if not exists idx_hist_colab on historico_funcional(colaborador_id);
create index if not exists idx_doc_colab on documentos_dp(colaborador_id);
create index if not exists idx_folha_colab on folha_pagamento(colaborador_id);
create index if not exists idx_lanc_obra on lancamentos(obra_id);

-- ============================================================
--  SEED (opcional)
-- ============================================================
insert into obras_financeiro (cliente, endereco, metragem_m2, tipo_piso, valor_contrato, custo_insumos, custo_mao_obra, status_pagamento, coluna_kanban, progresso) values
  ('Construtora Opus', 'Galpão Logístico · SIA', 350, 'Piso Fulget Cinza', 5250000, 0, 0, 'aguardando_sinal', 'aprovado', 0),
  ('TCI Construtora', 'Loja Âncora · Taguatinga', 620, 'Concreto Polido', 8680000, 1820000, 2960000, '50% sinal pago', 'execucao', 68),
  ('CasaCor Brasília', 'Estande · Pavilhão', 180, 'Epóxi Autonivelante', 3960000, 940000, 820000, '50% sinal pago', 'execucao', 40),
  ('Residencial Vila Rica', 'Área comum · Lago Norte', 420, 'Fulget Bege + Selante', 5880000, 1560000, 1980000, '50% sinal pago', 'afericao', 100),
  ('Rede Supermercados Real', 'Filial 07 · Ceilândia', 540, 'Concreto Polido + Junta', 7020000, 1490000, 2260000, '100% pago', 'liquidado', 100)
on conflict do nothing;

-- Colaboradores + tabelas de DP (usa CTE para reaproveitar os ids gerados)
with novos as (
  insert into colaboradores (nome, cargo, status, chave_pix, telefone, contato_emergencia, data_admissao, valor_diaria, meta_m2, feito_m2, saldo_ferias_dias) values
    ('Anderson Reis','Aplicador de Epóxi','admissao','(61) 97777-1234','(61) 97777-1234','Marta Reis · (61) 98888-2211',null,25000,0,0,0),
    ('Vanessa Torres','Vistoriadora / Orçamentista','admissao',null,'(61) 96666-7788','Pedro Torres · (61) 95555-1010',null,null,0,0,0),
    ('Diego Matos','Operador de Fulget','ativo','diego.matos@email.com','(61) 99191-3030','Ana Matos · (61) 99292-4040','2024-11-04',24000,180,120,12),
    ('Cleber Estêvão','Encarregado de Obra','ativo','(61) 99999-0000','(61) 99999-0000','Rita Estêvão · (61) 98181-2323','2022-03-15',30000,620,420,8),
    ('Luiz Paulo','Aplicador de Epóxi','ativo','(61) 98888-0000','(61) 98888-0000','Sônia P. · (61) 97070-1212','2023-08-01',26000,180,90,20),
    ('Marcos Aurélio','Operador de Piso Industrial','ferias','(61) 99999-4821','(61) 99999-4821','Célia A. · (61) 96363-7474','2021-09-19',28000,0,0,0),
    ('Juliana Braga','Financeiro / Compras','ativo',null,'(61) 95454-8989','Carlos B. · (61) 94343-9090','2020-05-11',null,0,0,5),
    ('Roberto Lima','Ajudante Geral','desligamento','(61) 93232-1515','(61) 93232-1515','Ivo Lima · (61) 92121-3434','2023-02-10',18000,0,0,0)
  returning id, nome
)
insert into documentos_dp (colaborador_id, tipo_doc, data_vencimento)
select id, d.tipo_doc, d.data_vencimento::date from novos
join (values
  ('Diego Matos','ASO Periódico','2026-08-10'),
  ('Diego Matos','CNH','2028-03-01'),
  ('Diego Matos','Ficha EPI','2027-01-20'),
  ('Luiz Paulo','CNH','2026-07-15'),
  ('Luiz Paulo','Ficha EPI','2026-08-12'),
  ('Luiz Paulo','ASO Periódico','2026-11-30'),
  ('Cleber Estêvão','CNH','2029-06-01'),
  ('Cleber Estêvão','ASO Periódico','2026-09-20'),
  ('Cleber Estêvão','Ficha EPI','2027-02-01'),
  ('Anderson Reis','ASO Admissional',null),
  ('Anderson Reis','CNH',null)
) as d(nome, tipo_doc, data_vencimento) on d.nome = novos.nome;

-- (Opcional) histórico, folha e ponto — replique o padrão acima consultando colaboradores por nome.

-- ============================================================
--  STORAGE — bucket privado de documentos + policies
--  Rode DEPOIS de criar o bucket (npm run setup:storage cria via API).
--  Alternativa manual em SQL:
-- ============================================================
insert into storage.buckets (id, name, public)
values ('documentos', 'documentos', false)
on conflict (id) do nothing;

-- Acesso via service_role (backend) já é liberado. Para leitura por usuários
-- autenticados do painel, habilite policies conforme sua necessidade, ex.:
-- create policy "ler documentos autenticado" on storage.objects for select
--   to authenticated using (bucket_id = 'documentos');
