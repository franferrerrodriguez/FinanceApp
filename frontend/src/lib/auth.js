import { isSimpleAuthMode, isAuthEnabled as configAuthEnabled } from './authConfig';
import { mapAuthErrorToKey } from './authErrors';
import {
  clearSimpleAuthSession,
  loginSimpleAccount,
  registerSimpleAccount,
  restoreSimpleSession,
} from './simpleAuth';
import { syncUserDataOnAuth } from './syncUserDataOnAuth';
import { supabase, supabaseConfigured } from './supabase';

export function isAuthAvailable() {
  return configAuthEnabled();
}

export async function signUpWithEmail({ email, password }) {
  if (isSimpleAuthMode()) {
    return registerSimpleAccount({ email, password });
  }

  if (!supabaseConfigured || !supabase) {
    return { ok: false, errorCode: 'not_configured' };
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${window.location.origin}/`,
    },
  });

  if (error) {
    return { ok: false, errorCode: mapAuthErrorToKey(error), error };
  }

  const user = data?.user ?? data?.session?.user ?? null;
  const session = data?.session ?? null;

  if (session?.user) {
    const sync = await syncUserDataOnAuth(session.user.id);
    return {
      ok: true,
      user: session.user,
      email,
      needsEmailConfirmation: false,
      sync,
    };
  }

  if (user) {
    const needsEmailConfirmation =
      !session &&
      (Boolean(user.confirmation_sent_at) ||
        user.email_confirmed_at == null ||
        user.user_metadata?.email_verified === false);

    return {
      ok: true,
      user,
      email: user.email ?? email,
      needsEmailConfirmation,
      sync: { success: false, skipped: true },
    };
  }

  return { ok: false, errorCode: 'generic' };
}

export async function signInWithEmail({ email, password }) {
  if (isSimpleAuthMode()) {
    return loginSimpleAccount({ email, password });
  }

  if (!supabaseConfigured || !supabase) {
    return { ok: false, errorCode: 'not_configured' };
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { ok: false, errorCode: mapAuthErrorToKey(error), error };
  }

  const user = data.user;
  if (!user) {
    return { ok: false, errorCode: 'generic' };
  }

  const sync = await syncUserDataOnAuth(user.id);
  return { ok: true, user, sync };
}

export async function signOutFromSupabase() {
  if (isSimpleAuthMode()) {
    clearSimpleAuthSession();
    return;
  }

  if (supabaseConfigured && supabase) {
    await supabase.auth.signOut({ scope: 'local' });
  }
}

/** Restore session on reload (simple mode). */
export function bootstrapSimpleAuthSession() {
  return restoreSimpleSession();
}
