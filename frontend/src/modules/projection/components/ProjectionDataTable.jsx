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
  getProjectionStartingState,
} from '../../../lib/projectionBuckets';
import { resolveProjectionMortgage } from '../../../lib/projectionMortgage';
import {
  getProjectionColumnTone,
  tableCellToneClasses,
} from '../../../lib/tableColumnTones';
import { ui } from '../../../lib/uiClasses';
import { useFinanceData } from '../../../store/hooks';
import { formatProjectionDate } from '../../../utils/projectionDate';
import { formatMoney } from '../../../utils/formatters';
import { HelpTooltip } from '../../../components/HelpTooltip';
import {
  PROJECTION_COLUMN,
  buildProjectionColumnKeys,
  columnPaddingClass,
  getTableMinWidth,
  headerLabelKey,
  headerTooltipKey,
  showColumnSeparator,
  stickyColumnLeftOffset,
  tableGridStyle,
} from '../projectionTableColumns';
import { ProjectionSummary } from './ProjectionSummary';

const MOBILE_MEDIA = '(max-width: 767px)';
const ROW_HEIGHT_NARROW = 42;
const ROW_HEIGHT_WIDE = 44;
const HEAD_HEIGHT_NARROW = 72;
const HEAD_HEIGHT_WIDE = 52;
const LIST_MAX_HEIGHT = 480;
const MORTGAGE_DETAIL_STORAGE_KEY = 'projection_show_mortgage_detail';

function readMortgageDetailPreference(defaultWhenMissing) {
  if (typeof window === 'undefined') return false;
  const stored = window.localStorage.getItem(MORTGAGE_DETAIL_STORAGE_KEY);
  if (stored === null) return Boolean(defaultWhenMissing);
  return stored === '1';
}

function rowBg(isEven) {
  return isEven ? 'bg-[var(--bg-secondary)]' : 'bg-[rgba(255,255,255,0.02)]';
}

function headBg() {
  return 'bg-[var(--bg-tertiary)]';
}

function stickyDateShadow(scrolledX) {
  return scrolledX
    ? 'shadow-[4px_0_10px_-2px_rgba(0,0,0,0.40)]'
    : '';
}

function projectionHeaderTone(columnKey) {
  return tableCellToneClasses(getProjectionColumnTone(columnKey), {
    header: true,
  });
}

function projectionBodyTone(columnKey) {
  return tableCellToneClasses(getProjectionColumnTone(columnKey));
}

