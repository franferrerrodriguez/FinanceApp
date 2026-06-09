import { useTranslation } from 'react-i18next';
import {
  computeMonthlyNetSalaryEffective,
  resolveNumPagas,
} from '../lib/salary';
import { ui } from '../lib/uiClasses';
import { formatMoney } from '../utils/formatters';
import { FormFieldFrame } from './FormFieldFrame';
import { TextField } from './TextField';
import { MoneyField } from './MoneyField';

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
          fullWidth
        />
      ) : null}

      <FormFieldFrame
        label={t('balance.cashflow.salaryPaysLabel')}
        hint={t('balance.cashflow.salaryPaysHint')}
        layout="stacked"
      >
        <div className="flex flex-wrap gap-2">
          {PAY_PRESETS.map((value) => (
            <label
              key={value}
              className={`${ui.choiceChip} ${
                preset === value ? ui.choiceChipActive : ui.choiceChipIdle
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
                    numPagas:
                      value === '14' ? 14 : value === '12' ? 12 : settings.numPagas ?? 12,
                  })
                }
              />
              {t(`balance.cashflow.salaryPays.${value}`)}
            </label>
          ))}
        </div>
      </FormFieldFrame>

      {preset === 'other' ? (
        <TextField
          id={`${idPrefix}-num-pagas`}
          label={t('balance.cashflow.salaryPaysCustom')}
          value={String(settings.numPagas ?? 12)}
          onChange={(raw) =>
            setSettings({
              numPagas: Math.min(24, Math.max(1, parseInt(raw, 10) || 12)),
            })
          }
          type="number"
          inputMode="numeric"
          min={1}
          max={24}
          narrow
          layout="stacked"
        />
      ) : null}

      <p className={`text-xs leading-relaxed ${ui.textMuted}`}>
        {t('balance.cashflow.salaryEffectiveHint', {
          amount: formatMoney(effective),
          count: numPagas,
        })}
      </p>
    </div>
  );
}
