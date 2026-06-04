import { useTranslation } from 'react-i18next';
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
}) {
  const { t } = useTranslation();

  return (
    <div className={`space-y-3 p-4 ${ui.cardMuted}`}>
      {!shareOnly && (
        <MoneyField
          id={id}
          label={label}
          hint={hint}
          value={total}
          onChange={onTotalChange}
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

      <label className="flex cursor-pointer items-center gap-3">
        <input
          type="checkbox"
          checked={shared}
          onChange={(e) => onSharedChange(e.target.checked)}
          className="h-4 w-4 shrink-0 rounded border-slate-400 text-emerald-500 focus:ring-emerald-500/40 dark:border-slate-600 dark:bg-slate-900"
        />
        <span className={`text-sm leading-snug ${ui.textLabel}`}>
          {t('onboarding.expenses.expenseShared')}
        </span>
      </label>

      {shared && (
        <div className={`space-y-2 border-t pt-3 ${ui.divider}`}>
          <label
            htmlFor={`${id}-share-percent`}
            className={`block text-sm ${ui.text}`}
          >
            {t('onboarding.expenses.yourSharePercent')}
          </label>
          <div className="flex items-center gap-3">
            <SharePercentInput
              id={`${id}-share-percent`}
              value={percent}
              onChange={onPercentChange}
            />
            <span className={ui.textMuted}>%</span>
          </div>
          <p className={ui.accentSoft}>
            {t('onboarding.expenses.sharePreview', {
              yours: formatMoney(yourShare),
              total: formatMoney(total),
            })}
          </p>
        </div>
      )}
    </div>
  );
}
