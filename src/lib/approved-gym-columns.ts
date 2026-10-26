/** Approved Gyms table columns, in the required display order. */
export const approvedGymColumns = ['#', 'Gym Name', 'Email', 'Contact', 'Plan', 'Monthly Price', 'Annual Price', 'Status', 'Actions'];

/** Minimum readable width per column so contact details stay legible and prices/status/actions stay aligned. */
export const approvedGymColumnWidths = ['3rem', '15rem', '18rem', '11rem', '9rem', '8.5rem', '8.5rem', '8rem', '19rem'];

/** Below this width the table scrolls horizontally instead of hiding or shrinking columns. */
export const approvedGymTableMinWidth = 1240;

/** Sums the monthly and annual prices of every listed gym; missing prices count as zero. */
export function approvedGymTotals(rows: { plan?: string | null }[]) {
  let monthlyPrice = 0;
  let annualPrice = 0;
  for (const row of rows) {
    const prices = gymPrices({ plan: row.plan ?? '' });
    monthlyPrice += prices.monthlyPrice || 0;
    annualPrice += prices.annualPrice || 0;
  }
  return { monthlyPrice, annualPrice };
}
