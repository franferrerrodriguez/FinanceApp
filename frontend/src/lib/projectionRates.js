/** Annual rates used in projection (funds, pensions, etc.). */

export function getProjectionAnnualRate(settings) {
  if (!settings) return 0.04;
  if (settings.useRealReturn) {
    return settings.indexFundRealReturn ?? 0.04;
  }
  return settings.indexFundNominalReturn ?? 0.06;
}
