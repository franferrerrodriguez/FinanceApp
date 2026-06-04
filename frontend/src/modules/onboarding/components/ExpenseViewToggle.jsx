import { useTranslation } from 'react-i18next';
import { ui } from '../../../lib/uiClasses';

export function ExpenseViewToggle({ detailed, onToggle }) {
  const { t } = useTranslation();

  return (
    <button type="button" onClick={onToggle} className={ui.btnViewToggle}>
      {detailed
        ? t('onboarding.expenses.useSimpleView')
        : t('onboarding.expenses.useDetailedView')}
    </button>
  );
}
