// Executa o supabase/schema.sql direto no Postgres do Supabase.
// Uso: DATABASE_URL="postgresql://..." npm run migrate
//   ou defina DATABASE_URL no .env
// Pegue a connection string em: Supabase → Project Settings → Database → Connection string (URI).
import 'dotenv/config';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('✗ Defina DATABASE_URL (Supabase → Project Settings → Database → Connection string / URI).');
  process.exit(1);
}

const sql = readFileSync(path.join(__dirname, '..', 'supabase', 'schema.sql'), 'utf8');
const client = new pg.Client({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });

try {
  await client.connect();
  await client.query(sql);
  console.log('✓ Schema aplicado com sucesso (tabelas + seed).');
} catch (e) {
  console.error('✗ Erro ao aplicar schema:', e.message);
  process.exitCode = 1;
} finally {
  await client.end();
}
