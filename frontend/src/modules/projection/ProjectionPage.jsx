import { useTranslation } from 'react-i18next';
import { ui } from '../../lib/uiClasses';
import { ProjectionDataSources } from './components/ProjectionDataSources';
import { ProjectionDataTable } from './components/ProjectionDataTable';
import { ProjectionSettingsPanel } from './components/ProjectionSettingsPanel';

export function ProjectionPage() {
  const { t } = useTranslation();

  return (
    <div className="min-w-0 space-y-6">
      <div className="space-y-4">
        <div>
          <h2 className={`mb-2 text-2xl font-bold tracking-tight ${ui.heading}`}>
            {t('projection.title')}
          </h2>
          <p className={`max-w-3xl text-sm leading-relaxed ${ui.text}`}>
            {t('projection.subtitle')}
          </p>
        </div>
        <p
          className={`max-w-3xl rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm leading-relaxed text-amber-950 dark:text-amber-100`}
          role="note"
        >
          {t('projection.simulationNotice')}
        </p>
      </div>

      <ProjectionDataSources />
      <ProjectionSettingsPanel />
      <ProjectionDataTable />
    </div>
  );
}
