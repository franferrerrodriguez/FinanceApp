import { useTranslation } from 'react-i18next';
import { FormCheckboxField } from '../../../components/FormCheckboxField';
import { FormFieldFrame } from '../../../components/FormFieldFrame';
import { FormSection } from '../../../components/FormSection';
import { formatMoney } from '../../../utils/formatters';
import { ui } from '../../../lib/uiClasses';
import { MoneyField } from './MoneyField';
import { SharePercentInput } from './SharePercentInput';

export function SharedExpenseBlock({
  id,
  label,
  hint,
  total,
  onTotalChange,
  shared,
  onSharedChange,
  percent,
  onPercentChange,
  yourShare,
  shareOnly = false,
  embedded = false,
}) {
  const { t } = useTranslation();

  const body = (
    <>
      {!shareOnly && (
        <MoneyField
          id={id}
          label={label}
          hint={hint}
          value={total}
          onChange={onTotalChange}
          fullWidth
        />
      )}
      {shareOnly && (
        <p className={`text-sm font-medium ${ui.textLabel}`}>
          {label}
          <span className={`mt-1 block text-base ${ui.heading}`}>
            {t('onboarding.expenses.detailedTotal', {
              amount: formatMoney(total),
            })}
          </span>
        </p>
      )}

      <FormCheckboxField
        id={`${id}-shared`}
        checked={shared}
        onChange={onSharedChange}
        label={t('onboarding.expenses.expenseShared')}
      />

      {shared ? (
        <div className={`space-y-2 border-t pt-3 ${ui.divider}`}>
          <FormFieldFrame
            layout="stacked"
            label={t('onboarding.expenses.yourSharePercent')}
          >
            <div className="flex items-center gap-3">
              <SharePercentInput
                id={`${id}-share-percent`}
                value={percent}
                onChange={onPercentChange}
              />
              <span className={ui.textMuted}>%</span>
            </div>
          </FormFieldFrame>
          <p className={ui.accentSoft}>
            {t('onboarding.expenses.sharePreview', {
              yours: formatMoney(yourShare),
              total: formatMoney(total),
            })}
          </p>
        </div>
      ) : null}
    </>
  );

  if (embedded) {
    return <div className="space-y-3">{body}</div>;
  }

  return <FormSection>{body}</FormSection>;
}
