import { Check, Info, Lightbulb, TriangleAlert } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useFinancialDiagnosis } from '../../../hooks/useFinancialDiagnosis';
import { ui } from '../../../lib/uiClasses';
import { formatMoney } from '../../../utils/formatters';

const toneStyles = {
  positive: {
    icon: Check,
    row: 'border-emerald-500/25 bg-emerald-500/5 dark:bg-emerald-950/20',
    iconClass: 'text-emerald-600 dark:text-emerald-400',
  },
  info: {
    icon: Info,
    row: 'border-sky-500/25 bg-sky-500/5 dark:bg-sky-950/20',
    iconClass: 'text-sky-600 dark:text-sky-400',
  },
  warn: {
    icon: TriangleAlert,
    row: 'border-amber-500/25 bg-amber-500/5 dark:bg-amber-950/20',
    iconClass: 'text-amber-600 dark:text-amber-400',
  },
  tip: {
    icon: Lightbulb,
    row: 'border-slate-300/80 bg-slate-50/80 dark:border-slate-600 dark:bg-slate-800/40',
    iconClass: 'text-slate-500 dark:text-slate-400',
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
