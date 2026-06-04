import { useEffect } from 'react';
import i18n from '../i18n';
import { LOCALE_BCP47 } from '../i18n/config';
import {
  applyThemePreference,
  subscribeSystemTheme,
} from '../lib/theme';
import { useAppStore } from '../store/appStore';

/** Aplica locale y tema del store al DOM e i18n. */
export function useAppPreferencesSync() {
  const locale = useAppStore((s) => s.locale);
  const theme = useAppStore((s) => s.theme);

  useEffect(() => {
    if (i18n.language !== locale) {
      i18n.changeLanguage(locale);
    }
    document.documentElement.lang =
      LOCALE_BCP47[locale] ?? locale ?? 'es';
  }, [locale]);

  useEffect(() => {
    applyThemePreference(theme);

    if (theme !== 'system') return undefined;

    return subscribeSystemTheme(() => {
      applyThemePreference('system');
    });
  }, [theme]);
}
