import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import {
  BALANCE_TAB,
  BALANCE_TABS,
  DEFAULT_BALANCE_TAB,
  resolveBalanceTab,
} from '../../lib/balanceTabs';
import { ui } from '../../lib/uiClasses';
import { CashflowPanel } from './components/CashflowPanel';
import { ContributionsPanel } from './components/ContributionsPanel';
import { PatrimonyPanel } from './components/PatrimonyPanel';

const TAB_PANELS = {
  [BALANCE_TAB.CASHFLOW]: CashflowPanel,
  [BALANCE_TAB.CONTRIBUTIONS]: ContributionsPanel,
  [BALANCE_TAB.PATRIMONY]: PatrimonyPanel,
};

export function BalancePage() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = resolveBalanceTab(searchParams.get('tab'));
  const ActivePanel = TAB_PANELS[tab] ?? TAB_PANELS[DEFAULT_BALANCE_TAB];

  const setTab = (id) => {
    setSearchParams({ tab: id }, { replace: true });
  };

  return (
    <div className={ui.stackPage}>
      <div>
        <h2 className={`mb-2 text-2xl font-bold tracking-tight ${ui.heading}`}>
          {t('balance.title')}
        </h2>
        <p className={`max-w-3xl text-sm leading-relaxed ${ui.text}`}>
          {t('balance.description')}
        </p>
      </div>

      <nav
        className={`flex flex-wrap gap-2 border-b pb-3 ${ui.divider}`}
        aria-label={t('balance.tabsLabel')}
      >
        {BALANCE_TABS.map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={tab === id ? ui.navTabActive : ui.navTab}
          >
            {t(`balance.tabs.${id}`)}
          </button>
        ))}
      </nav>

      <ActivePanel />
    </div>
  );
}
