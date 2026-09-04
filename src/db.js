// Camada de dados: usa Supabase se houver credenciais, senão cai em MOCK em memória.
import { createClient } from '@supabase/supabase-js';

const {
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  SUPABASE_SERVICE_KEY, // compat com nome antigo
  SUPABASE_BUCKET,
} = process.env;

const SERVICE_KEY = SUPABASE_SERVICE_ROLE_KEY || SUPABASE_SERVICE_KEY;
export const USING_SUPABASE = Boolean(SUPABASE_URL && SERVICE_KEY);
export const BUCKET = SUPABASE_BUCKET || 'documentos';

let supabase = null;
if (USING_SUPABASE) {
  // service role: acesso total no backend (bypassa RLS). Nunca exponha no frontend.
  supabase = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });
}
export { supabase };

const uid = () => 'm-' + Math.random().toString(36).slice(2, 10);

// ============================================================
//  MOCK (memória) — referência: hoje = 2026-07-31
// ============================================================
const O1 = uid(), O2 = uid(), O3 = uid(), O4 = uid(), O5 = uid();
const C = { and: uid(), van: uid(), die: uid(), cle: uid(), lui: uid(), mar: uid(), jul: uid(), rob: uid() };

const mock = {
  obras: [
    { id: O1, cliente: 'Construtora Opus', endereco: 'Galpão Logístico · SIA', metragem_m2: 350, tipo_piso: 'Piso Fulget Cinza', valor_contrato: 5250000, custo_insumos: 0, custo_mao_obra: 0, status_pagamento: 'aguardando_sinal', coluna_kanban: 'aprovado', progresso: 0 },
    { id: O2, cliente: 'TCI Construtora', endereco: 'Loja Âncora · Taguatinga', metragem_m2: 620, tipo_piso: 'Concreto Polido', valor_contrato: 8680000, custo_insumos: 1820000, custo_mao_obra: 2960000, status_pagamento: '50% sinal pago', coluna_kanban: 'execucao', progresso: 68 },
    { id: O3, cliente: 'CasaCor Brasília', endereco: 'Estande · Pavilhão', metragem_m2: 180, tipo_piso: 'Epóxi Autonivelante', valor_contrato: 3960000, custo_insumos: 940000, custo_mao_obra: 820000, status_pagamento: '50% sinal pago', coluna_kanban: 'execucao', progresso: 40 },
    { id: O4, cliente: 'Residencial Vila Rica', endereco: 'Área comum · Lago Norte', metragem_m2: 420, tipo_piso: 'Fulget Bege + Selante', valor_contrato: 5880000, custo_insumos: 1560000, custo_mao_obra: 1980000, status_pagamento: '50% sinal pago', coluna_kanban: 'afericao', progresso: 100 },
    { id: O5, cliente: 'Rede Supermercados Real', endereco: 'Filial 07 · Ceilândia', metragem_m2: 540, tipo_piso: 'Concreto Polido + Junta', valor_contrato: 7020000, custo_insumos: 1490000, custo_mao_obra: 2260000, status_pagamento: '100% pago', coluna_kanban: 'liquidado', progresso: 100 },
  ],
  colaboradores: [
    { id: C.and, nome: 'Anderson Reis', cargo: 'Aplicador de Epóxi', status: 'admissao', chave_pix: '(61) 97777-1234', telefone: '(61) 97777-1234', contato_emergencia: 'Marta Reis · (61) 98888-2211', data_admissao: null, valor_diaria: 25000, meta_m2: 0, feito_m2: 0, saldo_ferias_dias: 0 },
    { id: C.van, nome: 'Vanessa Torres', cargo: 'Vistoriadora / Orçamentista', status: 'admissao', chave_pix: null, telefone: '(61) 96666-7788', contato_emergencia: 'Pedro Torres · (61) 95555-1010', data_admissao: null, valor_diaria: null, meta_m2: 0, feito_m2: 0, saldo_ferias_dias: 0 },
    { id: C.die, nome: 'Diego Matos', cargo: 'Operador de Fulget', status: 'ativo', chave_pix: 'diego.matos@email.com', telefone: '(61) 99191-3030', contato_emergencia: 'Ana Matos · (61) 99292-4040', data_admissao: '2024-11-04', valor_diaria: 24000, obra_alocada: O3, obra_txt: 'Obra CasaCor', meta_m2: 180, feito_m2: 120, saldo_ferias_dias: 12 },
    { id: C.cle, nome: 'Cleber Estêvão', cargo: 'Encarregado de Obra', status: 'ativo', chave_pix: '(61) 99999-0000', telefone: '(61) 99999-0000', contato_emergencia: 'Rita Estêvão · (61) 98181-2323', data_admissao: '2022-03-15', valor_diaria: 30000, obra_alocada: O2, obra_txt: 'Obra TCI', meta_m2: 620, feito_m2: 420, saldo_ferias_dias: 8 },
    { id: C.lui, nome: 'Luiz Paulo', cargo: 'Aplicador de Epóxi', status: 'ativo', chave_pix: '(61) 98888-0000', telefone: '(61) 98888-0000', contato_emergencia: 'Sônia P. · (61) 97070-1212', data_admissao: '2023-08-01', valor_diaria: 26000, obra_alocada: O3, obra_txt: 'Obra CasaCor', meta_m2: 180, feito_m2: 90, saldo_ferias_dias: 20 },
    { id: C.mar, nome: 'Marcos Aurélio', cargo: 'Operador de Piso Industrial', status: 'ferias', chave_pix: '(61) 99999-4821', telefone: '(61) 99999-4821', contato_emergencia: 'Célia A. · (61) 96363-7474', data_admissao: '2021-09-19', valor_diaria: 28000, meta_m2: 0, feito_m2: 0, saldo_ferias_dias: 0, ferias_ate: '2026-08-14' },
    { id: C.jul, nome: 'Juliana Braga', cargo: 'Financeiro / Compras', status: 'ativo', chave_pix: null, telefone: '(61) 95454-8989', contato_emergencia: 'Carlos B. · (61) 94343-9090', data_admissao: '2020-05-11', valor_diaria: null, meta_m2: 0, feito_m2: 0, saldo_ferias_dias: 5 },
    { id: C.rob, nome: 'Roberto Lima', cargo: 'Ajudante Geral', status: 'desligamento', chave_pix: '(61) 93232-1515', telefone: '(61) 93232-1515', contato_emergencia: 'Ivo Lima · (61) 92121-3434', data_admissao: '2023-02-10', valor_diaria: 18000, meta_m2: 0, feito_m2: 0, saldo_ferias_dias: 0 },
  ],
  documentos: [
    { id: uid(), colaborador_id: C.die, tipo_doc: 'ASO Periódico', data_vencimento: '2026-08-10' },  // ~10d → alerta
    { id: uid(), colaborador_id: C.die, tipo_doc: 'CNH', data_vencimento: '2028-03-01' },
    { id: uid(), colaborador_id: C.die, tipo_doc: 'Ficha EPI', data_vencimento: '2027-01-20' },
    { id: uid(), colaborador_id: C.lui, tipo_doc: 'CNH', data_vencimento: '2026-07-15' },              // vencida → crítico
    { id: uid(), colaborador_id: C.lui, tipo_doc: 'Ficha EPI', data_vencimento: '2026-08-12' },        // ~12d → alerta
    { id: uid(), colaborador_id: C.lui, tipo_doc: 'ASO Periódico', data_vencimento: '2026-11-30' },
    { id: uid(), colaborador_id: C.cle, tipo_doc: 'CNH', data_vencimento: '2029-06-01' },
    { id: uid(), colaborador_id: C.cle, tipo_doc: 'ASO Periódico', data_vencimento: '2026-09-20' },
    { id: uid(), colaborador_id: C.cle, tipo_doc: 'Ficha EPI', data_vencimento: '2027-02-01' },
    { id: uid(), colaborador_id: C.and, tipo_doc: 'ASO Admissional', data_vencimento: null },          // pendente
    { id: uid(), colaborador_id: C.and, tipo_doc: 'CNH', data_vencimento: null },                       // pendente
  ],
  historico: [
    { id: uid(), colaborador_id: C.cle, data: '2022-03-15', evento: 'Admissão', observacao: 'Contratado como Operador' },
    { id: uid(), colaborador_id: C.cle, data: '2023-07-01', evento: 'Promoção', observacao: 'Promovido a Encarregado de Obra' },
    { id: uid(), colaborador_id: C.cle, data: '2024-05-10', evento: 'Elogio', observacao: 'Entrega da obra TCI antes do prazo' },
    { id: uid(), colaborador_id: C.die, data: '2024-11-04', evento: 'Admissão', observacao: 'Operador de Fulget' },
    { id: uid(), colaborador_id: C.die, data: '2025-06-18', evento: 'Transferência', observacao: 'Realocado para obra CasaCor' },
    { id: uid(), colaborador_id: C.lui, data: '2023-08-01', evento: 'Admissão', observacao: 'Aplicador de Epóxi' },
    { id: uid(), colaborador_id: C.lui, data: '2025-02-12', evento: 'Advertência', observacao: 'Atraso recorrente — advertência verbal' },
  ],
  folha: [
    { id: uid(), colaborador_id: C.die, mes_referencia: '2026-07', salario_base: 528000, comissoes: 84000, descontos_vales: 60000, valor_liquido: 552000 },
    { id: uid(), colaborador_id: C.cle, mes_referencia: '2026-07', salario_base: 660000, comissoes: 120000, descontos_vales: 0, valor_liquido: 780000 },
    { id: uid(), colaborador_id: C.lui, mes_referencia: '2026-07', salario_base: 572000, comissoes: 46000, descontos_vales: 80000, valor_liquido: 538000 },
    { id: uid(), colaborador_id: C.rob, mes_referencia: '2026-07', salario_base: 396000, comissoes: 0, descontos_vales: 30000, valor_liquido: 366000 },
  ],
  ponto: {  // resumo do mês por colaborador
    [C.die]: { dias_trabalhados: 22, faltas: 1, horas_extras: 6 },
    [C.cle]: { dias_trabalhados: 24, faltas: 0, horas_extras: 12 },
    [C.lui]: { dias_trabalhados: 20, faltas: 3, horas_extras: 2 },
  },
  lancamentos: [],
  registroVT: [],
  orcamentos: [],
  notasFiscais: [],
  docsEmpresa: [],
  leads: [],
  clientes: [],
  gefipPastas: [],
  gefipDocs: [],
  boletos: [],
  lancDiarios: [],
  funcoesDiaria: [
    // valores iniciais editáveis (Adelino ajusta na tela)
  ],
  cronogramaAloc: [],
  servicosCatalogo: [],
  config: {},
  _orcSeq: 193,
};

const VALOR_PASSAGEM = 4.30;

// status de documento SST/NR (janela de 30 dias)
export function sstStatus(dataVenc) {
  if (!dataVenc) return { status: 'SEM_VENCIMENTO', dias: null };
  const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
  const dias = Math.round((new Date(dataVenc + 'T00:00:00') - hoje) / 86400000);
  if (dias < 0) return { status: 'VENCIDO', dias };
  if (dias <= 30) return { status: 'PRESTES_A_VENCER', dias };
  return { status: 'VALIDO', dias };
}

// Checklist padronizado de documentos do colaborador (padrão Inmeta)
export const CATALOGO_DOCS = [
  // Docs. Únicos
  { codigo: '01', nome: 'Ficha de Registro', vencivel: false, tab: 'unico' },
  { codigo: '02', nome: 'CTPS / e-Social / Contrato', vencivel: false, tab: 'unico' },
  { codigo: '03', nome: 'ASO (Atestado de Saúde Ocupacional)', vencivel: true, tab: 'unico' },
  { codigo: '04', nome: 'Cartão de Vacina', vencivel: false, tab: 'unico' },
  { codigo: '05', nome: 'Ordem de Serviço', vencivel: false, tab: 'unico' },
  { codigo: '07', nome: 'NR 06', vencivel: true, tab: 'unico' },
  { codigo: '08', nome: 'NR 07', vencivel: true, tab: 'unico' },
  { codigo: '11', nome: 'NR 12', vencivel: true, tab: 'unico' },
  { codigo: '14', nome: 'NR 18', vencivel: true, tab: 'unico' },
  { codigo: '15', nome: 'NR 23', vencivel: true, tab: 'unico' },
  { codigo: '19', nome: 'NR 35', vencivel: true, tab: 'unico' },
  { codigo: '20', nome: 'Anuência NR 35', vencivel: false, tab: 'unico' },
  { codigo: '21', nome: 'Avaliação NR 35', vencivel: true, tab: 'unico' },
  { codigo: '22', nome: 'Anuência NR 12', vencivel: false, tab: 'unico' },
  { codigo: 'CE', nome: 'Comprovante de Endereço', vencivel: false, tab: 'unico' },
  { codigo: 'F34', nome: 'Foto 3x4', vencivel: false, tab: 'unico' },
  // Docs. Mensais (vencimento mensal)
  { codigo: 'M06', nome: 'Ficha de EPI', vencivel: true, tab: 'mensal' },
  // Docs. Desligamento
  { codigo: 'D01', nome: 'ASO Demissional', vencivel: false, tab: 'desligamento' },
  { codigo: 'D02', nome: 'Aviso Prévio', vencivel: false, tab: 'desligamento' },
  { codigo: 'D03', nome: 'Multa FGTS', vencivel: false, tab: 'desligamento' },
  { codigo: 'D04', nome: 'Relatório Multa FGTS', vencivel: false, tab: 'desligamento' },
  { codigo: 'D05', nome: 'Requerimento Seguro Desemprego', vencivel: false, tab: 'desligamento' },
  { codigo: 'D06', nome: 'Termo de Quitação', vencivel: false, tab: 'desligamento' },
  { codigo: 'D07', nome: 'Termo de Rescisão', vencivel: false, tab: 'desligamento' },
  { codigo: 'D08', nome: 'Comprovante TRCT', vencivel: false, tab: 'desligamento' },
  { codigo: 'D09', nome: 'Informativo de Rescisão', vencivel: false, tab: 'desligamento' },
];

