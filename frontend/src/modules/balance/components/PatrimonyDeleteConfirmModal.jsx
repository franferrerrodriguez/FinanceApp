import { useTranslation } from 'react-i18next';
import { AppModal } from '../../../components/AppModal';
import { ui } from '../../../lib/uiClasses';

export function PatrimonyDeleteConfirmModal({
  open,
  itemName,
  snapshotMonths = 0,
  onConfirm,
  onCancel,
}) {
  const { t } = useTranslation();

  return (
    <AppModal
      open={open}
      onClose={onCancel}
      title={t('balance.patrimony.deleteConfirmTitle', { name: itemName })}
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
            {t('balance.patrimony.deleteConfirmAction')}
          </button>
        </>
      }
    >
      <div className="space-y-3 text-sm">
        <p className={ui.text}>
          {snapshotMonths > 0
            ? t('balance.patrimony.deleteConfirmWithHistory', {
                count: snapshotMonths,
              })
            : t('balance.patrimony.deleteConfirmNoHistory')}
        </p>
        <p className={ui.textMuted}>{t('balance.patrimony.deleteConfirmDeactivateHint')}</p>
      </div>
    </AppModal>
  );
}
