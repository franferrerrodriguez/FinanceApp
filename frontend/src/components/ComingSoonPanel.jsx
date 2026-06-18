import { useTranslation } from 'react-i18next';
import { ui } from '../lib/uiClasses';

export function ComingSoonPanel() {
  const { t } = useTranslation();
  return (
    <div className={`flex flex-col items-center justify-center gap-3 rounded-2xl border px-8 py-16 text-center ${ui.divider} ${ui.block}`}>
      <span className="text-3xl">🚧</span>
      <p className={`font-semibold ${ui.heading}`}>{t('common.comingSoon')}</p>
      <p className={`max-w-xs text-sm ${ui.textMuted}`}>{t('common.comingSoonHint')}</p>
    </div>
  );
}
