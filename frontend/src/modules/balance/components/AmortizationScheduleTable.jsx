import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ScrollHintBanner,
  useHorizontalScrollEdges,
} from '../../../components/HorizontalScrollRegion';
import { VirtualList } from '../../../components/VirtualList';
import { applyShareEuros } from '../../../lib/money';
import {
  getAmortizationColumnTone,
  tableCellToneClasses,
} from '../../../lib/tableColumnTones';
import { ui } from '../../../lib/uiClasses';
import { formatMoney } from '../../../utils/formatters';
import {
  AMORTIZATION_COLUMN,
  buildAmortizationColumnKeys,
  columnPaddingClass,
  getTableMinWidth,
  headerLabelKey,
  isYourShareColumn,
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

function amortizationHeaderTone(columnKey) {
  return tableCellToneClasses(getAmortizationColumnTone(columnKey), {
    header: true,
  });
}

function amortizationBodyTone(columnKey) {
  return tableCellToneClasses(getAmortizationColumnTone(columnKey));
}

function AmortizationColumnHeader({
  columnKey,
  columnKeys,
  narrowViewport,
  scrolledX,
  sharePercent,
  t,
}) {
  const isDate = columnKey === AMORTIZATION_COLUMN.DATE;
  const isShare = isYourShareColumn(columnKey);
  const toneClass = amortizationHeaderTone(columnKey);
  const stickyLeft = stickyColumnLeftOffset(columnKey);
  const isSticky = stickyLeft != null;
  const alignRight = !isDate;
  const separator = showColumnSeparator(columnKey, columnKeys);

  const label = isShare
    ? t('balance.amortization.scheduleYourShare', { percent: sharePercent })
    : t(headerLabelKey(columnKey, narrowViewport));

  return (
    <div
      style={isSticky ? { left: stickyLeft } : undefined}
      className={`flex min-w-0 items-center overflow-visible py-1 ${columnPaddingClass(columnKey)} ${
        alignRight ? 'justify-end text-right' : 'justify-start text-left'
      } ${separator ? `border-r ${ui.divider}` : ''} ${
        isShare ? 'border-l-2 border-indigo-200/90 dark:border-indigo-800/70' : ''
      } ${
        isSticky
          ? `sticky z-30 ${headBg()} ${stickyDateShadow(scrolledX)} rounded-tl-2xl`
          : ''
      } ${toneClass}`}
    >
      <span
        className={`${
          toneClass
            ? ''
            : 'font-semibold text-slate-700 dark:text-slate-300'
        } ${
          narrowViewport
            ? 'text-[10px] leading-snug whitespace-normal'
            : 'text-xs leading-snug whitespace-normal'
        }`}
      >
        {label}
      </span>
    </div>
  );
}

export function AmortizationScheduleTable({ rows, totals, formatDate, sharePercent }) {
  const { t } = useTranslation();
  const scrollRef = useRef(null);
  const columns = useMemo(
    () => buildAmortizationColumnKeys(sharePercent),
    [sharePercent],
  );
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
    if (sharePercent != null && sharePercent < 100) {
      return {
        full: t('balance.amortization.tableFullTotalsSummary', {
          count: rows.length,
          paid: formatMoney(totals.totalPaid),
          principal: formatMoney(totals.totalPrincipal),
          interest: formatMoney(totals.totalInterest),
        }),
        share: t('balance.amortization.tableYourShareTotalsSummary', {
          percent: sharePercent,
          paid: formatMoney(applyShareEuros(totals.totalPaid, true, sharePercent)),
          principal: formatMoney(
            applyShareEuros(totals.totalPrincipal, true, sharePercent),
          ),
          interest: formatMoney(
            applyShareEuros(totals.totalInterest, true, sharePercent),
          ),
        }),
      };
    }
    return {
      full: null,
      share: null,
      legacy: t('balance.amortization.tableTotalsSummary', {
        paid: formatMoney(totals.totalPaid),
        principal: formatMoney(totals.totalPrincipal),
        interest: formatMoney(totals.totalInterest),
      }),
    };
  }, [totals, t, sharePercent, rows.length]);

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
          sharePercent={sharePercent}
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
              sharePercent={sharePercent}
            />
          )}
        </VirtualList>
      </div>

      <div className={`border-t px-4 py-3 sm:px-5 ${ui.divider}`}>
        {footerSummary?.full ? (
          <>
            <p className={`text-xs leading-snug ${ui.textLabel}`}>{footerSummary.full}</p>
            <p className={`mt-1 text-xs leading-snug ${ui.textMuted}`}>
              {footerSummary.share}
            </p>
          </>
        ) : (
          <>
            <p className={`text-xs leading-snug ${ui.textMuted}`}>
              {t('balance.amortization.tableRowCount', { count: rows.length })}
            </p>
            {footerSummary?.legacy ? (
              <p className={`mt-1 text-xs leading-snug ${ui.textLabel}`}>
                {footerSummary.legacy}
              </p>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}

function shareCellValue(row, sharePercent) {
  return formatMoney(applyShareEuros(row.balance, true, sharePercent));
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
  sharePercent,
}) {
  const bg = rowBg(isEven);
  const isCurrent = row.month === 1;
  const currentRow = isCurrent
    ? 'ring-1 ring-inset ring-emerald-500/25 dark:ring-emerald-500/20'
    : '';

  const cells = {
    date: formatDate(row.date),
    payment: formatMoney(row.payment),
    principal: formatMoney(row.principal),
    interest: formatMoney(row.interest),
    startBalance: formatMoney(row.startBalance),
    balance: formatMoney(row.balance),
    yourShare:
      sharePercent != null && sharePercent < 100
        ? shareCellValue(row, sharePercent)
        : '',
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
        const isShare = isYourShareColumn(key);
        const toneClass = amortizationBodyTone(key);
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
              isShare ? 'border-l-2 border-indigo-200/90 dark:border-indigo-800/70' : ''
            } ${
              isSticky
                ? `sticky z-10 ${bg} ${currentRow} ${ui.textLabel} ${stickyDateShadow(scrolledX)} ${
                    isLastRow ? 'rounded-bl-2xl' : ''
                  }`
                : toneClass || ui.textLabel
            }`}
          >
            {cells[key]}
          </div>
        );
      })}
    </div>
  );
}
