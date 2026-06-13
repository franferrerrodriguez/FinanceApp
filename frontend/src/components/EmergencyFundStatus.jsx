import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { BALANCE_TAB, balancePath } from '../lib/balanceTabs';
import { ui } from '../lib/uiClasses';
import { formatMoney } from '../utils/formatters';

const STATUS_BAR = {
  danger: 'bg-[var(--color-negative)]',
  warn: 'bg-[var(--color-warning)]',
  good: 'bg-[var(--color-positive)]',
  unavailable: 'bg-[var(--text-disabled)]',
};

const STATUS_TEXT = {
  danger: 'text-[var(--color-negative)]',
  warn: 'text-[var(--color-warning)]',
  good: 'text-[var(--color-positive)]',
  unavailable: ui.textMuted,
};

const STATUS_BOX = {
  danger: '[border:0.5px_solid_rgba(226,75,74,0.30)] bg-[rgba(226,75,74,0.10)]',
  warn: '[border:0.5px_solid_rgba(239,159,39,0.30)] bg-[rgba(239,159,39,0.10)]',
  good: '[border:0.5px_solid_rgba(29,158,117,0.35)] bg-[rgba(29,158,117,0.10)]',
  unavailable: ui.cardMuted,
};

export function EmergencyFundStatus({ metrics, variant = 'card' }) {
  const { t } = useTranslation();
  const {
    status,
    hasLiquidData,
    hasLiquidAssets,
    liquid,
    monthsCovered,
    monthsTarget,
    targetAmount,
    progress,
    shortfall,
  } = metrics;

  if (!hasLiquidData) {
    const messageKey = hasLiquidAssets
      ? 'balance.cashflow.emergencyFundNoBalances'
      : 'balance.cashflow.emergencyFundNoAccounts';

    if (variant === 'card') {
      return (
        <article className={ui.kpiCard}>
          <h3 className={`text-sm font-medium ${ui.textMuted}`}>
            {t('dashboard.emergencyFund.title')}
          </h3>
          <p className={`mt-3 text-sm ${ui.text}`}>{t(messageKey)}</p>
          <PatrimonyLink className="mt-3" />
        </article>
      );
    }

    return (
      <div className={`rounded-xl border px-4 py-4 ${STATUS_BOX.unavailable}`}>
        <p className={`text-xs font-semibold uppercase tracking-wide ${ui.textMuted}`}>
          {t('balance.cashflow.emergencyFundStatusLabel')}
        </p>
        <p className={`mt-2 text-sm ${ui.text}`}>{t(messageKey)}</p>
        <PatrimonyLink className="mt-3" />
      </div>
    );
  }

  const barClass = STATUS_BAR[status] ?? STATUS_BAR.unavailable;
  const textClass = STATUS_TEXT[status] ?? STATUS_TEXT.unavailable;
  const boxClass = STATUS_BOX[status] ?? STATUS_BOX.unavailable;
  const pct = Math.round(progress * 100);

  const progressBlock = (
    <>
      <div
        className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-[rgba(255,255,255,0.08)]"
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
      {status === 'good' ? (
        <p className={`mt-2 text-sm ${textClass}`}>
          {t('balance.cashflow.emergencyFundOnTrack')}
        </p>
      ) : shortfall > 0 ? (
        <p className={`mt-2 text-sm ${textClass}`}>
          {t('balance.cashflow.emergencyFundShortfall', {
            amount: formatMoney(shortfall),
          })}
        </p>
      ) : null}
      <p className={`mt-2 text-xs ${ui.textMuted}`}>
        {t('balance.cashflow.emergencyFundLiquidHint')}
      </p>
    </>
  );

  if (variant === 'card') {
    return (
      <article className={ui.kpiCard}>
        <h3 className={`text-sm font-medium ${ui.textMuted}`}>
          {t('dashboard.emergencyFund.title')}
        </h3>
        {progressBlock}
      </article>
    );
  }

  return (
    <div className={`rounded-xl border px-4 py-4 ${boxClass}`}>
      <p
        className={`text-xs font-semibold uppercase tracking-wide ${
          status === 'good'
            ? 'text-[var(--color-positive)]'
            : status === 'unavailable'
              ? ui.textMuted
              : textClass
        }`}
      >
        {t('balance.cashflow.emergencyFundStatusLabel')}
      </p>
      {progressBlock}
    </div>
  );
}

function PatrimonyLink({ className = '' }) {
  const { t } = useTranslation();
  return (
    <Link
      to={balancePath(BALANCE_TAB.PATRIMONY)}
      className={`inline-block text-sm font-semibold text-[var(--accent)] underline-offset-2 hover:underline ${className}`}
    >
      {t('balance.cashflow.emergencyFundViewPatrimony')}
    </Link>
  );
}

function formatMonthsCovered(value) {
  if (!Number.isFinite(value)) return '—';
  if (value >= 99) return '99+';
  return (Math.round(value * 10) / 10).toFixed(1).replace(/\.0$/, '');
}
