import { useTranslation } from 'react-i18next';
import { ui } from '../../lib/uiClasses';
import { ProjectionDataSources } from './components/ProjectionDataSources';
import { ProjectionDataTable } from './components/ProjectionDataTable';
import { ProjectionSettingsPanel } from './components/ProjectionSettingsPanel';

export function ProjectionPage() {
  const { t } = useTranslation();

  return (
    <div className="min-w-0 space-y-6">
      <div>
        <h2 className={`mb-2 text-2xl font-bold tracking-tight ${ui.heading}`}>
          {t('projection.title')}
        </h2>
        <p className={`max-w-3xl text-sm leading-relaxed ${ui.text}`}>
          {t('projection.subtitle')}
        </p>
      </div>

      <ProjectionDataSources />
      <ProjectionSettingsPanel />
      <ProjectionDataTable />
    </div>
  );
}
