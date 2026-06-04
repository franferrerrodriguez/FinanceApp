import { useEffect } from 'react';
import { isAuthAvailable } from '../lib/auth';
import { supabase } from '../lib/supabase';
import { useAppStore } from '../store/appStore';

/** Restaura sesión Supabase y sincroniza user en el store. */
export function useSupabaseSession() {
  const setUser = useAppStore((s) => s.setUser);
  const logout = useAppStore((s) => s.logout);

  useEffect(() => {
    if (!isAuthAvailable()) return undefined;

    let cancelled = false;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (cancelled) return;
      if (session?.user) {
        setUser(session.user);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
      } else {
        logout();
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [setUser, logout]);
}
