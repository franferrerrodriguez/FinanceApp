import { useTranslation } from 'react-i18next';
import { createAnnualExpense } from '../lib/annualExpenses';
import { ui } from '../lib/uiClasses';
import { formatMoney } from '../utils/formatters';

const MONTH_OPTIONS = Array.from({ length: 12 }, (_, i) => i + 1);

export function AnnualExpensesSection({
  items,
  onAdd,
  onUpdate,
  onRemove,
}) {
  const { t } = useTranslation();

  return (
    <section className={`${ui.chartCard} ${ui.stackSection}`}>
      <div>
        <h3 className={`text-base font-semibold ${ui.heading}`}>
          {t('balance.cashflow.annualExpensesTitle')}
        </h3>
        <p className={`mt-1 text-sm ${ui.textMuted}`}>
          {t('balance.cashflow.annualExpensesSubtitle')}
        </p>
      </div>

      {items.length === 0 ? (
        <p className={`text-sm ${ui.textMuted}`}>
          {t('balance.cashflow.annualExpensesEmpty')}
        </p>
      ) : (
        <ul className={ui.stackBlocks}>
          {items.map((item) => (
            <li
              key={item.id}
              className={`${ui.block} ${ui.stackSection} p-4`}
            >
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <label className="block sm:col-span-2">
                  <span className={`mb-1 block text-xs font-medium ${ui.textLabel}`}>
                    {t('balance.cashflow.annualExpenseName')}
                  </span>
                  <input
                    type="text"
                    value={item.name}
                    onChange={(e) =>
                      onUpdate(item.id, { name: e.target.value })
                    }
                    placeholder={t('balance.cashflow.annualExpenseNamePlaceholder')}
                    className={`${ui.input} ${ui.inputCompact} ${ui.inputMedium}`}
                  />
                </label>
                <label className="block">
                  <span className={`mb-1 block text-xs font-medium ${ui.textLabel}`}>
                    {t('balance.cashflow.annualExpenseAmount')}
                  </span>
                  <input
                    type="number"
                    min={0}
                    step="1"
                    value={item.amount ?? 0}
                    onChange={(e) =>
                      onUpdate(item.id, {
                        amount: Math.max(0, parseFloat(e.target.value) || 0),
                      })
                    }
                    className={`${ui.input} ${ui.inputCompact} ${ui.inputAmount}`}
                  />
                </label>
                <label className="block">
                  <span className={`mb-1 block text-xs font-medium ${ui.textLabel}`}>
                    {t('balance.cashflow.annualExpenseMonth')}
                  </span>
                  <select
                    value={item.month ?? 1}
                    onChange={(e) =>
                      onUpdate(item.id, {
                        month: parseInt(e.target.value, 10),
                      })
                    }
                    className={`${ui.input} ${ui.inputCompact} ${ui.inputNarrow}`}
                  >
                    {MONTH_OPTIONS.map((m) => (
                      <option key={m} value={m}>
                        {t(`common.months.${m}`)}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <button
                type="button"
                onClick={() => onRemove(item.id)}
                className={`mt-2 text-sm font-medium text-red-600 hover:underline dark:text-red-400`}
              >
                {t('balance.cashflow.annualExpenseRemove')}
              </button>
            </li>
          ))}
        </ul>
      )}

      <button
        type="button"
        onClick={() => onAdd(createAnnualExpense())}
        className={`${ui.btnSecondary} w-full sm:w-auto`}
      >
        {t('balance.cashflow.annualExpenseAdd')}
      </button>
    </section>
  );
}

export function AnnualExpensesSummaryLine({ yearlyTotal, monthlyAvg }) {
  const { t } = useTranslation();
  if (yearlyTotal <= 0) return null;
  return (
    <p className={`text-sm ${ui.textMuted}`}>
      {t('dashboard.annualExpensesSummary', {
        yearly: formatMoney(yearlyTotal),
        monthly: formatMoney(monthlyAvg),
      })}
    </p>
  );
}
