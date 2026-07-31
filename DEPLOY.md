# Deploy na Vercel — Raspadora Brasília

O projeto já está configurado para a Vercel:
- `api/index.js` — entrada serverless que reaproveita o app Express (`src/server.js`).
- `vercel.json` — roteia `/api/*` para a função; o `public/` é servido estático pela CDN.
- `src/server.js` — só sobe `app.listen` localmente; na Vercel exporta o `app`.

## Passo a passo

### 1. Login e deploy (na pasta do projeto)
```bash
cd /Users/guilherme/raspadora-brasilia
npx vercel login      # abre o navegador para autenticar na sua conta
npx vercel            # primeiro deploy (preview) — responda as perguntas do CLI
```
No primeiro `vercel`, aceite os padrões:
- *Set up and deploy?* → **Y**
- *Which scope?* → sua conta
- *Link to existing project?* → **N**
- *Project name?* → `raspadora-brasilia` (ou o que preferir)
- *In which directory is your code located?* → **./**
- Framework preset → **Other**

### 2. Variáveis de ambiente (obrigatório)
As credenciais NÃO vão no código. Defina na Vercel (uma vez):
```bash
npx vercel env add SUPABASE_URL production
npx vercel env add SUPABASE_SERVICE_ROLE_KEY production
npx vercel env add SUPABASE_ANON_KEY production
npx vercel env add SUPABASE_BUCKET production      # valor: documentos
```
Cole o valor de cada uma quando pedido (os mesmos do seu `.env` local).
> NÃO defina `VERCEL` nem `PORT` — a plataforma cuida disso.

### 3. Deploy de produção
```bash
npx vercel --prod
```
Ao final, o CLI mostra a URL pública (ex.: `https://raspadora-brasilia.vercel.app`).

## Verificação pós-deploy
- `https://SEU-APP.vercel.app/api/health` deve retornar `{"ok":true,"storage":"supabase"}`.
- Abra a URL no celular → o banner **"Baixar App"** aparece (agora em HTTPS) e a instalação PWA funciona.

## Observações
- **Upload de documentos:** a Vercel limita o corpo da requisição a ~4,5 MB por request serverless. Arquivos maiores que isso falham no upload (o app aceita até 10 MB localmente). Para PDFs/fotos de documentos isso costuma ser suficiente; se precisar de arquivos grandes, o upload teria que ir direto do navegador para o Supabase Storage (signed upload URL).
- O `.env` está no `.vercelignore` — segredos vivem só nas env vars da Vercel.
- Redeploys: `npx vercel --prod` novamente, ou conecte o repositório Git no painel da Vercel para deploy automático a cada push.
