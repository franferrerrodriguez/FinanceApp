import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { SelectField } from '../../../components/SelectField';
import { BALANCE_TAB, balancePath } from '../../../lib/balanceTabs';
import { PROJECTION_CONTRIBUTION_ASSUMPTION } from '../../../lib/contributionProjection';
import { normalizeProjectionYears } from '../../../lib/constants';
import { getCurrentMonthKey } from '../../../lib/dashboardMetrics';
import { getCurrentPatrimonySummary } from '../../../lib/patrimony';
import { ui } from '../../../lib/uiClasses';
import { useFinanceData } from '../../../store/hooks';
import { formatMoney } from '../../../utils/formatters';

const YEAR_OPTIONS = Array.from({ length: 50 }, (_, i) => i + 1);

export function ProjectionSettingsPanel() {
  const { t } = useTranslation();
  const { settings, setSettings, snapshots } = useFinanceData();
  const patrimonySummary = useMemo(
    () => getCurrentPatrimonySummary(snapshots, getCurrentMonthKey()),
    [snapshots],
  );
  const patrimonyNetWorth = patrimonySummary.hasClose
    ? Math.max(0, patrimonySummary.netWorth ?? 0)
    : null;
  const hasSnapshotPatrimony = patrimonyNetWorth != null && patrimonyNetWorth > 0;

  const years = normalizeProjectionYears(settings.projectionYears);
  const yearOptions = useMemo(() => {
    const set = new Set(YEAR_OPTIONS);
    set.add(years);
    return [...set].sort((a, b) => a - b);
  }, [years]);

  return (
    <section id="projection-settings" className={ui.chartCard}>
      <h3 className={`mb-1 text-base font-semibold ${ui.heading}`}>
        {t('projection.settings.title')}
      </h3>
      <p className={`mb-4 text-sm ${ui.textMuted}`}>
        {t('projection.settings.hint')}
      </p>

      {hasSnapshotPatrimony ? (
        <p
          className={`mb-5 rounded-xl border px-4 py-3 text-sm ${ui.cardMuted}`}
        >
          {t('projection.settings.snapshotsPriority', {
            amount: formatMoney(patrimonyNetWorth),
          })}{' '}
          <Link
            to={balancePath(BALANCE_TAB.PATRIMONY)}
            className="font-medium text-emerald-600 hover:underline dark:text-emerald-400"
          >
            {t('projection.settings.goPatrimony')}
          </Link>
        </p>
      ) : (
        <div className="mb-5 max-w-md space-y-2">
          <label className="block">
            <span className={`mb-1.5 block text-sm font-medium ${ui.textLabel}`}>
              {t('projection.settings.initialPatrimony')}
            </span>
            <span className={`mb-2 block text-xs leading-snug ${ui.textMuted}`}>
              {t('projection.settings.initialPatrimonyHint')}
            </span>
            <input
              type="number"
              min={0}
              step="100"
              value={settings.initialPatrimony ?? 0}
              onChange={(e) =>
                setSettings({
                  initialPatrimony: Math.max(0, parseFloat(e.target.value) || 0),
                })
              }
              className={`${ui.input} ${ui.inputAmount} w-full`}
            />
          </label>
          {patrimonyNetWorth != null ? (
            <button
              type="button"
              className={`${ui.btnSecondary} text-sm`}
              onClick={() => setSettings({ initialPatrimony: patrimonyNetWorth })}
            >
              {t('projection.settings.usePatrimonyClose', {
                amount: formatMoney(patrimonyNetWorth),
              })}
            </button>
          ) : (
            <p className={`text-xs ${ui.textMuted}`}>
              {t('projection.settings.noPatrimonyClose')}{' '}
              <Link
                to={balancePath(BALANCE_TAB.PATRIMONY)}
                className="font-medium text-emerald-600 hover:underline dark:text-emerald-400"
              >
                {t('projection.settings.goPatrimony')}
              </Link>
            </p>
          )}
        </div>
      )}

      <label className="mt-5 block max-w-md">
        <span className={`mb-1.5 block text-sm font-medium ${ui.textLabel}`}>
          {t('projection.settings.contributionAssumption')}
        </span>
        <span className={`mb-2 block text-xs leading-snug ${ui.textMuted}`}>
          {t('projection.settings.contributionAssumptionHint')}
        </span>
        <SelectField
          value={
            settings.projectionContributionAssumption ??
            PROJECTION_CONTRIBUTION_ASSUMPTION.AVERAGE_3
          }
          onChange={(e) =>
            setSettings({ projectionContributionAssumption: e.target.value })
          }
          aria-label={t('projection.settings.contributionAssumption')}
        >
          <option value={PROJECTION_CONTRIBUTION_ASSUMPTION.AVERAGE_3}>
            {t('projection.settings.contributionAssumptionAverage')}
          </option>
          <option value={PROJECTION_CONTRIBUTION_ASSUMPTION.LAST_MONTH}>
            {t('projection.settings.contributionAssumptionLastMonth')}
          </option>
        </SelectField>
        <Link
          to={balancePath(BALANCE_TAB.CONTRIBUTIONS)}
          className="mt-2 inline-block text-xs font-medium text-emerald-600 hover:underline dark:text-emerald-400"
        >
          {t('projection.settings.goContributions')}
        </Link>
      </label>

      <label className="block max-w-xs">
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

      <p className={`mt-6 rounded-xl border px-4 py-3 text-sm ${ui.cardMuted}`}>
        {t('projection.settings.assetReturnsHint')}{' '}
        <Link
          to={balancePath(BALANCE_TAB.PATRIMONY)}
          className="font-medium text-emerald-600 hover:underline dark:text-emerald-400"
        >
          {t('projection.settings.goPatrimony')}
        </Link>
      </p>
    </section>
  );
}
