// Pure finance helpers. No UI or data imports, so this file can move to the real product as-is.

export type Loan = {
  principal: number;
  annualRate: number; // e.g. 0.07 for 7%
  years: number;
  startMonth: string; // "YYYY-MM", month of the first payment
};

/** Fixed monthly payment for a reducing-balance loan (same as Excel's PMT). */
export function monthlyPayment(loan: Loan): number {
  const r = loan.annualRate / 12;
  const n = loan.years * 12;
  if (r === 0) return loan.principal / n;
  return (loan.principal * r) / (1 - Math.pow(1 + r, -n));
}

export function monthsBetween(fromMonth: string, toMonth: string): number {
  const [fy, fm] = fromMonth.split("-").map(Number);
  const [ty, tm] = toMonth.split("-").map(Number);
  return (ty - fy) * 12 + (tm - fm);
}

/**
 * Splits the payment for a given month into interest (an expense)
 * and principal (equity you keep). Returns zeros outside the loan term.
 */
export function loanSplit(loan: Loan, month: string) {
  const index = monthsBetween(loan.startMonth, month); // 0 = first payment
  const n = loan.years * 12;
  if (index < 0 || index >= n) return { payment: 0, interest: 0, principal: 0, balance: 0 };
  const r = loan.annualRate / 12;
  const pay = monthlyPayment(loan);
  // Balance before this payment, closed form.
  const growth = Math.pow(1 + r, index);
  const balanceBefore = r === 0 ? loan.principal - pay * index : loan.principal * growth - (pay * (growth - 1)) / r;
  const interest = balanceBefore * r;
  const principal = pay - interest;
  return { payment: pay, interest, principal, balance: balanceBefore - principal };
}

/**
 * Booked nights needed per month to cover all monthly costs.
 * fixedMonthly: costs that don't depend on bookings (dues, internet, full loan payment...)
 * contributionPerNight: average nightly payout minus costs that scale with each night.
 */
export function breakEvenNights(fixedMonthly: number, contributionPerNight: number): number {
  if (contributionPerNight <= 0) return Infinity;
  return Math.ceil(fixedMonthly / contributionPerNight);
}

export function sum(values: number[]): number {
  return values.reduce((a, b) => a + b, 0);
}
