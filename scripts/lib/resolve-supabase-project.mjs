/** FinApp Supabase project (override with SUPABASE_PROJECT_REF). */
const FINAPP_PROJECT_REF = 'rzvtrvpcsttgtqcqarmh';

export function resolveSupabaseProjectRef() {
  const fromEnv = process.env.SUPABASE_PROJECT_REF?.trim();
  return fromEnv || FINAPP_PROJECT_REF;
}

export function resolveSupabasePoolerRegion() {
  const fromEnv = process.env.SUPABASE_DB_REGION?.trim();
  if (fromEnv) return fromEnv;

  if (resolveSupabaseProjectRef() === FINAPP_PROJECT_REF) {
    return 'eu-west-1';
  }

  return null;
}
