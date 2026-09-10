// ============ INTEGRAÇÃO SICOOB — API Conta Corrente (saldo/extrato) ============
// Autenticação: OAuth2 client_credentials + mTLS (certificado A1 .PFX) em PRODUÇÃO.
// Em SANDBOX não precisa de certificado — usa um token fixo do portal (Bearer).
// Credenciais e certificado vêm SEMPRE das variáveis de ambiente (Vercel) — nunca do código/chat.
//
// Multi-conta: a empresa tem 2 contas no Sicoob:
//   - principal : conta do dia a dia
//   - cofre     : conta reserva (aparece na página bloqueada "Cofre")
//
// Endpoints oficiais (developers.sicoob.com.br):
//   Token (Keycloak): https://auth.sicoob.com.br/auth/realms/cooperado/protocol/openid-connect/token
//   Base sandbox:     https://sandbox.sicoob.com.br/sicoob/sandbox/conta-corrente/v4
//   Base produção:    https://api.sicoob.com.br/conta-corrente/v4
//   Escopos:          cco_saldo (saldo), cco_extrato (extrato), openid
//
// Env vars por conta (ACC = PRINCIPAL | COFRE):
//   SICOOB_<ACC>_CLIENT_ID        — Client ID do app no portal
//   SICOOB_<ACC>_CONTA            — número da conta corrente (numeroContaCorrente)
//   SICOOB_<ACC>_CERT_PFX_BASE64  — certificado A1 (.PFX) em base64 (produção)
//   SICOOB_<ACC>_CERT_SENHA       — senha do .PFX (produção)
// Compartilhadas:
//   SICOOB_AMBIENTE               — 'sandbox' | 'producao' (padrão 'sandbox')
//   SICOOB_SANDBOX_TOKEN          — token fixo de teste do portal (padrão embutido)

import https from 'node:https';

export const SICOOB_TOKEN_URL = 'https://auth.sicoob.com.br/auth/realms/cooperado/protocol/openid-connect/token';
export const SICOOB_BASE = {
  sandbox: 'https://sandbox.sicoob.com.br/sicoob/sandbox/conta-corrente/v4',
  producao: 'https://api.sicoob.com.br/conta-corrente/v4',
};
export const SICOOB_SCOPES = 'cco_saldo cco_extrato openid';
// Token público de homologação do portal Sicoob (não é segredo; serve só p/ sandbox).
const SANDBOX_TOKEN_PADRAO = '1301865f-c6bc-38f3-9f49-666dbcfc59c3';

export const CONTAS = { principal: 'Conta Principal', cofre: 'Conta do Cofre' };

function ambiente() {
  return (process.env.SICOOB_AMBIENTE || 'sandbox').toLowerCase() === 'producao' ? 'producao' : 'sandbox';
}
function env(acc, suf) { return process.env[`SICOOB_${acc.toUpperCase()}_${suf}`] || null; }
function pfxBuffer(acc) { const b64 = env(acc, 'CERT_PFX_BASE64'); return b64 ? Buffer.from(b64, 'base64') : null; }

