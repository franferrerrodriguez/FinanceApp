import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabaseConfigured = Boolean(url && anonKey);

const projectRef = url?.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1] ?? 'financia';

/**
 * JWT session in localStorage (sb-…-auth-token key), not in Zustand.
 * persistSession + autoRefreshToken keep the user signed in on return.
 */
export const supabase = supabaseConfigured
  ? createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: `sb-${projectRef}-auth-token`,
      },
    })
  : null;
