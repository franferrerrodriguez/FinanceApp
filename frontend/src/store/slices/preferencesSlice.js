import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from '../../i18n/config';
import { DEFAULT_THEME, normalizeTheme } from '../../lib/theme';

export const createPreferencesSlice = (set) => ({
  locale: DEFAULT_LOCALE,
  theme: DEFAULT_THEME,

  setLocale: (locale) => {
    const next = SUPPORTED_LOCALES.includes(locale) ? locale : DEFAULT_LOCALE;
    set({ locale: next });
  },

  setTheme: (theme) => set({ theme: normalizeTheme(theme) }),
});
