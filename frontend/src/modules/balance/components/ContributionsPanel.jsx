import { useTranslation } from 'react-i18next';
import {
  CONTRIBUTION_CATEGORIES,
  PROVIDER_META,
  createContributionPlan,
  getPlanAnnualReturn,
  getTotalMonthlyContributions,
  getWeightedReturnSummary,
  hasActiveContributionAmounts,
} from '../../../lib/contributionPlans';
import {
  INVESTMENT_PROVIDER_IDS,
  INVESTMENT_PROVIDER_LEGACY_LABELS,
} from '../../../lib/investmentProviders';
import { InstitutionSelect } from '../../../components/InstitutionSelect';
import { SelectField } from '../../../components/SelectField';
import { INSTITUTION_OTHER_ID } from '../../../lib/institutions';
import { ui } from '../../../lib/uiClasses';
import { useFinanceData } from '../../../store/hooks';
import { formatMoney, formatPercent } from '../../../utils/formatters';

function pctToDisplay(decimal) {
  return Math.round((decimal ?? 0) * 1000) / 10;
}

function displayToPct(value) {
  const n = parseFloat(value);
  return Number.isFinite(n) ? n / 100 : null;
}

export function ContributionsPanel() {
  const { t } = useTranslation();
  const {
    settings,
    contributionPlans,
    addContributionPlan,
    updateContributionPlan,
    removeContributionPlan,
  } = useFinanceData();

  const total = getTotalMonthlyContributions(contributionPlans);
  const returnSummary = getWeightedReturnSummary(settings, contributionPlans);
  const hasAmounts = hasActiveContributionAmounts(contributionPlans);

  const handleAdd = () => {
    addContributionPlan(
      createContributionPlan({
        providerId: 'indexa',
        monthlyAmount: 0,
      }),
    );
  };

  return (
    <div className={ui.stackPage}>
      <div className={`${ui.chartCard} ${ui.stackSection}`}>
        <div>
          <h3 className={`text-base font-semibold ${ui.heading}`}>
            {t('balance.contributions.title')}
          </h3>
          <p className={`mt-1 text-sm ${ui.text}`}>
            {t('balance.contributions.subtitle')}
          </p>
        </div>

        <p
          className={`rounded-xl border px-4 py-3 text-sm ${ui.cardMuted}`}
        >
          {t('balance.contributions.scopeNote')}
        </p>

        <div className="grid gap-3 sm:grid-cols-2">
          <Stat
            label={t('balance.contributions.totalMonthly')}
            value={formatMoney(total)}
            hint={
              hasAmounts
                ? t('balance.contributions.totalMonthlyHint')
                : t('balance.contributions.totalMonthlyEmpty')
            }
          />
          {hasAmounts ? (
            <Stat
              label={t('balance.contributions.weightedReturn')}
              value={formatPercent(returnSummary.rate)}
              hint={t('balance.contributions.weightedReturnHint')}
            />
          ) : null}
        </div>
      </div>

      <section className={`${ui.chartCard} ${ui.stackSection}`}>
        <div className={`border-b pb-3 ${ui.divider}`}>
          <h3 className={`text-base font-semibold ${ui.heading}`}>
            {t('balance.contributions.plansTitle')}
          </h3>
          <p className={`mt-1 text-sm ${ui.textMuted}`}>
            {t('balance.contributions.plansSubtitle')}
          </p>
        </div>

        {contributionPlans.length === 0 ? (
          <div className={`px-6 py-8 text-center ${ui.cardDashed}`}>
            <p className={ui.text}>{t('balance.contributions.empty')}</p>
            <button
              type="button"
              className={`mt-4 ${ui.btnPrimary}`}
              onClick={handleAdd}
            >
              {t('balance.contributions.addFirst')}
            </button>
          </div>
        ) : (
          <ul className={ui.stackBlocks}>
            {contributionPlans.map((plan) => (
              <ContributionPlanCard
                key={plan.id}
                plan={plan}
                settings={settings}
                onChange={(patch) => updateContributionPlan(plan.id, patch)}
                onRemove={() => removeContributionPlan(plan.id)}
              />
            ))}
          </ul>
        )}

        {contributionPlans.length > 0 ? (
          <button type="button" className={ui.btnSecondary} onClick={handleAdd}>
            {t('balance.contributions.addAnother')}
          </button>
        ) : null}
      </section>
    </div>
  );
}

