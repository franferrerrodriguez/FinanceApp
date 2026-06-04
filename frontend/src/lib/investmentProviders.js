/** Proveedores predefinidos (Balance, aportaciones, activos). */
export const INVESTMENT_PROVIDER_IDS = [
  'indexa',
  'myinvestor',
  'tradeRepublic',
  'revolut',
  'openbank',
  'pensionPlan',
  'other',
];

const LEGACY_PROVIDER_LABELS = {
  'Indexa Capital': 'indexa',
  Myinvestor: 'myinvestor',
  'Trade Republic': 'tradeRepublic',
  Revolut: 'revolut',
  Openbank: 'openbank',
  'Plan de pensiones': 'pensionPlan',
  Otro: 'other',
};

export function normalizeProviderId(idOrLabel) {
  if (INVESTMENT_PROVIDER_IDS.includes(idOrLabel)) return idOrLabel;
  return LEGACY_PROVIDER_LABELS[idOrLabel] ?? idOrLabel;
}
