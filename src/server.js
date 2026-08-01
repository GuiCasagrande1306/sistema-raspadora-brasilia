import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { db, USING_SUPABASE, docStatus, supabase } from './db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

// upload em memória (10 MB) — PDFs e imagens de documentos
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// ---------- AUTENTICAÇÃO / ROLES ----------
// Sem Supabase (dev/mock) a autenticação é desligada e tudo roda como ADMIN.
const AUTH_ON = USING_SUPABASE;

async function validarToken(token) {
  const r = await fetch(`${process.env.SUPABASE_URL}/auth/v1/user`, {
    headers: { apikey: process.env.SUPABASE_ANON_KEY, Authorization: `Bearer ${token}` },
  });
  if (!r.ok) return null;
  const u = await r.json();
  return u && u.id ? u : null;
}
async function requireAuth(req, res, next) {
  if (!AUTH_ON) { req.user = { id: 'dev', email: 'dev@local', role: 'ADMIN' }; return next(); }
  try {
    const h = req.headers.authorization || '';
    const token = h.startsWith('Bearer ') ? h.slice(7) : null;
    if (!token) return res.status(401).json({ erro: 'não autenticado' });
    const u = await validarToken(token);
    if (!u) return res.status(401).json({ erro: 'sessão inválida' });
    const prof = await db.getProfile(u.id);
    req.user = { id: u.id, email: u.email, role: (prof && prof.role) || 'OPERACIONAL' };
    next();
  } catch (e) { next(e); }
}
function requireAdmin(req, res, next) {
  requireAuth(req, res, () => {
    if (req.user.role !== 'ADMIN') return res.status(403).json({ erro: 'acesso restrito ao administrador' });
    next();
  });
}

// Config pública para o frontend (a anon key é pública por design)
app.get('/api/config', (_req, res) => res.json({
  auth: AUTH_ON,
  supabaseUrl: process.env.SUPABASE_URL || null,
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY || null,
}));

// ---------- MATRIZ DE PERMISSÕES (gating por rota) ----------
// ADMIN: tudo. OPERACIONAL: apenas Orçamentos e registro de VT (presença).
app.use('/api/financeiro', requireAdmin);
app.use('/api/dp/kanban', requireAdmin);
app.use('/api/dp/colaborador', requireAdmin);   // ficha, docs, mover, cadastro
app.use('/api/dp/documento', requireAdmin);
app.use('/api/dp/vt/balanco', requireAdmin);     // valores totais p/ PIX/carteirinha
app.use('/api/dp/vt/registro', requireAuth);     // presença de campo (operacional)
app.use('/api/dp/vt/colaboradores', requireAuth);
app.use('/api/orcamentos', requireAuth);         // orçamentos & medições (operacional)
app.use('/api/perfil', requireAuth);             // cada usuário edita o próprio perfil
// Gestão v2
app.use('/api/dp/apontamento', requireAuth);     // apontamento de campo (equipe)
app.use('/api/dp/vale', requireAdmin);           // vale debita caixa — controle admin
app.use('/api/dp/folha-fechamento', requireAdmin);
app.use('/api/obras', requireAdmin);
app.use('/api/bancos', requireAdmin);
app.use('/api/fluxo-caixa', requireAdmin);

// ---------- PERFIL DO USUÁRIO LOGADO ----------
app.get('/api/perfil', async (req, res, next) => {
  try {
    const p = await db.getProfile(req.user.id);
    res.json(p || { id: req.user.id, email: req.user.email, role: req.user.role, nome: null, avatar_url: null });
  } catch (e) { next(e); }
});

app.patch('/api/perfil', async (req, res, next) => {
  try {
    const patch = {};
    if (typeof req.body.nome === 'string' && req.body.nome.trim()) patch.nome = req.body.nome.trim().slice(0, 100);
    if (req.body.avatar_url !== undefined) patch.avatar_url = req.body.avatar_url;
    if (!Object.keys(patch).length) return res.status(400).json({ erro: 'nada para atualizar' });
    res.json(await db.updateProfile(req.user.id, patch));
  } catch (e) { next(e); }
});

app.post('/api/perfil/avatar', upload.single('arquivo'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ erro: 'arquivo é obrigatório' });
    res.json(await db.uploadAvatar(req.user.id, req.file));
  } catch (e) { next(e); }
});

