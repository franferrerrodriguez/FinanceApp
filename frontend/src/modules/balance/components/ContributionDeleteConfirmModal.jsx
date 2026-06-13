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
            className={`${ui.btnSecondary} [border-color:rgba(226,75,74,0.40)] text-[var(--color-negative)] hover:[border-color:rgba(226,75,74,0.60)] hover:bg-[rgba(226,75,74,0.10)]`}
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
