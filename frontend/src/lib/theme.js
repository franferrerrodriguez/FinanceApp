export const THEMES = ['light', 'dark', 'system'];

export const DEFAULT_THEME = 'system';

/** @returns {'light' | 'dark'} */
export function resolveTheme(theme) {
  if (theme === 'dark') return 'dark';
  if (theme === 'light') return 'light';
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  }
  return 'dark';
}

/** @param {'light' | 'dark'} resolved */
export function applyResolvedTheme(resolved) {
  const root = document.documentElement;
  root.classList.toggle('dark', resolved === 'dark');
  root.style.colorScheme = resolved;
}

export function applyThemePreference(theme) {
  applyResolvedTheme(resolveTheme(theme));
}

/**
 * Escucha cambios del SO cuando theme === 'system'.
 * @returns {() => void} cleanup
 */
export function subscribeSystemTheme(onChange) {
  if (typeof window === 'undefined' || !window.matchMedia) {
    return () => {};
  }

  const mq = window.matchMedia('(prefers-color-scheme: dark)');
  const handler = () => onChange(resolveTheme('system'));

  mq.addEventListener('change', handler);
  return () => mq.removeEventListener('change', handler);
}

export function normalizeTheme(theme) {
  return THEMES.includes(theme) ? theme : DEFAULT_THEME;
}
