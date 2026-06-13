import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { KpiCard } from '../../../components/KpiCard';
import { MoneyField } from '../../../components/MoneyField';
import { MoneyInput } from '../../../components/MoneyInput';
import { resolveMortgageAmortization } from '../../../lib/amortization';
import { AmortizationScheduleTable } from './AmortizationScheduleTable';
import {
  buildInitialBucketState,
  computeWeightedPortfolioReturn,
} from '../../../lib/projectionBuckets';
import { parseMoneyEuros } from '../../../lib/money';
import { ui } from '../../../lib/uiClasses';
import { useFinanceData, usePreferences } from '../../../store/hooks';
import {
  formatMoney,
  formatRateInputValue,
  formatRatePercent,
} from '../../../utils/formatters';

const PORTFOLIO_TOLERANCE = 0.005;
const DEFAULT_MORTGAGE_ANNUAL_RATE = 0.0225;

export function AmortizationCalculator({
  fullCapital: snapshotFullCapital,
  balanceShareInfo,
  monthlyPayment: fullMonthlyPayment,
  yourSharePayment,
  annualRate: liabilityRate,
}) {
  const { t } = useTranslation();
  const { locale } = usePreferences();
  const { settings, assets, liabilities, snapshots } = useFinanceData();

  const [mode, setMode] = useState('none');
  const [lumpMode, setLumpMode] = useState('reduce_term');
  const [extraLump, setExtraLump] = useState('');
  const [extraMonthly, setExtraMonthly] = useState('');
  const initialRate =
    liabilityRate != null && Number.isFinite(liabilityRate)
      ? liabilityRate
      : DEFAULT_MORTGAGE_ANNUAL_RATE;

  const [capitalEuros, setCapitalEuros] = useState(() =>
    snapshotFullCapital > 0 ? snapshotFullCapital : 0,
  );
  const [paymentEuros, setPaymentEuros] = useState(() =>
    fullMonthlyPayment > 0 ? fullMonthlyPayment : 0,
  );
  const [rateInput, setRateInput] = useState(() =>
    formatRateInputValue(initialRate, locale),
  );
  const [scheduleView, setScheduleView] = useState('baseline');

  useEffect(() => {
    const next = snapshotFullCapital > 0 ? snapshotFullCapital : 0;
    setCapitalEuros((prev) => (prev === next ? prev : next));
  }, [snapshotFullCapital]);

  useEffect(() => {
    const next = fullMonthlyPayment > 0 ? fullMonthlyPayment : 0;
    setPaymentEuros((prev) => (prev === next ? prev : next));
  }, [fullMonthlyPayment]);

  useEffect(() => {
    const rate =
      liabilityRate != null && Number.isFinite(liabilityRate)
        ? liabilityRate
        : DEFAULT_MORTGAGE_ANNUAL_RATE;
    const next = formatRateInputValue(rate, locale);
    setRateInput((prev) => (prev === next ? prev : next));
  }, [liabilityRate, locale]);

  const remainingCapital = capitalEuros > 0 ? capitalEuros : null;
  const monthlyPayment = paymentEuros > 0 ? paymentEuros : null;
  const annualRate = parseRateInput(rateInput);

  const missingCapital = remainingCapital == null || remainingCapital <= 0;
  const missingRate = annualRate == null;
  const missingPayment = monthlyPayment == null || monthlyPayment <= 0;
  const canCalculate = !missingCapital && !missingRate && !missingPayment;

  const scenario = useMemo(() => {
    if (!canCalculate || mode === 'none') return null;
    if (mode === 'lump') {
      const extra = parseMoneyEuros(extraLump);
      if (extra <= 0) return null;
      return { type: 'lump', extraPayment: extra, mode: lumpMode };
    }
    const extra = parseMoneyEuros(extraMonthly);
    if (extra <= 0) return null;
    return { type: 'recurring', extraMonthly: extra };
  }, [canCalculate, mode, lumpMode, extraLump, extraMonthly]);

  const resolved = useMemo(() => {
    if (!canCalculate) return null;
    return resolveMortgageAmortization({
      remainingCapital,
      annualRate,
      monthlyPayment,
      scenario,
    });
  }, [canCalculate, remainingCapital, annualRate, monthlyPayment, scenario]);

  const hasScenario = scenario != null;

  useEffect(() => {
    const next = hasScenario ? 'scenario' : 'baseline';
    setScheduleView((prev) => (prev === next ? prev : next));
  }, [hasScenario]);

  const portfolioPreview = useMemo(
    () =>
      buildInitialBucketState({
        settings,
        assets,
        liabilities,
        snapshots,
        initialPatrimony: settings.initialPatrimony ?? 0,
      }),
    [settings, assets, liabilities, snapshots],
  );

  const weightedPortfolioReturn = useMemo(
    () =>
      computeWeightedPortfolioReturn(
        portfolioPreview.buckets,
        portfolioPreview.bucketRates,
      ),
    [portfolioPreview],
  );

  const hasInvestmentAssets =
    (portfolioPreview.buckets.investment ?? 0) +
      (portfolioPreview.buckets.pension ?? 0) >
    0;

  const activeSummary =
    scheduleView === 'scenario' && resolved?.scenario
      ? resolved.scenario
      : resolved?.baseline;

  const compareBanner = useMemo(() => {
    if (!resolved?.savings || !hasInvestmentAssets) return null;
    const mortgage = resolved.impliedReturn;
    const portfolio = weightedPortfolioReturn;
    if (portfolio > mortgage + PORTFOLIO_TOLERANCE) {
      return { tone: 'info', key: 'portfolioVsMortgage_invest' };
    }
    if (portfolio < mortgage - PORTFOLIO_TOLERANCE) {
      return { tone: 'success', key: 'portfolioVsMortgage_repay' };
    }
    return { tone: 'neutral', key: 'portfolioVsMortgage_equal' };
  }, [resolved, hasInvestmentAssets, weightedPortfolioReturn]);

  const formatScheduleDate = (date) =>
    date.toLocaleDateString(locale, {
      day: '2-digit',
      month: 'short',
      year: '2-digit',
    });

  const formatEndDate = (date) =>
    date?.toLocaleDateString(locale, { month: 'short', year: 'numeric' }) ??
    '—';

  const paymentHint = [
    t('balance.amortization.fullMonthlyPaymentHint'),
    yourSharePayment
      ? t('balance.amortization.yourShareHint', {
          amount: formatMoney(yourSharePayment.amount),
          percent: yourSharePayment.percent,
        })
      : null,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={ui.stackSection}>
      <div>
        <p className={`text-xs font-semibold uppercase tracking-wide ${ui.textLabel}`}>
          {t('balance.amortization.mortgageData')}
        </p>
        <div className="mt-3 grid grid-cols-1 items-stretch gap-3 sm:grid-cols-3">
          <MortgageDataField
            label={t('balance.amortization.fullCapital')}
            kind="money"
            value={capitalEuros}
            onChange={setCapitalEuros}
            missingHint={t('balance.amortization.missingCapital')}
            highlight={missingCapital}
            hint={
              balanceShareInfo
                ? t('balance.amortization.yourShareCapitalHint', {
                    amount: formatMoney(balanceShareInfo.yourShare),
                    percent: balanceShareInfo.percent,
                  })
                : undefined
            }
          />
          <MortgageDataField
            label={t('balance.amortization.fullMonthlyPayment')}
            kind="money"
            value={paymentEuros}
            onChange={setPaymentEuros}
            missingHint={t('balance.amortization.missingPayment')}
            highlight={missingPayment}
            hint={paymentHint}
          />
          <MortgageDataField
            label={t('balance.patrimony.interestRate')}
            kind="rate"
            locale={locale}
            value={rateInput}
            onChange={setRateInput}
            missingHint={t('balance.amortization.missingRate')}
            highlight={missingRate}
          />
        </div>
        {resolved ? (
          <div className="mt-3 max-w-xs">
            <KpiCard
              compact
              label={t('balance.amortization.totalInterest')}
              value={formatMoney(resolved.baseline.totalInterest)}
              hint={t('balance.amortization.baselineInterestHint')}
              hideFooter
            />
          </div>
        ) : null}
      </div>

      {canCalculate ? (
        <>
          <div>
            <p className={`text-xs font-semibold uppercase tracking-wide ${ui.textLabel}`}>
              {t('balance.amortization.simulateSection')}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {[
                ['none', 'modeNone'],
                ['lump', 'modeOneTime'],
                ['monthly', 'modeMonthly'],
              ].map(([value, labelKey]) => (
                <button
                  key={value}
                  type="button"
                  className={mode === value ? ui.scenarioChipActive : ui.scenarioChip}
                  onClick={() => setMode(value)}
                >
                  {t(`balance.amortization.${labelKey}`)}
                </button>
              ))}
            </div>
          </div>

          {mode === 'lump' ? (
            <div className={`${ui.stackBlocks} max-w-xl`}>
              <MoneyField
                label={t('balance.amortization.extraOneTime')}
                value={extraLump}
                onChange={setExtraLump}
              />
              <div className="flex flex-wrap gap-2">
                {[
                  ['reduce_term', 'modeReduceTerm'],
                  ['reduce_payment', 'modeReducePayment'],
                ].map(([value, labelKey]) => (
                  <button
                    key={value}
                    type="button"
                    className={
                      lumpMode === value ? ui.scenarioChipActive : ui.scenarioChip
                    }
                    onClick={() => setLumpMode(value)}
                  >
                    {t(`balance.amortization.${labelKey}`)}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {mode === 'monthly' ? (
            <div className="max-w-md">
              <MoneyField
                label={t('balance.amortization.extraMonthlyAmount')}
                value={extraMonthly}
                onChange={setExtraMonthly}
              />
            </div>
          ) : null}

          {resolved?.savings ? (
            <div className={ui.stackBlocks}>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <KpiCard
                  compact
                  accent
                  label={t('balance.amortization.interestSavedLabel')}
                  value={formatMoney(resolved.savings.interest)}
                  valueTone="savings"
                  hideFooter
                />
                {resolved.savings.months > 0 ? (
                  <KpiCard
                    compact
                    accent
                    label={t('balance.amortization.timeSavedLabel')}
                    value={formatTimeSavedDuration(t, resolved.savings.months)}
                    hideFooter
                  />
                ) : null}
                <KpiCard
                  compact
                  label={t('balance.amortization.withRepayment')}
                  value={formatMoney(resolved.scenario.totalInterest)}
                  hint={t('balance.amortization.interestAfterHint')}
                  hideFooter
                />
                <KpiCard
                  compact
                  label={t('balance.amortization.endDate')}
                  value={formatEndDate(resolved.scenario.endDate)}
                  hint={t('balance.amortization.vsEndDate', {
                    date: formatEndDate(resolved.baseline.endDate),
                  })}
                  hideFooter
                />
              </div>

              <div
                className={`rounded-xl [border:0.5px_solid_rgba(29,158,117,0.40)] bg-[rgba(29,158,117,0.10)] p-4 text-sm ${ui.heading}`}
              >
                <p className="font-semibold">
                  {t('balance.amortization.interestSaved', {
                    amount: formatMoney(resolved.savings.interest),
                  })}
                </p>
                {resolved.savings.months > 0 ? (
                  <p>
                    {formatTimeSavedBefore(t, resolved.savings.months)}
                  </p>
                ) : null}
                {resolved.savings.totalExtraPaid != null ? (
                  <p className={`mt-1 ${ui.textMuted}`}>
                    {t('balance.amortization.totalExtraPaid', {
                      amount: formatMoney(resolved.savings.totalExtraPaid),
                    })}
                  </p>
                ) : null}
                <p className={`mt-2 ${ui.textMuted}`}>
                  {t('balance.amortization.impliedReturn', {
                    rate: formatRatePercent(resolved.impliedReturn),
                  })}
                </p>
              </div>

              {compareBanner ? (
                <PortfolioBanner
                  tone={compareBanner.tone}
                  message={t(`balance.amortization.${compareBanner.key}`, {
                    portfolio: formatRatePercent(weightedPortfolioReturn),
                    mortgage: formatRatePercent(resolved.impliedReturn),
                  })}
                />
              ) : null}
            </div>
          ) : null}

          <div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className={`text-xs font-semibold uppercase tracking-wide ${ui.textLabel}`}>
                {t('balance.amortization.scheduleSection')}
              </p>
              {resolved?.scenario ? (
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className={
                      scheduleView === 'scenario'
                        ? ui.scenarioChipActive
                        : ui.scenarioChip
                    }
                    onClick={() => setScheduleView('scenario')}
                  >
                    {t('balance.amortization.viewWithRepayment')}
                  </button>
                  <button
                    type="button"
                    className={
                      scheduleView === 'baseline'
                        ? ui.scenarioChipActive
                        : ui.scenarioChip
                    }
                    onClick={() => setScheduleView('baseline')}
                  >
                    {t('balance.amortization.viewBaseline')}
                  </button>
                </div>
              ) : null}
            </div>

            {activeSummary?.schedule?.length ? (
              <AmortizationScheduleTable
                rows={activeSummary.schedule}
                totals={activeSummary}
                formatDate={formatScheduleDate}
                sharePercent={balanceShareInfo?.percent}
              />
            ) : null}
          </div>
        </>
      ) : null}
    </div>
  );
}

function formatTimeSavedDuration(t, totalMonths) {
  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;
  if (years > 0 && months > 0) {
    return t('balance.amortization.timeSavedDurationYearsMonths', { years, months });
  }
  if (years > 0) {
    return t('balance.amortization.timeSavedDurationYears', { years });
  }
  return t('balance.amortization.timeSavedDurationMonths', { months });
}

function formatTimeSavedBefore(t, totalMonths) {
  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;
  if (years > 0 && months > 0) {
    return t('balance.amortization.timeSavedBeforeYearsMonths', { years, months });
  }
  if (years > 0) {
    return t('balance.amortization.timeSavedBeforeYears', { years });
  }
  return t('balance.amortization.timeSavedBeforeMonths', { months });
}

function parseRateInput(raw) {
  const cleaned = String(raw).trim().replace(',', '.');
  if (!cleaned) return null;
  const n = parseFloat(cleaned);
  return Number.isFinite(n) && n >= 0 ? n / 100 : null;
}

function isValidRateDraft(raw) {
  return raw === '' || /^[0-9]*[,.]?[0-9]*$/.test(raw);
}

const MORTGAGE_FIELD_SHELL =
  'flex h-full flex-col rounded-xl [border:0.5px_solid_rgba(255,255,255,0.10)] p-3';
const MORTGAGE_FIELD_SHELL_WARN =
  'flex h-full flex-col rounded-xl [border:0.5px_solid_rgba(239,159,39,0.40)] bg-[rgba(239,159,39,0.08)] p-3';

function MortgageDataField({
  label,
  kind,
  locale,
  hint,
  missingHint,
  value,
  onChange,
  highlight,
}) {
  const footnote =
    highlight && missingHint ? missingHint : hint || null;
  const footnoteClass =
    highlight && missingHint
      ? 'text-[var(--color-warning)]'
      : ui.textMuted;

  return (
    <div className={highlight ? MORTGAGE_FIELD_SHELL_WARN : MORTGAGE_FIELD_SHELL}>
      <p className={`min-h-[2.5rem] text-xs font-medium leading-snug ${ui.textLabel}`}>
        {label}
      </p>
      <div className="mt-1 w-full">
        {kind === 'rate' ? (
          <div className="relative w-full">
            <input
              type="text"
              inputMode="decimal"
              value={value}
              onChange={(e) => {
                const next = e.target.value;
                if (isValidRateDraft(next)) onChange(next);
              }}
              onBlur={() => {
                const parsed = parseRateInput(value);
                if (parsed != null) onChange(formatRateInputValue(parsed, locale));
              }}
              placeholder="2,25"
              className={`${ui.input} w-full max-w-none pr-9 tabular-nums`}
            />
            <span className={`${ui.inputSuffixAdornment} ${ui.textMuted}`}>%</span>
          </div>
        ) : (
          <MoneyInput fullWidth value={value} onChange={onChange} className="max-w-none" />
        )}
      </div>
      <p
        className={`mt-2 min-h-[2.75rem] text-[11px] leading-snug ${footnoteClass} ${
          footnote ? '' : 'invisible'
        }`}
      >
        {footnote || '\u00a0'}
      </p>
    </div>
  );
}

function PortfolioBanner({ tone, message }) {
  const styles = {
    info: '[border:0.5px_solid_rgba(55,138,221,0.40)] bg-[rgba(55,138,221,0.10)] text-[var(--color-info)]',
    success:
      '[border:0.5px_solid_rgba(29,158,117,0.40)] bg-[rgba(29,158,117,0.10)] text-[var(--color-positive)]',
    neutral:
      '[border:0.5px_solid_rgba(255,255,255,0.10)] bg-[rgba(255,255,255,0.04)] text-[var(--text-secondary)]',
  };
  return (
    <p className={`rounded-xl border p-3 text-sm ${styles[tone] ?? styles.neutral}`}>
      {message}
    </p>
  );
}