function ContributionPlanCard({ plan, settings, onChange, onRemove }) {
  const { t } = useTranslation();
  const planReturn = getPlanAnnualReturn(settings, plan);

  return (
    <li className={`${ui.block} ${ui.stackSection} p-4 sm:p-5`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={plan.isActive}
            onChange={(e) => onChange({ isActive: e.target.checked })}
            className="h-4 w-4 rounded border-slate-400 text-emerald-500 focus:ring-emerald-500/40"
          />
          <span className={`text-sm font-medium ${ui.textLabel}`}>
            {t('balance.contributions.active')}
          </span>
        </label>
        <button
          type="button"
          onClick={onRemove}
          className={`text-sm ${ui.textMuted} hover:text-red-500`}
        >
          {t('balance.contributions.remove')}
        </button>
      </div>

      <div className="grid grid-cols-1 items-start gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Field label={t('balance.contributions.provider')}>
          <InstitutionSelect
            institutionIds={INVESTMENT_PROVIDER_IDS}
            i18nKey="balance.providers"
            legacyMap={INVESTMENT_PROVIDER_LEGACY_LABELS}
            value={plan.providerId}
            optional={false}
            onChange={(providerId) => {
              const meta = PROVIDER_META[providerId] ?? PROVIDER_META.other;
              const patch = { providerId, category: meta.category };
              if (
                providerId === INSTITUTION_OTHER_ID &&
                plan.providerId !== INSTITUTION_OTHER_ID
              ) {
                patch.label = '';
              }
              onChange(patch);
            }}
          />
        </Field>

        {plan.providerId === INSTITUTION_OTHER_ID ? (
          <Field label={t('balance.contributions.providerCustom')}>
            <input
              type="text"
              value={plan.label ?? ''}
              placeholder={t('balance.contributions.providerCustomPlaceholder')}
              onChange={(e) => onChange({ label: e.target.value })}
              className={`${ui.input} w-full`}
            />
          </Field>
        ) : null}

        <Field label={t('balance.contributions.category')}>
          <SelectField
            variant="input"
            className="py-2.5"
            value={plan.category}
            onChange={(e) => onChange({ category: e.target.value })}
          >
            {CONTRIBUTION_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {t(`balance.contributionCategories.${cat}`)}
              </option>
            ))}
          </SelectField>
        </Field>

        {plan.providerId !== INSTITUTION_OTHER_ID ? (
          <Field label={t('balance.contributions.customLabel')}>
            <input
              type="text"
              value={plan.label ?? ''}
              placeholder={t(`balance.providers.${plan.providerId}`)}
              onChange={(e) => onChange({ label: e.target.value })}
              className={`${ui.input} ${ui.inputMedium}`}
            />
          </Field>
        ) : null}

        <Field label={t('balance.contributions.monthlyAmount')}>
          <input
            type="number"
            min={0}
            step="10"
            value={plan.monthlyAmount ?? 0}
            onChange={(e) =>
              onChange({
                monthlyAmount: Math.max(0, parseFloat(e.target.value) || 0),
              })
            }
            className={`${ui.input} ${ui.inputAmount}`}
          />
        </Field>

        <Field label={t('balance.contributions.growthMode')}>
          <SelectField
            variant="input"
            className="py-2.5"
            value={plan.growthMode ?? 'fixed'}
            onChange={(e) => onChange({ growthMode: e.target.value })}
          >
            <option value="fixed">{t('balance.contributions.growthFixed')}</option>
            <option value="ramp_monthly">
              {t('balance.contributions.growthRamp')}
            </option>
            <option value="annual_increase">
              {t('balance.contributions.growthAnnual')}
            </option>
          </SelectField>
        </Field>

        {plan.growthMode === 'ramp_monthly' ? (
          <Field label={t('balance.contributions.rampPerMonth')}>
            <input
              type="number"
              min={0}
              step="10"
              value={plan.rampPerMonth ?? 0}
              onChange={(e) =>
                onChange({
                  rampPerMonth: Math.max(0, parseFloat(e.target.value) || 0),
                })
              }
              className={`${ui.input} ${ui.inputAmount}`}
            />
          </Field>
        ) : null}

        {plan.growthMode === 'annual_increase' ? (
          <Field label={t('balance.contributions.annualIncrease')}>
            <PercentInput
              value={plan.annualIncrease ?? 0}
              onChange={(v) => onChange({ annualIncrease: v })}
            />
          </Field>
        ) : null}

        <Field
          label={t('balance.contributions.customReturn')}
          hint={t('balance.contributions.customReturnHint', {
            default: formatPercent(planReturn),
          })}
        >
          <PercentInput
            value={plan.customAnnualReturn}
            onChange={(v) => onChange({ customAnnualReturn: v })}
            allowEmpty
          />
        </Field>
      </div>
    </li>
  );
}

function Field({ label, hint, children }) {
  return (
    <label className="block">
      <span className={`mb-1.5 block text-sm font-medium ${ui.textLabel}`}>
        {label}
      </span>
      {hint ? (
        <span className={`mb-2 block text-xs ${ui.textMuted}`}>{hint}</span>
      ) : null}
      {children}
    </label>
  );
}

function PercentInput({ value, onChange, allowEmpty = false }) {
  const display =
    value == null && allowEmpty ? '' : pctToDisplay(value ?? 0);

  return (
    <div className="relative inline-block shrink-0">
      <input
        type="number"
        step="0.1"
        min={0}
        max={30}
        value={display}
        placeholder="—"
        onChange={(e) => {
          const raw = e.target.value;
          if (allowEmpty && raw === '') {
            onChange(null);
            return;
          }
          onChange(displayToPct(raw) ?? 0);
        }}
        className={`${ui.inputPercent} pr-7`}
      />
      <span
        className={`pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs ${ui.textMuted}`}
      >
        %
      </span>
    </div>
  );
}

function Stat({ label, value, hint }) {
  return (
    <div className={`${ui.block} px-3 py-2.5`}>
      <p className={`text-xs font-medium ${ui.textMuted}`}>{label}</p>
      <div className={`mt-1 text-lg font-bold ${ui.heading}`}>{value}</div>
      {hint ? <p className={`mt-1 text-xs ${ui.textMuted}`}>{hint}</p> : null}
    </div>
  );
}
