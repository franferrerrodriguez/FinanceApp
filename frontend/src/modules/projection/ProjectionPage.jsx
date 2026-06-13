import { useTranslation } from 'react-i18next';
import { ui } from '../../lib/uiClasses';
import { ProjectionDataSources } from './components/ProjectionDataSources';
import { ProjectionDataTable } from './components/ProjectionDataTable';
import { ProjectionSettingsPanel } from './components/ProjectionSettingsPanel';

export function ProjectionPage() {
  const { t } = useTranslation();

  return (
    <div className="min-w-0 space-y-6">
      <div className="space-y-3">
        <h2 className={ui.pageTitle}>
          {t('projection.title')}
        </h2>
        <p className={`text-sm leading-relaxed ${ui.textMuted}`}>
          {t('projection.subtitle')}
        </p>
        <p
          className="rounded-xl [border:0.5px_solid_rgba(239,159,39,0.30)] bg-[rgba(239,159,39,0.10)] px-4 py-3 text-sm leading-relaxed text-[var(--color-warning)]"
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
