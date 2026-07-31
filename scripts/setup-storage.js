// Cria (idempotente) o bucket privado de documentos no Supabase Storage.
// Uso: npm run setup:storage   (precisa de .env com SUPABASE_URL + service role)
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const URL = process.env.SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
const BUCKET = process.env.SUPABASE_BUCKET || 'documentos';

if (!URL || !KEY) {
  console.error('✗ Configure SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env antes de rodar.');
  process.exit(1);
}

const supabase = createClient(URL, KEY, { auth: { persistSession: false } });

const { data: buckets, error: listErr } = await supabase.storage.listBuckets();
if (listErr) { console.error('✗ Erro ao listar buckets:', listErr.message); process.exit(1); }

if (buckets.some(b => b.name === BUCKET)) {
  console.log(`✓ Bucket "${BUCKET}" já existe.`);
} else {
  const { error } = await supabase.storage.createBucket(BUCKET, {
    public: false,                                  // privado — acesso só via signed URL
    fileSizeLimit: '10MB',
    allowedMimeTypes: ['application/pdf', 'image/png', 'image/jpeg', 'image/webp'],
  });
  if (error) { console.error('✗ Erro ao criar bucket:', error.message); process.exit(1); }
  console.log(`✓ Bucket privado "${BUCKET}" criado.`);
}
console.log('\nPronto. Documentos (CNH/ASO/EPI/comprovantes) serão armazenados aqui.');
