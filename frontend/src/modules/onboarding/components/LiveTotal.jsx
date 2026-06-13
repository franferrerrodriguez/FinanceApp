import { formatMoney } from '../../../utils/formatters';
import { ui } from '../../../lib/uiClasses';

export function LiveTotal({ label, amount, variant = 'neutral', inList = false }) {
  const amountClass =
    variant === 'positive'
      ? 'text-[var(--color-positive)]'
      : variant === 'negative'
        ? 'text-[var(--color-negative)]'
        : ui.heading;

  if (inList) {
    return (
      <div className="flex items-center justify-between gap-3 px-3 py-2.5">
        <span className={`min-w-0 text-sm leading-snug ${ui.text}`}>{label}</span>
        <span
          className={`shrink-0 text-sm font-semibold tabular-nums ${amountClass}`}
        >
          {formatMoney(amount)}
        </span>
      </div>
    );
  }

  return (
    <div
      className={`flex items-center justify-between gap-4 px-4 py-3 ${ui.cardInset}`}
    >
      <span className={`min-w-0 text-sm font-medium ${ui.textLabel}`}>{label}</span>
      <span className={`shrink-0 text-lg font-semibold tabular-nums ${amountClass}`}>
        {formatMoney(amount)}
      </span>
    </div>
  );
}
