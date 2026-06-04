import { useTranslation } from 'react-i18next';
import { PercentRow } from '../../../components/PercentRow';
import { DEFAULT_SETTINGS, PROJECTION_SCENARIOS } from '../../../lib/constants';
import { ui } from '../../../lib/uiClasses';
import { useSettings } from '../../../store/hooks';

export function FinancialParamsSection() {
  const { t } = useTranslation();
  const { settings, setSettings } = useSettings();
  const useReal = settings.useRealReturn !== false;

  const applyScenario = (key) => {
    const patch = PROJECTION_SCENARIOS[key];
    if (patch) setSettings(patch);
  };

  const restoreDefaults = () => {
    setSettings({
      indexFundNominalReturn: DEFAULT_SETTINGS.indexFundNominalReturn,
      indexFundRealReturn: DEFAULT_SETTINGS.indexFundRealReturn,
      useRealReturn: DEFAULT_SETTINGS.useRealReturn,
      expectedInflation: DEFAULT_SETTINGS.expectedInflation,
      pensionPlanReturn: DEFAULT_SETTINGS.pensionPlanReturn,
      savingsAccountReturn: DEFAULT_SETTINGS.savingsAccountReturn,
      annualSalaryIncrease: DEFAULT_SETTINGS.annualSalaryIncrease,
    });
  };

  return (
    <section className={ui.chartCard}>
      <h2 className={`text-base font-semibold ${ui.heading}`}>
        {t('account.financial.title')}
      </h2>
      <p className={`mt-1 text-sm ${ui.textMuted}`}>{t('account.financial.hint')}</p>

      <div
        className={`mt-4 flex flex-wrap gap-2 rounded-lg border p-2 ${ui.menuInnerBorder}`}
        role="group"
        aria-label={t('account.financial.scenarios')}
      >
        {(['conservative', 'moderate', 'optimistic']).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => applyScenario(key)}
            className={ui.scenarioChip}
          >
            {t(`account.financial.scenario.${key}`)}
          </button>
        ))}
      </div>

      <div
        className={`mt-4 grid gap-1 rounded-lg border px-3 ${ui.menuInnerBorder}`}
        role="group"
        aria-label={t('account.financial.returnMode')}
      >
        <ReturnModeOption
          active={useReal}
          label={t('account.financial.returnReal')}
          hint={t('account.financial.returnRealHint')}
          onClick={() => setSettings({ useRealReturn: true })}
        />
        <ReturnModeOption
          active={!useReal}
          label={t('account.financial.returnNominal')}
          hint={t('account.financial.returnNominalHint')}
          onClick={() => setSettings({ useRealReturn: false })}
        />
      </div>

      <div className={`mt-4 divide-y ${ui.divider}`}>
        <PercentRow
          label={t('account.financial.indexFunds')}
          hint={
            useReal
              ? t('account.financial.indexFundsRealHint')
              : t('account.financial.indexFundsNominalHint')
          }
          value={
            useReal
              ? settings.indexFundRealReturn
              : settings.indexFundNominalReturn
          }
          onChange={(v) =>
            setSettings(
              useReal
                ? { indexFundRealReturn: v }
                : { indexFundNominalReturn: v },
            )
          }
        />
        <PercentRow
          label={t('account.financial.inflation')}
          hint={t('account.financial.inflationHint')}
          value={settings.expectedInflation}
          onChange={(v) => setSettings({ expectedInflation: v })}
        />
        <PercentRow
          label={t('account.financial.pension')}
          hint={t('account.financial.pensionHint')}
          value={settings.pensionPlanReturn}
          onChange={(v) => setSettings({ pensionPlanReturn: v })}
        />
        <PercentRow
          label={t('account.financial.savings')}
          hint={t('account.financial.savingsHint')}
          value={settings.savingsAccountReturn}
          onChange={(v) => setSettings({ savingsAccountReturn: v })}
        />
        <PercentRow
          label={t('account.financial.salaryIncrease')}
          hint={t('account.financial.salaryIncreaseHint')}
          value={settings.annualSalaryIncrease}
          onChange={(v) => setSettings({ annualSalaryIncrease: v })}
        />
      </div>

      <button
        type="button"
        onClick={restoreDefaults}
        className={`mt-4 text-sm font-medium text-emerald-700 transition hover:text-emerald-600 dark:text-emerald-400 dark:hover:text-emerald-300`}
      >
        {t('account.financial.restoreDefaults')}
      </button>
    </section>
  );
}

function ReturnModeOption({ active, label, hint, onClick }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`flex w-full flex-col items-start rounded-md px-3 py-2.5 text-left transition ${
        active
          ? 'bg-emerald-500/15 ring-1 ring-emerald-500/40'
          : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'
      }`}
    >
      <span className={`text-sm font-medium ${ui.textLabel}`}>{label}</span>
      <span className={`mt-0.5 text-xs ${ui.textMuted}`}>{hint}</span>
    </button>
  );
}
