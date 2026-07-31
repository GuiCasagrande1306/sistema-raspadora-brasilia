// Vincula os usuários do Supabase Auth aos perfis (role) na tabela profiles.
// Rode DEPOIS de criar os 3 usuários no painel (Authentication → Add user).
// Uso: npm run setup:profiles
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const URL = process.env.SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
if (!URL || !KEY) { console.error('✗ Configure SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env'); process.exit(1); }

const sb = createClient(URL, KEY, { auth: { persistSession: false } });

// Ajuste nomes/roles aqui se necessário
const USERS = [
  { email: 'maressa@raspadorabrasilia.com.br', nome: 'Maressa', role: 'ADMIN' },
  { email: 'barbara@raspadorabrasilia.com.br', nome: 'Barbara', role: 'ADMIN' },
  { email: 'tablet@raspadorabrasilia.com.br',  nome: 'Tablet',  role: 'OPERACIONAL' },
];

const { data, error } = await sb.auth.admin.listUsers({ perPage: 1000 });
if (error) { console.error('✗ Erro ao listar usuários:', error.message); process.exit(1); }
const users = data.users || [];

let faltando = 0;
for (const u of USERS) {
  const found = users.find(x => (x.email || '').toLowerCase() === u.email.toLowerCase());
  if (!found) { console.log('✗ ainda NÃO existe no Auth:', u.email, '(crie no painel primeiro)'); faltando++; continue; }
  const { error: e } = await sb.from('profiles').upsert(
    { id: found.id, nome: u.nome, email: u.email, role: u.role }, { onConflict: 'id' });
  console.log(e ? `✗ ${u.email}: ${e.message}` : `✓ perfil vinculado: ${u.nome} — ${u.role}`);
}
console.log(faltando ? `\n${faltando} usuário(s) faltando no Auth. Crie-os e rode de novo.` : '\nTodos os perfis vinculados. ✅');
