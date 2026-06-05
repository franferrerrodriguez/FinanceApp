import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react';
import { ToastStack } from '../components/ToastStack';

const ToastContext = createContext(null);

const DEFAULT_DURATION_MS = 3200;

let toastId = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timersRef = useRef(new Map());

  const dismiss = useCallback((id) => {
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (variant, message, duration = DEFAULT_DURATION_MS) => {
      const id = ++toastId;
      setToasts((prev) => [...prev.slice(-4), { id, variant, message }]);
      const timer = setTimeout(() => dismiss(id), duration);
      timersRef.current.set(id, timer);
      return id;
    },
    [dismiss],
  );

  const toast = useMemo(
    () => ({
      success: (message) => push('success', message),
      error: (message) => push('error', message, 4500),
      info: (message) => push('info', message),
    }),
    [push],
  );

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <ToastStack toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return ctx;
}

/** Cloud save without success toast; surfaces save errors only. */
export async function saveToCloudQuiet({ toast, t, saveFn }) {
  if (!saveFn) return { ok: true };
  const result = await saveFn();
  if (result && result.ok === false) {
    toast.error(t('toast.saveError'));
  }
  return result;
}

/** Success toast for explicit actions + optional cloud save; surfaces save errors. */
export async function notifyAfterSave({ toast, t, actionKey, saveFn }) {
  if (actionKey) toast.success(t(actionKey));
  return saveToCloudQuiet({ toast, t, saveFn });
}
