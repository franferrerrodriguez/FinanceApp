import { useTranslation } from 'react-i18next';
import { formatRatePercent } from '../../../utils/formatters';
import { SCENARIO_MULTIPLIERS } from '../../../lib/projectionReturns';

export const SCENARIO_COLORS = {
  pessimistic: {
    line: '#E24B4A',
    bg: 'rgba(226,75,74,0.12)',
    border: 'rgba(226,75,74,0.45)',
    text: '#E24B4A',
  },
  moderate: {
    line: '#1D9E75',
    bg: 'rgba(29,158,117,0.12)',
    border: 'rgba(29,158,117,0.45)',
    text: '#1D9E75',
  },
  optimistic: {
    line: '#4A90E2',
    bg: 'rgba(74,144,226,0.12)',
    border: 'rgba(74,144,226,0.45)',
    text: '#4A90E2',
  },
};

const SCENARIOS = ['pessimistic', 'moderate', 'optimistic'];

export function ScenarioSelector({ scenario, onChange, weightedReturn }) {
  const { t } = useTranslation();

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-[var(--text-muted)]">
        {t('projection.scenarios.title')}
      </p>
      <div className="flex flex-wrap gap-2">
        {SCENARIOS.map((s) => {
          const active = scenario === s;
          const colors = SCENARIO_COLORS[s];
          const effectiveReturn = weightedReturn * SCENARIO_MULTIPLIERS[s];

          const labelKey =
            s === 'moderate'
              ? t('projection.scenarios.userConfig')
              : formatRatePercent(effectiveReturn);

          return (
            <button
              key={s}
              type="button"
              onClick={() => onChange(s)}
              style={
                active
                  ? { background: colors.bg, borderColor: colors.border, color: colors.text }
                  : undefined
              }
              className={`flex flex-col items-start rounded-xl px-3 py-2 text-left text-xs transition [border:0.5px_solid_transparent] ${
                active
                  ? 'font-semibold'
                  : 'bg-[var(--bg-tertiary)] font-medium text-[var(--text-muted)] [border-color:var(--border-default)] hover:text-[var(--text-secondary)]'
              }`}
            >
              <span className="font-semibold">
                {t(`projection.scenarios.${s}`)}
                <span className="ml-1.5 font-normal opacity-70">{labelKey}</span>
              </span>
              <span className={`mt-0.5 text-[10px] leading-snug ${active ? 'opacity-75' : 'opacity-50'}`}>
                {t(`projection.scenarios.${s}.note`)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
