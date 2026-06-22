import { createContext, useCallback, useContext, useMemo, useState } from 'react';

const AuthModalContext = createContext(null);

export function AuthModalProvider({ children }) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState('signup');

  const openRegister = useCallback(() => {
    setMode('signup');
    setOpen(true);
  }, []);

  const openLogin = useCallback(() => {
    setMode('login');
    setOpen(true);
  }, []);

  const closeAuthModal = useCallback(() => setOpen(false), []);

  const value = useMemo(
    () => ({
      open,
      mode,
      setMode,
      openRegister,
      openLogin,
      closeAuthModal,
    }),
    [open, mode, openRegister, openLogin, closeAuthModal],
  );

  return (
    <AuthModalContext.Provider value={value}>
      {children}
    </AuthModalContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuthModal() {
  const ctx = useContext(AuthModalContext);
  if (!ctx) {
    throw new Error('useAuthModal must be used within AuthModalProvider');
  }
  return ctx;
}