// alerta de documento a partir da data de vencimento
export function docStatus(dataVenc) {
  if (!dataVenc) return { nivel: 'pendente', dias: null };
  const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
  const venc = new Date(dataVenc + 'T00:00:00');
  const dias = Math.round((venc - hoje) / 86400000);
  if (dias < 0) return { nivel: 'vencido', dias };
  if (dias <= 15) return { nivel: 'alerta', dias };
  return { nivel: 'ok', dias };
}

// ============================================================
//  API unificada
// ============================================================
const sb = (table) => supabase.from(table);
// Detecta "coluna não existe" no erro do PostgREST (migração ainda não rodada) e devolve o nome da coluna
function _missingCol(error) {
  if (!error) return null;
  const msg = (error.message || '') + ' ' + (error.details || '') + ' ' + (error.hint || '');
  const m = msg.match(/'([a-z_]+)' column/i) || msg.match(/column "?([a-z_]+)"? .*does not exist/i);
  return m ? m[1] : null;
}
// INSERT tolerante: se uma coluna nova ainda não existe no banco, remove-a e tenta de novo (não quebra pré-migração)
async function insertSafe(table, obj) {
  let o = { ...obj };
  for (let i = 0; i < 6; i++) {
    const { data, error } = await sb(table).insert(o).select().single();
    if (!error) return data;
    const col = _missingCol(error);
    if (col && col in o) { delete o[col]; continue; }
    throw error;
  }
  throw new Error('insertSafe: colunas demais faltando em ' + table);
}
// UPDATE tolerante por id
async function updateSafeById(table, id, obj) {
  let o = { ...obj };
  for (let i = 0; i < 6; i++) {
    const { data, error } = await sb(table).update(o).eq('id', id).select().single();
    if (!error) return data;
    const col = _missingCol(error);
    if (col && col in o) { delete o[col]; continue; }
    throw error;
  }
  throw new Error('updateSafeById: colunas demais faltando em ' + table);
}