// margem = (contrato - insumos - mão de obra) / contrato
const resumoObra = (o) => {
  const custo = (o.custo_insumos || 0) + (o.custo_mao_obra || 0);
  const lucro = o.valor_contrato - custo;
  const margem = o.valor_contrato ? lucro / o.valor_contrato : 0;
  const m2 = Number(o.metragem_m2) || 0;
  return {
    ...o,
    custo_operacional: custo,
    lucro,
    margem_pct: Math.round(margem * 1000) / 10,
    valor_por_m2: m2 ? Math.round(o.valor_contrato / m2) : 0,
    custo_por_m2: m2 ? Math.round(custo / m2) : 0,
  };
};

// resumo dos alertas de documento de um colaborador (para o card)
const alertaDocs = (docs) => {
  let vencidos = 0, alertas = 0, pendentes = 0, prox = null;
  for (const d of docs) {
    const s = docStatus(d.data_vencimento);
    if (s.nivel === 'vencido') { vencidos++; if (!prox || (d.data_vencimento && d.data_vencimento < prox.data)) prox = { tipo: d.tipo_doc, data: d.data_vencimento, nivel: 'vencido', dias: s.dias }; }
    else if (s.nivel === 'alerta') { alertas++; if (!prox || prox.nivel !== 'vencido') { if (!prox || (d.data_vencimento && d.data_vencimento < prox.data)) prox = { tipo: d.tipo_doc, data: d.data_vencimento, nivel: 'alerta', dias: s.dias }; } }
    else if (s.nivel === 'pendente') pendentes++;
  }
  return { vencidos, alertas, pendentes, prox };
};

// ---------- DP ----------
const DP_STATUS = ['admissao', 'ativo', 'ferias', 'desligamento'];

app.get('/api/dp/kanban', async (_req, res, next) => {
  try {
    const [colaboradores, documentos] = await Promise.all([db.listColaboradores(), db.listDocumentos()]);
    const docsPorColab = {};
    for (const d of documentos) (docsPorColab[d.colaborador_id] ||= []).push(d);
    const colunas = { admissao: [], ativo: [], ferias: [], desligamento: [] };
    for (const c of colaboradores) {
      (colunas[c.status] ||= []).push({ ...c, alerta_docs: alertaDocs(docsPorColab[c.id] || []) });
    }
    res.json(colunas);
  } catch (e) { next(e); }
});

app.post('/api/dp/colaborador', async (req, res, next) => {
  try {
    const { nome, cargo } = req.body;
    if (!nome || !cargo) return res.status(400).json({ erro: 'nome e cargo são obrigatórios' });
    res.status(201).json(await db.createColaborador(req.body));
  } catch (e) { next(e); }
});

app.get('/api/dp/colaborador/:id', async (req, res, next) => {
  try {
    const c = await db.getColaboradorDetalhe(req.params.id);
    if (!c) return res.status(404).json({ erro: 'colaborador não encontrado' });
    c.documentos = (c.documentos || []).map(d => ({ ...d, status: docStatus(d.data_vencimento) }));
    res.json(c);
  } catch (e) { next(e); }
});

// Upload de documento (CNH/ASO/EPI/comprovante) → Supabase Storage + registro
app.post('/api/dp/colaborador/:id/documento', upload.single('arquivo'), async (req, res, next) => {
  try {
    const { tipo_doc, data_vencimento } = req.body;
    if (!tipo_doc) return res.status(400).json({ erro: 'tipo_doc é obrigatório' });
    const doc = await db.uploadDocumento(req.params.id, { tipo_doc, data_vencimento, file: req.file });
    res.status(201).json({ ...doc, status: docStatus(doc.data_vencimento) });
  } catch (e) { next(e); }
});

// URL assinada temporária para visualizar o arquivo
app.get('/api/dp/documento/:id/url', async (req, res, next) => {
  try {
    const url = await db.getDocumentoUrl(req.params.id);
    if (!url) return res.status(404).json({ erro: 'documento sem arquivo' });
    res.json({ url });
  } catch (e) { next(e); }
});

