import {
  calcTotalFixedExpenses,
  calcTotalIncome,
  getEffectiveGroceries,
  getEffectiveLeisureExpenses,
} from './calculations.js';
import { roundMoney } from './money.js';
import { supabase } from './supabase.js';

export function buildGeminiUserContext(settings) {
  return {
    salary: calcTotalIncome(settings),
    fixedExpenses: calcTotalFixedExpenses(settings),
    groceries: getEffectiveGroceries(settings),
    leisure: getEffectiveLeisureExpenses(settings),
  };
}

export function anonymizeTransactions(transactions) {
  return (transactions ?? []).map((tx) => ({
    date: String(tx.dateIso ?? tx.date ?? '').slice(0, 7),
    description: scrubDescription(tx.description),
    amount: roundMoney(Number(tx.amount)),
  }));
}

function scrubDescription(raw) {
  return String(raw ?? '')
    .replace(/\bES\d{2}\s?\d{4}\s?\d{4}\s?\d{2}\s?\d{10}\b/gi, '[IBAN]')
    .replace(/\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, '[CARD]')
    .replace(/\b\d{8}[A-Z]\b/gi, '[ID]')
    .replace(/\S+@\S+\.\S+/g, '[EMAIL]')
    .trim()
    .slice(0, 120);
}

export async function analyzeTransactions(transactions, userContext) {
  if (!supabase) {
    throw new Error('NOT_CONFIGURED');
  }

  const anonymized = anonymizeTransactions(transactions);
  const { data, error } = await supabase.functions.invoke('analyze-statement', {
    body: { transactions: anonymized, userContext },
  });

  if (error) {
    throw new Error('API_ERROR');
  }

  if (data?.error) {
    throw new Error(data.error);
  }

  return data;
}
