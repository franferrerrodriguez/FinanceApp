import {
  buildNetWorthHistory,
  groupSnapshotsByMonth,
} from './dashboardMetrics.js';
import { roundMoney } from './money.js';

/**
 * Summarizes observed net-worth growth from monthly balance snapshots (real data only).
 */
export function summarizePatrimonyGrowth(snapshots, months = 12) {
  const history = buildNetWorthHistory(snapshots, 0, months);
  const grouped = groupSnapshotsByMonth(snapshots);
  const withData = history.filter(
    (h) => (grouped[h.monthKey] ?? []).length > 0 && h.netWorth != null,
  );

  if (!withData.length) {
    return {
      hasData: false,
      hasGrowth: false,
      history,
      monthsRecorded: 0,
    };
  }

  const first = withData[0];
  const last = withData[withData.length - 1];
  const absoluteChange = roundMoney(last.netWorth - first.netWorth);
  const startBase = Math.abs(first.netWorth);
  const percentChange =
    withData.length >= 2 && startBase > 0
      ? absoluteChange / startBase
      : null;

  const previous = withData.length >= 2 ? withData[withData.length - 2] : null;
  const monthOverMonthDelta =
    previous != null ? roundMoney(last.netWorth - previous.netWorth) : null;
  const prevBase = previous != null ? Math.abs(previous.netWorth) : 0;
  const monthOverMonthPct =
    monthOverMonthDelta != null && prevBase > 0
      ? monthOverMonthDelta / prevBase
      : null;

  return {
    hasData: true,
    hasGrowth: withData.length >= 2,
    history,
    monthsRecorded: withData.length,
    firstMonthKey: first.monthKey,
    lastMonthKey: last.monthKey,
    startNetWorth: first.netWorth,
    endNetWorth: last.netWorth,
    absoluteChange,
    percentChange,
    monthOverMonthDelta,
    monthOverMonthPct,
  };
}
