import { useEffect, useMemo, useRef, useState } from 'react';
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
import { hasProjectionContributionData } from '../../../lib/contributionProjection';
import {
  buildInitialBucketState,
  computeWeightedPortfolioReturn,
  getProjectionStartingPatrimony,
} from '../../../lib/projectionBuckets';
import { ui } from '../../../lib/uiClasses';
import { useFinanceData } from '../../../store/hooks';
import { formatProjectionDate } from '../../../utils/projectionDate';
import { formatMoney } from '../../../utils/formatters';
import {
  PROJECTION_COLUMN,
  buildProjectionColumnKeys,
  columnFlexStyle,
  getTableMinWidth,
  headerLabelKey,
  tableRowLayoutStyle,
} from '../projectionTableColumns';
import { ProjectionSummary } from './ProjectionSummary';

const MOBILE_MEDIA = '(max-width: 767px)';
const ROW_HEIGHT_NARROW = 42;
const ROW_HEIGHT_WIDE = 44;
const HEAD_HEIGHT_NARROW = 64;
const HEAD_HEIGHT_WIDE = 48;
const LIST_MAX_HEIGHT = 480;

function rowBg(isEven) {
  return isEven ? 'bg-white dark:bg-slate-900' : 'bg-slate-50 dark:bg-slate-800';
}

function headBg() {
  return 'bg-slate-50 dark:bg-slate-900';
}

function stickyDateShadow(scrolledX) {
  return scrolledX
    ? 'shadow-[4px_0_10px_-2px_rgba(15,23,42,0.12)] dark:shadow-[4px_0_10px_-2px_rgba(0,0,0,0.45)]'
    : '';
}

