import { getEffectiveGroceries, getEffectiveHouseholdExpenses, getEffectiveLeisureExpenses } from './calculations.js';
import { roundMoney } from './money.js';

export const EXPENSE_CATEGORIES = {
  supermarket: {
    id: 'supermarket',
    keywords: [
      'mercadona',
      'carrefour',
      'lidl',
      'aldi',
      'dia',
      'consum',
      'eroski',
      'hipercor',
      'alcampo',
      'supermerc',
    ],
  },
  gas: {
    id: 'gas',
    keywords: ['repsol', 'bp', 'cepsa', 'shell', 'galp', 'petroprix', 'gasolin'],
  },
  restaurants: {
    id: 'restaurants',
    keywords: ['rest', 'cafe', 'café', 'bar ', 'pizza', 'burger', 'glovo', 'uber eats', 'just eat'],
  },
  pharmacy: {
    id: 'pharmacy',
    keywords: ['farmacia', 'parafarmacia', 'farmac'],
  },
  amazon: {
    id: 'amazon',
    keywords: ['amazon', 'amzn', 'aliexpress', 'shein', 'zalando', 'pccomponentes'],
  },
  other: { id: 'other', keywords: [] },
};

const FREQUENCY_MONTHS = {
  monthly: 1,
  quarterly: 3,
  annual: 12,
};

function normalizeDesc(desc) {
  return String(desc ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '');
}

export function categorizeMovement(description) {
  const text = normalizeDesc(description);
  for (const cat of Object.values(EXPENSE_CATEGORIES)) {
    if (cat.id === 'other') continue;
    if (cat.keywords.some((kw) => text.includes(kw))) return cat.id;
  }
  return 'other';
}

function amountsSimilar(a, b, tolerance = 0.05) {
  const absA = Math.abs(a);
  const absB = Math.abs(b);
  if (absA === 0 && absB === 0) return true;
  const avg = (absA + absB) / 2;
  return Math.abs(absA - absB) / avg <= tolerance;
}

function monthDiff(d1, d2) {
  return (
    (d2.getFullYear() - d1.getFullYear()) * 12 + (d2.getMonth() - d1.getMonth())
  );
}

function detectFrequency(intervals) {
  if (!intervals.length) return null;
  const avg = intervals.reduce((s, v) => s + v, 0) / intervals.length;
  if (avg >= 0.8 && avg <= 1.5) return 'monthly';
  if (avg >= 2.5 && avg <= 4.5) return 'quarterly';
  if (avg >= 10 && avg <= 14) return 'annual';
  return null;
}

function normalizeMerchantName(desc) {
  return normalizeDesc(desc)
    .replace(/\d{2}\/\d{2}/g, '')
    .replace(/\d{4}-\d{2}-\d{2}/g, '')
    .replace(/\*{2,}\d+/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 60);
}

export function detectSubscriptions(movements, ignored = new Set()) {
  const debits = movements.filter((m) => m.amount < 0);
  const groups = new Map();

  for (const m of debits) {
    const key = normalizeMerchantName(m.description);
    if (!key || key.length < 3) continue;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(m);
  }

  const subscriptions = [];

  for (const [name, items] of groups) {
    if (ignored.has(name)) continue;
    if (items.length < 2) continue;
    const sorted = [...items].sort((a, b) => a.date - b.date);
    const intervals = [];
    for (let i = 1; i < sorted.length; i++) {
      intervals.push(monthDiff(sorted[i - 1].date, sorted[i].date));
    }
    const frequency = detectFrequency(intervals);
    if (!frequency) continue;

    const amounts = sorted.map((m) => Math.abs(m.amount));
    const refAmount = amounts[amounts.length - 1];
    const allSimilar = amounts.every((a) => amountsSimilar(a, refAmount));
    if (!allSimilar) continue;

    const monthsPerYear = 12 / FREQUENCY_MONTHS[frequency];
    subscriptions.push({
      id: name,
      name: sorted[sorted.length - 1].description.trim().slice(0, 80) || name,
      amount: refAmount,
      frequency,
      lastDate: sorted[sorted.length - 1].date,
      totalYear: roundMoney(refAmount * monthsPerYear),
      occurrences: sorted.length,
    });
  }

  return subscriptions.sort((a, b) => b.amount - a.amount);
}

export function summarizeCategorySpending(movements) {
  const withCat = movements.map((m) => ({
    ...m,
    category: m.category ?? categorizeMovement(m.description),
  }));

  const totals = {};
  for (const m of withCat) {
    if (m.amount >= 0) continue;
    const cat = m.category ?? 'other';
    totals[cat] = (totals[cat] ?? 0) + Math.abs(m.amount);
  }

  return { movements: withCat, totals };
}

