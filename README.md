# Raspadora Brasília — Painel de Gestão

Painel Kanban de **Departamento Pessoal** e **Financeiro/Obras** para a Raspadora Brasília
(raspagem, calafetagem e restauração de pisos de madeira).

Stack: **Express + Supabase** no backend, SPA single-file (`public/index.html`) no front.
Sem credenciais Supabase, roda com dados **mock em memória** — dá pra testar na hora.

## Rodar

```bash
npm install
npm start            # http://localhost:3400
```

Para usar o Supabase de verdade:
1. Copie `.env.example` para `.env` e preencha `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` (+ `SUPABASE_ANON_KEY`).
2. Aplique o schema. Duas opções:
   - **Automático:** `DATABASE_URL="postgresql://postgres:SENHA@db.<ref>.supabase.co:5432/postgres" npm run migrate`
   - **Manual:** cole `supabase/schema.sql` no SQL Editor do painel e rode.
3. Crie o bucket de documentos: `npm run setup:storage`.
4. `npm start` — o log mostra `Armazenamento: Supabase` e `/api/health` retorna `"storage":"supabase"`.

> `.env` está no `.gitignore`. Nunca exponha a `service_role` no frontend ou em repositório.

## API

| Método | Rota | Função |
|--------|------|--------|
| GET | `/api/dp/kanban` | Colaboradores agrupados por coluna |
| POST | `/api/dp/colaborador` | Cadastra colaborador |
| PATCH | `/api/dp/colaborador/:id/mover` | Move card (`{status_kanban}`) |
| GET | `/api/financeiro/obras` | Obras por coluna + resumo (margem, valor/m²) |
| POST | `/api/financeiro/lancamento` | Entrada/saída de caixa (atualiza custos da obra) |
| GET | `/api/health` | Status + tipo de armazenamento |

**Dinheiro em centavos** (integer). Margem = `(valor_total - custo_insumos - custo_mao_obra) / valor_total`.
