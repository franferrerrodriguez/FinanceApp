import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ScrollHintBanner,
  useHorizontalScrollEdges,
} from '../../../components/HorizontalScrollRegion';
import { VirtualList } from '../../../components/VirtualList';
import { ui } from '../../../lib/uiClasses';
import { formatMoney } from '../../../utils/formatters';
import {
  AMORTIZATION_COLUMN,
  AMORTIZATION_COLUMN_KEYS,
  columnPaddingClass,
  getTableMinWidth,
  headerLabelKey,
  showColumnSeparator,
  stickyColumnLeftOffset,
  tableGridStyle,
} from '../amortizationTableColumns';

const MOBILE_MEDIA = '(max-width: 767px)';
const ROW_HEIGHT_NARROW = 42;
const ROW_HEIGHT_WIDE = 44;
const HEAD_HEIGHT_NARROW = 72;
const HEAD_HEIGHT_WIDE = 52;
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

function balanceCellClass(isHeader = false) {
  return isHeader
    ? 'bg-emerald-50 font-bold text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300'
    : 'bg-emerald-50/70 font-bold text-emerald-800 dark:bg-emerald-950/35 dark:text-emerald-300';
}

function AmortizationColumnHeader({
  columnKey,
  columnKeys,
  narrowViewport,
  scrolledX,
  t,
}) {
  const isDate = columnKey === AMORTIZATION_COLUMN.DATE;
  const isBalance = columnKey === AMORTIZATION_COLUMN.BALANCE;
  const stickyLeft = stickyColumnLeftOffset(columnKey);
  const isSticky = stickyLeft != null;
  const alignRight = !isDate;
  const separator = showColumnSeparator(columnKey, columnKeys);

  return (
    <div
      style={isSticky ? { left: stickyLeft } : undefined}
      className={`flex min-w-0 items-center overflow-visible py-1 ${columnPaddingClass(columnKey)} ${
        alignRight ? 'justify-end text-right' : 'justify-start text-left'
      } ${separator ? `border-r ${ui.divider}` : ''} ${
        isSticky
          ? `sticky z-30 ${headBg()} ${stickyDateShadow(scrolledX)} rounded-tl-2xl`
          : ''
      } ${isBalance ? balanceCellClass(true) : ''}`}
    >
      <span
        className={`font-semibold text-slate-700 dark:text-slate-300 ${
          narrowViewport
            ? 'text-[10px] leading-snug whitespace-normal'
            : 'text-xs leading-snug whitespace-normal'
        } ${isBalance ? 'font-bold' : ''}`}
      >
        {t(headerLabelKey(columnKey, narrowViewport))}
      </span>
    </div>
  );
}

export function AmortizationScheduleTable({ rows, totals, formatDate }) {
  const { t } = useTranslation();
  const scrollRef = useRef(null);
  const columns = AMORTIZATION_COLUMN_KEYS;
  const [narrowViewport, setNarrowViewport] = useState(() =>
    typeof window !== 'undefined'
      ? window.matchMedia(MOBILE_MEDIA).matches
      : false,
  );
  const [scrolledX, setScrolledX] = useState(false);

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

  const { overflow: canScrollX, right: canScrollRight, updateEdges } =
    useHorizontalScrollEdges(scrollRef, [
      rows.length,
      columns.length,
      narrowViewport,
      tableMinWidth,
    ]);

  const handleScroll = (event) => {
    updateEdges();
    setScrolledX(event.currentTarget.scrollLeft > 2);
  };

  const footerSummary = useMemo(() => {
    if (!totals) return null;
    return t('balance.amortization.tableTotalsSummary', {
      paid: formatMoney(totals.totalPaid),
      principal: formatMoney(totals.totalPrincipal),
      interest: formatMoney(totals.totalInterest),
    });
  }, [totals, t]);

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
        <AmortizationColumnHeader
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
    <div className={`${ui.chartCard} mt-3 w-full !p-0`}>
      {canScrollX && narrowViewport ? (
        <div className={`border-b px-4 py-3 sm:px-5 ${ui.divider}`}>
          <ScrollHintBanner
            hint={t('balance.amortization.tableScrollHint')}
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
          minTableWidth={tableMinWidth}
          scrollClassName="overscroll-x-contain [-webkit-overflow-scrolling:touch]"
        >
          {({ index, style }) => (
            <AmortizationRow
              row={rows[index]}
              style={style}
              columns={columns}
              narrowViewport={narrowViewport}
              scrolledX={scrolledX}
              isEven={index % 2 === 0}
              isLastRow={index === rows.length - 1}
              formatDate={formatDate}
            />
          )}
        </VirtualList>
      </div>

      <div className={`border-t px-4 py-3 sm:px-5 ${ui.divider}`}>
        <p className={`text-xs leading-snug ${ui.textMuted}`}>
          {t('balance.amortization.tableRowCount', { count: rows.length })}
        </p>
        {footerSummary ? (
          <p className={`mt-1 text-xs leading-snug ${ui.textLabel}`}>
            {footerSummary}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function AmortizationRow({
  row,
  style,
  columns,
  narrowViewport,
  scrolledX,
  isEven,
  isLastRow,
  formatDate,
}) {
  const bg = rowBg(isEven);
  const isCurrent = row.month === 1;
  const currentRow = isCurrent
    ? 'bg-emerald-50/60 dark:bg-emerald-950/25'
    : '';

  const cells = {
    date: formatDate(row.date),
    payment: formatMoney(row.payment),
    principal: formatMoney(row.principal),
    interest: formatMoney(row.interest),
    startBalance: formatMoney(row.startBalance),
    balance: formatMoney(row.balance),
  };

  const textSize = narrowViewport ? 'text-xs' : 'text-sm';

  return (
    <div
      style={{
        ...style,
        ...tableGridStyle(columns, narrowViewport),
      }}
      className={`w-full items-center border-b ${ui.divider} ${bg} ${currentRow}`}
    >
      {columns.map((key) => {
        const isDate = key === AMORTIZATION_COLUMN.DATE;
        const isBalance = key === AMORTIZATION_COLUMN.BALANCE;
        const stickyLeft = stickyColumnLeftOffset(key);
        const isSticky = stickyLeft != null;
        const alignRight = !isDate;
        const separator = showColumnSeparator(key, columns);

        return (
          <div
            key={key}
            style={isSticky ? { left: stickyLeft } : undefined}
            className={`flex min-w-0 items-center overflow-hidden tabular-nums ${columnPaddingClass(key)} ${textSize} whitespace-nowrap ${
              alignRight ? 'justify-end text-right' : 'justify-start text-left'
            } ${separator ? `border-r ${ui.divider}` : ''} ${
              isSticky
                ? `sticky z-10 ${bg} ${currentRow} ${ui.textLabel} ${stickyDateShadow(scrolledX)} ${
                    isLastRow ? 'rounded-bl-2xl' : ''
                  }`
                : isBalance
                  ? balanceCellClass(false)
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