export function compareCategoriesToBudget(totals, settings) {
  const budgetMap = {
    supermarket: getEffectiveGroceries(settings),
    gas: 0,
    restaurants: getEffectiveLeisureExpenses(settings) * 0.4,
    pharmacy: (getEffectiveHouseholdExpenses(settings) || 0) * 0.05,
    amazon: getEffectiveLeisureExpenses(settings) * 0.3,
    other: getEffectiveLeisureExpenses(settings) * 0.3,
  };

  const allCats = new Set([...Object.keys(totals), ...Object.keys(budgetMap)]);

  return [...allCats]
    .filter((id) => id !== 'other' || (totals.other ?? 0) > 0)
    .map((id) => {
      const actual = roundMoney(totals[id] ?? 0);
      const budgeted = roundMoney(budgetMap[id] ?? 0);
      return {
        id,
        actual,
        budgeted,
        diff: roundMoney(actual - budgeted),
      };
    })
    .filter((row) => row.actual > 0 || row.budgeted > 0)
    .sort((a, b) => b.actual - a.actual);
}

export function detectStatementAlerts(movements, subscriptions = []) {
  const alerts = [];
  const debits = movements.filter((m) => m.amount < 0);

  const byDay = new Map();
  for (const m of debits) {
    const key = `${m.dateIso}|${Math.round(Math.abs(m.amount))}`;
    if (!byDay.has(key)) byDay.set(key, []);
    byDay.get(key).push(m);
  }
  for (const [, items] of byDay) {
    if (items.length >= 2) {
      alerts.push({
        id: 'duplicate_charge',
        type: 'duplicate_charge',
        severity: 'warn',
        params: {
          date: items[0].dateIso,
          amount: Math.abs(items[0].amount),
          count: items.length,
          description: items[0].description,
        },
      });
    }
  }

  for (const sub of subscriptions) {
    const related = debits.filter((m) =>
      normalizeMerchantName(m.description).includes(sub.id.slice(0, 12)),
    );
    if (related.length < 2) continue;
    const sorted = [...related].sort((a, b) => a.date - b.date);
    const prev = sorted[sorted.length - 2];
    const last = sorted[sorted.length - 1];
    const prevAmt = Math.abs(prev.amount);
    const lastAmt = Math.abs(last.amount);
    if (lastAmt > prevAmt * 1.05) {
      alerts.push({
        id: `price_increase_${sub.id}`,
        type: 'subscription_price_increase',
        severity: 'warn',
        params: {
          name: sub.name,
          prevAmount: prevAmt,
          newAmount: lastAmt,
          increase: roundMoney(lastAmt - prevAmt),
        },
      });
    }
  }

  for (const m of debits) {
    const desc = normalizeDesc(m.description);
    if (
      /usd|gbp|usd|£|\$|foreign|extranjer|comision cambio|fx fee/i.test(desc) ||
      /comisi[oó]n.*(divisa|cambio)/i.test(desc)
    ) {
      alerts.push({
        id: `foreign_${m.dateIso}_${Math.abs(m.amount)}`,
        type: 'foreign_currency',
        severity: 'info',
        params: { description: m.description, amount: Math.abs(m.amount), date: m.dateIso },
      });
    }
  }

  const byMonth = new Map();
  for (const m of debits) {
    const key = m.dateIso.slice(0, 7);
    byMonth.set(key, (byMonth.get(key) ?? 0) + Math.abs(m.amount));
  }
  const monthlyTotals = [...byMonth.values()];
  if (monthlyTotals.length >= 2) {
    const avg = monthlyTotals.reduce((s, v) => s + v, 0) / monthlyTotals.length;
    for (const [month, total] of byMonth) {
      if (total > avg * 1.35) {
        alerts.push({
          id: `high_spend_${month}`,
          type: 'high_spending_month',
          severity: 'warn',
          params: { month, total, average: roundMoney(avg) },
        });
      }
    }
  }

  return alerts;
}

export function subscriptionTotals(subscriptions) {
  const monthly = subscriptions.reduce((s, sub) => {
    const factor = 1 / FREQUENCY_MONTHS[sub.frequency];
    return s + sub.amount * factor;
  }, 0);
  const yearly = subscriptions.reduce((s, sub) => s + sub.totalYear, 0);
  return {
    count: subscriptions.length,
    monthly: roundMoney(monthly),
    yearly: roundMoney(yearly),
  };
}

export function analyzeBankStatement(movements, settings, ignoredSubscriptions = new Set()) {
  const { movements: categorized, totals } = summarizeCategorySpending(movements);
  const subscriptions = detectSubscriptions(categorized, ignoredSubscriptions);
  const categoryComparison = compareCategoriesToBudget(totals, settings);
  const alerts = detectStatementAlerts(categorized, subscriptions);
  const subTotals = subscriptionTotals(subscriptions);

  return {
    movements: categorized,
    subscriptions,
    categoryComparison,
    alerts,
    subTotals,
    totals,
  };
}