// Requisição HTTP com suporte a mTLS (pfx). Retorna { status, json, texto }.
function request(method, urlStr, { headers = {}, body = null, pfx = null, senha = null } = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(urlStr);
    const opts = { method, hostname: u.hostname, port: u.port || 443, path: u.pathname + u.search, headers: { ...headers } };
    if (pfx) { opts.pfx = pfx; if (senha) opts.passphrase = senha; }
    const req = https.request(opts, (res) => {
      let data = '';
      res.on('data', (c) => { data += c; });
      res.on('end', () => { let json = null; try { json = data ? JSON.parse(data) : null; } catch (_) {} resolve({ status: res.statusCode, json, texto: data }); });
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

// Status das credenciais por conta (sem NUNCA expor valores).
export function sicoobStatus() {
  const amb = ambiente();
  const contas = {};
  for (const acc of Object.keys(CONTAS)) {
    const temId = !!env(acc, 'CLIENT_ID');
    const temConta = !!env(acc, 'CONTA');
    const temCert = !!env(acc, 'CERT_PFX_BASE64');
    const temSenha = !!env(acc, 'CERT_SENHA');
    // sandbox: basta a conta (token é fixo). produção: precisa id + conta + cert + senha.
    const pronta = amb === 'sandbox' ? temConta : (temId && temConta && temCert && temSenha);
    const faltando = [];
    if (!temConta) faltando.push(`SICOOB_${acc.toUpperCase()}_CONTA`);
    if (amb === 'producao') {
      if (!temId) faltando.push(`SICOOB_${acc.toUpperCase()}_CLIENT_ID`);
      if (!temCert) faltando.push(`SICOOB_${acc.toUpperCase()}_CERT_PFX_BASE64`);
      if (!temSenha) faltando.push(`SICOOB_${acc.toUpperCase()}_CERT_SENHA`);
    }
    contas[acc] = { label: CONTAS[acc], pronta, faltando };
  }
  return { ambiente: amb, configurado: Object.values(contas).some((c) => c.pronta), contas };
}
export const SICOOB_ON = sicoobStatus().configurado;

// Obtém o access token para uma conta.
async function getToken(acc) {
  if (ambiente() === 'sandbox') return process.env.SICOOB_SANDBOX_TOKEN || SANDBOX_TOKEN_PADRAO;
  const clientId = env(acc, 'CLIENT_ID');
  const pfx = pfxBuffer(acc);
  const senha = env(acc, 'CERT_SENHA');
  if (!clientId || !pfx) throw new Error(`Sicoob ${acc}: faltam credenciais/certificado`);
  const body = new URLSearchParams({ grant_type: 'client_credentials', client_id: clientId, scope: SICOOB_SCOPES }).toString();
  const secret = env(acc, 'CLIENT_SECRET'); if (secret) body.client_secret = secret;
  const r = await request('POST', SICOOB_TOKEN_URL, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': Buffer.byteLength(body) },
    body, pfx, senha,
  });
  if (r.status !== 200 || !r.json?.access_token) throw new Error(`Sicoob token (${acc}): HTTP ${r.status} ${r.texto?.slice(0, 200) || ''}`);
  return r.json.access_token;
}

function baseHeaders(acc, token) {
  const h = { Authorization: `Bearer ${token}`, Accept: 'application/json' };
  // sandbox: o gateway exige client_id = token fixo. produção: client_id do app.
  const clientId = ambiente() === 'sandbox'
    ? (process.env.SICOOB_SANDBOX_TOKEN || SANDBOX_TOKEN_PADRAO)
    : env(acc, 'CLIENT_ID');
  if (clientId) h.client_id = clientId;
  return h;
}
function agentOpts(acc) {
  if (ambiente() === 'producao') return { pfx: pfxBuffer(acc), senha: env(acc, 'CERT_SENHA') };
  return {};
}

// Saldo da conta.
export async function getSaldo(acc) {
  if (!CONTAS[acc]) throw new Error('conta inválida');
  const conta = env(acc, 'CONTA'); if (!conta) throw new Error(`Sicoob ${acc}: SICOOB_${acc.toUpperCase()}_CONTA não configurada`);
  const token = await getToken(acc);
  const url = `${SICOOB_BASE[ambiente()]}/saldo?numeroContaCorrente=${encodeURIComponent(conta)}`;
  const r = await request('GET', url, { headers: baseHeaders(acc, token), ...agentOpts(acc) });
  if (r.status !== 200) throw new Error(`Sicoob saldo (${acc}): HTTP ${r.status} ${r.texto?.slice(0, 300) || ''}`);
  return r.json;
}

// Extrato de um período. { mes, ano, diaInicial, diaFinal }
export async function getExtrato(acc, { mes, ano, diaInicial = 1, diaFinal = 31 } = {}) {
  if (!CONTAS[acc]) throw new Error('conta inválida');
  const conta = env(acc, 'CONTA'); if (!conta) throw new Error(`Sicoob ${acc}: SICOOB_${acc.toUpperCase()}_CONTA não configurada`);
  const now = new Date(); mes = mes || (now.getMonth() + 1); ano = ano || now.getFullYear();
  const token = await getToken(acc);
  const qs = new URLSearchParams({ diaInicial: String(diaInicial), diaFinal: String(diaFinal), numeroContaCorrente: String(conta) }).toString();
  const url = `${SICOOB_BASE[ambiente()]}/extrato/${mes}/${ano}?${qs}`;
  const r = await request('GET', url, { headers: baseHeaders(acc, token), ...agentOpts(acc) });
  if (r.status !== 200) throw new Error(`Sicoob extrato (${acc}): HTTP ${r.status} ${r.texto?.slice(0, 300) || ''}`);
  return r.json;
}
