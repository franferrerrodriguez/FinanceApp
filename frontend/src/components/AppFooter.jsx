import { useTranslation } from 'react-i18next';

const CURRENT_YEAR = new Date().getFullYear();

export function AppFooter() {
  const { t } = useTranslation();

  return (
    <footer className="mt-12 py-8 pb-12 text-center">
      <div className="flex flex-col items-center justify-center gap-1">
        <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[var(--text-muted)]">
          {t('footer.poweredBy')}
        </p>
        <p className="text-sm font-semibold tracking-[-0.015em] text-[var(--text-secondary)]">
          {t('footer.brand')}
        </p>
        <p className="mt-2 text-[10px] font-medium tracking-[0.12em] text-[var(--text-muted)]">
          {t('footer.copyright', { year: CURRENT_YEAR })}
        </p>
      </div>
    </footer>
  );
}
