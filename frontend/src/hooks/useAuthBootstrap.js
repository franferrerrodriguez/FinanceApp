import { useEffect } from 'react';
import { bootstrapSimpleAuthSession, isAuthAvailable } from '../lib/auth';
import { isSimpleAuthMode } from '../lib/authConfig';
import { supabase } from '../lib/supabase';
import { syncUserDataOnAuth } from '../lib/syncUserDataOnAuth';
import { useAppStore } from '../store/appStore';

/**
 * Simple mode: session in localStorage (no Supabase Auth).
 * Supabase mode: JWT in localStorage via Supabase.
 */
export function useAuthBootstrap() {
  const setUser = useAppStore((s) => s.setUser);
  const logout = useAppStore((s) => s.logout);

  useEffect(() => {
    if (!isAuthAvailable()) {
      useAppStore.setState({ authBootstrapped: true });
      return undefined;
    }

    if (isSimpleAuthMode()) {
      const user = bootstrapSimpleAuthSession();
      if (user) {
        setUser(user);
        useAppStore.setState({ cloudSyncStatus: 'ready' });
      }
      useAppStore.setState({ authBootstrapped: true });
      return undefined;
    }

    let cancelled = false;
    const lastSyncedUserId = { current: null };

    const applySession = async (session) => {
      if (cancelled) return;

      if (!session?.user) {
        lastSyncedUserId.current = null;
        if (useAppStore.getState().user) logout();
        return;
      }

      setUser(session.user);

      if (lastSyncedUserId.current === session.user.id) return;
      lastSyncedUserId.current = session.user.id;
      await syncUserDataOnAuth(session.user.id);
    };

    supabase.auth
      .getSession()
      .then(({ data: { session } }) => applySession(session))
      .finally(() => {
        useAppStore.setState({ authBootstrapped: true });
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'INITIAL_SESSION') return;
      applySession(session);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [setUser, logout]);
}
