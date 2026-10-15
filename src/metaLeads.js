// Leads do formulário instantâneo da Meta (Facebook/Instagram) → tabela leads.
// .env: META_PAGE_ID, META_PAGE_TOKEN (token de Página com leads_retrieval), META_APP_SECRET, META_VERIFY_TOKEN
import crypto from 'node:crypto';

const { META_PAGE_ID, META_PAGE_TOKEN, META_APP_SECRET, META_VERIFY_TOKEN } = process.env;
const GRAPH = `https://graph.facebook.com/${process.env.META_GRAPH_VERSION || 'v24.0'}`;
const LEAD_FIELDS = 'id,created_time,field_data,ad_id,ad_name,adset_name,campaign_name,form_id,platform,is_organic';

export const META_LEADS_ON = Boolean(META_PAGE_ID && META_PAGE_TOKEN);

export function verificarDesafio(query) {
  if (query['hub.mode'] === 'subscribe' && META_VERIFY_TOKEN && query['hub.verify_token'] === META_VERIFY_TOKEN) return query['hub.challenge'];
  return null;
}

export function assinaturaValida(rawBody, header) {
  if (!META_APP_SECRET || !rawBody || !header || !header.startsWith('sha256=')) return false;
  const esperado = Buffer.from('sha256=' + crypto.createHmac('sha256', META_APP_SECRET).update(rawBody).digest('hex'));
  const recebido = Buffer.from(header);
  return esperado.length === recebido.length && crypto.timingSafeEqual(esperado, recebido);
}

async function graph(path, params = {}) {
  const qs = new URLSearchParams({ ...params, access_token: META_PAGE_TOKEN });
  const r = await fetch(`${GRAPH}/${path}?${qs}`);
  const data = await r.json().catch(() => ({}));
  if (!r.ok || data.error) throw new Error('Meta: ' + (data.error?.message || `HTTP ${r.status}`));
  return data;
}

async function graphPost(path, params = {}) {
  const qs = new URLSearchParams({ ...params, access_token: META_PAGE_TOKEN });
  const r = await fetch(`${GRAPH}/${path}?${qs}`, { method: 'POST' });
  const data = await r.json().catch(() => ({}));
  if (!r.ok || data.error) throw new Error('Meta: ' + (data.error?.message || `HTTP ${r.status}`));
  return data;
}

export const buscarLead = leadgenId => graph(leadgenId, { fields: LEAD_FIELDS });

// "qual_serviço_você_procura?" → "Qual serviço você procura?"
const rotuloPergunta = k => { const s = String(k).replace(/_/g, ' ').trim(); return s.charAt(0).toUpperCase() + s.slice(1); };
// opção de múltipla escolha vem como chave ("concreto_polido") → "Concreto polido"
const resposta = v => /^[a-z0-9_]+$/.test(v) && v.includes('_') ? rotuloPergunta(v) : v;
const linhaPergunta = (k, v) => { const p = rotuloPergunta(k); return `${p}${/[?:]$/.test(p) ? ' ' : ': '}${resposta(v)}`; };
const PADRAO = new Set(['full_name', 'first_name', 'last_name', 'phone_number', 'email', 'street_address', 'city', 'state', 'zip_code', 'post_code']);

export function leadParaRegistro(ml, nomeFormulario) {
  const f = {};
  for (const d of ml.field_data || []) f[d.name] = (d.values || []).filter(Boolean).join(', ');
  const nome = f.full_name || [f.first_name, f.last_name].filter(Boolean).join(' ') || f.email || 'Lead Meta';
  const endereco = [f.street_address, f.city, f.state].filter(Boolean).join(' — ') || null;
  const extras = Object.entries(f).filter(([k, v]) => !PADRAO.has(k) && v);
  const sv = extras.find(([k]) => /servi/i.test(k))?.[1];
  const servico = sv ? resposta(sv) : null;
  const quando = ml.created_time ? new Date(ml.created_time).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }) : '';
  const obs = [
    `Formulário ${ml.platform === 'ig' ? 'do Instagram' : 'do Facebook'}${ml.is_organic ? ' (orgânico)' : ''}${quando ? ' em ' + quando : ''}`,
    f.email && `E-mail: ${f.email}`,
    ...extras.map(([k, v]) => linhaPergunta(k, v)),
    ml.campaign_name && `Campanha: ${ml.campaign_name}`,
    ml.adset_name && `Conjunto: ${ml.adset_name}`,
    ml.ad_name && `Anúncio: ${ml.ad_name}`,
    nomeFormulario && `Formulário: ${nomeFormulario}`,
  ].filter(Boolean).join('\n');
  return {
    nome, telefone: f.phone_number || null, endereco, servico,
    origem: ml.platform === 'ig' ? 'INSTAGRAM' : 'META',
    status: 'MARCAR_VISITA', situacao_pagamento: 'PENDENTE',
    observacao: obs, externo_id: 'meta:' + ml.id,
  };
}

// Puxa os leads dos formulários da Página desde `desdeUnix` (rede de segurança se algum webhook se perder)
export async function listarLeadsRecentes(desdeUnix) {
  const forms = await graph(`${META_PAGE_ID}/leadgen_forms`, { fields: 'id,name', limit: '100' });
  const out = [];
  for (const form of forms.data || []) {
    let page = await graph(`${form.id}/leads`, {
      fields: LEAD_FIELDS, limit: '100',
      filtering: JSON.stringify([{ field: 'time_created', operator: 'GREATER_THAN', value: desdeUnix }]),
    });
    for (;;) {
      for (const ml of page.data || []) out.push({ ml, form: form.name });
      if (!page.paging?.next) break;
      const r = await fetch(page.paging.next); page = await r.json();
      if (page.error) throw new Error('Meta: ' + page.error.message);
    }
  }
  return out;
}

// Garante que a Página manda o evento `leadgen` para o app (idempotente)
export const assinarPagina = () => graphPost(`${META_PAGE_ID}/subscribed_apps`, { subscribed_fields: 'leadgen' });