// ---------- ORÇAMENTOS & MEDIÇÕES ----------
const STATUS_ORC = ['PENDENTE_MEDICAO', 'MEDIDO', 'APROVADO', 'CANCELADO'];
// normaliza itens de medição e calcula totais (área × valor unitário)
const prepararItens = (itens) => {
  const lista = Array.isArray(itens) ? itens : [];
  const norm = lista.map(i => {
    const area = Number(i.area_m2) || 0;
    const unit = Number(i.valor_unit) || 0;
    return { descricao: String(i.descricao || '').slice(0, 200), area_m2: area, valor_unit: unit, total: Math.round(area * unit * 100) / 100 };
  });
  const valor_total = Math.round(norm.reduce((s, i) => s + i.total, 0) * 100) / 100;
  return { itens: norm, valor_total };
};

app.get('/api/orcamentos', async (_req, res, next) => {
  try {
    const lista = await db.listOrcamentos();
    const resumo = {
      total: lista.length,
      pendentes: lista.filter(o => o.status === 'PENDENTE_MEDICAO').length,
      aprovados: lista.filter(o => o.status === 'APROVADO').length,
      valor_aprovado: Math.round(lista.filter(o => o.status === 'APROVADO').reduce((s, o) => s + Number(o.valor_total || 0), 0) * 100) / 100,
    };
    res.json({ orcamentos: lista, resumo });
  } catch (e) { next(e); }
});

app.get('/api/orcamentos/:id', async (req, res, next) => {
  try {
    const o = await db.getOrcamento(req.params.id);
    if (!o) return res.status(404).json({ erro: 'orçamento não encontrado' });
    res.json(o);
  } catch (e) { next(e); }
});

app.post('/api/orcamentos', async (req, res, next) => {
  try {
    const { cliente_nome, cliente_fone, endereco_obra, servico_tipo, data_orcamento, observacoes } = req.body;
    if (!cliente_nome) return res.status(400).json({ erro: 'cliente_nome é obrigatório' });
    const { itens, valor_total } = prepararItens(req.body.itens);
    const status = STATUS_ORC.includes(req.body.status) ? req.body.status : (itens.length ? 'MEDIDO' : 'PENDENTE_MEDICAO');
    const novo = await db.createOrcamento({
      cliente_nome, cliente_fone, endereco_obra, servico_tipo, data_orcamento, observacoes,
      itens, valor_total, status,
    });
    res.status(201).json(novo);
  } catch (e) { next(e); }
});

app.patch('/api/orcamentos/:id', async (req, res, next) => {
  try {
    const patch = {};
    for (const k of ['cliente_nome', 'cliente_fone', 'endereco_obra', 'servico_tipo', 'data_orcamento', 'observacoes']) {
      if (req.body[k] !== undefined) patch[k] = req.body[k];
    }
    if (req.body.status !== undefined) {
      if (!STATUS_ORC.includes(req.body.status)) return res.status(400).json({ erro: 'status inválido' });
      patch.status = req.body.status;
    }
    if (req.body.itens !== undefined) {
      const { itens, valor_total } = prepararItens(req.body.itens);
      patch.itens = itens; patch.valor_total = valor_total;
    }
    const o = await db.updateOrcamento(req.params.id, patch);
    if (!o) return res.status(404).json({ erro: 'orçamento não encontrado' });
    res.json(o);
  } catch (e) { next(e); }
});

// ---------- VALE-TRANSPORTE ----------
app.get('/api/dp/vt/balanco', async (_req, res, next) => {
  try {
    const linhas = await db.listBalancoVT();
    const total_geral = linhas.reduce((s, l) => s + Number(l.valor_total || 0), 0);
    const total_viagens = linhas.reduce((s, l) => s + Number(l.total_viagens || 0), 0);
    res.json({ linhas, resumo: { total_geral: Math.round(total_geral * 100) / 100, total_viagens, valor_passagem: 4.30 } });
  } catch (e) { next(e); }
});

// lista enxuta (id + nome) — operacional registra presença sem ver dados sensíveis
app.get('/api/dp/vt/colaboradores', async (_req, res, next) => {
  try {
    const cs = await db.listColaboradores();
    res.json(cs.map(c => ({ id: c.id, nome: c.nome })));
  } catch (e) { next(e); }
});

