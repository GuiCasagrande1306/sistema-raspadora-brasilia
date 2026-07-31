import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { db, USING_SUPABASE, docStatus } from './db.js';

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

app.get('/api/health', (_req, res) => res.json({ ok: true, storage: USING_SUPABASE ? 'supabase' : 'mock' }));

app.use((err, _req, res, _next) => {
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
