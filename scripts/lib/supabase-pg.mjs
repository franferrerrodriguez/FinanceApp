import pg from 'pg';
import {
  resolveSupabasePoolerRegion,
  resolveSupabaseProjectRef,
} from './resolve-supabase-project.mjs';

const DEFAULT_POOLER_REGIONS =
  'eu-west-1,eu-central-1,eu-west-2,eu-west-3,eu-north-1,us-east-1,us-west-1,ap-southeast-1';

export function getSupabaseProjectRef() {
  return resolveSupabaseProjectRef();
}

export function getSupabasePgConfig(connection = {}) {
  const projectRef = resolveSupabaseProjectRef();
  const password = process.env.SUPABASE_DB_PASSWORD;
  const region = connection.region ?? resolveSupabasePoolerRegion();
  const host = region
    ? `aws-0-${region}.pooler.supabase.com`
    : `aws-0-eu-west-1.pooler.supabase.com`;

  return {
    host,
    port: Number(process.env.SUPABASE_DB_PORT ?? connection.port ?? 5432),
    user: `postgres.${projectRef}`,
    password,
    database: process.env.SUPABASE_DB_NAME ?? 'postgres',
    ssl: { rejectUnauthorized: false },
  };
}

/** Connect via Supabase session pooler (IPv4-friendly). */
export async function connectSupabasePg() {
  const password = process.env.SUPABASE_DB_PASSWORD;
  if (!password) {
    throw new Error('Missing SUPABASE_DB_PASSWORD');
  }

  const projectRef = resolveSupabaseProjectRef();
  const preferredRegion = resolveSupabasePoolerRegion();
  const regions = preferredRegion
    ? [preferredRegion]
    : (process.env.SUPABASE_DB_REGIONS ?? DEFAULT_POOLER_REGIONS)
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean);
  const ports = (process.env.SUPABASE_DB_PORTS ?? '5432,6543')
    .split(',')
    .map((value) => Number(value.trim()))
    .filter((value) => Number.isFinite(value) && value > 0);

  let lastError;
  for (const region of regions) {
    for (const port of ports) {
      const client = new pg.Client({
        host: `aws-0-${region}.pooler.supabase.com`,
        port,
        user: `postgres.${projectRef}`,
        password,
        database: 'postgres',
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 10_000,
      });
      try {
        await client.connect();
        await client.query('SELECT 1');
        client.__financiaConnectionLabel = `${region}:${port}`;
        return client;
      } catch (error) {
        lastError = error;
        try {
          await client.end();
        } catch {
          /* ignore */
        }
      }
    }
  }

  throw lastError ?? new Error('Could not connect to Supabase pooler');
}

export function formatConnectionLabel(client) {
  const projectRef = resolveSupabaseProjectRef();
  const label = client?.__financiaConnectionLabel ?? 'pooler';
  return `${projectRef} (${label})`;
}
