import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { ui } from '../../lib/uiClasses';
import { CashflowPanel } from './components/CashflowPanel';
import { ContributionsPanel } from './components/ContributionsPanel';
import { PatrimonyPlaceholderPanel } from './components/PatrimonyPlaceholderPanel';

const TABS = ['cashflow', 'contributions', 'patrimony'];

export function BalancePage() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const tab = TABS.includes(tabParam) ? tabParam : 'cashflow';

  const setTab = (id) => {
    setSearchParams({ tab: id }, { replace: true });
  };

  return (
    <div className="space-y-6">
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
        {TABS.map((id) => (
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

      {tab === 'cashflow' && <CashflowPanel />}
      {tab === 'contributions' && <ContributionsPanel />}
      {tab === 'patrimony' && <PatrimonyPlaceholderPanel />}
    </div>
  );
}