export function ProjectionDataTable() {
  const { t } = useTranslation();
  const {
    settings,
    contributionPlans,
    contributionEntries,
    annualExpenses,
    cashflowHistory,
    assets,
    liabilities,
    snapshots,
  } = useFinanceData();
  const scrollRef = useRef(null);
  const [narrowViewport, setNarrowViewport] = useState(() =>
    typeof window !== 'undefined'
      ? window.matchMedia(MOBILE_MEDIA).matches
      : false,
  );
  const [scrolledX, setScrolledX] = useState(false);

  const showPunctual = annualExpenses.length > 0;
  const columns = useMemo(
    () => buildProjectionColumnKeys(showPunctual),
    [showPunctual],
  );
  const tableMinWidth = getTableMinWidth(columns, narrowViewport);
  const headHeight = narrowViewport ? HEAD_HEIGHT_NARROW : HEAD_HEIGHT_WIDE;
  const rowHeight = narrowViewport ? ROW_HEIGHT_NARROW : ROW_HEIGHT_WIDE;
  const tableMaxHeight = headHeight + LIST_MAX_HEIGHT;

  useEffect(() => {
    const mq = window.matchMedia(MOBILE_MEDIA);
    const onChange = () => setNarrowViewport(mq.matches);
    mq.addEventListener('change', onChange);
    setNarrowViewport(mq.matches);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const projectionYears = normalizeProjectionYears(settings.projectionYears);

  const initialPatrimony = useMemo(
    () =>
      getProjectionStartingPatrimony({
        settings,
        assets,
        liabilities,
        snapshots,
      }),
    [settings, assets, liabilities, snapshots],
  );

  const bucketPreview = useMemo(
    () =>
      buildInitialBucketState({
        settings,
        assets,
        liabilities,
        snapshots,
        initialPatrimony: settings.initialPatrimony ?? 0,
      }),
    [settings, assets, liabilities, snapshots],
  );

  const weightedPortfolioReturn = useMemo(
    () =>
      computeWeightedPortfolioReturn(
        bucketPreview.buckets,
        bucketPreview.bucketRates,
      ),
    [bucketPreview],
  );

  const rows = useMemo(
    () =>
      buildMonthlyProjectionTable({
        settings,
        contributionPlans,
        contributionEntries,
        annualExpenses,
        cashflowHistory,
        assets,
        liabilities,
        snapshots,
        years: projectionYears,
      }),
    [
      settings,
      contributionPlans,
      contributionEntries,
      annualExpenses,
      cashflowHistory,
      assets,
      liabilities,
      snapshots,
      projectionYears,
    ],
  );

  const summary = useMemo(
    () => summarizeMonthlyProjection(rows, initialPatrimony),
    [rows, initialPatrimony],
  );

  const hasInvestmentData = hasProjectionContributionData({
    entries: contributionEntries,
    contributionPlans,
  });

  const { overflow: canScrollX, right: canScrollRight, updateEdges } =
    useHorizontalScrollEdges(scrollRef, [
      rows.length,
      columns.length,
      showPunctual,
      narrowViewport,
      tableMinWidth,
    ]);

  const handleScroll = (event) => {
    updateEdges();
    setScrolledX(event.currentTarget.scrollLeft > 2);
  };

  if (!rows.length) return null;

  const tableHeader = (
    <div
      className={`flex w-full border-b ${ui.divider} ${headBg()}`}
      style={{ height: headHeight, ...tableRowLayoutStyle(tableMinWidth) }}
    >
      {columns.map((key) => {
        const isDate = key === PROJECTION_COLUMN.DATE;
        const isPatrimony = key === PROJECTION_COLUMN.PATRIMONY;
        const alignRight = key !== PROJECTION_COLUMN.DATE;

        return (
          <div
            key={key}
            style={columnFlexStyle(key, narrowViewport)}
            className={`flex shrink-0 items-center overflow-hidden px-2 py-1 sm:px-3 ${
              alignRight ? 'justify-end text-right' : 'justify-start text-left'
            } ${
              isDate
                ? `sticky left-0 z-30 rounded-tl-2xl border-r ${ui.divider} ${headBg()} ${stickyDateShadow(scrolledX)}`
                : ''
            }`}
          >
            <span
              className={`block w-full font-semibold text-slate-600 dark:text-slate-400 ${
                narrowViewport
                  ? 'text-[10px] leading-snug tracking-normal whitespace-normal'
                  : 'text-xs uppercase leading-tight tracking-wide whitespace-nowrap'
              } ${isPatrimony ? ui.heading : ''}`}
            >
              {t(headerLabelKey(key, narrowViewport))}
            </span>
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="space-y-4">
      <ProjectionSummary
        summary={summary}
        weightedPortfolioReturn={weightedPortfolioReturn}
        bucketRates={bucketPreview.bucketRates}
        buckets={bucketPreview.buckets}
      />

      {!hasInvestmentData ? (
        <p
          className={`rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-950 dark:text-amber-100`}
        >
          {t('projection.sources.noContributions')}
        </p>
      ) : null}

      <div className={`${ui.chartCard} w-full !p-0`}>
        {canScrollX && narrowViewport ? (
          <div className={`border-b px-4 py-3 sm:px-5 ${ui.divider}`}>
            <ScrollHintBanner
              hint={t('projection.table.scrollHint')}
              show
            />
          </div>
        ) : null}

        <div className="relative w-full min-w-0 overflow-hidden rounded-t-2xl">
          {canScrollRight && narrowViewport ? (
            <div
              className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l from-white via-white/95 to-transparent dark:from-slate-900 dark:via-slate-900/95"
              aria-hidden
            />
          ) : null}

          <VirtualList
            scrollRef={scrollRef}
            onScroll={handleScroll}
            itemCount={rows.length}
            itemHeight={rowHeight}
            maxHeight={tableMaxHeight}
            headerHeight={headHeight}
            header={tableHeader}
            minWidth={tableMinWidth}
            scrollClassName="overscroll-x-contain [-webkit-overflow-scrolling:touch]"
          >
            {({ index, style }) => (
              <ProjectionRow
                row={rows[index]}
                style={style}
                columns={columns}
                tableMinWidth={tableMinWidth}
                narrowViewport={narrowViewport}
                scrolledX={scrolledX}
                isEven={index % 2 === 0}
                isLastRow={index === rows.length - 1}
              />
            )}
          </VirtualList>
        </div>

        <p
          className={`border-t px-4 py-3 text-xs leading-snug sm:px-5 ${ui.divider} ${ui.textMuted}`}
        >
          {t('projection.table.monthCount', {
            count: rows.length,
            years: projectionYears,
          })}
        </p>
      </div>
    </div>
  );
}

function ProjectionRow({
  row,
  style,
  columns,
  tableMinWidth,
  narrowViewport,
  scrolledX,
  isEven,
  isLastRow,
}) {
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

  const textSize = narrowViewport ? 'text-xs' : 'text-sm';

  return (
    <div
      style={{ ...style, ...tableRowLayoutStyle(tableMinWidth) }}
      className={`flex w-full items-center border-b ${ui.divider} ${bg} ${january}`}
    >
      {columns.map((key) => {
        const isDate = key === PROJECTION_COLUMN.DATE;
        const isPatrimony = key === PROJECTION_COLUMN.PATRIMONY;
        const alignRight = !isDate;

        return (
          <div
            key={key}
            style={columnFlexStyle(key, narrowViewport)}
            className={`flex shrink-0 items-center overflow-hidden px-2 tabular-nums sm:px-3 ${textSize} whitespace-nowrap ${
              alignRight ? 'justify-end text-right' : 'justify-start text-left'
            } ${
              isDate
                ? `sticky left-0 z-10 border-r ${ui.divider} ${bg} ${january} ${ui.textLabel} ${stickyDateShadow(scrolledX)} ${isLastRow ? 'rounded-bl-2xl' : ''}`
                : isPatrimony
                  ? 'font-semibold text-emerald-700 dark:text-emerald-400'
                  : ui.textLabel
            }`}
          >
            {cells[key]}
          </div>
        );
      })}
    </div>
  );
}
