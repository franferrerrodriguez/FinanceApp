import { BALANCE_TAB, balancePath } from './balanceTabs.js';
import {
  getCurrentMonthKey,
  getLastNMonthKeys,
} from './dashboardMetrics.js';
import { formatMonthKey } from '../utils/monthLabel.js';

function getActiveAssets(assets) {
  return (assets ?? []).filter((a) => a.isActive !== false);
}

function getActiveLiabilities(liabilities) {
  return (liabilities ?? []).filter((l) => l.isActive !== false);
}

import {
  getSnapshotAssetId,
  getSnapshotLiabilityId,
  groupSnapshotsByMonth,
} from './snapshotUtils.js';

/** From this day of the month, nudge to close the current month. */
export const MONTHLY_CLOSE_REMINDER_DAY = 25;

/** Days left in month when urgency rises to warn. */
export const MONTHLY_CLOSE_URGENT_DAYS_LEFT = 5;

const MONTH_KEY_RE = /^\d{4}-\d{2}$/;

export function isMonthKey(value) {
  return MONTH_KEY_RE.test(value);
}

export function hasPatrimonyAccounts(assets, liabilities) {
  return (
    getActiveAssets(assets).length > 0 ||
    getActiveLiabilities(liabilities).length > 0
  );
}

/** Every active asset/liability has a snapshot row for the month. */
export function isMonthFullyClosed(snapshots, monthKey, assets, liabilities) {
  if (!hasPatrimonyAccounts(assets, liabilities)) return true;

  const monthSnaps = groupSnapshotsByMonth(snapshots)[monthKey] ?? [];
  if (!monthSnaps.length) return false;

  for (const asset of getActiveAssets(assets)) {
    if (!monthSnaps.some((s) => getSnapshotAssetId(s) === asset.id)) {
      return false;
    }
  }
  for (const liability of getActiveLiabilities(liabilities)) {
    if (!monthSnaps.some((s) => getSnapshotLiabilityId(s) === liability.id)) {
      return false;
    }
  }
  return true;
}

function getFirstTrackedMonthKey(snapshots, now) {
  const keys = Object.keys(groupSnapshotsByMonth(snapshots))
    .filter(isMonthKey)
    .sort();
  return keys[0] ?? getCurrentMonthKey(now);
}

/** Inclusive range from `fromKey` through `toKey` (YYYY-MM). */
export function getMonthKeysInRange(fromKey, toKey) {
  if (!isMonthKey(fromKey) || !isMonthKey(toKey) || fromKey > toKey) {
    return [];
  }
  const keys = [];
  let [y, m] = fromKey.split('-').map(Number);
  const [endY, endM] = toKey.split('-').map(Number);
  while (y < endY || (y === endY && m <= endM)) {
    keys.push(`${y}-${String(m).padStart(2, '0')}`);
    m += 1;
    if (m > 12) {
      m = 1;
      y += 1;
    }
  }
  return keys;
}

export function getPendingCloseMonths(
  snapshots,
  assets,
  liabilities,
  { now = new Date() } = {},
) {
  if (!hasPatrimonyAccounts(assets, liabilities)) return [];

  const currentKey = getCurrentMonthKey(now);
  const rangeKeys = getMonthKeysInRange(
    getFirstTrackedMonthKey(snapshots, now),
    currentKey,
  );

  return rangeKeys.filter(
    (mk) => !isMonthFullyClosed(snapshots, mk, assets, liabilities),
  );
}

/** Prefer current month; otherwise the most recent pending month. */
export function pickSuggestedCloseMonthKey(pendingMonths, currentKey) {
  if (!pendingMonths?.length) return null;
  if (pendingMonths.includes(currentKey)) return currentKey;
  return pendingMonths[pendingMonths.length - 1];
}

export function getMonthlyCloseStatus(
  snapshots,
  assets,
  liabilities,
  { now = new Date() } = {},
) {
  const currentKey = getCurrentMonthKey(now);
  const pendingMonths = getPendingCloseMonths(snapshots, assets, liabilities, {
    now,
  });

  if (!pendingMonths.length) {
    return {
      pendingMonths: [],
      overdueMonths: [],
      suggestedMonthKey: null,
      urgency: 'none',
      daysLeftInMonth: getDaysLeftInMonth(now),
      currentMonthPending: false,
    };
  }

  const overdueMonths = pendingMonths.filter((mk) => mk < currentKey);
  const currentMonthPending = pendingMonths.includes(currentKey);
  const daysLeft = getDaysLeftInMonth(now);

  let urgency = 'info';
  if (overdueMonths.length > 0) urgency = 'danger';
  else if (
    currentMonthPending &&
    (now.getDate() >= MONTHLY_CLOSE_REMINDER_DAY ||
      daysLeft <= MONTHLY_CLOSE_URGENT_DAYS_LEFT)
  ) {
    urgency = 'warn';
  }

  return {
    pendingMonths,
    overdueMonths,
    suggestedMonthKey: pickSuggestedCloseMonthKey(pendingMonths, currentKey),
    urgency,
    daysLeftInMonth: daysLeft,
    currentMonthPending,
  };
}

export function getMonthlyCloseMonthOptions(
  snapshots,
  assets,
  liabilities,
  { now = new Date(), lookbackMonths = 24, locale = 'es' } = {},
) {
  const pendingSet = new Set(
    getPendingCloseMonths(snapshots, assets, liabilities, { now }),
  );
  const currentKey = getCurrentMonthKey(now);
  const firstTracked = getFirstTrackedMonthKey(snapshots, now);
  const selectable = new Set([
    ...getMonthKeysInRange(firstTracked, currentKey),
    ...getLastNMonthKeys(lookbackMonths, now).filter((mk) => mk <= currentKey),
  ]);

  return [...selectable]
    .sort()
    .reverse()
    .map((monthKey) => ({
      monthKey,
      label: formatMonthKey(monthKey, locale),
      pending: pendingSet.has(monthKey),
      hasClose: isMonthFullyClosed(snapshots, monthKey, assets, liabilities),
    }));
}

export function isMonthlyCloseAlert(alert) {
  return (
    alert?.id === 'monthly_close_due' || alert?.id === 'monthly_close_overdue'
  );
}

export function getMonthlyCloseAlert(status, locale = 'es') {
  if (!status?.suggestedMonthKey || status.urgency === 'none') return null;

  const monthLabel = formatMonthKey(status.suggestedMonthKey, locale);
  const href = balanceClosePath(status.suggestedMonthKey);

  if (status.urgency === 'warn' && status.currentMonthPending) {
    return {
      id: 'monthly_close_due',
      severity: 'warn',
      actionKey: 'alerts.monthlyCloseAction',
      params: {
        month: monthLabel,
        days: status.daysLeftInMonth,
      },
      href,
      monthKey: status.suggestedMonthKey,
    };
  }

  return null;
}

export function balanceClosePath(monthKey, tab = BALANCE_TAB.PATRIMONY) {
  const base = balancePath(tab);
  return monthKey && isMonthKey(monthKey)
    ? `${base}&closeMonth=${monthKey}`
    : base;
}

function getDaysLeftInMonth(date) {
  const last = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  return Math.max(0, last - date.getDate());
}