app.post('/api/dp/vt/registro', async (req, res, next) => {
  try {
    const { colaborador_id, data_registro, forma_pagamento, observacao } = req.body;
    if (!colaborador_id) return res.status(400).json({ erro: 'colaborador_id é obrigatório' });
    const qtd_viagens = Number.isInteger(req.body.qtd_viagens) ? req.body.qtd_viagens : 2;
    const reg = await db.upsertRegistroVT({
      colaborador_id, data_registro, qtd_viagens,
      forma_pagamento: forma_pagamento || 'CARTEIRINHA', observacao: observacao || null,
    });
    res.status(201).json(reg);
  } catch (e) { next(e); }
});

// ---------- PRONTUÁRIO / SST / VACINAS / ANEXOS ----------
app.get('/api/dp/colaborador/:id/prontuario', async (req, res, next) => {
  try {
    const p = await db.getProntuario(req.params.id);
    if (!p) return res.status(404).json({ erro: 'colaborador não encontrado' });
    res.json(p);
  } catch (e) { next(e); }
});
app.post('/api/dp/colaborador/:id/sst', upload.single('arquivo'), async (req, res, next) => {
  try {
    const { tipo_documento } = req.body;
    if (!tipo_documento) return res.status(400).json({ erro: 'tipo_documento é obrigatório' });
    let arquivo_pdf_url = req.body.arquivo_pdf_url || null;
    if (req.file) {
      const r = await db.uploadDocumento(req.params.id, { tipo_doc: 'SST_' + tipo_documento, data_vencimento: req.body.data_vencimento, file: req.file });
      arquivo_pdf_url = r.url_arquivo || arquivo_pdf_url;
    }
    res.status(201).json(await db.addSST(req.params.id, {
      tipo_documento, data_elaboracao: req.body.data_elaboracao, data_vencimento: req.body.data_vencimento,
      arquivo_pdf_url, observacoes: req.body.observacoes,
    }));
  } catch (e) { next(e); }
});
app.post('/api/dp/colaborador/:id/vacina', async (req, res, next) => {
  try {
    if (!req.body.tipo_vacina) return res.status(400).json({ erro: 'tipo_vacina é obrigatório' });
    res.status(201).json(await db.addVacina(req.params.id, req.body));
  } catch (e) { next(e); }
});
app.post('/api/dp/colaborador/:id/anexo', upload.single('arquivo'), async (req, res, next) => {
  try {
    const nome = req.body.nome_documento;
    if (!nome) return res.status(400).json({ erro: 'nome_documento é obrigatório' });
    res.status(201).json(await db.addAnexo(req.params.id, { nome_documento: nome, file: req.file }));
  } catch (e) { next(e); }
});
app.get('/api/sst/alertas-vencimento', requireAdmin, async (req, res, next) => {
  try { res.json(await db.alertasSST(Number(req.query.dias) || 30)); }
  catch (e) { next(e); }
});

// Rotina diária (Vercel Cron) — verifica vencimentos e alerta em 30/15/7 dias.
// Protegido por CRON_SECRET quando definido (header Authorization: Bearer <secret>).
app.get('/api/sst/cron-alertas', async (req, res, next) => {
  try {
    const secret = process.env.CRON_SECRET;
    if (secret) {
      const h = req.headers.authorization || '';
      if (h !== `Bearer ${secret}`) return res.status(401).json({ erro: 'não autorizado' });
    }
    const { vencidos, prestes } = await db.alertasSST(30);
    const buckets = { d30: [], d15: [], d7: [], vencidos };
    for (const p of prestes) {
      if (p.dias <= 7) buckets.d7.push(p);
      else if (p.dias <= 15) buckets.d15.push(p);
      else buckets.d30.push(p);
    }
    console.log(`[cron-alertas] vencidos=${vencidos.length} · 7d=${buckets.d7.length} · 15d=${buckets.d15.length} · 30d=${buckets.d30.length}`);
    for (const v of vencidos) console.log(`  VENCIDO: ${v.colaborador} (${v.empresa}) — ${v.tipo_documento} há ${-v.dias}d`);
    for (const p of [...buckets.d7, ...buckets.d15, ...buckets.d30]) console.log(`  A VENCER em ${p.dias}d: ${p.colaborador} — ${p.tipo_documento}`);
    res.json({ ok: true, executado_em: new Date().toISOString(), resumo: { vencidos: vencidos.length, d7: buckets.d7.length, d15: buckets.d15.length, d30: buckets.d30.length }, buckets });
  } catch (e) { next(e); }
});

