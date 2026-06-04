import { useTranslation } from 'react-i18next';
import { ui } from '../../../lib/uiClasses';
import { formatMoney } from '../../../utils/formatters';

const STATUS_BAR = {
  danger: 'bg-red-500',
  warn: 'bg-amber-500',
  good: 'bg-emerald-500',
  unavailable: 'bg-slate-300 dark:bg-slate-600',
};

const STATUS_TEXT = {
  danger: 'text-red-600 dark:text-red-400',
  warn: 'text-amber-600 dark:text-amber-400',
  good: 'text-emerald-600 dark:text-emerald-400',
  unavailable: ui.textMuted,
};

export function EmergencyFundCard({ emergencyFund }) {
  const { t } = useTranslation();
  const {
    status,
    hasSnapshots,
    liquid,
    monthsCovered,
    monthsTarget,
    targetAmount,
    progress,
  } = emergencyFund;

  if (!hasSnapshots) {
    return (
      <article className={ui.kpiCard}>
        <h3 className={`text-sm font-medium ${ui.textMuted}`}>
          {t('dashboard.emergencyFund.title')}
        </h3>
        <p className={`mt-3 text-sm ${ui.text}`}>
          {t('dashboard.emergencyFund.noSnapshots')}
        </p>
      </article>
    );
  }

  const barClass = STATUS_BAR[status] ?? STATUS_BAR.unavailable;
  const textClass = STATUS_TEXT[status] ?? STATUS_TEXT.unavailable;
  const pct = Math.round(progress * 100);

  return (
    <article className={ui.kpiCard}>
      <h3 className={`text-sm font-medium ${ui.textMuted}`}>
        {t('dashboard.emergencyFund.title')}
      </h3>

      <div
        className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={t('dashboard.emergencyFund.progressAria')}
      >
        <div
          className={`h-full rounded-full transition-all ${barClass}`}
          style={{ width: `${pct}%` }}
        />
      </div>

      <p className={`mt-3 text-sm font-medium ${textClass}`}>
        {t('dashboard.emergencyFund.have', {
          amount: formatMoney(liquid),
          months: formatMonthsCovered(monthsCovered),
        })}
      </p>
      <p className={`mt-1 text-sm ${ui.textMuted}`}>
        {t('dashboard.emergencyFund.target', {
          amount: formatMoney(targetAmount),
          months: monthsTarget,
        })}
      </p>
    </article>
  );
}

function formatMonthsCovered(value) {
  if (!Number.isFinite(value)) return '—';
  if (value >= 99) return '99+';
  return (Math.round(value * 10) / 10).toFixed(1).replace(/\.0$/, '');
}
