import { useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ScrollHintBanner,
  useHorizontalScrollEdges,
} from '../../../components/HorizontalScrollRegion';
import { VirtualList } from '../../../components/VirtualList';
import {
  buildMonthlyProjectionTable,
  summarizeMonthlyProjection,
} from '../../../lib/projectionTable';
import { normalizeProjectionYears } from '../../../lib/constants';
import { hasProjectionInvestmentPlans } from '../../../lib/contributionPlans';
import { getProjectionAnnualRate } from '../../../lib/projectionRates';
import { ui } from '../../../lib/uiClasses';
import { useFinanceData } from '../../../store/hooks';
import { formatProjectionDate } from '../../../utils/projectionDate';
import { formatMoney } from '../../../utils/formatters';
import { ProjectionSummary } from './ProjectionSummary';

const ROW_HEIGHT = 44;
const HEAD_HEIGHT = 48;
const LIST_MAX_HEIGHT = 480;
const TABLE_MAX_HEIGHT = HEAD_HEIGHT + LIST_MAX_HEIGHT;
const TABLE_MIN_WIDTH = 54 * 16;

const BASE_COLUMNS = [
  'date',
  'salary',
  'fixed',
  'variable',
  'netContribution',
  'investments',
  'monthlyReturn',
  'patrimony',
];
const PUNCTUAL_COLUMN = 'punctual';

function rowBg(isEven) {
  return isEven ? 'bg-white dark:bg-slate-900' : 'bg-slate-50 dark:bg-slate-800';
}