app.patch('/api/dp/colaborador/:id/mover', async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!DP_STATUS.includes(status)) return res.status(400).json({ erro: 'status inválido' });
    const c = await db.moverColaborador(req.params.id, status);
    if (!c) return res.status(404).json({ erro: 'colaborador não encontrado' });
    res.json(c);
  } catch (e) { next(e); }
});

app.patch('/api/financeiro/obra/:id/mover', async (req, res, next) => {
  try {
    const { coluna_kanban } = req.body;
    const validos = ['aprovado', 'execucao', 'afericao', 'liquidado'];
    if (!validos.includes(coluna_kanban)) return res.status(400).json({ erro: 'coluna_kanban inválida' });
    const o = await db.moverObra(req.params.id, coluna_kanban);
    if (!o) return res.status(404).json({ erro: 'obra não encontrada' });
    res.json(o);
  } catch (e) { next(e); }
});

// ---------- FINANCEIRO ----------
app.get('/api/financeiro/obras', async (_req, res, next) => {
  try {
    const obras = (await db.listObras()).map(resumoObra);
    const colunas = { aprovado: [], execucao: [], afericao: [], liquidado: [] };
    for (const o of obras) (colunas[o.coluna_kanban] ||= []).push(o);
    const ativas = obras.filter(o => o.coluna_kanban !== 'liquidado');
    const resumo = {
      contratos_ativos: ativas.reduce((s, o) => s + o.valor_contrato, 0),
      custo_operacional: obras.reduce((s, o) => s + o.custo_operacional, 0),
      margem_media_pct: obras.length ? Math.round(obras.reduce((s, o) => s + o.margem_pct, 0) / obras.length * 10) / 10 : 0,
    };
    res.json({ colunas, resumo });
  } catch (e) { next(e); }
});

app.post('/api/financeiro/lancamento', async (req, res, next) => {
  try {
    const { obra_id, tipo, categoria, valor } = req.body;
    if (!tipo || !['entrada', 'saida'].includes(tipo)) return res.status(400).json({ erro: "tipo deve ser 'entrada' ou 'saida'" });
    if (!Number.isInteger(valor)) return res.status(400).json({ erro: 'valor deve ser inteiro (centavos)' });
    res.status(201).json(await db.createLancamento({ obra_id, tipo, categoria, valor, descricao: req.body.descricao }));
  } catch (e) { next(e); }
});

// ================= GESTÃO v2: DP produção · DRE · Bancos =================
// entrada dos endpoints de gestão é em REAIS → converte para centavos
const emCentavos = (v) => Math.round((Number(v) || 0) * 100);

// DP — Apontamento diário (metragem + rateio de m² entre a equipe)
app.post('/api/dp/apontamento', async (req, res, next) => {
  try {
    const { obra_id, metragem_dia_m2, equipe_ids } = req.body;
    if (!obra_id || !(Number(metragem_dia_m2) > 0)) return res.status(400).json({ erro: 'obra_id e metragem_dia_m2 (>0) são obrigatórios' });
    if (!Array.isArray(equipe_ids) || !equipe_ids.length) return res.status(400).json({ erro: 'equipe_ids deve ter ao menos 1 colaborador' });
    res.status(201).json(await db.criarApontamento({ obra_id, metragem_dia_m2: Number(metragem_dia_m2), equipe_ids, data: req.body.data, observacoes_tecnicas: req.body.observacoes_tecnicas }));
  } catch (e) { next(e); }
});

// DP — Vale/adiantamento (debita a Caixinha PIX; pendente de abate na folha)
app.post('/api/dp/vale', async (req, res, next) => {
  try {
    const { colaborador_id, valor } = req.body;
    if (!colaborador_id) return res.status(400).json({ erro: 'colaborador_id é obrigatório' });
    const cents = emCentavos(valor);
    if (!(cents > 0)) return res.status(400).json({ erro: 'valor deve ser > 0' });
    const r = await db.criarVale({ colaborador_id, obra_id: req.body.obra_id, tipo: req.body.tipo, valor: cents, observacao: req.body.observacao, data_lancamento: req.body.data_lancamento });
    res.status(201).json(r);
  } catch (e) { next(e); }
});

