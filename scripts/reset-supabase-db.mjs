/**
 * Full Supabase reset: drop app tables, delete all auth users, re-apply migrations.
 *
 * Usage (local only, never commit the password):
 *   SUPABASE_DB_PASSWORD='...' SUPABASE_DB_RESET_CONFIRM=yes npm run db:reset
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

if (process.env.SUPABASE_DB_RESET_CONFIRM !== 'yes') {
  console.error(
    'Destructive operation. Set SUPABASE_DB_RESET_CONFIRM=yes to proceed.',
  );
  process.exit(1);
}

const resetSql = `
DROP TABLE IF EXISTS monthly_snapshots CASCADE;
DROP TABLE IF EXISTS push_subscriptions CASCADE;
DROP TABLE IF EXISTS assets CASCADE;
DROP TABLE IF EXISTS liabilities CASCADE;
DROP TABLE IF EXISTS user_settings CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DELETE FROM auth.users;
`;

const migrationsDir = path.join(__dirname, '..', 'supabase', 'migrations');
const migrationFiles = fs
  .readdirSync(migrationsDir)
  .filter((file) => file.endsWith('.sql'))
  .sort();

async function main() {
  const client = await connectSupabasePg();
  console.log(`Connected → ${formatConnectionLabel(client)}`);
  console.log('→ Resetting public schema + auth users…');
  await client.query(resetSql);
  console.log('  OK (tables dropped, auth.users cleared)');

  for (const file of migrationFiles) {
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
    console.log(`→ ${file}`);
    await client.query(sql);
    console.log('  OK');
  }

  const { rows: tables } = await client.query(`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    ORDER BY table_name
  `);
  const { rows: users } = await client.query(
    'SELECT COUNT(*)::int AS count FROM auth.users',
  );

  console.log('public tables:', tables.map((row) => row.table_name).join(', '));
  console.log('auth.users:', users[0]?.count ?? 0);
  console.log('Reset complete.');
  await client.end();
}

main().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
