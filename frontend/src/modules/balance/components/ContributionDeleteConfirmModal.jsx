import { useTranslation } from 'react-i18next';
import { AppModal } from '../../../components/AppModal';
import { ui } from '../../../lib/uiClasses';

export function ContributionDeleteConfirmModal({
  open,
  itemName,
  onConfirm,
  onCancel,
}) {
  const { t } = useTranslation();

  return (
    <AppModal
      open={open}
      onClose={onCancel}
      title={t('balance.contributions.deleteConfirmTitle', { name: itemName })}
      footer={
        <>
          <button type="button" className={ui.btnSecondary} onClick={onCancel}>
            {t('common.cancel')}
          </button>
          <button
            type="button"
            className={`${ui.btnSecondary} border-red-300 text-red-700 hover:border-red-400 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/40`}
            onClick={onConfirm}
          >
            {t('balance.contributions.deleteConfirmAction')}
          </button>
        </>
      }
    >
      <p className={`text-sm ${ui.text}`}>
        {t('balance.contributions.deleteConfirmBody')}
      </p>
    </AppModal>
  );
}
