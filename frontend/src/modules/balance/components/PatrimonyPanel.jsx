import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { FormFieldFrame } from '../../../components/FormFieldFrame';
import { FinanceAlerts } from '../../../components/FinanceAlerts';
import { useFinanceAlerts } from '../../../hooks/useFinanceAlerts';
import { getAssetCategories, getLiabilityCategories } from '../../../lib/categoryLabels';
import { getCurrentMonthKey } from '../../../lib/dashboardMetrics';
import { isMonthKey } from '../../../lib/monthlyClose';
import {
  createAsset,
  createLiability,
  getActiveAssets,
  getActiveLiabilities,
  getCurrentPatrimonySummary,
} from '../../../lib/patrimony';
import { ui } from '../../../lib/uiClasses';
import { useFinanceData, usePreferences } from '../../../store/hooks';
import { formatMonthKey, formatMonthKeyLong } from '../../../utils/monthLabel';
import { formatMoney } from '../../../utils/formatters';
import { MonthlyCloseModal } from './MonthlyCloseModal';
import { MonthlyClosePrompt } from './MonthlyClosePrompt';
import { PatrimonyHistoryTable } from './PatrimonyHistoryTable';

export function PatrimonyPanel() {
  const { t } = useTranslation();
  const { locale } = usePreferences();
  const [searchParams, setSearchParams] = useSearchParams();
  const { alerts, monthlyClose } = useFinanceAlerts();
  const {
    assets,
    liabilities,
    snapshots,
    addAsset,
    updateAsset,
    setAssetActive,
    addLiability,
    updateLiability,
    setLiabilityActive,
    closeMonthSnapshots,
  } = useFinanceData();

  const currentMonthKey = getCurrentMonthKey();
  const [closeOpen, setCloseOpen] = useState(false);
  const [closeMonthKey, setCloseMonthKey] = useState(
    monthlyClose?.suggestedMonthKey ?? currentMonthKey,
  );

  const openClose = useCallback(
    (monthKey) => {
      setCloseMonthKey(monthKey ?? monthlyClose?.suggestedMonthKey ?? currentMonthKey);
      setCloseOpen(true);
    },
    [monthlyClose?.suggestedMonthKey, currentMonthKey],
  );

  useEffect(() => {
    const param = searchParams.get('closeMonth');
    if (!param || !isMonthKey(param)) return;
    openClose(param);
    const next = new URLSearchParams(searchParams);
    next.delete('closeMonth');
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams, openClose]);

  const summary = getCurrentPatrimonySummary(snapshots, currentMonthKey);
  const monthLabel = formatMonthKey(currentMonthKey, locale);
  const hasAccounts =
    getActiveAssets(assets).length > 0 || getActiveLiabilities(liabilities).length > 0;

  return (
    <div className={ui.stackPage}>
      {alerts.length > 0 ? (
        <FinanceAlerts alerts={alerts} className={ui.chartCard} />
      ) : null}

      {hasAccounts && monthlyClose?.pendingMonths?.length ? (
        <MonthlyClosePrompt status={monthlyClose} onCloseMonth={openClose} />
      ) : null}

      <div className={`${ui.chartCard} ${ui.stackSection}`}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h3 className={`text-base font-semibold ${ui.heading}`}>
              {t('balance.patrimony.title')}
            </h3>
            <p className={`mt-1 text-sm ${ui.text}`}>
              {t('balance.patrimony.subtitle')}
            </p>
          </div>
          <button
            type="button"
            className={ui.btnPrimary}
            disabled={!hasAccounts}
            onClick={() => openClose()}
          >
            {monthlyClose?.pendingMonths?.length
              ? t('balance.patrimony.closeMonthFor', {
                  month: formatMonthKeyLong(monthlyClose.suggestedMonthKey, locale),
                })
              : t('balance.patrimony.closeMonth')}
          </button>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <Kpi
            label={t('balance.patrimony.netWorth')}
            value={summary.hasClose ? formatMoney(summary.netWorth) : '—'}
            hint={
              summary.hasClose
                ? t('balance.patrimony.asOfMonth', { month: monthLabel })
                : t('balance.patrimony.noCloseYet', { month: monthLabel })
            }
          />
          <Kpi
            label={t('balance.patrimony.totalAssets')}
            value={summary.hasClose ? formatMoney(summary.totalAssets) : '—'}
          />
          <Kpi
            label={t('balance.patrimony.totalLiabilities')}
            value={
              summary.hasClose
                ? formatMoney(Math.abs(summary.totalLiabilities ?? 0))
                : '—'
            }
            liability
          />
        </div>
      </div>

      <section className={`${ui.chartCard} ${ui.stackSection}`}>
        <SectionHeader
          title={t('balance.patrimony.assetsTitle')}
          subtitle={t('balance.patrimony.assetsSubtitle')}
        />
        {assets.length === 0 ? (
          <EmptyBlock message={t('balance.patrimony.assetsEmpty')} />
        ) : (
          <ul className={ui.stackBlocks}>
            {assets.map((asset) => (
              <AssetCard
                key={asset.id}
                asset={asset}
                onChange={(patch) => updateAsset(asset.id, patch)}
                onToggleActive={(isActive) => setAssetActive(asset.id, isActive)}
              />
            ))}
          </ul>
        )}
        <button
          type="button"
          className={assets.length === 0 ? ui.btnPrimary : ui.btnSecondary}
          onClick={() => addAsset(createAsset({ name: t('balance.patrimony.newAsset') }))}
        >
          {assets.length === 0
            ? t('balance.patrimony.addFirstAsset')
            : t('balance.patrimony.addAsset')}
        </button>
      </section>

      <section className={`${ui.chartCard} ${ui.stackSection}`}>
        <SectionHeader
          title={t('balance.patrimony.liabilitiesTitle')}
          subtitle={t('balance.patrimony.liabilitiesSubtitle')}
        />
        {liabilities.length === 0 ? (
          <EmptyBlock message={t('balance.patrimony.liabilitiesEmpty')} />
        ) : (
          <ul className={ui.stackBlocks}>
            {liabilities.map((liability) => (
              <LiabilityCard
                key={liability.id}
                liability={liability}
                onChange={(patch) => updateLiability(liability.id, patch)}
                onToggleActive={(isActive) =>
                  setLiabilityActive(liability.id, isActive)
                }
              />
            ))}
          </ul>
        )}
        <button
          type="button"
          className={liabilities.length === 0 ? ui.btnPrimary : ui.btnSecondary}
          onClick={() =>
            addLiability(createLiability({ name: t('balance.patrimony.newLiability') }))
          }
        >
          {liabilities.length === 0
            ? t('balance.patrimony.addFirstLiability')
            : t('balance.patrimony.addLiability')}
        </button>
      </section>

      <section className={`${ui.chartCard} ${ui.stackSection}`}>
        <SectionHeader
          title={t('balance.patrimony.historyTitle')}
          subtitle={t('balance.patrimony.historySubtitle')}
        />
        <PatrimonyHistoryTable
          assets={assets}
          liabilities={liabilities}
          snapshots={snapshots}
        />
      </section>

      <MonthlyCloseModal
        open={closeOpen}
        onClose={() => setCloseOpen(false)}
        assets={assets}
        liabilities={liabilities}
        snapshots={snapshots}
        monthKey={closeMonthKey}
        onMonthKeyChange={setCloseMonthKey}
        onConfirm={closeMonthSnapshots}
      />
    </div>
  );
}