function ProjectionColumnHeader({ columnKey, columnKeys, narrowViewport, scrolledX, t }) {
  const isYear = columnKey === PROJECTION_COLUMN.YEAR;
  const isDate = columnKey === PROJECTION_COLUMN.DATE;
  const toneClass = projectionHeaderTone(columnKey);
  const stickyLeft = stickyColumnLeftOffset(columnKey, narrowViewport);
  const isSticky = stickyLeft != null;
  const alignRight = !isYear && !isDate;
  const tooltipKey = headerTooltipKey(columnKey);
  const separator = showColumnSeparator(columnKey, columnKeys);

  return (
    <div
      style={isSticky ? { left: stickyLeft } : undefined}
      className={`flex min-w-0 items-center overflow-visible py-1 ${columnPaddingClass(columnKey)} ${
        alignRight
          ? 'justify-end text-right'
          : isYear
            ? 'justify-center text-center'
            : 'justify-start text-left'
      } ${separator ? `border-r ${ui.divider}` : ''} ${
        isSticky
          ? `sticky z-30 ${headBg()} ${stickyDateShadow(scrolledX)} ${
              isYear ? 'rounded-tl-2xl' : ''
            } ${toneClass}`
          : toneClass
      }`}
    >
      <span className="inline-flex max-w-full items-center gap-1">
        <span
          className={`${
            toneClass ? '' : 'font-semibold text-[var(--text-primary)]'
          } ${
            narrowViewport
              ? 'text-[10px] leading-snug whitespace-normal'
              : 'text-xs leading-snug whitespace-normal'
          }`}
        >
          {t(headerLabelKey(columnKey, narrowViewport))}
        </span>
        {tooltipKey ? (
          <HelpTooltip
            symbol="ⓘ"
            ariaLabel={t('projection.table.tooltipAria', {
              column: t(headerLabelKey(columnKey, narrowViewport)),
            })}
          >
            {t(tooltipKey)}
          </HelpTooltip>
        ) : null}
      </span>
    </div>
  );
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
  const [showMortgageDetail, setShowMortgageDetail] = useState(false);
  const [mortgageDetailPrefReady, setMortgageDetailPrefReady] = useState(false);

  const showPunctual = annualExpenses.length > 0;

  const startingState = useMemo(
    () =>
      getProjectionStartingState({
        settings,
        assets,
        liabilities,
        snapshots,
      }),
    [settings, assets, liabilities, snapshots],
  );

  const mortgageCtx = useMemo(
    () =>
      resolveProjectionMortgage({
        settings,
        liabilities,
        snapshots,
        debtBalance: startingState.debtBalance,
      }),
    [settings, liabilities, snapshots, startingState.debtBalance],
  );

  const mortgageAmortizationActive = mortgageCtx.canAmortize;

  useEffect(() => {
    if (mortgageDetailPrefReady) return;
    setShowMortgageDetail(
      readMortgageDetailPreference(mortgageAmortizationActive),
    );
    setMortgageDetailPrefReady(true);
  }, [mortgageAmortizationActive, mortgageDetailPrefReady]);

  const columns = useMemo(
    () =>
      buildProjectionColumnKeys({
        showPunctual,
        showMortgageDetail,
        mortgageAmortizationActive,
      }),
    [showPunctual, showMortgageDetail, mortgageAmortizationActive],
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
    () =>
      summarizeMonthlyProjection(rows, startingState.netWorth, {
        initialGrossAssets: startingState.grossAssets,
        initialDebt: startingState.debtBalance,
      }),
    [rows, startingState],
  );

  const mortgageNeedsRate =
    mortgageCtx.liability &&
    startingState.debtBalance > 0 &&
    mortgageCtx.monthlyPayment > 0 &&
    !mortgageCtx.canAmortize;

  const toggleMortgageDetail = () => {
    setShowMortgageDetail((prev) => {
      const next = !prev;
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(MORTGAGE_DETAIL_STORAGE_KEY, next ? '1' : '0');
      }
      return next;
    });
  };

  const hasInvestmentData = hasProjectionContributionData({
    entries: contributionEntries,
    contributionPlans,
    assets,
    snapshots,
    settings,
  });

  const mortgagePaidOffIndex = useMemo(() => {
    if (!mortgageAmortizationActive) return -1;
    return rows.findIndex(
      (r, i) => r.debtBalance === 0 && (i === 0 || (rows[i - 1]?.debtBalance ?? 0) > 0),
    );
  }, [rows, mortgageAmortizationActive]);

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
      className={`w-full border-b ${ui.divider} ${headBg()}`}
      style={{
        height: headHeight,
        ...tableGridStyle(columns, narrowViewport),
      }}
    >
      {columns.map((key) => (
        <ProjectionColumnHeader
          key={key}
          columnKey={key}
          columnKeys={columns}
          narrowViewport={narrowViewport}
          scrolledX={scrolledX}
          t={t}
        />
      ))}
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
          className={`rounded-xl [border:0.5px_solid_rgba(239,159,39,0.30)] bg-[rgba(239,159,39,0.10)] px-4 py-3 text-sm text-[var(--color-warning)]`}
        >
          {t('projection.sources.noContributions')}
        </p>
      ) : null}

      {mortgageNeedsRate ? (
        <p
          className={`rounded-xl [border:0.5px_solid_rgba(239,159,39,0.30)] bg-[rgba(239,159,39,0.10)] px-4 py-3 text-sm text-[var(--color-warning)]`}
        >
          {t('projection.table.mortgageRateMissing')}
        </p>
      ) : null}

      {mortgageAmortizationActive ? (
        <div className="flex justify-end">
          <button
            type="button"
            className={showMortgageDetail ? ui.scenarioChipActive : ui.scenarioChip}
            onClick={toggleMortgageDetail}
          >
            {t('projection.table.mortgageDetailToggle')}
          </button>
        </div>
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
              className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l from-[var(--bg-secondary)] via-[var(--bg-secondary)]/95 to-transparent"
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
            minTableWidth={tableMinWidth}
            scrollClassName="overscroll-x-contain [-webkit-overflow-scrolling:touch]"
          >
            {({ index, style }) => (
              <ProjectionRow
                row={rows[index]}
                style={style}
                columns={columns}
                narrowViewport={narrowViewport}
                scrolledX={scrolledX}
                isEven={index % 2 === 0}
                isLastRow={index === rows.length - 1}
                isMortgagePaidOff={mortgagePaidOffIndex === index}
              />
            )}
          </VirtualList>
        </div>

        <div className={`border-t px-4 py-3 sm:px-5 ${ui.divider}`}>
          <p className={`text-xs leading-snug ${ui.textMuted}`}>
            {t('projection.table.monthCount', {
              count: rows.length,
              yearsLabel: t('projection.settings.yearsOption', {
                count: projectionYears,
              }),
            })}
          </p>
        </div>
      </div>
    </div>
  );
}

