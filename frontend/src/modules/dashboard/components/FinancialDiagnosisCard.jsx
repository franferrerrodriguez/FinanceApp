import { Check, Info, Lightbulb, TriangleAlert } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useFinancialDiagnosis } from '../../../hooks/useFinancialDiagnosis';
import { ui } from '../../../lib/uiClasses';
import { formatMoney } from '../../../utils/formatters';

const toneStyles = {
  positive: {
    icon: Check,
    row: '[border:0.5px_solid_rgba(29,158,117,0.25)] bg-[rgba(29,158,117,0.06)]',
    iconClass: 'text-[var(--color-positive)]',
  },
  info: {
    icon: Info,
    row: '[border:0.5px_solid_rgba(55,138,221,0.25)] bg-[rgba(55,138,221,0.06)]',
    iconClass: 'text-[var(--color-info)]',
  },
  warn: {
    icon: TriangleAlert,
    row: '[border:0.5px_solid_rgba(239,159,39,0.25)] bg-[rgba(239,159,39,0.06)]',
    iconClass: 'text-[var(--color-warning)]',
  },
  tip: {
    icon: Lightbulb,
    row: '[border:0.5px_solid_rgba(255,255,255,0.10)] bg-[rgba(255,255,255,0.03)]',
    iconClass: 'text-[var(--text-muted)]',
  },
};

function formatParams(params = {}) {
  const next = { ...params };
  for (const key of ['amount', 'shortfall']) {
    if (typeof next[key] === 'number') next[key] = formatMoney(next[key]);
  }
  if (typeof next.rate === 'number') next.rate = `${next.rate}%`;
  if (typeof next.savingsRate === 'number') next.savingsRate = `${next.savingsRate}%`;
  if (typeof next.investmentRate === 'number') next.investmentRate = `${next.investmentRate}%`;
  if (typeof next.benchmark === 'number') next.benchmark = `${next.benchmark}%`;
  return next;
}

export function FinancialDiagnosisCard() {
  const { t } = useTranslation();
  const { insights } = useFinancialDiagnosis();

  if (!insights.length) return null;

  return (
    <section className={`${ui.chartCard} space-y-4`} aria-labelledby="financial-diagnosis-title">
      <div>
        <h2 id="financial-diagnosis-title" className={`text-base font-semibold ${ui.heading}`}>
          {t('dashboard.diagnosis.title')}
        </h2>
        <p className={`mt-1 text-sm ${ui.textMuted}`}>{t('dashboard.diagnosis.subtitle')}</p>
      </div>

      <ul className="space-y-2.5" role="list">
        {insights.map((insight) => {
          const tone = toneStyles[insight.tone] ?? toneStyles.info;
          const Icon = tone.icon;
          const params = formatParams(insight.params);

          return (
            <li
              key={insight.id}
              className={`flex gap-3 rounded-xl border px-3.5 py-3 text-sm leading-snug ${tone.row}`}
            >
              <Icon
                className={`mt-0.5 h-4 w-4 shrink-0 ${tone.iconClass}`}
                aria-hidden
              />
              <div className="min-w-0 flex-1">
                <p className={ui.textLabel}>
                  {t(`dashboard.diagnosis.items.${insight.id}`, params)}
                </p>
                {insight.href ? (
                  <Link
                    to={insight.href}
                    className={`mt-1.5 inline-block text-xs font-semibold ${ui.accent} underline-offset-2 hover:underline`}
                  >
                    {t(insight.actionKey ?? 'dashboard.diagnosis.viewAction')}
                  </Link>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