function SectionHeader({ title, subtitle }) {
  return (
    <div className={`border-b pb-3 ${ui.divider}`}>
      <h3 className={`text-base font-semibold ${ui.heading}`}>{title}</h3>
      <p className={`mt-1 text-sm ${ui.textMuted}`}>{subtitle}</p>
    </div>
  );
}

function EmptyBlock({ message }) {
  return (
    <div className={`px-6 py-8 text-center ${ui.cardDashed}`}>
      <p className={`text-sm ${ui.text}`}>{message}</p>
    </div>
  );
}

function Kpi({ label, value, hint, liability }) {
  return (
    <div className={`${ui.block} px-3 py-2.5`}>
      <p className={`text-xs font-medium ${ui.textMuted}`}>{label}</p>
      <p
        className={`mt-1 text-lg font-semibold tabular-nums ${
          liability ? 'text-red-600 dark:text-red-400' : ui.heading
        }`}
      >
        {value}
      </p>
      {hint ? <p className={`mt-1 text-xs ${ui.textMuted}`}>{hint}</p> : null}
    </div>
  );
}

function AssetCard({ asset, onChange, onToggleActive }) {
  const { t } = useTranslation();
  const categories = getAssetCategories(t);
  const inactive = asset.isActive === false;

  return (
    <li
      className={`${ui.block} ${ui.stackSection} ${inactive ? 'opacity-60' : ''}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={asset.isActive !== false}
            onChange={(e) => onToggleActive(e.target.checked)}
            className="h-4 w-4 rounded border-slate-400 text-emerald-500 focus:ring-emerald-500/40"
          />
          <span className={`text-sm font-medium ${ui.textLabel}`}>
            {t('balance.patrimony.activeInClose')}
          </span>
        </label>
      </div>

      <div className="grid grid-cols-1 items-start gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <FormFieldFrame label={t('balance.patrimony.name')} required>
          <input
            type="text"
            value={asset.name}
            onChange={(e) => onChange({ name: e.target.value })}
            className={`${ui.input} ${ui.inputMedium}`}
          />
        </FormFieldFrame>

        <FormFieldFrame label={t('balance.patrimony.category')}>
          <select
            value={asset.category}
            onChange={(e) => onChange({ category: e.target.value })}
            className={`${ui.input} py-2.5`}
          >
            {categories.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </FormFieldFrame>

        <FormFieldFrame
          label={t('balance.patrimony.provider')}
          hint={t('balance.patrimony.providerHint')}
        >
          <input
            type="text"
            value={asset.provider ?? ''}
            placeholder={t('balance.patrimony.providerPlaceholder')}
            onChange={(e) => onChange({ provider: e.target.value })}
            className={`${ui.input} ${ui.inputMedium}`}
          />
        </FormFieldFrame>

        <FormFieldFrame
          label={t('balance.patrimony.notes')}
          hint={t('common.optional')}
          className="sm:col-span-2 lg:col-span-3"
        >
          <input
            type="text"
            value={asset.notes ?? ''}
            onChange={(e) => onChange({ notes: e.target.value })}
            className={`${ui.input} ${ui.inputMedium}`}
          />
        </FormFieldFrame>
      </div>
    </li>
  );
}

function LiabilityCard({ liability, onChange, onToggleActive }) {
  const { t } = useTranslation();
  const categories = getLiabilityCategories(t);
  const inactive = liability.isActive === false;

  return (
    <li
      className={`${ui.block} ${ui.stackSection} ${inactive ? 'opacity-60' : ''}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={liability.isActive !== false}
            onChange={(e) => onToggleActive(e.target.checked)}
            className="h-4 w-4 rounded border-slate-400 text-emerald-500 focus:ring-emerald-500/40"
          />
          <span className={`text-sm font-medium ${ui.textLabel}`}>
            {t('balance.patrimony.activeInClose')}
          </span>
        </label>
      </div>

      <div className="grid grid-cols-1 items-start gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <FormFieldFrame label={t('balance.patrimony.name')} required>
          <input
            type="text"
            value={liability.name}
            onChange={(e) => onChange({ name: e.target.value })}
            className={`${ui.input} ${ui.inputMedium}`}
          />
        </FormFieldFrame>

        <FormFieldFrame label={t('balance.patrimony.category')}>
          <select
            value={liability.category}
            onChange={(e) => onChange({ category: e.target.value })}
            className={`${ui.input} py-2.5`}
          >
            {categories.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </FormFieldFrame>

        <FormFieldFrame
          label={t('balance.patrimony.monthlyPayment')}
          hint={t('balance.patrimony.monthlyPaymentHint')}
        >
          <input
            type="number"
            min={0}
            step="10"
            value={liability.monthlyPayment ?? 0}
            onChange={(e) =>
              onChange({
                monthlyPayment: Math.max(0, parseFloat(e.target.value) || 0),
              })
            }
            className={`${ui.input} ${ui.inputAmount}`}
          />
        </FormFieldFrame>

        <FormFieldFrame
          label={t('balance.patrimony.interestRate')}
          hint={t('balance.patrimony.interestRateHint')}
        >
          <input
            type="number"
            min={0}
            max={100}
            step="0.1"
            value={liability.interestRate ?? ''}
            placeholder="—"
            onChange={(e) => {
              const raw = e.target.value;
              onChange({
                interestRate:
                  raw === '' ? undefined : Math.max(0, parseFloat(raw) || 0),
              });
            }}
            className={`${ui.input} ${ui.inputAmount}`}
          />
        </FormFieldFrame>
      </div>
    </li>
  );
}
