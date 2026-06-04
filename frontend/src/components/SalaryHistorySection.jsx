import { useTranslation } from 'react-i18next';
import { createSalaryHistoryEntry, enrichSalaryHistoryEntry } from '../lib/salaryHistory';
import { ui } from '../lib/uiClasses';
import { formatMoney } from '../utils/formatters';

const PAY_PRESETS = ['12', '14', 'other'];

export function SalaryHistorySection({
  items,
  onAdd,
  onUpdate,
  onRemove,
}) {
  const { t } = useTranslation();

  const sorted = [...items].sort((a, b) =>
    b.effectiveFrom.localeCompare(a.effectiveFrom),
  );

  return (
    <section className={`mt-6 space-y-4 border-t pt-6 ${ui.divider}`}>
      <div>
        <h4 className={`text-sm font-semibold ${ui.heading}`}>
          {t('balance.cashflow.salaryHistoryTitle')}
        </h4>
        <p className={`mt-1 text-sm ${ui.textMuted}`}>
          {t('balance.cashflow.salaryHistorySubtitle')}
        </p>
      </div>

      {sorted.length === 0 ? (
        <p className={`text-sm ${ui.textMuted}`}>
          {t('balance.cashflow.salaryHistoryEmpty')}
        </p>
      ) : (
        <ul className="space-y-3">
          {sorted.map((item) => (
            <li
              key={item.id}
              className={`rounded-xl border p-3 ${ui.cardMuted}`}
            >
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <label className="block">
                  <span className={`mb-1 block text-xs font-medium ${ui.textLabel}`}>
                    {t('balance.cashflow.salaryHistoryFrom')}
                  </span>
                  <input
                    type="month"
                    value={item.effectiveFrom}
                    onChange={(e) =>
                      onUpdate(item.id, {
                        effectiveFrom: e.target.value || item.effectiveFrom,
                      })
                    }
                    className={`${ui.input} ${ui.inputCompact} w-full`}
                  />
                </label>
                <label className="block">
                  <span className={`mb-1 block text-xs font-medium ${ui.textLabel}`}>
                    {t('balance.cashflow.salaryNormalLabel')}
                  </span>
                  <input
                    type="number"
                    min={0}
                    step="1"
                    value={item.monthlyNetSalary ?? 0}
                    onChange={(e) => {
                      const monthlyNetSalary = Math.max(
                        0,
                        parseFloat(e.target.value) || 0,
                      );
                      onUpdate(
                        item.id,
                        enrichSalaryHistoryEntry(
                          { monthlyNetSalary },
                          item,
                        ),
                      );
                    }}
                    className={`${ui.input} ${ui.inputCompact} w-full`}
                  />
                </label>
                <label className="block">
                  <span className={`mb-1 block text-xs font-medium ${ui.textLabel}`}>
                    {t('balance.cashflow.salaryPaysLabel')}
                  </span>
                  <select
                    value={item.salaryPaysPreset ?? '12'}
                    onChange={(e) => {
                      const salaryPaysPreset = e.target.value;
                      onUpdate(
                        item.id,
                        enrichSalaryHistoryEntry(
                          {
                            salaryPaysPreset,
                            numPagas:
                              salaryPaysPreset === '14'
                                ? 14
                                : salaryPaysPreset === '12'
                                  ? 12
                                  : item.numPagas ?? 12,
                          },
                          item,
                        ),
                      );
                    }}
                    className={`${ui.input} ${ui.inputCompact} w-full`}
                  >
                    {PAY_PRESETS.map((p) => (
                      <option key={p} value={p}>
                        {t(`balance.cashflow.salaryPays.${p}`)}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <p className={`mt-2 text-xs ${ui.textMuted}`}>
                {t('balance.cashflow.salaryHistoryEffective', {
                  amount: formatMoney(item.monthlyNetSalaryEffective ?? 0),
                })}
              </p>
              <button
                type="button"
                onClick={() => onRemove(item.id)}
                className="mt-2 text-sm font-medium text-red-600 hover:underline dark:text-red-400"
              >
                {t('balance.cashflow.salaryHistoryRemove')}
              </button>
            </li>
          ))}
        </ul>
      )}

      <button
        type="button"
        onClick={() => onAdd(createSalaryHistoryEntry())}
        className={`${ui.btnSecondary} w-full sm:w-auto`}
      >
        {t('balance.cashflow.salaryHistoryAdd')}
      </button>
    </section>
  );
}
