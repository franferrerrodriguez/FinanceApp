import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CashflowTramosSection } from '../../../components/CashflowTramosSection';
import { getCashflowTotalsForDate } from '../../../lib/cashflowHistory';
import { ui } from '../../../lib/uiClasses';
import { useFinanceData } from '../../../store/hooks';
import { AnnualExpensesSection } from '../../../components/AnnualExpensesSection';
import { EmergencyFundSection } from '../../../components/EmergencyFundSection';
import { CashflowSummaryBreakdown } from '../../../components/CashflowSummaryBreakdown';
import { ExpenseSubtotals } from '../../onboarding/components/ExpenseSubtotals';
import { HousingExpenseBlock } from '../../../components/HousingExpenseBlock';
import { PayYourselfFirstBlock } from '../../../components/PayYourselfFirstBlock';
import { SharedExpenseBlock } from '../../onboarding/components/SharedExpenseBlock';
import {
  getEffectiveGroceries,
  getEffectiveHouseholdExpenses,
  getEffectiveLeisureExpenses,
  getGroceriesTotal,
  getHouseholdTotal,
  getLeisureTotal,
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
    snapshots,
    assets,
    liabilities,
    cashflowHistory,
    addAnnualExpense,
    updateAnnualExpense,
    removeAnnualExpense,
    addCashflowHistoryEntry,
    updateCashflowHistoryEntry,
    removeCashflowHistoryEntry,
  } = useFinanceData();
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

  const [isEditingExpenses, setIsEditingExpenses] = useState(false);

  const toggleDetailed = () => {
    setSettings(patchExpenseViewMode(settings, !detailed));
  };

  return (
    <div className={ui.stackPage}>
      <div className={`${ui.chartCard} ${ui.stackSection}`}>
        <p className={`text-sm ${ui.textMuted}`}>{t('balance.cashflow.summaryHint')}</p>
        <CashflowSummaryBreakdown totals={totals} />
      </div>

      <section className={`${ui.chartCard} ${ui.stackSection}`}>
        <div className={`flex items-start justify-between gap-3 border-b pb-3 ${ui.divider}`}>
          <div>
            <h3 className={`text-base font-semibold ${ui.heading}`}>
              {t('balance.cashflow.expensesTitle')}
            </h3>
            <p className={`mt-1 text-sm ${ui.textMuted}`}>
              {t('balance.cashflow.expensesSubtitle')}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsEditingExpenses((v) => !v)}
            className={`shrink-0 text-xs font-medium transition-colors ${
              isEditingExpenses
                ? 'text-[var(--accent)]'
                : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
            }`}
          >
            {isEditingExpenses ? t('common.done') : t('common.edit')}
          </button>
        </div>

        <div className={`${ui.stackBlocks}${isEditingExpenses ? '' : ' pointer-events-none'}`}>
        <PayYourselfFirstBlock settings={settings} setSettings={setSettings} />

        <HousingExpenseBlock
          settings={settings}
          setSettings={setSettings}
          snapshots={snapshots}
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
        snapshots={snapshots}
        assets={assets}
      />
    </div>
  );
}

