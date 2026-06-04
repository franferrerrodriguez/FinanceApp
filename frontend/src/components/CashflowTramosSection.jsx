import { useTranslation } from 'react-i18next';
import { FormFieldFrame } from './FormFieldFrame';
import { MonthKeyPicker } from './MonthKeyPicker';
import {
  createCashflowEntry,
  enrichCashflowEntry,
  getCurrentCashflowSegment,
  getCurrentMonthKey,
  isCurrentCashflowSegment,
} from '../lib/cashflowHistory';
import { resolveNumPagas } from '../lib/salary';
import { ui } from '../lib/uiClasses';
import { formatMoney, formatPercent } from '../utils/formatters';
import { MoneyField } from '../modules/onboarding/components/MoneyField';

const PAY_PRESETS = ['12', '14', 'other'];

const TRAMO_INPUT =
  `${ui.input} h-11 min-h-[2.75rem] w-full max-w-none py-2.5 text-sm`;

export function CashflowTramosSection({
  items,
  settings,
  onAdd,
  onUpdate,
  onRemove,
}) {
  const { t } = useTranslation();

  const sorted = [...items].sort((a, b) =>
    b.effectiveFrom.localeCompare(a.effectiveFrom),
  );

  const handleAdd = () => {
    const segment = getCurrentCashflowSegment(items) ?? settings;
    onAdd(
      createCashflowEntry(
        {
          effectiveFrom: getCurrentMonthKey(),
          monthlyNetSalary: segment?.monthlyNetSalary ?? 0,
          salaryPaysPreset: segment?.salaryPaysPreset ?? '12',
          numPagas: segment?.numPagas ?? 12,
          otherMonthlyIncome: segment?.otherMonthlyIncome ?? 0,
          expenses: segment?.expenses,
        },
        settings,
      ),
    );
  };

  return (
    <div className={ui.stackSection}>
      <div className={`border-b pb-3 ${ui.divider}`}>
        <h3 className={`text-base font-semibold ${ui.heading}`}>
          {t('balance.cashflow.tramosTitle')}
        </h3>
        <p className={`mt-1 text-sm ${ui.textMuted}`}>
          {t('balance.cashflow.tramosSubtitle')}
        </p>
      </div>

      <ul className={ui.stackBlocks}>
        {sorted.map((item) => {
          const preset = item.salaryPaysPreset ?? '12';
          const numPagas = resolveNumPagas(item);
          const isCurrent = isCurrentCashflowSegment(item, items);
          const canRemove = items.length > 1;
          const income = item.incomeMonthly ?? 0;
          const fixed = item.fixedExpensesMonthly ?? 0;
          const leisure = item.variableExpensesMonthly ?? 0;
          const savings = income - fixed - leisure;
          const savingsRate = income > 0 ? Math.max(0, savings / income) : 0;

          return (
            <li
              key={item.id}
              className={`${ui.block} p-4 sm:p-5`}
            >
              {isCurrent ? (
                <div className="mb-4">
                  <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide text-white dark:bg-emerald-500 dark:text-slate-950">
                    {t('balance.cashflow.salaryHistoryCurrent')}
                  </span>
                </div>
              ) : null}

              <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:items-start">
                <FormFieldFrame
                  label={t('balance.cashflow.salaryHistoryFrom')}
                  hint={t('balance.cashflow.tramoDateHint')}
                >
                  <MonthKeyPicker
                    compact
                    value={item.effectiveFrom}
                    onChange={(effectiveFrom) =>
                      onUpdate(
                        item.id,
                        enrichCashflowEntry(
                          { effectiveFrom },
                          item,
                          settings,
                        ),
                      )
                    }
                    ariaLabel={t('balance.cashflow.salaryHistoryFrom')}
                  />
                </FormFieldFrame>

                <MoneyField
                  id={`cashflow-salary-${item.id}`}
                  label={t('balance.cashflow.salaryNormalLabel')}
                  hint={t('balance.cashflow.salaryNormalHint')}
                  value={item.monthlyNetSalary ?? 0}
                  onChange={(monthlyNetSalary) =>
                    onUpdate(
                      item.id,
                      enrichCashflowEntry({ monthlyNetSalary }, item, settings),
                    )
                  }
                  required
                />

                <FormFieldFrame
                  label={t('balance.cashflow.salaryPaysLabel')}
                  hint={t('balance.cashflow.tramoPaysHint')}
                  controlClassName="min-w-0"
                >
                  <div className={`${ui.formFieldControl} flex flex-wrap items-center gap-2`}>
                    {PAY_PRESETS.map((value) => (
                      <label
                        key={value}
                        className={`inline-flex h-11 shrink-0 cursor-pointer items-center rounded-lg border px-3 text-sm ${
                          preset === value
                            ? 'border-emerald-500 bg-emerald-50 dark:border-emerald-500 dark:bg-emerald-950/40'
                            : ui.cardMuted
                        }`}
                      >
                        <input
                          type="radio"
                          name={`salary-pays-${item.id}`}
                          className="sr-only"
                          checked={preset === value}
                          onChange={() =>
                            onUpdate(
                              item.id,
                              enrichCashflowEntry(
                                {
                                  salaryPaysPreset: value,
                                  numPagas:
                                    value === '14'
                                      ? 14
                                      : value === '12'
                                        ? 12
                                        : item.numPagas ?? 12,
                                },
                                item,
                                settings,
                              ),
                            )
                          }
                        />
                        {t(`balance.cashflow.salaryPays.${value}`)}
                      </label>
                    ))}
                  </div>
                  {preset === 'other' ? (
                    <div className="mt-3 max-w-[6.5rem]">
                      <label
                        className={`mb-1 block text-xs font-medium ${ui.textLabel}`}
                      >
                        {t('balance.cashflow.salaryPaysCustom')}
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={24}
                        step={1}
                        value={item.numPagas ?? 12}
                        onChange={(e) =>
                          onUpdate(
                            item.id,
                            enrichCashflowEntry(
                              {
                                numPagas: Math.min(
                                  24,
                                  Math.max(1, parseInt(e.target.value, 10) || 12),
                                ),
                              },
                              item,
                              settings,
                            ),
                          )
                        }
                        className={`${TRAMO_INPUT} w-full`}
                      />
                    </div>
                  ) : null}
                </FormFieldFrame>
              </div>

              <div className="mt-4 grid grid-cols-1 items-start gap-4 sm:grid-cols-2">
                <MoneyField
                  id={`cashflow-other-${item.id}`}
                  label={t('onboarding.income.otherIncome')}
                  hint={t('onboarding.income.otherIncomeHint')}
                  value={item.otherMonthlyIncome ?? 0}
                  onChange={(otherMonthlyIncome) =>
                    onUpdate(
                      item.id,
                      enrichCashflowEntry({ otherMonthlyIncome }, item, settings),
                    )
                  }
                />
              </div>

              <p className={`mt-3 text-xs ${ui.textMuted}`}>
                {t('balance.cashflow.salaryHistoryEffective', {
                  amount: formatMoney(item.monthlyNetSalaryEffective ?? 0),
                })}
              </p>

              <div className="mt-3 grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
                <TramoStat
                  label={t('balance.cashflow.income')}
                  value={formatMoney(income)}
                />
                <TramoStat
                  label={t('balance.cashflow.fixed')}
                  value={formatMoney(fixed)}
                />
                <TramoStat
                  label={t('balance.cashflow.leisure')}
                  value={formatMoney(leisure)}
                />
                <TramoStat
                  label={t('balance.cashflow.savings')}
                  value={formatMoney(savings)}
                  sub={formatPercent(savingsRate)}
                />
              </div>

              {isCurrent ? (
                <p className={`mt-2 text-xs ${ui.textMuted}`}>
                  {t('balance.cashflow.tramosCurrentExpensesHint')}
                </p>
              ) : null}

              {canRemove ? (
                <button
                  type="button"
                  onClick={() => onRemove(item.id)}
                  className="mt-3 text-sm font-medium text-red-600 hover:underline dark:text-red-400"
                >
                  {t('balance.cashflow.salaryHistoryRemove')}
                </button>
              ) : null}
            </li>
          );
        })}
      </ul>

      <button
        type="button"
        onClick={handleAdd}
        className={`${ui.btnSecondary} w-full sm:w-auto`}
      >
        {t('balance.cashflow.salaryHistoryAdd')}
      </button>
    </div>
  );
}

function TramoStat({ label, value, sub }) {
  return (
    <div className={`min-w-0 px-3 py-2.5 ${ui.block}`}>
      <p className={ui.textMuted}>{label}</p>
      <p className={`font-semibold tabular-nums ${ui.heading}`}>{value}</p>
      {sub ? <p className={ui.textMuted}>{sub}</p> : null}
    </div>
  );
}
