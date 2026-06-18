import { describe, it, expect } from 'vitest';
import {
  formatMoney,
  formatMoneyCompact,
  formatPercent,
  formatRatePercent,
  pctToDisplay,
  displayToPct,
  formatRateInputValue,
} from './formatters.js';

describe('formatMoney', () => {
  it('always includes the € symbol', () => {
    expect(formatMoney(1234.56)).toContain('€');
    expect(formatMoney(0)).toContain('€');
  });

  it('formats zero', () => {
    expect(formatMoney(0)).toContain('0');
  });

  it('handles null gracefully (treats as 0)', () => {
    expect(formatMoney(null)).toBe(formatMoney(0));
  });

  it('formats negative amounts with a minus sign', () => {
    expect(formatMoney(-500)).toContain('-');
  });

  it('includes the numeric value in the output', () => {
    const result = formatMoney(1234.56);
    expect(result).toMatch(/1.?234/);
  });

  it('always formats 2 decimal digits', () => {
    const result = formatMoney(100);
    expect(result).toMatch(/[,.]00/);
  });
});

describe('formatMoneyCompact', () => {
  it('formats without decimals', () => {
    const result = formatMoneyCompact(1500.75);
    expect(result).not.toMatch(/,\d{2}/);
    expect(result).toContain('€');
  });

  it('handles null (treats as 0)', () => {
    expect(formatMoneyCompact(null)).toBe(formatMoneyCompact(0));
  });
});

describe('formatPercent', () => {
  it('formats 0.5 as 50%', () => {
    const result = formatPercent(0.5);
    expect(result).toContain('50');
    expect(result).toContain('%');
  });

  it('formats 0 correctly', () => {
    const result = formatPercent(0);
    expect(result).toContain('0');
  });

  it('includes 1 decimal place', () => {
    const result = formatPercent(0.125);
    expect(result).toMatch(/12[,.]5/);
  });

  it('handles null (treats as 0)', () => {
    expect(formatPercent(null)).toBe(formatPercent(0));
  });
});

describe('formatRatePercent', () => {
  it('formats TIN rate with 2 decimal places', () => {
    const result = formatRatePercent(0.025);
    expect(result).toMatch(/2[,.]50/);
  });

  it('handles null as 0', () => {
    expect(formatRatePercent(null)).toBe(formatRatePercent(0));
  });
});

describe('pctToDisplay', () => {
  it('converts decimal 0.0225 to display 2.25', () => {
    expect(pctToDisplay(0.0225)).toBe(2.25);
  });

  it('converts 0 to 0', () => {
    expect(pctToDisplay(0)).toBe(0);
  });

  it('converts 1.0 to 100', () => {
    expect(pctToDisplay(1.0)).toBe(100);
  });

  it('handles null as 0', () => {
    expect(pctToDisplay(null)).toBe(0);
  });

  it('rounds to 2 decimal places', () => {
    expect(pctToDisplay(0.03333)).toBe(3.33);
  });
});

describe('displayToPct', () => {
  it('converts "2.25" to 0.0225', () => {
    expect(displayToPct('2.25')).toBeCloseTo(0.0225, 6);
  });

  it('converts "2,25" (Spanish comma) to 0.0225', () => {
    expect(displayToPct('2,25')).toBeCloseTo(0.0225, 6);
  });

  it('returns 0 for empty string', () => {
    expect(displayToPct('')).toBe(0);
  });

  it('returns 0 for non-numeric input', () => {
    expect(displayToPct('abc')).toBe(0);
  });

  it('pctToDisplay and displayToPct are inverse operations', () => {
    const original = 0.0375;
    expect(displayToPct(pctToDisplay(original))).toBeCloseTo(original, 4);
  });
});

describe('formatRateInputValue', () => {
  it('converts decimal rate to display string', () => {
    const result = formatRateInputValue(0.025);
    expect(result).toMatch(/2[,.]5/);
  });

  it('returns empty string for null', () => {
    expect(formatRateInputValue(null)).toBe('');
  });

  it('returns empty string for non-finite', () => {
    expect(formatRateInputValue(NaN)).toBe('');
  });

  it('formats 0 correctly', () => {
    const result = formatRateInputValue(0);
    expect(result).toBe('0');
  });
});
