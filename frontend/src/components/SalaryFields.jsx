import { useTranslation } from 'react-i18next';
import {
  computeMonthlyNetSalaryEffective,
  resolveNumPagas,
} from '../lib/salary';
import { ui } from '../lib/uiClasses';
import { formatMoney } from '../utils/formatters';
import { MoneyField } from '../modules/onboarding/components/MoneyField';

const PAY_PRESETS = ['12', '14', 'other'];

export function SalaryFields({
  settings,
  setSettings,
  idPrefix = 'salary',
  includeSalaryInput = true,
}) {
  const { t } = useTranslation();
  const preset = settings.salaryPaysPreset ?? '12';
  const effective = computeMonthlyNetSalaryEffective(settings);
  const numPagas = resolveNumPagas(settings);

  return (
    <div className="space-y-4">
      {includeSalaryInput ? (
        <MoneyField
          id={`${idPrefix}-monthly-salary`}
          label={t('balance.cashflow.salaryNormalLabel')}
          hint={t('balance.cashflow.salaryNormalHint')}
          value={settings.monthlyNetSalary}
          onChange={(v) => setSettings({ monthlyNetSalary: v })}
          required
        />
      ) : null}

      <fieldset>
        <legend className={`mb-2 block text-sm font-medium ${ui.textLabel}`}>
          {t('balance.cashflow.salaryPaysLabel')}
        </legend>
        <div className="flex flex-wrap gap-2">
          {PAY_PRESETS.map((value) => (
            <label
              key={value}
              className={`inline-flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
                preset === value
                  ? 'border-emerald-500 bg-emerald-50 dark:border-emerald-500 dark:bg-emerald-950/40'
                  : ui.cardMuted
              }`}
            >
              <input
                type="radio"
                name={`${idPrefix}-pays`}
                className="sr-only"
                checked={preset === value}
                onChange={() =>
                  setSettings({
                    salaryPaysPreset: value,
                    numPagas: value === '14' ? 14 : value === '12' ? 12 : settings.numPagas ?? 12,
                  })
                }
              />
              {t(`balance.cashflow.salaryPays.${value}`)}
            </label>
          ))}
        </div>
        {preset === 'other' ? (
          <div className="mt-3 max-w-[8rem]">
            <label className={`mb-1 block text-xs ${ui.textMuted}`}>
              {t('balance.cashflow.salaryPaysCustom')}
            </label>
            <input
              type="number"
              min={1}
              max={24}
              step={1}
              value={settings.numPagas ?? 12}
              onChange={(e) =>
                setSettings({
                  numPagas: Math.min(24, Math.max(1, parseInt(e.target.value, 10) || 12)),
                })
              }
              className={`${ui.input} ${ui.inputCompact} w-full`}
            />
          </div>
        ) : null}
      </fieldset>

      <p className={`text-xs ${ui.textMuted}`}>
        {t('balance.cashflow.salaryEffectiveHint', {
          amount: formatMoney(effective),
        })}
      </p>

      {preset === '14' ? (
        <p className={`text-xs ${ui.textMuted}`}>
          {t('balance.cashflow.salaryFourteenNote')}
        </p>
      ) : null}

      {preset === 'other' && numPagas !== 12 ? (
        <p className={`text-xs ${ui.textMuted}`}>
          {t('balance.cashflow.salaryOtherNote', { count: numPagas })}
        </p>
      ) : null}
    </div>
  );
}