export function ProjectionDataTable() {
  const { t } = useTranslation();
  const { settings, contributionPlans, annualExpenses, salaryHistory } =
    useFinanceData();
  const scrollRef = useRef(null);
  const showPunctual = annualExpenses.length > 0;
  const columns = useMemo(() => {
    if (!showPunctual) return BASE_COLUMNS;
    const idx = BASE_COLUMNS.indexOf('netContribution');
    return [
      ...BASE_COLUMNS.slice(0, idx),
      PUNCTUAL_COLUMN,
      ...BASE_COLUMNS.slice(idx),
    ];
  }, [showPunctual]);
  const projectionYears = normalizeProjectionYears(settings.projectionYears);
  const initialPatrimony = settings.initialPatrimony ?? 0;
  const annualRate = getProjectionAnnualRate(settings);

  const rows = useMemo(
    () =>
      buildMonthlyProjectionTable({
        settings,
        contributionPlans,
        annualExpenses,
        salaryHistory,
        years: projectionYears,
        initialPatrimony,
      }),
    [
      settings,
      contributionPlans,
      annualExpenses,
      salaryHistory,
      projectionYears,
      initialPatrimony,
    ],
  );

  const summary = useMemo(
    () => summarizeMonthlyProjection(rows, initialPatrimony),
    [rows, initialPatrimony],
  );

  const hasInvestmentPlans = hasProjectionInvestmentPlans(contributionPlans);

  const { overflow: canScrollX, updateEdges } = useHorizontalScrollEdges(
    scrollRef,
    [rows.length, columns.length, showPunctual],
  );

  if (!rows.length) return null;

  const headerLabels = {
    date: t('projection.table.date'),
    salary: t('projection.table.salary'),
    fixed: t('projection.table.fixed'),
    variable: t('projection.table.variable'),
    punctual: t('projection.table.punctual'),
    netContribution: t('projection.table.netContribution'),
    investments: t('projection.table.investments'),
    monthlyReturn: t('projection.table.monthlyReturn'),
    patrimony: t('projection.table.patrimony'),
  };

  const colClass = {
    date: 'w-[7rem] shrink-0',
    salary: 'w-[6.5rem] shrink-0 text-right',
    fixed: 'w-[6.5rem] shrink-0 text-right',
    variable: 'w-[6.5rem] shrink-0 text-right',
    punctual: 'w-[6.5rem] shrink-0 text-right',
    netContribution: 'w-[7rem] shrink-0 text-right',
    investments: 'w-[7rem] shrink-0 text-right',
    monthlyReturn: 'w-[7rem] shrink-0 text-right',
    patrimony:
      'w-[8rem] shrink-0 text-right font-semibold text-emerald-700 dark:text-emerald-400',
  };

  const tableHeader = (
    <div
      className={`flex border-b ${ui.divider} ${headBg()}`}
      style={{ height: HEAD_HEIGHT, minWidth: TABLE_MIN_WIDTH }}
    >
      {columns.map((key) => (
        <div
          key={key}
          className={`flex h-full items-center px-3 text-xs font-semibold uppercase tracking-wide whitespace-nowrap ${ui.textMuted} ${colClass[key]} ${
            key === 'date'
              ? `sticky left-0 z-30 border-r ${ui.divider} ${headBg()}`
              : ''
          } ${key === 'patrimony' ? ui.heading : ''}`}
        >
          {headerLabels[key]}
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-4">
      <ProjectionSummary
        summary={summary}
        configuredAnnualRate={annualRate}
      />

      {!hasInvestmentPlans ? (
        <p
          className={`rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-950 dark:text-amber-100`}
        >
          {t('projection.sources.noContributions')}
        </p>
      ) : null}

      <div className={`${ui.chartCard} !p-0`}>
        <div className="p-4 pb-0 sm:p-5 sm:pb-0">
          <ScrollHintBanner
            hint={t('projection.table.scrollHint')}
            show={canScrollX}
          />

          <VirtualList
            scrollRef={scrollRef}
            onScroll={updateEdges}
            itemCount={rows.length}
            itemHeight={ROW_HEIGHT}
            maxHeight={TABLE_MAX_HEIGHT}
            headerHeight={HEAD_HEIGHT}
            header={tableHeader}
            minWidth={TABLE_MIN_WIDTH}
          >
            {({ index, style }) => (
              <ProjectionRow
                row={rows[index]}
                style={style}
                columns={columns}
                colClass={colClass}
                isEven={index % 2 === 0}
              />
            )}
          </VirtualList>
        </div>
      </div>

      <p className={`px-4 text-xs leading-snug sm:px-5 ${ui.textMuted}`}>
        {t('projection.table.monthCount', {
          count: rows.length,
          years: projectionYears,
        })}
      </p>
    </div>
  );
}

function headBg() {
  return 'bg-slate-50 dark:bg-slate-900';
}

function ProjectionRow({ row, style, columns, colClass, isEven }) {
  const bg = rowBg(isEven);
  const january = row.isJanuary
    ? 'bg-slate-100/90 dark:bg-slate-800/90'
    : '';

  const cells = {
    date: formatProjectionDate(row.date),
    salary: formatMoney(row.salary),
    fixed: formatMoney(row.fixedExpenses),
    variable: formatMoney(row.variableExpenses),
    punctual:
      row.punctualExpenses > 0
        ? formatMoney(-row.punctualExpenses)
        : '—',
    netContribution: formatMoney(row.netContribution),
    investments: formatMoney(row.additionalInvestments),
    monthlyReturn: formatMoney(row.monthlyReturn),
    patrimony: formatMoney(row.patrimonyEnd),
  };

  return (
    <div
      style={{ ...style, minWidth: TABLE_MIN_WIDTH }}
      className={`flex items-center border-b ${ui.divider} ${bg} ${january}`}
    >
      {columns.map((key) => (
        <div
          key={key}
          className={`px-3 text-sm tabular-nums whitespace-nowrap ${colClass[key]} ${
            key === 'date'
              ? `sticky left-0 z-10 border-r ${ui.divider} ${bg} ${january} ${ui.textLabel}`
              : key === 'patrimony'
                ? ''
                : ui.textLabel
          }`}
        >
          {cells[key]}
        </div>
      ))}
    </div>
  );
}
