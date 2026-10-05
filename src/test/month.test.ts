import { describe, it, expect } from 'vitest';
import { getCurrentMonthDate } from '@/lib/month';

describe('KST month calculation', () => {
  it('returns the first day of the current month in Korea Standard Time', () => {
    expect(getCurrentMonthDate(new Date('2026-10-03T15:00:00Z'))).toBe('2026-10-01');
    expect(getCurrentMonthDate(new Date('2026-10-31T14:59:59Z'))).toBe('2026-10-01');
    expect(getCurrentMonthDate(new Date('2026-10-31T15:00:01Z'))).toBe('2026-11-01');
    expect(getCurrentMonthDate(new Date('2026-12-25T00:00:00Z'))).toBe('2026-12-01');
  });
});
