import { describe, expect, it } from 'vitest';
import { approvedGymColumns, approvedGymTotals } from '@/lib/approved-gym-columns';

describe('Approved Gyms numbering and price totals', () => {
  it('keeps # as the first column followed by the required order', () => {
    expect(approvedGymColumns).toEqual(['#', 'Gym Name', 'Email', 'Contact', 'Plan', 'Monthly Price', 'Annual Price', 'Status', 'Notes', 'Actions']);
  });

  it('sums monthly and annual prices across listed gyms, treating missing prices as zero', () => {
    // Legacy catalog: Basic 800 over 1 month, Premium 2100 over 3 months.
    const totals = approvedGymTotals([{ plan: 'Basic' }, { plan: 'Premium' }, {}]);
    expect(totals.monthlyPrice).toBeCloseTo(800 + 700);
    expect(totals.annualPrice).toBeCloseTo(9600 + 8400);
  });

  it('returns zero totals when no gyms are listed', () => {
    expect(approvedGymTotals([])).toEqual({ monthlyPrice: 0, annualPrice: 0 });
  });
});
