/** Payroll: base pay and number of pays → uniform effective monthly salary. */

export function resolveNumPagas(settings) {
  const preset = settings?.salaryPaysPreset ?? '12';
  if (preset === '14') return 14;
  if (preset === 'other') {
    const n = Number(settings?.numPagas);
    if (Number.isFinite(n) && n >= 1) return Math.min(24, Math.round(n));
    return 12;
  }
  return 12;
}

/** (pay × num_pays) / 12 — used in dashboard, projection, and cashflow. */
export function computeMonthlyNetSalaryEffective(settings) {
  const paga = Math.max(0, settings?.monthlyNetSalary ?? 0);
  const numPagas = resolveNumPagas(settings);
  return Math.round(((paga * numPagas) / 12) * 100) / 100;
}

/** Effective monthly payroll income (explicit alias). */
export function getEffectiveMonthlySalary(settings) {
  if (settings?.monthlyNetSalaryEffective != null) {
    return settings.monthlyNetSalaryEffective;
  }
  return computeMonthlyNetSalaryEffective(settings);
}

export function enrichSettingsWithSalary(patch, currentSettings = {}) {
  const merged = { ...currentSettings, ...patch };
  return {
    ...merged,
    monthlyNetSalaryEffective: computeMonthlyNetSalaryEffective(merged),
  };
}
