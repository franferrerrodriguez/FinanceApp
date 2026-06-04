import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { PercentRow } from '../../../components/PercentRow';
import { SelectField } from '../../../components/SelectField';
import { normalizeProjectionYears } from '../../../lib/constants';
import { ui } from '../../../lib/uiClasses';
import { useSettings } from '../../../store/hooks';

const YEAR_OPTIONS = Array.from({ length: 50 }, (_, i) => i + 1);
const RETURN_PERCENT_OPTIONS = Array.from({ length: 15 }, (_, i) => i + 1);

export function ProjectionSettingsPanel() {
  const { t } = useTranslation();
  const { settings, setSettings } = useSettings();

  const years = normalizeProjectionYears(settings.projectionYears);
  const yearOptions = useMemo(() => {
    const set = new Set(YEAR_OPTIONS);
    set.add(years);
    return [...set].sort((a, b) => a - b);
  }, [years]);

  const useReal = settings.useRealReturn !== false;
  const storedReturn = useReal
    ? settings.indexFundRealReturn ?? 0.04
    : settings.indexFundNominalReturn ?? 0.06;
  const returnPercent = Math.min(
    15,
    Math.max(1, Math.round(storedReturn * 100)),
  );
  const returnOptions = useMemo(() => {
    const set = new Set(RETURN_PERCENT_OPTIONS);
    set.add(returnPercent);
    return [...set].sort((a, b) => a - b);
  }, [returnPercent]);

  return (
    <section className={ui.chartCard}>
      <h3 className={`mb-1 text-base font-semibold ${ui.heading}`}>
        {t('projection.settings.title')}
      </h3>
      <p className={`mb-4 text-sm ${ui.textMuted}`}>
        {t('projection.settings.hint')}
      </p>

      <div className="grid max-w-2xl gap-5 sm:grid-cols-3">
        <label className="block">
          <span className={`mb-1.5 block text-sm font-medium ${ui.textLabel}`}>
            {t('projection.settings.years')}
          </span>
          <SelectField
            value={years}
            onChange={(e) =>
              setSettings({ projectionYears: Number(e.target.value) })
            }
            aria-label={t('projection.settings.years')}
          >
            {yearOptions.map((y) => (
              <option key={y} value={y}>
                {t('projection.settings.yearsOption', { years: y })}
              </option>
            ))}
          </SelectField>
        </label>

        <label className="block">
          <span className={`mb-1.5 block text-sm font-medium ${ui.textLabel}`}>
            {t('projection.settings.annualReturn')}
          </span>
          <SelectField
            value={returnPercent}
            onChange={(e) => {
              const pct = Number(e.target.value) / 100;
              setSettings(
                useReal
                  ? { indexFundRealReturn: pct }
                  : { indexFundNominalReturn: pct },
              );
            }}
            aria-label={t('projection.settings.annualReturn')}
          >
            {returnOptions.map((pct) => (
              <option key={pct} value={pct}>
                {t('projection.settings.annualReturnOption', { percent: pct })}
              </option>
            ))}
          </SelectField>
        </label>

        <label className="block">
          <span className={`mb-1.5 block text-sm font-medium ${ui.textLabel}`}>
            {t('projection.settings.returnMode')}
          </span>
          <SelectField
            value={useReal ? 'real' : 'nominal'}
            onChange={(e) =>
              setSettings({ useRealReturn: e.target.value === 'real' })
            }
            aria-label={t('projection.settings.returnMode')}
            title={t('projection.settings.returnModeTooltip')}
          >
            <option value="real">{t('projection.settings.realReturn')}</option>
            <option value="nominal">{t('projection.settings.nominalReturn')}</option>
          </SelectField>
          <p className={`mt-1.5 text-xs leading-snug ${ui.textMuted}`}>
            {useReal
              ? t('projection.settings.realReturnHint')
              : t('projection.settings.nominalReturnHint')}
          </p>
        </label>
      </div>

      <div className={`mt-5 max-w-2xl border-t pt-5 ${ui.divider}`}>
        <PercentRow
          label={t('projection.settings.expenseIncrease')}
          hint={t('projection.settings.expenseIncreaseHint')}
          value={settings.projectionAnnualExpenseIncrease}
          onChange={(v) =>
            setSettings({ projectionAnnualExpenseIncrease: v })
          }
        />
      </div>
    </section>
  );
}
