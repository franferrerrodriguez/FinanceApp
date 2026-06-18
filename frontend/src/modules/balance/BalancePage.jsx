import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import {
  BALANCE_TAB,
  BALANCE_TABS,
  DEFAULT_BALANCE_TAB,
  resolveBalanceTab,
} from '../../lib/balanceTabs';
import { UnderlineTabNav } from '../../components/UnderlineTabNav';
import { ui } from '../../lib/uiClasses';
import { CashflowPanel } from './components/CashflowPanel';
import { PatrimonyPanel } from './components/PatrimonyPanel';
import {
  BalanceRecordBalancesSection,
  RecordBalancesProvider,
} from './components/RecordBalancesProvider';

import { ComingSoonPanel } from '../../components/ComingSoonPanel';

const TAB_PANELS = {
  [BALANCE_TAB.CASHFLOW]: CashflowPanel,
  [BALANCE_TAB.PATRIMONY]: PatrimonyPanel,
  [BALANCE_TAB.ANALYSIS]: ComingSoonPanel,
};

export function BalancePage() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = resolveBalanceTab(searchParams.get('tab'));
  const ActivePanel = TAB_PANELS[tab] ?? TAB_PANELS[DEFAULT_BALANCE_TAB];

  const setTab = (id) => {
    setSearchParams({ tab: id }, { replace: true });
  };

  const balanceTabs = BALANCE_TABS.map((id) => {
    const shortKey = `balance.tabs.${id}Short`;
    const short = t(shortKey);
    return {
      id,
      label: t(`balance.tabs.${id}`),
      labelShort: short !== shortKey ? short : undefined,
    };
  });

  return (
    <RecordBalancesProvider>
      <div className={ui.stackPage}>
        <div>
          <h2 className={`mb-2 ${ui.pageTitle}`}>
            {t('balance.title')}
          </h2>
          <p className={`max-w-3xl text-sm leading-relaxed ${ui.text}`}>
            {t('balance.description')}
          </p>
        </div>

        <BalanceRecordBalancesSection />

        <UnderlineTabNav
          tabs={balanceTabs}
          activeId={tab}
          onChange={setTab}
          ariaLabel={t('balance.tabsLabel')}
        />

        <div
          role="tabpanel"
          id={`tabpanel-${tab}`}
          aria-labelledby={`tab-${tab}`}
        >
          <ActivePanel />
        </div>
      </div>
    </RecordBalancesProvider>
  );
}
