/**
 * Apply SQL migrations to the remote Supabase project.
 * Usage (local only, never commit the password):
 *   SUPABASE_DB_PASSWORD='your-password' node scripts/apply-supabase-migrations.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRef = process.env.SUPABASE_PROJECT_REF ?? 'ceduxgxizgkyiexkdyqp';
const password = process.env.SUPABASE_DB_PASSWORD;

if (!password) {
  console.error('Missing SUPABASE_DB_PASSWORD in the environment.');
  process.exit(1);
}

const client = new pg.Client({
  host: `db.${projectRef}.supabase.co`,
  port: 5432,
  user: 'postgres',
  password,
  database: 'postgres',
  ssl: { rejectUnauthorized: false },
});

const migrationsDir = path.join(__dirname, '..', 'supabase', 'migrations');
const files = fs
  .readdirSync(migrationsDir)
  .filter((f) => f.endsWith('.sql'))
  .sort();

async function main() {
  await client.connect();
  console.log(`Connected to db.${projectRef}.supabase.co`);

  for (const file of files) {
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
    console.log(`→ ${file}`);
    await client.query(sql);
    console.log(`  OK`);
  }

  const { rows } = await client.query(`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    ORDER BY table_name
  `);
  console.log('public tables:', rows.map((r) => r.table_name).join(', '));
}

main()
  .catch((err) => {
    console.error('Error:', err.message);
    process.exit(1);
  })
  .finally(() => client.end());
