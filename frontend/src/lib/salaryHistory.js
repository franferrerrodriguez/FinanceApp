import {
  computeMonthlyNetSalaryEffective,
  enrichSettingsWithSalary,
} from './salary.js';

function getCurrentMonthKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

export function createSalaryHistoryEntry(partial = {}) {
  const base = {
    id: partial.id ?? crypto.randomUUID?.() ?? `sh-${Date.now()}`,
    effectiveFrom: partial.effectiveFrom ?? getCurrentMonthKey(),
    monthlyNetSalary: Math.max(0, partial.monthlyNetSalary ?? 0),
    salaryPaysPreset: partial.salaryPaysPreset ?? '12',
    numPagas: partial.numPagas ?? 12,
    monthlyNetSalaryEffective: 0,
    note: partial.note ?? '',
  };
  const enriched = enrichSettingsWithSalary(
    {
      monthlyNetSalary: base.monthlyNetSalary,
      salaryPaysPreset: base.salaryPaysPreset,
      numPagas: base.numPagas,
    },
    {},
  );
  return {
    ...base,
    monthlyNetSalaryEffective: enriched.monthlyNetSalaryEffective,
  };
}

export function createSalaryHistoryEntryFromSettings(settings, effectiveFrom) {
  return createSalaryHistoryEntry({
    effectiveFrom,
    monthlyNetSalary: settings?.monthlyNetSalary ?? 0,
    salaryPaysPreset: settings?.salaryPaysPreset ?? '12',
    numPagas: settings?.numPagas ?? 12,
  });
}

export function enrichSalaryHistoryEntry(patch, current = {}) {
  const merged = { ...current, ...patch };
  const effective = computeMonthlyNetSalaryEffective({
    monthlyNetSalary: merged.monthlyNetSalary,
    salaryPaysPreset: merged.salaryPaysPreset,
    numPagas: merged.numPagas,
  });
  return { ...merged, monthlyNetSalaryEffective: effective };
}

function monthKeyFromDate(date) {
  if (!date) return getCurrentMonthKey();
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

/**
 * Salario mensual efectivo para un mes de la proyección.
 * Tramos en historial (effectiveFrom) + salario vigente en settings como base.
 */
export function resolveMonthlySalaryForDate(settings, salaryHistory, date) {
  const key = monthKeyFromDate(date);
  let resolved = computeMonthlyNetSalaryEffective(settings ?? {});

  const sorted = [...(salaryHistory ?? [])].sort((a, b) =>
    a.effectiveFrom.localeCompare(b.effectiveFrom),
  );

  for (const entry of sorted) {
    if (entry.effectiveFrom <= key) {
      resolved =
        entry.monthlyNetSalaryEffective ??
        computeMonthlyNetSalaryEffective(entry);
    }
  }

  return resolved;
}
