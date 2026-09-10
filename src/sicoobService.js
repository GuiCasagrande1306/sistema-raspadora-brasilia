// ============ INTEGRAÇÃO SICOOB — API Conta Corrente (saldo/extrato) ============
// Autenticação: OAuth2 client_credentials + mTLS (certificado A1 .PFX).
// Credenciais e certificado vêm SEMPRE das variáveis de ambiente (Vercel) — nunca do código/chat.
//
// Endpoints oficiais (developers.sicoob.com.br):
//   Token (Keycloak): https://auth.sicoob.com.br/auth/realms/cooperado/protocol/openid-connect/token
//   Base sandbox:     https://sandbox.sicoob.com.br/sicoob/sandbox/conta-corrente/v4
//   Base produção:    https://api.sicoob.com.br/conta-corrente/v4
//   Escopos:          cco_saldo (saldo), cco_extrato (extrato), openid
//
// Variáveis de ambiente esperadas:
//   SICOOB_CLIENT_ID        — Client ID gerado no portal do Sicoob (obrigatório)
//   SICOOB_CERT_PFX_BASE64  — certificado A1 (.PFX) convertido em base64 (obrigatório p/ mTLS)
//   SICOOB_CERT_SENHA       — senha do certificado .PFX (obrigatório)
//   SICOOB_AMBIENTE         — 'sandbox' | 'producao' (opcional; padrão 'sandbox')
//   SICOOB_CLIENT_SECRET    — opcional; só se o app do Sicoob exigir secret além do certificado

export const SICOOB_TOKEN_URL = 'https://auth.sicoob.com.br/auth/realms/cooperado/protocol/openid-connect/token';
export const SICOOB_BASE = {
  sandbox: 'https://sandbox.sicoob.com.br/sicoob/sandbox/conta-corrente/v4',
  producao: 'https://api.sicoob.com.br/conta-corrente/v4',
};
export const SICOOB_SCOPES = 'cco_saldo cco_extrato openid';

const AMBIENTE = (process.env.SICOOB_AMBIENTE || 'sandbox').toLowerCase() === 'producao' ? 'producao' : 'sandbox';

// Quais credenciais ainda faltam (sem NUNCA expor os valores).
export function sicoobStatus() {
  const faltando = [];
  if (!process.env.SICOOB_CLIENT_ID) faltando.push('SICOOB_CLIENT_ID');
  if (!process.env.SICOOB_CERT_PFX_BASE64) faltando.push('SICOOB_CERT_PFX_BASE64');
  if (!process.env.SICOOB_CERT_SENHA) faltando.push('SICOOB_CERT_SENHA');
  return {
    configurado: faltando.length === 0,
    faltando,
    ambiente: AMBIENTE,
    tem_client_secret: !!process.env.SICOOB_CLIENT_SECRET, // opcional
  };
}

export const SICOOB_ON = !sicoobStatus().faltando.length;
