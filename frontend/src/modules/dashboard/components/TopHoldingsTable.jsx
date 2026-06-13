import { useTranslation } from 'react-i18next';
import { ui } from '../../../lib/uiClasses';
import { formatMoney } from '../../../utils/formatters';

export function TopHoldingsTable({ topAssets, topLiabilities }) {
  const { t } = useTranslation();

  if (!topAssets.length && !topLiabilities.length) {
    return (
      <div className={ui.chartCard}>
        <h3 className={`mb-4 text-sm font-medium ${ui.textLabel}`}>
          {t('dashboard.charts.holdings.title')}
        </h3>
        <p className={`text-center text-sm ${ui.textMuted}`}>
          {t('dashboard.charts.holdings.empty')}
        </p>
      </div>
    );
  }

  return (
    <div className={ui.chartCard}>
      <h3 className={`mb-4 text-sm font-medium ${ui.textLabel}`}>
        {t('dashboard.charts.holdings.title')}
      </h3>
      <div className="grid gap-6 sm:grid-cols-2">
        <HoldingsList
          title={t('dashboard.charts.holdings.topAssets')}
          items={topAssets}
          valueClass="text-[var(--color-positive)]"
        />
        <HoldingsList
          title={t('dashboard.charts.holdings.topLiabilities')}
          items={topLiabilities}
          valueClass="text-[var(--color-negative)]"
        />
      </div>
    </div>
  );
}

function HoldingsList({ title, items, valueClass }) {
  return (
    <div>
      <p className={`mb-2 text-xs font-medium uppercase tracking-wide ${ui.textMuted}`}>
        {title}
      </p>
      <ul className="space-y-2">
        {items.map((item) => (
          <li
            key={item.id}
            className="flex items-center justify-between gap-2 text-sm"
          >
            <span className={`truncate ${ui.textLabel}`}>{item.name}</span>
            <span className={`shrink-0 font-medium ${valueClass}`}>
              {formatMoney(item.value)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
