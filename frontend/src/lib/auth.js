import { migrateLocalToSupabase } from './migrateLocalToSupabase';
import { supabase, supabaseConfigured } from './supabase';

export function isAuthAvailable() {
  return supabaseConfigured && supabase != null;
}

export async function signUpWithEmail({ email, password }) {
  if (!isAuthAvailable()) {
    return { ok: false, errorCode: 'not_configured' };
  }

  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) {
    return { ok: false, errorCode: error.message, error };
  }

  const user = data.user;
  const session = data.session;

  if (session?.user) {
    const migration = await migrateLocalToSupabase(session.user.id);
    return {
      ok: true,
      user: session.user,
      needsEmailConfirmation: false,
      migration,
    };
  }

  if (user) {
    return {
      ok: true,
      user,
      needsEmailConfirmation: true,
      migration: { success: false, skipped: true },
    };
  }

  return { ok: false, errorCode: 'unknown' };
}

export async function signInWithEmail({ email, password }) {
  if (!isAuthAvailable()) {
    return { ok: false, errorCode: 'not_configured' };
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { ok: false, errorCode: error.message, error };
  }

  const user = data.user;
  if (!user) {
    return { ok: false, errorCode: 'unknown' };
  }

  const migration = await migrateLocalToSupabase(user.id);
  return { ok: true, user, migration };
}

export async function signOutFromSupabase() {
  if (isAuthAvailable()) {
    await supabase.auth.signOut();
  }
}
