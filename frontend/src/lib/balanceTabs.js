/** Balance page sections (query param `tab`). */
export const BALANCE_TAB = {
  CASHFLOW: 'cashflow',
  CONTRIBUTIONS: 'contributions',
  PATRIMONY: 'patrimony',
};

export const BALANCE_TABS = Object.values(BALANCE_TAB);

export const DEFAULT_BALANCE_TAB = BALANCE_TAB.CASHFLOW;

export function isBalanceTab(value) {
  return BALANCE_TABS.includes(value);
}

export function resolveBalanceTab(value) {
  return isBalanceTab(value) ? value : DEFAULT_BALANCE_TAB;
}

/** Path with tab query for deep links and alerts. */
export function balancePath(tab = DEFAULT_BALANCE_TAB) {
  return `/balance?tab=${tab}`;
}
