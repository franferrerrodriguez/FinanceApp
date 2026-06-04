import { formatMoney } from '../../../utils/formatters';
import { ui } from '../../../lib/uiClasses';

export function LiveTotal({ label, amount, variant = 'neutral' }) {
  const color =
    variant === 'positive'
      ? 'text-emerald-600 dark:text-emerald-400'
      : variant === 'negative'
        ? 'text-red-600 dark:text-red-400'
        : ui.heading;

  return (
    <div
      className={`flex items-center justify-between px-4 py-3 ${ui.cardInset}`}
    >
      <span className={`text-sm ${ui.text}`}>{label}</span>
      <span className={`text-lg font-semibold ${color}`}>
        {formatMoney(amount)}
      </span>
    </div>
  );
}
