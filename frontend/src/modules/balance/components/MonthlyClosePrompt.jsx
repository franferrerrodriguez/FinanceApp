import { useTranslation } from 'react-i18next';
import { usePreferences } from '../../../store/hooks';
import { formatMonthKeyLong } from '../../../utils/monthLabel';
import { ui } from '../../../lib/uiClasses';

export function MonthlyClosePrompt({ status, onCloseMonth, className = '' }) {
  const { t } = useTranslation();
  const { locale } = usePreferences();

  if (!status?.pendingMonths?.length) return null;

  const { pendingMonths, overdueMonths, suggestedMonthKey, urgency } = status;
  const isUrgent = urgency === 'danger' || urgency === 'warn';

  const messageKey =
    overdueMonths.length > 0
      ? 'balance.patrimony.closePromptOverdue'
      : urgency === 'warn'
        ? 'balance.patrimony.closePromptDue'
        : 'balance.patrimony.closePromptCurrent';

  const messageParams =
    overdueMonths.length > 0
      ? {
          count: pendingMonths.length,
          month: formatMonthKeyLong(overdueMonths[0], locale),
        }
      : {
          month: formatMonthKeyLong(suggestedMonthKey, locale),
          days: status.daysLeftInMonth,
        };

  return (
    <div
      className={`rounded-xl border px-4 py-4 ${
        isUrgent
          ? 'border-amber-500/35 bg-amber-500/10 dark:border-amber-500/40'
          : `border-emerald-500/25 bg-emerald-500/5 dark:bg-emerald-500/10`
      } ${className}`}
      role="status"
    >
      <p
        className={`text-sm leading-snug ${
          isUrgent
            ? 'text-amber-950 dark:text-amber-100'
            : ui.text
        }`}
      >
        {t(messageKey, messageParams)}
      </p>

      {pendingMonths.length > 1 ? (
        <ul className="mt-3 flex flex-wrap gap-2">
          {pendingMonths.map((mk) => (
            <li key={mk}>
              <button
                type="button"
                onClick={() => onCloseMonth(mk)}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                  mk === suggestedMonthKey
                    ? 'border-emerald-600 bg-emerald-600 text-white dark:border-emerald-500 dark:bg-emerald-500'
                    : `${ui.cardMuted} ${ui.textLabel} hover:border-emerald-500/50`
                }`}
              >
                {formatMonthKeyLong(mk, locale)}
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <button
        type="button"
        className={`mt-3 ${isUrgent ? ui.btnPrimary : ui.btnSecondary}`}
        onClick={() => onCloseMonth(suggestedMonthKey)}
      >
        {t('balance.patrimony.closeMonthFor', {
          month: formatMonthKeyLong(suggestedMonthKey, locale),
        })}
      </button>
    </div>
  );
}
