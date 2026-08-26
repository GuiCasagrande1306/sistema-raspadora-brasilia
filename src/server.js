import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { db, USING_SUPABASE, docStatus, supabase, BUCKET } from './db.js';
import { sendTextMessage, WHATSAPP_ON } from './whatsappService.js';
import { createZip } from './zip.js';

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
app.use('/api/dp/vt/semana', requireAuth);       // VT semanal editável
app.use('/api/orcamentos', requireAuth);         // orçamentos & medições (operacional)
app.use('/api/perfil', requireAuth);             // cada usuário edita o próprio perfil
// Gestão v2
app.use('/api/dp/apontamento', requireAuth);     // apontamento de campo (equipe)
app.use('/api/dp/vale', requireAdmin);           // vale debita caixa — controle admin
app.use('/api/dp/folha-fechamento', requireAdmin);
app.use('/api/obras', requireAdmin);
app.use('/api/bancos', requireAdmin);
app.use('/api/fluxo-caixa', requireAdmin);
app.use('/api/dashboard', requireAdmin);
app.use('/api/documentos', requireAdmin);

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
const STATUS_ORC = ['PENDENTE_MEDICAO', 'MEDIDO', 'AGUARDANDO_PROPOSTA', 'PROPOSTA_ENVIADA', 'APROVADO', 'CANCELADO'];
// normaliza itens de medição e calcula totais (área × valor unitário)
const prepararItens = (itens) => {
  const lista = Array.isArray(itens) ? itens : [];
  const norm = lista.map(i => {
    const area = Number(i.area_m2) || 0;
    const unit = Number(i.valor_unit) || 0;
    const unidade = ['m2', 'ml', 'm3'].includes(i.unidade) ? i.unidade : 'm2';
    return { descricao: String(i.descricao || '').slice(0, 200), area_m2: area, unidade, valor_unit: unit, total: Math.round(area * unit * 100) / 100 };
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

// Medição de orçamento (multipart: fotos/vídeos de campo)
app.post('/api/orcamentos', upload.array('midias', 15), async (req, res, next) => {
  try {
    const { cliente_nome, cliente_fone, endereco_obra, servico_tipo, data_orcamento, observacoes } = req.body;
    if (!cliente_nome) return res.status(400).json({ erro: 'cliente_nome é obrigatório' });
    let itensRaw = req.body.itens;
    if (typeof itensRaw === 'string') { try { itensRaw = JSON.parse(itensRaw); } catch { itensRaw = []; } }
    const { itens, valor_total } = prepararItens(itensRaw);
    // upload das mídias de campo para o Storage
    const midias = [];
    if (req.files && req.files.length && USING_SUPABASE) {
      for (const f of req.files) {
        const safe = (f.originalname || 'midia').replace(/[^\w.\-]+/g, '_');
        const path = `orcamentos/${Date.now()}_${safe}`;
        const { error } = await supabase.storage.from(BUCKET).upload(path, f.buffer, { contentType: f.mimetype });
        if (!error) {
          const { data } = await supabase.storage.from(BUCKET).createSignedUrl(path, 60 * 60 * 24 * 365);
          midias.push({ nome: f.originalname, url: data?.signedUrl || path, tipo: f.mimetype });
        }
      }
    }
    // Nasce em "A Medir" (PENDENTE_MEDICAO): o admin preenche a parte do cliente e a equipe
    // completa medições/fotos em campo; ao concluir, passa para AGUARDANDO_PROPOSTA.
    const status = STATUS_ORC.includes(req.body.status) ? req.body.status : 'PENDENTE_MEDICAO';
    const novo = await db.createOrcamento({
      cliente_nome, cliente_fone, endereco_obra, servico_tipo, data_orcamento, observacoes,
      responsavel_tecnico: req.body.responsavel_tecnico || null, google_maps_link: req.body.google_maps_link || null,
      itens, valor_total, status, midias,
    });
    res.status(201).json({ ...novo, notificacao: `O Orçamento N° ${novo.numero_orcamento} está pronto para desenvolver a proposta!` });
  } catch (e) { next(e); }
});

app.patch('/api/orcamentos/:id', async (req, res, next) => {
  try {
    const patch = {};
    for (const k of ['cliente_nome', 'cliente_fone', 'endereco_obra', 'servico_tipo', 'data_orcamento', 'observacoes', 'responsavel_tecnico', 'google_maps_link']) {
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

// ---------- NOTAS FISCAIS (arquivo PDF: empresa > tipo > ano) ----------
const NF_EMPRESAS = ['RB', 'ECO'];
const NF_TIPOS = ['MO', 'MAT']; // Mão de Obra / Materiais
app.get('/api/notas', requireAdmin, async (req, res, next) => {
  try {
    res.json(await db.listNotas({ empresa: req.query.empresa, tipo: req.query.tipo, ano: req.query.ano }));
  } catch (e) { next(e); }
});
app.post('/api/notas', requireAdmin, upload.single('arquivo'), async (req, res, next) => {
  try {
    const { empresa, tipo, ano } = req.body;
    if (!NF_EMPRESAS.includes(empresa)) return res.status(400).json({ erro: 'empresa inválida' });
    if (!NF_TIPOS.includes(tipo)) return res.status(400).json({ erro: 'tipo inválido' });
    const anoN = Number(ano);
    if (!anoN || anoN < 2000 || anoN > 2100) return res.status(400).json({ erro: 'ano inválido' });
    if (!req.file) return res.status(400).json({ erro: 'arquivo é obrigatório' });
    let arquivo_url = null;
    if (USING_SUPABASE) {
      const safe = (req.file.originalname || 'nota.pdf').replace(/[^\w.\-]+/g, '_');
      const path = `notas/${empresa}/${tipo}/${anoN}/${Date.now()}_${safe}`;
      const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, req.file.buffer, { contentType: req.file.mimetype });
      if (upErr) throw upErr;
      const { data: signed } = await supabase.storage.from(BUCKET).createSignedUrl(path, 60 * 60 * 24 * 365);
      arquivo_url = signed?.signedUrl || path;
    }
    const nota = await db.createNota({
      empresa, tipo, ano: anoN, nome: req.body.nome || req.file.originalname || 'Nota fiscal',
      arquivo_url, criado_por: req.user?.email || null,
    });
    res.status(201).json(nota);
  } catch (e) { next(e); }
});
app.delete('/api/notas/:id', requireAdmin, async (req, res, next) => {
  try { res.json(await db.deleteNota(req.params.id)); }
  catch (e) { next(e); }
});

// ---------- DOCUMENTOS EMPRESARIAIS (empresa RB/ECO > pasta > PDFs) ----------
const DOC_EMP_PASTAS = ['CONSTITUTIVOS', 'CERTIDOES', 'OUTROS'];
app.get('/api/docs-empresa', requireAdmin, async (req, res, next) => {
  try { res.json(await db.listDocsEmpresa({ empresa: req.query.empresa, pasta: req.query.pasta })); }
  catch (e) { next(e); }
});
app.post('/api/docs-empresa', requireAdmin, upload.single('arquivo'), async (req, res, next) => {
  try {
    const { empresa, pasta } = req.body;
    if (!NF_EMPRESAS.includes(empresa)) return res.status(400).json({ erro: 'empresa inválida' });
    if (!DOC_EMP_PASTAS.includes(pasta)) return res.status(400).json({ erro: 'pasta inválida' });
    if (!req.file) return res.status(400).json({ erro: 'arquivo é obrigatório' });
    let arquivo_url = null;
    if (USING_SUPABASE) {
      const safe = (req.file.originalname || 'doc.pdf').replace(/[^\w.\-]+/g, '_');
      const path = `docs-empresa/${empresa}/${pasta}/${Date.now()}_${safe}`;
      const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, req.file.buffer, { contentType: req.file.mimetype });
      if (upErr) throw upErr;
      const { data: signed } = await supabase.storage.from(BUCKET).createSignedUrl(path, 60 * 60 * 24 * 365);
      arquivo_url = signed?.signedUrl || path;
    }
    res.status(201).json(await db.createDocEmpresa({
      empresa, pasta, nome: req.body.nome || req.file.originalname || 'Documento',
      arquivo_url, criado_por: req.user?.email || null,
    }));
  } catch (e) { next(e); }
});
app.delete('/api/docs-empresa/:id', requireAdmin, async (req, res, next) => {
  try { res.json(await db.deleteDocEmpresa(req.params.id)); }
  catch (e) { next(e); }
});

// ---------- LEADS (comercial) ----------
const LEAD_ORIGENS = ['GOOGLE', 'META', 'INSTAGRAM', 'INDICACAO', 'PARCEIRO'];
const LEAD_STATUS = ['MARCAR_VISITA', 'VISITA_AGENDADA', 'EM_EXECUCAO', 'EM_ESPERA', 'FECHADO', 'PERDIDO'];
const LEAD_PAGTO = ['PENDENTE', 'CONCLUIDO'];
app.use('/api/leads', requireAdmin);
app.get('/api/leads', async (req, res, next) => {
  try { res.json(await db.listLeads({ origem: req.query.origem, status: req.query.status })); }
  catch (e) { next(e); }
});
app.post('/api/leads', async (req, res, next) => {
  try {
    const { nome, origem } = req.body;
    if (!nome) return res.status(400).json({ erro: 'nome é obrigatório' });
    if (origem && !LEAD_ORIGENS.includes(origem)) return res.status(400).json({ erro: 'origem inválida' });
    res.status(201).json(await db.createLead({
      nome, telefone: req.body.telefone || null, origem: origem || null,
      servico: req.body.servico || null, responsavel: req.body.responsavel || null,
      endereco: req.body.endereco || null, data_inicio: req.body.data_inicio || null,
      situacao_pagamento: LEAD_PAGTO.includes(req.body.situacao_pagamento) ? req.body.situacao_pagamento : 'PENDENTE',
      observacao: req.body.observacao || null,
      status: LEAD_STATUS.includes(req.body.status) ? req.body.status : 'MARCAR_VISITA',
    }));
  } catch (e) { next(e); }
});
app.patch('/api/leads/:id', async (req, res, next) => {
  try {
    const patch = {};
    for (const k of ['nome', 'telefone', 'servico', 'observacao', 'responsavel', 'endereco', 'data_inicio']) if (req.body[k] !== undefined) patch[k] = req.body[k];
    if (req.body.origem !== undefined) {
      if (req.body.origem && !LEAD_ORIGENS.includes(req.body.origem)) return res.status(400).json({ erro: 'origem inválida' });
      patch.origem = req.body.origem;
    }
    if (req.body.situacao_pagamento !== undefined) {
      if (!LEAD_PAGTO.includes(req.body.situacao_pagamento)) return res.status(400).json({ erro: 'situação de pagamento inválida' });
      patch.situacao_pagamento = req.body.situacao_pagamento;
    }
    if (req.body.status !== undefined) {
      if (!LEAD_STATUS.includes(req.body.status)) return res.status(400).json({ erro: 'status inválido' });
      patch.status = req.body.status;
    }
    let l = await db.updateLead(req.params.id, patch);
    if (!l) return res.status(404).json({ erro: 'lead não encontrado' });
    // Automação: lead "Negócio fechado" cria Cliente + Obra (uma única vez)
    let conversao = null;
    if (l.status === 'FECHADO' && !l.obra_id) {
      try {
        const { cliente, obra } = await db.converterLead(l);
        l = await db.updateLead(l.id, { cliente_id: cliente ? cliente.id : null, obra_id: obra ? obra.id : null }) || l;
        conversao = { cliente_nome: cliente ? cliente.nome : null, obra_id: obra ? obra.id : null };
      } catch (convErr) { console.error('[converterLead]', convErr); }
    }
    res.json({ ...l, conversao });
  } catch (e) { next(e); }
});
app.delete('/api/leads/:id', async (req, res, next) => {
  try { res.json(await db.deleteLead(req.params.id)); }
  catch (e) { next(e); }
});

// ---------- CLIENTES ----------
app.use('/api/clientes', requireAdmin);
app.get('/api/clientes', async (req, res, next) => {
  try { res.json(await db.listClientes({ q: req.query.q })); }
  catch (e) { next(e); }
});
app.post('/api/clientes', async (req, res, next) => {
  try {
    const { nome } = req.body;
    if (!nome) return res.status(400).json({ erro: 'nome é obrigatório' });
    res.status(201).json(await db.createCliente({
      nome, telefone: req.body.telefone || null, endereco: req.body.endereco || null,
      origem: req.body.origem || null, responsavel: req.body.responsavel || null,
      observacao: req.body.observacao || null,
    }));
  } catch (e) { next(e); }
});
app.patch('/api/clientes/:id', async (req, res, next) => {
  try {
    const patch = {};
    for (const k of ['nome', 'telefone', 'endereco', 'origem', 'responsavel', 'observacao']) if (req.body[k] !== undefined) patch[k] = req.body[k];
    const c = await db.updateCliente(req.params.id, patch);
    if (!c) return res.status(404).json({ erro: 'cliente não encontrado' });
    res.json(c);
  } catch (e) { next(e); }
});
app.delete('/api/clientes/:id', async (req, res, next) => {
  try { res.json(await db.deleteCliente(req.params.id)); }
  catch (e) { next(e); }
});

// ---------- GEFIP (Ano > Mês > Obra > PDFs, com download .zip por obra) ----------
app.use('/api/gefip', requireAdmin);
// pastas: sem ?mes → pastas de mês (obra null); com ?mes → pastas de obra daquele mês
app.get('/api/gefip/pastas', async (req, res, next) => {
  try {
    const { ano, mes } = req.query;
    const pastas = await db.listGefipPastas({ ano, mes: mes || null });
    res.json(mes ? pastas.filter(p => p.obra) : pastas.filter(p => !p.obra));
  } catch (e) { next(e); }
});
app.post('/api/gefip/pasta', async (req, res, next) => {
  try {
    const { ano, mes } = req.body;
    if (!Number(ano) || !mes) return res.status(400).json({ erro: 'ano e mes são obrigatórios' });
    res.status(201).json(await db.createGefipPasta({ ano: Number(ano), mes: String(mes), obra: req.body.obra ? String(req.body.obra) : null }));
  } catch (e) { next(e); }
});
app.delete('/api/gefip/pasta/:id', async (req, res, next) => {
  try { res.json(await db.deleteGefipPasta(req.params.id)); }
  catch (e) { next(e); }
});
app.get('/api/gefip/docs', async (req, res, next) => {
  try { res.json(await db.listGefipDocs({ ano: req.query.ano, mes: req.query.mes, obra: req.query.obra })); }
  catch (e) { next(e); }
});
app.post('/api/gefip/doc', upload.single('arquivo'), async (req, res, next) => {
  try {
    const { ano, mes, obra } = req.body;
    if (!Number(ano) || !mes || !obra) return res.status(400).json({ erro: 'ano, mes e obra são obrigatórios' });
    if (!req.file) return res.status(400).json({ erro: 'arquivo é obrigatório' });
    let arquivo_url = null, arquivo_path = null;
    if (USING_SUPABASE) {
      const safe = (req.file.originalname || 'doc.pdf').replace(/[^\w.\-]+/g, '_');
      arquivo_path = `gefip/${Number(ano)}/${mes}/${String(obra).replace(/[^\w.\-]+/g, '_')}/${Date.now()}_${safe}`;
      const { error: upErr } = await supabase.storage.from(BUCKET).upload(arquivo_path, req.file.buffer, { contentType: req.file.mimetype });
      if (upErr) throw upErr;
      const { data: signed } = await supabase.storage.from(BUCKET).createSignedUrl(arquivo_path, 60 * 60 * 24 * 365);
      arquivo_url = signed?.signedUrl || arquivo_path;
    }
    res.status(201).json(await db.createGefipDoc({
      ano: Number(ano), mes: String(mes), obra: String(obra),
      nome: req.body.nome || req.file.originalname || 'Documento', arquivo_path, arquivo_url,
      criado_por: req.user?.email || null,
    }));
  } catch (e) { next(e); }
});
app.delete('/api/gefip/doc/:id', async (req, res, next) => {
  try { res.json(await db.deleteGefipDoc(req.params.id)); }
  catch (e) { next(e); }
});
// Baixa TODOS os PDFs de uma obra num único .zip
app.get('/api/gefip/zip', async (req, res, next) => {
  try {
    const { ano, mes, obra } = req.query;
    if (!ano || !mes || !obra) return res.status(400).json({ erro: 'ano, mes e obra são obrigatórios' });
    const docs = await db.listGefipDocs({ ano, mes, obra });
    if (!docs.length) return res.status(404).json({ erro: 'nenhum documento nesta obra' });
    if (!USING_SUPABASE) return res.status(400).json({ erro: 'download .zip indisponível no modo local' });
    const files = [];
    for (const d of docs) {
      if (!d.arquivo_path) continue;
      const { data, error } = await supabase.storage.from(BUCKET).download(d.arquivo_path);
      if (error || !data) continue;
      const buf = Buffer.from(await data.arrayBuffer());
      files.push({ name: d.nome || 'documento.pdf', data: buf });
    }
    if (!files.length) return res.status(404).json({ erro: 'não foi possível baixar os arquivos' });
    const zip = createZip(files);
    const nomeZip = `GEFIP_${ano}_${mes}_${String(obra).replace(/[^\w.\-]+/g, '_')}.zip`;
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${nomeZip}"`);
    res.send(zip);
  } catch (e) { next(e); }
});

// ---------- BOLETOS + PAGAMENTO DIÁRIO (financeiro; valores em REAIS -> centavos) ----------
const cents = (v) => Math.round((Number(v) || 0) * 100);
const CAT_GASTO = ['ALIMENTACAO', 'COMBUSTIVEL', 'MULTA', 'VALE_TRANSPORTE', 'CONSERTO_MAQUINA', 'MANUTENCAO_CARRO', 'FORNECEDOR', 'FOLHA', 'INSUMO', 'OUTRO'];
async function subirComprovante(prefixo, id, file) {
  if (!file || !USING_SUPABASE) return null;
  const safe = (file.originalname || 'comprovante').replace(/[^\w.\-]+/g, '_');
  const path = `comprovantes/${prefixo}/${id}_${Date.now()}_${safe}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file.buffer, { contentType: file.mimetype });
  if (error) throw error;
  const { data } = await supabase.storage.from(BUCKET).createSignedUrl(path, 60 * 60 * 24 * 365);
  return data?.signedUrl || path;
}

app.use('/api/boletos', requireAdmin);
app.get('/api/boletos', async (req, res, next) => {
  try { res.json(await db.listBoletos({ status: req.query.status, mes: req.query.mes })); }
  catch (e) { next(e); }
});
app.post('/api/boletos', async (req, res, next) => {
  try {
    const { descricao, vencimento } = req.body;
    if (!descricao) return res.status(400).json({ erro: 'descrição é obrigatória' });
    if (!vencimento) return res.status(400).json({ erro: 'vencimento é obrigatório' });
    res.status(201).json(await db.createBoleto({
      descricao, fornecedor: req.body.fornecedor || null, vencimento,
      valor: cents(req.body.valor), categoria: CAT_GASTO.includes(req.body.categoria) ? req.body.categoria : 'OUTRO',
      pago: false,
    }));
  } catch (e) { next(e); }
});
app.patch('/api/boletos/:id', async (req, res, next) => {
  try {
    const patch = {};
    for (const k of ['descricao', 'fornecedor', 'vencimento', 'data_pagamento']) if (req.body[k] !== undefined) patch[k] = req.body[k];
    if (req.body.valor !== undefined) patch.valor = cents(req.body.valor);
    if (req.body.categoria !== undefined) patch.categoria = CAT_GASTO.includes(req.body.categoria) ? req.body.categoria : 'OUTRO';
    if (req.body.pago !== undefined) { patch.pago = !!req.body.pago; if (patch.pago && !patch.data_pagamento) patch.data_pagamento = new Date().toISOString().slice(0, 10); }
    const b = await db.updateBoleto(req.params.id, patch);
    if (!b) return res.status(404).json({ erro: 'boleto não encontrado' });
    res.json(b);
  } catch (e) { next(e); }
});
app.post('/api/boletos/:id/comprovante', upload.single('arquivo'), async (req, res, next) => {
  try {
    const url = await subirComprovante('boletos', req.params.id, req.file);
    const b = await db.updateBoleto(req.params.id, { comprovante_url: url, pago: true, data_pagamento: new Date().toISOString().slice(0, 10) });
    if (!b) return res.status(404).json({ erro: 'boleto não encontrado' });
    res.json(b);
  } catch (e) { next(e); }
});
app.delete('/api/boletos/:id', async (req, res, next) => {
  try { res.json(await db.deleteBoleto(req.params.id)); }
  catch (e) { next(e); }
});

app.use('/api/pagamento-diario', requireAdmin);
app.get('/api/pagamento-diario', async (req, res, next) => {
  try { res.json(await db.pagamentoDiario(req.query.data || new Date().toISOString().slice(0, 10))); }
  catch (e) { next(e); }
});
app.get('/api/gastos/resumo', requireAdmin, async (req, res, next) => {
  try { res.json(await db.gastosPorCategoria(req.query.mes || new Date().toISOString().slice(0, 7))); }
  catch (e) { next(e); }
});

// ---------- CRONOGRAMA DIÁRIO (funções/diárias editáveis + alocação por obra/dia) ----------
app.use('/api/cronograma', requireAdmin);
app.get('/api/cronograma/funcoes', async (_req, res, next) => {
  try { res.json(await db.listFuncoes()); }
  catch (e) { next(e); }
});
app.post('/api/cronograma/funcao', async (req, res, next) => {
  try {
    if (!req.body.nome) return res.status(400).json({ erro: 'nome é obrigatório' });
    res.status(201).json(await db.createFuncao({ nome: req.body.nome, valor: cents(req.body.valor) }));
  } catch (e) { next(e); }
});
app.patch('/api/cronograma/funcao/:id', async (req, res, next) => {
  try {
    const patch = {};
    if (req.body.nome !== undefined) patch.nome = req.body.nome;
    if (req.body.valor !== undefined) patch.valor = cents(req.body.valor);
    const f = await db.updateFuncao(req.params.id, patch);
    if (!f) return res.status(404).json({ erro: 'função não encontrada' });
    res.json(f);
  } catch (e) { next(e); }
});
app.delete('/api/cronograma/funcao/:id', async (req, res, next) => {
  try { res.json(await db.deleteFuncao(req.params.id)); }
  catch (e) { next(e); }
});
// quadro do dia: obras + colaboradores + alocações
app.get('/api/cronograma', async (req, res, next) => {
  try {
    const data = req.query.data || new Date().toISOString().slice(0, 10);
    const [obras, colaboradores, alocacoes] = await Promise.all([
      db.listObras(), db.listColaboradores(), db.listAlocacoes({ data }),
    ]);
    const obrasAtivas = (obras || []).filter(o => o.coluna_kanban !== 'liquidado')
      .map(o => ({ id: o.id, cliente: o.cliente, endereco: o.endereco }));
    const colabs = (colaboradores || [])
      .filter(c => (c.status_colaborador || 'ATIVO') !== 'DESLIGADO')
      .map(c => ({ id: c.id, nome: c.nome, cargo: c.cargo }));
    const total = alocacoes.reduce((s, a) => s + (a.valor_diaria || 0), 0);
    res.json({ data, obras: obrasAtivas, colaboradores: colabs, alocacoes, total });
  } catch (e) { next(e); }
});
app.post('/api/cronograma/alocacao', async (req, res, next) => {
  try {
    const { data, colaborador_id } = req.body;
    if (!data || !colaborador_id) return res.status(400).json({ erro: 'data e colaborador são obrigatórios' });
    res.status(201).json(await db.createAlocacao({
      data, colaborador_id, colaborador_nome: req.body.colaborador_nome || null,
      obra_id: req.body.obra_id || null, obra_nome: req.body.obra_nome || null,
      funcao: req.body.funcao || null, valor_diaria: cents(req.body.valor_diaria),
    }));
  } catch (e) { next(e); }
});
app.patch('/api/cronograma/alocacao/:id', async (req, res, next) => {
  try {
    const patch = {};
    for (const k of ['obra_id', 'obra_nome', 'funcao', 'colaborador_id', 'colaborador_nome', 'data']) if (req.body[k] !== undefined) patch[k] = req.body[k];
    if (req.body.valor_diaria !== undefined) patch.valor_diaria = cents(req.body.valor_diaria);
    const a = await db.updateAlocacao(req.params.id, patch);
    if (!a) return res.status(404).json({ erro: 'alocação não encontrada' });
    res.json(a);
  } catch (e) { next(e); }
});
app.delete('/api/cronograma/alocacao/:id', async (req, res, next) => {
  try { res.json(await db.deleteAlocacao(req.params.id)); }
  catch (e) { next(e); }
});

// ---------- CATÁLOGO DE SERVIÇOS (descrição padrão + preço por unidade, em REAIS) ----------
const UNID_SERV = ['m2', 'ml', 'm3'];
app.use('/api/catalogo-servicos', requireAdmin);
app.get('/api/catalogo-servicos', async (_req, res, next) => {
  try { res.json(await db.listServicos()); }
  catch (e) { next(e); }
});
app.post('/api/catalogo-servicos', async (req, res, next) => {
  try {
    if (!req.body.nome) return res.status(400).json({ erro: 'nome é obrigatório' });
    res.status(201).json(await db.createServico({
      nome: req.body.nome, descricao: req.body.descricao || null,
      unidade: UNID_SERV.includes(req.body.unidade) ? req.body.unidade : 'm2',
      preco: Number(req.body.preco) || 0,
    }));
  } catch (e) { next(e); }
});
app.patch('/api/catalogo-servicos/:id', async (req, res, next) => {
  try {
    const patch = {};
    for (const k of ['nome', 'descricao']) if (req.body[k] !== undefined) patch[k] = req.body[k];
    if (req.body.unidade !== undefined) patch.unidade = UNID_SERV.includes(req.body.unidade) ? req.body.unidade : 'm2';
    if (req.body.preco !== undefined) patch.preco = Number(req.body.preco) || 0;
    const s = await db.updateServico(req.params.id, patch);
    if (!s) return res.status(404).json({ erro: 'serviço não encontrado' });
    res.json(s);
  } catch (e) { next(e); }
});
app.delete('/api/catalogo-servicos/:id', async (req, res, next) => {
  try { res.json(await db.deleteServico(req.params.id)); }
  catch (e) { next(e); }
});
app.use('/api/lancamentos-diarios', requireAdmin);
app.post('/api/lancamentos-diarios', async (req, res, next) => {
  try {
    const { descricao, data } = req.body;
    if (!descricao) return res.status(400).json({ erro: 'descrição é obrigatória' });
    res.status(201).json(await db.createLancDiario({
      data: data || new Date().toISOString().slice(0, 10), descricao,
      valor: cents(req.body.valor), categoria: CAT_GASTO.includes(req.body.categoria) ? req.body.categoria : 'OUTRO',
      forma: req.body.forma || 'PIX', pago: req.body.pago !== undefined ? !!req.body.pago : true,
      data_pagamento: (req.body.pago === false ? null : (data || new Date().toISOString().slice(0, 10))),
    }));
  } catch (e) { next(e); }
});
app.patch('/api/lancamentos-diarios/:id', async (req, res, next) => {
  try {
    const patch = {};
    for (const k of ['descricao', 'data', 'forma', 'data_pagamento']) if (req.body[k] !== undefined) patch[k] = req.body[k];
    if (req.body.valor !== undefined) patch.valor = cents(req.body.valor);
    if (req.body.categoria !== undefined) patch.categoria = CAT_GASTO.includes(req.body.categoria) ? req.body.categoria : 'OUTRO';
    if (req.body.pago !== undefined) { patch.pago = !!req.body.pago; if (patch.pago && !patch.data_pagamento) patch.data_pagamento = new Date().toISOString().slice(0, 10); }
    const l = await db.updateLancDiario(req.params.id, patch);
    if (!l) return res.status(404).json({ erro: 'lançamento não encontrado' });
    res.json(l);
  } catch (e) { next(e); }
});
app.post('/api/lancamentos-diarios/:id/comprovante', upload.single('arquivo'), async (req, res, next) => {
  try {
    const url = await subirComprovante('lancamentos', req.params.id, req.file);
    const l = await db.updateLancDiario(req.params.id, { comprovante_url: url, pago: true, data_pagamento: new Date().toISOString().slice(0, 10) });
    if (!l) return res.status(404).json({ erro: 'lançamento não encontrado' });
    res.json(l);
  } catch (e) { next(e); }
});
app.delete('/api/lancamentos-diarios/:id', async (req, res, next) => {
  try { res.json(await db.deleteLancDiario(req.params.id)); }
  catch (e) { next(e); }
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

// VT semanal — lista de edição inline
app.get('/api/dp/vt/semana', async (req, res, next) => {
  try {
    const ano_mes = req.query.ano_mes || new Date().toISOString().slice(0, 7);
    const semana = parseInt(req.query.semana, 10) || 1;
    res.json(await db.getVTSemana(ano_mes, semana));
  } catch (e) { next(e); }
});
app.post('/api/dp/vt/semana', async (req, res, next) => {
  try {
    const { colaborador_id, ano_mes, semana } = req.body;
    if (!colaborador_id || !ano_mes || !semana) return res.status(400).json({ erro: 'colaborador_id, ano_mes e semana são obrigatórios' });
    res.json(await db.upsertVTSemana(req.body));
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

// Cadastro de obra (valor em REAIS no corpo → centavos)
app.post('/api/financeiro/obra', async (req, res, next) => {
  try {
    const { cliente, endereco, metragem_m2, tipo_piso, valor_contrato } = req.body;
    if (!cliente) return res.status(400).json({ erro: 'cliente é obrigatório' });
    res.status(201).json(await db.createObra({
      cliente, endereco: endereco || null, tipo_piso: tipo_piso || null,
      metragem_m2: Number(metragem_m2) || 0,
      valor_contrato: Math.round((Number(valor_contrato) || 0) * 100),
    }));
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

// Bancos — desbloqueio da área protegida (senha financeira)
app.post('/api/bancos/desbloquear', (req, res) => {
  const esperada = process.env.FINANCE_PASSWORD || 'raspadora@fin';
  if (!req.body || req.body.senha !== esperada) return res.status(401).json({ ok: false, erro: 'Senha incorreta' });
  res.json({ ok: true });
});

// Bancos — saldos consolidados
app.get('/api/bancos/saldos', async (_req, res, next) => {
  try {
    const contas = await db.listContas();
    const total = contas.reduce((s, c) => s + c.saldo_atual, 0);
    res.json({ contas, total_consolidado: total });
  } catch (e) { next(e); }
});

// Bancos — cadastro de conta bancária (saldo inicial em REAIS → centavos)
app.post('/api/bancos/conta', async (req, res, next) => {
  try {
    const { nome_instituicao, tipo_conta } = req.body;
    if (!nome_instituicao) return res.status(400).json({ erro: 'nome_instituicao é obrigatório' });
    res.status(201).json(await db.createConta({
      nome_instituicao, tipo_conta: tipo_conta || 'Conta Corrente',
      agencia: req.body.agencia || null, conta: req.body.conta || null,
      saldo_atual: Math.round((Number(req.body.saldo_inicial) || 0) * 100),
      is_caixinha: req.body.is_caixinha === true || req.body.is_caixinha === 'true',
    }));
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

// ---------- GESTÃO DE DOCUMENTOS (padrão Inmeta) ----------
app.get('/api/documentos/colaboradores', async (req, res, next) => {
  try {
    res.json(await db.listColaboradoresDocs({
      empresa: req.query.empresa, q: req.query.q, status_colaborador: req.query.status_colaborador || null,
      pendencias: req.query.pendencias === 'true' || req.query.pendencias === '1',
    }));
  } catch (e) { next(e); }
});
app.get('/api/dp/colaborador/:id/documentos', async (req, res, next) => {
  try { res.json(await db.getDocsColaborador(req.params.id)); }
  catch (e) { next(e); }
});
app.get('/api/dp/colaborador/:id/resumo-docs', async (req, res, next) => {
  try {
    const r = await db.resumoColaboradorDocs(req.params.id);
    if (!r) return res.status(404).json({ erro: 'colaborador não encontrado' });
    res.json(r);
  } catch (e) { next(e); }
});
app.post('/api/documentos/:colaboradorId/upload', upload.single('arquivo'), async (req, res, next) => {
  try {
    const { codigo } = req.body;
    if (!codigo) return res.status(400).json({ erro: 'codigo é obrigatório' });
    let arquivo_url = null;
    if (req.file && USING_SUPABASE) {
      const safe = (req.file.originalname || 'doc').replace(/[^\w.\-]+/g, '_');
      const path = `docs/${req.params.colaboradorId}/${codigo}_${Date.now()}_${safe}`;
      const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, req.file.buffer, { contentType: req.file.mimetype });
      if (upErr) throw upErr;
      const { data: signed } = await supabase.storage.from(BUCKET).createSignedUrl(path, 60 * 60 * 24 * 365);
      arquivo_url = signed?.signedUrl || path;
    }
    const tem_vencimento = req.body.tem_vencimento === 'true' || req.body.tem_vencimento === '1' || req.body.tem_vencimento === true;
    res.status(201).json(await db.upsertDocColaborador(req.params.colaboradorId, {
      codigo, data_emissao: req.body.data_emissao || null, tem_vencimento,
      data_vencimento: req.body.data_vencimento || null, arquivo_url,
    }));
  } catch (e) { next(e); }
});
app.patch('/api/documentos/:docId/status', async (req, res, next) => {
  try {
    const { status_analise } = req.body;
    if (!['VALIDADO', 'NAO_VALIDADO', 'REPROVADO'].includes(status_analise)) return res.status(400).json({ erro: 'status_analise inválido' });
    res.json(await db.setStatusDoc(req.params.docId, status_analise));
  } catch (e) { next(e); }
});
app.get('/api/documentos/relatorio-pendencias', async (req, res, next) => {
  try {
    const lista = await db.listColaboradoresDocs({ empresa: req.query.empresa, pendencias: true });
    res.json({ total_pendentes: lista.length, colaboradores: lista });
  } catch (e) { next(e); }
});

// Dashboard financeiro consolidado
app.get('/api/dashboard', async (req, res, next) => {
  try { res.json(await db.dashboardFinanceiro(req.query.empresa || 'TODAS', req.query.periodo || 'mes')); }
  catch (e) { next(e); }
});

// ---------- WHATSAPP (Evolution API) ----------
app.post('/api/test-whatsapp', requireAdmin, async (req, res, next) => {
  try {
    const { number, message } = req.body;
    if (!number || !message) return res.status(400).json({ erro: 'number e message são obrigatórios' });
    const r = await sendTextMessage(number, message);
    res.status(r.success ? 200 : 502).json(r);
  } catch (e) { next(e); }
});

app.get('/api/health', (_req, res) => res.json({ ok: true, storage: USING_SUPABASE ? 'supabase' : 'mock', whatsapp: WHATSAPP_ON }));

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
