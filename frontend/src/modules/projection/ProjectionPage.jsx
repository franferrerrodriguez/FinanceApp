import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { UnderlineTabNav } from '../../components/UnderlineTabNav';
import { ui } from '../../lib/uiClasses';
import { ProjectionDataSources } from './components/ProjectionDataSources';
import { ProjectionDataTable } from './components/ProjectionDataTable';
import { ProjectionSettingsPanel } from './components/ProjectionSettingsPanel';
import { MortgageAmortizationPanel } from '../balance/components/MortgageAmortizationPanel';

const TABS = ['projection', 'mortgage'];

export function ProjectionPage() {
  const { t } = useTranslation();
  const [tab, setTab] = useState('projection');

  const tabs = TABS.map((id) => ({
    id,
    label: t(`projection.tabs.${id}`),
  }));

  return (
    <div className="min-w-0 space-y-6">
      <div className="space-y-3">
        <h2 className={ui.pageTitle}>{t('projection.title')}</h2>
        <p className={`text-sm leading-relaxed ${ui.textMuted}`}>
          {t('projection.subtitle')}
        </p>
      </div>

      <UnderlineTabNav
        tabs={tabs}
        activeId={tab}
        onChange={setTab}
        ariaLabel={t('projection.tabsLabel')}
      />

      <div role="tabpanel" id={`tabpanel-${tab}`}>
        {tab === 'projection' ? (
          <div className="space-y-6">
            <p
              className="rounded-xl [border:0.5px_solid_rgba(239,159,39,0.30)] bg-[rgba(239,159,39,0.10)] px-4 py-3 text-sm leading-relaxed text-[var(--color-warning)]"
              role="note"
            >
              {t('projection.simulationNotice')}
            </p>
            <ProjectionDataSources />
            <ProjectionSettingsPanel />
            <ProjectionDataTable />
          </div>
        ) : (
          <MortgageAmortizationPanel />
        )}
      </div>
    </div>
  );
}