// DP — Fechamento de folha (semana/mês)
app.get('/api/dp/folha-fechamento', async (req, res, next) => {
  try {
    const hoje = new Date();
    const desde = req.query.desde || new Date(hoje - 30 * 86400000).toISOString().slice(0, 10);
    const ate = req.query.ate || hoje.toISOString().slice(0, 10);
    res.json(await db.fecharFolha(desde, ate));
  } catch (e) { next(e); }
});

// Obras — cadastro
app.post('/api/obras', async (req, res, next) => {
  try {
    const { cliente_nome, metragem_total_m2, valor_contrato_total } = req.body;
    if (!cliente_nome) return res.status(400).json({ erro: 'cliente_nome é obrigatório' });
    // reaproveita a tabela obras_financeiro (genérica p/ madeira e industrial)
    const payload = {
      cliente: cliente_nome, cliente_telefone: req.body.cliente_telefone || null,
      endereco: req.body.endereco || null, bairro_regiao: req.body.bairro_regiao || null,
      metragem_m2: Number(metragem_total_m2) || 0, tipo_piso: req.body.tipo_piso || null,
      tipo_tratamento: req.body.tipo_tratamento || null, valor_contrato: emCentavos(valor_contrato_total || 0),
      status_pagamento: 'aguardando_sinal', coluna_kanban: 'aprovado', progresso: 0,
      data_inicio: req.body.data_inicio || null, data_previsao_fim: req.body.data_previsao_fim || null,
    };
    if (!supabase) return res.status(201).json({ id: 'mock', ...payload });
    const { data, error } = await supabase.from('obras_financeiro').insert(payload).select().single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (e) { next(e); }
});

app.get('/api/obras/:id/dre', async (req, res, next) => {
  try {
    const dre = await db.dreObra(req.params.id);
    if (!dre) return res.status(404).json({ erro: 'obra não encontrada' });
    res.json(dre);
  } catch (e) { next(e); }
});

app.post('/api/obras/:id/insumos', async (req, res, next) => {
  try {
    const { descricao_insumo, custo_unitario } = req.body;
    if (!descricao_insumo) return res.status(400).json({ erro: 'descricao_insumo é obrigatório' });
    res.status(201).json(await db.addCustoObra(req.params.id, {
      descricao_insumo, quantidade_utilizada: Number(req.body.quantidade_utilizada) || 1, custo_unitario: emCentavos(custo_unitario || 0),
    }));
  } catch (e) { next(e); }
});

// Bancos — saldos consolidados
app.get('/api/bancos/saldos', async (_req, res, next) => {
  try {
    const contas = await db.listContas();
    const total = contas.reduce((s, c) => s + c.saldo_atual, 0);
    res.json({ contas, total_consolidado: total });
  } catch (e) { next(e); }
});

// Bancos — transferência interna
app.post('/api/bancos/transferencia-interna', async (req, res, next) => {
  try {
    const { origem_id, destino_id, valor } = req.body;
    if (!origem_id || !destino_id) return res.status(400).json({ erro: 'origem_id e destino_id são obrigatórios' });
    if (origem_id === destino_id) return res.status(400).json({ erro: 'origem e destino devem ser diferentes' });
    const cents = emCentavos(valor);
    if (!(cents > 0)) return res.status(400).json({ erro: 'valor deve ser > 0' });
    res.status(201).json(await db.transferenciaInterna(origem_id, destino_id, cents, req.body.descricao));
  } catch (e) { next(e); }
});

// Fluxo de caixa projetado (próximos N dias)
app.get('/api/fluxo-caixa/projetado', async (req, res, next) => {
  try { res.json(await db.fluxoProjetado(Number(req.query.dias) || 30)); }
  catch (e) { next(e); }
});

app.get('/api/health', (_req, res) => res.json({ ok: true, storage: USING_SUPABASE ? 'supabase' : 'mock' }));

app.use((err, _req, res, _next) => {
  if (err && err.status) return res.status(err.status).json({ erro: err.message });
  console.error(err);
  res.status(500).json({ erro: 'erro interno', detalhe: err.message });
});

// Local: sobe o servidor. Na Vercel (serverless), apenas exporta o app.
if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 3400;
  app.listen(PORT, () => {
    console.log(`\n  Raspadora Brasília  →  http://localhost:${PORT}`);
    console.log(`  Armazenamento: ${USING_SUPABASE ? 'Supabase' : 'MOCK (memória)'}\n`);
  });
}

export default app;
