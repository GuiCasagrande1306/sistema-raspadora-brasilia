# Gestão v2 — DP produção · DRE por obra · Bancos & Fluxo de Caixa

Implementado no stack real do projeto (**Express + Supabase/SQL**, dinheiro em **centavos** no banco; os endpoints recebem **valores em reais**). Todas as rotas exigem token (Bearer). Financeiro/DP-admin = perfil **ADMIN**; apontamento de campo = qualquer usuário logado.

## Migrations & Seed
```bash
# aplica o schema (tabelas + contas bancárias seed)
DATABASE_URL="postgresql://postgres:SENHA@db.<ref>.supabase.co:5432/postgres" \
  node -e "import('pg').then(async({default:p})=>{const c=new p.Client({connectionString:process.env.DATABASE_URL,ssl:{rejectUnauthorized:false}});await c.connect();await c.query(require('fs').readFileSync('supabase/gestao_v2.sql','utf8'));await c.end()})"
```
Contas semeadas: **Itaú Unibanco PJ**, **Banco do Brasil Reserva**, **Caixinha PIX Campo** (`is_caixinha=true`).

## Regras de negócio implementadas
1. **Folha semanal/mensal**: `(dias × diária) + (m² × comissão/m²) + bônus − vales pendentes`.
2. **Bônus assiduidade**: > 22 dias trabalhados no período → **+R$ 500**.
3. **Rateio de m²**: `metragem_dia ÷ nº da equipe` gravado por colaborador.
4. **Vale debita a Caixinha PIX** na hora (movimentação SAIDA/VALE_CAMPO) e fica pendente de abate.
5. **Gatilho de liquidez**: saldo da Caixinha < **R$ 1.000** → `alerta_liquidez: true` (sugere recarga do Itaú).

## Endpoints (exemplos)

### `POST /api/dp/apontamento`  (metragem + rateio)
```json
// req
{ "obra_id": "…", "metragem_dia_m2": 180, "equipe_ids": ["c1","c2","c3"], "observacoes_tecnicas": "1ª demão" }
// res 201
{ "id": "…", "metragem_dia_m2": 180, "m2_por_colaborador": 60, "equipe": 3 }
```

### `POST /api/dp/vale`  (debita caixinha)
```json
// req  (valor em reais)
{ "colaborador_id": "…", "valor": 200, "obra_id": "…", "observacao": "gasolina" }
// res 201
{ "vale": { "id":"…","valor":20000,"status_pagamento":"PAGO","abatido_folha":false },
  "saldo_caixinha": 230000, "alerta_liquidez": false }
```

### `GET /api/dp/folha-fechamento?desde=YYYY-MM-DD&ate=YYYY-MM-DD`
```json
{ "periodo": {"desde":"…","ate":"…"},
  "colaboradores": [
    { "nome":"Cleber Estêvão","dias_trabalhados":1,"m2_processados":60,
      "diarias":30000,"comissao":30000,"bonus_assiduidade":0,"vales_abatidos":20000,"total_liquido":40000 }
  ],
  "totais": { "a_pagar": 40000, "comissoes": 30000, "diarias": 30000, "vales": 20000, "bonus": 0 } }
```

### `POST /api/obras`  ·  `POST /api/obras/:id/insumos`  ·  `GET /api/obras/:id/dre`
```json
// GET /api/obras/:id/dre
{ "receita_bruta": 8680000, "custo_direto_insumos": 267000, "custo_direto_mao_obra": 2960000,
  "lucro_bruto": 5453000, "margem_lucro_percentual": 62.8 }
```

### `GET /api/bancos/saldos`
```json
{ "contas": [ {"nome_instituicao":"Caixinha PIX Campo","saldo_atual":250000,"is_caixinha":true}, … ],
  "total_consolidado": 20750000 }
```

### `POST /api/bancos/transferencia-interna`
```json
{ "origem_id":"itau…","destino_id":"caixinha…","valor":1000,"descricao":"recarga caixinha" }
```

### `GET /api/fluxo-caixa/projetado?dias=30`
```json
{ "saldo_atual": 20570000,
  "dias": [ {"data":"2026-08-05","entradas":5000000,"saidas":0,"saldo_projetado":25570000} ],
  "resumo": { "entradas_previstas": 5000000, "saidas_previstas": 800000, "saldo_final_projetado": 24770000 } }
```

> Validação: manual nos controllers (o projeto não usa Zod/Joi). Se quiser, dá para adicionar Zod depois.
