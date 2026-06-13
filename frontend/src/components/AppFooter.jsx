import { useTranslation } from 'react-i18next';

const CURRENT_YEAR = new Date().getFullYear();

export function AppFooter() {
  const { t } = useTranslation();

  return (
    <footer className="relative mt-12 overflow-hidden py-8 pb-12 text-center">
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-900/10 to-transparent dark:from-black/20"
        aria-hidden="true"
      />

      <div className="relative z-10 flex flex-col items-center justify-center gap-1">
        <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-gray-600 dark:text-gray-400">
          {t('footer.poweredBy')}
        </p>
        <p className="text-sm font-semibold tracking-[-0.015em] bg-gradient-to-r from-gray-700 to-gray-500 bg-clip-text text-transparent dark:from-gray-200 dark:to-gray-400">
          {t('footer.brand')}
        </p>
        <p className="mt-2 text-[10px] font-medium tracking-[0.12em] text-gray-600 dark:text-gray-400">
          {t('footer.copyright', { year: CURRENT_YEAR })}
        </p>
      </div>
    </footer>
  );
}
