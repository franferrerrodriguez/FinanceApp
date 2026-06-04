/** @deprecated Import from cashflowHistory.js */
export {
  getCurrentMonthKey,
  createCashflowEntry as createSalaryHistoryEntry,
  createCashflowEntryFromSettings as createSalaryHistoryEntryFromSettings,
  enrichCashflowEntry as enrichSalaryHistoryEntry,
  getCashflowSegmentForMonthKey as getSalarySegmentForMonthKey,
  getCurrentCashflowSegment as getCurrentSalarySegment,
  isCurrentCashflowSegment as isCurrentSalarySegment,
  syncSettingsFromCashflowHistory as syncSettingsFromSalaryHistory,
  upsertCurrentMonthCashflowTramo as upsertCurrentMonthSalaryTramo,
  resolveMonthlySalaryForDate,
} from './cashflowHistory.js';
