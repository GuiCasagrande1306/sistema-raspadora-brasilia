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
  _orcSeq: 193,
};

const VALOR_PASSAGEM = 4.30;

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
    if (USING_SUPABASE) { const { data, error } = await sb('colaboradores').insert(c).select().single(); if (error) throw error; return data; }
    const novo = { id: uid(), status: 'admissao', meta_m2: 0, feito_m2: 0, saldo_ferias_dias: 0, ...c };
    mock.colaboradores.push(novo); return novo;
  },
  async moverColaborador(id, status) {
    if (USING_SUPABASE) { const { data, error } = await sb('colaboradores').update({ status }).eq('id', id).select().single(); if (error) throw error; return data; }
    const c = mock.colaboradores.find(x => x.id === id); if (!c) return null; c.status = status; return c;
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
  async getCaixinha() {
    const { data } = await sb('contas_bancarias').select('*').eq('is_caixinha', true).limit(1).single();
    return data || null;
  },
  async criarMovimentacao(m) {
    const { data, error } = await sb('movimentacoes_caixa').insert(m).select().single();
    if (error) throw error;
    if (m.status !== 'PREVISTO') await this._saldoAjustar(m.conta_bancaria_id, m.tipo === 'ENTRADA' ? m.valor : -m.valor);
    return data;
  },
  // Vale: debita a caixinha e registra pendente de abate na folha
  async criarVale(v) {
    if (!USING_SUPABASE) return { vale: { ...v, id: uid() }, saldo_caixinha: 0, alerta_liquidez: false };
    const caixinha = await this.getCaixinha();
    if (!caixinha) throw new Error('Caixinha PIX Campo não configurada');
    const mov = await this.criarMovimentacao({
      conta_bancaria_id: caixinha.id, obra_id: v.obra_id || null, colaborador_id: v.colaborador_id,
      data_movimento: v.data_lancamento || new Date().toISOString().slice(0, 10),
      descricao: 'Vale/adiantamento PIX' + (v.observacao ? ' — ' + v.observacao : ''),
      categoria: 'VALE_CAMPO', tipo: 'SAIDA', valor: v.valor, status: 'REALIZADO', conciliado: true,
    });
    const { data, error } = await sb('vales_diaria').insert({
      colaborador_id: v.colaborador_id, obra_id: v.obra_id || null, tipo: v.tipo || 'ADIANTAMENTO_VALE',
      valor: v.valor, observacao: v.observacao || null, status_pagamento: 'PAGO', abatido_folha: false,
      movimentacao_id: mov.id, data_lancamento: v.data_lancamento || new Date().toISOString().slice(0, 10),
    }).select().single();
    if (error) throw error;
    const saldo = caixinha.saldo_atual - v.valor;
    return { vale: data, saldo_caixinha: saldo, alerta_liquidez: saldo < 100000 };  // < R$ 1.000
  },
  // Apontamento diário com rateio de m² entre a equipe
  async criarApontamento(a) {
    if (!USING_SUPABASE) return { id: uid(), ...a, m2_por_colaborador: 0 };
    const equipe = Array.isArray(a.equipe_ids) ? a.equipe_ids.filter(Boolean) : [];
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
    const [{ data: colabs }, { data: apeq }, { data: vales }] = await Promise.all([
      sb('colaboradores').select('id,nome,cargo,valor_diaria,comissao_por_m2,status'),
      sb('apontamento_equipe').select('colaborador_id,m2_rateado,data').gte('data', desde).lte('data', ate),
      sb('vales_diaria').select('id,colaborador_id,valor,tipo,abatido_folha').eq('abatido_folha', false),
    ]);
    const porColab = {};
    for (const c of (colabs || [])) porColab[c.id] = { ...c, dias: new Set(), m2: 0, vales: 0 };
    for (const r of (apeq || [])) { const p = porColab[r.colaborador_id]; if (!p) continue; p.dias.add(r.data); p.m2 += Number(r.m2_rateado); }
    for (const v of (vales || [])) { const p = porColab[v.colaborador_id]; if (p) p.vales += v.valor; }
    const linhas = Object.values(porColab).map(p => {
      const dias = p.dias.size;
      const diarias = dias * (p.valor_diaria || 0);
      const comissao = Math.round(p.m2 * (p.comissao_por_m2 || 0));
      const bonus_assiduidade = dias > 22 ? 50000 : 0;   // R$ 500 (assiduidade)
      const bruto = diarias + comissao + bonus_assiduidade;
      const total_liquido = bruto - p.vales;
      return {
        colaborador_id: p.id, nome: p.nome, cargo: p.cargo,
        dias_trabalhados: dias, m2_processados: Math.round(p.m2 * 100) / 100,
        diarias, comissao, bonus_assiduidade, vales_abatidos: p.vales, total_liquido,
      };
    }).filter(l => l.dias_trabalhados || l.vales_abatidos);
    const totais = {
      a_pagar: linhas.reduce((s, l) => s + l.total_liquido, 0),
      comissoes: linhas.reduce((s, l) => s + l.comissao, 0),
      diarias: linhas.reduce((s, l) => s + l.diarias, 0),
      vales: linhas.reduce((s, l) => s + l.vales_abatidos, 0),
      bonus: linhas.reduce((s, l) => s + l.bonus_assiduidade, 0),
    };
    return { periodo: { desde, ate }, colaboradores: linhas, totais };
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
  async fluxoProjetado(dias) {
    if (!USING_SUPABASE) return { dias: [], resumo: {} };
    const hoje = new Date(); const ate = new Date(Date.now() + dias * 86400000);
    const d0 = hoje.toISOString().slice(0, 10), d1 = ate.toISOString().slice(0, 10);
    const { data: contas } = await sb('contas_bancarias').select('saldo_atual');
    const saldo_atual = (contas || []).reduce((s, c) => s + c.saldo_atual, 0);
    const { data: prev } = await sb('movimentacoes_caixa').select('data_movimento,tipo,valor')
      .eq('status', 'PREVISTO').gte('data_movimento', d0).lte('data_movimento', d1).order('data_movimento');
    const porDia = {}; let entradas = 0, saidas = 0;
    for (const m of (prev || [])) {
      porDia[m.data_movimento] ||= { data: m.data_movimento, entradas: 0, saidas: 0 };
      if (m.tipo === 'ENTRADA') { porDia[m.data_movimento].entradas += m.valor; entradas += m.valor; }
      else { porDia[m.data_movimento].saidas += m.valor; saidas += m.valor; }
    }
    let saldo = saldo_atual;
    const linhas = Object.values(porDia).sort((a, b) => a.data.localeCompare(b.data)).map(d => {
      saldo += d.entradas - d.saidas; return { ...d, saldo_projetado: saldo };
    });
    return { saldo_atual, dias: linhas, resumo: { entradas_previstas: entradas, saidas_previstas: saidas, saldo_final_projetado: saldo_atual + entradas - saidas } };
  },
};
