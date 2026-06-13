import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { EmergencyFundStatus } from './EmergencyFundStatus';
import {
  buildEmergencyFundMonthOptions,
  calcMonthlyExpenseBaseline,
  computeEmergencyFundMetrics,
  EMERGENCY_FUND_RECOMMENDED_MONTHS,
} from '../lib/emergencyFund';
import { ui } from '../lib/uiClasses';
import { formatMoney } from '../utils/formatters';

export function EmergencyFundSection({
  settings,
  setSettings,
  annualExpenses,
  snapshots = [],
  assets = [],
}) {
  const { t } = useTranslation();
  const months = settings.emergencyFundMonths ?? EMERGENCY_FUND_RECOMMENDED_MONTHS;

  const monthOptions = useMemo(
    () => buildEmergencyFundMonthOptions(months),
    [months],
  );

  const monthlyExpenses = useMemo(
    () => calcMonthlyExpenseBaseline(settings, annualExpenses),
    [settings, annualExpenses],
  );

  const metrics = useMemo(
    () =>
      computeEmergencyFundMetrics({
        settings,
        snapshots,
        assets,
        annualExpenses,
      }),
    [settings, snapshots, assets, annualExpenses],
  );

  const target = monthlyExpenses * months;

  return (
    <section className={`${ui.chartCard} ${ui.stackSection}`}>
      <div>
        <h3 className={`text-base font-semibold ${ui.heading}`}>
          {t('balance.cashflow.emergencyFundTitle')}
        </h3>
        <p className={`mt-1 text-sm ${ui.textMuted}`}>
          {t('balance.cashflow.emergencyFundSubtitle')}
        </p>
      </div>

      <fieldset>
        <legend className={`mb-2 block text-sm font-medium ${ui.textLabel}`}>
          {t('balance.cashflow.emergencyFundMonthsLabel')}
        </legend>
        <div className="flex flex-wrap gap-2">
          {monthOptions.map((value) => {
            const selected = months === value;
            const recommended = value === EMERGENCY_FUND_RECOMMENDED_MONTHS;

            return (
              <label
                key={value}
                className={`inline-flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm ${
                  selected
                    ? '[border:0.5px_solid_var(--accent)] bg-[rgba(29,158,117,0.10)]'
                    : ui.cardMuted
                }`}
              >
                <input
                  type="radio"
                  name="emergency-fund-months"
                  className="sr-only"
                  checked={selected}
                  onChange={() => setSettings({ emergencyFundMonths: value })}
                />
                <span className="inline-flex flex-wrap items-center gap-1.5">
                  {t('balance.cashflow.emergencyFundMonthsOption', { count: value })}
                  {recommended ? (
                    <span
                      className={`rounded-full px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide ${
                        selected
                          ? 'bg-[var(--accent)] text-white'
                          : 'bg-[var(--accent-muted)] text-[var(--accent)]'
                      }`}
                    >
                      {t('balance.cashflow.emergencyFundMonthsRecommended')}
                    </span>
                  ) : null}
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      <div
        className={`${ui.block} [border-color:rgba(29,158,117,0.35)] bg-[rgba(29,158,117,0.10)] px-4 py-4`}
        aria-live="polite"
      >
        <p
          className="text-xs font-semibold uppercase tracking-wide text-[var(--color-positive)]"
        >
          {t('balance.cashflow.emergencyFundTargetLabel')}
        </p>
        <p className={`mt-1 text-2xl font-bold tabular-nums tracking-tight ${ui.heading}`}>
          {formatMoney(target)}
        </p>
        <p className={`mt-1.5 text-sm ${ui.text}`}>
          {t('balance.cashflow.emergencyFundTargetBreakdown', {
            months,
            monthly: formatMoney(monthlyExpenses),
          })}
        </p>
      </div>

      <EmergencyFundStatus metrics={metrics} variant="inline" />
    </section>
  );
}
