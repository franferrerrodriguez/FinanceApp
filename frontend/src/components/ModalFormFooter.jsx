import { useTranslation } from 'react-i18next';
import { ui } from '../lib/uiClasses';

export function ModalFormFooter({
  onCancel,
  onSave,
  canSave = true,
  saveLabel,
  cancelLabel,
  onDelete,
  deleteLabel,
}) {
  const { t } = useTranslation();

  return (
    <>
      {onDelete ? (
        <button
          type="button"
          className={`order-3 mr-auto w-full py-2 sm:order-none sm:w-auto ${ui.actionLinkDanger}`}
          onClick={onDelete}
        >
          {deleteLabel}
        </button>
      ) : null}
      <button
        type="button"
        className={`${ui.btnSecondary} order-2 w-full sm:order-none sm:w-auto`}
        onClick={onCancel}
      >
        {cancelLabel ?? t('common.cancel')}
      </button>
      <button
        type="button"
        className={`${ui.btnPrimary} order-1 w-full sm:order-none sm:w-auto`}
        disabled={!canSave}
        onClick={onSave}
      >
        {saveLabel ?? t('common.save')}
      </button>
    </>
  );
}