function ProjectionRow({
  row,
  style,
  columns,
  narrowViewport,
  scrolledX,
  isEven,
  isLastRow,
  isMortgagePaidOff = false,
}) {
  const { t } = useTranslation();
  const bg = rowBg(isEven);
  const january = row.isJanuary
    ? 'bg-[rgba(255,255,255,0.04)]'
    : '';

  const cells = {
    year: String(row.yearsElapsed + 1),
    date: formatProjectionDate(row.date),
    salary: formatMoney(row.salary),
    fixed: formatMoney(row.fixedExpenses),
    mortgage:
      row.mortgagePayment > 0 ? formatMoney(row.mortgagePayment) : '—',
    groceries: formatMoney(row.groceriesExpenses),
    leisure: formatMoney(row.leisureExpenses),
    punctual:
      row.punctualExpenses > 0
        ? formatMoney(-row.punctualExpenses)
        : '—',
    netContribution: formatMoney(row.netContribution),
    investments: formatMoney(row.additionalInvestments),
    monthlyReturn: formatMoney(row.monthlyReturn),
    mortgageInterest:
      row.mortgageInterest > 0 ? formatMoney(row.mortgageInterest) : '—',
    mortgagePrincipal:
      row.mortgagePrincipal > 0 ? formatMoney(row.mortgagePrincipal) : '—',
    debtBalance: isMortgagePaidOff
      ? t('projection.summary.mortgagePaidOffShort')
      : formatMoney(row.debtBalance ?? 0),
    patrimony: formatMoney(row.patrimonyEnd),
  };

  const textSize = narrowViewport ? 'text-xs' : 'text-sm';

  return (
    <div
      style={{
        ...style,
        ...tableGridStyle(columns, narrowViewport),
      }}
      className={`w-full items-center border-b ${ui.divider} ${bg} ${january}`}
    >
      {columns.map((key) => {
        const isYear = key === PROJECTION_COLUMN.YEAR;
        const isDate = key === PROJECTION_COLUMN.DATE;
        const toneClass = projectionBodyTone(key);
        const stickyLeft = stickyColumnLeftOffset(key, narrowViewport);
        const isSticky = stickyLeft != null;
        const alignRight = !isYear && !isDate;
        const separator = showColumnSeparator(key, columns);

        const isDebtCell = key === PROJECTION_COLUMN.DEBT_BALANCE;
        const paidOffClass =
          isMortgagePaidOff && isDebtCell ? 'font-medium text-[var(--color-positive)]' : '';

        return (
          <div
            key={key}
            style={isSticky ? { left: stickyLeft } : undefined}
            className={`flex min-w-0 items-center overflow-hidden tabular-nums ${columnPaddingClass(key)} ${textSize} whitespace-nowrap ${
              alignRight ? 'justify-end text-right' : isYear ? 'justify-center text-center' : 'justify-start text-left'
            } ${separator ? `border-r ${ui.divider}` : ''} ${
              isSticky
                ? `sticky z-10 ${bg} ${january} ${ui.textLabel} ${stickyDateShadow(scrolledX)} ${
                    isYear && isLastRow ? 'rounded-bl-2xl' : ''
                  }`
                : toneClass || ui.textLabel
            } ${isYear ? 'font-medium text-[var(--text-muted)]' : ''} ${paidOffClass}`}
          >
            {cells[key]}
          </div>
        );
      })}
    </div>
  );
}
