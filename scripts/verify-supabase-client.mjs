/**
 * Verify URL + publishable key against the REST API (no DB password).
 * Reads frontend/.env when present.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, '..', 'frontend', '.env');

function loadEnv() {
  if (!fs.existsSync(envPath)) {
    console.error('frontend/.env does not exist');
    process.exit(1);
  }
  const vars = {};
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const i = t.indexOf('=');
    if (i > 0) vars[t.slice(0, i)] = t.slice(i + 1);
  }
  return vars;
}

const { VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY } = loadEnv();
const url = `${VITE_SUPABASE_URL.replace(/\/$/, '')}/rest/v1/profiles?select=count&limit=0`;

const res = await fetch(url, {
  headers: {
    apikey: VITE_SUPABASE_ANON_KEY,
    Authorization: `Bearer ${VITE_SUPABASE_ANON_KEY}`,
  },
});

if (res.status === 200 || res.status === 206) {
  console.log(
    'OK: REST API + publishable key (profiles reachable with RLS without session → may be []).',
  );
  process.exit(0);
}

console.error('API responded', res.status, await res.text());
process.exit(1);
