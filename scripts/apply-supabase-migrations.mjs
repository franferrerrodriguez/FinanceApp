/**
 * Apply SQL migrations to the remote Supabase project.
 * Usage (local only, never commit the password):
 *   SUPABASE_DB_PASSWORD='your-password' npm run db:migrate
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  connectSupabasePg,
  formatConnectionLabel,
} from './lib/supabase-pg.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

if (!process.env.SUPABASE_DB_PASSWORD) {
  console.error('Missing SUPABASE_DB_PASSWORD in the environment.');
  process.exit(1);
}

const migrationsDir = path.join(__dirname, '..', 'supabase', 'migrations');
const files = fs
  .readdirSync(migrationsDir)
  .filter((f) => f.endsWith('.sql'))
  .sort();

async function main() {
  const client = await connectSupabasePg();
  console.log(`Connected → ${formatConnectionLabel(client)}`);

  for (const file of files) {
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
    console.log(`→ ${file}`);
    await client.query(sql);
    console.log('  OK');
  }

  const { rows } = await client.query(`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    ORDER BY table_name
  `);
  console.log('public tables:', rows.map((r) => r.table_name).join(', '));
  await client.end();
}

main().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
