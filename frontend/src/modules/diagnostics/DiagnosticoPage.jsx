import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CheckCircle, AlertTriangle, Lightbulb } from 'lucide-react';
import { ui } from '../../lib/uiClasses';
import {
  computeDiagnostics,
  sortDiagnosticsByUrgency,
} from '../../lib/diagnostics';
import { useFinanceData } from '../../store/hooks';
import { formatMoney, formatPercent } from '../../utils/formatters';

function formatDiagParams(params) {
  const out = { ...params };
  if (out.rate != null) out.rate = formatPercent(out.rate);
  if (out.real != null) out.real = formatPercent(out.real);
  if (out.estimated != null) out.estimated = formatPercent(out.estimated);
  if (out.savingsRate != null) out.savingsRate = formatPercent(out.savingsRate);
  if (out.indexRate != null) out.indexRate = formatPercent(out.indexRate);
  if (out.liquid != null) out.liquid = formatMoney(out.liquid);
  if (out.excess != null) out.excess = formatMoney(out.excess);
  if (out.gap != null) out.gap = formatMoney(out.gap);
  if (out.monthlyIncome != null) out.monthlyIncome = formatMoney(out.monthlyIncome);
  if (out.extra != null) out.extra = formatMoney(out.extra);
  return out;
}

const STATUS_ICON = {
  ok: { Icon: CheckCircle, color: 'text-[var(--color-positive)]' },
  warn: { Icon: AlertTriangle, color: 'text-[var(--color-warning)]' },
  opportunity: { Icon: Lightbulb, color: 'text-[var(--color-info)]' },
};

function DiagnosticItem({ item }) {
  const { t } = useTranslation();
  const params = formatDiagParams(item.params);
  const { Icon, color } = STATUS_ICON[item.status] ?? STATUS_ICON.opportunity;

  return (
    <li className={`${ui.cardInset} p-4`}>
      <div className="flex gap-3">
        <span className={`mt-0.5 shrink-0 ${color}`} aria-hidden>
          <Icon size={18} />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className={`text-sm font-semibold ${ui.heading}`}>{t(item.titleKey, params)}</h3>
          <p className={`mt-1 text-sm ${ui.text}`}>{t(item.bodyKey, params)}</p>
          {item.actionHref ? (
            <Link to={item.actionHref} className={`mt-2 inline-block ${ui.actionLink}`}>
              {t(item.actionKey)}
            </Link>
          ) : null}
        </div>
      </div>
    </li>
  );
}

export function DiagnosticCard() {
  const { t } = useTranslation();
  const finance = useFinanceData();
  const all = computeDiagnostics(finance);
  const top = sortDiagnosticsByUrgency(all).slice(0, 3);

  if (!top.length) return null;

  return (
    <section className={`${ui.chartCard} ${ui.stackSection}`}>
      <div>
        <h2 className={`text-base font-semibold ${ui.heading}`}>
          {t('diagnostics.card.title')}
        </h2>
        <p className={`mt-1 text-sm ${ui.textMuted}`}>{t('diagnostics.card.subtitle')}</p>
      </div>
      <ul className={ui.stackBlocks}>
        {top.map((item) => (
          <DiagnosticItem key={item.id} item={item} />
        ))}
      </ul>
    </section>
  );
}