export const db = {
  // ---- OBRAS ----
  async listObras() {
    if (USING_SUPABASE) { const { data, error } = await sb('obras_financeiro').select('*').order('created_at'); if (error) throw error; return data; }
    return mock.obras;
  },
  async moverObra(id, coluna_kanban) {
    if (USING_SUPABASE) { const { data, error } = await sb('obras_financeiro').update({ coluna_kanban }).eq('id', id).select().single(); if (error) throw error; return data; }
    const o = mock.obras.find(x => x.id === id); if (!o) return null; o.coluna_kanban = coluna_kanban; return o;
  },
  async createObra(o) {
    const base = { custo_insumos: 0, custo_mao_obra: 0, progresso: 0, coluna_kanban: 'aprovado', ...o };
    if (USING_SUPABASE) { return insertSafe('obras_financeiro', base); }   // tolerante: ignora coluna ausente (ex.: categoria_servico sem migration)
    const novo = { id: uid(), ...base }; mock.obras.push(novo); return novo;
  },
  async getObra(id) {
    if (USING_SUPABASE) { const { data, error } = await sb('obras_financeiro').select('*').eq('id', id).single(); if (error) throw error; return data; }
    return mock.obras.find(o => o.id === id) || null;
  },
  async updateObra(id, patch) {
    if (USING_SUPABASE) { return updateSafeById('obras_financeiro', id, patch); }   // tolerante: ignora coluna que ainda não existe (ex.: categoria_servico sem migration)
    const o = mock.obras.find(x => x.id === id); if (!o) return null; Object.assign(o, patch); return o;
  },
  // ---- Medições / Notas recebidas por obra ----
  async listMedicoesObra(obra_id) {
    if (USING_SUPABASE) {
      const { data, error } = await sb('medicoes_obra').select('*').eq('obra_id', obra_id).order('data', { ascending: true });
      if (error) throw error;
      return data || [];
    }
    return (mock.medicoesObra || []).filter(m => m.obra_id === obra_id);
  },
  async createMedicaoObra(m) {
    if (USING_SUPABASE) { return insertSafe('medicoes_obra', m); }   // insertSafe: se a coluna `datas` ainda não existir, salva sem ela
    (mock.medicoesObra ||= []).push({ id: uid(), criado_em: new Date().toISOString(), ...m }); return mock.medicoesObra[mock.medicoesObra.length - 1];
  },
  async updateMedicaoObra(id, patch) {
    if (USING_SUPABASE) { const { data, error } = await sb('medicoes_obra').update(patch).eq('id', id).select().single(); if (error) throw error; return data; }
    const m = (mock.medicoesObra || []).find(x => x.id === id); if (!m) return null; Object.assign(m, patch); return m;
  },
  async deleteMedicaoObra(id) {
    if (USING_SUPABASE) { const { error } = await sb('medicoes_obra').delete().eq('id', id); if (error) throw error; return { ok: true }; }
    mock.medicoesObra = (mock.medicoesObra || []).filter(m => m.id !== id); return { ok: true };
  },
  // Valores retidos ainda não resgatados — lembrete de cobrança (a construtora não avisa)
  async listRetencoes(hojeStr) {
    if (!USING_SUPABASE) return { retencoes: [], resumo: { total: 0, vencidos: 0, vencidos_valor: 0, proximos: 0 } };
    const hoje = hojeStr || new Date().toISOString().slice(0, 10);
    const { data: meds } = await sb('medicoes_obra').select('*').gt('valor_retido', 0).eq('retido_resgatado', false);
    const lista = meds || [];
    const ids = [...new Set(lista.map(m => m.obra_id))];
    let mapa = {};
    if (ids.length) { const { data: obras } = await sb('obras_financeiro').select('id,cliente').in('id', ids); mapa = Object.fromEntries((obras || []).map(o => [o.id, o.cliente])); }
    const d30 = new Date(hoje + 'T00:00:00'); d30.setDate(d30.getDate() + 30); const ate30 = d30.toISOString().slice(0, 10);
    const retencoes = lista.map(m => {
      const venc = m.data_resgate && m.data_resgate <= hoje;
      const prox = !venc && m.data_resgate && m.data_resgate <= ate30;
      return { id: m.id, obra_id: m.obra_id, obra_cliente: mapa[m.obra_id] || '—', descricao: m.descricao || null, valor_retido: m.valor_retido, data_resgate: m.data_resgate || null, data: m.data || null, status: venc ? 'VENCIDO' : (prox ? 'PROXIMO' : (m.data_resgate ? 'FUTURO' : 'SEM_DATA')) };
    }).sort((a, b) => (a.data_resgate || '9999-99').localeCompare(b.data_resgate || '9999-99'));
    const resumo = {
      total: retencoes.reduce((s, r) => s + r.valor_retido, 0),
      vencidos: retencoes.filter(r => r.status === 'VENCIDO').length,
      vencidos_valor: retencoes.filter(r => r.status === 'VENCIDO').reduce((s, r) => s + r.valor_retido, 0),
      proximos: retencoes.filter(r => r.status === 'PROXIMO').length,
    };
    return { retencoes, resumo };
  },
  async createLancamento(l) {
    if (USING_SUPABASE) {
      const { data, error } = await sb('lancamentos').insert(l).select().single(); if (error) throw error;
      if (l.tipo === 'saida' && l.obra_id) {
        const col = l.categoria === 'insumo' ? 'custo_insumos' : 'custo_mao_obra';
        const { data: obra } = await sb('obras_financeiro').select(col).eq('id', l.obra_id).single();
        if (obra) await sb('obras_financeiro').update({ [col]: (obra[col] || 0) + l.valor }).eq('id', l.obra_id);
      }
      return data;
    }
    const novo = { id: uid(), created_at: new Date().toISOString(), ...l };
    mock.lancamentos.push(novo);
    const obra = mock.obras.find(o => o.id === l.obra_id);
    if (obra && l.tipo === 'saida') { if (l.categoria === 'insumo') obra.custo_insumos += l.valor; else obra.custo_mao_obra += l.valor; }
    return novo;
  },

  // ---- COLABORADORES ----
  async listColaboradores() {
    if (USING_SUPABASE) { const { data, error } = await sb('colaboradores').select('*').order('created_at'); if (error) throw error; return data; }
    return mock.colaboradores;
  },
  async listDocumentos() {
    if (USING_SUPABASE) { const { data, error } = await sb('documentos_dp').select('*'); if (error) throw error; return data; }
    return mock.documentos;
  },
  // Upload de arquivo para o Storage + registro em documentos_dp.
  // file = { buffer, originalname, mimetype } (multer memoryStorage).
  async uploadDocumento(colaboradorId, { tipo_doc, data_vencimento, file }) {
    let url_arquivo = null;
    if (USING_SUPABASE) {
      if (file) {
        const safe = (file.originalname || 'arquivo').replace(/[^\w.\-]+/g, '_');
        const path = `${colaboradorId}/${Date.now()}_${safe}`;
        const { error: upErr } = await supabase.storage.from(BUCKET)
          .upload(path, file.buffer, { contentType: file.mimetype, upsert: false });
        if (upErr) throw upErr;
        url_arquivo = path; // bucket privado: guardamos o path, servimos via signed URL
      }
      const { data, error } = await sb('documentos_dp')
        .insert({ colaborador_id: colaboradorId, tipo_doc, data_vencimento: data_vencimento || null, url_arquivo })
        .select().single();
      if (error) throw error;
      return data;
    }
    // MOCK: simula o path do storage
    if (file) url_arquivo = `mock://${colaboradorId}/${(file.originalname || 'arquivo')}`;
    const novo = { id: uid(), colaborador_id: colaboradorId, tipo_doc, data_vencimento: data_vencimento || null, url_arquivo };
    mock.documentos.push(novo);
    return novo;
  },
  // URL assinada temporária para visualizar um documento privado.
  async getDocumentoUrl(id) {
    if (USING_SUPABASE) {
      const { data: doc, error } = await sb('documentos_dp').select('url_arquivo').eq('id', id).single();
      if (error) throw error;
      if (!doc || !doc.url_arquivo) return null;
      const { data: signed, error: sErr } = await supabase.storage.from(BUCKET).createSignedUrl(doc.url_arquivo, 60 * 10);
      if (sErr) throw sErr;
      return signed.signedUrl;
    }
    const doc = mock.documentos.find(d => d.id === id);
    return doc ? doc.url_arquivo : null;
  },
  async createColaborador(c) {
    if (USING_SUPABASE) { return insertSafe('colaboradores', c); }
    const novo = { id: uid(), status: 'admissao', meta_m2: 0, feito_m2: 0, saldo_ferias_dias: 0, ...c };
    mock.colaboradores.push(novo); return novo;
  },
  async updateColaborador(id, patch) {
    if (USING_SUPABASE) { return updateSafeById('colaboradores', id, patch); }
    const c = mock.colaboradores.find(x => x.id === id); if (!c) return null; Object.assign(c, patch); return c;
  },
  async uploadFotoColaborador(id, file) {
    if (!USING_SUPABASE) return { foto_url: `mock://foto/${id}` };
    const ext = (file.originalname || 'foto').split('.').pop().replace(/[^\w]/g, '') || 'jpg';
    const path = `fotos/${id}/${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, file.buffer, { contentType: file.mimetype, upsert: true });
    if (upErr) throw upErr;
    const { data: signed } = await supabase.storage.from(BUCKET).createSignedUrl(path, 60 * 60 * 24 * 365 * 5);
    const foto_url = signed?.signedUrl || path;
    await sb('colaboradores').update({ foto_url }).eq('id', id);
    return { foto_url };
  },
  async moverColaborador(id, status) {
    if (USING_SUPABASE) { const { data, error } = await sb('colaboradores').update({ status }).eq('id', id).select().single(); if (error) throw error; return data; }
    const c = mock.colaboradores.find(x => x.id === id); if (!c) return null; c.status = status; return c;
  },
  // Exclui o colaborador e os vínculos operacionais dele (cronograma, VT, docs, vales, descontos, apontamentos…)
  async deleteColaborador(id) {
    if (!USING_SUPABASE) { mock.colaboradores = (mock.colaboradores || []).filter(c => c.id !== id); return { ok: true }; }
    const deps = ['cronograma_alocacoes', 'vt_semanal', 'documentos_colaborador', 'registro_diario_vt',
      'vales_diaria', 'descontos_folha', 'apontamento_equipe', 'recibos', 'folha_pagamento',
      'historico_funcional', 'ponto_frequencia', 'vacinas_colaborador'];
    for (const t of deps) { try { await sb(t).delete().eq('colaborador_id', id); } catch (_) { /* tabela sem a coluna: ignora */ } }
    const { error } = await sb('colaboradores').delete().eq('id', id);
    if (error) throw error;
    return { ok: true };
  },
  // ---- PERFIS / ROLES ----
  async getProfile(userId) {
    if (USING_SUPABASE) {
      const { data, error } = await sb('profiles').select('id,nome,email,role,avatar_url').eq('id', userId).single();
      if (error) return null;
      return data;
    }
    return { id: 'dev', nome: 'Dev', email: 'dev@local', role: 'ADMIN', avatar_url: null };
  },
  async updateProfile(userId, patch) {
    if (USING_SUPABASE) {
      const { data, error } = await sb('profiles').update(patch).eq('id', userId).select('id,nome,email,role,avatar_url').single();
      if (error) throw error;
      return data;
    }
    return { id: userId, nome: patch.nome || 'Dev', email: 'dev@local', role: 'ADMIN', avatar_url: patch.avatar_url || null };
  },
  async uploadAvatar(userId, file) {
    if (!USING_SUPABASE) return { avatar_url: `mock://avatars/${userId}` };
    const ext = (file.originalname || 'foto').split('.').pop().replace(/[^\w]/g, '') || 'jpg';
    const path = `${userId}/${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from('avatars')
      .upload(path, file.buffer, { contentType: file.mimetype, upsert: true });
    if (upErr) throw upErr;
    const { data } = supabase.storage.from('avatars').getPublicUrl(path);
    const avatar_url = data.publicUrl;
    await sb('profiles').update({ avatar_url }).eq('id', userId);
    return { avatar_url };
  },

  // ---- DOCUMENTOS (padrão Inmeta) ----
  async getDocsColaborador(id) {
    if (!USING_SUPABASE) return CATALOGO_DOCS.map(c => ({ ...c, presente: false, status_analise: 'NAO_VALIDADO' }));
    const { data } = await sb('documentos_colaborador').select('*').eq('colaborador_id', id);
    const porCodigo = Object.fromEntries((data || []).map(d => [d.codigo, d]));
    return CATALOGO_DOCS.map(cat => {
      const d = porCodigo[cat.codigo];
      if (!d) return { ...cat, presente: false, versao: null, status_analise: 'NAO_VALIDADO', arquivo_url: null, data_vencimento: null, atualizado_em: null, venc: { status: 'PENDENTE' } };
      return { ...cat, presente: true, id: d.id, versao: d.versao, data_emissao: d.data_emissao, tem_vencimento: d.tem_vencimento, data_vencimento: d.data_vencimento, status_analise: d.status_analise, arquivo_url: d.arquivo_url, anexos: d.anexos || [], atualizado_em: d.atualizado_em, venc: d.tem_vencimento && d.data_vencimento ? sstStatus(d.data_vencimento) : { status: 'SEM_VENCIMENTO' } };
    });
  },
  _pastaStatus(docs) {
    // Farol GD4: BLOQUEADO (vencido/reprovado/sem docs) · A_VENCER (≤30d) · OK
    let bloqueio = 0, prestes = 0, presentes = 0, pendencias = 0, prox = null;
    for (const d of docs) {
      if (!d.presente) { pendencias++; continue; }
      presentes++;
      if (d.status_analise === 'REPROVADO' || (d.venc && d.venc.status === 'VENCIDO')) bloqueio++;
      else if (d.venc && d.venc.status === 'PRESTES_A_VENCER') prestes++;
      if (d.data_vencimento && (!prox || d.data_vencimento < prox)) prox = d.data_vencimento;
    }
    const status = (!presentes || bloqueio) ? 'BLOQUEADO' : prestes ? 'A_VENCER' : 'OK';
    return { status, bloqueios: bloqueio, prestes, pendencias, vencimento_geral: prox };
  },
  async listColaboradoresDocs(filtros = {}) {
    if (!USING_SUPABASE) return [];
    let q = sb('colaboradores').select('*');
    if (filtros.empresa && filtros.empresa !== 'TODAS') q = q.eq('empresa', filtros.empresa);
    if (filtros.status_colaborador) q = q.eq('status_colaborador', filtros.status_colaborador);
    const { data: colabs } = await q;
    const { data: docs } = await sb('documentos_colaborador').select('*');
    const porColab = {};
    for (const d of (docs || [])) (porColab[d.colaborador_id] ||= []).push(d);
    const out = (colabs || []).map(c => {
      const catMerged = CATALOGO_DOCS.map(cat => {
        const d = (porColab[c.id] || []).find(x => x.codigo === cat.codigo);
        return d ? { ...cat, presente: true, status_analise: d.status_analise, data_vencimento: d.data_vencimento, venc: d.tem_vencimento && d.data_vencimento ? sstStatus(d.data_vencimento) : { status: 'SEM_VENCIMENTO' }, versao: d.versao } : { ...cat, presente: false, venc: { status: 'PENDENTE' }, versao: null };
      });
      const pasta = this._pastaStatus(catMerged);
      const versaoMax = Math.max(0, ...catMerged.filter(x => x.versao).map(x => x.versao));
      return { id: c.id, nome: c.nome, cpf: c.cpf, cargo: c.cargo, empresa: c.empresa, status: c.status, status_colaborador: c.status_colaborador || 'ATIVO', is_diarista: c.is_diarista || false, obras_vinculadas: c.obras_vinculadas || [], data_admissao: c.data_admissao || null, data_nascimento: c.data_nascimento || null, foto_url: c.foto_url || null, pasta, versao_atual: versaoMax || null };
    });
    let filtered = out;
    if (filtros.pendencias) filtered = filtered.filter(c => c.pasta.status === 'PENDENTE');
    if (filtros.q) { const s = filtros.q.toLowerCase(); filtered = filtered.filter(c => (c.nome || '').toLowerCase().includes(s) || (c.cpf || '').includes(s)); }
    return filtered;
  },
  async resumoColaboradorDocs(id) {
    if (!USING_SUPABASE) return null;
    const { data: c } = await sb('colaboradores').select('*').eq('id', id).single();
    if (!c) return null;
    const docs = await this.getDocsColaborador(id);
    const farol = this._pastaStatus(docs);
    return {
      colaborador: c,
      farol,
      contadores: {
        documentos: docs.filter(d => d.presente).length,
        documentos_total: docs.length,
        treinamentos: 0, treinamentos_expirados: 0, certificacoes: 0, ferias: 0, licencas: 0,
      },
    };
  },
  async upsertDocColaborador(colaboradorId, doc) {
    if (!USING_SUPABASE) return { id: uid(), ...doc };
    const { data: existente } = await sb('documentos_colaborador').select('versao').eq('colaborador_id', colaboradorId).eq('codigo', doc.codigo).maybeSingle();
    const versao = existente ? (existente.versao + 1) : 1;
    const row = {
      colaborador_id: colaboradorId, codigo: doc.codigo, versao,
      data_emissao: doc.data_emissao || null, tem_vencimento: !!doc.tem_vencimento,
      data_vencimento: doc.tem_vencimento ? (doc.data_vencimento || null) : null,
      arquivo_url: doc.arquivo_url || null, anexos: doc.anexos || [], status_analise: 'NAO_VALIDADO', atualizado_em: new Date().toISOString(),
    };
    let o = { ...row };
    for (let i = 0; i < 3; i++) {
      const { data, error } = await sb('documentos_colaborador').upsert(o, { onConflict: 'colaborador_id,codigo' }).select().single();
      if (!error) return data;
      const col = _missingCol(error);
      if (col && col in o) { delete o[col]; continue; }  // ex.: coluna anexos ainda não migrada
      throw error;
    }
    throw new Error('upsertDocColaborador: colunas faltando');
  },
  async setStatusDoc(docId, status) {
    if (!USING_SUPABASE) return { id: docId, status_analise: status };
    const { data, error } = await sb('documentos_colaborador').update({ status_analise: status }).eq('id', docId).select().single();
    if (error) throw error;
    return data;
  },

  // ---- DASHBOARD FINANCEIRO ----
  async dashboardFinanceiro(empresa, periodo) {
    if (!USING_SUPABASE) return null;
    // período → intervalo de datas (aplica-se às movimentações datadas)
    const hoje = new Date(); const y = hoje.getFullYear(), m = hoje.getMonth();
    let d0, d1;
    if (periodo === 'anterior') { d0 = new Date(y, m - 1, 1); d1 = new Date(y, m, 0); }
    else if (periodo === 'trimestre') { d0 = new Date(y, m - 2, 1); d1 = new Date(y, m + 1, 0); }
    else if (periodo === 'ano') { d0 = new Date(y, 0, 1); d1 = new Date(y, 11, 31); }
    else { d0 = new Date(y, m, 1); d1 = new Date(y, m + 1, 0); } // mês atual
    const iso = dt => dt.toISOString().slice(0, 10);

    let obrasQ = sb('obras_financeiro').select('valor_contrato,custo_insumos,custo_mao_obra,tipo_piso,empresa_responsavel');
    if (empresa && empresa !== 'TODAS') obrasQ = obrasQ.eq('empresa_responsavel', empresa);
    const [{ data: obras }, { data: contas }, { data: movs }] = await Promise.all([
      obrasQ,
      sb('contas_bancarias').select('saldo_atual'),
      sb('movimentacoes_caixa').select('categoria,tipo,valor,data_movimento').gte('data_movimento', iso(d0)).lte('data_movimento', iso(d1)),
    ]);

    const faturamento = (obras || []).reduce((s, o) => s + (o.valor_contrato || 0), 0);
    const maoObraObra = (obras || []).reduce((s, o) => s + (o.custo_mao_obra || 0), 0);
    const insumosObra = (obras || []).reduce((s, o) => s + (o.custo_insumos || 0), 0);

    // movimentações de saída por categoria (dentro do período)
    const saidaPor = {};
    for (const mv of (movs || [])) if (mv.tipo === 'SAIDA') saidaPor[mv.categoria] = (saidaPor[mv.categoria] || 0) + mv.valor;

    const custos_categoria = [
      { nome: 'Mão de Obra (diárias, vales, salários)', valor: maoObraObra + (saidaPor.FOLHA_DP || 0) + (saidaPor.VALE_CAMPO || 0), orcamento: 8000000 },
      { nome: 'Insumos & Materiais', valor: insumosObra + (saidaPor.COMPRA_INSUMOS || 0), orcamento: 5000000 },
      { nome: 'Logística & Combustível', valor: (saidaPor.COMBUSTIVEL_LOGISTICA || 0), orcamento: 1500000 },
      { nome: 'Manutenção de Maquinário', valor: (saidaPor.MANUTENCAO || 0), orcamento: 1000000 },
      { nome: 'Custos Administrativos', valor: (saidaPor.IMPOSTOS || 0) + (saidaPor.OUTROS || 0), orcamento: 2000000 },
    ].map(c => ({ ...c, pct_orcamento: c.orcamento ? Math.round((c.valor / c.orcamento) * 1000) / 10 : 0, estouro: c.valor > c.orcamento }));

    const custos_totais = custos_categoria.reduce((s, c) => s + c.valor, 0);
    const saldo_caixa = (contas || []).reduce((s, c) => s + c.saldo_atual, 0);
    const lucro = faturamento - custos_totais;
    const margem = faturamento ? Math.round((lucro / faturamento) * 1000) / 10 : 0;

    // receitas por tipo de serviço (agrupa obras por tipo_piso)
    const recPor = {};
    for (const o of (obras || [])) { const k = o.tipo_piso || 'Outros'; recPor[k] = (recPor[k] || 0) + (o.valor_contrato || 0); }
    const receitas_servico = Object.entries(recPor).map(([nome, valor]) => ({ nome, valor })).sort((a, b) => b.valor - a.valor);

    return {
      periodo, empresa: empresa || 'TODAS',
      cards: { faturamento, custos_totais, margem_pct: margem, saldo_caixa },
      custos_categoria: custos_categoria.filter(c => c.valor > 0 || c.orcamento > 0),
      receitas_servico,
    };
  },

  // ---- SST / PRONTUÁRIO / VACINAS / ANEXOS ----
  async getProntuario(id) {
    if (!USING_SUPABASE) return null;
    const [{ data: c }, { data: sst }, { data: vac }, { data: anexos }, { data: docs }] = await Promise.all([
      sb('colaboradores').select('*').eq('id', id).single(),
      sb('documentos_sst').select('*').eq('colaborador_id', id).order('data_vencimento', { ascending: true }),
      sb('vacinas_colaborador').select('*').eq('colaborador_id', id).order('data_aplicacao', { ascending: false }),
      sb('documentos_anexo').select('*').eq('colaborador_id', id).order('uploaded_at', { ascending: false }),
      sb('documentos_dp').select('*').eq('colaborador_id', id),
    ]);
    if (!c) return null;
    return {
      colaborador: c,
      empresa: c.empresa,
      sst: (sst || []).map(d => ({ ...d, status: sstStatus(d.data_vencimento) })),
      vacinas: vac || [],
      anexos: anexos || [],
      documentos_dp: (docs || []).map(d => ({ ...d, status: docStatus(d.data_vencimento) })),
    };
  },
  async addSST(colaboradorId, s) {
    if (!USING_SUPABASE) return { id: uid(), ...s };
    const { data, error } = await sb('documentos_sst').insert({
      colaborador_id: colaboradorId, tipo_documento: s.tipo_documento,
      data_elaboracao: s.data_elaboracao || null, data_vencimento: s.data_vencimento || null,
      arquivo_pdf_url: s.arquivo_pdf_url || null, observacoes: s.observacoes || null,
    }).select().single();
    if (error) throw error;
    return { ...data, status: sstStatus(data.data_vencimento) };
  },
  async addVacina(colaboradorId, v) {
    if (!USING_SUPABASE) return { id: uid(), ...v };
    const { data, error } = await sb('vacinas_colaborador').insert({
      colaborador_id: colaboradorId, tipo_vacina: v.tipo_vacina,
      data_aplicacao: v.data_aplicacao || null, data_vencimento_dose: v.data_vencimento_dose || null,
      comprovante_pdf_url: v.comprovante_pdf_url || null,
    }).select().single();
    if (error) throw error;
    return data;
  },
  async addAnexo(colaboradorId, { nome_documento, file }) {
    if (!USING_SUPABASE) return { id: uid(), nome_documento };
    let arquivo_url = null, mime_type = 'application/pdf';
    if (file) {
      const safe = (file.originalname || 'anexo').replace(/[^\w.\-]+/g, '_');
      const path = `anexos/${colaboradorId}/${Date.now()}_${safe}`;
      const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, file.buffer, { contentType: file.mimetype });
      if (upErr) throw upErr;
      const { data: signed } = await supabase.storage.from(BUCKET).createSignedUrl(path, 60 * 60 * 24 * 365);
      arquivo_url = signed?.signedUrl || path; mime_type = file.mimetype;
    }
    const { data, error } = await sb('documentos_anexo').insert({ colaborador_id: colaboradorId, nome_documento, arquivo_url, mime_type }).select().single();
    if (error) throw error;
    return data;
  },
  async alertasSST(dias = 30) {
    if (!USING_SUPABASE) return { vencidos: [], prestes: [] };
    const { data: sst } = await sb('documentos_sst').select('*, colaboradores(nome,empresa)').not('data_vencimento', 'is', null);
    const vencidos = [], prestes = [];
    for (const d of (sst || [])) {
      const s = sstStatus(d.data_vencimento);
      const item = { id: d.id, colaborador: d.colaboradores?.nome, empresa: d.colaboradores?.empresa, tipo_documento: d.tipo_documento, data_vencimento: d.data_vencimento, dias: s.dias };
      if (s.status === 'VENCIDO') vencidos.push(item);
      else if (s.status === 'PRESTES_A_VENCER' && s.dias <= dias) prestes.push(item);
    }
    vencidos.sort((a, b) => a.dias - b.dias); prestes.sort((a, b) => a.dias - b.dias);
    return { vencidos, prestes };
  },
  // valida se um colaborador pode ser alocado numa obra (mesma empresa)
  async validarAlocacao(colaboradorIds, obraId) {
    if (!USING_SUPABASE) return { ok: true };
    const { data: obra, error: oErr } = await sb('obras_financeiro').select('*').eq('id', obraId).single();
    if (oErr || !obra) return { ok: false, erro: 'obra não encontrada' };
    const { data: cs } = await sb('colaboradores').select('id,nome,empresa').in('id', colaboradorIds);
    for (const c of (cs || [])) {
      if (c.empresa && obra.empresa_responsavel && c.empresa !== obra.empresa_responsavel) {
        return { ok: false, erro: `Colaborador ${c.nome} (${c.empresa}) não pode ser alocado nesta obra (${obra.empresa_responsavel}).` };
      }
    }
    // bloqueio por NR de segurança vencida (NR35 trabalho em altura, NR12 máquinas)
    const { data: nrs } = await sb('documentos_sst').select('colaborador_id,tipo_documento,data_vencimento')
      .in('colaborador_id', colaboradorIds).in('tipo_documento', ['NR35', 'NR12']);
    const nomeDe = Object.fromEntries((cs || []).map(c => [c.id, c.nome]));
    for (const d of (nrs || [])) {
      if (sstStatus(d.data_vencimento).status === 'VENCIDO') {
        return { ok: false, erro: `Alocação bloqueada: ${nomeDe[d.colaborador_id] || 'colaborador'} está com ${d.tipo_documento} VENCIDA. Regularize a documentação de segurança.` };
      }
    }
    return { ok: true };
  },

  // ---- ORÇAMENTOS & MEDIÇÕES ----
  async listOrcamentos() {
    if (USING_SUPABASE) {
      const { data, error } = await sb('orcamentos').select('*').order('numero_orcamento', { ascending: false });
      if (error) throw error;
      return data;
    }
    return [...mock.orcamentos].sort((a, b) => b.numero_orcamento - a.numero_orcamento);
  },
  async getOrcamento(id) {
    if (USING_SUPABASE) {
      const { data, error } = await sb('orcamentos').select('*').eq('id', id).single();
      if (error) throw error;
      return data;
    }
    return mock.orcamentos.find(o => o.id === id) || null;
  },
  async createOrcamento(o) {
    if (USING_SUPABASE) {
      const { data, error } = await sb('orcamentos').insert(o).select().single();
      if (error) throw error;
      return data;
    }
    const novo = {
      id: uid(), numero_orcamento: ++mock._orcSeq,
      data_orcamento: o.data_orcamento || new Date().toISOString().slice(0, 10),
      status: 'PENDENTE_MEDICAO', itens: [], valor_total: 0,
      criado_em: new Date().toISOString(), ...o,
    };
    mock.orcamentos.push(novo);
    return novo;
  },
  async updateOrcamento(id, patch) {
    if (USING_SUPABASE) {
      const { data, error } = await sb('orcamentos').update(patch).eq('id', id).select().single();
      if (error) throw error;
      return data;
    }
    const o = mock.orcamentos.find(x => x.id === id);
    if (!o) return null;
    Object.assign(o, patch);
    return o;
  },
  async deleteOrcamento(id) {
    if (USING_SUPABASE) { const { error } = await sb('orcamentos').delete().eq('id', id); if (error) throw error; return { ok: true }; }
    mock.orcamentos = (mock.orcamentos || []).filter(o => o.id !== id); return { ok: true };
  },

  // ---- NOTAS FISCAIS (arquivo PDF: empresa > tipo > ano) ----
  async listNotas({ empresa, tipo, ano } = {}) {
    if (USING_SUPABASE) {
      let q = sb('notas_fiscais').select('*').order('criado_em', { ascending: false });
      if (empresa) q = q.eq('empresa', empresa);
      if (tipo) q = q.eq('tipo', tipo);
      if (ano) q = q.eq('ano', Number(ano));
      const { data, error } = await q;
      if (error) throw error;
      return data || [];
    }
    return mock.notasFiscais
      .filter(n => (!empresa || n.empresa === empresa) && (!tipo || n.tipo === tipo) && (!ano || n.ano === Number(ano)))
      .sort((a, b) => (b.criado_em || '').localeCompare(a.criado_em || ''));
  },
  async createNota(n) {
    if (USING_SUPABASE) {
      const { data, error } = await sb('notas_fiscais').insert(n).select().single();
      if (error) throw error;
      return data;
    }
    const novo = { id: uid(), criado_em: new Date().toISOString(), ...n };
    mock.notasFiscais.push(novo);
    return novo;
  },
  async deleteNota(id) {
    if (USING_SUPABASE) {
      const { error } = await sb('notas_fiscais').delete().eq('id', id);
      if (error) throw error;
      return { ok: true };
    }
    mock.notasFiscais = mock.notasFiscais.filter(n => n.id !== id);
    return { ok: true };
  },

  // ---- DOCUMENTOS EMPRESARIAIS (empresa RB/ECO > pasta > PDFs) ----
  async listDocsEmpresa({ empresa, pasta } = {}) {
    if (USING_SUPABASE) {
      let q = sb('documentos_empresa').select('*').order('criado_em', { ascending: false });
      if (empresa) q = q.eq('empresa', empresa);
      if (pasta) q = q.eq('pasta', pasta);
      const { data, error } = await q;
      if (error) throw error;
      return data || [];
    }
    return mock.docsEmpresa
      .filter(d => (!empresa || d.empresa === empresa) && (!pasta || d.pasta === pasta))
      .sort((a, b) => (b.criado_em || '').localeCompare(a.criado_em || ''));
  },
  async createDocEmpresa(d) {
    if (USING_SUPABASE) {
      const { data, error } = await sb('documentos_empresa').insert(d).select().single();
      if (error) throw error;
      return data;
    }
    const novo = { id: uid(), criado_em: new Date().toISOString(), ...d };
    mock.docsEmpresa.push(novo);
    return novo;
  },
  async deleteDocEmpresa(id) {
    if (USING_SUPABASE) {
      const { error } = await sb('documentos_empresa').delete().eq('id', id);
      if (error) throw error;
      return { ok: true };
    }
    mock.docsEmpresa = mock.docsEmpresa.filter(d => d.id !== id);
    return { ok: true };
  },

  // ---- LEADS (comercial) ----
  async listLeads({ origem, status } = {}) {
    if (USING_SUPABASE) {
      let q = sb('leads').select('*').order('criado_em', { ascending: false });
      if (origem) q = q.eq('origem', origem);
      if (status) q = q.eq('status', status);
      const { data, error } = await q;
      if (error) throw error;
      return data || [];
    }
    return mock.leads
      .filter(l => (!origem || l.origem === origem) && (!status || l.status === status))
      .sort((a, b) => (b.criado_em || '').localeCompare(a.criado_em || ''));
  },
  async createLead(l) {
    if (USING_SUPABASE) {
      const { data, error } = await sb('leads').insert(l).select().single();
      if (error) throw error;
      return data;
    }
    const novo = { id: uid(), status: 'MARCAR_VISITA', situacao_pagamento: 'PENDENTE', criado_em: new Date().toISOString(), ...l };
    mock.leads.push(novo);
    return novo;
  },
  async updateLead(id, patch) {
    if (USING_SUPABASE) {
      const { data, error } = await sb('leads').update(patch).eq('id', id).select().single();
      if (error) throw error;
      return data;
    }
    const l = mock.leads.find(x => x.id === id);
    if (!l) return null;
    Object.assign(l, patch);
    return l;
  },
  async deleteLead(id) {
    if (USING_SUPABASE) {
      const { error } = await sb('leads').delete().eq('id', id);
      if (error) throw error;
      return { ok: true };
    }
    mock.leads = mock.leads.filter(l => l.id !== id);
    return { ok: true };
  },

  // ---- CLIENTES ----
  async listClientes({ q } = {}) {
    let lista;
    if (USING_SUPABASE) {
      const { data, error } = await sb('clientes').select('*').order('criado_em', { ascending: false });
      if (error) throw error;
      lista = data || [];
    } else {
      lista = [...mock.clientes].sort((a, b) => (b.criado_em || '').localeCompare(a.criado_em || ''));
    }
    if (q) { const s = q.toLowerCase(); lista = lista.filter(c => (c.nome || '').toLowerCase().includes(s) || (c.telefone || '').includes(s)); }
    return lista;
  },
  async createCliente(c) {
    if (USING_SUPABASE) {
      const { data, error } = await sb('clientes').insert(c).select().single();
      if (error) throw error;
      return data;
    }
    const novo = { id: uid(), criado_em: new Date().toISOString(), ...c };
    mock.clientes.push(novo);
    return novo;
  },
  async updateCliente(id, patch) {
    if (USING_SUPABASE) {
      const { data, error } = await sb('clientes').update(patch).eq('id', id).select().single();
      if (error) throw error;
      return data;
    }
    const c = mock.clientes.find(x => x.id === id);
    if (!c) return null;
    Object.assign(c, patch);
    return c;
  },
  async deleteCliente(id) {
    if (USING_SUPABASE) {
      const { error } = await sb('clientes').delete().eq('id', id);
      if (error) throw error;
      return { ok: true };
    }
    mock.clientes = mock.clientes.filter(c => c.id !== id);
    return { ok: true };
  },

  // ---- GEFIP (Ano > Mês > Obra > PDFs; pastas dinâmicas) ----
  // Pasta: obra=null representa uma pasta de MÊS; obra preenchida = pasta de OBRA dentro do mês.
  async listGefipPastas({ ano, mes } = {}) {
    if (USING_SUPABASE) {
      let q = sb('gefip_pastas').select('*').order('mes').order('obra');
      if (ano) q = q.eq('ano', Number(ano));
      if (mes === null) q = q.is('obra', null);
      if (mes) q = q.eq('mes', mes);
      const { data, error } = await q;
      if (error) throw error;
      return data || [];
    }
    return mock.gefipPastas.filter(p =>
      (!ano || p.ano === Number(ano)) &&
      (mes === undefined ? true : (mes === null ? !p.obra : p.mes === mes)));
  },
  async createGefipPasta(p) {
    if (USING_SUPABASE) {
      const { data, error } = await sb('gefip_pastas').insert(p).select().single();
      if (error) throw error;
      return data;
    }
    const novo = { id: uid(), criado_em: new Date().toISOString(), obra: null, ...p };
    mock.gefipPastas.push(novo);
    return novo;
  },
  async deleteGefipPasta(id) {
    if (USING_SUPABASE) {
      const { error } = await sb('gefip_pastas').delete().eq('id', id);
      if (error) throw error;
      return { ok: true };
    }
    mock.gefipPastas = mock.gefipPastas.filter(p => p.id !== id);
    return { ok: true };
  },
  async listGefipDocs({ ano, mes, obra, geral } = {}) {
    if (USING_SUPABASE) {
      let q = sb('gefip_docs').select('*').order('criado_em', { ascending: false });
      if (ano) q = q.eq('ano', Number(ano));
      if (mes) q = q.eq('mes', mes);
      if (geral) q = q.is('obra', null);       // docs gerais do mês (sem obra)
      else if (obra) q = q.eq('obra', obra);
      const { data, error } = await q;
      if (error) throw error;
      return data || [];
    }
    return mock.gefipDocs
      .filter(d => (!ano || d.ano === Number(ano)) && (!mes || d.mes === mes) && (geral ? !d.obra : (!obra || d.obra === obra)))
      .sort((a, b) => (b.criado_em || '').localeCompare(a.criado_em || ''));
  },
  async getGefipDoc(id) {
    if (USING_SUPABASE) {
      const { data } = await sb('gefip_docs').select('*').eq('id', id).maybeSingle();
      return data || null;
    }
    return mock.gefipDocs.find(d => d.id === id) || null;
  },
  async createGefipDoc(d) {
    if (USING_SUPABASE) {
      const { data, error } = await sb('gefip_docs').insert(d).select().single();
      if (error) throw error;
      return data;
    }
    const novo = { id: uid(), criado_em: new Date().toISOString(), ...d };
    mock.gefipDocs.push(novo);
    return novo;
  },
  async deleteGefipDoc(id) {
    if (USING_SUPABASE) {
      const { error } = await sb('gefip_docs').delete().eq('id', id);
      if (error) throw error;
      return { ok: true };
    }
    mock.gefipDocs = mock.gefipDocs.filter(d => d.id !== id);
    return { ok: true };
  },

  // ---- BOLETOS ----
  async listBoletos({ status, mes } = {}) {
    if (USING_SUPABASE) {
      let q = sb('boletos').select('*').order('vencimento');
      if (status === 'PENDENTE') q = q.eq('pago', false);
      if (status === 'PAGO') q = q.eq('pago', true);
      if (mes) {
        const [y, m] = mes.split('-').map(Number);
        const prox = m >= 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, '0')}`;   // 1º dia do mês seguinte (evita data inválida tipo -31)
        q = q.gte('vencimento', mes + '-01').lt('vencimento', prox + '-01');
      }
      const { data, error } = await q;
      if (error) throw error;
      return data || [];
    }
    return mock.boletos
      .filter(b => (!status || (status === 'PENDENTE' ? !b.pago : b.pago)) && (!mes || (b.vencimento || '').startsWith(mes)))
      .sort((a, b) => (a.vencimento || '').localeCompare(b.vencimento || ''));
  },
  async createBoleto(b) {
    if (USING_SUPABASE) { return insertSafe('boletos', b); }
    const novo = { id: uid(), pago: false, criado_em: new Date().toISOString(), ...b };
    mock.boletos.push(novo);
    return novo;
  },
  async updateBoleto(id, patch) {
    if (USING_SUPABASE) {
      const { data, error } = await sb('boletos').update(patch).eq('id', id).select().single();
      if (error) throw error;
      return data;
    }
    const b = mock.boletos.find(x => x.id === id);
    if (!b) return null;
    Object.assign(b, patch);
    return b;
  },
  async deleteBoleto(id) {
    if (USING_SUPABASE) {
      const { error } = await sb('boletos').delete().eq('id', id);
      if (error) throw error;
      return { ok: true };
    }
    mock.boletos = mock.boletos.filter(b => b.id !== id);
    return { ok: true };
  },
  // ---- PAGAMENTOS FIXOS MENSAIS ----
  async listFixos() {
    if (!USING_SUPABASE) return [];
    const { data } = await sb('pagamentos_fixos').select('*').order('descricao');
    return data || [];
  },
  async createFixo(f) {
    if (!USING_SUPABASE) return { id: uid(), ...f };
    return insertSafe('pagamentos_fixos', f);
  },
  async updateFixo(id, patch) {
    if (!USING_SUPABASE) return { id, ...patch };
    const { data, error } = await sb('pagamentos_fixos').update(patch).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },
  async deleteFixo(id) {
    if (USING_SUPABASE) { const { error } = await sb('pagamentos_fixos').delete().eq('id', id); if (error) throw error; }
    return { ok: true };
  },
  // Materializa os fixos ativos como boletos da competência (YYYY-MM), sem duplicar.
  async gerarFixosDoMes(competencia) {
    if (!USING_SUPABASE) return { gerados: 0 };
    const { data: fixos } = await sb('pagamentos_fixos').select('*').eq('ativo', true);
    if (!fixos || !fixos.length) return { gerados: 0 };
    const { data: ja } = await sb('boletos').select('fixo_id').eq('competencia', competencia).not('fixo_id', 'is', null);
    const feitos = new Set((ja || []).map(b => b.fixo_id));
    const [y, m] = competencia.split('-').map(Number);
    const ultimoDia = new Date(y, m, 0).getDate();   // último dia do mês da competência
    const novos = [];
    for (const f of fixos) {
      if (feitos.has(f.id)) continue;
      const dia = Math.min(Math.max(1, f.dia_vencimento || 5), ultimoDia);
      novos.push({
        descricao: f.descricao, fornecedor: f.fornecedor || null, valor: f.valor,
        categoria: f.categoria || 'OUTRO', categoria_custom: f.categoria_custom || null,
        vencimento: competencia + '-' + String(dia).padStart(2, '0'),
        pago: false, fixo_id: f.id, competencia,
      });
    }
    if (novos.length) { const { error } = await sb('boletos').insert(novos); if (error) throw error; }
    return { gerados: novos.length };
  },
  // Transforma um boleto já lançado em pagamento fixo mensal (sem relançar o mês atual).
  async fixarBoleto(boletoId) {
    if (!USING_SUPABASE) return { ja: false };
    const { data: b } = await sb('boletos').select('*').eq('id', boletoId).maybeSingle();
    if (!b) { const e = new Error('boleto não encontrado'); e.status = 404; throw e; }
    if (b.fixo_id) return { ja: true, fixo_id: b.fixo_id };
    const dia = Math.min(Math.max(1, Number((b.vencimento || '').slice(8, 10)) || 5), 31);
    const fixo = await this.createFixo({
      descricao: b.descricao, fornecedor: b.fornecedor || null,
      categoria: b.categoria || 'OUTRO', categoria_custom: b.categoria_custom || null,
      valor: b.valor, dia_vencimento: dia, ativo: true,
    });
    // vincula este boleto ao fixo e marca a competência para não duplicar no mês atual
    const comp = (b.vencimento || '').slice(0, 7);
    await sb('boletos').update({ fixo_id: fixo.id, competencia: comp || null }).eq('id', boletoId);
    return { ja: false, fixo };
  },

  // ---- LANÇAMENTOS DIÁRIOS (gastos do dia: pix, vale, dinheiro…) ----
  async listLancDiarios({ data } = {}) {
    if (USING_SUPABASE) {
      let q = sb('lancamentos_diarios').select('*').order('criado_em', { ascending: false });
      if (data) q = q.eq('data', data);
      const { data: rows, error } = await q;
      if (error) throw error;
      return rows || [];
    }
    return mock.lancDiarios.filter(l => !data || l.data === data);
  },
  async createLancDiario(l) {
    if (USING_SUPABASE) { return insertSafe('lancamentos_diarios', l); }   // tolerante: ignora categoria_custom se a coluna não existir
    const novo = { id: uid(), criado_em: new Date().toISOString(), ...l };
    mock.lancDiarios.push(novo);
    return novo;
  },
  async updateLancDiario(id, patch) {
    if (USING_SUPABASE) {
      const { data, error } = await sb('lancamentos_diarios').update(patch).eq('id', id).select().single();
      if (error) throw error;
      return data;
    }
    const l = mock.lancDiarios.find(x => x.id === id);
    if (!l) return null;
    Object.assign(l, patch);
    return l;
  },
  async deleteLancDiario(id) {
    if (USING_SUPABASE) {
      const { error } = await sb('lancamentos_diarios').delete().eq('id', id);
      if (error) throw error;
      return { ok: true };
    }
    mock.lancDiarios = mock.lancDiarios.filter(l => l.id !== id);
    return { ok: true };
  },
  // ---- CONFIG DO APP (chave/valor jsonb) ----
  async getConfig(chave) {
    if (USING_SUPABASE) {
      const { data, error } = await sb('config_app').select('valor').eq('chave', chave).maybeSingle();
      if (error) throw error;
      return data ? data.valor : null;
    }
    return mock.config[chave] || null;
  },
  async setConfig(chave, valor) {
    if (USING_SUPABASE) {
      const { data, error } = await sb('config_app').upsert({ chave, valor, atualizado_em: new Date().toISOString() }, { onConflict: 'chave' }).select().single();
      if (error) throw error;
      return data.valor;
    }
    mock.config[chave] = valor;
    return valor;
  },

  // ---- CATÁLOGO DE SERVIÇOS (descrição padrão + preço por unidade) ----
  async listServicos() {
    if (USING_SUPABASE) {
      const { data, error } = await sb('servicos_catalogo').select('*').order('nome');
      if (error) throw error;
      return data || [];
    }
    return [...mock.servicosCatalogo].sort((a, b) => (a.nome || '').localeCompare(b.nome || ''));
  },
  async createServico(s) {
    if (USING_SUPABASE) {
      const { data, error } = await sb('servicos_catalogo').insert(s).select().single();
      if (error) throw error;
      return data;
    }
    const novo = { id: uid(), criado_em: new Date().toISOString(), ...s };
    mock.servicosCatalogo.push(novo);
    return novo;
  },
  async updateServico(id, patch) {
    if (USING_SUPABASE) {
      const { data, error } = await sb('servicos_catalogo').update(patch).eq('id', id).select().single();
      if (error) throw error;
      return data;
    }
    const s = mock.servicosCatalogo.find(x => x.id === id);
    if (!s) return null; Object.assign(s, patch); return s;
  },
  async deleteServico(id) {
    if (USING_SUPABASE) { const { error } = await sb('servicos_catalogo').delete().eq('id', id); if (error) throw error; return { ok: true }; }
    mock.servicosCatalogo = mock.servicosCatalogo.filter(s => s.id !== id); return { ok: true };
  },

  // ---- CRONOGRAMA DIÁRIO: funções/diárias (editáveis) + alocações do dia ----
  async listFuncoes() {
    if (USING_SUPABASE) {
      const { data, error } = await sb('funcoes_diaria').select('*').order('nome');
      if (error) throw error;
      return data || [];
    }
    return [...mock.funcoesDiaria].sort((a, b) => (a.nome || '').localeCompare(b.nome || ''));
  },
  async createFuncao(f) {
    if (USING_SUPABASE) {
      const { data, error } = await sb('funcoes_diaria').insert(f).select().single();
      if (error) throw error;
      return data;
    }
    const novo = { id: uid(), criado_em: new Date().toISOString(), ...f };
    mock.funcoesDiaria.push(novo);
    return novo;
  },
  async updateFuncao(id, patch) {
    if (USING_SUPABASE) {
      const { data, error } = await sb('funcoes_diaria').update(patch).eq('id', id).select().single();
      if (error) throw error;
      return data;
    }
    const f = mock.funcoesDiaria.find(x => x.id === id);
    if (!f) return null; Object.assign(f, patch); return f;
  },
  async deleteFuncao(id) {
    if (USING_SUPABASE) { const { error } = await sb('funcoes_diaria').delete().eq('id', id); if (error) throw error; return { ok: true }; }
    mock.funcoesDiaria = mock.funcoesDiaria.filter(f => f.id !== id); return { ok: true };
  },
  async listAlocacoes({ data, colaborador_id, desde, ate } = {}) {
    if (USING_SUPABASE) {
      let q = sb('cronograma_alocacoes').select('*');
      if (data) q = q.eq('data', data);
      if (colaborador_id) q = q.eq('colaborador_id', colaborador_id);
      if (desde) q = q.gte('data', desde);
      if (ate) q = q.lte('data', ate);
      const { data: rows, error } = await q.order('data');
      if (error) throw error;
      return rows || [];
    }
    return mock.cronogramaAloc.filter(a =>
      (!data || a.data === data) && (!colaborador_id || a.colaborador_id === colaborador_id) &&
      (!desde || a.data >= desde) && (!ate || a.data <= ate));
  },
  async createAlocacao(a) {
    if (USING_SUPABASE) {
      const { data, error } = await sb('cronograma_alocacoes').insert(a).select().single();
      if (error) throw error;
      return data;
    }
    const novo = { id: uid(), criado_em: new Date().toISOString(), ...a };
    mock.cronogramaAloc.push(novo);
    return novo;
  },
  async updateAlocacao(id, patch) {
    if (USING_SUPABASE) {
      const { data, error } = await sb('cronograma_alocacoes').update(patch).eq('id', id).select().single();
      if (error) throw error;
      return data;
    }
    const a = mock.cronogramaAloc.find(x => x.id === id);
    if (!a) return null; Object.assign(a, patch); return a;
  },
  async deleteAlocacao(id) {
    if (USING_SUPABASE) { const { error } = await sb('cronograma_alocacoes').delete().eq('id', id); if (error) throw error; return { ok: true }; }
    mock.cronogramaAloc = mock.cronogramaAloc.filter(a => a.id !== id); return { ok: true };
  },

  // Gastos por categoria num intervalo [desde, ate] (boletos por vencimento + lançamentos por data)
  async gastosPorCategoria(desde, ate) {
    let boletos, lancs;
    if (USING_SUPABASE) {
      const [b, l] = await Promise.all([
        sb('boletos').select('categoria,valor').gte('vencimento', desde).lte('vencimento', ate),
        sb('lancamentos_diarios').select('categoria,valor').gte('data', desde).lte('data', ate),
      ]);
      boletos = b.data || []; lancs = l.data || [];
    } else {
      boletos = mock.boletos.filter(x => x.vencimento >= desde && x.vencimento <= ate);
      lancs = mock.lancDiarios.filter(x => x.data >= desde && x.data <= ate);
    }
    const acc = {};
    for (const x of [...boletos, ...lancs]) {
      const c = x.categoria || 'OUTRO';
      acc[c] = (acc[c] || 0) + (x.valor || 0);
    }
    const categorias = Object.entries(acc).map(([categoria, total]) => ({ categoria, total })).sort((a, b) => b.total - a.total);
    const total_geral = categorias.reduce((s, c) => s + c.total, 0);
    return { desde, ate, total_geral, categorias };
  },
  // Pagamento diário de uma data = boletos vencendo nesse dia + lançamentos manuais do dia
  async pagamentoDiario(data) {
    const [boletos, lancs, contas] = await Promise.all([
      // vence hoje OU está atrasado e ainda não pago (carrega pro dia até ser quitado)
      USING_SUPABASE
        ? sb('boletos').select('*').or(`vencimento.eq.${data},and(vencimento.lt.${data},pago.eq.false)`).then(r => r.data || [])
        : Promise.resolve(mock.boletos.filter(b => b.vencimento === data || (b.vencimento < data && !b.pago))),
      this.listLancDiarios({ data }),
      USING_SUPABASE ? sb('contas_bancarias').select('saldo_atual').then(r => r.data || []) : Promise.resolve([]),
    ]);
    const itens = [
      ...boletos.map(b => ({ ...b, origem: 'BOLETO', atrasado: (b.vencimento < data && !b.pago) })),
      ...lancs.map(l => ({ ...l, origem: 'LANCAMENTO' })),
    ];
    const total = itens.reduce((s, i) => s + (i.valor || 0), 0);
    const pago = itens.filter(i => i.pago).reduce((s, i) => s + (i.valor || 0), 0);
    const saldo_caixa = (contas || []).reduce((s, c) => s + (c.saldo_atual || 0), 0); // saldo consolidado das contas
    const saldo_final = saldo_caixa - pago;                                           // após o que já saiu hoje
    return { data, itens, resumo: { total, pago, pendente: total - pago, saldo_caixa, saldo_final } };
  },
  // Acha um cliente pelo nome (case-insensitive) ou cria a partir dos dados do lead
  async acharOuCriarCliente({ nome, telefone, endereco, origem, responsavel, observacao }) {
    const nomeTrim = (nome || '').trim();
    if (!nomeTrim) return null;
    if (USING_SUPABASE) {
      const { data } = await sb('clientes').select('*').ilike('nome', nomeTrim).limit(1);
      if (data && data.length) return data[0];
    } else {
      const achado = mock.clientes.find(c => (c.nome || '').toLowerCase() === nomeTrim.toLowerCase());
      if (achado) return achado;
    }
    return this.createCliente({ nome: nomeTrim, telefone: telefone || null, endereco: endereco || null, origem: origem || null, responsavel: responsavel || null, observacao: observacao || null });
  },
  // Converte um lead "fechado" em Cliente + Obra (uma vez). Retorna {cliente, obra}.
  async converterLead(lead) {
    const cliente = await this.acharOuCriarCliente({
      nome: lead.nome, telefone: lead.telefone, endereco: lead.endereco,
      origem: lead.origem, responsavel: lead.responsavel, observacao: lead.observacao,
    });
    const obra = await this.createObra({
      cliente: lead.nome, cliente_id: cliente ? cliente.id : null,
      endereco: lead.endereco || null, tipo_piso: lead.servico || null,
      data_inicio: lead.data_inicio || null, responsavel: lead.responsavel || null,
      origem_lead_id: lead.id || null, valor_contrato: 0, coluna_kanban: 'aprovado',
    });
    return { cliente, obra };
  },

  // ---- VALE-TRANSPORTE ----
  async listBalancoVT() {
    if (USING_SUPABASE) {
      const { data, error } = await sb('vw_balanco_semanal_vt').select('*').order('funcionario');
      if (error) throw error;
      return data;
    }
    // mock: espelha a lógica da view vw_balanco_semanal_vt
    return mock.colaboradores.map(c => {
      const regs = mock.registroVT.filter(r => r.colaborador_id === c.id);
      const total = regs.length ? regs.reduce((s, r) => s + (r.qtd_viagens ?? 2), 0) : 2;
      const forma = regs.length ? regs[regs.length - 1].forma_pagamento
        : (c.forma_pagamento_padrao || 'CARTEIRINHA');
      const obs = [...new Set(regs.map(r => r.observacao).filter(Boolean))].join(' | ') || null;
      return {
        colaborador_id: c.id, funcionario: c.nome,
        total_viagens: total, valor_passagem: VALOR_PASSAGEM,
        valor_total: +(total * VALOR_PASSAGEM).toFixed(2),
        forma_pagamento: forma, observacoes: obs,
      };
    });
  },
  // VT semanal (edição inline): lista pré-carregada de ativos + resumo dos 5 cards
  async getVTSemana(ano_mes, semana) {
    if (!USING_SUPABASE) return { linhas: [], resumo: {} };
    const [{ data: colabs }, { data: semRows }, { data: mesRows }] = await Promise.all([
      sb('colaboradores').select('id,nome,status_colaborador,carteirinha_vt').neq('status_colaborador', 'DESLIGADO').order('nome'),
      sb('vt_semanal').select('*').eq('ano_mes', ano_mes).eq('semana', semana),
      sb('vt_semanal').select('qtd_viagens,valor_passagem').eq('ano_mes', ano_mes),
    ]);
    const porColab = Object.fromEntries((semRows || []).map(r => [r.colaborador_id, r]));
    const linhas = (colabs || []).map(c => {
      const r = porColab[c.id];
      const qtd = r ? r.qtd_viagens : 0;
      const vp = r ? Number(r.valor_passagem) : 4.30;
      return {
        colaborador_id: c.id, nome: c.nome, carteirinha: c.carteirinha_vt || '',
        qtd_viagens: qtd, valor_passagem: vp, total: +(qtd * vp).toFixed(2),
        forma_pagamento: r ? r.forma_pagamento : 'CARTEIRINHA', observacao: r ? r.observacao : '',
      };
    });
    const soma = (f) => linhas.filter(f).reduce((s, l) => s + l.total, 0);
    const resumo = {
      total_semanal: +soma(() => true).toFixed(2),
      total_carteirinha: +soma(l => l.forma_pagamento === 'CARTEIRINHA').toFixed(2),
      total_conta: +soma(l => l.forma_pagamento === 'CONTA').toFixed(2),
      total_colaboradores: linhas.length,
      balanco_mensal: +(mesRows || []).reduce((s, r) => s + r.qtd_viagens * Number(r.valor_passagem), 0).toFixed(2),
    };
    return { linhas, resumo, ano_mes, semana };
  },
  async upsertVTSemana({ colaborador_id, ano_mes, semana, qtd_viagens, valor_passagem, forma_pagamento, observacao }) {
    if (!USING_SUPABASE) return { ok: true };
    const row = { colaborador_id, ano_mes, semana, atualizado_em: new Date().toISOString() };
    if (qtd_viagens !== undefined) row.qtd_viagens = Math.max(0, parseInt(qtd_viagens, 10) || 0);
    if (valor_passagem !== undefined) row.valor_passagem = Number(valor_passagem) || 4.30;
    if (forma_pagamento !== undefined) row.forma_pagamento = ['CARTEIRINHA', 'CONTA'].includes(forma_pagamento) ? forma_pagamento : 'CARTEIRINHA';
    if (observacao !== undefined) row.observacao = observacao;
    const { data, error } = await sb('vt_semanal').upsert(row, { onConflict: 'colaborador_id,ano_mes,semana' }).select().single();
    if (error) throw error;
    return data;
  },
  // Código da carteirinha de VT (fica no cadastro do colaborador)
  async setCarteirinhaVT(colaborador_id, carteirinha) {
    if (!USING_SUPABASE) return { ok: true };
    const { data, error } = await sb('colaboradores').update({ carteirinha_vt: carteirinha || null }).eq('id', colaborador_id).select('id,carteirinha_vt').single();
    if (error) throw error;
    return data;
  },
  async upsertRegistroVT({ colaborador_id, data_registro, qtd_viagens, forma_pagamento, observacao }) {
    const dia = data_registro || new Date().toISOString().slice(0, 10);
    if (USING_SUPABASE) {
      const { data, error } = await sb('registro_diario_vt')
        .upsert({ colaborador_id, data_registro: dia, qtd_viagens, forma_pagamento, observacao },
          { onConflict: 'colaborador_id,data_registro' })
        .select().single();
      if (error) throw error;
      return data;
    }
    const ex = mock.registroVT.find(r => r.colaborador_id === colaborador_id && r.data_registro === dia);
    if (ex) { Object.assign(ex, { qtd_viagens, forma_pagamento, observacao }); return ex; }
    const novo = { id: uid(), colaborador_id, data_registro: dia, qtd_viagens, forma_pagamento, observacao };
    mock.registroVT.push(novo);
    return novo;
  },
  async getColaboradorDetalhe(id) {
    if (USING_SUPABASE) {
      const [{ data: c }, { data: docs }, { data: hist }, { data: folha }, { data: ponto }] = await Promise.all([
        sb('colaboradores').select('*').eq('id', id).single(),
        sb('documentos_dp').select('*').eq('colaborador_id', id),
        sb('historico_funcional').select('*').eq('colaborador_id', id).order('data', { ascending: false }),
        sb('folha_pagamento').select('*').eq('colaborador_id', id).order('mes_referencia', { ascending: false }).limit(1),
        sb('ponto_frequencia').select('presenca,horas_extras').eq('colaborador_id', id),
      ]);
      if (!c) return null;
      const resumoPonto = (ponto || []).reduce((a, p) => ({ dias_trabalhados: a.dias_trabalhados + (p.presenca ? 1 : 0), faltas: a.faltas + (p.presenca ? 0 : 1), horas_extras: a.horas_extras + Number(p.horas_extras || 0) }), { dias_trabalhados: 0, faltas: 0, horas_extras: 0 });
      return { ...c, documentos: docs || [], historico: hist || [], folha: (folha || [])[0] || null, ponto: resumoPonto };
    }
    const c = mock.colaboradores.find(x => x.id === id); if (!c) return null;
    return {
      ...c,
      documentos: mock.documentos.filter(d => d.colaborador_id === id),
      historico: mock.historico.filter(h => h.colaborador_id === id).sort((a, b) => b.data.localeCompare(a.data)),
      folha: mock.folha.find(f => f.colaborador_id === id) || null,
      ponto: mock.ponto[id] || { dias_trabalhados: 0, faltas: 0, horas_extras: 0 },
    };
  },

  // ================= GESTÃO v2 (bancos, DRE, produção) =================
  // Só faz sentido com Supabase; em mock retorna estruturas vazias.
  async _saldoAjustar(contaId, delta) {
    const { data } = await sb('contas_bancarias').select('saldo_atual').eq('id', contaId).single();
    const novo = (data?.saldo_atual || 0) + delta;
    await sb('contas_bancarias').update({ saldo_atual: novo }).eq('id', contaId);
    return novo;
  },
  async listContas() {
    if (!USING_SUPABASE) return [];
    const { data, error } = await sb('contas_bancarias').select('*').order('nome_instituicao');
    if (error) throw error; return data;
  },
  async createConta(c) {
    if (USING_SUPABASE) { const { data, error } = await sb('contas_bancarias').insert(c).select().single(); if (error) throw error; return data; }
    return { id: uid(), ...c };
  },
  async updateConta(id, patch) {
    if (!USING_SUPABASE) return { id, ...patch };
    const { data, error } = await sb('contas_bancarias').update(patch).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },
  async deleteConta(id) {
    if (USING_SUPABASE) { const { error } = await sb('contas_bancarias').delete().eq('id', id); if (error) throw error; }
    return { ok: true };
  },
  async getCaixinha() {
    const { data } = await sb('contas_bancarias').select('*').eq('is_caixinha', true).limit(1).maybeSingle();
    return data || null;
  },
  async criarMovimentacao(m) {
    const { data, error } = await sb('movimentacoes_caixa').insert(m).select().single();
    if (error) throw error;
    if (m.status !== 'PREVISTO') await this._saldoAjustar(m.conta_bancaria_id, m.tipo === 'ENTRADA' ? m.valor : -m.valor);
    return data;
  },
  // Proposta aprovada → entrada PREVISTA no fluxo de caixa (recebível), uma única vez por orçamento
  async lancarRecebivelProposta(orc, hojeStr) {
    if (!USING_SUPABASE) return null;
    const valor = Math.round((Number(orc.valor_total) || 0) * 100); // valor_total do orçamento é em reais
    if (valor <= 0) return null;
    // evita duplicar: já existe recebível deste orçamento?
    const { data: existe } = await sb('movimentacoes_caixa').select('id')
      .eq('categoria', 'RECEBIVEL_PROPOSTA').ilike('descricao', `%Nº ${orc.numero_orcamento} %`).limit(1);
    if (existe && existe.length) return null;
    const { data: contas } = await sb('contas_bancarias').select('id').limit(1);
    const conta_id = contas && contas.length ? contas[0].id : null;
    const base = (hojeStr && /^\d{4}-\d{2}-\d{2}$/.test(hojeStr)) ? new Date(hojeStr + 'T12:00:00Z') : new Date();
    const data_prev = new Date(base.getTime() + 7 * 86400000).toISOString().slice(0, 10); // ~7 dias (sinal esperado)
    return this.criarMovimentacao({
      conta_bancaria_id: conta_id, obra_id: null, data_movimento: data_prev,
      descricao: `Recebível — Proposta Nº ${orc.numero_orcamento} (${orc.cliente_nome || ''})`,
      categoria: 'RECEBIVEL_PROPOSTA', tipo: 'ENTRADA', valor, status: 'PREVISTO', conciliado: false,
    });
  },
  // Vale: debita a caixinha e registra pendente de abate na folha
  async criarVale(v) {
    if (!USING_SUPABASE) return { vale: { ...v, id: uid() }, saldo_caixinha: 0, alerta_liquidez: false };
    const caixinha = await this.getCaixinha();
    // Se houver Caixinha PIX configurada, debita dela; senão, só registra o vale (pendente de abate na folha)
    let mov = null;
    if (caixinha) {
      mov = await this.criarMovimentacao({
        conta_bancaria_id: caixinha.id, obra_id: v.obra_id || null, colaborador_id: v.colaborador_id,
        data_movimento: v.data_lancamento || new Date().toISOString().slice(0, 10),
        descricao: 'Vale/adiantamento PIX' + (v.observacao ? ' — ' + v.observacao : ''),
        categoria: 'VALE_CAMPO', tipo: 'SAIDA', valor: v.valor, status: 'REALIZADO', conciliado: true,
      });
    }
    const { data, error } = await sb('vales_diaria').insert({
      colaborador_id: v.colaborador_id, obra_id: v.obra_id || null, tipo: v.tipo || 'ADIANTAMENTO_VALE',
      valor: v.valor, observacao: v.observacao || null, status_pagamento: 'PAGO', abatido_folha: false,
      movimentacao_id: mov ? mov.id : null, data_lancamento: v.data_lancamento || new Date().toISOString().slice(0, 10),
    }).select().single();
    if (error) throw error;
    const saldo = caixinha ? (caixinha.saldo_atual - v.valor) : null;
    return { vale: data, saldo_caixinha: saldo, alerta_liquidez: saldo != null && saldo < 100000, sem_caixinha: !caixinha };  // < R$ 1.000
  },
  // Desconto manual na folha (FALTA / INSS / OUTRO) — não mexe no caixa, só abate no líquido
  async criarDesconto(d) {
    if (!USING_SUPABASE) return { ...d, id: uid() };
    const { data, error } = await sb('descontos_folha').insert({
      colaborador_id: d.colaborador_id, tipo: d.tipo || 'FALTA', valor: d.valor,
      observacao: d.observacao || null, abatido_folha: false,
      data_lancamento: d.data_lancamento || new Date().toISOString().slice(0, 10),
    }).select().single();
    if (error) throw error;
    return data;
  },
  // Falta lançada pelo Cronograma (valor 0, a lançar depois pela Bárbara). Idempotente por colaborador+dia.
  async criarFalta({ data, colaborador_id }) {
    if (!USING_SUPABASE) return { id: uid(), colaborador_id, tipo: 'FALTA', valor: 0, data_lancamento: data };
    const { data: existe } = await sb('descontos_folha').select('*')
      .eq('colaborador_id', colaborador_id).eq('tipo', 'FALTA').eq('data_lancamento', data).eq('abatido_folha', false).limit(1).maybeSingle();
    if (existe) return existe;
    const { data: row, error } = await sb('descontos_folha').insert({
      colaborador_id, tipo: 'FALTA', valor: 0, observacao: 'Falta (cronograma)',
      data_lancamento: data, abatido_folha: false,
    }).select().single();
    if (error) throw error;
    return row;
  },
  async listFaltas(data) {
    if (!USING_SUPABASE) return [];
    const { data: rows } = await sb('descontos_folha').select('id,colaborador_id,valor,data_lancamento,observacao')
      .eq('tipo', 'FALTA').eq('data_lancamento', data).eq('abatido_folha', false);
    return rows || [];
  },
  async updateDesconto(id, patch) {
    if (!USING_SUPABASE) return { id, ...patch };
    const { data, error } = await sb('descontos_folha').update(patch).eq('id', id).eq('abatido_folha', false).select().single();
    if (error) throw error;
    return data;
  },
  async deleteDesconto(id) {
    if (USING_SUPABASE) { const { error } = await sb('descontos_folha').delete().eq('id', id).eq('abatido_folha', false); if (error) throw error; }
    return { ok: true };
  },
  // Excluir um vale (só se ainda não abatido na folha); reverte o débito no caixa se houver
  async deleteVale(id) {
    if (!USING_SUPABASE) return { ok: true };
    const { data: v } = await sb('vales_diaria').select('id,movimentacao_id,abatido_folha').eq('id', id).maybeSingle();
    if (!v) return { ok: true };
    if (v.abatido_folha) { const e = new Error('Vale já abatido na folha — não pode ser excluído.'); e.status = 409; throw e; }
    if (v.movimentacao_id) { await sb('movimentacoes_caixa').delete().eq('id', v.movimentacao_id); }
    const { error } = await sb('vales_diaria').delete().eq('id', id).eq('abatido_folha', false);
    if (error) throw error;
    return { ok: true };
  },
  // Apontamento diário com rateio de m² entre a equipe
  async criarApontamento(a) {
    if (!USING_SUPABASE) return { id: uid(), ...a, m2_por_colaborador: 0 };
    const equipe = Array.isArray(a.equipe_ids) ? a.equipe_ids.filter(Boolean) : [];
    const val = await this.validarAlocacao(equipe, a.obra_id);
    if (!val.ok) { const e = new Error(val.erro); e.status = 422; throw e; }
    const { data: ap, error } = await sb('apontamentos_diarios').insert({
      obra_id: a.obra_id, data: a.data || new Date().toISOString().slice(0, 10),
      metragem_dia_m2: a.metragem_dia_m2, observacoes_tecnicas: a.observacoes_tecnicas || null,
    }).select().single();
    if (error) throw error;
    const rateio = equipe.length ? Math.round((a.metragem_dia_m2 / equipe.length) * 100) / 100 : 0;
    if (equipe.length) {
      await sb('apontamento_equipe').insert(equipe.map(cid => ({
        apontamento_id: ap.id, colaborador_id: cid, m2_rateado: rateio, data: ap.data,
      })));
    }
    return { ...ap, m2_por_colaborador: rateio, equipe: equipe.length };
  },
  // Fechamento de folha no período [desde, ate]
  async fecharFolha(desde, ate) {
    if (!USING_SUPABASE) return { colaboradores: [], totais: {} };
    const [{ data: colabs }, { data: apeq }, { data: vales }, { data: alocs }, descRes] = await Promise.all([
      sb('colaboradores').select('id,nome,cargo,valor_diaria,comissao_por_m2,status'),
      sb('apontamento_equipe').select('colaborador_id,m2_rateado,data').gte('data', desde).lte('data', ate),
      sb('vales_diaria').select('id,colaborador_id,valor,tipo,abatido_folha,data_lancamento').eq('abatido_folha', false),
      // Cronograma Diário: alocações do período (fonte principal das diárias)
      sb('cronograma_alocacoes').select('colaborador_id,data,obra_nome,funcao,valor_diaria').gte('data', desde).lte('data', ate),
      // Descontos manuais (FALTA / INSS / OUTRO) — valores variáveis lançados na folha
      sb('descontos_folha').select('id,colaborador_id,valor,tipo,abatido_folha,data_lancamento').eq('abatido_folha', false),
    ]);
    const descontos = descRes && descRes.data ? descRes.data : [];
    const porColab = {};
    for (const c of (colabs || [])) porColab[c.id] = { ...c, dias: new Set(), m2: 0, vales: 0, faltas: 0, inss: 0, outros_desc: 0, faltas_itens: [], lancamentos: [], cronDiarias: 0, cronDias: new Set(), detalhe: [] };
    for (const r of (apeq || [])) { const p = porColab[r.colaborador_id]; if (!p) continue; p.dias.add(r.data); p.m2 += Number(r.m2_rateado); }
    for (const v of (vales || [])) {
      const p = porColab[v.colaborador_id]; if (!p) continue;
      p.vales += v.valor;
      p.lancamentos.push({ id: v.id, origem: 'vale', tipo: 'VALE', data: v.data_lancamento, valor: v.valor });
    }
    for (const d of descontos) {
      const p = porColab[d.colaborador_id]; if (!p) continue;
      if (d.tipo === 'INSS') p.inss += d.valor;
      else if (d.tipo === 'FALTA') { p.faltas += d.valor; p.faltas_itens.push({ id: d.id, data: d.data_lancamento, valor: d.valor }); }
      else p.outros_desc += d.valor;
      p.lancamentos.push({ id: d.id, origem: 'desconto', tipo: d.tipo, data: d.data_lancamento, valor: d.valor });
    }
    for (const a of (alocs || [])) {
      const p = porColab[a.colaborador_id]; if (!p) continue;
      p.cronDiarias += (a.valor_diaria || 0); p.cronDias.add(a.data);
      p.detalhe.push({ data: a.data, obra: a.obra_nome, funcao: a.funcao, valor: a.valor_diaria || 0 });
    }
    const linhas = Object.values(porColab).map(p => {
      const temCron = p.cronDias.size > 0;
      // Diárias: preferir o Cronograma; se não houver alocação, cai no antigo (dias de apontamento × diária base)
      const dias = temCron ? p.cronDias.size : p.dias.size;
      const diarias = temCron ? p.cronDiarias : (p.dias.size * (p.valor_diaria || 0));
      const comissao = Math.round(p.m2 * (p.comissao_por_m2 || 0));
      const bonus_assiduidade = dias > 22 ? 50000 : 0;   // R$ 500 (assiduidade)
      const bruto = diarias + comissao + bonus_assiduidade;
      const total_liquido = bruto - p.vales - p.faltas - p.inss - p.outros_desc;
      return {
        colaborador_id: p.id, nome: p.nome, cargo: p.cargo,
        dias_trabalhados: dias, m2_processados: Math.round(p.m2 * 100) / 100,
        origem_diaria: temCron ? 'cronograma' : 'apontamento',
        diarias, comissao, bonus_assiduidade, vales_abatidos: p.vales,
        faltas: p.faltas, inss: p.inss, outros_desconto: p.outros_desc, total_liquido,
        faltas_itens: p.faltas_itens.sort((a, b) => (a.data || '').localeCompare(b.data || '')),
        lancamentos: p.lancamentos.sort((a, b) => (a.data || '').localeCompare(b.data || '')),
        detalhe: p.detalhe.sort((a, b) => (a.data || '').localeCompare(b.data || '')),
      };
    }).filter(l => l.dias_trabalhados || l.vales_abatidos || l.faltas || l.inss || l.outros_desconto || (l.faltas_itens && l.faltas_itens.length));
    const totais = {
      a_pagar: linhas.reduce((s, l) => s + l.total_liquido, 0),
      comissoes: linhas.reduce((s, l) => s + l.comissao, 0),
      diarias: linhas.reduce((s, l) => s + l.diarias, 0),
      vales: linhas.reduce((s, l) => s + l.vales_abatidos, 0),
      bonus: linhas.reduce((s, l) => s + l.bonus_assiduidade, 0),
      faltas: linhas.reduce((s, l) => s + l.faltas, 0),
      inss: linhas.reduce((s, l) => s + l.inss, 0),
    };
    return { periodo: { desde, ate }, colaboradores: linhas, totais };
  },
  // Fechamento EFETIVO: trava o período, gera 1 recibo por colaborador e abate os vales.
  async fecharFolhaEfetivar(desde, ate, hojeStr) {
    if (!USING_SUPABASE) return { fechamento: { id: uid(), desde, ate }, recibos: 0, vales_abatidos: 0 };
    const resumo = await this.fecharFolha(desde, ate);
    if (!resumo.colaboradores.length) { const e = new Error('Nada a fechar neste período.'); e.status = 422; throw e; }
    // impede fechar o mesmo período duas vezes
    const { data: existe } = await sb('folha_fechamentos').select('id').eq('desde', desde).eq('ate', ate).limit(1).maybeSingle();
    if (existe) { const e = new Error('Este período já foi fechado.'); e.status = 409; throw e; }
    const hoje = hojeStr || new Date().toISOString().slice(0, 10);
    const t = resumo.totais;
    const { data: fech, error: ef } = await sb('folha_fechamentos').insert({
      desde, ate, data: hoje,
      total_a_pagar: t.a_pagar || 0, total_diarias: t.diarias || 0, total_comissoes: t.comissoes || 0,
      total_vales: t.vales || 0, total_bonus: t.bonus || 0, colaboradores: resumo.colaboradores,
    }).select().single();
    if (ef) throw ef;
    const ref = 'Folha ' + desde.split('-').reverse().slice(0, 2).join('/') + ' a ' + ate.split('-').reverse().join('/');
    const recibos = resumo.colaboradores.map(l => ({
      tipo: 'FOLHA', colaborador_id: l.colaborador_id, colaborador_nome: l.nome, referencia: ref,
      periodo_desde: desde, periodo_ate: ate, valor: l.total_liquido, folha_fechamento_id: fech.id, data: hoje,
      detalhe: { dias: l.dias_trabalhados, m2: l.m2_processados, diarias: l.diarias, comissao: l.comissao, bonus: l.bonus_assiduidade, vales: l.vales_abatidos, faltas: l.faltas || 0, inss: l.inss || 0, outros_desconto: l.outros_desconto || 0, presenca: l.detalhe || [], faltas_lista: l.faltas_itens || [] },
    }));
    if (recibos.length) { const { error: er } = await sb('recibos').insert(recibos); if (er) throw er; }
    // abate os vales e descontos que entraram nesta folha (todos os pendentes)
    const { data: abatidos } = await sb('vales_diaria').update({ abatido_folha: true, folha_fechamento_id: fech.id })
      .eq('abatido_folha', false).select('id');
    const { data: descAbat } = await sb('descontos_folha').update({ abatido_folha: true, folha_fechamento_id: fech.id })
      .eq('abatido_folha', false).select('id');
    return { fechamento: fech, recibos: recibos.length, vales_abatidos: (abatidos || []).length, descontos_abatidos: (descAbat || []).length, totais: t };
  },
  async listRecibos() {
    if (!USING_SUPABASE) return [];
    const { data } = await sb('recibos').select('*').order('criado_em', { ascending: false });
    return data || [];
  },
  // DRE individual da obra
  async dreObra(obraId) {
    if (!USING_SUPABASE) return null;
    const [{ data: obra }, { data: custos }, { data: apeq }] = await Promise.all([
      sb('obras_financeiro').select('*').eq('id', obraId).single(),
      sb('custos_obras').select('custo_total').eq('obra_id', obraId),
      sb('apontamento_equipe').select('m2_rateado,colaborador_id,apontamento_id').in('apontamento_id',
        (await sb('apontamentos_diarios').select('id').eq('obra_id', obraId)).data?.map(a => a.id) || ['00000000-0000-0000-0000-000000000000']),
    ]);
    if (!obra) return null;
    const custo_insumos = (custos || []).reduce((s, c) => s + c.custo_total, 0) || obra.custo_insumos || 0;
    // mão de obra: por colaborador-dia = diária + m²*comissão
    let custo_mao_obra = 0;
    if (apeq && apeq.length) {
      const ids = [...new Set(apeq.map(r => r.colaborador_id))];
      const { data: cs } = await sb('colaboradores').select('id,valor_diaria,comissao_por_m2').in('id', ids);
      const map = Object.fromEntries((cs || []).map(c => [c.id, c]));
      // diária: 1 por colaborador-dia (par colaborador+apontamento)
      custo_mao_obra = apeq.reduce((s, r) => {
        const c = map[r.colaborador_id] || {};
        return s + (c.valor_diaria || 0) + Math.round(Number(r.m2_rateado) * (c.comissao_por_m2 || 0));
      }, 0);
    } else {
      custo_mao_obra = obra.custo_mao_obra || 0;
    }
    const receita_bruta = obra.valor_contrato || 0;
    const custo_direto = custo_insumos + custo_mao_obra;
    const lucro_bruto = receita_bruta - custo_direto;
    const margem = receita_bruta ? Math.round((lucro_bruto / receita_bruta) * 1000) / 10 : 0;
    return {
      obra_id: obraId, cliente: obra.cliente, tipo_servico: obra.tipo_piso, metragem_m2: Number(obra.metragem_m2),
      receita_bruta, custo_direto_insumos: custo_insumos, custo_direto_mao_obra: custo_mao_obra,
      lucro_bruto, margem_lucro_percentual: margem,
    };
  },
  async addCustoObra(obraId, ci) {
    if (!USING_SUPABASE) return { id: uid(), ...ci };
    const custo_total = Math.round((Number(ci.quantidade_utilizada) || 1) * (ci.custo_unitario || 0));
    const { data, error } = await sb('custos_obras').insert({
      obra_id: obraId, descricao_insumo: ci.descricao_insumo,
      quantidade_utilizada: ci.quantidade_utilizada || 1, custo_unitario: ci.custo_unitario || 0, custo_total,
    }).select().single();
    if (error) throw error;
    // mantém o board financeiro em sincronia
    const { data: obra } = await sb('obras_financeiro').select('custo_insumos').eq('id', obraId).single();
    if (obra) await sb('obras_financeiro').update({ custo_insumos: (obra.custo_insumos || 0) + custo_total }).eq('id', obraId);
    return data;
  },
  async transferenciaInterna(origemId, destinoId, valor, descricao) {
    if (!USING_SUPABASE) return { ok: true };
    const { data: origem } = await sb('contas_bancarias').select('*').eq('id', origemId).single();
    if (!origem) throw new Error('conta de origem inválida');
    if (origem.saldo_atual < valor) throw new Error('saldo insuficiente na conta de origem');
    const saida = await this.criarMovimentacao({ conta_bancaria_id: origemId, data_movimento: new Date().toISOString().slice(0, 10), descricao: descricao || 'Transferência interna', categoria: 'TRANSFERENCIA', tipo: 'SAIDA', valor, status: 'REALIZADO', conciliado: true });
    await this.criarMovimentacao({ conta_bancaria_id: destinoId, data_movimento: new Date().toISOString().slice(0, 10), descricao: descricao || 'Transferência interna', categoria: 'TRANSFERENCIA', tipo: 'ENTRADA', valor, status: 'REALIZADO', conciliado: true });
    return { ok: true, movimentacao_id: saida.id };
  },
  async fluxoProjetado(dias, hojeStr) {
    if (!USING_SUPABASE) return { dias: [], resumo: {} };
    // usa a data enviada pelo cliente (mesma linha do tempo dos dados); senão, o relógio do servidor
    const base = (hojeStr && /^\d{4}-\d{2}-\d{2}$/.test(hojeStr)) ? new Date(hojeStr + 'T12:00:00Z') : new Date();
    const ate = new Date(base.getTime() + dias * 86400000);
    const d0 = base.toISOString().slice(0, 10), d1 = ate.toISOString().slice(0, 10);
    const { data: contas } = await sb('contas_bancarias').select('saldo_atual');
    const saldo_atual = (contas || []).reduce((s, c) => s + c.saldo_atual, 0);
    const [{ data: prev }, { data: boletos }, { data: lancs }, { data: medicoes }] = await Promise.all([
      sb('movimentacoes_caixa').select('data_movimento,tipo,valor').eq('status', 'PREVISTO').lte('data_movimento', d1),
      // pendentes: inclui ATRASADOS (venc/data no passado) — ainda são a pagar
      sb('boletos').select('vencimento,valor').eq('pago', false).lte('vencimento', d1),
      sb('lancamentos_diarios').select('data,valor').eq('pago', false).lte('data', d1),
      // medições/notas ainda NÃO recebidas = ENTRADAS previstas (a receber)
      sb('medicoes_obra').select('data,valor').eq('recebido', false),
    ]);
    const porDia = {}; let entradas = 0, saidas = 0;
    const add = (data, campo, valor) => { porDia[data] ||= { data, entradas: 0, saidas: 0 }; porDia[data][campo] += valor; };
    const diaDe = (dataStr) => (dataStr && dataStr < d0) ? d0 : dataStr; // atrasado cai no dia de hoje
    for (const m of (prev || [])) {
      const dia = diaDe(m.data_movimento);
      if (m.tipo === 'ENTRADA') { add(dia, 'entradas', m.valor); entradas += m.valor; }
      else { add(dia, 'saidas', m.valor); saidas += m.valor; }
    }
    // boletos pendentes e lançamentos não pagos entram como SAÍDAS (atrasados caem em hoje)
    for (const b of (boletos || [])) { add(diaDe(b.vencimento), 'saidas', b.valor || 0); saidas += b.valor || 0; }
    for (const l of (lancs || [])) { add(diaDe(l.data), 'saidas', l.valor || 0); saidas += l.valor || 0; }
    // medições a receber → entradas previstas (sem data ou atrasada cai em hoje; além da janela não entra)
    for (const med of (medicoes || [])) {
      const dia = diaDe(med.data || d0);
      if (dia > d1) continue;
      add(dia, 'entradas', med.valor || 0); entradas += med.valor || 0;
    }
    let saldo = saldo_atual;
    const linhas = Object.values(porDia).sort((a, b) => a.data.localeCompare(b.data)).map(d => {
      saldo += d.entradas - d.saidas; return { ...d, saldo_projetado: saldo };
    });
    return { saldo_atual, dias: linhas, resumo: { entradas_previstas: entradas, saidas_previstas: saidas, saldo_final_projetado: saldo_atual + entradas - saidas } };
  },
};
