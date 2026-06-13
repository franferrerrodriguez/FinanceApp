import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CheckCircle, AlertTriangle, Lightbulb } from 'lucide-react';
import { ui } from '../../lib/uiClasses';
import {
  computeDiagnostics,
  groupDiagnosticsByStatus,
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
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className={`text-base font-semibold ${ui.heading}`}>
            {t('diagnostics.card.title')}
          </h2>
          <p className={`mt-1 text-sm ${ui.textMuted}`}>{t('diagnostics.card.subtitle')}</p>
        </div>
        <Link to="/diagnostico" className={ui.btnLink}>
          {t('diagnostics.card.viewAll')}
        </Link>
      </div>
      <ul className={ui.stackBlocks}>
        {top.map((item) => (
          <DiagnosticItem key={item.id} item={item} />
        ))}
      </ul>
    </section>
  );
}

export function DiagnosticoPage() {
  const { t } = useTranslation();
  const finance = useFinanceData();
  const all = computeDiagnostics(finance);
  const groups = groupDiagnosticsByStatus(all);

  return (
    <div className={ui.stackPage}>
      <div>
        <h2 className={`mb-2 ${ui.pageTitle}`}>
          {t('diagnostics.page.title')}
        </h2>
        <p className={`text-sm ${ui.textMuted}`}>{t('diagnostics.page.subtitle')}</p>
        <p className={`mt-1 text-xs ${ui.textMuted}`}>{t('diagnostics.page.updated')}</p>
      </div>

      {!all.length ? (
        <div className={`${ui.chartCard} py-12 text-center`}>
          <p className={`text-sm ${ui.text}`}>{t('diagnostics.page.empty')}</p>
          <Link to="/balance" className={`mt-4 inline-block ${ui.actionLink}`}>
            {t('diagnostics.page.emptyAction')}
          </Link>
        </div>
      ) : (
        <>
          {groups.ok.length ? (
            <DiagnosticSection
              title={t('diagnostics.page.sectionOk')}
              items={groups.ok}
            />
          ) : null}
          {groups.warn.length ? (
            <DiagnosticSection
              title={t('diagnostics.page.sectionWarn')}
              items={groups.warn}
            />
          ) : null}
          {groups.opportunity.length ? (
            <DiagnosticSection
              title={t('diagnostics.page.sectionOpportunity')}
              items={groups.opportunity}
            />
          ) : null}
        </>
      )}
    </div>
  );
}

function DiagnosticSection({ title, items }) {
  return (
    <section className={ui.stackSection}>
      <h3 className={`text-sm font-semibold uppercase tracking-wider ${ui.textMuted}`}>
        {title}
      </h3>
      <ul className={ui.stackBlocks}>
        {items.map((item) => (
          <DiagnosticItem key={item.id} item={item} />
        ))}
      </ul>
    </section>
  );
}
