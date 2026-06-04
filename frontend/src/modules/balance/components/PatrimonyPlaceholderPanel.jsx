import { useTranslation } from 'react-i18next';
import { ui } from '../../../lib/uiClasses';

export function PatrimonyPlaceholderPanel() {
  const { t } = useTranslation();

  return (
    <div className={`p-10 text-center ${ui.cardDashed}`}>
      <h3 className={`text-lg font-semibold ${ui.heading}`}>
        {t('balance.patrimony.title')}
      </h3>
      <p className={`mx-auto mt-2 max-w-lg text-sm ${ui.text}`}>
        {t('balance.patrimony.description')}
      </p>
      <p className={`mx-auto mt-4 max-w-md text-sm ${ui.textMuted}`}>
        {t('balance.plannedFeatures')}
      </p>
    </div>
  );
}
