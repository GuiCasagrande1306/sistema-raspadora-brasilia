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
