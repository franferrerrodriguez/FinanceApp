import { useTranslation } from 'react-i18next';
import { ui } from '../lib/uiClasses';
import { formatMoney, formatPercent } from '../utils/formatters';
import { HelpTooltip } from './HelpTooltip';

function SummaryRow({ label, amount, tone = 'default', emphasis = false }) {
  const amountClass =
    tone === 'income'
      ? 'text-[var(--color-positive)]'
      : tone === 'expense'
        ? ui.text
        : emphasis
          ? ui.heading
          : ui.textLabel;

  return (
    <div
      className={`flex items-baseline justify-between gap-4 tabular-nums text-sm ${
        emphasis ? `border-t pt-2 font-semibold ${ui.divider}` : ''
      }`}
    >
      <span className={emphasis ? ui.heading : ui.textMuted}>{label}</span>
      <span className={`shrink-0 font-medium ${amountClass}`}>
        {formatMoney(amount)}
      </span>
    </div>
  );
}

function RateRow({ label, rate, help, helpAria }) {
  return (
    <div className="flex items-center justify-between gap-4 text-xs tabular-nums">
      <span className={`flex items-center gap-1 ${ui.textMuted}`}>
        {label}
        {help ? <HelpTooltip ariaLabel={helpAria ?? label}>{help}</HelpTooltip> : null}
      </span>
      <span className={`font-medium ${ui.textLabel}`}>{formatPercent(rate)}</span>
    </div>
  );
}

export function CashflowSummaryBreakdown({ totals }) {
  const { t } = useTranslation();

  return (
    <div className={`rounded-xl border px-4 py-4 ${ui.cardMuted}`}>
      <SummaryRow
        label={t('balance.cashflow.breakdown.income')}
        amount={totals.income}
        tone="income"
      />
      <div className="mt-2 space-y-1.5">
        <SummaryRow
          label={t('balance.cashflow.breakdown.coreFixed')}
          amount={-totals.coreFixed}
          tone="expense"
        />
        <SummaryRow
          label={t('balance.cashflow.breakdown.groceries')}
          amount={-totals.groceries}
          tone="expense"
        />
        <SummaryRow
          label={t('balance.cashflow.breakdown.leisure')}
          amount={-totals.leisure}
          tone="expense"
        />
      </div>
      <div className={`mt-3 space-y-1 border-t pt-3 ${ui.divider}`}>
        <SummaryRow
          label={t('balance.cashflow.breakdown.grossSavings')}
          amount={totals.grossSavings}
          emphasis
        />
        <RateRow
          label={t('balance.cashflow.breakdown.grossSavingsRate')}
          rate={totals.grossSavingsRate}
          help={t('balance.cashflow.breakdown.grossSavingsRateHelp')}
          helpAria={t('balance.cashflow.breakdown.grossSavingsRateHelpAria')}
        />
      </div>
      {totals.investment > 0 ? (
        <div className="mt-2 space-y-1.5">
          <SummaryRow
            label={t('balance.cashflow.breakdown.investment')}
            amount={-totals.investment}
            tone="expense"
          />
          <RateRow
            label={t('balance.cashflow.breakdown.investmentRate')}
            rate={totals.investmentRate}
          />
        </div>
      ) : null}
      <div className={`mt-3 space-y-1 border-t pt-3 ${ui.divider}`}>
        <SummaryRow
          label={t('balance.cashflow.freeCashflow')}
          amount={totals.savings}
          emphasis
        />
        <RateRow
          label={t('balance.cashflow.breakdown.freeCashflowRate')}
          rate={totals.savingsRate}
          help={t('balance.cashflow.breakdown.freeCashflowRateHelp')}
          helpAria={t('balance.cashflow.breakdown.freeCashflowRateHelpAria')}
        />
      </div>
    </div>
  );
}
