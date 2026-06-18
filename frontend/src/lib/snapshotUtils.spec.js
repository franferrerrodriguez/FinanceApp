import { describe, it, expect } from 'vitest';
import {
  getSnapshotMonthKey,
  getSnapshotAssetId,
  getSnapshotLiabilityId,
  isAssetSnapshot,
  isLiabilitySnapshot,
  countSnapshotMonthsForAsset,
  countSnapshotMonthsForLiability,
  groupSnapshotsByMonth,
  getMonthEndDate,
  getTodayIsoDate,
} from './snapshotUtils.js';

const assetSnap = { assetId: 'a1', snapshotDate: '2025-06-30', value: 10000 };
const liabilitySnap = { liabilityId: 'l1', snapshotDate: '2025-05-31', value: 80000 };
const legacySnap = { asset_id: 'a2', snapshot_date: '2025-04-30', value: 5000 };

describe('getSnapshotMonthKey', () => {
  it('extracts YYYY-MM from snapshotDate', () => {
    expect(getSnapshotMonthKey(assetSnap)).toBe('2025-06');
  });

  it('extracts from snapshot_date (legacy)', () => {
    expect(getSnapshotMonthKey(legacySnap)).toBe('2025-04');
  });

  it('returns empty string for null snap', () => {
    expect(getSnapshotMonthKey(null)).toBe('');
  });

  it('handles date field as fallback', () => {
    expect(getSnapshotMonthKey({ date: '2025-03-31' })).toBe('2025-03');
  });
});

describe('getSnapshotAssetId', () => {
  it('reads assetId field', () => {
    expect(getSnapshotAssetId(assetSnap)).toBe('a1');
  });

  it('reads asset_id (legacy)', () => {
    expect(getSnapshotAssetId(legacySnap)).toBe('a2');
  });

  it('returns null for liability snapshot', () => {
    expect(getSnapshotAssetId(liabilitySnap)).toBeNull();
  });

  it('returns null for null input', () => {
    expect(getSnapshotAssetId(null)).toBeNull();
  });
});

describe('getSnapshotLiabilityId', () => {
  it('reads liabilityId field', () => {
    expect(getSnapshotLiabilityId(liabilitySnap)).toBe('l1');
  });

  it('returns null for asset snapshot', () => {
    expect(getSnapshotLiabilityId(assetSnap)).toBeNull();
  });
});

describe('isAssetSnapshot / isLiabilitySnapshot', () => {
  it('correctly identifies asset snapshot', () => {
    expect(isAssetSnapshot(assetSnap)).toBe(true);
    expect(isLiabilitySnapshot(assetSnap)).toBe(false);
  });

  it('correctly identifies liability snapshot', () => {
    expect(isLiabilitySnapshot(liabilitySnap)).toBe(true);
    expect(isAssetSnapshot(liabilitySnap)).toBe(false);
  });
});

describe('groupSnapshotsByMonth', () => {
  it('groups by month key', () => {
    const snaps = [
      { assetId: 'a1', snapshotDate: '2025-06-30', value: 1000 },
      { assetId: 'a2', snapshotDate: '2025-06-30', value: 2000 },
      { assetId: 'a1', snapshotDate: '2025-05-31', value: 900 },
    ];
    const grouped = groupSnapshotsByMonth(snaps);
    expect(Object.keys(grouped)).toHaveLength(2);
    expect(grouped['2025-06']).toHaveLength(2);
    expect(grouped['2025-05']).toHaveLength(1);
  });

  it('returns empty object for empty array', () => {
    expect(groupSnapshotsByMonth([])).toEqual({});
  });

  it('skips snapshots without a date', () => {
    const snaps = [{ value: 1000 }];
    expect(groupSnapshotsByMonth(snaps)).toEqual({});
  });
});

describe('countSnapshotMonthsForAsset', () => {
  it('counts unique months for an asset', () => {
    const snaps = [
      { assetId: 'a1', snapshotDate: '2025-06-30', value: 1000 },
      { assetId: 'a1', snapshotDate: '2025-05-31', value: 900 },
      { assetId: 'a2', snapshotDate: '2025-06-30', value: 500 },
    ];
    expect(countSnapshotMonthsForAsset(snaps, 'a1')).toBe(2);
    expect(countSnapshotMonthsForAsset(snaps, 'a2')).toBe(1);
  });

  it('returns 0 for unknown asset', () => {
    expect(countSnapshotMonthsForAsset([], 'unknown')).toBe(0);
  });
});

describe('countSnapshotMonthsForLiability', () => {
  it('counts unique months for a liability', () => {
    const snaps = [
      { liabilityId: 'l1', snapshotDate: '2025-06-30', value: 80000 },
      { liabilityId: 'l1', snapshotDate: '2025-05-31', value: 80500 },
    ];
    expect(countSnapshotMonthsForLiability(snaps, 'l1')).toBe(2);
  });
});

describe('getMonthEndDate', () => {
  it('returns last day of the month', () => {
    expect(getMonthEndDate('2025-06')).toBe('2025-06-30');
    expect(getMonthEndDate('2025-02')).toBe('2025-02-28');
    expect(getMonthEndDate('2024-02')).toBe('2024-02-29'); // leap year
    expect(getMonthEndDate('2025-01')).toBe('2025-01-31');
  });

  it('returns input as-is for invalid key', () => {
    expect(getMonthEndDate('invalid')).toBe('invalid');
  });
});

describe('getTodayIsoDate', () => {
  it('returns YYYY-MM-DD format', () => {
    const result = getTodayIsoDate(new Date(2025, 5, 15));
    expect(result).toBe('2025-06-15');
  });

  it('pads month and day with leading zeros', () => {
    const result = getTodayIsoDate(new Date(2025, 0, 5));
    expect(result).toBe('2025-01-05');
  });
});
