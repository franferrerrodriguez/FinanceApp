/** supabase = Supabase Auth (email). simple = local account, no emails or OAuth. */
export function getAuthMode() {
  const mode = import.meta.env.VITE_AUTH_MODE ?? 'supabase';
  return mode === 'simple' ? 'simple' : 'supabase';
}

export function isSimpleAuthMode() {
  return getAuthMode() === 'simple';
}

export function isAuthEnabled() {
  if (isSimpleAuthMode()) return true;
  return Boolean(
    import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY,
  );
}
