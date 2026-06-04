import { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { PercentRow } from '../../../components/PercentRow';
import { CashflowTramosSection } from '../../../components/CashflowTramosSection';
import {
  createCashflowEntryFromSettings,
  getCashflowTotalsForDate,
  getCurrentMonthKey,
} from '../../../lib/cashflowHistory';
import { ui } from '../../../lib/uiClasses';
import { useFinanceData } from '../../../store/hooks';
import { formatMoney, formatPercent } from '../../../utils/formatters';
import { AnnualExpensesSection } from '../../../components/AnnualExpensesSection';
import { EmergencyFundSection } from '../../../components/EmergencyFundSection';
import { FinanceAlerts } from '../../../components/FinanceAlerts';
import { useFinanceAlerts } from '../../../hooks/useFinanceAlerts';
import { ExpenseSubtotals } from '../../onboarding/components/ExpenseSubtotals';
import { SharedExpenseBlock } from '../../onboarding/components/SharedExpenseBlock';
import {
  getEffectiveGroceries,
  getEffectiveHouseholdExpenses,
  getEffectiveLeisureExpenses,
  getEffectiveMortgageRent,
  getGroceriesTotal,
  getHouseholdTotal,
  getLeisureTotal,
  getMortgageRentTotal,
} from '../../../lib/calculations';
import {
  isLikelyAutoAllocatedBreakdown,
  patchExpenseViewMode,
} from '../../../lib/expenseViewMode';
import { DetailedHouseholdBreakdown } from '../../onboarding/components/DetailedHouseholdBreakdown';
import { ExpenseViewToggle } from '../../onboarding/components/ExpenseViewToggle';

export function CashflowPanel() {
  const { t } = useTranslation();
  const {
    settings,
    setSettings,
    annualExpenses,
    cashflowHistory,
    addAnnualExpense,
    updateAnnualExpense,
    removeAnnualExpense,
    addCashflowHistoryEntry,
    updateCashflowHistoryEntry,
    removeCashflowHistoryEntry,
  } = useFinanceData();
  const { alerts } = useFinanceAlerts();

  useEffect(() => {
    if (cashflowHistory.length > 0) return;
    addCashflowHistoryEntry(
      createCashflowEntryFromSettings(settings, getCurrentMonthKey()),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps -- bootstrap once
  }, [cashflowHistory.length, addCashflowHistoryEntry]);

  const totals = useMemo(
    () => getCashflowTotalsForDate(settings, cashflowHistory, new Date()),
    [settings, cashflowHistory],
  );

  const detailed = settings.useDetailedExpenses ?? false;

  useEffect(() => {
    if (!detailed || !isLikelyAutoAllocatedBreakdown(settings)) return;
    setSettings(patchExpenseViewMode(settings, true));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- clear legacy auto-split once
  }, []);

  const toggleDetailed = () => {
    setSettings(patchExpenseViewMode(settings, !detailed));
  };

  return (
    <div className={ui.stackPage}>
      {alerts.length > 0 ? (
        <FinanceAlerts alerts={alerts} className={ui.chartCard} />
      ) : null}

      <div className={`${ui.chartCard} ${ui.stackSection}`}>
        <p className={`text-sm ${ui.textMuted}`}>{t('balance.cashflow.summaryHint')}</p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label={t('balance.cashflow.income')} value={formatMoney(totals.income)} />
          <Stat label={t('balance.cashflow.fixed')} value={formatMoney(totals.fixed)} />
          <Stat label={t('balance.cashflow.leisure')} value={formatMoney(totals.leisure)} />
          <Stat
            label={t('balance.cashflow.savings')}
            value={formatMoney(totals.savings)}
            sub={formatPercent(totals.savingsRate)}
          />
        </div>
      </div>

      <section className={`${ui.chartCard} ${ui.stackSection}`}>
        <div className={`border-b pb-3 ${ui.divider}`}>
          <h3 className={`text-base font-semibold ${ui.heading}`}>
            {t('balance.cashflow.expensesTitle')}
          </h3>
          <p className={`mt-1 text-sm ${ui.textMuted}`}>
            {t('balance.cashflow.expensesSubtitle')}
          </p>
        </div>

        <div className={ui.stackBlocks}>
        <SharedExpenseBlock
          id="balance-mortgage"
          label={t('onboarding.expenses.mortgageRentTotal')}
          hint={t('onboarding.expenses.mortgageRentTotalHint')}
          total={getMortgageRentTotal(settings)}
          yourShare={getEffectiveMortgageRent(settings)}
          shared={settings.mortgageRentShared ?? false}
          percent={settings.mortgageRentYourSharePercent ?? 50}
          onTotalChange={(v) =>
            setSettings({ mortgageRentTotal: v, mortgageRent: v })
          }
          onSharedChange={(v) => setSettings({ mortgageRentShared: v })}
          onPercentChange={(v) =>
            setSettings({ mortgageRentYourSharePercent: v })
          }
        />

        {!detailed && (
          <SharedExpenseBlock
            id="balance-household"
            label={t('onboarding.expenses.household')}
            hint={t('onboarding.expenses.householdHint')}
            total={getHouseholdTotal(settings)}
            yourShare={getEffectiveHouseholdExpenses(settings)}
            shared={settings.householdFixedShared ?? false}
            percent={settings.householdFixedYourSharePercent ?? 50}
            onTotalChange={(v) =>
              setSettings({
                householdFixedEstimate: v,
                householdFixedIsEstimate: true,
              })
            }
            onSharedChange={(v) => setSettings({ householdFixedShared: v })}
            onPercentChange={(v) =>
              setSettings({ householdFixedYourSharePercent: v })
            }
          />
        )}

        <SharedExpenseBlock
          id="balance-groceries"
          label={t('onboarding.expenses.groceries')}
          hint={t('onboarding.expenses.groceriesHint')}
          total={getGroceriesTotal(settings)}
          yourShare={getEffectiveGroceries(settings)}
          shared={settings.groceriesShared ?? false}
          percent={settings.groceriesYourSharePercent ?? 50}
          onTotalChange={(v) =>
            setSettings({ groceriesEstimate: v, groceriesIsEstimate: true })
          }
          onSharedChange={(v) => setSettings({ groceriesShared: v })}
          onPercentChange={(v) =>
            setSettings({ groceriesYourSharePercent: v })
          }
        />

        <SharedExpenseBlock
          id="balance-leisure"
          label={t('onboarding.expenses.leisure')}
          hint={t('onboarding.expenses.leisureHint')}
          total={getLeisureTotal(settings)}
          yourShare={getEffectiveLeisureExpenses(settings)}
          shared={settings.leisureShared ?? false}
          percent={settings.leisureYourSharePercent ?? 50}
          onTotalChange={(v) =>
            setSettings({ leisureEstimate: v, leisureIsEstimate: true })
          }
          onSharedChange={(v) => setSettings({ leisureShared: v })}
          onPercentChange={(v) =>
            setSettings({ leisureYourSharePercent: v })
          }
        />

        <ExpenseViewToggle detailed={detailed} onToggle={toggleDetailed} />

        {detailed ? (
          <DetailedHouseholdBreakdown
            settings={settings}
            setSettings={setSettings}
          />
        ) : null}

        <ExpenseSubtotals settings={settings} />
        </div>
      </section>

      <AnnualExpensesSection
        items={annualExpenses}
        onAdd={addAnnualExpense}
        onUpdate={updateAnnualExpense}
        onRemove={removeAnnualExpense}
      />

      <section className={`${ui.chartCard} ${ui.stackSection}`}>
        <CashflowTramosSection
          items={cashflowHistory}
          settings={settings}
          onAdd={addCashflowHistoryEntry}
          onUpdate={updateCashflowHistoryEntry}
          onRemove={removeCashflowHistoryEntry}
        />
      </section>

      <EmergencyFundSection
        settings={settings}
        setSettings={setSettings}
        annualExpenses={annualExpenses}
      />
    </div>
  );
}

function Stat({ label, value, sub }) {
  return (
    <div className={`${ui.block} px-3 py-2.5`}>
      <p className={`text-xs ${ui.textMuted}`}>{label}</p>
      <p className={`mt-0.5 text-lg font-bold tabular-nums ${ui.heading}`}>
        {value}
      </p>
      {sub ? <p className={`text-xs ${ui.textMuted}`}>{sub}</p> : null}
    </div>
  );
}
