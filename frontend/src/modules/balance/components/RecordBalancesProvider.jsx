import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { useToast } from '../../../context/ToastContext';
import { BALANCE_TAB } from '../../../lib/balanceTabs';
import { getCurrentMonthKey } from '../../../lib/dashboardMetrics';
import {
  getPendingCloseHint,
  hasPatrimonyAccounts,
  isMonthKey,
} from '../../../lib/monthlyClose';
import { getCurrentPatrimonySummary } from '../../../lib/patrimony';
import { ui } from '../../../lib/uiClasses';
import { useFinanceAlerts } from '../../../hooks/useFinanceAlerts';
import { useFinanceData, usePreferences } from '../../../store/hooks';
import { MonthlyCloseModal } from './MonthlyCloseModal';
import { RecordBalancesBar } from './RecordBalancesBar';

const RecordBalancesContext = createContext(null);

export function useRecordBalances() {
  const ctx = useContext(RecordBalancesContext);
  if (!ctx) {
    throw new Error('useRecordBalances must be used within RecordBalancesProvider');
  }
  return ctx;
}

export function RecordBalancesProvider({ children }) {
  const { t } = useTranslation();
  const { locale } = usePreferences();
  const [searchParams, setSearchParams] = useSearchParams();
  const { monthlyClose } = useFinanceAlerts();
  const toast = useToast();
  const {
    settings,
    assets,
    liabilities,
    snapshots,
    closeMonthSnapshots,
  } = useFinanceData();

  const currentMonthKey = getCurrentMonthKey();
  const [balancesOpen, setBalancesOpen] = useState(false);
  const [balancesMonthKey, setBalancesMonthKey] = useState(
    monthlyClose?.suggestedMonthKey ?? currentMonthKey,
  );

  const hasAccounts = hasPatrimonyAccounts(assets, liabilities);

  const openRecordBalances = useCallback(
    (monthKey) => {
      setBalancesMonthKey(monthKey ?? monthlyClose?.suggestedMonthKey ?? currentMonthKey);
      setBalancesOpen(true);
    },
    [monthlyClose?.suggestedMonthKey, currentMonthKey],
  );

  const goToPatrimonyHistory = useCallback(() => {
    setSearchParams({ tab: BALANCE_TAB.PATRIMONY }, { replace: true });
    requestAnimationFrame(() => {
      window.setTimeout(() => {
        document.getElementById('patrimony-history')?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      }, 80);
    });
  }, [setSearchParams]);

  const goToPatrimonyCatalog = useCallback(() => {
    setSearchParams({ tab: BALANCE_TAB.PATRIMONY }, { replace: true });
    requestAnimationFrame(() => {
      window.setTimeout(() => {
        document.getElementById('patrimony-assets')?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      }, 80);
    });
  }, [setSearchParams]);

  useEffect(() => {
    const param = searchParams.get('closeMonth');
    if (!param || !isMonthKey(param)) return;
    openRecordBalances(param);
    const next = new URLSearchParams(searchParams);
    next.delete('closeMonth');
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams, openRecordBalances]);

  const value = useMemo(
    () => ({ openRecordBalances, goToPatrimonyCatalog, goToPatrimonyHistory, hasAccounts }),
    [openRecordBalances, goToPatrimonyCatalog, goToPatrimonyHistory, hasAccounts],
  );

  return (
    <RecordBalancesContext.Provider value={value}>
      {children}
      <MonthlyCloseModal
        open={balancesOpen}
        onClose={() => setBalancesOpen(false)}
        assets={assets}
        liabilities={liabilities}
        snapshots={snapshots}
        settings={settings}
        monthKey={balancesMonthKey}
        onMonthKeyChange={setBalancesMonthKey}
        onConfirm={(monthKey, snaps) => {
          closeMonthSnapshots(monthKey, snaps);
          toast.success(t('toast.balancesSaved'));
          requestAnimationFrame(() => {
            document
              .getElementById('patrimony-assets')
              ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          });
        }}
      />
    </RecordBalancesContext.Provider>
  );
}

export function BalanceRecordBalancesSection() {
  const { locale } = usePreferences();
  const { monthlyClose } = useFinanceAlerts();
  const { snapshots } = useFinanceData();
  const { openRecordBalances, goToPatrimonyCatalog, goToPatrimonyHistory, hasAccounts } =
    useRecordBalances();
  const pendingHint = getPendingCloseHint(monthlyClose, locale);
  const showHistoryLink = getCurrentPatrimonySummary(snapshots).hasClose;

  return (
    <section className={`${ui.chartCard} py-4`}>
      <RecordBalancesBar
        layout="page"
        hasAccounts={hasAccounts}
        pendingMonths={monthlyClose?.pendingMonths?.length}
        suggestedMonthKey={monthlyClose?.suggestedMonthKey}
        showPendingBadge={(monthlyClose?.pendingMonths?.length ?? 0) > 0}
        pendingHint={pendingHint}
        showHistoryLink={showHistoryLink}
        onViewHistory={goToPatrimonyHistory}
        locale={locale}
        onOpen={() => openRecordBalances()}
        onGoToCatalog={goToPatrimonyCatalog}
      />
    </section>
  );
}
