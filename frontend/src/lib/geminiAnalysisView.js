import { roundMoney } from './money.js';

function mapFrequency(frequency) {
  if (frequency === 'yearly') return 'annual';
  if (frequency === 'quarterly') return 'quarterly';
  return 'monthly';
}

function monthlyEquivalent(amount, frequency) {
  if (frequency === 'annual' || frequency === 'yearly') return amount / 12;
  if (frequency === 'quarterly') return amount / 3;
  return amount;
}

export function mapGeminiAnalysisToView(gemini) {
  const subscriptions = (gemini?.subscriptions ?? []).map((sub, index) => {
    const frequency = mapFrequency(sub.frequency);
    return {
      id: sub.name ?? `sub-${index}`,
      name: sub.name ?? '—',
      amount: sub.monthlyAmount ?? 0,
      frequency,
      lastDate: sub.lastCharge ? new Date(`${sub.lastCharge}-15T12:00:00`) : new Date(),
      totalYear: sub.estimatedYearlyTotal ?? 0,
      confidence: sub.confidence,
    };
  });

  const monthly = subscriptions.reduce(
    (sum, sub) => sum + monthlyEquivalent(sub.amount, sub.frequency),
    0,
  );
  const yearly = subscriptions.reduce((sum, sub) => sum + (sub.totalYear || 0), 0);

  const categoryComparison = (gemini?.categories ?? []).map((cat) => ({
    id: cat.name,
    name: cat.name,
    actual: cat.amount ?? 0,
    budgeted: 0,
    diff: cat.amount ?? 0,
    percentage: cat.percentage,
    examples: cat.examples ?? [],
  }));

  const budget = gemini?.budgetComparison ?? {};
  const budgetRows = [
    { key: 'groceries', label: 'Alimentación' },
    { key: 'leisure', label: 'Restaurantes y ocio' },
    { key: 'housing', label: 'Vivienda y hogar' },
    { key: 'transport', label: 'Transporte' },
    { key: 'subscriptions', label: 'Suscripciones' },
  ]
    .map(({ key, label }) => {
      const row = budget[key];
      if (!row) return null;
      const actual = row.actual ?? 0;
      const budgeted = row.budgeted ?? 0;
      return {
        id: key,
        name: label,
        actual,
        budgeted,
        diff: roundMoney(actual - budgeted),
      };
    })
    .filter(Boolean);

  const alerts = (gemini?.anomalies ?? []).map((anomaly, index) => ({
    id: `anomaly-${index}`,
    type: anomaly.type,
    severity: 'warn',
    params: {
      description: anomaly.description,
      amount: anomaly.amount,
      date: anomaly.date,
    },
  }));

  return {
    subscriptions,
    subTotals: {
      count: subscriptions.length,
      monthly: roundMoney(monthly),
      yearly: roundMoney(yearly),
    },
    categoryComparison: budgetRows.length ? budgetRows : categoryComparison,
    categoryBreakdown: categoryComparison,
    alerts,
    insights: gemini?.insights ?? [],
    summary: gemini?.summary ?? null,
  };
}
